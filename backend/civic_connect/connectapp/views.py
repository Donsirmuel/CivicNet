from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
import logging
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from .models import UserProfile, Issue, Post, Comment, Message, Notification, BookmarkedItem, StatusHistory, OfficialJurisdiction, VerificationRequest
from .serializers import (
    UserSerializer, UserProfileSerializer, IssueSerializer, PostSerializer,
    CommentSerializer, MessageSerializer, NotificationSerializer, BookmarkedItemSerializer, StatusHistorySerializer, OfficialJurisdictionSerializer,
    VerificationRequestSerializer
)


class GoogleAuthView(APIView):
    """Exchange a Google Sign-In ID token for a DRF auth token.

    Frontend sends ``{"id_token": "<Google credential>"}`` and receives
    ``{"token": "<drf-token>", "user": {...}}`` — the same shape as the
    normal login flow, so the frontend needs no changes.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.data.get('id_token')
        if not raw_token:
            return Response(
                {'error': 'id_token is required'}, status=status.HTTP_400_BAD_REQUEST
            )

        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {'error': 'Google sign-in is not configured on this server'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            claims = google_id_token.verify_oauth2_token(
                raw_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response(
                {'error': 'Invalid Google ID token'}, status=status.HTTP_400_BAD_REQUEST
            )

        if not claims.get('email'):
            return Response(
                {'error': 'Google account has no email address'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if claims.get('email_verified') is False:
            return Response(
                {'error': 'Google email is not verified'},
                status=status.HTTP_403_FORBIDDEN,
            )

        email = claims['email']
        existing = User.objects.filter(email=email).first()
        if existing is not None and existing.has_usable_password():
            return Response(
                {'error': 'An account with this email already uses a password. Sign in with your password instead.'},
                status=status.HTTP_409_CONFLICT,
            )
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': self._unique_username(email, claims.get('sub', '')),
                'first_name': claims.get('given_name', ''),
                'last_name': claims.get('family_name', ''),
            },
        )
        if created:
            user.set_unusable_password()
            user.save()

        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'citizen',
                'avatar_url': claims.get('picture', ''),
            },
        )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})

    @staticmethod
    def _unique_username(email, sub):
        base = email.split('@')[0][:140] or f'google-{sub[:12]}'
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f'{base[:140]}-{suffix}'
        return username


logger = logging.getLogger(__name__)


class PasswordResetRequestView(APIView):
    """Request a password-reset link. Always returns 200 so callers
    cannot enumerate which email addresses have accounts."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if user is not None:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_path = f'/forgot-password?uid={uid}&token={token}'
                logger.info('Password reset requested for user %s: %s', user.pk, reset_path)
        return Response(
            {'detail': 'If an account exists for that email, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Set a new password with a valid reset uid/token pair."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid') or ''
        token = request.data.get('token') or ''
        new_password = request.data.get('new_password') or ''
        if not uid or not token or not new_password:
            return Response(
                {'error': 'uid, token and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response(
                {'error': 'Choose a password of at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'This reset link is invalid or has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'This reset link is invalid or has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Your password has been reset.'}, status=status.HTTP_200_OK)


def _notify(user, notification_type, title, message, actor=None, post=None, issue=None):
    """Create a notification unless it would notify the actor themselves."""
    if user is None:
        return
    if actor is not None and user.pk == actor.pk:
        return
    Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        actor=actor,
        post=post,
        issue=issue,
    )


class IsAssignedOfficialOrReadOnly(permissions.BasePermission):
    """
    Permission to allow officials to update only issues assigned to them.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the official assigned to the issue
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user

        return False


def _is_verified_official(user):
    """True when the user holds a verified official profile (or is staff)."""
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    profile = getattr(user, 'profile', None)
    return bool(profile and profile.role == 'official' and profile.is_verified)


class IsVerifiedOfficial(permissions.BasePermission):
    """Only verified officials (or staff) may change issue state/assignment."""

    message = 'Only a verified official can perform this action.'

    def has_permission(self, request, view):
        return _is_verified_official(request.user)


class IsSelfOrAdminOrReadOnly(permissions.BasePermission):
    """Users may only edit or delete their own account; staff may edit any."""

    message = 'You can only change your own account.'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (obj == user or user.is_staff))


class IsCreatorOrAssignedOfficialOrReadOnly(permissions.BasePermission):
    """Issue edits: the citizen who reported it, or the official handling it."""

    message = 'Only the reporter or the assigned official can change this issue.'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        return obj.created_by == user or obj.assigned_to == user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object edits (posts, comments): the author only."""

    message = 'You can only change your own content.'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        author = (
            getattr(obj, 'author', None)
            or getattr(obj, 'sender', None)
            or getattr(obj, 'user', None)
        )
        return author == user


class IsStaffOrReadOnly(permissions.BasePermission):
    """Jurisdiction records are managed by staff; everyone may read."""

    message = 'Only staff can manage jurisdiction records.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)


class AllowRegistration(permissions.BasePermission):
    """
    Permission to allow unauthenticated users to create accounts (register).
    Authenticated users can do other operations.
    """

    def has_permission(self, request, view):
        # Allow unauthenticated users to create (register)
        if request.method == 'POST' and view.action == 'create':
            return True

        # Allow authenticated users for other operations
        return request.user and request.user.is_authenticated


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowRegistration, IsSelfOrAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name']

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """UserSerializer.create() handles password hashing"""
        serializer.save()

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get issue resolution metrics for an official"""
        from django.db.models import Count

        user = self.get_object()

        # Get all issues assigned to this official
        assigned_issues = Issue.objects.filter(assigned_to=user)

        total = assigned_issues.count()
        by_status = {
            row['status']: row['n']
            for row in assigned_issues.values('status').annotate(n=Count('id'))
        }
        by_category = {
            row['category']: row['n']
            for row in assigned_issues.values('category').annotate(n=Count('id'))
        }

        metrics = {
            'total_assigned': total,
            'reported': by_status.get('reported', 0),
            'under_review': by_status.get('under_review', 0),
            'in_progress': by_status.get('in_progress', 0),
            'resolved': by_status.get('resolved', 0),
            'closed': by_status.get('closed', 0),
            'resolution_rate': 0,
            'category_breakdown': by_category,
        }

        # Calculate resolution rate
        if total > 0:
            resolved_count = by_status.get('resolved', 0) + by_status.get('closed', 0)
            metrics['resolution_rate'] = round((resolved_count / total) * 100, 1)

        return Response(metrics)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'likes']
    ordering = ['-created_at']
    search_fields = ['content']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        Post.objects.filter(pk=post.pk).update(likes=F('likes') + 1)
        post.refresh_from_db()
        _notify(
            post.author,
            'like',
            'Someone liked your post',
            f'{request.user.username} liked your post.',
            actor=request.user,
            post=post,
        )
        return Response({'status': 'post liked', 'likes': post.likes})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlike(self, request, pk=None):
        post = self.get_object()
        Post.objects.filter(pk=post.pk, likes__gt=0).update(likes=F('likes') - 1)
        post.refresh_from_db()
        return Response({'status': 'post unliked', 'likes': post.likes})


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrAssignedOfficialOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'priority', 'upvotes']
    ordering = ['-created_at']
    search_fields = ['title', 'description', 'category', 'state']

    # Allowed status moves. Staff may move anywhere.
    STATUS_TRANSITIONS = {
        'reported': {'under_review', 'closed'},
        'under_review': {'reported', 'in_progress', 'closed'},
        'in_progress': {'under_review', 'resolved'},
        'resolved': {'in_progress', 'closed'},
        'closed': set(),
    }

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upvote(self, request, pk=None):
        issue = self.get_object()
        Issue.objects.filter(pk=issue.pk).update(upvotes=F('upvotes') + 1)
        issue.refresh_from_db()
        _notify(
            issue.created_by,
            'like',
            'Someone upvoted your issue',
            f'{request.user.username} upvoted "{issue.title}".',
            actor=request.user,
            issue=issue,
        )
        return Response({'status': 'issue upvoted', 'upvotes': issue.upvotes})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def downvote(self, request, pk=None):
        issue = self.get_object()
        Issue.objects.filter(pk=issue.pk).update(downvotes=F('downvotes') + 1)
        issue.refresh_from_db()
        return Response({'status': 'issue downvoted', 'downvotes': issue.downvotes})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlike(self, request, pk=None):
        issue = self.get_object()
        Issue.objects.filter(pk=issue.pk, upvotes__gt=0).update(upvotes=F('upvotes') - 1)
        issue.refresh_from_db()
        return Response({'status': 'issue unliked', 'upvotes': issue.upvotes})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        issue = self.get_object()
        Issue.objects.filter(pk=issue.pk).update(upvotes=F('upvotes') + 1)
        issue.refresh_from_db()
        _notify(
            issue.created_by,
            'like',
            'Someone liked your issue',
            f'{request.user.username} liked "{issue.title}".',
            actor=request.user,
            issue=issue,
        )
        return Response({'status': 'issue liked', 'upvotes': issue.upvotes})

    @action(detail=True, methods=['post'], permission_classes=[IsVerifiedOfficial])
    def update_status(self, request, pk=None):
        issue = self.get_object()
        new_status = request.data.get('status')
        note = request.data.get('note', '')

        if not new_status:
            return Response({'error': 'Choose a new status for this report'}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = {choice for choice, _ in Issue.STATUS_CHOICES}
        if new_status not in valid_statuses:
            return Response({'error': 'That status does not exist'}, status=status.HTTP_400_BAD_REQUEST)

        allowed = self.STATUS_TRANSITIONS.get(issue.status, set())
        if new_status != issue.status and new_status not in allowed and not request.user.is_staff:
            return Response(
                {'error': f'This report cannot move from {issue.status.replace("_", " ")} to {new_status.replace("_", " ")}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update issue status first, then record history
        issue.status = new_status
        issue.save()
        StatusHistory.objects.create(
            issue=issue,
            status=new_status,
            updated_by=request.user,
            note=note
        )

        _notify(
            issue.created_by,
            'comment',
            f'Your issue is now {new_status.replace("_", " ")}',
            f'{request.user.username} updated "{issue.title}".'
            + (f' Note: {note}' if note else ''),
            actor=request.user,
            issue=issue,
        )

        return Response({'status': 'issue status updated', 'new_status': new_status})

    @action(detail=True, methods=['post'], permission_classes=[IsVerifiedOfficial])
    def assign(self, request, pk=None):
        issue = self.get_object()
        assigned_to_id = request.data.get('assigned_to_id')
        if assigned_to_id:
            assigned_to = get_object_or_404(User, id=assigned_to_id)
            if not _is_verified_official(assigned_to):
                return Response(
                    {'error': 'Only a verified office can take this report'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            issue.assigned_to = assigned_to
            issue.save()
            _notify(
                assigned_to,
                'mention',
                'An issue was assigned to you',
                f'{request.user.username} assigned "{issue.title}" to you.',
                actor=request.user,
                issue=issue,
            )
            return Response({'status': 'issue assigned', 'assigned_to': assigned_to.username})
        return Response({'error': 'Choose an office to handle this report'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsVerifiedOfficial])
    def assign_to_me(self, request, pk=None):
        issue = self.get_object()
        issue.assigned_to = request.user
        issue.status = 'under_review'
        issue.save()
        StatusHistory.objects.create(
            issue=issue,
            status='under_review',
            updated_by=request.user,
            note='Official picked up this issue.',
        )
        _notify(
            issue.created_by,
            'mention',
            'An official picked up your issue',
            f'{request.user.username} is now reviewing "{issue.title}".',
            actor=request.user,
            issue=issue,
        )
        return Response({'status': 'issue assigned to you', 'assigned_to': request.user.username})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard(self, request):
        # Get issues assigned to the current user
        issues = Issue.objects.filter(assigned_to=request.user).order_by('-created_at')

        # Apply optional filters
        status_filter = request.GET.get('status')
        category_filter = request.GET.get('category')

        if status_filter:
            issues = issues.filter(status=status_filter)
        if category_filter:
            issues = issues.filter(category=category_filter)

        serializer = self.get_serializer(issues, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsVerifiedOfficial])
    def escalate(self, request, pk=None):
        from django.utils import timezone
        issue = self.get_object()
        if issue.status in ('resolved', 'closed'):
            return Response(
                {'error': 'Resolved or closed issues cannot be escalated.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order = Issue.ESCALATION_ORDER
        idx = order.index(issue.escalation_level) if issue.escalation_level in order else 0
        new_level = order[min(idx + 1, len(order) - 1)]
        issue.escalation_level = new_level
        issue.escalated_at = timezone.now()
        issue.save(update_fields=['escalation_level', 'escalated_at', 'updated_at'])
        StatusHistory.objects.create(
            issue=issue,
            status=issue.status,
            updated_by=request.user,
            note=f"Escalated to {new_level}",
        )
        _notify(
            issue.created_by,
            'mention',
            f'Your issue was escalated to {new_level}',
            f'{request.user.username} escalated "{issue.title}" to {new_level} level.',
            actor=request.user,
            issue=issue,
        )
        return Response(
            {'status': 'issue escalated', 'escalation_level': new_level},
            status=status.HTTP_200_OK,
        )


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        if comment.post_id:
            Post.objects.filter(pk=comment.post_id).update(comments=F('comments') + 1)
        if comment.issue_id:
            Issue.objects.filter(pk=comment.issue_id).update(comment_count=F('comment_count') + 1)
        actor = self.request.user
        if comment.post_id:
            _notify(
                comment.post.author,
                'comment',
                'Someone commented on your post',
                f'{actor.username} commented on your post.',
                actor=actor,
                post=comment.post,
            )
        if comment.issue_id:
            _notify(
                comment.issue.created_by,
                'comment',
                'Someone commented on your issue',
                f'{actor.username} commented on "{comment.issue.title}".',
                actor=actor,
                issue=comment.issue,
            )
        if comment.parent_id:
            _notify(
                comment.parent.author,
                'comment',
                'Someone replied to your comment',
                f'{actor.username} replied to your comment.',
                actor=actor,
                post=comment.post,
                issue=comment.issue,
            )

    def get_queryset(self):
        queryset = Comment.objects.all()
        post_id = self.request.GET.get('post_id')
        issue_id = self.request.GET.get('issue_id')

        if post_id:
            queryset = queryset.filter(post_id=post_id)
        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)

        return queryset


class StatusHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StatusHistory.objects.all()
    serializer_class = StatusHistorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = StatusHistory.objects.all()
        issue_id = self.request.GET.get('issue_id')

        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)

        return queryset


class OfficialJurisdictionViewSet(viewsets.ModelViewSet):
    queryset = OfficialJurisdiction.objects.all()
    serializer_class = OfficialJurisdictionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsStaffOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(official=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        try:
            jurisdiction = OfficialJurisdiction.objects.get(official=request.user)
            serializer = self.get_serializer(jurisdiction)
            return Response(serializer.data)
        except OfficialJurisdiction.DoesNotExist:
            return Response({'error': 'We could not find your office area'}, status=status.HTTP_404_NOT_FOUND)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        if serializer.validated_data['receiver'] == self.request.user:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'receiver_id': 'You cannot message yourself.'})
        message = serializer.save(sender=self.request.user)
        _notify(
            message.receiver,
            'message',
            'You have a new message',
            f'{self.request.user.username} sent you a message.',
            actor=self.request.user,
        )

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(sender=user) | Message.objects.filter(receiver=user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def inbox(self, request):
        messages = Message.objects.filter(receiver=request.user).order_by('-created_at')
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def sent(self, request):
        messages = Message.objects.filter(sender=request.user).order_by('-created_at')
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_as_read(self, request, pk=None):
        message = self.get_object()
        if message.receiver == request.user:
            message.is_read = True
            message.save()
            return Response({'status': 'message marked as read'})
        return Response({'error': 'You cannot do that'}, status=status.HTTP_403_FORBIDDEN)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def unread(self, request):
        notifications = Notification.objects.filter(user=request.user, is_read=False).order_by('-created_at')
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})


class BookmarkedItemViewSet(viewsets.ModelViewSet):
    queryset = BookmarkedItem.objects.all()
    serializer_class = BookmarkedItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return BookmarkedItem.objects.filter(user=self.request.user)


class VerificationRequestViewSet(viewsets.ModelViewSet):
    queryset = VerificationRequest.objects.all()
    serializer_class = VerificationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return VerificationRequest.objects.all()
        return VerificationRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def review(self, request, pk=None):
        verification = self.get_object()
        if verification.status != 'pending':
            return Response(
                {'error': 'This request has already been reviewed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        approve = request.data.get('approve')
        if approve is True or (isinstance(approve, str) and approve.lower() in ('true', '1')):
            verification.status = 'approved'
            verification.save(update_fields=['status'])
            profile, _ = UserProfile.objects.get_or_create(user=verification.user)
            profile.role = 'official'
            profile.is_verified = True
            profile.save(update_fields=['role', 'is_verified', 'updated_at'])
        else:
            verification.status = 'rejected'
            verification.save(update_fields=['status'])
        return Response(
            {'status': f'request {verification.status}', 'id': verification.id},
            status=status.HTTP_200_OK,
        )


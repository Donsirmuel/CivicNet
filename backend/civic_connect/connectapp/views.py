from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.conf import settings
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from .models import UserProfile, Issue, Post, Comment, Message, Notification, BookmarkedItem, StatusHistory, OfficialJurisdiction
from .serializers import (
    UserSerializer, UserProfileSerializer, IssueSerializer, PostSerializer,
    CommentSerializer, MessageSerializer, NotificationSerializer, BookmarkedItemSerializer, StatusHistorySerializer, OfficialJurisdictionSerializer
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

        try:
            claims = google_id_token.verify_oauth2_token(
                raw_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID or None,
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
    permission_classes = [AllowRegistration]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

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
        user = self.get_object()

        # Get all issues assigned to this official
        assigned_issues = Issue.objects.filter(assigned_to=user)

        metrics = {
            'total_assigned': assigned_issues.count(),
            'reported': assigned_issues.filter(status='reported').count(),
            'under_review': assigned_issues.filter(status='under_review').count(),
            'in_progress': assigned_issues.filter(status='in_progress').count(),
            'resolved': assigned_issues.filter(status='resolved').count(),
            'closed': assigned_issues.filter(status='closed').count(),
            'resolution_rate': 0,
            'category_breakdown': {}
        }

        # Calculate resolution rate
        if metrics['total_assigned'] > 0:
            resolved_count = assigned_issues.filter(status__in=['resolved', 'closed']).count()
            metrics['resolution_rate'] = round((resolved_count / metrics['total_assigned']) * 100, 1)

        # Category breakdown
        for issue in assigned_issues:
            if issue.category not in metrics['category_breakdown']:
                metrics['category_breakdown'][issue.category] = 0
            metrics['category_breakdown'][issue.category] += 1

        return Response(metrics)


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'likes']
    ordering = ['-created_at']
    search_fields = ['content']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        post.likes += 1
        post.save()
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
        if post.likes > 0:
            post.likes -= 1
            post.save()
        return Response({'status': 'post unliked', 'likes': post.likes})


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAssignedOfficialOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'priority', 'upvotes']
    ordering = ['-created_at']
    search_fields = ['title', 'description', 'category', 'state']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upvote(self, request, pk=None):
        issue = self.get_object()
        issue.upvotes += 1
        issue.save()
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
        issue.downvotes += 1
        issue.save()
        return Response({'status': 'issue downvoted', 'downvotes': issue.downvotes})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        issue = self.get_object()
        issue.upvotes += 1
        issue.save()
        _notify(
            issue.created_by,
            'like',
            'Someone liked your issue',
            f'{request.user.username} liked "{issue.title}".',
            actor=request.user,
            issue=issue,
        )
        return Response({'status': 'issue liked', 'upvotes': issue.upvotes})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        issue = self.get_object()
        new_status = request.data.get('status')
        note = request.data.get('note', '')

        if not new_status:
            return Response({'error': 'status is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Create status history record
        StatusHistory.objects.create(
            issue=issue,
            status=new_status,
            updated_by=request.user,
            note=note
        )

        # Update issue status
        issue.status = new_status
        issue.save()

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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign(self, request, pk=None):
        issue = self.get_object()
        assigned_to_id = request.data.get('assigned_to_id')
        if assigned_to_id:
            assigned_to = get_object_or_404(User, id=assigned_to_id)
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
        return Response({'error': 'assigned_to_id required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_to_me(self, request, pk=None):
        issue = self.get_object()
        issue.assigned_to = request.user
        issue.status = 'under_review'
        issue.save()
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


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
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
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(official=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        try:
            jurisdiction = OfficialJurisdiction.objects.get(official=request.user)
            serializer = self.get_serializer(jurisdiction)
            return Response(serializer.data)
        except OfficialJurisdiction.DoesNotExist:
            return Response({'error': 'jurisdiction not found'}, status=status.HTTP_404_NOT_FOUND)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
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
        return Response({'error': 'not authorized'}, status=status.HTTP_403_FORBIDDEN)


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


class BookmarkedItemViewSet(viewsets.ModelViewSet):
    queryset = BookmarkedItem.objects.all()
    serializer_class = BookmarkedItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return BookmarkedItem.objects.filter(user=self.request.user)


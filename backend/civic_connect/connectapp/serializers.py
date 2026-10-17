from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Issue, Post, Comment, Message, Notification, BookmarkedItem, StatusHistory, OfficialJurisdiction, VerificationRequest


# Placeholder shown in public payloads for a report/update posted anonymously.
ANONYMOUS_AUTHOR = {'id': None, 'username': 'anonymous', 'first_name': '', 'last_name': ''}


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        read_only_fields = ['id']

    def validate_username(self, value):
        """Ensure username is unique"""
        queryset = User.objects.filter(username=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        """Override create to handle password hashing"""
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'This field is required.'})

        # Use create_user which handles password hashing
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class PublicUserSerializer(serializers.ModelSerializer):
    """Safe user view for public payloads — no email, no password.

    ``role`` and ``jurisdiction`` come from the profile so the feed can mark
    official authors and name the office a reply came from.
    """

    role = serializers.SerializerMethodField()
    jurisdiction = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'jurisdiction']
        read_only_fields = fields

    def get_role(self, obj):
        if obj.is_staff:
            return 'official'
        profile = getattr(obj, 'profile', None)
        return profile.role if profile else 'citizen'

    def get_jurisdiction(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile is None:
            return ''
        parts = [profile.ward, profile.lga, profile.state]
        return ', '.join(part for part in parts if part)


class UserProfileSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'bio', 'avatar_url', 'location', 'role', 'is_verified',
                  'state', 'lga', 'ward', 'jurisdiction_type',
                  'created_at', 'updated_at']
        # role / is_verified are granted by staff through the verification
        # flow, never by the account owner.
        read_only_fields = ['id', 'created_at', 'updated_at', 'role', 'is_verified']


class CommentSerializer(serializers.ModelSerializer):
    author = PublicUserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    post_id = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(), source='post', write_only=True, required=False,
        allow_null=True,
    )
    issue_id = serializers.PrimaryKeyRelatedField(
        queryset=Issue.objects.all(), source='issue', write_only=True, required=False,
        allow_null=True,
    )

    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'likes', 'parent', 'post_id', 'issue_id', 'replies', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'likes']

    def validate(self, attrs):
        post = attrs.get('post', getattr(self.instance, 'post', None))
        issue = attrs.get('issue', getattr(self.instance, 'issue', None))
        if bool(post) == bool(issue):
            raise serializers.ValidationError(
                'A comment must belong to exactly one post or one issue.'
            )
        parent = attrs.get('parent', getattr(self.instance, 'parent', None))
        if parent is not None:
            if parent.pk == getattr(self.instance, 'pk', None):
                raise serializers.ValidationError('A comment cannot reply to itself.')
            if (parent.post_id, parent.issue_id) != (
                post.pk if post else None,
                issue.pk if issue else None,
            ):
                raise serializers.ValidationError(
                    'A reply must belong to the same post or issue as its parent.'
                )
        content = attrs.get('content', '')
        if isinstance(content, str) and len(content) > 2000:
            raise serializers.ValidationError(
                {'content': 'Keep comments under 2000 characters.'}
            )
        return attrs

    def get_replies(self, obj):
        depth = self.context.get('comment_depth', 0)
        if depth >= 2:
            return []
        if obj.replies.all().exists():
            context = {**self.context, 'comment_depth': depth + 1}
            return CommentSerializer(obj.replies.all(), many=True, context=context).data
        return []


class StatusHistorySerializer(serializers.ModelSerializer):
    updated_by = PublicUserSerializer(read_only=True)

    class Meta:
        model = StatusHistory
        fields = ['id', 'status', 'updated_by', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class PostSerializer(serializers.ModelSerializer):
    author = PublicUserSerializer(read_only=True)
    comments_list = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'content', 'author', 'likes', 'comments', 'shares', 'image_url', 'is_pinned', 'is_anonymous', 'comments_list', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'likes', 'comments', 'shares', 'is_pinned']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_anonymous:
            data['author'] = ANONYMOUS_AUTHOR
        return data


class IssueSerializer(serializers.ModelSerializer):
    created_by = PublicUserSerializer(read_only=True)
    assigned_to = PublicUserSerializer(read_only=True)
    comments_list = CommentSerializer(many=True, read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    days_waiting = serializers.IntegerField(read_only=True)
    has_official_reply = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = ['id', 'title', 'description', 'category', 'status', 'scope', 'priority', 'state', 'lga', 'ward', 'is_anonymous', 'created_by', 'assigned_to', 'upvotes', 'downvotes', 'comment_count', 'image_url', 'comments_list', 'status_history', 'escalation_level', 'escalated_at', 'days_waiting', 'has_official_reply', 'created_at', 'updated_at']
        # status moves through update_status (writes history + notifies);
        # assignment moves through assign / assign_to_me.
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'status', 'assigned_to', 'upvotes', 'downvotes', 'comment_count', 'status_history', 'escalation_level', 'escalated_at', 'days_waiting', 'has_official_reply']

    def get_has_official_reply(self, obj):
        """True when a verified official (or staff) has written a real reply.

        Escalation rows are not replies, so they are ignored.
        """
        for h in obj.status_history.all():
            if (h.note or '').strip().lower().startswith('escalated to '):
                continue
            updater = h.updated_by
            if updater is None:
                continue
            if updater.is_staff:
                return True
            profile = getattr(updater, 'profile', None)
            if profile and profile.role == 'official' and profile.is_verified:
                return True
        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_anonymous:
            data['created_by'] = ANONYMOUS_AUTHOR
        return data


class MessageSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)
    receiver = PublicUserSerializer(read_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='receiver', write_only=True
    )

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at', 'sender']

    def validate_content(self, value):
        text = (value or '').strip()
        if not text:
            raise serializers.ValidationError('Message cannot be empty.')
        if len(text) > 2000:
            raise serializers.ValidationError('Keep messages under 2000 characters.')
        return text

    def validate(self, attrs):
        if self.instance is not None and 'receiver' in attrs:
            raise serializers.ValidationError(
                {'receiver_id': 'The receiver cannot be changed after sending.'}
            )
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)
    actor = PublicUserSerializer(read_only=True)
    actor_role = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'title', 'message', 'actor', 'actor_role', 'post', 'issue', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']

    def get_actor_role(self, obj):
        profile = getattr(getattr(obj, 'actor', None), 'profile', None)
        return getattr(profile, 'role', None)


class BookmarkedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookmarkedItem
        fields = ['id', 'user', 'item_type', 'post', 'issue', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']


class OfficialJurisdictionSerializer(serializers.ModelSerializer):
    official = PublicUserSerializer(read_only=True)

    class Meta:
        model = OfficialJurisdiction
        fields = ['id', 'official', 'state', 'lga', 'ward', 'jurisdiction_level', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VerificationRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = VerificationRequest
        fields = ['id', 'user', 'office_name', 'jurisdiction', 'state', 'lga', 'ward', 'document_url', 'status', 'created_at']
        # status changes only through the staff-only review action.
        read_only_fields = ['id', 'created_at', 'user', 'status']

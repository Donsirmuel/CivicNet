from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Issue, Post, Comment, Message, Notification, BookmarkedItem, StatusHistory, OfficialJurisdiction


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


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'bio', 'avatar_url', 'location', 'role', 'is_verified', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
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
        read_only_fields = ['id', 'created_at', 'updated_at', 'author']

    def get_replies(self, obj):
        if obj.replies.all().exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []


class StatusHistorySerializer(serializers.ModelSerializer):
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = StatusHistory
        fields = ['id', 'status', 'updated_by', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments_list = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'content', 'author', 'likes', 'comments', 'shares', 'image_url', 'is_pinned', 'comments_list', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'likes', 'comments', 'shares']


class IssueSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    comments_list = CommentSerializer(many=True, read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Issue
        fields = ['id', 'title', 'description', 'category', 'status', 'scope', 'priority', 'state', 'lga', 'ward', 'created_by', 'assigned_to', 'upvotes', 'downvotes', 'comment_count', 'image_url', 'comments_list', 'status_history', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'upvotes', 'downvotes', 'comment_count', 'status_history']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='receiver', write_only=True
    )

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at', 'sender']


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    actor = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'title', 'message', 'actor', 'post', 'issue', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']


class BookmarkedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookmarkedItem
        fields = ['id', 'user', 'item_type', 'post', 'issue', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']


class OfficialJurisdictionSerializer(serializers.ModelSerializer):
    official = UserSerializer(read_only=True)

    class Meta:
        model = OfficialJurisdiction
        fields = ['id', 'official', 'state', 'lga', 'ward', 'jurisdiction_level', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator

# User Profile Model
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('citizen', 'Citizen'),
        ('official', 'Government Official'),
    ]

    JURISDICTION_CHOICES = [
        ('ward', 'Ward'),
        ('lga', 'LGA'),
        ('state', 'State'),
        ('federal', 'Federal'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    is_verified = models.BooleanField(default=False)

    # Location fields for officials
    state = models.CharField(max_length=100, blank=True, null=True)
    lga = models.CharField(max_length=100, blank=True, null=True)
    ward = models.CharField(max_length=100, blank=True, null=True)
    jurisdiction_type = models.CharField(max_length=20, choices=JURISDICTION_CHOICES, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


# Issue Model
class Issue(models.Model):
    STATUS_CHOICES = [
        ('reported', 'Reported'),
        ('under_review', 'Under Review'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    SCOPE_CHOICES = [
        ('local', 'Local'),
        ('state', 'State'),
        ('national', 'National'),
    ]

    CATEGORY_CHOICES = [
        ('infrastructure', 'Infrastructure'),
        ('safety', 'Safety'),
        ('health', 'Health'),
        ('environment', 'Environment'),
        ('education', 'Education'),
        ('transportation', 'Transportation'),
        ('utilities', 'Utilities'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=255, validators=[MinLengthValidator(5)])
    description = models.TextField()
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reported')
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='local')
    priority = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
        default='medium'
    )

    # Location information
    state = models.CharField(max_length=100)
    lga = models.CharField(max_length=100, blank=True)
    ward = models.CharField(max_length=100, blank=True)

    # User and official who is handling it
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issues_created')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issues_assigned')

    # Engagement metrics
    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)

    image_url = models.URLField(blank=True, null=True)

    ESCALATION_CHOICES = [
        ('ward', 'Ward'),
        ('lga', 'LGA'),
        ('state', 'State'),
        ('federal', 'Federal'),
    ]
    ESCALATION_ORDER = ['ward', 'lga', 'state', 'federal']

    escalation_level = models.CharField(max_length=20, choices=ESCALATION_CHOICES, default='ward')
    escalated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.status}"

    @property
    def days_waiting(self):
        from django.utils import timezone
        delta = timezone.now().date() - self.created_at.date()
        return max(delta.days, 1)

    def escalate_one_step(self):
        """Move escalation_level one step up the ward→lga→state→federal chain."""
        from django.utils import timezone
        order = self.ESCALATION_ORDER
        idx = order.index(self.escalation_level) if self.escalation_level in order else 0
        if idx < len(order) - 1:
            self.escalation_level = order[idx + 1]
        self.escalated_at = timezone.now()
        self.save(update_fields=['escalation_level', 'escalated_at', 'updated_at'])
        return self.escalation_level

    @classmethod
    def auto_escalate(cls, threshold_days=14):
        """Escalate reported/under_review issues with no official reply older than threshold one step."""
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=threshold_days)
        candidates = cls.objects.filter(
            status__in=['reported', 'under_review'],
            created_at__lte=cutoff,
        )
        escalated = 0
        for issue in candidates:
            # Skip issues that already received an official reply
            # (a StatusHistory row written by a verified official or staff).
            histories = issue.status_history.select_related('updated_by__profile').all()
            has_official_reply = False
            for h in histories:
                updater = h.updated_by
                if updater is None:
                    continue
                if updater.is_staff:
                    has_official_reply = True
                    break
                profile = getattr(updater, 'profile', None)
                if profile and profile.role == 'official' and profile.is_verified:
                    has_official_reply = True
                    break
            if has_official_reply:
                continue
            if issue.status in ('resolved', 'closed'):
                continue
            issue.escalate_one_step()
            StatusHistory.objects.create(
                issue=issue,
                status=issue.status,
                updated_by=None,
                note=f"Escalated to {issue.escalation_level}",
            )
            escalated += 1
        return escalated


# Status History Model - for tracking issue status changes
class StatusHistory(models.Model):
    STATUS_CHOICES = [
        ('reported', 'Reported'),
        ('under_review', 'Under Review'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='status_updates')
    note = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Status Histories"

    def __str__(self):
        return f"{self.issue.title} - {self.status} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"


# Official Jurisdiction Model - for tracking official's jurisdiction area
class OfficialJurisdiction(models.Model):
    JURISDICTION_LEVEL_CHOICES = [
        ('ward', 'Ward'),
        ('lga', 'LGA'),
        ('state', 'State'),
        ('federal', 'Federal'),
    ]

    official = models.OneToOneField(User, on_delete=models.CASCADE, related_name='jurisdiction')
    state = models.CharField(max_length=100)
    lga = models.CharField(max_length=100, blank=True, null=True)
    ward = models.CharField(max_length=100, blank=True, null=True)
    jurisdiction_level = models.CharField(max_length=20, choices=JURISDICTION_LEVEL_CHOICES, default='ward')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['official', 'state', 'lga', 'ward']

    def __str__(self):
        location = f"{self.state}"
        if self.lga:
            location += f", {self.lga}"
        if self.ward:
            location += f", {self.ward}"
        return f"{self.official.username} - {location}"


# Post Model
class Post(models.Model):
    content = models.TextField(validators=[MinLengthValidator(1)])
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')

    # Engagement metrics
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    shares = models.IntegerField(default=0)

    image_url = models.URLField(blank=True, null=True)

    is_pinned = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} - {self.created_at.strftime('%Y-%m-%d')}"


# Comment Model
class Comment(models.Model):
    content = models.TextField(validators=[MinLengthValidator(1)])
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')

    # Can be on a post or issue
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, related_name='comments_list')
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, null=True, blank=True, related_name='comments_list')

    # Parent comment for nested replies
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')

    likes = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.author.username}"


# Message Model
class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')

    content = models.TextField()
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"


# Notification Model
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('comment', 'Comment'),
        ('like', 'Like'),
        ('message', 'Message'),
        ('mention', 'Mention'),
        ('follow', 'Follow'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications_created')

    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, null=True, blank=True)

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username} - {self.notification_type}"


# Verification Request Model - officials request verification from staff
class VerificationRequest(models.Model):
    JURISDICTION_CHOICES = [
        ('ward', 'Ward'),
        ('lga', 'LGA'),
        ('state', 'State'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_requests')
    office_name = models.CharField(max_length=255)
    jurisdiction = models.CharField(max_length=20, choices=JURISDICTION_CHOICES, default='ward')
    state = models.CharField(max_length=100, blank=True, null=True)
    lga = models.CharField(max_length=100, blank=True, null=True)
    ward = models.CharField(max_length=100, blank=True, null=True)
    document_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.office_name} ({self.status})"


# Saved/Bookmarked Items Model
class BookmarkedItem(models.Model):
    ITEM_TYPES = [
        ('post', 'Post'),
        ('issue', 'Issue'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'item_type', 'post', 'issue']]

    def __str__(self):
        return f"{self.user.username} bookmarked {self.item_type}"


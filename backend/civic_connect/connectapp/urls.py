from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, UserProfileViewSet, PostViewSet, IssueViewSet,
    CommentViewSet, MessageViewSet, NotificationViewSet, BookmarkedItemViewSet,
    StatusHistoryViewSet, OfficialJurisdictionViewSet, GoogleAuthView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', UserProfileViewSet, basename='profile')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'issues', IssueViewSet, basename='issue')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'bookmarks', BookmarkedItemViewSet, basename='bookmark')
router.register(r'status-history', StatusHistoryViewSet, basename='status-history')
router.register(r'jurisdictions', OfficialJurisdictionViewSet, basename='jurisdiction')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/google/', GoogleAuthView.as_view(), name='google_auth'),
]

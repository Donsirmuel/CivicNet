from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import (
    Comment,
    Issue,
    Message,
    Notification,
    Post,
    StatusHistory,
    UserProfile,
)


class AuthTests(APITestCase):
    def test_unauthenticated_issue_create_is_rejected(self):
        response = self.client.post(
            '/api/issues/',
            {'title': 'Pothole', 'description': 'Deep one', 'state': 'Lagos'},
            format='json',
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_issue_list_is_public(self):
        response = self.client.get('/api/issues/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_google_auth_rejects_missing_and_bogus_tokens(self):
        missing = self.client.post('/api/auth/google/', {}, format='json')
        self.assertEqual(missing.status_code, status.HTTP_400_BAD_REQUEST)
        bogus = self.client.post(
            '/api/auth/google/', {'id_token': 'bogus'}, format='json'
        )
        self.assertEqual(bogus.status_code, status.HTTP_400_BAD_REQUEST)


class IssueLifecycleTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.official = User.objects.create_user('official', password='pw123456')
        UserProfile.objects.create(user=self.official, role='official', is_verified=True)
        self.citizen_token = Token.objects.create(user=self.citizen)
        self.official_token = Token.objects.create(user=self.official)

    def _as(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_create_assign_status_flow_writes_history(self):
        self._as(self.citizen_token)
        created = self.client.post(
            '/api/issues/',
            {
                'title': 'Broken streetlight on Airport Road',
                'description': 'Out since December.',
                'category': 'safety',
                'state': 'Edo',
                'lga': 'Oredo',
            },
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        issue_id = created.data['id']

        self._as(self.official_token)
        claimed = self.client.post(f'/api/issues/{issue_id}/assign_to_me/')
        self.assertEqual(claimed.status_code, status.HTTP_200_OK)

        updated = self.client.post(
            f'/api/issues/{issue_id}/update_status/',
            {'status': 'in_progress', 'note': 'Crew dispatched.'},
            format='json',
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)

        issue = Issue.objects.get(pk=issue_id)
        self.assertEqual(issue.status, 'in_progress')
        self.assertEqual(issue.assigned_to, self.official)
        history = StatusHistory.objects.filter(issue=issue)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().note, 'Crew dispatched.')

        # Citizen was notified the official picked it up and changed status.
        citizen_notes = Notification.objects.filter(user=self.citizen)
        self.assertEqual(citizen_notes.count(), 2)

    def test_like_notifies_owner_but_not_self(self):
        post = Post.objects.create(author=self.citizen, content='Hello square')
        self._as(self.official_token)
        liked = self.client.post(f'/api/posts/{post.id}/like/')
        self.assertEqual(liked.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Notification.objects.filter(
                user=self.citizen, notification_type='like'
            ).count(),
            1,
        )

        self._as(self.citizen_token)
        self.client.post(f'/api/posts/{post.id}/like/')
        self.assertEqual(
            Notification.objects.filter(user=self.citizen, actor=self.citizen).count(),
            0,
        )


class CommentAndMessageTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.other = User.objects.create_user('other', password='pw123456')
        self.token = Token.objects.create(user=self.other)

    def _as_other(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_comment_attaches_to_issue_and_notifies_creator(self):
        issue = Issue.objects.create(
            title='Dry borehole',
            description='No water for weeks.',
            state='Anambra',
            created_by=self.citizen,
        )
        self._as_other()
        response = self.client.post(
            '/api/comments/',
            {'content': 'Same here.', 'issue_id': issue.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        comment = Comment.objects.get(pk=response.data['id'])
        self.assertEqual(comment.issue_id, issue.id)
        self.assertTrue(
            Notification.objects.filter(
                user=self.citizen, notification_type='comment'
            ).exists()
        )

    def test_message_send_notifies_receiver(self):
        self._as_other()
        response = self.client.post(
            '/api/messages/',
            {'receiver_id': self.citizen.id, 'content': 'On it.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(pk=response.data['id'])
        self.assertEqual(message.receiver, self.citizen)
        self.assertTrue(
            Notification.objects.filter(
                user=self.citizen, notification_type='message'
            ).exists()
        )

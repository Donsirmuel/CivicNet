from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import (
    Comment,
    Issue,
    Message,
    Notification,
    OfficialJurisdiction,
    Post,
    StatusHistory,
    UserProfile,
    VerificationRequest,
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
        # No client ID configured: fail closed instead of skipping verification.
        unconfigured = self.client.post(
            '/api/auth/google/', {'id_token': 'bogus'}, format='json'
        )
        self.assertEqual(
            unconfigured.status_code, status.HTTP_503_SERVICE_UNAVAILABLE
        )

    @override_settings(GOOGLE_CLIENT_ID='test-client-id')
    def test_google_auth_rejects_bogus_token_when_configured(self):
        bogus = self.client.post(
            '/api/auth/google/', {'id_token': 'bogus'}, format='json'
        )
        self.assertEqual(bogus.status_code, status.HTTP_400_BAD_REQUEST)


class IssueLifecycleTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.official = User.objects.create_user('official', password='pw123456')
        UserProfile.objects.create(user=self.official, role='official', is_verified=True, state='Lagos')
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
                'state': 'Lagos',
                'lga': 'Ikeja',
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
        # One row for the pickup, one for the status change.
        self.assertEqual(history.count(), 2)
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


class PermissionRegressionTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.official = User.objects.create_user('official', password='pw123456')
        UserProfile.objects.create(user=self.official, role='official', is_verified=True, state='Lagos')
        self.citizen_token = Token.objects.create(user=self.citizen)
        self.official_token = Token.objects.create(user=self.official)
        self.issue = Issue.objects.create(
            title='Blocked gutter on Allen Avenue',
            description='Overflowing for weeks.',
            state='Lagos',
            created_by=self.citizen,
        )

    def _as(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_citizen_cannot_change_issue_status(self):
        self._as(self.citizen_token)
        response = self.client.post(
            f'/api/issues/{self.issue.id}/update_status/',
            {'status': 'resolved'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_citizen_cannot_assign_issue(self):
        self._as(self.citizen_token)
        response = self.client.post(f'/api/issues/{self.issue.id}/assign_to_me/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_status_change_rejects_bad_transition(self):
        self._as(self.official_token)
        self.client.post(f'/api/issues/{self.issue.id}/assign_to_me/')
        self.issue.refresh_from_db()
        self.assertEqual(self.issue.status, 'under_review')
        # under_review -> closed is a legal move.
        response = self.client.post(
            f'/api/issues/{self.issue.id}/update_status/',
            {'status': 'closed'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # closed is terminal: reopening is rejected for non-staff.
        bad = self.client.post(
            f'/api/issues/{self.issue.id}/update_status/',
            {'status': 'reported'},
            format='json',
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        self.issue.refresh_from_db()
        self.assertEqual(self.issue.status, 'closed')

    def test_user_cannot_edit_another_user(self):
        self._as(self.citizen_token)
        response = self.client.patch(
            f'/api/users/{self.official.id}/',
            {'first_name': 'Hacked'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_profile_role_is_not_self_writable(self):
        self._as(self.citizen_token)
        profile = UserProfile.objects.create(user=self.citizen)
        response = self.client.patch(
            f'/api/profiles/{profile.id}/',
            {'role': 'official', 'is_verified': True},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertEqual(profile.role, 'citizen')
        self.assertFalse(profile.is_verified)

    def test_comment_needs_exactly_one_target(self):
        self._as(self.citizen_token)
        post = Post.objects.create(author=self.citizen, content='Update here')
        both = self.client.post(
            '/api/comments/',
            {'content': 'x', 'post_id': post.id, 'issue_id': self.issue.id},
            format='json',
        )
        self.assertEqual(both.status_code, status.HTTP_400_BAD_REQUEST)
        neither = self.client.post('/api/comments/', {'content': 'x'}, format='json')
        self.assertEqual(neither.status_code, status.HTTP_400_BAD_REQUEST)

    def test_message_to_self_is_rejected(self):
        self._as(self.citizen_token)
        response = self.client.post(
            '/api/messages/',
            {'receiver_id': self.citizen.id, 'content': 'hi me'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_official_cannot_act_outside_their_area(self):
        far_issue = Issue.objects.create(
            title='Collapsed culvert in Kano',
            description='Blocked for a month.',
            state='Kano',
            created_by=self.citizen,
        )
        self._as(self.official_token)
        claim = self.client.post(f'/api/issues/{far_issue.id}/assign_to_me/')
        self.assertEqual(claim.status_code, status.HTTP_403_FORBIDDEN)
        update = self.client.post(
            f'/api/issues/{far_issue.id}/update_status/',
            {'status': 'under_review'},
            format='json',
        )
        self.assertEqual(update.status_code, status.HTTP_403_FORBIDDEN)
        escalate = self.client.post(f'/api/issues/{far_issue.id}/escalate/')
        self.assertEqual(escalate.status_code, status.HTTP_403_FORBIDDEN)

    def test_issue_payload_does_not_leak_email(self):
        response = self.client.get('/api/issues/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data.get('results', response.data)
        self.assertTrue(payload)
        self.assertNotIn('email', payload[0]['created_by'])


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


class EscalationTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.official = User.objects.create_user('official', password='pw123456')
        UserProfile.objects.create(user=self.official, role='official', is_verified=True, state='Lagos')
        self.citizen_token = Token.objects.create(user=self.citizen)
        self.official_token = Token.objects.create(user=self.official)
        self.issue = Issue.objects.create(
            title='Uncollected refuse on Market Road',
            description='Piling up for weeks.',
            state='Lagos',
            created_by=self.citizen,
        )

    def _as(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_escalate_moves_ward_to_lga_writes_history_and_notifies(self):
        self._as(self.official_token)
        response = self.client.post(f'/api/issues/{self.issue.id}/escalate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.issue.refresh_from_db()
        self.assertEqual(self.issue.escalation_level, 'lga')
        self.assertIsNotNone(self.issue.escalated_at)
        history = StatusHistory.objects.filter(issue=self.issue).first()
        self.assertIsNotNone(history)
        self.assertEqual(history.note, 'Escalated to lga')
        self.assertTrue(
            Notification.objects.filter(user=self.citizen, issue=self.issue).exists()
        )

    def test_escalate_resolved_returns_400(self):
        self.issue.status = 'resolved'
        self.issue.save()
        self._as(self.official_token)
        response = self.client.post(f'/api/issues/{self.issue.id}/escalate/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_citizen_escalate_returns_403(self):
        self._as(self.citizen_token)
        response = self.client.post(f'/api/issues/{self.issue.id}/escalate/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class VerificationRequestTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.staff = User.objects.create_user('staff', password='pw123456', is_staff=True)
        UserProfile.objects.create(user=self.citizen)
        self.citizen_token = Token.objects.create(user=self.citizen)
        self.staff_token = Token.objects.create(user=self.staff)

    def _as(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_create_and_staff_approve_promotes_profile(self):
        self._as(self.citizen_token)
        created = self.client.post(
            '/api/verification-requests/',
            {'office_name': 'Ward 5 Councillor', 'jurisdiction': 'ward'},
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        request_id = created.data['id']
        self.assertEqual(
            VerificationRequest.objects.get(pk=request_id).user, self.citizen
        )

        self._as(self.staff_token)
        reviewed = self.client.post(
            f'/api/verification-requests/{request_id}/review/',
            {'approve': True},
            format='json',
        )
        self.assertEqual(reviewed.status_code, status.HTTP_200_OK)
        profile = UserProfile.objects.get(user=self.citizen)
        self.assertEqual(profile.role, 'official')
        self.assertTrue(profile.is_verified)
        self.assertEqual(
            VerificationRequest.objects.get(pk=request_id).status, 'approved'
        )
        # Approving records a jurisdiction so area scoping can work.
        self.assertTrue(
            OfficialJurisdiction.objects.filter(official=self.citizen).exists()
        )

    def test_non_staff_approve_returns_403(self):
        vr = VerificationRequest.objects.create(
            user=self.citizen, office_name='Ward 5 Councillor', jurisdiction='ward'
        )
        self._as(self.citizen_token)
        response = self.client.post(
            f'/api/verification-requests/{vr.id}/review/',
            {'approve': True},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            'resetuser', email='reset@example.com', password='oldpassword1'
        )

    def test_request_always_200_even_for_unknown_email(self):
        for email in ('reset@example.com', 'nobody@example.com', ''):
            response = self.client.post(
                '/api/auth/password-reset/', {'email': email}, format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_confirm_with_bad_token_returns_400(self):
        response = self.client.post(
            '/api/auth/password-reset/confirm/',
            {'uid': 'bad', 'token': 'bad', 'new_password': 'newpassword1'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_with_valid_token_sets_password_and_allows_login(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        response = self.client.post(
            '/api/auth/password-reset/confirm/',
            {'uid': uid, 'token': token, 'new_password': 'newpassword1'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        login = self.client.post(
            '/api/api-token-auth/',
            {'username': 'resetuser', 'password': 'newpassword1'},
            format='json',
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn('token', login.data)


class TokenRotationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('rotator', password='pw123456')

    def test_login_issues_fresh_token_and_retires_the_old_one(self):
        first = self.client.post(
            '/api/api-token-auth/',
            {'username': 'rotator', 'password': 'pw123456'},
            format='json',
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        second = self.client.post(
            '/api/api-token-auth/',
            {'username': 'rotator', 'password': 'pw123456'},
            format='json',
        )
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertNotEqual(first.data['token'], second.data['token'])

        # The token from the first login must no longer authenticate.
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {first.data['token']}")
        self.assertEqual(
            self.client.get('/api/users/me/').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


class AutoEscalateTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')

    def test_auto_escalate_is_bounded_and_idempotent(self):
        from datetime import timedelta
        from django.utils import timezone

        issue = Issue.objects.create(
            title='Refuse uncollected for two months',
            description='Market Road.',
            state='Lagos',
            created_by=self.citizen,
        )
        Issue.objects.filter(pk=issue.pk).update(
            created_at=timezone.now() - timedelta(days=60)
        )

        self.assertEqual(Issue.auto_escalate(threshold_days=14), 1)
        issue.refresh_from_db()
        self.assertEqual(issue.escalation_level, 'lga')

        # A second run right away must not move it again.
        self.assertEqual(Issue.auto_escalate(threshold_days=14), 0)

        # Even after many stale cycles it stops at federal.
        for _ in range(6):
            Issue.objects.filter(pk=issue.pk).update(
                escalated_at=timezone.now() - timedelta(days=30)
            )
            Issue.auto_escalate(threshold_days=14)
        issue.refresh_from_db()
        self.assertEqual(issue.escalation_level, 'federal')
        # Exactly three steps: lga, state, federal.
        self.assertEqual(StatusHistory.objects.filter(issue=issue).count(), 3)


class AnonymityTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.token = Token.objects.create(user=self.citizen)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_anonymous_issue_hides_the_reporter(self):
        created = self.client.post(
            '/api/issues/',
            {
                'title': 'Illegal dumping on our street',
                'description': 'People dump refuse here at night.',
                'state': 'Lagos',
                'is_anonymous': True,
            },
            format='json',
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertTrue(created.data['is_anonymous'])
        self.assertEqual(created.data['created_by']['username'], 'anonymous')

        listed = self.client.get('/api/issues/')
        payload = listed.data.get('results', listed.data)
        row = next(r for r in payload if r['id'] == created.data['id'])
        self.assertEqual(row['created_by']['username'], 'anonymous')


class OfficialReplyFlagTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user('citizen', password='pw123456')
        self.official = User.objects.create_user('official', password='pw123456')
        UserProfile.objects.create(
            user=self.official, role='official', is_verified=True, state='Lagos'
        )
        self.citizen_token = Token.objects.create(user=self.citizen)
        self.official_token = Token.objects.create(user=self.official)
        self.issue = Issue.objects.create(
            title='Street light out',
            description='Dark at night.',
            state='Lagos',
            created_by=self.citizen,
        )

    def test_flag_is_false_then_true_after_an_official_replies(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.citizen_token}')
        before = self.client.get(f'/api/issues/{self.issue.id}/')
        self.assertFalse(before.data['has_official_reply'])

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.official_token}')
        self.client.post(f'/api/issues/{self.issue.id}/assign_to_me/')

        after = self.client.get(f'/api/issues/{self.issue.id}/')
        self.assertTrue(after.data['has_official_reply'])


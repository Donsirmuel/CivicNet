from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from connectapp.models import UserProfile, Post, Issue, StatusHistory, OfficialJurisdiction
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Generate sample data for testing'

    def handle(self, *args, **options):
        # Create sample users
        users_data = [
            {'username': 'chinedu_citizen', 'email': 'chinedu@example.com', 'first_name': 'Chinedu', 'last_name': 'Okafor'},
            {'username': 'jane_official', 'email': 'jane@government.ng', 'first_name': 'Jane', 'last_name': 'Smith'},
            {'username': 'ahmed_resident', 'email': 'ahmed@example.com', 'first_name': 'Ahmed', 'last_name': 'Hassan'},
        ]

        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                }
            )
            users.append(user)
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.username}')

        # Create profiles
        UserProfile.objects.get_or_create(
            user=users[0],
            defaults={
                'bio': 'A concerned citizen reporting issues in the community',
                'location': 'Lagos, Nigeria',
                'role': 'citizen',
            }
        )

        UserProfile.objects.get_or_create(
            user=users[1],
            defaults={
                'bio': 'Government official responsible for community development',
                'location': 'Lagos State Government',
                'role': 'official',
                'is_verified': True,
                'state': 'Lagos',
                'lga': 'Surulere',
                'ward': 'Ward 001',
                'jurisdiction_type': 'ward',
            }
        )

        UserProfile.objects.get_or_create(
            user=users[2],
            defaults={
                'bio': 'Community resident and activist',
                'location': 'Surulere, Lagos',
                'role': 'citizen',
            }
        )

        # Create official jurisdiction
        OfficialJurisdiction.objects.get_or_create(
            official=users[1],
            defaults={
                'state': 'Lagos',
                'lga': 'Surulere',
                'ward': 'Ward 001',
                'jurisdiction_level': 'ward',
            }
        )

        # Create sample issues with status history
        issue_data = [
            {
                'title': 'Pothole on Shomolu Street',
                'description': 'There is a large pothole on the main road causing traffic congestion',
                'category': 'infrastructure',
                'status': 'in_progress',
                'scope': 'local',
                'priority': 'high',
                'state': 'Lagos',
                'lga': 'Surulere',
                'ward': 'Ward 001',
            },
            {
                'title': 'Uncleared Waste Dump',
                'description': 'Waste has not been cleared from the dumping site for weeks',
                'category': 'environment',
                'status': 'reported',
                'scope': 'local',
                'priority': 'medium',
                'state': 'Lagos',
                'lga': 'Surulere',
                'ward': 'Ward 001',
            },
            {
                'title': 'School Building Renovation Needed',
                'description': 'The primary school building needs urgent renovation',
                'category': 'education',
                'status': 'under_review',
                'scope': 'local',
                'priority': 'high',
                'state': 'Lagos',
                'lga': 'Surulere',
                'ward': 'Ward 001',
            },
        ]

        for issue_info in issue_data:
            issue, created = Issue.objects.get_or_create(
                title=issue_info['title'],
                defaults={
                    'description': issue_info['description'],
                    'category': issue_info['category'],
                    'status': issue_info['status'],
                    'scope': issue_info['scope'],
                    'priority': issue_info['priority'],
                    'state': issue_info['state'],
                    'lga': issue_info['lga'],
                    'ward': issue_info['ward'],
                    'created_by': users[0],
                    'assigned_to': users[1] if issue_info['status'] != 'reported' else None,
                }
            )

            if created:
                self.stdout.write(f'Created issue: {issue.title}')

                # Create status history for the issue
                if issue.status == 'reported':
                    StatusHistory.objects.create(
                        issue=issue,
                        status='reported',
                        updated_by=users[0],
                        note='Issue reported'
                    )
                elif issue.status == 'under_review':
                    # Create history showing progression
                    StatusHistory.objects.create(
                        issue=issue,
                        status='reported',
                        updated_by=users[0],
                        note='Issue reported'
                    )
                    StatusHistory.objects.create(
                        issue=issue,
                        status='under_review',
                        updated_by=users[1],
                        note='Official has reviewed the issue'
                    )
                elif issue.status == 'in_progress':
                    # Create full status progression
                    StatusHistory.objects.create(
                        issue=issue,
                        status='reported',
                        updated_by=users[0],
                        note='Issue reported'
                    )
                    StatusHistory.objects.create(
                        issue=issue,
                        status='under_review',
                        updated_by=users[1],
                        note='Official has reviewed the issue'
                    )
                    StatusHistory.objects.create(
                        issue=issue,
                        status='in_progress',
                        updated_by=users[1],
                        note='Work has commenced on fixing this issue'
                    )

        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))

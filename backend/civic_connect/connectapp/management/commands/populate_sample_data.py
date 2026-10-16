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
            {'username': 'funmi_works', 'email': 'funmi@works.lagosstate.gov.ng', 'first_name': 'Funmi', 'last_name': 'Adeleke'},
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
                'bio': 'I report bad roads and dumped refuse around Surulere.',
                'location': 'Surulere, Lagos',
                'role': 'citizen',
            }
        )

        UserProfile.objects.get_or_create(
            user=users[1],
            defaults={
                'bio': 'Works officer. I reply to road and drainage reports and post what happens next.',
                'location': 'Lagos State Works Office',
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
                'bio': 'Resident of Ikeja. I photograph faults and follow up until they are fixed.',
                'location': 'Ikeja, Lagos',
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
                'title': 'Crater pothole on Shomolu Road by the bus stop',
                'description': 'A wide pothole sits in the middle of Shomolu Road just before the bus stop. Buses swerve into the other lane to dodge it, especially when it rains and the hole fills with water.',
                'category': 'infrastructure',
                'status': 'in_progress',
                'scope': 'local',
                'priority': 'high',
                'state': 'Lagos',
                'lga': 'Shomolu',
                'ward': 'Ward 004',
            },
            {
                'title': 'LAWMA truck has skipped our street for three weeks',
                'description': 'The PSP truck that serves Allen Avenue side streets in Ikeja has not come for three weeks. Refuse bags are piling at the junction and spilling into the gutter.',
                'category': 'environment',
                'status': 'reported',
                'scope': 'local',
                'priority': 'medium',
                'state': 'Lagos',
                'lga': 'Ikeja',
                'ward': 'Ward 003',
            },
            {
                'title': 'No roof sheets on two classrooms at Community Primary School',
                'description': 'Two classroom blocks at the community primary school in Eti-Osa lost roof sheets in the last storm. Pupils now crowd into the remaining rooms when it rains.',
                'category': 'education',
                'status': 'under_review',
                'scope': 'local',
                'priority': 'high',
                'state': 'Lagos',
                'lga': 'Eti-Osa',
                'ward': 'Ward 002',
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
                        note='Report received and pinned to the ward map.'
                    )
                elif issue.status == 'under_review':
                    # Create history showing progression
                    StatusHistory.objects.create(
                        issue=issue,
                        status='reported',
                        updated_by=users[0],
                        note='Report received and pinned to the ward map.'
                    )
                    StatusHistory.objects.create(
                        issue=issue,
                        status='under_review',
                        updated_by=users[1],
                        note='Seen at the works office. Checking who owns this road.'
                    )
                elif issue.status == 'in_progress':
                    # Create full status progression
                    StatusHistory.objects.create(
                        issue=issue,
                        status='reported',
                        updated_by=users[0],
                        note='Report received and pinned to the ward map.'
                    )
                    StatusHistory.objects.create(
                        issue=issue,
                        status='under_review',
                        updated_by=users[1],
                        note='Seen at the works office. Checking who owns this road.'
                    )
                    StatusHistory.objects.create(
                        issue=issue,
                        status='in_progress',
                        updated_by=users[1],
                        note='Repair crew sent out to assess the damage.'
                    )

        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))

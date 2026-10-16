from django.core.management.base import BaseCommand

from connectapp.models import Issue


class Command(BaseCommand):
    help = 'Auto-escalate stale reported/under_review issues with no official reply one step.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--threshold-days',
            type=int,
            default=14,
            help='Minimum age in days before an issue is escalated (default: 14).',
        )

    def handle(self, *args, **options):
        count = Issue.auto_escalate(threshold_days=options['threshold_days'])
        self.stdout.write(self.style.SUCCESS(f'Escalated {count} issue(s).'))

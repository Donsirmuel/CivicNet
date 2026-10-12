"""
Demo data seeding script for CivicNet.
Matches current models in connectapp/models.py.

Usage (from backend/civic_connect/):
    python manage.py shell < ../seed_demo_data.py

For the maintained sample-data command instead, run:
    python manage.py populate_sample_data
"""

from django.contrib.auth.models import User
from connectapp.models import UserProfile, Issue, Post, StatusHistory


def get_or_create_user(username, email, first_name, last_name, password="password123"):
    user, created = User.objects.get_or_create(
        username=username,
        defaults={"email": email, "first_name": first_name, "last_name": last_name},
    )
    if created:
        user.set_password(password)
        user.save()
    return user


def get_or_create_profile(user, role="citizen", is_verified=False, state="", lga="", ward=""):
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "role": role,
            "is_verified": is_verified,
            "state": state,
            "lga": lga,
            "ward": ward,
        },
    )
    return profile


# Demo users
admin_user, _ = User.objects.get_or_create(
    username="admin",
    defaults={"email": "admin@civicnet.ng", "is_staff": True, "is_superuser": True},
)

citizen1 = get_or_create_user("amina_okonjo", "amina.okonjo@civicnet.ng", "Amina", "Okonjo")
get_or_create_profile(citizen1, role="citizen", state="Lagos", lga="Surulere", ward="Ward 001")

citizen2 = get_or_create_user("chisom_adeyemi", "chisom@civicnet.ng", "Chisom", "Adeyemi")
get_or_create_profile(citizen2, role="citizen", state="Lagos", lga="Ikeja", ward="Ward 003")

official1 = get_or_create_user(
    "commissioner_works", "works@civicnet.gov.ng", "Adebayo", "Olusegun"
)
get_or_create_profile(
    official1,
    role="official",
    is_verified=True,
    state="Lagos",
    lga="Surulere",
    ward="Ward 001",
)

# Demo issues
issues_data = [
    {
        "title": "Third Mainland Bridge needs urgent repairs",
        "description": "The road surface has visible cracks and potholes. This is causing traffic accidents.",
        "category": "infrastructure",
        "status": "in_progress",
        "scope": "state",
        "priority": "urgent",
        "state": "Lagos",
        "lga": "Lagos Mainland",
        "ward": "Ward 002",
        "created_by": citizen1,
        "assigned_to": official1,
    },
    {
        "title": "Pothole on Lekki-Epe Expressway",
        "description": "Near Victoria Island junction. Dangerous for motorcyclists.",
        "category": "infrastructure",
        "status": "reported",
        "scope": "local",
        "priority": "high",
        "state": "Lagos",
        "lga": "Eti-Osa",
        "ward": "Ward 005",
        "created_by": citizen2,
        "assigned_to": None,
    },
]

for issue_data in issues_data:
    Issue.objects.get_or_create(title=issue_data["title"], defaults=issue_data)

# Demo posts (Post model uses `content`, not title/body)
posts_data = [
    {
        "author": citizen1,
        "content": "Third Mainland Bridge needs urgent repairs — visible cracks are causing accidents. Who else uses this route daily?",
    },
    {
        "author": citizen2,
        "content": "Pothole on Lekki-Epe Expressway near VI junction. Dangerous for motorcyclists. Reported as an issue too.",
    },
    {
        "author": official1,
        "content": "Lekki Toll Road maintenance update: routine works this week, expect light delays. Report road faults here and we will pick them up.",
    },
]

for post_data in posts_data:
    Post.objects.get_or_create(author=post_data["author"], content=post_data["content"])

# Status history for the in-progress issue
bridge_issue = Issue.objects.filter(title__icontains="Third Mainland").first()
if bridge_issue is not None:
    StatusHistory.objects.get_or_create(
        issue=bridge_issue,
        status="in_progress",
        updated_by=official1,
        defaults={"note": "Repair crew dispatched for assessment."},
    )

print("Demo data seeded successfully!")
print("   - Citizens: amina_okonjo, chisom_adeyemi (password: password123)")
print("   - Official: commissioner_works (verified, password: password123)")
print(f"   - Issues: {Issue.objects.count()} total, Posts: {Post.objects.count()} total")

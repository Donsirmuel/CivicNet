# CivicNet Backend - Django Setup Guide

## Project Structure

```
backend/
├── civic_connect/           # Django project directory
│   ├── civic_connect/       # Project settings
│   │   ├── settings.py      # Django settings with REST Framework and CORS config
│   │   ├── urls.py          # Main URL routing
│   │   ├── wsgi.py          # WSGI configuration
│   │   └── asgi.py          # ASGI configuration
│   ├── connectapp/          # Main Django app
│   │   ├── models.py        # Database models
│   │   ├── views.py         # API viewsets
│   │   ├── serializers.py   # Data serializers
│   │   ├── urls.py          # App URL routing
│   │   ├── admin.py         # Django admin configuration
│   │   └── management/
│   │       └── commands/
│   │           └── populate_sample_data.py  # Sample data generator
│   ├── manage.py            # Django management script
│   └── db.sqlite3           # Database (SQLite for development)
├── venv/                    # Python virtual environment
└── requirements.txt         # Python dependencies
```

## Database Models

### UserProfile
- Extends Django's User model
- Stores user role (citizen or government official)
- Tracks verification status and location

### Issue
- Civic issues/problems reported by citizens
- Includes location (state, LGA, ward)
- Tracks status, priority, and engagement metrics
- Can be assigned to officials

### Post
- Social media-style posts from users
- Simple content sharing with likes and comments

### Comment
- Comments on posts or issues
- Threaded discussion capability

### Message
- Direct messaging between users
- Tracks read/unread status

### Notification
- User notifications for various events
- Types: comment, like, message, mention, follow

### BookmarkedItem
- Saved posts and issues for later viewing

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend/civic_connect
source venv/Scripts/activate  # On Windows
# or
source venv/bin/activate      # On macOS/Linux

pip install -r ../requirements.txt
```

### 2. Database Setup

Run migrations to create database tables:

```bash
python manage.py migrate
```

### 3. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 4. Load Sample Data (Optional)

```bash
python manage.py populate_sample_data
```

This creates 3 sample users:
- **john_citizen** (citizen) - password: password123
- **jane_official** (government official) - password: password123
- **ahmed_resident** (citizen) - password: password123

### 5. Run Development Server

```bash
python manage.py runserver
```

Server will start at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api-token-auth/` - Get auth token (send username and password)

### Users
- `GET /api/users/` - List all users
- `GET /api/users/{id}/` - Get user details
- `GET /api/users/me/` - Get logged-in user info (authenticated)

### User Profiles
- `GET /api/profiles/` - List all profiles
- `GET /api/profiles/{id}/` - Get profile details
- `GET /api/profiles/me/` - Get logged-in user's profile (authenticated)

### Posts
- `GET /api/posts/` - List all posts
- `POST /api/posts/` - Create new post (authenticated)
- `GET /api/posts/{id}/` - Get post details
- `PUT/PATCH /api/posts/{id}/` - Update post (authenticated)
- `DELETE /api/posts/{id}/` - Delete post (authenticated)
- `POST /api/posts/{id}/like/` - Like a post (authenticated)
- `POST /api/posts/{id}/unlike/` - Unlike a post (authenticated)

### Issues
- `GET /api/issues/` - List all issues
- `POST /api/issues/` - Create new issue (authenticated)
- `GET /api/issues/{id}/` - Get issue details
- `PUT/PATCH /api/issues/{id}/` - Update issue (authenticated)
- `POST /api/issues/{id}/upvote/` - Upvote issue (authenticated)
- `POST /api/issues/{id}/downvote/` - Downvote issue (authenticated)
- `POST /api/issues/{id}/assign/` - Assign issue to official (authenticated)

### Comments
- `GET /api/comments/` - List comments
- `POST /api/comments/` - Create comment (authenticated)
- Query filters: `?post_id=1` or `?issue_id=1`

### Messages
- `GET /api/messages/` - List user's messages (authenticated)
- `POST /api/messages/` - Send message (authenticated)
- `GET /api/messages/inbox/` - Get inbox messages (authenticated)
- `GET /api/messages/sent/` - Get sent messages (authenticated)
- `POST /api/messages/{id}/mark_as_read/` - Mark message as read (authenticated)

### Notifications
- `GET /api/notifications/` - List user's notifications (authenticated)
- `GET /api/notifications/unread/` - Get unread notifications (authenticated)
- `POST /api/notifications/{id}/mark_as_read/` - Mark notification as read (authenticated)

### Bookmarks
- `GET /api/bookmarks/` - List user's bookmarks (authenticated)
- `POST /api/bookmarks/` - Create bookmark (authenticated)

## Django Admin

Access admin panel at `http://localhost:8000/admin/` with your superuser credentials.

All models are registered and can be managed through the admin interface.

## Authentication

The API uses Token-based authentication. To get a token:

```bash
curl -X POST http://localhost:8000/api-token-auth/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_citizen", "password": "password123"}'
```

Include the token in subsequent requests:

```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
  http://localhost:8000/api/posts/
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- `http://localhost:3000` (Alternative dev server)
- `http://127.0.0.1:3000`

## Environment Variables

Create a `.env` file in the `civic_connect/` directory (optional for development):

```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Future Enhancements

- PostgreSQL database configuration
- User authentication (JWT tokens)
- Email notifications
- Real-time messaging with WebSockets
- File upload handling
- Geolocation services integration
- Advanced filtering and search
- Rate limiting
- API documentation (Swagger/OpenAPI)

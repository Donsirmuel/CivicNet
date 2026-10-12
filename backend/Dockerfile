FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY civic_connect/ ./

# Collect static at build time (runtime env not needed for this)
RUN python manage.py collectstatic --noinput --settings=civic_connect.settings || true

EXPOSE 8000

CMD ["gunicorn", "civic_connect.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]

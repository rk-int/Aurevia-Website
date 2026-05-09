FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY backend/ backend/
COPY frontend/ frontend/

# Run the unified FastAPI server
# Cloud Run sets the PORT environment variable
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}

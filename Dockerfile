# Base image (use ARM version if Oracle Ampere A1 instance)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for volumes
RUN mkdir -p /app/data

# Copy model file to a temporary location (will be moved to volume at startup)
RUN if [ -f tfidf_vectorizer.pkl ]; then cp tfidf_vectorizer.pkl /app/tfidf_vectorizer_default.pkl; fi

# Expose the app port
EXPOSE 8000

# Use entrypoint script to initialize volume with model file
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

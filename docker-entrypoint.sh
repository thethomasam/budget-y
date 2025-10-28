#!/bin/bash
set -e

# Initialize the volume with the model file if it doesn't exist
if [ -f "/app/tfidf_vectorizer_default.pkl" ] && [ ! -f "${TFIDF_MODEL_PATH}" ]; then
    echo "📦 Initializing model file in volume..."
    cp /app/tfidf_vectorizer_default.pkl "${TFIDF_MODEL_PATH}"
    echo "✅ Model file copied to ${TFIDF_MODEL_PATH}"
fi

# Check if model file exists in volume
if [ -f "${TFIDF_MODEL_PATH}" ]; then
    echo "✅ Model file found at ${TFIDF_MODEL_PATH}"
else
    echo "⚠️  Model file not found at ${TFIDF_MODEL_PATH} - categorization will not work"
fi

# Database will be created automatically by SQLAlchemy if it doesn't exist
echo "🗄️  Database path: ${DATABASE_PATH}"

# Execute the main command
exec "$@"

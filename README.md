# Budgety - Budget Tracking API

A FastAPI backend for tracking personal finances through CSV uploads.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

Or use uvicorn directly:
```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

## API Endpoints

- `GET /` - Welcome message
- `POST /upload-csv` - Upload a CSV file with transactions
- `GET /transactions` - Get all transactions (with pagination)
- `GET /transactions/summary` - Get summary of income/expenses
- `DELETE /transactions` - Delete all transactions

## CSV Format

Your CSV file should have the following columns:
- `date` (YYYY-MM-DD format)
- `description` (text)
- `category` (optional text)
- `amount` (number)
- `type` (either "income" or "expense")

Example CSV is provided in `sample.csv`

## Testing

Test the upload endpoint with curl:
```bash
curl -X POST "http://localhost:8000/upload-csv" -F "file=@sample.csv"
```

View transactions:
```bash
curl http://localhost:8000/transactions
```

View summary:
```bash
curl http://localhost:8000/transactions/summary
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

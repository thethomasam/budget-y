# Budgety

Personal finance tracker with iOS Shortcuts integration. Log transactions from any bank card using a single shortcut, no bank APIs required.

## Features

- Unified transaction logging across all banks and cards
- CSV import/export for bulk operations
- Self-hosted and private
- RESTful API with interactive docs

## Installation

```bash
# Clone and install
git clone https://github.com/yourusername/budgety.git
cd budgety
pip install -r requirements.txt

# Initialize database
alembic upgrade head

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API available at `http://localhost:8000` (docs at `/docs`)

## iOS Shortcuts Setup

1. Open Shortcuts app
2. Create new shortcut with these actions:
   - Receive input (text)
   - Parse transaction details
   - HTTP POST to `http://YOUR_IP:8000/transactions`
3. JSON body format:
   ```json
   {
     "date": "2025-10-12",
     "merchant": "Starbucks",
     "amount": 5.50,
     "card": "Visa",
     "category": "Food & Dining"
   }
   ```

## Usage

**Quick log:** "Coffee at Starbucks, $5.50, Visa" → Invoke shortcut → Done

**CSV import:**
```bash
curl -X POST "http://localhost:8000/upload-csv" -F "file=@statement.csv"
```

CSV format: `date,merchant,category,amount,card`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/transactions` | Add transaction |
| GET | `/transactions` | List transactions |
| DELETE | `/transactions` | Delete all |
| POST | `/upload-csv` | Bulk import |

Full docs: `http://localhost:8000/docs`

## Tech Stack

- FastAPI (Python)
- SQLite + SQLAlchemy
- Alembic migrations
- iOS Shortcuts

## License

MIT

"""
Legacy entry point - imports from the new app structure.
For new development, use app/main.py directly.
"""
from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

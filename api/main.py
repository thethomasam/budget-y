from fastapi import FastAPI
from sqlalchemy import text

import categories
import recurring
import transactions
from database import Base, engine

Base.metadata.create_all(bind=engine)

# create_all only creates missing tables, not missing columns on tables that
# already exist -- this backfills `budget` for databases created before it
# was added to the model.
with engine.begin() as conn:
    conn.execute(
        text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS budget FLOAT NOT NULL DEFAULT 0")
    )

app = FastAPI()

app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(recurring.router)

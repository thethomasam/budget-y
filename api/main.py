from fastapi import FastAPI
from sqlalchemy import text

import auth
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

# Users arrived after the other tables: add the owner column to databases that
# predate it, and make category names unique per user instead of globally.
with engine.begin() as conn:
    for table in ("categories", "transactions", "recurring_items"):
        conn.execute(
            text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)")
        )
    # Users created before passwords existed get an empty hash, which never matches.
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR NOT NULL DEFAULT ''"))
    conn.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT"))
    conn.execute(text("ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key"))
    conn.execute(
        text("CREATE UNIQUE INDEX IF NOT EXISTS ix_categories_user_name ON categories (user_id, name)")
    )

app = FastAPI()

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(recurring.router)

from fastapi import FastAPI

import categories
import transactions
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(transactions.router)
app.include_router(categories.router)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import transactions_router, categories_router, analytics_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Budgety API",
    description="Personal budget tracking and analytics API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(transactions_router)
app.include_router(categories_router)
app.include_router(analytics_router)


@app.get("/", tags=["root"])
def read_root():
    return {
        "message": "Welcome to Budgety API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import config
from app.database import Base, engine
from app.routes import transactions_router, categories_router, analytics_router, settings_router, auth_router

# Create database tables
Base.metadata.create_all(bind=engine)

app_config = config["app"]
app = FastAPI(
    title=app_config["title"],
    description=app_config["description"],
    version=app_config["version"],
    root_path=app_config["root_path"]
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
app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(categories_router)
app.include_router(analytics_router)
app.include_router(settings_router)


@app.get("/", tags=["root"])
def read_root():
    return {
        "message": "Welcome to Budgety API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=app_config["port"])

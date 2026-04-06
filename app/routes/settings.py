from fastapi import APIRouter
from app.config import config

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def get_settings():
    """Return frontend configuration from config.yaml"""
    return {
        "user": config["user"],
        "budget_goals": config["budget_goals"],
        "transaction_limit": config["frontend"]["transaction_limit"],
        "monthly_budget": config["frontend"]["monthly_budget"],
        "categories": [g["name"] for g in config["budget_goals"]],
    }

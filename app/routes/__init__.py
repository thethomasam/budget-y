from .transactions import router as transactions_router
from .categories import router as categories_router
from .analytics import router as analytics_router
from .settings import router as settings_router

__all__ = ["transactions_router", "categories_router", "analytics_router", "settings_router"]

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.accounts.router import router as accounts_router
from app.modules.categories.router import router as categories_router
from app.modules.transactions.router import router as transactions_router
from app.modules.budgets.router import router as budgets_router
from app.modules.analytics.router import (
    dashboard_router as analytics_dashboard_router,
    reports_router as analytics_reports_router,
)
from app.modules.savings_goals.router import router as savings_goals_router
from app.modules.recurring.router import router as recurring_router
from app.modules.chat.router import router as chat_router
from app.modules.notifications.router import router as notifications_router, reminders_router
from app.modules.admin.router import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):

    Base.metadata.create_all(bind=engine)

    from sqlalchemy.orm import Session as DBSession
    with DBSession(engine) as db:
        from app.modules.admin.service import seed_default_templates_if_empty
        seed_default_templates_if_empty(db)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Financial Management REST API – FastAPI + SQLAlchemy + MySQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_MAX_BODY = 20 * 1024 * 1024

@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_BODY:
        return JSONResponse(status_code=413, content={"detail": "Request body too large (max 20 MB)"})
    return await call_next(request)

PREFIX = settings.API_V1_PREFIX

app.include_router(auth_router, prefix=PREFIX)
app.include_router(users_router, prefix=PREFIX)
app.include_router(accounts_router, prefix=PREFIX)
app.include_router(categories_router, prefix=PREFIX)
app.include_router(transactions_router, prefix=PREFIX)
app.include_router(budgets_router, prefix=PREFIX)
app.include_router(analytics_dashboard_router, prefix=PREFIX)
app.include_router(analytics_reports_router, prefix=PREFIX)
app.include_router(savings_goals_router, prefix=PREFIX)
app.include_router(recurring_router, prefix=PREFIX)
app.include_router(chat_router, prefix=PREFIX)
app.include_router(notifications_router, prefix=PREFIX)
app.include_router(reminders_router, prefix=PREFIX)
app.include_router(admin_router, prefix=PREFIX)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

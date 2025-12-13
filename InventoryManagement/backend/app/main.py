from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, products, warehouses, receipts, deliveries, transfers, adjustments, stock, dashboard

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS. During development allow all origins to avoid preflight issues.
# In production restrict this to the specific origins in settings.BACKEND_CORS_ORIGINS.
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://localhost:5178"
]

# Add origins from settings (useful for production deployment)
if hasattr(settings, "BACKEND_CORS_ORIGINS"):
    origins.extend([str(origin) for origin in settings.BACKEND_CORS_ORIGINS])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
app.include_router(warehouses.router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"]) # Mapping warehouses to settings as per spec
app.include_router(receipts.router, prefix=f"{settings.API_V1_STR}/receipts", tags=["receipts"])
app.include_router(deliveries.router, prefix=f"{settings.API_V1_STR}/deliveries", tags=["deliveries"])
app.include_router(transfers.router, prefix=f"{settings.API_V1_STR}/transfers", tags=["transfers"])
app.include_router(adjustments.router, prefix=f"{settings.API_V1_STR}/adjustments", tags=["adjustments"])
app.include_router(stock.router, prefix=f"{settings.API_V1_STR}/stock", tags=["stock"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])

@app.get("/")
def root():
    return {"message": "Welcome to StockMaster API"}

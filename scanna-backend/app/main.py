from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path
from datetime import datetime

from app.config import settings
from app.db.database import connect_to_mongo, close_mongo_connection
from app.routes import (
    auth_router,
    especialistas_router,
    registros_router,
    dashboard_router
)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionar inicio y cierre de la aplicación"""
    # Startup
    logger.info("🚀 Iniciando aplicación SCANNA...")
    await connect_to_mongo()
    
    # ✅ CORRECCIÓN: Crear directorios dentro de uploads/
    upload_base = Path(settings.upload_folder)
    upload_base.mkdir(exist_ok=True)
    
    originales_path = upload_base / "originales"
    mapas_path = upload_base / "mapas_atencion"
    
    originales_path.mkdir(exist_ok=True)
    mapas_path.mkdir(exist_ok=True)
    
    logger.info(f"📁 Directorio base: {upload_base.absolute()}")
    logger.info(f"📁 Originales: {originales_path.absolute()}")
    logger.info(f"📁 Mapas de atención: {mapas_path.absolute()}")
    
    logger.info("✅ Aplicación lista")
    
    yield
    
    # Shutdown
    logger.info("🛑 Cerrando aplicación...")
    await close_mongo_connection()
    logger.info("👋 Aplicación cerrada")


# Crear aplicación FastAPI
app = FastAPI(
    title="SCANNA API",
    description="API para detección de anemia mediante análisis de imágenes oculares",
    version="1.0.0",
    lifespan=lifespan
)


# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"📨 {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"📤 Status: {response.status_code}")
    return response


# Exception handler global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ Error no manejado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "message": str(exc) if settings.mongodb_uri.startswith("mongodb://localhost") else "Error procesando solicitud"
        }
    )


# Incluir routers
app.include_router(auth_router)
app.include_router(especialistas_router)
app.include_router(registros_router)
app.include_router(dashboard_router)


# ✅ Servir archivos estáticos
# IMPORTANTE: Los StaticFiles DEBEN montarse DESPUÉS de los routers

# Servir toda la carpeta uploads/ (RECOMENDADO - más simple)
upload_path = Path(settings.upload_folder)
if upload_path.exists():
    app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")
    logger.info(f"📂 Sirviendo /uploads desde {upload_path.absolute()}")
else:
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")
    logger.warning(f"⚠️ Directorio 'uploads' creado en {upload_path.absolute()}")


# Rutas básicas
@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "SCANNA API - Detección de Anemia",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from app.db.database import get_database
    
    try:
        db = get_database()
        # Verificar conexión a MongoDB
        await db.command("ping")
        
        # Verificar directorios de imágenes
        upload_base = Path(settings.upload_folder)
        dirs_status = {
            "uploads": upload_base.exists(),
            "originales": (upload_base / "originales").exists(),
            "mapas_atencion": (upload_base / "mapas_atencion").exists()
        }
        
        return {
            "status": "healthy",
            "database": "connected",
            "storage": dirs_status,
            "upload_path": str(upload_base.absolute()),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }
        )


@app.get("/api/info")
async def api_info():
    """Información de la API"""
    return {
        "name": "SCANNA API",
        "version": "1.0.0",
        "description": "API para detección de anemia mediante análisis de imágenes oculares",
        "endpoints": {
            "auth": "/auth",
            "especialistas": "/especialistas",
            "registros": "/registros",
            "dashboard": "/dashboard"
        },
        "static_files": {
            "uploads": "/uploads",
            "originales": "/uploads/originales",
            "mapas_atencion": "/uploads/mapas_atencion"
        },
        "documentation": "/docs"
    }


# Endpoint de debugging para listar archivos (solo en desarrollo)
if settings.mongodb_uri.startswith("mongodb://localhost"):
    @app.get("/debug/files")
    async def list_files():
        """Listar archivos en directorios de imágenes (solo desarrollo)"""
        try:
            upload_base = Path(settings.upload_folder)
            originales_path = upload_base / "originales"
            mapas_path = upload_base / "mapas_atencion"
            
            originales = list(originales_path.glob("*")) if originales_path.exists() else []
            mapas = list(mapas_path.glob("*")) if mapas_path.exists() else []
            
            return {
                "base_path": str(upload_base.absolute()),
                "originales": [f.name for f in originales if f.is_file()],
                "mapas_atencion": [f.name for f in mapas if f.is_file()],
                "total_originales": len([f for f in originales if f.is_file()]),
                "total_mapas": len([f for f in mapas if f.is_file()])
            }
        except Exception as e:
            return {"error": str(e)}
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cargar variables de entorno
load_dotenv()

# Obtener la URL de la base de datos (debe ser PostgreSQL, NO https://)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ ERROR: DATABASE_URL no está configurada en .env o es incorrecta")

# Verificar si la URL tiene caracteres extraños
if DATABASE_URL.startswith("https://"):
    raise ValueError("❌ ERROR: DATABASE_URL tiene un formato incorrecto. Debe empezar con 'postgresql://'")

# Configurar SQLAlchemy
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependencia para obtener la sesión de la BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

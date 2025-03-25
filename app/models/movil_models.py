from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class GraficasTablasMovil(Base):
    __tablename__ = 'graficas_tablas_movil'

    id_tabla_movil = Column(Integer, primary_key=True, index=True)
    id_sesion_fk = Column(Integer, ForeignKey("sesiones.id_sesion"), nullable=True)
    datos_graficas = Column(JSON, nullable=True)
    datos_mediapipe = Column(JSON, nullable=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    sesion = relationship("Sesion", back_populates="tabla_movil")

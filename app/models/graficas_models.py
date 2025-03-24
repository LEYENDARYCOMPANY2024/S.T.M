# models/graficas_models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime

from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Grafica(Base):
    __tablename__ = "graficas"

    id_grafica = Column(Integer, primary_key=True, index=True)
    nombre_grafica = Column(String, nullable=False)
    aceleracion_x = Column(Float)
    aceleracion_y = Column(Float)
    fecha_hora = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    lado_pierna_gf = Column(String, nullable=True)

    dispositivos = relationship("GraficaDispositivo", back_populates="grafica")



class GraficaDispositivo(Base):
    __tablename__ = "graficas_dispositivos"

    id_grafica_dispositivo = Column(Integer, primary_key=True, index=True)
    id_grafica_fk = Column(Integer, ForeignKey("graficas.id_grafica"), nullable=False)
    id_sesion_dispositivo_fk = Column(Integer, ForeignKey("sesion_dispositivo.id_sesion_dispositivo"), nullable=False)
    lado_pierna = Column(String, nullable=True)

    grafica = relationship("Grafica", back_populates="dispositivos")
    sesion_dispositivo = relationship("SesionDispositivo", back_populates="graficas")


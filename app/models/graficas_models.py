# models/graficas_models.py
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Grafica(Base):
    __tablename__ = "graficas"

    id_grafica = Column(Integer, primary_key=True, index=True)
    nombre_grafica = Column(String, nullable=False)
    datos_extra = Column(JSON, nullable=True)
    etiqueta = Column(String(255), nullable=True)
    aceleracion_x = Column(Numeric(10, 2))
    aceleracion_y = Column(Numeric(10, 2))
    aceleracion_z = Column(Numeric(10, 2))
    rotacion_x = Column(Numeric(10, 2))
    rotacion_y = Column(Numeric(10, 2))
    rotacion_z = Column(Numeric(10, 2))

    dispositivos = relationship("GraficaDispositivo", back_populates="grafica")


class GraficaDispositivo(Base):
    __tablename__ = "graficas_dispositivos"

    id_grafica_dispositivo = Column(Integer, primary_key=True, index=True)
    id_grafica_fk = Column(Integer, ForeignKey("graficas.id_grafica"), nullable=False)
    id_sesion_dispositivo_fk = Column(Integer, ForeignKey("sesion_dispositivo.id_sesion_dispositivo"), nullable=False)
    lado_pierna = Column(String, nullable=True)

    grafica = relationship("Grafica", back_populates="dispositivos")
    sesion_dispositivo = relationship("SesionDispositivo", back_populates="graficas")


from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class DispositivoIOT(Base):
    __tablename__ = "dispositivos_iot"
    id_dispositivo = Column(Integer, primary_key=True, index=True)
    nombre_dispositivo = Column(String, nullable=False)
    fecha_registro = Column(Date, nullable=False)
    tipo_de_dispositivo = Column(String, nullable=False)
    uuid = Column(String, unique=True, nullable=False)
    id_terapeuta_fk = Column(Integer, ForeignKey("terapeutas.id_terapeuta"), nullable=False)
    # models/dispositivos_models.py
    permite_envio = Column(Boolean, default=False)


    terapeuta = relationship("Terapeuta", back_populates="dispositivos")
    paciente_dispositivos = relationship("PacienteDispositivo", back_populates="dispositivo")

class PacienteDispositivo(Base):
    __tablename__ = "paciente_dispositivo"
    id_paciente_dispositivo = Column(Integer, primary_key=True, index=True)
    id_paciente_pd_fk = Column(Integer, ForeignKey("pacientes.id_paciente"), nullable=False)
    id_dispositivo_pd_fk = Column(Integer, ForeignKey("dispositivos_iot.id_dispositivo"), nullable=False)

    dispositivo = relationship("DispositivoIOT")
    paciente = relationship("Paciente")

class SesionDispositivo(Base):
    __tablename__ = "sesion_dispositivo"
    id_sesion_dispositivo = Column(Integer, primary_key=True, index=True)
    id_sesion_fk = Column(Integer, ForeignKey("sesiones.id_sesion"), nullable=False)
    id_dispositivo_pd_fk = Column(Integer, ForeignKey("paciente_dispositivo.id_paciente_dispositivo"), nullable=False)
    estado_activado = Column(String, default="desactivado")

    graficas = relationship("GraficaDispositivo", back_populates="sesion_dispositivo")
    paciente_dispositivo = relationship("PacienteDispositivo")

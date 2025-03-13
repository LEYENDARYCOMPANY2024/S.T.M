from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class EstadoDispositivoEnum(str, Enum):
    ACTIVADO = "activado"
    DESACTIVADO = "desactivado"

class DispositivoIOT(Base):
    __tablename__ = "dispositivos_iot"

    id_dispositivo = Column(Integer, primary_key=True, index=True)
    nombre_dispositivo = Column(String, nullable=False)
    fecha_registro = Column(Date, nullable=False)
    tipo_de_dispositivo = Column(String, nullable=False)
    uuid = Column(String, unique=True, nullable=False)

    paciente_dispositivos = relationship("PacienteDispositivo", back_populates="dispositivo")


class PacienteDispositivo(Base):
    __tablename__ = "paciente_dispositivo"

    id_paciente_dispositivo = Column(Integer, primary_key=True, index=True)
    id_paciente_pd_fk = Column(Integer, ForeignKey("pacientes.id_paciente"), nullable=False)
    id_dispositivo_pd_fk = Column(Integer, ForeignKey("dispositivos_iot.id_dispositivo"), nullable=False)
    estado_dispositivo = Column(String, default="activado")

    dispositivo = relationship("DispositivoIOT")
    paciente = relationship("Paciente")

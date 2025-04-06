# models/chat.py

from sqlalchemy import Column, Integer, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from pydantic import BaseModel, constr
from typing import Optional
import enum

# 🔹 Enum de remitente
class RemitenteEnum(str, enum.Enum):
    terapeuta = "terapeuta"
    paciente = "paciente"

# 📦 SQLAlchemy: tabla "chat"
class Chat(Base):
    __tablename__ = "chat"
    
    id_chat = Column(Integer, primary_key=True, index=True)
    iniciado_en = Column(DateTime, default=datetime.utcnow)
    id_terapeuta_paciente_c_fk = Column(Integer, ForeignKey("terapeuta_paciente.id_terapeuta_paciente"), nullable=False)

    mensajes = relationship("Mensaje", back_populates="chat")

# 📦 SQLAlchemy: tabla "mensajes"
class Mensaje(Base):
    __tablename__ = "mensajes"

    id_mensaje = Column(Integer, primary_key=True, index=True)
    id_chat_m_fk = Column(Integer, ForeignKey("chat.id_chat"), nullable=False)
    remitente = Column(Enum(RemitenteEnum), nullable=False)
    mensaje = Column(Text, nullable=False)
    enviado_en = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="mensajes")

# 📌 Pydantic: para crear mensajes
class MensajeCreate(BaseModel):
    id_chat_m_fk: int
    remitente: RemitenteEnum
    mensaje: constr(strip_whitespace=True, min_length=1)

# 📌 Pydantic: para respuesta de mensajes
class MensajeResponse(MensajeCreate):
    id_mensaje: int
    enviado_en: datetime

    class Config:
        from_attributes = True  # ✅ Pydantic v2

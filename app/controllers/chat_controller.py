# controllers/chat_controller.py

from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.chat_models import Mensaje, MensajeCreate, MensajeResponse

def guardar_mensaje(data: MensajeCreate, db: Session) -> MensajeResponse:
    nuevo = Mensaje(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return MensajeResponse(**nuevo.__dict__)

def obtener_historial(chat_id: int, db: Session) -> list[MensajeResponse]:
    mensajes = db.query(Mensaje).filter(Mensaje.id_chat_m_fk == chat_id).order_by(Mensaje.enviado_en.asc()).all()
    return [MensajeResponse(**m.__dict__) for m in mensajes]

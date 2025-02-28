from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from controllers.terapeuta_perfil_controllers import obtener_perfil, actualizar_perfil
from database import get_db
from models.terapeutas import TerapeutaResponse, TerapeutaBase
from controllers.token import verificar_token

router = APIRouter(prefix="/perfil", tags=["perfil"])

@router.get("/{terapeuta_id}", response_model=TerapeutaResponse)
def obtener_perfil_route(terapeuta_id: int, token: str = Depends(verificar_token), db: Session = Depends(get_db)):
    return obtener_perfil(terapeuta_id, db)

@router.put("/{terapeuta_id}", response_model=TerapeutaResponse)
def actualizar_perfil_route(terapeuta_id: int, datos: TerapeutaBase, db: Session = Depends(get_db)):
    return actualizar_perfil(terapeuta_id, datos, db)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.detalle_sesiones_controller import get_sesion_detalle, update_nota_evolutiva
from models.crear_sesiones_models import NotaEvolutivaUpdate

router = APIRouter()

# 📌 Ruta para obtener los detalles de una sesión
@router.get("/detalle_sesiones/{sesion_id}")
def obtener_detalle_sesion(sesion_id: int, db: Session = Depends(get_db)):
    sesion = get_sesion_detalle(db, sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return sesion

# 📌 Ruta para actualizar la nota evolutiva
@router.patch("/detalle_sesiones/{sesion_id}/nota")
def modificar_nota_evolutiva(sesion_id: int, nota: NotaEvolutivaUpdate, db: Session = Depends(get_db)):
    resultado = update_nota_evolutiva(db, sesion_id, nota.nota_evolutiva)  # 📌 Se pasa el JSON correctamente
    if "error" in resultado:
        raise HTTPException(status_code=404, detail=resultado["error"])
    return resultado

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.movil_models import GraficasTablasMovil
from models.movil_schemas import GraficasTablasMovilIn, GraficasTablasMovilOut

router = APIRouter()

@router.post("/graficas_movil", response_model=GraficasTablasMovilOut)
def subir_tabla_movil(datos: GraficasTablasMovilIn, db: Session = Depends(get_db)):
    existente = db.query(GraficasTablasMovil).filter(
        GraficasTablasMovil.id_sesion_fk == datos.id_sesion_fk
    ).first()

    if existente:
        existente.datos_graficas = datos.datos_graficas
        existente.datos_mediapipe = datos.datos_mediapipe
        db.commit()
        db.refresh(existente)
        return existente

    nuevo = GraficasTablasMovil(**datos.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo



@router.get("/graficas_movil/{id_sesion}", response_model=GraficasTablasMovilOut)
def obtener_tabla_por_sesion(id_sesion: int, db: Session = Depends(get_db)):
    tabla = db.query(GraficasTablasMovil).filter(
        GraficasTablasMovil.id_sesion_fk == id_sesion
    ).first()
    if not tabla:
        raise HTTPException(status_code=404, detail="Datos no encontrados")
    return tabla

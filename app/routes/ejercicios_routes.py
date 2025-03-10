from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from controllers.ejercicios_controller import obtener_niveles, obtener_ejercicios_por_nivel, cambiar_estado_nivel
from models.ejercicios_models import EstadoNivelEnum

router = APIRouter(prefix="/niveles")  # ✅ Corregimos la URL base

@router.get("/")
def listar_niveles(db: Session = Depends(get_db)):
    return obtener_niveles(db)

@router.get("/{id_nivel}/ejercicios")
def listar_ejercicios(id_nivel: int, db: Session = Depends(get_db)):
    return obtener_ejercicios_por_nivel(db, id_nivel)

@router.put("/pacientes/{id_paciente}/{id_nivel}")
def actualizar_estado_nivel(id_paciente: int, id_nivel: int, estado: EstadoNivelEnum, db: Session = Depends(get_db)):
    return cambiar_estado_nivel(db, id_paciente, id_nivel, estado)

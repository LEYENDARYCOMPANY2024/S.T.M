from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from controllers.ejercicios_controller import obtener_niveles, obtener_ejercicios_por_nivel, cambiar_estado_nivel
from models.ejercicios_models import EstadoNivelEnum

router = APIRouter()

@router.get("/pacientes/{id_paciente}/niveles")
def listar_niveles(id_paciente: int, db: Session = Depends(get_db)):
    niveles = obtener_niveles(db, id_paciente)
    return niveles  # 🔹 Ya no es necesario lanzar un error si no hay registros en paciente_nivel


@router.get("/pacientes/{id_paciente}/niveles/{id_nivel}/ejercicios")
def listar_ejercicios(id_paciente: int, id_nivel: int, db: Session = Depends(get_db)):
    return obtener_ejercicios_por_nivel(db, id_paciente, id_nivel)


@router.put("/pacientes/{id_paciente}/niveles/{id_nivel}")
def actualizar_estado_nivel(id_paciente: int, id_nivel: int, estado: EstadoNivelEnum, db: Session = Depends(get_db)):
    return cambiar_estado_nivel(db, id_paciente, id_nivel, estado)



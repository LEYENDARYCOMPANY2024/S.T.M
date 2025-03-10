from sqlalchemy.orm import Session
from models.ejercicios_models import Nivel, Ejercicio, NivelEjercicio, PacienteNivel, EstadoNivelEnum
from fastapi import HTTPException
from datetime import datetime

def obtener_niveles(db: Session):
    return db.query(Nivel).order_by(Nivel.orden).all()

def obtener_ejercicios_por_nivel(db: Session, id_nivel: int):
    ejercicios = db.query(Ejercicio).join(NivelEjercicio).filter(NivelEjercicio.id_nivel_fk == id_nivel).all()
    if not ejercicios:
        raise HTTPException(status_code=404, detail="No hay ejercicios para este nivel")
    return ejercicios

def cambiar_estado_nivel(db: Session, id_paciente: int, id_nivel: int, estado: EstadoNivelEnum):
    paciente_nivel = db.query(PacienteNivel).filter(
        PacienteNivel.id_paciente_fk == id_paciente,
        PacienteNivel.id_nivel_fk == id_nivel
    ).first()

    if not paciente_nivel:
        raise HTTPException(status_code=404, detail="Nivel no encontrado para el paciente")

    if estado == EstadoNivelEnum.desbloqueado:
        paciente_nivel.fecha_activacion = datetime.now()

    paciente_nivel.estado = estado
    db.commit()
    db.refresh(paciente_nivel)
    return paciente_nivel

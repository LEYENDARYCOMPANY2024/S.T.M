from sqlalchemy.orm import Session
from models.ejercicios_models import Nivel, Ejercicio, NivelEjercicio, PacienteNivel, EstadoNivelEnum
from fastapi import HTTPException
from datetime import datetime

def obtener_niveles(db: Session, id_paciente: int):
    # Obtener todos los niveles disponibles
    niveles = db.query(Nivel).order_by(Nivel.orden).all()

    # Obtener los estados de los niveles para el paciente
    paciente_niveles = {pn.id_nivel_fk: pn.estado for pn in db.query(PacienteNivel)
                        .filter(PacienteNivel.id_paciente_fk == id_paciente).all()}

    # Construir la respuesta con el estado correspondiente o "bloqueado" por defecto
    niveles_con_estado = [
        {
            "id_nivel": nivel.id_nivel,
            "nombre_nivel": nivel.nombre_nivel,
            "descripcion": nivel.descripcion,
            "orden": nivel.orden,
            "estado": paciente_niveles.get(nivel.id_nivel, EstadoNivelEnum.bloqueado).value  # Si no existe, se asume bloqueado
        }
        for nivel in niveles
    ]

    return niveles_con_estado

def obtener_ejercicios_por_nivel(db: Session, id_paciente: int, id_nivel: int):
    # Verificar si el nivel existe en la tabla de niveles
    nivel = db.query(Nivel).filter(Nivel.id_nivel == id_nivel).first()
    if not nivel:
        raise HTTPException(status_code=404, detail="Nivel no encontrado")

    # Obtener los ejercicios del nivel
    ejercicios = db.query(Ejercicio).join(NivelEjercicio).filter(
        NivelEjercicio.id_nivel_fk == id_nivel
    ).all()

    return ejercicios




def cambiar_estado_nivel(db: Session, id_paciente: int, id_nivel: int, estado: EstadoNivelEnum):
    paciente_nivel = db.query(PacienteNivel).filter(
        PacienteNivel.id_paciente_fk == id_paciente,
        PacienteNivel.id_nivel_fk == id_nivel
    ).first()

    if not paciente_nivel:
        # Si no existe, creamos un nuevo registro con el estado cambiado
        paciente_nivel = PacienteNivel(
            id_paciente_fk=id_paciente,
            id_nivel_fk=id_nivel,
            estado=estado,
            fecha_activacion=datetime.now() if estado == EstadoNivelEnum.desbloqueado else None
        )
        db.add(paciente_nivel)
    else:
        # Si ya existe, simplemente actualizamos su estado
        paciente_nivel.estado = estado
        if estado == EstadoNivelEnum.desbloqueado:
            paciente_nivel.fecha_activacion = datetime.now()

    db.commit()
    db.refresh(paciente_nivel)
    return paciente_nivel

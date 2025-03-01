from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.paciente_terapeuta_principal import Paciente
from controllers.paciente_terapeuta_principal_controller import create_paciente
from models.terapeutas import TerapeutaPaciente  # 🔹 Importamos la tabla relacional

router = APIRouter()

@router.get("/pacientes/activos")
def obtener_pacientes_activos(
    id_terapeuta: int,
    page: int = Query(1, alias="page", ge=1),
    per_page: int = Query(5, alias="per_page", ge=1, le=100),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * per_page

    pacientes = (
        db.query(Paciente)
        .join(TerapeutaPaciente, TerapeutaPaciente.id_paciente_tp_fk == Paciente.id_paciente)
        .filter(TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta)
        .filter(Paciente.estado_paciente == "activo")  # 🔹 Filtrar solo los activos
        .order_by(Paciente.id_paciente.asc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    total_pacientes = (
        db.query(func.count(Paciente.id_paciente))
        .join(TerapeutaPaciente, TerapeutaPaciente.id_paciente_tp_fk == Paciente.id_paciente)
        .filter(TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta)
        .filter(Paciente.estado_paciente == "activo")
        .scalar()
    )

    total_pages = (total_pacientes // per_page) + (1 if total_pacientes % per_page > 0 else 0)

    return {
        "page": page,
        "per_page": per_page,
        "total_pacientes": total_pacientes,
        "total_pages": total_pages,
        "pacientes": pacientes
    }


@router.get("/pacientes/inactivos")
def obtener_pacientes_inactivos(
    id_terapeuta: int,
    page: int = Query(1, alias="page", ge=1),
    per_page: int = Query(5, alias="per_page", ge=1, le=100),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * per_page

    pacientes = (
        db.query(Paciente)
        .join(TerapeutaPaciente, TerapeutaPaciente.id_paciente_tp_fk == Paciente.id_paciente)
        .filter(TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta)
        .filter(Paciente.estado_paciente == "inactivo")  # 🔹 Filtrar solo los inactivos
        .order_by(Paciente.id_paciente.asc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    total_pacientes = (
        db.query(func.count(Paciente.id_paciente))
        .join(TerapeutaPaciente, TerapeutaPaciente.id_paciente_tp_fk == Paciente.id_paciente)
        .filter(TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta)
        .filter(Paciente.estado_paciente == "inactivo")
        .scalar()
    )

    total_pages = (total_pacientes // per_page) + (1 if total_pacientes % per_page > 0 else 0)

    return {
        "page": page,
        "per_page": per_page,
        "total_pacientes": total_pacientes,
        "total_pages": total_pages,
        "pacientes": pacientes
    }



@router.post("/pacientes")
def agregar_paciente(paciente_data: dict, id_terapeuta: int, db: Session = Depends(get_db)):
    nuevo_paciente = create_paciente(db, paciente_data, id_terapeuta)
    return nuevo_paciente  # Devuelve el paciente con su código

@router.put("/pacientes/{id_paciente}/estado")
def cambiar_estado_paciente(id_paciente: int, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()

    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # Alternar el estado entre 'activo' e 'inactivo'
    paciente.estado_paciente = "inactivo" if paciente.estado_paciente == "activo" else "activo"

    db.commit()
    db.refresh(paciente)

    return {"id_paciente": paciente.id_paciente, "estado_paciente": paciente.estado_paciente}

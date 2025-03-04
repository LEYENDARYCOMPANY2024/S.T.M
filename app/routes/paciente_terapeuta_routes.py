from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from database import get_db
from models.paciente_terapeuta_principal import Paciente
from controllers.paciente_terapeuta_principal_controller import create_or_assign_paciente, toggle_estado_paciente
from models.terapeutas import TerapeutaPaciente  # 🔹 Importamos la tabla relacional

router = APIRouter()

@router.get("/pacientes/activos")
def obtener_pacientes_activos(
    id_terapeuta: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * per_page

    # Buscar si el terapeuta tiene pacientes asignados
    if not db.query(TerapeutaPaciente).filter(TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta).first():
        return {
            "page": page,
            "per_page": per_page,
            "total_pacientes": 0,
            "total_pages": 0,
            "pacientes": []
        }

    query = (
        db.query(Paciente)
        .join(TerapeutaPaciente, TerapeutaPaciente.id_paciente_tp_fk == Paciente.id_paciente)
        .filter(
            TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta,
            Paciente.estado_paciente == "activo"
        )
    )
    if search:
        search_like = f"%{search}%"
        query = query.filter(
            or_(
                Paciente.nombre.ilike(search_like),
                Paciente.primer_apellido.ilike(search_like),
                Paciente.segundo_apellido.ilike(search_like)
            )
        )

    total_pacientes = query.count()
    total_pages = (total_pacientes // per_page) + (1 if total_pacientes % per_page else 0)

    pacientes = (
        query
        .order_by(Paciente.id_paciente.asc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

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
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * per_page

    # Buscar si el terapeuta tiene pacientes asignados
    if not db.query(TerapeutaPaciente).filter(TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta).first():
        return {
            "page": page,
            "per_page": per_page,
            "total_pacientes": 0,
            "total_pages": 0,
            "pacientes": []
        }

    query = (
        db.query(Paciente)
        .join(TerapeutaPaciente, TerapeutaPaciente.id_paciente_tp_fk == Paciente.id_paciente)
        .filter(
            TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta,
            Paciente.estado_paciente == "inactivo"
        )
    )
    if search:
        search_like = f"%{search}%"
        query = query.filter(
            or_(
                Paciente.nombre.ilike(search_like),
                Paciente.primer_apellido.ilike(search_like),
                Paciente.segundo_apellido.ilike(search_like)
            )
        )

    total_pacientes = query.count()
    total_pages = (total_pacientes // per_page) + (1 if total_pacientes % per_page else 0)

    pacientes = (
        query
        .order_by(Paciente.id_paciente.asc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return {
        "page": page,
        "per_page": per_page,
        "total_pacientes": total_pacientes,
        "total_pages": total_pages,
        "pacientes": pacientes
    }



@router.post("/pacientes")
def agregar_paciente(
    paciente_data: dict,
    id_terapeuta: int,
    db: Session = Depends(get_db)
):
    try:
        resultado = create_or_assign_paciente(db, paciente_data, id_terapeuta)
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/pacientes/{id_paciente}/estado")
def cambiar_estado_paciente(
    id_paciente: int,
    id_terapeuta: int = Query(..., description="ID del terapeuta"),
    action: str = Body(..., embed=True),
    motivo: str = Body(None, embed=True),
    create_new_record: bool = Body(False, embed=True),
    db: Session = Depends(get_db)
):
    """
    Body esperado:
    {
      "action": "inactivate" o "reactivate",
      "motivo": "Texto opcional",
      "create_new_record": true/false
    }
    """
    try:
        resultado = toggle_estado_paciente(
            db=db,
            id_paciente=id_paciente,
            id_terapeuta=id_terapeuta,
            action=action,
            motivo=motivo,
            create_new_record=create_new_record
        )
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
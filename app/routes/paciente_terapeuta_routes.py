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
    
@router.get("/pacientes/buscar")
def buscar_paciente_por_codigo(codigo: str, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.codigo == codigo).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado.")
    return paciente  # ✅ Devolver directamente el paciente si existe

@router.post("/pacientes/asignar")
def asignar_paciente_a_terapeuta(id_paciente: int, id_terapeuta: int, db: Session = Depends(get_db)):
    """
    Asigna un paciente existente a un terapeuta si está inactivo.
    Si está activo con otro terapeuta, no se puede reasignar hasta que se desactive.
    """

    print(f"🔍 Verificando asignación para id_paciente={id_paciente}, id_terapeuta={id_terapeuta}")

    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()
    if not paciente:
        print("❌ Paciente no encontrado")
        raise HTTPException(status_code=404, detail="Paciente no encontrado.")

    print(f"✅ Paciente encontrado: {paciente.nombre}, Estado: {paciente.estado_paciente}")

    # ✅ Si el paciente está activo con otro terapeuta, no permitir reasignación
    if paciente.estado_paciente == "activo":
        print("🚫 El paciente ya está activo con otro terapeuta.")
        raise HTTPException(status_code=400, detail="Este paciente ya está activo con otro terapeuta y no puede ser reasignado.")

    # ✅ Eliminar cualquier relación anterior si el paciente estaba inactivo
    db.query(TerapeutaPaciente).filter(TerapeutaPaciente.id_paciente_tp_fk == id_paciente).delete()

    # ✅ Crear la nueva relación con el nuevo terapeuta
    nueva_relacion = TerapeutaPaciente(
        id_terapeuta_tp_fk=id_terapeuta,
        id_paciente_tp_fk=id_paciente
    )
    db.add(nueva_relacion)
    db.commit()

    print("✅ Paciente asignado correctamente")
    return {"message": "Paciente asignado correctamente a un nuevo terapeuta."}


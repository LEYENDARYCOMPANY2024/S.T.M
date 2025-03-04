import random
import string
from datetime import date
from sqlalchemy.orm import Session
from models.paciente_terapeuta_principal import Paciente
from models.terapeutas import TerapeutaPaciente
from models.historial_progreso import HistorialProgreso

def generar_codigo_paciente():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def create_or_assign_paciente(db: Session, paciente_data: dict, id_terapeuta: int):
    """
    Busca un paciente por su código único. Si ya existe, lo asigna al terapeuta.
    Si no existe, crea un nuevo paciente y lo asigna.
    """

    paciente_existente = db.query(Paciente).filter(Paciente.codigo == paciente_data.get("codigo")).first()

    if paciente_existente:
        # Verificar si ya está asignado al terapeuta
        relacion_existente = db.query(TerapeutaPaciente).filter(
            TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta,
            TerapeutaPaciente.id_paciente_tp_fk == paciente_existente.id_paciente
        ).first()

        if relacion_existente:
            raise ValueError("Este paciente ya está asignado a este terapeuta.")

        # Si el paciente existe pero con otro terapeuta, solo se crea la relación
        nueva_relacion = TerapeutaPaciente(
            id_terapeuta_tp_fk=id_terapeuta,
            id_paciente_tp_fk=paciente_existente.id_paciente
        )
        db.add(nueva_relacion)
        db.commit()
        return {"message": "Paciente asignado a nuevo terapeuta.", "codigo": paciente_existente.codigo}

    # 🔹 SOLO CAMPOS QUE ESTÁN EN EL FORMULARIO
    required_fields = ["nombre", "primer_apellido", "edad", "genero"]
    for field in required_fields:
        if not paciente_data.get(field):
            raise ValueError(f"Falta el campo obligatorio: {field}")

    paciente_data["estado_paciente"] = "activo"
    paciente_data["codigo"] = generar_codigo_paciente()

    nuevo_paciente = Paciente(
        nombre=paciente_data["nombre"],
        primer_apellido=paciente_data["primer_apellido"],
        segundo_apellido=paciente_data.get("segundo_apellido"),  # Opcional
        edad=paciente_data["edad"],
        codigo=paciente_data["codigo"],
        genero=paciente_data["genero"],
        estado_paciente="activo",
    )

    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)

    nueva_relacion = TerapeutaPaciente(
        id_terapeuta_tp_fk=id_terapeuta,
        id_paciente_tp_fk=nuevo_paciente.id_paciente
    )
    db.add(nueva_relacion)
    db.commit()

    historial = HistorialProgreso(
        id_terapeuta_paciente_fk=nueva_relacion.id_terapeuta_paciente,
        fecha_inicio=date.today(),
        fecha_fin=None,
        resumen="Paciente agregado"
    )
    db.add(historial)
    db.commit()

    return {"message": "Paciente registrado exitosamente.", "codigo": nuevo_paciente.codigo}


def toggle_estado_paciente(
    db: Session,
    id_paciente: int,
    id_terapeuta: int,
    action: str,
    motivo: str = None,
    create_new_record: bool = False
):
    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()
    if not paciente:
        raise ValueError("Paciente no encontrado")

    relacion = db.query(TerapeutaPaciente).filter(
        TerapeutaPaciente.id_paciente_tp_fk == id_paciente,
        TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta
    ).first()

    if not relacion:
        raise ValueError("El paciente no está asignado a este terapeuta")

    if action == "inactivate":
        paciente.estado_paciente = "inactivo"
        db.commit()
        db.refresh(paciente)

        ultimo_historial = db.query(HistorialProgreso).filter(
            HistorialProgreso.id_terapeuta_paciente_fk == relacion.id_terapeuta_paciente,
            HistorialProgreso.fecha_fin.is_(None)
        ).order_by(HistorialProgreso.id_historial.desc()).first()

        if ultimo_historial:
            ultimo_historial.fecha_fin = date.today()
            db.commit()

        return {"message": "Paciente en estado inactivo exitosamente"}

    elif action == "reactivate":
        # ✅ Verificar si se ingresó un motivo
        if not motivo:
            raise ValueError("Es obligatorio proporcionar un motivo para la reactivación.")

        paciente.estado_paciente = "activo"
        db.commit()
        db.refresh(paciente)

        if create_new_record:
            nuevo_resumen = f"Reactivado: {motivo}"

            nuevo_periodo = HistorialProgreso(
                id_terapeuta_paciente_fk=relacion.id_terapeuta_paciente,
                fecha_inicio=date.today(),
                fecha_fin=None,
                resumen=nuevo_resumen
            )
            db.add(nuevo_periodo)
            db.commit()

        return {"message": "Paciente reactivado exitosamente"}

    else:
        raise ValueError("Acción inválida. Usa 'inactivate' o 'reactivate'.")



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

    # Si no existe, lo creamos
    required_fields = ["nombre", "primer_apellido", "edad", "genero", "nombre_usuario_p", "contrasena_p", "correo"]
    for field in required_fields:
        if not paciente_data.get(field):
            raise ValueError(f"Falta el campo obligatorio: {field}")

    paciente_data["estado_paciente"] = "activo"
    paciente_data["codigo"] = generar_codigo_paciente()

    nuevo_paciente = Paciente(**paciente_data)
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

    # Aquí puedes agregar lógica para enviar un correo con el código al paciente
    # send_email(paciente_data["correo"], f"Tu código de paciente: {paciente_data['codigo']}")

    return {"message": "Paciente registrado exitosamente.", "codigo": nuevo_paciente.codigo}

def toggle_estado_paciente(
    db: Session,
    id_paciente: int,
    id_terapeuta: int,
    action: str,              # "inactivate" o "reactivate"
    motivo: str = None,       # Usado para la reactivación
    create_new_record: bool = False
):
    """
    Cambia el estado del paciente (activo/inactivo).
    - action = "inactivate": se cierra el periodo en historial_progreso y se pone estado_paciente = "inactivo".
    - action = "reactivate": se pregunta si se desea crear nuevo periodo; si sí, se crea con "Reactivado: <motivo>".
    """

    # Verificar que exista el paciente
    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()
    if not paciente:
        raise ValueError("Paciente no encontrado")

    # Verificar relación con el terapeuta
    relacion = db.query(TerapeutaPaciente).filter(
        TerapeutaPaciente.id_paciente_tp_fk == id_paciente,
        TerapeutaPaciente.id_terapeuta_tp_fk == id_terapeuta
    ).first()

    if not relacion:
        raise ValueError("El paciente no está asignado a este terapeuta")

    if action == "inactivate":
        # Pasar a inactivo
        paciente.estado_paciente = "inactivo"
        db.commit()
        db.refresh(paciente)

        # Cerrar el último periodo abierto en historial_progreso
        # (buscamos el historial más reciente sin fecha_fin)
        ultimo_historial = db.query(HistorialProgreso).filter(
            HistorialProgreso.id_terapeuta_paciente_fk == relacion.id_terapeuta_paciente,
            HistorialProgreso.fecha_fin.is_(None)
        ).order_by(HistorialProgreso.id_historial.desc()).first()

        if ultimo_historial:
            ultimo_historial.fecha_fin = date.today()
            db.commit()

        return {"message": "Paciente en estado inactivo exitosamente"}

    elif action == "reactivate":
        # Pasar a activo
        paciente.estado_paciente = "activo"
        db.commit()
        db.refresh(paciente)

        # Si el usuario desea crear un nuevo registro en historial_progreso
        if create_new_record:
            nuevo_resumen = "Reactivado"
            if motivo:
                nuevo_resumen += f": {motivo}"

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


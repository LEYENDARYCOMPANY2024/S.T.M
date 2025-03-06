from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.historial_clinico_model import HistorialClinicoCreate, HistorialClinicoResponse
from controllers.historial_clinico_controller import get_historial_by_patient, create_or_update_historial
from database import get_db
from models.paciente_terapeuta_principal import Paciente
from models.database_historial_model import PacienteUpdate
from models.enum_paciente import EstadoCivilEnum

router = APIRouter(prefix="/historial", tags=["Historial Clínico"])

@router.get("/{id_paciente}", response_model=HistorialClinicoResponse)
def read_historial(id_paciente: int, db: Session = Depends(get_db)):
    """
    Obtiene el historial clínico del paciente por su ID.
    Si no existe, se crea automáticamente un historial vacío en la base de datos.
    """
    return get_historial_by_patient(db, id_paciente)

@router.post("/")
def post_historial(historial: HistorialClinicoCreate, db: Session = Depends(get_db)):
    """
    Crea o actualiza el historial clínico del paciente.
    Si el historial no existe, se creará uno nuevo automáticamente.
    """
    return create_or_update_historial(db, historial)

@router.get("/paciente/{id_paciente}")
def get_paciente_info(id_paciente: int, db: Session = Depends(get_db)):
    """
    Obtiene los datos básicos del paciente para mostrarlos en el formulario.
    """
    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()
    if not paciente:
        return {"error": "Paciente no encontrado."}
    
    return {
        "nombre": paciente.nombre,
        "primer_apellido": paciente.primer_apellido,
        "segundo_apellido": paciente.segundo_apellido,
        "genero": paciente.genero,
        "edad": paciente.edad,
        "estado_civil": paciente.estado_civil,
        "escolaridad": paciente.escolaridad,
        "ocupacion": paciente.ocupacion.value if paciente.ocupacion else None
    }

@router.put("/paciente/{id_paciente}")
def update_paciente(id_paciente: int, paciente_update: PacienteUpdate, db: Session = Depends(get_db)):
    paciente = db.query(Paciente).filter(Paciente.id_paciente == id_paciente).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    try:
        # 🔹 Asegurar que el estado civil es uno de los valores permitidos en el ENUM
        estado_civil_permitidos = [e.value for e in EstadoCivilEnum]

        if paciente_update.estado_civil not in estado_civil_permitidos:
            raise HTTPException(status_code=400, detail=f"Estado civil '{paciente_update.estado_civil}' no es válido. Opciones permitidas: {estado_civil_permitidos}")

        paciente.estado_civil = paciente_update.estado_civil  # ✅ Guardar directamente el valor correcto del ENUM

        # 🔹 Actualizar los demás datos
        paciente.nombre = paciente_update.nombre
        paciente.primer_apellido = paciente_update.primer_apellido
        paciente.segundo_apellido = paciente_update.segundo_apellido
        paciente.edad = paciente_update.edad
        paciente.genero = paciente_update.genero
        paciente.escolaridad = paciente_update.escolaridad
        paciente.ocupacion = paciente_update.ocupacion

        db.commit()
        db.refresh(paciente)

        return {"message": "✅ Datos del paciente actualizados correctamente"}

    except Exception as e:
        print(f"❌ Error en el servidor: {str(e)}")  
        raise HTTPException(status_code=500, detail="Error interno del servidor")



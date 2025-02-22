from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, constr
from typing import Literal
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Obtener credenciales de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Verificar que existan las credenciales
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("⚠️ Error: SUPABASE_URL o SUPABASE_KEY no están configuradas en .env")

# Crear el cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Iniciar FastAPI
app = FastAPI()

# Definición de ENUMS según tu base de datos con valores manuales en la clase
GeneroEnum = Literal['masculino', 'femenino']
EstadoCivilEnum = Literal['soltero/a', 'casado/a', 'divorciado/a', 'viudo/a', 'union libre', 'separado/a']
EscolaridadEnum = Literal['primaria', 'secundaria', 'preparatoria', 'licenciatura', 'maestria', 'doctorado', 'otro']
OcupacionEnum = Literal['empleado/a', 'freelance', 'autónomo', 'empleador/a', 'desempleado/a', 'estudiante', 'jubilado/a', 'pensionado/a', 'otro']
EstadoPacienteEnum = Literal['activo', 'inactivo']

# Modelo de datos para el paciente
class Paciente(BaseModel):
    nombre: constr(strip_whitespace=True, min_length=1, max_length=100)
    primer_apellido: constr(strip_whitespace=True, min_length=1, max_length=100)
    segundo_apellido: constr(strip_whitespace=True, max_length=100)
    edad: int
    codigo: constr(strip_whitespace=True, min_length=1, max_length=50)
    genero: GeneroEnum
    estado_civil: EstadoCivilEnum = None
    escolaridad: EscolaridadEnum = None
    ocupacion: OcupacionEnum
    nombre_usuario_p: constr(strip_whitespace=True, min_length=1, max_length=100)
    contrasena_p: str
    estado_paciente: EstadoPacienteEnum

    class Config:
        # Especificar que estos ENUM deben ser usados en la documentación de Swagger
        use_enum_values = True

# Endpoint para insertar un paciente
@app.post("/pacientes/", response_model=dict)
async def create_paciente(paciente: Paciente):
    if paciente.edad <= 0 or paciente.edad >= 120:
        raise HTTPException(status_code=400, detail="❌ Edad fuera de rango permitido (1-119)")
    
    try:
        data = paciente.dict()
        response = supabase.table("pacientes").insert(data).execute()
        if response.data:
            return {"message": "✅ Paciente registrado con éxito", "paciente": response.data}
        else:
            raise HTTPException(status_code=400, detail="❌ No se pudo registrar el paciente")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Error al insertar paciente: {str(e)}")

# Endpoint para obtener todos los pacientes
@app.get("/obtener_pacientes/", response_model=dict)
async def get_pacientes():
    try:
        response = supabase.table("pacientes").select("*").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ Error al obtener pacientes: {str(e)}")

from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from sqlalchemy.orm import Session
from controllers.terapeuta_perfil_controllers import obtener_perfil, actualizar_perfil
from database import get_db
from models.terapeutas import TerapeutaResponse, TerapeutaBase
from controllers.token import verificar_token
from models.terapeutas import Terapeuta

router = APIRouter(prefix="/perfil", tags=["perfil"])

@router.get("/{terapeuta_id}", response_model=TerapeutaResponse)
def obtener_perfil_route(terapeuta_id: int, token: str = Depends(verificar_token), db: Session = Depends(get_db)):
    return obtener_perfil(terapeuta_id, db)

@router.put("/{terapeuta_id}", response_model=TerapeutaResponse)
def actualizar_perfil_route(terapeuta_id: int, datos: TerapeutaBase, db: Session = Depends(get_db)):
    return actualizar_perfil(terapeuta_id, datos, db)

@router.post("/{terapeuta_id}/subir-archivos")
def subir_archivos_perfil(
    terapeuta_id: int,
    imagen: UploadFile = File(None),
    cedula: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    terapeuta = db.query(Terapeuta).filter(Terapeuta.id_terapeuta == terapeuta_id).first()
    if not terapeuta:
        raise HTTPException(status_code=404, detail="❌ Terapeuta no encontrado")

    if imagen:
        if not imagen.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="❌ Solo se permiten imágenes en la foto de perfil")
        terapeuta.foto_perfil = imagen.file.read()

    if cedula:
        if not cedula.content_type == "application/pdf":
            raise HTTPException(status_code=400, detail="❌ Solo se permiten archivos PDF en la cédula profesional")
        terapeuta.documento_cedula = cedula.file.read()

    db.commit()
    return {"msg": "✅ Archivos subidos correctamente"}

@router.get("/{terapeuta_id}/foto")
def obtener_foto_perfil(terapeuta_id: int, db: Session = Depends(get_db)):
    terapeuta = db.query(Terapeuta).filter(Terapeuta.id_terapeuta == terapeuta_id).first()
    if not terapeuta or not terapeuta.foto_perfil:
        raise HTTPException(status_code=404, detail="❌ Imagen no encontrada")
    
    return StreamingResponse(BytesIO(terapeuta.foto_perfil), media_type="image/jpeg")


@router.get("/{terapeuta_id}/cedula")
def obtener_cedula_pdf(terapeuta_id: int, db: Session = Depends(get_db)):
    terapeuta = db.query(Terapeuta).filter(Terapeuta.id_terapeuta == terapeuta_id).first()
    if not terapeuta or not terapeuta.documento_cedula:
        raise HTTPException(status_code=404, detail="❌ Cédula no encontrada")

    return StreamingResponse(BytesIO(terapeuta.documento_cedula), media_type="application/pdf")

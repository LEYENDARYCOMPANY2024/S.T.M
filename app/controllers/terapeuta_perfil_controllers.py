from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.terapeutas import Terapeuta as TerapeutaModel, TerapeutaResponse, TerapeutaBase

def obtener_perfil(terapeuta_id: int, db: Session = Depends(get_db)):
    terapeuta = db.query(TerapeutaModel).filter(TerapeutaModel.id_terapeuta == terapeuta_id).first()
    if not terapeuta:
        raise HTTPException(status_code=404, detail="Terapeuta no encontrado")
    
    return TerapeutaResponse(**terapeuta.__dict__)  # Convertir en el esquema de respuesta

def actualizar_perfil(terapeuta_id: int, datos: TerapeutaBase, db: Session = Depends(get_db)):
    terapeuta = db.query(TerapeutaModel).filter(TerapeutaModel.id_terapeuta == terapeuta_id).first()
    if not terapeuta:
        raise HTTPException(status_code=404, detail="Terapeuta no encontrado")
    
    # Evitar actualizar la contraseña desde este endpoint
    datos_dict = datos.dict(exclude_unset=True, exclude={"contrasena"})
    for key, value in datos_dict.items():
        setattr(terapeuta, key, value)

    db.commit()
    db.refresh(terapeuta)
    return TerapeutaResponse(**terapeuta.__dict__)  # Convertir en el esquema de respuesta

from sqlalchemy.orm import Session
from models.crear_sesiones_models import Sesion

# 📌 Obtener detalles de una sesión específica
def get_sesion_detalle(db: Session, sesion_id: int):
    return db.query(Sesion).filter(Sesion.id_sesion == sesion_id).first()

# 📌 Actualizar la nota evolutiva
def update_nota_evolutiva(db: Session, sesion_id: int, nota_evolutiva: str):
    sesion = db.query(Sesion).filter(Sesion.id_sesion == sesion_id).first()
    if sesion:
        sesion.nota_evolutiva = nota_evolutiva
        db.commit()
        return {"message": "Nota evolutiva actualizada correctamente"}
    return {"error": "Sesión no encontrada"}

# 📌 **Actualizar la descripción de la sesión**
def update_descripcion_sesion(db: Session, sesion_id: int, nueva_descripcion: str):
    sesion = db.query(Sesion).filter(Sesion.id_sesion == sesion_id).first()
    if sesion:
        sesion.descripcion_sesion = nueva_descripcion  # ✅ Se actualiza la descripción
        db.commit()
        return {"message": "Descripción actualizada correctamente"}
    return {"error": "Sesión no encontrada"}

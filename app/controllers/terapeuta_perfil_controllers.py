from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.terapeutas import Terapeuta as TerapeutaModel, TerapeutaResponse, TerapeutaBase

def obtener_perfil(terapeuta_id: int, db: Session = Depends(get_db)):
    terapeuta = db.query(TerapeutaModel).filter(TerapeutaModel.id_terapeuta == terapeuta_id).first()
    if not terapeuta:
        raise HTTPException(status_code=404, detail="❌ Terapeuta no encontrado")
    
    return TerapeutaResponse(**terapeuta.__dict__)  # Convertir en el esquema de respuesta

<<<<<<< HEAD
def actualizar_perfil(terapeuta_id: int, datos: TerapeutaBase, db: Session):
    terapeuta = db.query(TerapeutaModel).filter(TerapeutaModel.id_terapeuta == terapeuta_id).first()
    if not terapeuta:
        raise HTTPException(status_code=404, detail="❌ Terapeuta no encontrado")

    # 📌 Convertir el modelo a diccionario excluyendo `contrasena`
    datos_dict = datos.dict(exclude_unset=True)

    # 📌 Si `contrasena` no está en los datos, mantener la existente
    if "contrasena" not in datos_dict:
        datos_dict["contrasena"] = terapeuta.contrasena  # ✅ Mantener la contraseña actual

    for key, value in datos_dict.items():
        setattr(terapeuta, key, value)

    db.commit()
    db.refresh(terapeuta)
    return TerapeutaResponse(**terapeuta.__dict__)  # Convertir en el esquema de respuesta
=======

def actualizar_perfil(terapeuta_id: int, datos: TerapeutaBase, db: Session = Depends(get_db)):
    try:
        # Print debug info
        print(f"🔍 Actualizando perfil para terapeuta_id: {terapeuta_id}")
        print(f"📊 Datos recibidos: {datos.dict()}")
        
        # Find the therapist
        terapeuta = db.query(TerapeutaModel).filter(TerapeutaModel.id_terapeuta == terapeuta_id).first()
        if not terapeuta:
            print(f"❌ Terapeuta con ID {terapeuta_id} no encontrado")
            raise HTTPException(status_code=404, detail="❌ Terapeuta no encontrado")
        
        print(f"✅ Terapeuta encontrado: {terapeuta.nombre} {terapeuta.primer_apellido}")
        
        # Convert the model to a dictionary and exclude unset values
        datos_dict = datos.model_dump(exclude_unset=True)
        print(f"📊 Datos a actualizar: {datos_dict}")
        
        # Update terapeuta attributes
        for key, value in datos_dict.items():
            if hasattr(terapeuta, key):
                print(f"🔄 Actualizando {key}: {getattr(terapeuta, key)} → {value}")
                setattr(terapeuta, key, value)
            else:
                print(f"⚠️ Campo no encontrado en modelo: {key}")
        
        # Save changes
        db.commit()
        print("✅ Cambios guardados en la base de datos")
        
        # Refresh to get updated data
        db.refresh(terapeuta)
        return TerapeutaResponse(**terapeuta.__dict__)
    
    except Exception as e:
        db.rollback()
        print(f"❌ Error en actualizar_perfil: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"❌ Error interno: {str(e)}")
>>>>>>> pruebas

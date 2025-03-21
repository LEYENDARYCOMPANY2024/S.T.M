# routes/graficas_routes.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from database import get_db
from controllers.graficas_controller import guardar_datos_sensor, etiquetar_datos, exportar_datos_csv, importar_csv

router = APIRouter()

@router.post("/graficas/datos")
def recibir_dato_sensor(datos: dict, db: Session = Depends(get_db)):
    return guardar_datos_sensor(db, datos)

@router.put("/graficas/guardar/{id_sesion_dispositivo}")
def guardar_etiqueta(id_sesion_dispositivo: int, etiqueta: str = Query(...), db: Session = Depends(get_db)):
    return etiquetar_datos(db, id_sesion_dispositivo, etiqueta)

@router.get("/graficas/exportar/{id_sesion_dispositivo}")
def exportar_csv(id_sesion_dispositivo: int, db: Session = Depends(get_db)):
    return exportar_datos_csv(db, id_sesion_dispositivo)

@router.post("/graficas/importar")
def importar_csv_route(
    file: UploadFile = File(...),
    etiqueta: str = Form(...),
    db: Session = Depends(get_db)
):
    return importar_csv(file, etiqueta, db)
# routes/graficas_routes.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.graficas_controller import guardar_datos_sensor, exportar_datos_csv, importar_csv
from models.dispositivos_schemas import DatosSensor
from models.graficas_models import GraficaDispositivo, Grafica
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.put("/graficas/datos")
def recibir_dato_sensor(datos: DatosSensor, db: Session = Depends(get_db)):
    """
    Recibe datos de sensor (MPU, etc.) en JSON, y los guarda/actualiza
    en la tabla 'graficas' y 'graficas_dispositivos'.
    """
    return guardar_datos_sensor(db, datos.model_dump())


@router.get("/graficas/exportar/{id_sesion_dispositivo}")
def exportar_csv(id_sesion_dispositivo: int, db: Session = Depends(get_db)):
    """
    Exporta en CSV los datos de la gráfica asociados a la sesión
    (buscando en 'graficas' y 'graficas_dispositivos').
    """
    return exportar_datos_csv(db, id_sesion_dispositivo)


@router.post("/graficas/importar")
def importar_csv_route(
    file: UploadFile = File(...),
    etiqueta: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Importa un CSV y lo guarda como gráficas nuevas con la etiqueta dada.
    """
    return importar_csv(file, etiqueta, db)


@router.get("/graficas/exportar_historial/{id_sesion_dispositivo}")
def exportar_historial_csv(id_sesion_dispositivo: int, db: Session = Depends(get_db)):
    """
    Exporta solo la parte de 'datos_extra' (historial) de la gráfica
    asociada a la sesión dada.
    """
    relacion = db.query(GraficaDispositivo).filter(
        GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo
    ).first()

    if not relacion:
        raise HTTPException(status_code=404, detail="No se encontró la relación con la gráfica")

    grafica = db.query(Grafica).filter(Grafica.id_grafica == relacion.id_grafica_fk).first()

    if not grafica or not grafica.datos_extra:
        raise HTTPException(status_code=404, detail="No hay datos en el historial")

    historial = grafica.datos_extra

    output = StringIO()
    writer = csv.writer(output)

    # Encabezado
    writer.writerow(["fecha_hora", "acel_x", "acel_y", "acel_z", "rot_x", "rot_y", "rot_z"])

    for item in historial:
        writer.writerow([
            item.get("fecha_hora", ""),
            item.get("aceleracion_x", 0.0),
            item.get("aceleracion_y", 0.0),
            item.get("aceleracion_z", 0.0),
            item.get("rotacion_x", 0.0),
            item.get("rotacion_y", 0.0),
            item.get("rotacion_z", 0.0)
        ])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=historial_datos_extra.csv"
    })


@router.get("/graficas/historial/{id_sesion_dispositivo}")
def obtener_historial_datos_extra(id_sesion_dispositivo: int, db: Session = Depends(get_db)):
    """
    Retorna el historial (datos_extra) de la primera gráfica asociada a una sesión.
    """
    grafica = (
        db.query(Grafica)
        .join(GraficaDispositivo, Grafica.id_grafica == GraficaDispositivo.id_grafica_fk)
        .filter(GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo)
        .first()
    )

    if not grafica:
        raise HTTPException(status_code=404, detail="No se encontró gráfica para esta sesión")

    return {"historial": grafica.datos_extra or []}

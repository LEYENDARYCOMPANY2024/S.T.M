# routes/graficas_routes.py

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from controllers.graficas_controller import guardar_datos_sensor_minimal, importar_csv
from models.dispositivos_schemas import DatosSensor
from models.graficas_models import Grafica
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.put("/graficas/datos")
def recibir_dato_sensor(datos: DatosSensor, db: Session = Depends(get_db)):
    """
    Recibe datos de sensor (MPU, etc.) y guarda solo aceleración X y Y en 'graficas'.
    """
    return guardar_datos_sensor_minimal(db, datos.model_dump())


@router.post("/graficas/importar")
def importar_csv_route(
    file: UploadFile = File(...),
    etiqueta: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Importa un CSV y lo guarda como gráfica nueva con la etiqueta dada.
    """
    return importar_csv(file, etiqueta, db)


@router.get("/graficas/exportar_por_id/{id_grafica}")
def exportar_por_id(id_grafica: int, db: Session = Depends(get_db)):
    """
    Exporta solo aceleración X y Y desde el campo datos_extra de la gráfica.
    """
    grafica = db.query(Grafica).filter(Grafica.id_grafica == id_grafica).first()
    if not grafica or not grafica.datos_extra:
        raise HTTPException(status_code=404, detail="No hay datos para exportar")

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["fecha_hora", "aceleracion_x", "aceleracion_y"])

    for item in grafica.datos_extra:
        writer.writerow([
            item.get("fecha_hora", ""),
            item.get("aceleracion_x", 0.0),
            item.get("aceleracion_y", 0.0)
        ])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=grafica_{id_grafica}.csv"
    })

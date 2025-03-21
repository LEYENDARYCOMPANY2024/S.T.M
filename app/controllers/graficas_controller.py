# controllers/graficas_controller.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.graficas_models import Grafica, GraficaDispositivo
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

def guardar_datos_sensor(db: Session, datos: dict):
    try:
        grafica = Grafica(
            nombre_grafica=datos["nombre_grafica"],
            datos_extra=datos.get("datos_extra"),
            aceleracion_x=datos["aceleracion_x"],
            aceleracion_y=datos["aceleracion_y"],
            aceleracion_z=datos["aceleracion_z"],
            rotacion_x=datos["rotacion_x"],
            rotacion_y=datos["rotacion_y"],
            rotacion_z=datos["rotacion_z"]
        )
        db.add(grafica)
        db.commit()
        db.refresh(grafica)

        grafica_dispositivo = GraficaDispositivo(
            id_grafica_fk=grafica.id_grafica,
            id_sesion_dispositivo_fk=datos["id_sesion_dispositivo"],
            lado_pierna=datos["lado_pierna"]
        )
        db.add(grafica_dispositivo)
        db.commit()

        return {"mensaje": "Dato guardado correctamente", "id_grafica": grafica.id_grafica}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar datos: {str(e)}")

def etiquetar_datos(db: Session, id_sesion_dispositivo: int, etiqueta: str):
    registros = (
        db.query(Grafica)
        .join(GraficaDispositivo, Grafica.id_grafica == GraficaDispositivo.id_grafica_fk)
        .filter(GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo)
        .all()
    )

    for grafica in registros:
        grafica.etiqueta = etiqueta

    db.commit()
    return {"mensaje": f"Datos etiquetados como '{etiqueta}'"}

def exportar_datos_csv(db: Session, id_sesion_dispositivo: int):
    registros = (
        db.query(Grafica)
        .join(GraficaDispositivo, Grafica.id_grafica == GraficaDispositivo.id_grafica_fk)
        .filter(GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo)
        .order_by(Grafica.id_grafica)
        .all()
    )

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "acel_x", "acel_y", "acel_z", "rot_x", "rot_y", "rot_z", "etiqueta"])
    for g in registros:
        writer.writerow([
            g.id_grafica, g.aceleracion_x, g.aceleracion_y, g.aceleracion_z,
            g.rotacion_x, g.rotacion_y, g.rotacion_z, g.etiqueta or ""
        ])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=datos_grafica.csv"
    })

def importar_csv(file, etiqueta: str, db: Session):

    content = file.file.read().decode("utf-8").splitlines()
    reader = csv.DictReader(content)

    nuevos = 0
    for row in reader:
        grafica = Grafica(
            nombre_grafica=row.get("etiqueta", etiqueta),
            etiqueta=etiqueta,
            aceleracion_x=row.get("acel_x"),
            aceleracion_y=row.get("acel_y"),
            aceleracion_z=row.get("acel_z"),
            rotacion_x=row.get("rot_x"),
            rotacion_y=row.get("rot_y"),
            rotacion_z=row.get("rot_z"),
            datos_extra={}
        )
        db.add(grafica)
        nuevos += 1

    db.commit()
    return {"mensaje": f"{nuevos} registros importados con la etiqueta '{etiqueta}'"}

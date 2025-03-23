# controllers/graficas_controller.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.graficas_models import Grafica, GraficaDispositivo
import csv
from io import StringIO
from fastapi.responses import StreamingResponse
from models.dispositivos_models import SesionDispositivo

def guardar_datos_sensor(db: Session, datos: dict):
    try:
        uuid = datos.get("uuid")
        id_sesion_dispositivo = datos.get("id_sesion_dispositivo")

        if not uuid or not id_sesion_dispositivo:
            raise HTTPException(status_code=400, detail="Faltan datos obligatorios")

        sesion_dispositivo = db.query(SesionDispositivo).filter(
            SesionDispositivo.id_sesion_dispositivo == id_sesion_dispositivo,
            SesionDispositivo.estado_activado == "activado"
        ).first()

        if not sesion_dispositivo:
            raise HTTPException(status_code=404, detail="Sesión del dispositivo no encontrada o no activa")

        grafica_dispositivo = db.query(GraficaDispositivo).filter(
            GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo
        ).first()

        if not grafica_dispositivo:
            raise HTTPException(status_code=403, detail="El dispositivo no tiene lado asignado aún")

        grafica = Grafica(
            nombre_grafica=datos.get("nombre_grafica", "grafica_desconocida"),
            datos_extra=datos.get("datos_extra", {}),
            aceleracion_x=datos.get("aceleracion_x", 0.0),
            aceleracion_y=datos.get("aceleracion_y", 0.0),
            aceleracion_z=datos.get("aceleracion_z", 0.0),
            rotacion_x=datos.get("rotacion_x", 0.0),
            rotacion_y=datos.get("rotacion_y", 0.0),
            rotacion_z=datos.get("rotacion_z", 0.0)
        )
        db.add(grafica)
        db.commit()
        db.refresh(grafica)

        nueva_relacion = GraficaDispositivo(
            id_grafica_fk=grafica.id_grafica,
            id_sesion_dispositivo_fk=id_sesion_dispositivo,
            lado_pierna=grafica_dispositivo.lado_pierna
        )
        db.add(nueva_relacion)
        db.commit()

        return {"mensaje": "Dato guardado correctamente", "id_grafica": grafica.id_grafica}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar datos: {str(e)}")



def exportar_datos_csv(db: Session, id_sesion_dispositivo: int):
    registros = (
        db.query(Grafica)
        .join(GraficaDispositivo, Grafica.id_grafica == GraficaDispositivo.id_grafica_fk)
        .filter(GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo)
        .order_by(Grafica.fecha_hora.asc())  # ✅ Orden cronológico
        .all()
    )

    output = StringIO()
    writer = csv.writer(output)

    # ✅ Encabezados con fecha_hora incluida
    writer.writerow(["id", "fecha_hora", "acel_x", "acel_y", "acel_z", "rot_x", "rot_y", "rot_z", "etiqueta"])

    for g in registros:
        writer.writerow([
            g.id_grafica,
            g.fecha_hora.strftime("%Y-%m-%d %H:%M:%S") if g.fecha_hora else "",
            g.aceleracion_x,
            g.aceleracion_y,
            g.aceleracion_z,
            g.rotacion_x,
            g.rotacion_y,
            g.rotacion_z,
            g.etiqueta or ""
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

# controllers/graficas_controller.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.graficas_models import Grafica, GraficaDispositivo
import csv
from io import StringIO
from fastapi.responses import StreamingResponse
from models.dispositivos_models import SesionDispositivo
from datetime import datetime, timezone

def guardar_datos_sensor(db: Session, datos: dict):
    try:
        uuid = datos.get("uuid")
        id_sesion_dispositivo = datos.get("id_sesion_dispositivo")
        lado_pierna = datos.get("lado_pierna")

        if not uuid or not id_sesion_dispositivo or not lado_pierna:
            raise HTTPException(status_code=400, detail="Faltan datos obligatorios")

        # ✅ Verificar que la sesión esté activa
        sesion_dispositivo = db.query(SesionDispositivo).filter(
            SesionDispositivo.id_sesion_dispositivo == id_sesion_dispositivo,
            SesionDispositivo.estado_activado == "activado"
        ).first()

        if not sesion_dispositivo:
            raise HTTPException(status_code=404, detail="Sesión del dispositivo no activa")

        # ✅ Buscar si ya existe una gráfica asociada al mismo dispositivo/pierna
        relacion = db.query(GraficaDispositivo).filter(
            GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo,
            GraficaDispositivo.lado_pierna == lado_pierna
        ).first()

        if relacion:
            grafica = db.query(Grafica).filter(Grafica.id_grafica == relacion.id_grafica_fk).first()
            if grafica:
                historial = grafica.datos_extra or []
                historial.append({
                    "fecha_hora": datetime.now(timezone.utc).isoformat(),
                    "aceleracion_x": datos.get("aceleracion_x", 0.0),
                    "aceleracion_y": datos.get("aceleracion_y", 0.0),
                    "aceleracion_z": datos.get("aceleracion_z", 0.0),
                    "rotacion_x": datos.get("rotacion_x", 0.0),
                    "rotacion_y": datos.get("rotacion_y", 0.0),
                    "rotacion_z": datos.get("rotacion_z", 0.0)
                })

                grafica.datos_extra = historial
                grafica.aceleracion_x = datos.get("aceleracion_x", 0.0)
                grafica.aceleracion_y = datos.get("aceleracion_y", 0.0)
                grafica.aceleracion_z = datos.get("aceleracion_z", 0.0)
                grafica.rotacion_x = datos.get("rotacion_x", 0.0)
                grafica.rotacion_y = datos.get("rotacion_y", 0.0)
                grafica.rotacion_z = datos.get("rotacion_z", 0.0)
                db.commit()
                return {"mensaje": "Datos actualizados correctamente", "id_grafica": grafica.id_grafica}

        # ✅ Si no existe aún, se crea un nuevo registro
        nueva_grafica = Grafica(
            nombre_grafica=f"grafica_{id_sesion_dispositivo}_{lado_pierna}",
            datos_extra=[{
                "fecha_hora": datetime.now(timezone.utc).isoformat(),
                "aceleracion_x": datos.get("aceleracion_x", 0.0),
                "aceleracion_y": datos.get("aceleracion_y", 0.0),
                "aceleracion_z": datos.get("aceleracion_z", 0.0),
                "rotacion_x": datos.get("rotacion_x", 0.0),
                "rotacion_y": datos.get("rotacion_y", 0.0),
                "rotacion_z": datos.get("rotacion_z", 0.0)
            }],

            aceleracion_x=datos.get("aceleracion_x", 0.0),
            aceleracion_y=datos.get("aceleracion_y", 0.0),
            aceleracion_z=datos.get("aceleracion_z", 0.0),
            rotacion_x=datos.get("rotacion_x", 0.0),
            rotacion_y=datos.get("rotacion_y", 0.0),
            rotacion_z=datos.get("rotacion_z", 0.0)
        )
        db.add(nueva_grafica)
        db.commit()
        db.refresh(nueva_grafica)

        nueva_relacion = GraficaDispositivo(
            id_grafica_fk=nueva_grafica.id_grafica,
            id_sesion_dispositivo_fk=id_sesion_dispositivo,
            lado_pierna=lado_pierna
        )
        db.add(nueva_relacion)
        db.commit()

        return {"mensaje": "Dato insertado correctamente", "id_grafica": nueva_grafica.id_grafica}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar/actualizar datos: {str(e)}")



def exportar_datos_csv(db: Session, id_sesion_dispositivo: int):
    registros = (
        db.query(Grafica)
        .join(GraficaDispositivo, Grafica.id_grafica == GraficaDispositivo.id_grafica_fk)
        .filter(GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo)
        .all()
    )

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["fecha_hora", "acel_x", "acel_y", "acel_z", "rot_x", "rot_y", "rot_z"])

    for grafica in registros:
        historial = grafica.datos_extra or []
        for entrada in historial:
            writer.writerow([
                entrada.get("fecha_hora", ""),
                entrada.get("aceleracion_x", 0.0),
                entrada.get("aceleracion_y", 0.0),
                entrada.get("aceleracion_z", 0.0),
                entrada.get("rotacion_x", 0.0),
                entrada.get("rotacion_y", 0.0),
                entrada.get("rotacion_z", 0.0)
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

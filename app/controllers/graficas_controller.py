# controllers/graficas_controller.py

from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.graficas_models import Grafica, GraficaDispositivo
import csv
from io import StringIO
from fastapi.responses import StreamingResponse
from models.dispositivos_models import SesionDispositivo
from datetime import datetime, timezone


def guardar_datos_sensor_minimal(db: Session, datos: dict):
    uuid = datos.get("uuid")
    id_sesion_dispositivo = datos.get("id_sesion_dispositivo")
    lado_pierna = datos.get("lado_pierna")

    if not uuid or not id_sesion_dispositivo or not lado_pierna:
        raise HTTPException(status_code=400, detail="Faltan datos obligatorios")

    sesion_dispositivo = db.query(SesionDispositivo).filter(
        SesionDispositivo.id_sesion_dispositivo == id_sesion_dispositivo,
        SesionDispositivo.estado_activado == "activado"
    ).first()

    if not sesion_dispositivo:
        raise HTTPException(status_code=404, detail="Sesión del dispositivo no activa")

    relacion = db.query(GraficaDispositivo).filter(
        GraficaDispositivo.id_sesion_dispositivo_fk == id_sesion_dispositivo,
        GraficaDispositivo.lado_pierna == lado_pierna
    ).first()

    nueva_entrada = {
        "fecha_hora": datetime.now(timezone.utc).isoformat(),
        "aceleracion_x": datos.get("aceleracion_x", 0.0),
        "aceleracion_y": datos.get("aceleracion_y", 0.0)
    }

    if relacion:
        grafica = db.query(Grafica).filter(Grafica.id_grafica == relacion.id_grafica_fk).first()
        if not grafica:
            raise HTTPException(status_code=404, detail="Gráfica no encontrada.")

        historial = grafica.datos_extra or []
        historial.append(nueva_entrada)
        grafica.datos_extra = historial
        grafica.aceleracion_x = nueva_entrada["aceleracion_x"]
        grafica.aceleracion_y = nueva_entrada["aceleracion_y"]
        grafica.lado_pierna_gf = lado_pierna
        grafica.fecha_hora = datetime.now(timezone.utc)  # 🔥 Forzar cambio para Supabase Realtime


        db.commit()
        return {"mensaje": "Datos actualizados correctamente", "id_grafica": grafica.id_grafica}

    # Nueva gráfica
    total = db.query(Grafica).count()
    nueva_grafica = Grafica(
        nombre_grafica=f"grafica_{total+1}",
        datos_extra=[nueva_entrada],
        aceleracion_x=nueva_entrada["aceleracion_x"],
        aceleracion_y=nueva_entrada["aceleracion_y"],
        lado_pierna_gf=lado_pierna
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

    return {"mensaje": "Gráfica creada y datos insertados", "id_grafica": nueva_grafica.id_grafica}




def exportar_grafica_solo_xy(db: Session, id_grafica: int):
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

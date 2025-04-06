# controllers/graficas_controller.py

from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.graficas_models import Grafica, GraficaDispositivo
import csv
from io import StringIO
from fastapi.responses import StreamingResponse
from models.dispositivos_models import SesionDispositivo
from datetime import datetime
from pytz import timezone

zona_mx = timezone("America/Mexico_City")

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

    now_local = datetime.now(zona_mx).replace(tzinfo=None)  # ⏱️ Hora local sin tzinfo

    nueva_entrada = {
        "fecha_hora": now_local.isoformat(),
        "aceleracion_x": datos.get("aceleracion_x", 0.0),
        "aceleracion_y": datos.get("aceleracion_y", 0.0)
    }

    if relacion:
        grafica = db.query(Grafica).filter(Grafica.id_grafica == relacion.id_grafica_fk).first()
        if not grafica:
            raise HTTPException(status_code=404, detail="Gráfica no encontrada.")
        
        grafica.aceleracion_x = nueva_entrada["aceleracion_x"]
        grafica.aceleracion_y = nueva_entrada["aceleracion_y"]
        grafica.lado_pierna_gf = lado_pierna
        grafica.fecha_hora = now_local  # 🕒 Local sin tz

        db.commit()
        return {"mensaje": "Datos actualizados correctamente", "id_grafica": grafica.id_grafica}

    if nueva_entrada["aceleracion_x"] == 0.0 and nueva_entrada["aceleracion_y"] == 0.0:
        return {"mensaje": "No se creó gráfica porque los datos están vacíos"}

    total = db.query(Grafica).count()
    nueva_grafica = Grafica(
        nombre_grafica=f"grafica_{total+1}",
        aceleracion_x=nueva_entrada["aceleracion_x"],
        aceleracion_y=nueva_entrada["aceleracion_y"],
        lado_pierna_gf=lado_pierna,
        fecha_hora=now_local
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


def importar_csv(file, db: Session):
    content = file.file.read().decode("utf-8").splitlines()
    reader = csv.DictReader(content)

    hoy = datetime.now(zona_mx).date()
    nuevos = 0

    for row in reader:
        try:
            hora_str = row.get("hora")
            if not hora_str:
                continue

            # 🕒 Convertir hora a datetime con la fecha actual
            fecha_hora = datetime.strptime(f"{hoy} {hora_str}", "%Y-%m-%d %H:%M:%S")

            # 🔽 Si hay valor en izquierda
            izquierda_valor = row.get("izquierda_ay")
            if izquierda_valor:
                db.add(Grafica(
                    nombre_grafica="importada_csv",
                    aceleracion_y=float(izquierda_valor),
                    aceleracion_x=0.0,
                    fecha_hora=fecha_hora,
                    lado_pierna_gf="izquierda"
                ))
                nuevos += 1

            # 🔽 Si hay valor en derecha
            derecha_valor = row.get("derecha_ay")
            if derecha_valor:
                db.add(Grafica(
                    nombre_grafica="importada_csv",
                    aceleracion_y=float(derecha_valor),
                    aceleracion_x=0.0,
                    fecha_hora=fecha_hora,
                    lado_pierna_gf="derecha"
                ))
                nuevos += 1

        except Exception as e:
            print(f"❌ Error en fila: {row} => {e}")
            continue

    db.commit()
    return {"mensaje": f"{nuevos} registros importados correctamente"}

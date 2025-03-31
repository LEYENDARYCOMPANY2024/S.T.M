# routes/chat_routes.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from controllers.chat_controller import guardar_mensaje, obtener_historial
from models.chat_models import MensajeCreate, MensajeResponse, Chat, Mensaje
from database import get_db
from models.terapeutas import TerapeutaPaciente
chat_router = APIRouter(prefix="/chat", tags=["chat"])

# Conexiones activas por ID de chat
active_connections: dict[int, list[WebSocket]] = {}

@chat_router.websocket("/ws/{chat_id}")
async def chat_websocket(chat_id: int, websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()

    if chat_id not in active_connections:
        active_connections[chat_id] = []
    active_connections[chat_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_json()

            # 🔄 Manejo de "escribiendo"
            if "typing" in data:
                for conn in active_connections[chat_id]:
                    if conn != websocket:
                        try:
                            await conn.send_json(data)
                        except:
                            continue
                continue

            # 📩 Verifica datos válidos
            if "mensaje" not in data or "remitente" not in data:
                print("❌ Mensaje inválido recibido:", data)
                continue

            # 🧠 Guardar mensaje
            mensaje_data = MensajeCreate(
                id_chat_m_fk=chat_id,
                remitente=data["remitente"],
                mensaje=data["mensaje"]
            )
            mensaje_guardado = guardar_mensaje(mensaje_data, db)

            # 📡 Enviar a todos los conectados
            for conn in active_connections[chat_id]:
                try:
                    await conn.send_json({
                    "id_mensaje": mensaje_guardado.id_mensaje,
                    "mensaje": mensaje_guardado.mensaje,
                    "remitente": mensaje_guardado.remitente,
                    "fecha_envio": mensaje_guardado.enviado_en.isoformat() if mensaje_guardado.enviado_en else None
                })

  # ✅ Usa model_dump_json
                except Exception as e:
                    print("⚠️ Error enviando mensaje a cliente:", e)
                    continue


    except WebSocketDisconnect:
        active_connections[chat_id].remove(websocket)
        print(f"🔌 Cliente desconectado del chat {chat_id}")



@chat_router.get("/mensajes/{chat_id}", response_model=list[MensajeResponse])
def obtener_mensajes_route(chat_id: int, db: Session = Depends(get_db)):
    return obtener_historial(chat_id, db)


@chat_router.post("/crear")
def crear_chat(
    terapeuta_id: int = Query(...),
    paciente_id: int = Query(...),
    db: Session = Depends(get_db)
):
    # ✅ Corrige los nombres de campo
    relacion = db.query(TerapeutaPaciente).filter_by(
        id_terapeuta_tp_fk=terapeuta_id,
        id_paciente_tp_fk=paciente_id
    ).first()

    if not relacion:
        raise HTTPException(status_code=404, detail="No existe relación entre terapeuta y paciente")

    # Verifica si ya existe un chat para esa relación
    chat_existente = db.query(Chat).filter_by(
        id_terapeuta_paciente_c_fk=relacion.id_terapeuta_paciente
    ).first()

    if chat_existente:
        return {"chat_id": chat_existente.id_chat}

    # Si no existe, crea uno nuevo
    nuevo_chat = Chat(id_terapeuta_paciente_c_fk=relacion.id_terapeuta_paciente)
    db.add(nuevo_chat)
    db.commit()
    db.refresh(nuevo_chat)

    return {"chat_id": nuevo_chat.id_chat}

@chat_router.delete("/mensajes/{mensaje_id}")
def eliminar_mensaje(mensaje_id: int, db: Session = Depends(get_db)):
    mensaje = db.query(Mensaje).filter_by(id_mensaje=mensaje_id).first()
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    db.delete(mensaje)
    db.commit()
    return {"detail": "Mensaje eliminado correctamente"}
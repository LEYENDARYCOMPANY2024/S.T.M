from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Dict, List, Optional
import json

router = APIRouter()

# Manejador de conexiones WebSocket
class ConnectionManager:
    def __init__(self):
        # Estructura para almacenar conexiones: {user_id: WebSocket}
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast(self, message: str, exclude_user: str = None):
        for user_id, connection in self.active_connections.items():
            if user_id != exclude_user:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    # Aceptar la conexión WebSocket
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Aquí procesarías el mensaje y guardarías en la base de datos
            # Por ejemplo:
            # db.save_message(user_id, "user", message_data["message"])
            
            # Preparar respuesta
            response = {
                "sender_type": "user",
                "content": message_data["message"],
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            }
            
            # Enviar mensaje de vuelta al mismo usuario
            await manager.send_personal_message(json.dumps(response), user_id)
            
            # Si quieres implementar un chatbot o respuesta automática:
            bot_response = {
                "sender_type": "system",
                "content": f"Respuesta a: {message_data['message']}",
                "user_id": "system",
                "timestamp": datetime.now().isoformat()
            }
            
            # Enviar respuesta del sistema
            await manager.send_personal_message(json.dumps(bot_response), user_id)
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
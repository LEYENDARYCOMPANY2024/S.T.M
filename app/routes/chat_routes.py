from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Dict, List, Optional
from controllers.chat_controller import ChatController
import json

router = APIRouter()
chat_controller = ChatController()



@router.get("/api/messages")
async def get_messages(request: Request):
    # En FastAPI necesitarías obtener el usuario de la sesión de otra manera
    # Por ejemplo, a través de un token JWT o cookie
    user_id = request.cookies.get("user_id") or "default_user"
    messages = chat_controller.get_messages(user_id)
    return messages

@router.post("/api/messages")
async def send_message(request: Request):
    try:
        # En FastAPI, obtenemos el cuerpo de la solicitud de manera diferente
        body = await request.json()
        user_id = request.cookies.get("user_id") or "default_user"
        message_text = body.get("message")
        
        if not message_text:
            raise HTTPException(status_code=400, detail="Message text is required")
        
        response = chat_controller.process_message(user_id, message_text)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
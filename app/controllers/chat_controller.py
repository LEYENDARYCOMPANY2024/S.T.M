<<<<<<< HEAD
from models.chat_models import ChatModel
=======
from models.chat_model import ChatModel
>>>>>>> pruebas2
from datetime import datetime

class ChatController:
    def __init__(self):
        self.chat_model = ChatModel()
    
    def get_messages(self, user_id: str):
        # Obtener mensajes históricos
        return self.chat_model.get_messages_by_user(user_id)
    
    def process_message(self, user_id: str, message_text: str):
        # Guardar mensaje del usuario
        self.chat_model.save_message(user_id, 'user', message_text)
        
        # Lógica para generar respuestas
        # Puedes integrar aquí tu lógica de chatbot o respuestas predefinidas
        response_text = "Respuesta de ejemplo al mensaje: " + message_text
        
        # Guardar respuesta del sistema
        self.chat_model.save_message(user_id, 'system', response_text)
        
        return {
            "status": "success",
            "message": response_text
        }
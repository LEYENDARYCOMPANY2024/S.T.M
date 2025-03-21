from typing import List, Dict
from datetime import datetime
import json

# Simulación de base de datos en memoria para empezar
class ChatModel:
    def __init__(self):
        # Estructura simple para almacenar mensajes: {user_id: [messages]}
        self.messages_db = {}
    
    def get_messages_by_user(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Obtiene los mensajes para un usuario específico."""
        if user_id not in self.messages_db:
            return []
        
        # Devolver los últimos 'limit' mensajes
        return sorted(
            self.messages_db[user_id], 
            key=lambda x: x['timestamp']
        )[-limit:]
    
    def save_message(self, user_id: str, sender_type: str, content: str) -> Dict:
        """Guarda un nuevo mensaje."""
        if user_id not in self.messages_db:
            self.messages_db[user_id] = []
        
        # Crear el mensaje
        message = {
            'id': len(self.messages_db[user_id]) + 1,
            'sender_type': sender_type,
            'content': content,
            'timestamp': datetime.now().isoformat()
        }
        
        # Guardar en nuestra "base de datos"
        self.messages_db[user_id].append(message)
        
        return message
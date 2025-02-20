from typing import Union

from fastapi import FastAPI
from models.terapeuta import index  # Importar la función index desde el archivo modelo

app = FastAPI()

# Usar la función importada de models.terapeuta
app.get("/")(index)

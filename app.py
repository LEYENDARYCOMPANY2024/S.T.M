from fastapi import FastAPI
from controllers import main_controller

app = FastAPI()

# Incluimos los controladores
app.include_router(main_controller.router)

@app.get("/")
def index():
    return {"status": "200", "message": "todo bien"}

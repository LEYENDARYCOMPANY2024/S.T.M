from typing import Union
from fastapi import FastAPI
from fastapi import Request

def index():
    return {"Hello": "World"}

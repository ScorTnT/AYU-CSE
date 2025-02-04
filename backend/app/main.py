from typing import Union
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root() -> Union[str, int]:
    return "Hello, world!"

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None) -> dict:
    return {"item_id": item_id, "q": q}
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "data" / "tasks.db"


@contextmanager
def database():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    try:
        with connection:
            yield connection
    finally:
        connection.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    with database() as connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS tasks "
            "(id INTEGER PRIMARY KEY, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0)"
        )
    yield


app = FastAPI(title="Orca Tasks", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TaskUpdate(BaseModel):
    completed: bool


class Task(BaseModel):
    id: int
    title: str
    completed: bool


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/api/tasks", response_model=list[Task])
def list_tasks():
    with database() as connection:
        return [dict(row) for row in connection.execute("SELECT * FROM tasks ORDER BY id DESC")]


@app.post("/api/tasks", response_model=Task, status_code=201)
def create_task(task: TaskCreate):
    title = task.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Enter a task title.")
    with database() as connection:
        cursor = connection.execute("INSERT INTO tasks (title) VALUES (?)", (title,))
        return {"id": cursor.lastrowid, "title": title, "completed": False}


@app.patch("/api/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task: TaskUpdate):
    with database() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET completed = ? WHERE id = ?", (task.completed, task_id)
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found.")
        return dict(connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone())


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    with database() as connection:
        cursor = connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found.")

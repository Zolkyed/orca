# Orca Tasks

A small task tracker built with FastAPI, SQLite, and plain HTML, CSS, and JavaScript.

## Run locally

Requires Python 3.10 or newer. From the project directory on Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --reload
```

Open http://127.0.0.1:8000. Interactive API documentation is at http://127.0.0.1:8000/docs.

On macOS/Linux, use `python3` to create the environment and `.venv/bin/python` for the remaining commands.

## API

- `GET /api/tasks` — list tasks
- `POST /api/tasks` — create a task with `{"title": "My task"}`
- `PATCH /api/tasks/{id}` — update completion with `{"completed": true}`
- `DELETE /api/tasks/{id}` — delete a task

Tasks are stored in `data/tasks.db`, created automatically on startup. This is a local starter app with a shared task list and no authentication.

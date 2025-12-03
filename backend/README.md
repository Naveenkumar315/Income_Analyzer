---

# Backend – FastAPI + MongoDB

## 🚀 Setup Instructions

### 1. Create and activate the virtual environment

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # On Windows
# source .venv/bin/activate   # On Linux/Mac
```

---

### 2. Install dependencies

Add package names to `requirements.txt`, then run:

```bash
pip install -r requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.python.org --cert ""
```

---

### 3. Run the FastAPI server

```bash
npm start or uvicorn main:app --reload
```

Now open your browser at:
👉 [http://127.0.0.1:8000](http://127.0.0.1:8000)

API docs available at:

- Swagger UI → [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc → [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

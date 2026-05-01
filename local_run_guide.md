# Local Run Guide

This guide explains how to get the Recipe Recommendation system running on your local machine.

## Prerequisites
- **Python 3.10+** (with `numpy` installed: `pip install numpy`)
- **Node.js 18+** & **npm**
- **Docker Desktop** (Optional, but highly recommended)

---

## Step 1: Data Preparation (Mandatory)
Before running the app, you must convert the raw data into optimized formats. This reduces the memory footprint and speeds up the search.

1. Open a terminal in the project root: `d:\Backup\Cluster\recipe model v2`
2. Ensure `numpy` is installed:
   ```powershell
   pip install numpy
   ```
3. Run the preparation script:
   ```powershell
   python .\backend\scripts\prepare_data.py
   ```
   *This will create `recipes.db` and `search_index_f16.npz` inside the `recipe_model/` folder.*

---

## Option A: Running with Docker (Recommended)
Docker is the easiest way as it handles all Python dependencies and environment settings.

1. Ensure Docker Desktop is running.
2. In the project root, run:
   ```powershell
   docker-compose up --build
   ```
3. Once the logs show both services are ready:
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)

---

## Option B: Running Manually (No Docker)

### 1. Start the Backend
1. Navigate to the backend folder:
   ```powershell
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
3. Start the server:
   ```powershell
   uvicorn app.main:app --reload
   ```

### 2. Start the Frontend
1. Open a **new** terminal in the frontend folder:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the development server:
   ```powershell
   npm run dev
   ```

---

## Troubleshooting
- **Missing Models**: If the backend fails to start, ensure all `.joblib`, `.kv`, `.pkl`, and the newly generated `.db`/`.npz` files are in the `recipe_model/` directory.
- **Port Conflicts**: If port 8000 or 5173 is in use, you can change them in `docker-compose.yml` or the respective start commands.
- **Large Files**: The first run of `prepare_data.py` may take a few minutes as it processes over 2 million recipes.

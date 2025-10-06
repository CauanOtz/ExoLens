# api_predict.py
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import numpy as np
import io
import pandas as pd
import torch
import json
import asyncio
from models import FullModel

app = FastAPI()

# Add CORS middleware to allow browser requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production - update with your domain
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Mount static files for React build (for single-service deployment)
if os.path.exists("build"):
    app.mount("/", StaticFiles(directory="build", html=True), name="static")

# Serve React app for any non-API routes (fallback for SPA)
@app.middleware("http")
async def serve_react_app_middleware(request, call_next):
    response = await call_next(request)
    if response.status_code == 404:
        if not request.url.path.startswith("/api") and not request.url.path.startswith("/ws"):
            try:
                return FileResponse("build/index.html")
            except:
                pass  # Continue to next handler
    return response
MODEL_PATH = 'nasa_model.pth'
SEQ_LEN = 201

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Initialize model with error handling for deployment
model = None
try:
    if os.path.exists(MODEL_PATH):
        model = FullModel(seq_len=SEQ_LEN, n_tab_features=13, catalog_only=True)  # 13 features for NASA catalog
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model.to(device)
        model.eval()
        print("Model loaded successfully")
    else:
        print(f"Warning: Model file {MODEL_PATH} not found. Prediction endpoints will not work.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.get("/")
async def serve_react_app():
    """Serve the React application"""
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exoplanet AI Detection Dashboard</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            #root {
                min-height: 100vh;
            }
            .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: linear-gradient(135deg, #0D1117 0%, #161B22 100%);
                color: #30B4C2;
                font-size: 1.2rem;
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(48, 180, 194, 0.2);
                border-left: 4px solid #30B4C2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 16px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div id="root">
            <div class="loading">
                <div class="spinner"></div>
                <span>Loading Exoplanet Dashboard...</span>
            </div>
        </div>
        <script type="module" src="/static/js/bundle.js"></script>
    </body>
    </html>
    """)

@app.post("/predict_csv")
async def predict_csv(file: UploadFile = File(...)):
    print(f"Received file: {file.filename}, size: {file.size}, content_type: {file.content_type}")

    try:
        content = await file.read()
        print(f"Read {len(content)} bytes from file")

        # Universal CSV parsing with intelligent column detection
        df = None

        # Try multiple parsing strategies
        parsing_strategies = [
            # Strategy 1: Default pandas reading
            lambda: pd.read_csv(io.BytesIO(content)),

            # Strategy 2: With flexible options
            lambda: pd.read_csv(
                io.BytesIO(content),
                sep=',',
                quotechar='"',
                quoting=0,  # QUOTE_MINIMAL
                escapechar='\\',
                on_bad_lines='skip',
                low_memory=False
            ),

            # Strategy 3: Try different separators
            lambda: pd.read_csv(
                io.BytesIO(content),
                sep=None,
                engine='python',
                quoting=3,  # QUOTE_NONE
                on_bad_lines='skip'
            ),

            # Strategy 4: Manual parsing for severely malformed files
            lambda: _manual_csv_parse(content)
        ]

        for i, strategy in enumerate(parsing_strategies):
            try:
                df = strategy()
                print(f"Successfully parsed CSV using strategy {i+1}")
                break
            except Exception as e:
                print(f"Strategy {i+1} failed: {str(e)}")
                continue

        if df is None:
            return {"error": "Could not parse CSV file with any strategy"}

        # Clean the dataframe
        df = _clean_dataframe(df)

        if df is None:
            return {"error": "Failed to parse CSV file"}

        # Handle various CSV formats with intelligent column detection
        print(f"Detected columns: {list(df.columns)}")

        # Set default ID if not available
        if 'kepid' not in df.columns:
            df['kepid'] = [f"candidate_{i}" for i in range(len(df))]

        # Ensure we have the required columns for prediction
        required_cols = ['koi_period', 'koi_time0bk']
        missing_required = [col for col in required_cols if col not in df.columns]

        if missing_required:
            return {"error": f"Missing required columns for prediction: {missing_required}. Available columns: {list(df.columns)}"}

        # Check if model is loaded
        if model is None:
            return {"error": "AI model not loaded. Please ensure model files are available."}

        print(f"Processing {len(df)} candidates for prediction")

        outputs = []

        for idx, row in df.iterrows():
            try:
                # Extract catalog features for prediction
                features = extract_catalog_features(row)
                x = torch.tensor(features[np.newaxis, :], dtype=torch.float32).to(device)

                with torch.no_grad():
                    logits = model(x)
                    prob = torch.softmax(logits, dim=1)[:,1].cpu().item()

                outputs.append({
                    'id': str(row.get('kepid', f'candidate_{idx}')),
                    'prob_planet': float(prob)
                })

            except Exception as e:
                print(f"Error processing row {idx}: {str(e)}")
                # Add error entry but continue processing
                outputs.append({
                    'id': str(row.get('kepid', f'candidate_{idx}')),
                    'error': str(e)
                })

        return {'predictions': outputs}

    except Exception as e:
        print(f"File reading error: {e}")
        return {"error": f"Could not read file: {str(e)}"}

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_text()

            # Parse the received data
            try:
                json_data = json.loads(data)
                candidate_data = json_data.get('candidate', {})

                # Check if model is loaded
                if model is None:
                    error_result = {
                        'status': 'error',
                        'message': 'AI model not loaded'
                    }
                    await manager.send_personal_message(json.dumps(error_result), websocket)
                    continue

                # Extract features for prediction
                features = extract_websocket_features(candidate_data)

                # Make prediction
                x = torch.tensor(features[np.newaxis, :], dtype=torch.float32).to(device)
                with torch.no_grad():
                    logits = model(x)
                    prob = torch.softmax(logits, dim=1)[:,1].cpu().item()

                # Send result back
                result = {
                    'id': candidate_data.get('id', 'unknown'),
                    'prob_planet': float(prob),
                    'status': 'success'
                }

                await manager.send_personal_message(json.dumps(result), websocket)

            except Exception as e:
                error_result = {
                    'status': 'error',
                    'message': str(e)
                }
                await manager.send_personal_message(json.dumps(error_result), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """Streaming endpoint for continuous data"""
    await manager.connect(websocket)
    try:
        while True:
            # Receive streaming data
            data = await websocket.receive_text()

            # Process streaming data (could be light curve points, etc.)
            try:
                json_data = json.loads(data)

                if json_data.get('type') == 'light_curve_point':
                    # Handle streaming light curve data
                    point = json_data.get('point', {})
                    result = {
                        'type': 'light_curve_update',
                        'point': point,
                        'status': 'received'
                    }
                    await manager.send_personal_message(json.dumps(result), websocket)

                elif json_data.get('type') == 'batch_candidates':
                    # Handle batch of candidates for real-time processing
                    candidates = json_data.get('candidates', [])

                    results = []
                    for candidate in candidates:
                        # Check if model is loaded
                        if model is None:
                            results.append({
                                'id': candidate.get('id', 'unknown'),
                                'error': 'AI model not loaded'
                            })
                            continue

                        features = extract_websocket_features(candidate)
                        x = torch.tensor(features[np.newaxis, :], dtype=torch.float32).to(device)

                        with torch.no_grad():
                            logits = model(x)
                            prob = torch.softmax(logits, dim=1)[:,1].cpu().item()

                        results.append({
                            'id': candidate.get('id', 'unknown'),
                            'prob_planet': float(prob)
                        })

                    # Send all results at once
                    response = {
                        'type': 'batch_results',
                        'predictions': results,
                        'count': len(results)
                    }

                    await manager.send_personal_message(json.dumps(response), websocket)

            except Exception as e:
                error_result = {
                    'type': 'error',
                    'message': str(e)
                }
                await manager.send_personal_message(json.dumps(error_result), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)

def extract_websocket_features(candidate_data):
    """Extract features from WebSocket data (similar to CSV processing)"""
    features = []

    # Basic orbital parameters
    features.append(candidate_data.get('koi_period', 2.5))  # Period
    features.append(candidate_data.get('koi_time0bk', 2458321.5))  # Transit time
    features.append(candidate_data.get('koi_impact', 0))  # Impact parameter
    features.append(candidate_data.get('koi_duration', 3.0))  # Transit duration
    features.append(candidate_data.get('koi_depth', 100))  # Transit depth
    features.append(candidate_data.get('koi_prad', 2.0))  # Planet radius
    features.append(candidate_data.get('koi_teq', 600))  # Equilibrium temperature
    features.append(candidate_data.get('koi_insol', 1.0))  # Insolation flux
    features.append(candidate_data.get('koi_slogg', 4.4))  # Stellar surface gravity
    features.append(candidate_data.get('koi_srad', 1.0))  # Stellar radius
    features.append(candidate_data.get('koi_steff', 5700))  # Stellar effective temperature
    features.append(candidate_data.get('koi_smass', 1.0))  # Stellar mass
    features.append(candidate_data.get('koi_sage', 4.0))  # Stellar age

    # Fill NaN values with defaults
    features = [f if f != 0 else 0.1 for f in features]  # Avoid zero values

    return np.array(features, dtype=np.float32)

def extract_catalog_features(row):
    """Extract relevant features from NASA catalog for ML model"""
    features = []

    # Basic orbital parameters
    features.append(row['koi_period'])  # Period
    features.append(row['koi_time0bk'])  # Transit time
    features.append(row.get('koi_impact', 0))  # Impact parameter
    features.append(row.get('koi_duration', 0))  # Transit duration
    features.append(row.get('koi_depth', 0))  # Transit depth
    features.append(row.get('koi_prad', 1))  # Planet radius (Earth radii)
    features.append(row.get('koi_teq', 300))  # Equilibrium temperature
    features.append(row.get('koi_insol', 1))  # Insolation flux
    features.append(row.get('koi_slogg', 4.5))  # Stellar surface gravity
    features.append(row.get('koi_srad', 1))  # Stellar radius
    features.append(row.get('koi_steff', 5500))  # Stellar effective temperature
    features.append(row.get('koi_smass', 1))  # Stellar mass
    features.append(row.get('koi_sage', 4.5))  # Stellar age

    # Fill NaN values with defaults
    features = [f if not pd.isna(f) else 0 for f in features]

    return np.array(features, dtype=np.float32)

def _manual_csv_parse(content):
    """Manually parse severely malformed CSV files"""
    content_str = content.decode('utf-8', errors='ignore')
    lines = content_str.split('\n')

    # Filter out empty lines and problematic lines
    valid_lines = []
    for line in lines:
        line = line.strip()
        if line and len(line.split(',')) >= 3:  # At least 3 columns
            valid_lines.append(line)

    if not valid_lines:
        raise ValueError("No valid CSV data found")

    # Try to detect header
    header = valid_lines[0]
    data_lines = valid_lines[1:]

    # Create temporary file for pandas
    import tempfile
    import os

    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write(header + '\n')
        for line in data_lines[:100]:  # Limit to first 100 rows for safety
            f.write(line + '\n')
        temp_file = f.name

    try:
        df = pd.read_csv(temp_file)
        return df
    finally:
        os.unlink(temp_file)

def _clean_dataframe(df):
    """Clean and standardize dataframe columns"""
    if df is None or df.empty:
        raise ValueError("Empty dataframe")

    # Remove completely empty columns
    df = df.dropna(axis=1, how='all')

    # Remove completely empty rows
    df = df.dropna(axis=0, how='all')

    # Standardize column names (case-insensitive matching)
    column_mapping = {}
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if 'kepid' in col_lower or 'id' in col_lower:
            column_mapping[col] = 'kepid'
        elif 'period' in col_lower or 'koi_period' in col_lower:
            column_mapping[col] = 'koi_period'
        elif 'time' in col_lower and '0' in col_lower:
            column_mapping[col] = 'koi_time0bk'
        elif 'depth' in col_lower:
            column_mapping[col] = 'koi_depth'
        elif 'duration' in col_lower:
            column_mapping[col] = 'koi_duration'
        elif 'prad' in col_lower or 'radius' in col_lower:
            column_mapping[col] = 'koi_prad'
        elif 'teq' in col_lower or 'temp' in col_lower:
            column_mapping[col] = 'koi_teq'
        elif 'insol' in col_lower:
            column_mapping[col] = 'koi_insol'
        elif 'slogg' in col_lower or 'logg' in col_lower:
            column_mapping[col] = 'koi_slogg'
        elif 'srad' in col_lower:
            column_mapping[col] = 'koi_srad'
        elif 'steff' in col_lower or 'teff' in col_lower:
            column_mapping[col] = 'koi_steff'
        elif 'smass' in col_lower:
            column_mapping[col] = 'koi_smass'
        elif 'sage' in col_lower or 'age' in col_lower:
            column_mapping[col] = 'koi_sage'

    # Rename columns
    df = df.rename(columns=column_mapping)

    # Ensure we have the minimum required columns
    required_cols = ['koi_period', 'koi_time0bk']
    missing_cols = [col for col in required_cols if col not in df.columns]

    if missing_cols:
        print(f"Warning: Missing required columns: {missing_cols}")
        # Try to infer from available data
        if len(df.columns) >= 2:
            # Use first column as ID, second as period, third as time
            cols = df.columns.tolist()
            if 'kepid' not in df.columns and len(cols) > 0:
                df['kepid'] = df[cols[0]]
            if 'koi_period' not in df.columns and len(cols) > 1:
                df['koi_period'] = pd.to_numeric(df[cols[1]], errors='coerce')
            if 'koi_time0bk' not in df.columns and len(cols) > 2:
                df['koi_time0bk'] = pd.to_numeric(df[cols[2]], errors='coerce')

    # Fill missing columns with defaults
    default_values = {
        'koi_depth': 100,
        'koi_duration': 3.0,
        'koi_prad': 2.0,
        'koi_teq': 600,
        'koi_insol': 1.0,
        'koi_slogg': 4.4,
        'koi_srad': 1.0,
        'koi_steff': 5700,
        'koi_smass': 1.0,
        'koi_sage': 4.0
    }

    for col, default_val in default_values.items():
        if col not in df.columns:
            df[col] = default_val

    # Convert data types
    numeric_columns = ['koi_period', 'koi_time0bk', 'koi_depth', 'koi_duration',
                      'koi_prad', 'koi_teq', 'koi_insol', 'koi_slogg',
                      'koi_srad', 'koi_steff', 'koi_smass', 'koi_sage']

    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Remove rows with invalid critical values
    if 'koi_period' in df.columns:
        df = df[df['koi_period'] > 0]

    if 'koi_time0bk' in df.columns:
        df = df[df['koi_time0bk'] > 0]

    # Limit to reasonable number of rows for processing
    if len(df) > 1000:
        print(f"Limiting processing to first 1000 rows out of {len(df)}")
        df = df.head(1000)

    return df

if __name__ == '__main__':
    # Get port from environment variable (for Render deployment) or use default
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
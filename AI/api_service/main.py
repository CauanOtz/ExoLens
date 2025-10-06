from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .services import get_final_predictions


app = FastAPI(title="ExoLens AI Service", version="2.0.0")

class PredictRequest(BaseModel):
    csv_content: str


@app.post('/predict')
def predict(req: PredictRequest):
    try:
        df = get_final_predictions(req.csv_content)
        # Convert to JSON list of objects
        return {
            'rows': df.to_dict(orient='records'),
            'count': len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

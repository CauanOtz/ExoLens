ExoLens AI Service (FastAPI)

This microservice performs model inference (XGBoost + Stacking) and combines it with ExoMiner scores provided via a CSV, exposing a simple synchronous API.

Setup
 - Python 3.10+
 - Install: pip install -r AI/api_service/requirements.txt
 - Ensure AI/nasa-xgboost has xgboost_model.pkl and AI/models/final_model/final_classifier.pkl
 - Prepare the ExoMiner reference CSV once:
	 - Option A: Run the normalizer
		 - python AI/models/normalize_exominer_data.py --input "C:\\Users\\Enrico\\Downloads\\exominer_vetting_tess-spoc-2-min-s1s67_dashtable_dvm-url_scoregt0.1.csv"
	 - Option B: Set EXOMINER_CSV_PATH to your CSV (must have columns target_id and exominer_score)

Run
 - uvicorn AI.api_service.main:app --host 0.0.0.0 --port 8000 --reload

Endpoints
 - POST /predict
	 - Body: { "csv_content": "target_id,tce_period,tce_duration,tce_depth,tce_prad,tce_steff,tce_sradius,tce_smass,tce_impact,tce_eqt,tce_model_snr\n219195044,4.32,0.066,1031,1.74,5409,0.94,1.01,0.56,37116,16.35" }
	 - Returns: JSON with rows (including exominer_score, xgboost_score, final_probability)

Notes
 - The XGBoost feature mapping aceita colunas TCE (tce_period, tce_duration, tce_depth, tce_prad, tce_steff, tce_sradius, tce_smass, tce_impact, tce_eqt, tce_model_snr) ou as features diretas já esperadas pelo modelo.
 - Se o CSV de entrada tiver exominer_score, ele será usado diretamente; caso contrário, será feito merge com o CSV de referência pelo target_id.
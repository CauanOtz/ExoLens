# prediction_service.py (VERSÃO FINAL CORRIGIDA)

import pandas as pd
import joblib
import numpy as np

# --- CARREGAMENTO DOS ARTEFATOS ---
print("Carregando artefatos de ML...")
XGBOOST_MODEL = joblib.load('xgboost_model.pkl')
META_MODEL = joblib.load('meta_model.pkl')
SCALER = joblib.load('scaler.pkl')
NN_FINDER = joblib.load('nn_finder.pkl')
REFERENCE_DB = pd.read_csv('reference_db.csv')
# Usando o XGBoost como placeholder para o ExoMiner
EXOMINER_MODEL = joblib.load('xgboost_model.pkl') 
print("Artefatos carregados com sucesso.")

# --- DEFINIÇÃO DAS FEATURES ---
FEATURES_XGBOOST_COMPLETAS = [
    'orbital_period', 'transit_duration_hr', 'transit_depth_ppm', 
    'planet_radius_earth', 'stellar_temp_k', 'stellar_radius_solar',
    'stellar_mass_solar', 'impact_parameter', 'equilibrium_temp',
    'stellar_density', 'duration_over_period', 'depth_per_planet_radius',
    'signal_to_noise'
]
FEATURES_PARA_BUSCA = [
    'orbital_period', 'transit_depth_ppm', 'signal_to_noise', 
    'planet_radius_earth', 'stellar_radius_solar'
]

# (Funções _apply_feature_engineering e _handle_missing_columns continuam as mesmas)
def _apply_feature_engineering(df):
    df_copy = df.copy()
    df_copy['stellar_density'] = df_copy.get('stellar_mass_solar', 0) / (df_copy.get('stellar_radius_solar', 1)**3 + 1e-6)
    df_copy['duration_over_period'] = df_copy.get('transit_duration_hr', 0) / (df_copy.get('orbital_period', 1) * 24 + 1e-6)
    df_copy['depth_per_planet_radius'] = df_copy.get('transit_depth_ppm', 0) / (df_copy.get('planet_radius_earth', 1)**2 + 1e-6)
    df_copy.replace([np.inf, -np.inf], 0, inplace=True)
    return df_copy

def _handle_missing_columns(df, required_columns):
    df_copy = df.copy()
    for col in required_columns:
        if col not in df_copy.columns:
            df_copy[col] = 0
    return df_copy

# --- FUNÇÕES DE PREDIÇÃO ---

def predict_real_data(df):
    """Faz a predição para dados reais, calculando AMBOS os scores internamente."""
    
    # 1. Prepara dados e prevê com XGBoost
    df_xgboost = _handle_missing_columns(df, FEATURES_XGBOOST_COMPLETAS)
    df_xgboost_eng = _apply_feature_engineering(df_xgboost)
    xgboost_score = XGBOOST_MODEL.predict_proba(df_xgboost_eng[FEATURES_XGBOOST_COMPLETAS].fillna(0))[:, 1]
    
    # 2. Prepara dados e prevê com ExoMiner (usando o placeholder)
    # AQUI ESTÁ A CORREÇÃO:
    # O placeholder do ExoMiner (que é o mesmo modelo XGBoost) deve receber
    # exatamente o mesmo input que o modelo XGBoost real.
    exominer_score = EXOMINER_MODEL.predict_proba(df_xgboost_eng[FEATURES_XGBOOST_COMPLETAS].fillna(0))[:, 1]
    
    # 3. Previsão final com o Meta-Modelo
    input_stacking = np.column_stack((xgboost_score, exominer_score))
    probabilidade_final = META_MODEL.predict_proba(input_stacking)
    
    return {"probabilidade_final": probabilidade_final[:, 1].tolist()}

# (A função predict_fictitious_data continua a mesma)
def predict_fictitious_data(df):
    df_xgboost = _handle_missing_columns(df, FEATURES_XGBOOST_COMPLETAS)
    df_xgboost_eng = _apply_feature_engineering(df_xgboost)
    xgboost_score_ficticio = XGBOOST_MODEL.predict_proba(df_xgboost_eng[FEATURES_XGBOOST_COMPLETAS].fillna(0))[:, 1]
    
    scaled_fictitious_data = SCALER.transform(df[FEATURES_PARA_BUSCA].fillna(0))
    _, indice_vizinho = NN_FINDER.kneighbors(scaled_fictitious_data)
    
    exominer_scores_proxy = [REFERENCE_DB.iloc[idx[0]]['exominer_score'] for idx in indice_vizinho]
    
    input_stacking = np.column_stack((xgboost_score_ficticio, exominer_scores_proxy))
    probabilidade_final = META_MODEL.predict_proba(input_stacking)
    
    return {"probabilidade_final": probabilidade_final[:, 1].tolist()}

# --- FUNÇÃO PRINCIPAL ---
def make_prediction(dataframe, data_type="real"):
    if data_type == "fictitious":
        print("Executando pipeline para dados fictícios...")
        return predict_fictitious_data(dataframe)
    else:
        print("Executando pipeline para dados reais...")
        return predict_real_data(dataframe)
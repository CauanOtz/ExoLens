# app/prediction_service.py

import pandas as pd
import joblib
import numpy as np
import shap

# --- CARREGAMENTO DOS ARTEFATOS ---
print("Carregando artefatos de ML...")
XGBOOST_MODEL = joblib.load('artifacts/xgboost_model.pkl')
META_MODEL = joblib.load('artifacts/meta_model.pkl') # Carregando o modelo híbrido final
SCALER = joblib.load('artifacts/scaler.pkl')
NN_FINDER = joblib.load('artifacts/nn_finder.pkl')
REFERENCE_DB = pd.read_csv('artifacts/reference_db.csv')
EXOMINER_MODEL = joblib.load('artifacts/xgboost_model.pkl') # Placeholder
SHAP_EXPLAINER = joblib.load('artifacts/shap_explainer.pkl')
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

# --- FUNÇÕES AUXILIARES ---
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

def _get_shap_explanation(input_df):
    """Gera a explicação SHAP para as predições do XGBoost."""
    shap_values = SHAP_EXPLAINER.shap_values(input_df)
    # Pega a explicação apenas para a primeira linha para o JSON de resposta
    explanation = {
        "features": input_df.columns.tolist(),
        "contribuicoes": shap_values[0].tolist()
    }
    return explanation, shap_values

def _log_explanation_to_console(explanation, candidate_index=0):
    """Cria uma tabela formatada da explicação e a exibe no console."""
    print(f"\n--- ANÁLISE SHAP (XAI) PARA O CANDIDATO {candidate_index + 1} ---")
    exp_df = pd.DataFrame({
        'Feature': explanation['features'],
        'Impacto (SHAP Value)': explanation['contribuicoes']
    })
    exp_df['Impacto Absoluto'] = exp_df['Impacto (SHAP Value)'].abs()
    exp_df_sorted = exp_df.sort_values(by='Impacto Absoluto', ascending=False).drop(columns=['Impacto Absoluto'])
    print(exp_df_sorted.to_string(index=False))
    print("---------------------------------------------------\n")

# --- FUNÇÕES DE PREDIÇÃO ---
def predict_real_data(df):
    df_xgboost_eng = _apply_feature_engineering(_handle_missing_columns(df, FEATURES_XGBOOST_COMPLETAS))
    df_xgboost_final = df_xgboost_eng[FEATURES_XGBOOST_COMPLETAS].fillna(0)
    
    xgboost_score = XGBOOST_MODEL.predict_proba(df_xgboost_final)[:, 1]
    exominer_score = EXOMINER_MODEL.predict_proba(df_xgboost_final)[:, 1]
    
    input_stacking = np.column_stack((xgboost_score, exominer_score))
    probabilidade_final = META_MODEL.predict_proba(input_stacking)
    
    explicacao, _ = _get_shap_explanation(df_xgboost_final)
    # Itera e loga a explicação para cada candidato enviado
    for i in range(len(df)):
        temp_explanation = {
            "features": explicacao['features'],
            "contribuicoes": SHAP_EXPLAINER.shap_values(df_xgboost_final.iloc[[i]])[0].tolist()
        }
        _log_explanation_to_console(temp_explanation, candidate_index=i)
    
    return {
        "probabilidade_final": probabilidade_final[:, 1].tolist(),
        "explicacao_xgboost": explicacao
    }

def predict_fictitious_data(df):
    df_xgboost_eng = _apply_feature_engineering(_handle_missing_columns(df, FEATURES_XGBOOST_COMPLETAS))
    df_xgboost_final = df_xgboost_eng[FEATURES_XGBOOST_COMPLETAS].fillna(0)
    
    xgboost_score_ficticio = XGBOOST_MODEL.predict_proba(df_xgboost_final)[:, 1]
    
    scaled_fictitious_data = SCALER.transform(df[FEATURES_PARA_BUSCA].fillna(0))
    _, indice_vizinho = NN_FINDER.kneighbors(scaled_fictitious_data)
    exominer_scores_proxy = [REFERENCE_DB.iloc[idx[0]]['exominer_score'] for idx in indice_vizinho]
    
    input_stacking = np.column_stack((xgboost_score_ficticio, exominer_scores_proxy))
    probabilidade_final = META_MODEL.predict_proba(input_stacking)
    
    explicacao, _ = _get_shap_explanation(df_xgboost_final)
    # Itera e loga a explicação para cada candidato enviado
    for i in range(len(df)):
        temp_explanation = {
            "features": explicacao['features'],
            "contribuicoes": SHAP_EXPLAINER.shap_values(df_xgboost_final.iloc[[i]])[0].tolist()
        }
        _log_explanation_to_console(temp_explanation, candidate_index=i)
    
    return {
        "probabilidade_final": probabilidade_final[:, 1].tolist(),
        "explicacao_xgboost": explicacao
    }

# --- FUNÇÃO PRINCIPAL (PONTO DE ENTRADA PARA A API) ---
def make_prediction(dataframe, data_type="real"):
    if data_type == "fictitious":
        print("Executando pipeline para dados fictícios...")
        return predict_fictitious_data(dataframe)
    else:
        print("Executando pipeline para dados reais...")
        return predict_real_data(dataframe)
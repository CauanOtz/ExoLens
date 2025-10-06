# prediction_service.py (ATUALIZADO PARA USAR EXOMINER REFERENCE + XAI opcional)

from pathlib import Path
import os
import pandas as pd
import joblib
import numpy as np
from typing import Optional, Tuple

# --- CARREGAMENTO DOS ARTEFATOS ---
print("Carregando artefatos de ML...")
BASE_DIR = Path(__file__).resolve().parent
ROOT = BASE_DIR.parent  # AI
API_REF = ROOT / 'api_service' / 'data' / 'exominer_predictions_reference.csv'

XGBOOST_MODEL = joblib.load(str(BASE_DIR / 'xgboost_model.pkl'))
META_MODEL = joblib.load(str(BASE_DIR / 'meta_model.pkl'))
SCALER = joblib.load(str(BASE_DIR / 'scaler.pkl'))
NN_FINDER = joblib.load(str(BASE_DIR / 'nn_finder.pkl'))
REFERENCE_DB = pd.read_csv(str(BASE_DIR / 'reference_db.csv'))

# ExoMiner reference (prefer EXOMINER_CSV_PATH env, else API reference CSV if exists)
EXOMINER_REFERENCE = None
env_ref = os.getenv('EXOMINER_CSV_PATH')
if env_ref and Path(env_ref).exists():
    try:
        EXOMINER_REFERENCE = pd.read_csv(env_ref)
    except Exception:
        EXOMINER_REFERENCE = None
if EXOMINER_REFERENCE is None and API_REF.exists():
    try:
        EXOMINER_REFERENCE = pd.read_csv(API_REF)
    except Exception:
        EXOMINER_REFERENCE = None

# Usando o XGBoost como placeholder para o ExoMiner APENAS como fallback
EXOMINER_MODEL = XGBOOST_MODEL

# XAI/SHAP (opcional): só é carregado se a lib e o artefato estiverem disponíveis
SHAP_EXPLAINER = None
_xai_enabled_by_env = os.getenv('XAI_ENABLE', '0').lower() in ('1', 'true', 'yes', 'on')
_xai_log_to_console = os.getenv('XAI_LOG', '0').lower() in ('1', 'true', 'yes', 'on')
try:
    import shap  # noqa: F401
    # Tenta localizar o artefato em potenciais caminhos
    for candidate in [BASE_DIR / 'shap_explainer.pkl', BASE_DIR / 'artifacts' / 'shap_explainer.pkl']:
        if SHAP_EXPLAINER is None and candidate.exists():
            try:
                SHAP_EXPLAINER = joblib.load(str(candidate))
            except Exception:
                SHAP_EXPLAINER = None
            break
except Exception:
    SHAP_EXPLAINER = None

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

# --- XAI (opcional) ---
def _get_shap_explanation(input_df: pd.DataFrame) -> Optional[Tuple[dict, np.ndarray]]:
    """Gera uma explicação SHAP simples (features + contribuições da 1ª linha).
    Retorna None se SHAP_EXPLAINER não estiver disponível.
    """
    if SHAP_EXPLAINER is None or input_df is None or input_df.empty:
        return None
    try:
        shap_values = SHAP_EXPLAINER.shap_values(input_df)
        explanation = {
            "features": input_df.columns.tolist(),
            "contribuicoes": shap_values[0].tolist()
        }
        return explanation, shap_values
    except Exception:
        return None

def _log_explanation_to_console(explanation: dict, candidate_index: int = 0) -> None:
    """Exibe uma tabela resumida das contribuições no console (opcional)."""
    if not explanation:
        return
    try:
        exp_df = pd.DataFrame({
            'Feature': explanation['features'],
            'Impacto (SHAP Value)': explanation['contribuicoes']
        })
        exp_df['Impacto Absoluto'] = exp_df['Impacto (SHAP Value)'].abs()
        exp_df_sorted = exp_df.sort_values(by='Impacto Absoluto', ascending=False).drop(columns=['Impacto Absoluto'])
        print(f"\n--- ANÁLISE SHAP (XAI) PARA O CANDIDATO {candidate_index + 1} ---")
        print(exp_df_sorted.to_string(index=False))
        print("---------------------------------------------------\n")
    except Exception:
        pass

# --- FUNÇÕES DE PREDIÇÃO ---

def _detect_id_column(df: pd.DataFrame):
    for c in ['target_id', 'tic_id', 'TIC', 'tic', 'uid', 'targetId']:
        if c in df.columns:
            return c
    return None


def _merge_exominer_score(user_df: pd.DataFrame) -> pd.DataFrame:
    # Se já houver 'exominer_score' no input, mantém
    if 'exominer_score' in user_df.columns:
        return user_df
    if EXOMINER_REFERENCE is None:
        return user_df  # sem referência, fallback depois
    id_col_user = _detect_id_column(user_df)
    # a referência deve ter 'target_id' e 'exominer_score'
    if id_col_user is None or 'target_id' not in EXOMINER_REFERENCE.columns or 'exominer_score' not in EXOMINER_REFERENCE.columns:
        return user_df
    merged = user_df.merge(EXOMINER_REFERENCE[['target_id', 'exominer_score']], left_on=id_col_user, right_on='target_id', how='left')
    return merged


def predict_real_data(df):
    """Faz a predição para dados reais, calculando AMBOS os scores internamente."""
    # 0. Tenta enriquecer com a referência do ExoMiner
    df = _merge_exominer_score(df)

    # 1. Prepara dados e prevê com XGBoost
    df_xgboost = _handle_missing_columns(df, FEATURES_XGBOOST_COMPLETAS)
    df_xgboost_eng = _apply_feature_engineering(df_xgboost)
    df_xgboost_final = df_xgboost_eng[FEATURES_XGBOOST_COMPLETAS].fillna(0)
    xgboost_score = XGBOOST_MODEL.predict_proba(df_xgboost_final)[:, 1]
    
    # 2. Score ExoMiner: se vier da referência (coluna exominer_score), usa; senão fallback no placeholder
    if 'exominer_score' in df.columns and df['exominer_score'].notna().any():
        exo_col = df['exominer_score'].fillna(0).values
    else:
        exo_col = EXOMINER_MODEL.predict_proba(df_xgboost_final)[:, 1]
    
    # 3. Previsão final com o Meta-Modelo
    input_stacking = np.column_stack((xgboost_score, exo_col))
    probabilidade_final = META_MODEL.predict_proba(input_stacking)
    
    # 4. XAI opcional
    if _xai_enabled_by_env and SHAP_EXPLAINER is not None:
        maybe_exp = _get_shap_explanation(df_xgboost_final)
        if maybe_exp is not None:
            explicacao, _ = maybe_exp
            if _xai_log_to_console:
                # Loga uma explicação por candidato
                for i in range(len(df_xgboost_final)):
                    single_exp = {
                        "features": explicacao['features'],
                        "contribuicoes": SHAP_EXPLAINER.shap_values(df_xgboost_final.iloc[[i]])[0].tolist()
                    }
                    _log_explanation_to_console(single_exp, candidate_index=i)
            return {
                "probabilidade_final": probabilidade_final[:, 1].tolist(),
                "explicacao_xgboost": explicacao
            }
    
    return {"probabilidade_final": probabilidade_final[:, 1].tolist()}

# (A função predict_fictitious_data continua a mesma)
def predict_fictitious_data(df):
    df_xgboost = _handle_missing_columns(df, FEATURES_XGBOOST_COMPLETAS)
    df_xgboost_eng = _apply_feature_engineering(df_xgboost)
    df_xgboost_final = df_xgboost_eng[FEATURES_XGBOOST_COMPLETAS].fillna(0)
    xgboost_score_ficticio = XGBOOST_MODEL.predict_proba(df_xgboost_final)[:, 1]
    
    scaled_fictitious_data = SCALER.transform(df[FEATURES_PARA_BUSCA].fillna(0))
    _, indice_vizinho = NN_FINDER.kneighbors(scaled_fictitious_data)
    
    exominer_scores_proxy = [REFERENCE_DB.iloc[idx[0]]['exominer_score'] for idx in indice_vizinho]
    
    input_stacking = np.column_stack((xgboost_score_ficticio, exominer_scores_proxy))
    probabilidade_final = META_MODEL.predict_proba(input_stacking)
    
    # XAI opcional
    if _xai_enabled_by_env and SHAP_EXPLAINER is not None:
        maybe_exp = _get_shap_explanation(df_xgboost_final)
        if maybe_exp is not None:
            explicacao, _ = maybe_exp
            if _xai_log_to_console:
                for i in range(len(df_xgboost_final)):
                    single_exp = {
                        "features": explicacao['features'],
                        "contribuicoes": SHAP_EXPLAINER.shap_values(df_xgboost_final.iloc[[i]])[0].tolist()
                    }
                    _log_explanation_to_console(single_exp, candidate_index=i)
            return {
                "probabilidade_final": probabilidade_final[:, 1].tolist(),
                "explicacao_xgboost": explicacao
            }
    
    return {"probabilidade_final": probabilidade_final[:, 1].tolist()}

# --- FUNÇÃO PRINCIPAL ---
def make_prediction(dataframe, data_type="real"):
    if data_type == "fictitious":
        print("Executando pipeline para dados fictícios...")
        return predict_fictitious_data(dataframe)
    else:
        print("Executando pipeline para dados reais...")
        return predict_real_data(dataframe)
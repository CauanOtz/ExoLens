import pandas as pd
import lightkurve as lk
import os

# --- CONFIGURAÇÃO ---
# Caminho para sua tabela de TCEs do Kepler (a fonte da verdade)
TCE_TABLE_PATH = '../pipeline_exominer_KEPLER_MANUAL/input/kepler_tce_table.csv'

# Pasta onde os arquivos FITS serão salvos.
# DEVE ser a mesma que você definiu no seu kepler_config.yaml (lc_data_dir)
DOWNLOAD_DIR = '../pipeline_exominer_KEPLER_MANUAL/lightcurves_kepler'

# --- INÍCIO DO SCRIPT ---

print("Iniciando o script de download dos arquivos FITS do Kepler...")

# Garante que o diretório de download exista
if not os.path.exists(DOWNLOAD_DIR):
    print(f"Criando diretório de download em: {DOWNLOAD_DIR}")
    os.makedirs(DOWNLOAD_DIR)

# Carrega a tabela de TCEs para obter a lista de alvos
try:
    tce_df = pd.read_csv(TCE_TABLE_PATH)
    # Pega apenas os KEPIDs únicos para não buscar o mesmo alvo várias vezes
    target_ids = tce_df['kepid'].unique()
    print(f"Encontrados {len(target_ids)} alvos únicos para baixar.")
except Exception as e:
    print(f"ERRO: Não foi possível ler o arquivo de TCEs em {TCE_TABLE_PATH}")
    print(f"Detalhe do erro: {e}")
    exit()

# Itera sobre cada KEPID e baixa os dados
for i, kepid in enumerate(target_ids):
    print(f"\n--- Processando Alvo {i+1}/{len(target_ids)}: KIC-{kepid} ---")

    try:
        # Procura por todas as curvas de luz da missão Kepler para este KEPID
        search_result = lk.search_lightcurve(f'KIC {kepid}', mission='Kepler')

        if len(search_result) > 0:
            print(f"Encontradas {len(search_result)} curvas de luz. Baixando todas...")
            # Baixa todos os arquivos encontrados para o nosso diretório
            search_result.download_all(download_dir=DOWNLOAD_DIR)
            print(f"Download para KIC-{kepid} concluído.")
        else:
            print(f"AVISO: Nenhuma curva de luz encontrada para KIC-{kepid} no arquivo MAST.")

    except Exception as e:
        print(f"ERRO: Falha ao processar KIC-{kepid}. Pulando para o próximo.")
        print(f"Detalhe do erro: {e}")

print("\n--- Processo de download finalizado! ---")
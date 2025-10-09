# api_server.py

from flask import Flask, request, jsonify
import pandas as pd
import io

# Importa nossa função orquestradora do outro arquivo
from .prediction_service import make_prediction

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    # 1. Recebe os dados da requisição
    data = request.json

    # --- ADICIONE ESTAS LINHAS ---
    print("\n" + "="*50)
    print("--- DADOS BRUTOS RECEBIDOS PELA API ---")
    print(data)
    print("="*50 + "\n")
    # --- FIM DA ADIÇÃO ---

    
    if not data or 'csv_data' not in data:
        return jsonify({"error": "Payload inválido. Chave 'csv_data' ausente."}), 400

    csv_string = data['csv_data']
    data_type = data.get('data_type', 'real') # Pega o tipo de dado, padrão é 'real'

    # 2. Converte a string CSV em DataFrame
    try:
        dataframe_usuario = pd.read_csv(io.StringIO(csv_string))
    except Exception as e:
        return jsonify({"error": f"Erro ao processar o CSV: {e}"}), 400

    # 3. Chama nosso serviço de predição
    try:
        resultado = make_prediction(dataframe_usuario, data_type)
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": f"Erro durante a predição: {e}"}), 500


if __name__ == '__main__':
    # Roda o servidor, acessível na sua rede local
    app.run(host='0.0.0.0', port=5001, debug=True)
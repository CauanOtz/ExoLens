#!/bin/bash
# Script customizado para executar o pipeline ExoMiner no nosso projeto.

# 1. NOME DA IMAGEM OFICIAL (confirmado em getting-started.md)
IMAGE_NAME="ghcr.io/nasa/exominer:latest" #

# 2. VARIÁVEIS DO NOSSO PROJETO
# Aponta para a pasta 'input' DENTRO do nosso diretório de trabalho.
INPUT_DIR="$(pwd)/input"
# O nome do nosso arquivo de alvos.
TICS_TABLE_FILE="tess_targets.csv"
# Aponta para a pasta 'output' DENTRO do nosso diretório de trabalho.
OUTPUT_DIR="$(pwd)/output"

# 3. PARÂMETROS DE EXECUÇÃO DO PIPELINE (baseado em running-exominer-pipeline.md)
# Modelo mais leve e rápido, ideal para o hackathon.
EXOMINER_MODEL="exominer++_single"
# Modo de coleta de dados padrão para TESS.
DATA_COLLECTION_MODE="2min"

# --- INÍCIO DA EXECUÇÃO ---

echo "Baixando a imagem mais recente do ExoMiner: $IMAGE_NAME..."
docker pull $IMAGE_NAME

echo "Executando o pipeline ExoMiner..."

docker run --rm \
  -v "$INPUT_DIR:/app/input:Z" \
  -v "$OUTPUT_DIR:/app/output:Z" \
  $IMAGE_NAME \
  --tic_ids_fp="/app/input/$TICS_TABLE_FILE" \
  --output_dir="/app/output" \
  --exominer_model="$EXOMINER_MODEL" \
  --data_collection_mode="$DATA_COLLECTION_MODE"

echo "Pipeline concluído! Resultados salvos em '$OUTPUT_DIR'."
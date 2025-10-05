<#
.SYNOPSIS
    Runs the ExoMiner Docker pipeline. Handles path setup and GHCR login.
.DESCRIPTION
    This script is a PowerShell wrapper to simplify running the ExoMiner container.
    It automatically handles mapping local 'input' and 'output' folders and can
    prompt for GitHub credentials if the Docker image pull fails.
.EXAMPLE
    # Basic run using default values
    .\run_exominer.ps1
.EXAMPLE
    # Force a login prompt before running
    .\run_exominer.ps1 -Login
#>
param(
    [string]$Image = 'ghcr.io/nasa/exominer:latest',
    [string]$InputDir = (Join-Path (Get-Location) 'input'),
    [string]$OutputDir = (Join-Path (Get-Location) 'output'),
    [string]$TicsTableFile = 'tess_targets.csv',
    [string]$ExominerModel = 'exominer++_single',
    [string]$DataCollectionMode = '2min',
    [switch]$Login
)

# Helper function for logging messages
function Write-Log($msg) { Write-Host $msg }

Write-Log "=== ExoMiner PowerShell runner ==="
Write-Log "Image: $Image"
Write-Log "Input directory: $InputDir"
Write-Log "Output directory: $OutputDir"
Write-Log "Targets file: $TicsTableFile"

# --- Validação e Preparação de Pastas ---
try {
    $resolvedInput = (Resolve-Path $InputDir -ErrorAction Stop).Path
} catch {
    Write-Error "Pasta de entrada '$InputDir' não encontrada. Crie-a ou passe o caminho com -InputDir."; exit 1
}
if (-not (Test-Path (Join-Path $resolvedInput $TicsTableFile))) {
    Write-Error "Arquivo de alvos '$TicsTableFile' não encontrado na pasta de entrada ($resolvedInput). Abortando."; exit 1
}
try {
    $resolvedOutput = (Resolve-Path $OutputDir -ErrorAction Stop).Path
} catch {
    Write-Log "Pasta de saída '$OutputDir' não encontrada. Criando..."
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    $resolvedOutput = (Resolve-Path $OutputDir).Path
}

# Normaliza os caminhos para o formato que o Docker espera (com barras /)
$hostInput = $resolvedInput -replace '\\','/'
$hostOutput = $resolvedOutput -replace '\\','/'


# --- Lógica de Login e Download da Imagem ---
function Pull-Image([string]$img) {
    Write-Log "Baixando a imagem $img..."
    docker pull $img 2>&1 | Out-Null # Redireciona a saída para ser mais limpo
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Download concluído com sucesso."
        return $true
    }
    return $false
}

if (-not (Pull-Image $Image)) {
    Write-Log "Falha ao baixar a imagem. Tentando fazer login em ghcr.io..."
    $username = Read-Host "Digite seu nome de usuário do GitHub"
    $secureToken = Read-Host "Cole seu Personal Access Token (com permissão read:packages)" -AsSecureString
    
    # Converte o token para texto plano apenas na memória para passar ao docker
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    $plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    
    echo $plainToken | docker login ghcr.io -u $username --password-stdin
    
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null

    if ($LASTEXITCODE -ne 0) { Write-Error "Login no Docker falhou. Verifique o usuário e o token."; exit 1 }

    # Tenta baixar a imagem novamente após o login
    if (-not (Pull-Image $Image)) { Write-Error "Download da imagem ainda falhou após o login. Abortando."; exit 1 }
}

# --- Execução do Container ---
Write-Log "Executando o container..."

# Construímos o argumento --tic_ids_fp juntando o caminho e o nome do arquivo
$ticIdsArgument = '--tic_ids_fp=/app/input/' + $TicsTableFile

# Monta a lista de argumentos para o Docker de forma limpa
$dockerArgs = @(
    'run','--rm',
    '-v', "${hostInput}:/app/input",
    '-v', "${hostOutput}:/app/output",
    $Image,
    $ticIdsArgument,
    '--output_dir=/app/output',
    "--exominer_model=$ExominerModel",
    "--data_collection_mode=$DataCollectionMode",
    '--num_processes=1',
    '--num_jobs=1'       
)

# Executa o comando e captura a saída
$runOutput = & docker @dockerArgs 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "A execução do 'docker run' falhou (código de saída $LASTEXITCODE). Saída:"
    # Imprime a saída do container para facilitar o debug
    $runOutput | ForEach-Object { Write-Error "  $_" }
    exit $LASTEXITCODE
}

Write-Log "Pipeline finalizado com sucesso! Os resultados estão em: $resolvedOutput"
exit 0
# Build da imagem Docker do front (PowerShell).
# Uso: .\scripts\docker-build.ps1
#      .\scripts\docker-build.ps1 -ApiUrl "https://your-back.railway.app"
param(
    [string]$ApiUrl = "http://localhost:4000",
    [string]$Tag = "ai-factory-front"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Push-Location $Root
try {
    docker build -t $Tag --build-arg "VITE_API_URL=$ApiUrl" .
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "Imagem $Tag pronta. Correr: docker run -p 8080:80 $Tag" -ForegroundColor Green
}
finally {
    Pop-Location
}

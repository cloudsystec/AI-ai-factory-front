# Sobe o container nginx do front (PowerShell).
# Uso: .\scripts\docker-run.ps1
#      .\scripts\docker-run.ps1 -Port 3000
param(
    [string]$Tag = "ai-factory-front",
    [int]$Port = 8080,
    [string]$Name = "ai-factory-front"
)

$ErrorActionPreference = "Stop"

docker rm -f $Name 2>$null | Out-Null
docker run -d --name $Name -p "${Port}:80" $Tag
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Front em http://localhost:$Port (container $Name)" -ForegroundColor Green

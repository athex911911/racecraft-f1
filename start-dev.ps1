# F1 Insight AI - start both dev servers (backend :8000 + frontend :3000).
# Usage:  right-click > "Run with PowerShell", or in a terminal:  ./start-dev.ps1
# Stops anything already on those ports first, so it's safe to re-run.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Stop-Port([int]$port) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        $conns.OwningProcess | Select-Object -Unique | ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  freed port $port" -ForegroundColor DarkGray
    }
}

Write-Host "F1 Insight AI - starting dev servers" -ForegroundColor Red
Stop-Port 8000
Stop-Port 3000

# Backend - FastAPI (uvicorn, auto-reload)
$py = Join-Path $root "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $py)) { throw "Backend venv not found at $py - run the project setup first." }
Start-Process -FilePath $py `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "8000", "--reload" `
    -WorkingDirectory (Join-Path $root "backend")
Write-Host "  backend  -> http://localhost:8000  (API docs at /docs)" -ForegroundColor Green

# Frontend - Next.js dev
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory (Join-Path $root "frontend")
Write-Host "  frontend -> http://localhost:3000" -ForegroundColor Green

# Wait until both answer, then report.
Write-Host "`nWaiting for servers to come up..." -ForegroundColor DarkGray
$deadline = (Get-Date).AddSeconds(120)
$backendOk = $false
$frontendOk = $false
while ((Get-Date) -lt $deadline -and -not ($backendOk -and $frontendOk)) {
    Start-Sleep -Seconds 3
    if (-not $backendOk) {
        try { if ((Invoke-WebRequest "http://localhost:8000/api/health" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { $backendOk = $true } } catch {}
    }
    if (-not $frontendOk) {
        try { if ((Invoke-WebRequest "http://localhost:3000/" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { $frontendOk = $true } } catch {}
    }
}

Write-Host ""
if ($backendOk)  { Write-Host "backend  ready" -ForegroundColor Green } else { Write-Host "backend  not responding yet - check its window" -ForegroundColor Yellow }
if ($frontendOk) { Write-Host "frontend ready" -ForegroundColor Green } else { Write-Host "frontend still compiling - give it a few more seconds" -ForegroundColor Yellow }

if ($frontendOk) {
    Start-Process "http://localhost:3000"
    Write-Host "`nOpened http://localhost:3000 in your browser." -ForegroundColor Cyan
}
Write-Host "Both servers run in their own windows - close those windows to stop them." -ForegroundColor DarkGray

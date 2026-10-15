# PowerShell startup script for Gyannn Backend Platform & Speech AI Module
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Split-Path -Parent $ScriptDir)

$env:PATH = "C:\Users\mando\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin;" + $env:PATH
$env:PYTHONIOENCODING = "utf-8"
$env:WHISPER_MODEL = if ($env:WHISPER_MODEL) { $env:WHISPER_MODEL } else { "base" }

$UvicornExe = ".\backend\venv\Scripts\uvicorn.exe"
if (-not (Test-Path $UvicornExe)) {
    $UvicornExe = "C:\Users\mando\Gyan\speech-to-text-dyslexia-main\speech-to-text-dyslexia-main\venv\Scripts\uvicorn.exe"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starting Gyannn Learning Platform (FastAPI + SQLite + Whisper)" -ForegroundColor Green
Write-Host "  Listening on: http://0.0.0.0:8000" -ForegroundColor Yellow
Write-Host "  API Docs:     http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "  Dashboard:    http://localhost:8000/api/dashboard/default_child" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

& $UvicornExe backend.main:app --host 0.0.0.0 --port 8000 --reload

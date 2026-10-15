@echo off
REM Batch startup script for Gyannn Backend Platform & Speech AI Module
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

set PATH=C:\Users\mando\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin;%PATH%
set PYTHONIOENCODING=utf-8
if not defined WHISPER_MODEL set WHISPER_MODEL=base

set UVICORN_EXE=backend\venv\Scripts\uvicorn.exe
if not exist "%UVICORN_EXE%" (
    set UVICORN_EXE=C:\Users\mando\Gyan\speech-to-text-dyslexia-main\speech-to-text-dyslexia-main\venv\Scripts\uvicorn.exe
)

echo ============================================================
echo   Starting Gyannn Learning Platform (FastAPI + SQLite + Whisper)
echo   Listening on: http://0.0.0.0:8000
echo   API Docs:     http://localhost:8000/docs
echo ============================================================

"%UVICORN_EXE%" backend.main:app --host 0.0.0.0 --port 8000 --reload

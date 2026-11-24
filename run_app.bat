@echo off
cd /d "%~dp0"
echo ============================================================
echo   AI Bulk CV Screening Tool - Ruangguru AI Engineer Bootcamp
echo ============================================================
if not exist ".venv\Scripts\streamlit.exe" (
    echo [ERROR] Virtual environment belum ditemukan. Jalankan setup uv terlebih dahulu.
    pause
    exit /b 1
)
echo Membuka aplikasi Streamlit di browser...
".venv\Scripts\streamlit.exe" run app.py
pause

@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo   Setup APP-Gerenciamento - Windows
echo ==========================================

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Por favor, instale o Node.js para continuar.
    echo Visite: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detectado.

:: Check if npm is installed
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] npm nao encontrado.
    pause
    exit /b 1
)

echo [OK] npm detectado.

:: Install dependencies
echo Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas com sucesso.

:: Setup environment variables (if .env.example exists)
if exist ".env.example" (
    if not exist ".env" (
        echo Criando arquivo .env a partir do .env.example...
        copy .env.example .env
        echo [AVISO] Lembre-se de configurar suas credenciais no arquivo .env
    ) else (
        echo [OK] Arquivo .env ja existe.
    )
)

echo ==========================================
echo   Instalacao concluida com sucesso!
echo ==========================================
echo Para iniciar o servidor de desenvolvimento, execute:
echo   npm run dev
echo.
pause

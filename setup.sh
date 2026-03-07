#!/bin/bash

echo "=========================================="
echo "  Setup APP-Gerenciamento - Linux/Mac"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "[ERRO] Node.js nao encontrado. Por favor, instale o Node.js para continuar."
    echo "Visite: https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js detectado."

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "[ERRO] npm nao encontrado."
    exit 1
fi

echo "[OK] npm detectado."

# Install dependencies
echo "Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao instalar dependencias."
    exit 1
fi

echo "[OK] Dependencias instaladas com sucesso."

# Setup environment variables (if .env.example exists)
if [ -f ".env.example" ]; then
    if [ ! -f ".env" ]; then
        echo "Criando arquivo .env a partir do .env.example..."
        cp .env.example .env
        echo "[AVISO] Lembre-se de configurar suas credenciais no arquivo .env"
    else
        echo "[OK] Arquivo .env ja existe."
    fi
fi

echo "=========================================="
echo "  Instalacao concluida com sucesso!"
echo "=========================================="
echo "Para iniciar o servidor de desenvolvimento, execute:"
echo "  npm run dev"
echo ""

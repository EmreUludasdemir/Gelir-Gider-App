#!/bin/bash
# SessionStart Hook - Gelir-Gider App
# Bu hook her Claude Code oturumu başladığında çalışır

set -e

echo "🚀 Gelir-Gider App - Session başlatılıyor..."
echo ""

# Renk tanımları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Proje kök dizini
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Durum sayaçları
WARNINGS=0
ERRORS=0

# Node.js kontrolü
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js bulunamadı!"
    ((ERRORS++))
fi

# npm bağımlılıkları kontrolü
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules mevcut"
else
    echo -e "${YELLOW}⚠${NC} node_modules eksik - 'npm install' çalıştırın"
    ((WARNINGS++))
fi

# .env dosyası kontrolü
if [ -f "apps/api/.env" ]; then
    echo -e "${GREEN}✓${NC} API .env dosyası mevcut"

    # Kritik env değişkenleri kontrolü
    if grep -q "DATABASE_URL" apps/api/.env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} DATABASE_URL tanımlı"
    else
        echo -e "${RED}✗${NC} DATABASE_URL eksik!"
        ((ERRORS++))
    fi

    if grep -q "JWT_SECRET" apps/api/.env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} JWT_SECRET tanımlı"
    else
        echo -e "${RED}✗${NC} JWT_SECRET eksik!"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} API .env dosyası eksik - 'cp apps/api/.env.example apps/api/.env'"
    ((WARNINGS++))
fi

# Docker kontrolü
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        POSTGRES_RUNNING=$(docker ps --filter "name=postgres" --format "{{.Names}}" 2>/dev/null | head -1)
        REDIS_RUNNING=$(docker ps --filter "name=redis" --format "{{.Names}}" 2>/dev/null | head -1)

        if [ -n "$POSTGRES_RUNNING" ]; then
            echo -e "${GREEN}✓${NC} PostgreSQL çalışıyor"
        else
            echo -e "${YELLOW}⚠${NC} PostgreSQL çalışmıyor - 'docker-compose up -d postgres'"
            ((WARNINGS++))
        fi

        if [ -n "$REDIS_RUNNING" ]; then
            echo -e "${GREEN}✓${NC} Redis çalışıyor"
        else
            echo -e "${YELLOW}⚠${NC} Redis çalışmıyor - 'docker-compose up -d redis'"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠${NC} Docker daemon çalışmıyor"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker kurulu değil"
    ((WARNINGS++))
fi

# Git durumu
if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✓${NC} Git branch: $BRANCH"
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} $UNCOMMITTED uncommitted değişiklik var"
    fi
fi

# Build durumu
if [ -d "apps/api/dist" ]; then
    echo -e "${GREEN}✓${NC} API build mevcut"
else
    echo -e "${YELLOW}⚠${NC} API build yok - 'npm run build' çalıştırın"
    ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Özet
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ $ERRORS hata, $WARNINGS uyarı${NC}"
    echo ""
    echo "Hataları düzeltin ve tekrar deneyin."
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️ $WARNINGS uyarı${NC}"
    echo ""
    echo "Hızlı başlatma için:"
    echo "  npm install && docker-compose up -d && npm run dev"
else
    echo -e "${GREEN}✅ Ortam hazır!${NC}"
    echo ""
    echo "Başlatmak için: npm run dev"
fi

echo ""
echo "📚 Komutlar:"
echo "  npm run dev        - Geliştirme sunucularını başlat"
echo "  npm run db:seed    - Demo veri oluştur"
echo "  npm run db:studio  - Prisma Studio aç"
echo "  npm run verify     - Tüm kontrolleri çalıştır"
echo ""

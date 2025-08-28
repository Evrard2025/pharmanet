#!/bin/bash

echo "🚀 Déploiement de l'application Pharmacie Fidélité"
echo "=================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérification des prérequis
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prérequis vérifiés${NC}"

# Build du frontend
echo -e "${YELLOW}🔨 Build du frontend...${NC}"
cd frontend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend buildé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du build du frontend${NC}"
    exit 1
fi

# Retour au répertoire racine
cd ..

# Vérification du backend
echo -e "${YELLOW}🔧 Vérification du backend...${NC}"
cd back
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend préparé${NC}"
else
    echo -e "${RED}❌ Erreur lors de la préparation du backend${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}🎉 Préparation terminée !${NC}"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Poussez votre code sur GitHub"
echo "2. Déployez le frontend sur Vercel : https://vercel.com"
echo "3. Déployez le backend sur Render : https://render.com"
echo "4. Créez une base de données PostgreSQL"
echo "5. Configurez les variables d'environnement"
echo ""
echo "📖 Consultez DEPLOIEMENT.md pour les détails complets"
echo ""
echo "🔗 Liens utiles :"
echo "- Vercel: https://vercel.com"
echo "- Render: https://render.com"
echo "- Railway: https://railway.app"

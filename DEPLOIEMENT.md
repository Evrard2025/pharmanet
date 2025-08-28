# Guide de Déploiement Gratuit - Pharmacie Fidélité

## 🚀 Déploiement Frontend (React) - Vercel

### 1. Préparer le projet
```bash
cd frontend
npm run build
```

### 2. Déployer sur Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez "New Project"
4. Importez votre repository GitHub
5. Configurez :
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### 3. Variables d'environnement
Dans Vercel, ajoutez :
- `REACT_APP_API_URL`: URL de votre backend déployé

## 🖥️ Déploiement Backend (Node.js) - Render

### 1. Préparer le projet
```bash
cd back
# Assurez-vous que toutes les dépendances sont dans package.json
```

### 2. Déployer sur Render
1. Allez sur [render.com](render.com)
2. Connectez-vous avec GitHub
3. Cliquez "New +" → "Web Service"
4. Connectez votre repository
5. Configurez :
   - Name: `pharmacie-fidelite-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`

### 3. Base de données PostgreSQL
1. Dans Render, créez "New +" → "PostgreSQL"
2. Nom: `pharmacie-fidelite-db`
3. Plan: `Free`
4. Copiez la connection string

### 4. Variables d'environnement
Dans votre service web, ajoutez :
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `DATABASE_URL`: Connection string de votre DB
- `JWT_SECRET`: Clé secrète générée
- `CORS_ORIGIN`: URL de votre frontend Vercel

## 🔄 Alternative Backend - Railway

### 1. Déployer sur Railway
1. Allez sur [railway.app](railway.app)
2. Connectez-vous avec GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Sélectionnez votre repository
5. Railway détectera automatiquement Node.js

### 2. Base de données
1. "New" → "Database" → "PostgreSQL"
2. Railway créera automatiquement la DB

## 📝 Étapes de déploiement

### Étape 1: Frontend
```bash
cd frontend
npm run build
# Déployer sur Vercel
```

### Étape 2: Backend
```bash
cd back
# Déployer sur Render ou Railway
```

### Étape 3: Base de données
- Créer la DB sur Render/Railway
- Mettre à jour les variables d'environnement

### Étape 4: Test
- Vérifier que l'API répond sur `/health`
- Tester la connexion frontend-backend

## 🔧 Configuration CORS

Assurez-vous que votre backend accepte les requêtes de votre frontend déployé :

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-app.vercel.app',
  credentials: true
}));
```

## 📊 Monitoring

- **Vercel**: Analytics et performance inclus
- **Render**: Logs et métriques de base
- **Railway**: Logs en temps réel

## 💰 Coûts

- **Vercel**: Gratuit (100GB bande passante/mois)
- **Render**: Gratuit (750h/mois)
- **Railway**: Gratuit (500h/mois)
- **GitHub Pages**: Totalement gratuit

## 🚨 Limitations des plans gratuits

- **Vercel**: Limite de bande passante
- **Render**: Service s'endort après 15min d'inactivité
- **Railway**: Limite d'heures par mois
- **Base de données**: Limite de stockage et connexions

## 🔄 Déploiement automatique

Tous ces services offrent un déploiement automatique :
- À chaque push sur la branche `main`
- Build et déploiement automatiques
- Rollback en cas d'erreur

## 📞 Support

- **Vercel**: Documentation excellente, communauté active
- **Render**: Support par email, documentation claire
- **Railway**: Discord communautaire, documentation

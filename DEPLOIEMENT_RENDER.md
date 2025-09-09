# 🚀 Guide de Déploiement PharmaNet sur Render

## 📋 Prérequis

- Compte Render (gratuit)
- Repository GitHub avec votre code
- Base de données PostgreSQL (Render ou externe)

## 🔧 Configuration du Projet

### 1. Fichiers de Configuration Créés

✅ **`back/start-render.js`** - Script de démarrage optimisé pour Render
✅ **`render.yaml`** - Configuration des services Render
✅ **`back/package.json`** - Scripts mis à jour

### 2. Structure du Projet

```
Projet_Fabrice/
├── back/
│   ├── start-render.js          # Script de démarrage Render
│   ├── package.json             # Scripts mis à jour
│   ├── routes/                  # Routes API
│   ├── models/                  # Modèles Sequelize
│   └── config/                  # Configuration DB
├── frontend/                    # Frontend React
├── render.yaml                  # Configuration Render
└── DEPLOIEMENT_RENDER.md        # Ce guide
```

## 🗄️ Configuration de la Base de Données

### Option 1 : Base de Données Render (Recommandée)

Le fichier `render.yaml` configure automatiquement une base PostgreSQL sur Render.

### Option 2 : Base de Données Externe (Aiven)

Si vous préférez utiliser Aiven, modifiez les variables d'environnement dans Render :

```yaml
envVars:
  - key: DB_NAME
    value: votre_db_name
  - key: DB_USER
    value: votre_db_user
  - key: DB_PASSWORD
    value: votre_db_password
  - key: DB_HOST
    value: votre_db_host
  - key: DB_PORT
    value: 28221
```

## 🚀 Étapes de Déploiement

### Étape 1 : Préparer le Repository

1. **Commiter tous les fichiers** :
   ```bash
   git add .
   git commit -m "Préparation déploiement Render"
   git push origin main
   ```

2. **Vérifier la structure** :
   - ✅ `back/start-render.js` existe
   - ✅ `render.yaml` est à la racine
   - ✅ `back/package.json` contient les scripts

### Étape 2 : Créer le Service sur Render

1. **Se connecter à Render** : https://render.com
2. **Créer un nouveau service** :
   - Type : "Blueprint"
   - Connecter votre repository GitHub
   - Sélectionner le fichier `render.yaml`

### Étape 3 : Configuration des Variables d'Environnement

Dans le dashboard Render, configurer :

#### Variables Obligatoires
```
NODE_ENV=production
PORT=10000
JWT_SECRET=[généré automatiquement]
CORS_ORIGIN=https://votre-frontend.netlify.app
```

#### Variables Optionnelles
```
HELMET_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MORGAN_FORMAT=combined
```

### Étape 4 : Déploiement

1. **Déployer le Blueprint** :
   - Render va créer automatiquement :
     - Service web (backend)
     - Base de données PostgreSQL
     - Variables d'environnement

2. **Vérifier le déploiement** :
   - URL du service : `https://pharmanet-backend.onrender.com`
   - Health check : `https://pharmanet-backend.onrender.com/health`

## 🔍 Vérification du Déploiement

### 1. Tests de Base

```bash
# Test de l'API
curl https://pharmanet-backend.onrender.com/

# Test de santé
curl https://pharmanet-backend.onrender.com/health

# Test des routes
curl https://pharmanet-backend.onrender.com/api/auth
```

### 2. Vérification de la Base de Données

Le script `start-render.js` va automatiquement :
- ✅ Se connecter à la base de données
- ✅ Créer les tables si elles n'existent pas
- ✅ Synchroniser la structure
- ✅ Créer les index nécessaires

### 3. Logs de Déploiement

Dans le dashboard Render, vérifiez les logs :
- ✅ "Connexion PostgreSQL établie avec succès"
- ✅ "Tables créées/mises à jour"
- ✅ "Serveur PharmaNet démarré"

## 🛠️ Résolution des Problèmes

### Problème : "Column does not exist"

**Solution** : Le script `start-render.js` résout automatiquement ce problème avec la synchronisation.

### Problème : "CORS Error"

**Solution** : Vérifiez la variable `CORS_ORIGIN` dans Render.

### Problème : "Database Connection Failed"

**Solution** : Vérifiez les variables de base de données dans Render.

### Problème : "Service Timeout"

**Solution** : Render gratuit a des timeouts. Considérez un plan payant pour la production.

## 📊 Configuration Avancée

### 1. Plan Payant (Recommandé pour Production)

- **Starter Plan** : $7/mois
- Pas de timeout
- Meilleures performances
- Support prioritaire

### 2. Variables d'Environnement Avancées

```yaml
envVars:
  # Base de données
  - key: DATABASE_URL
    fromDatabase:
      name: pharmanet-database
      property: connectionString
  
  # Sécurité
  - key: JWT_SECRET
    generateValue: true
  - key: JWT_EXPIRES_IN
    value: 24h
  
  # CORS
  - key: CORS_ORIGIN
    value: https://votre-frontend.netlify.app
  
  # Monitoring
  - key: LOG_LEVEL
    value: info
  - key: ENABLE_METRICS
    value: true
```

### 3. Configuration du Frontend

Mettre à jour l'URL de l'API dans votre frontend :

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pharmanet-backend.onrender.com'
  : 'http://localhost:5000';
```

## 🔄 Mise à Jour et Maintenance

### 1. Déploiement Automatique

Render déploie automatiquement à chaque push sur la branche `main`.

### 2. Mise à Jour de la Base de Données

Le script `start-render.js` gère automatiquement les migrations.

### 3. Monitoring

- **Logs** : Dashboard Render > Logs
- **Métriques** : Dashboard Render > Metrics
- **Health Check** : `/health` endpoint

## 📱 Configuration du Frontend

### 1. Variables d'Environnement Frontend

Créer `.env.production` dans le dossier `frontend/` :

```env
REACT_APP_API_URL=https://pharmanet-backend.onrender.com
REACT_APP_ENVIRONMENT=production
```

### 2. Déploiement Frontend (Netlify)

1. **Build** : `npm run build`
2. **Déployer** sur Netlify
3. **Configurer** les variables d'environnement

## 🎯 Checklist de Déploiement

### Avant le Déploiement
- [ ] Code committé et pushé sur GitHub
- [ ] Tests locaux réussis
- [ ] Variables d'environnement préparées
- [ ] URL du frontend connue

### Pendant le Déploiement
- [ ] Service créé sur Render
- [ ] Base de données configurée
- [ ] Variables d'environnement définies
- [ ] Déploiement réussi

### Après le Déploiement
- [ ] API accessible
- [ ] Base de données connectée
- [ ] Tables créées
- [ ] Frontend configuré
- [ ] Tests de bout en bout réussis

## 🆘 Support

### Logs Importants à Vérifier

```bash
# Connexion DB
✅ Connexion PostgreSQL établie avec succès

# Tables
✅ Tables créées/mises à jour avec succès

# Serveur
✅ Serveur PharmaNet démarré sur le port 10000

# Erreurs
❌ Erreur de connexion PostgreSQL
❌ Colonne manquante
❌ CORS blocked
```

### Commandes de Diagnostic

```bash
# Test de l'API
curl -X GET https://pharmanet-backend.onrender.com/health

# Test des routes
curl -X GET https://pharmanet-backend.onrender.com/api/patients

# Test CORS
curl -H "Origin: https://votre-frontend.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://pharmanet-backend.onrender.com/api/patients
```

## 🎉 Félicitations !

Votre application PharmaNet est maintenant déployée sur Render ! 

**URL de l'API** : `https://pharmanet-backend.onrender.com`
**Health Check** : `https://pharmanet-backend.onrender.com/health`

---

**Besoin d'aide ?** Consultez les logs dans le dashboard Render ou contactez l'équipe de développement.

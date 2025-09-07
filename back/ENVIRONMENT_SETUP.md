# Configuration des Variables d'Environnement

## Fichiers de Configuration

### Développement
- `back/.env` - Variables pour le développement local
- `back/env.example` - Template pour les variables de développement

### Production
- `back/.env-production` - Variables pour la production (à créer localement)
- `back/env.production.example` - Template pour les variables de production

## Configuration pour Render

### 1. Variables d'Environnement Render
Configurez ces variables dans le dashboard Render :

```bash
NODE_ENV=production
PORT=10000
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=VOTRE_MOT_DE_PASSE_AIVEN
DB_HOST=VOTRE_HOST_AIVEN
DB_PORT=28221
JWT_SECRET=[généré automatiquement par Render]
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://test-pharma.netlify.app
```

### 2. Fichier .env-production Local
Créez le fichier `back/.env-production` avec vos vraies valeurs :

```bash
# Configuration de production pour Aiven PostgreSQL
NODE_ENV=production
PORT=3000

# Base de données Aiven PostgreSQL
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=VOTRE_MOT_DE_PASSE_AIVEN
DB_HOST=VOTRE_HOST_AIVEN
DB_PORT=28221

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-production
JWT_EXPIRES_IN=24h

# Autres configurations
CORS_ORIGIN=https://test-pharma.netlify.app
```

## Sécurité

⚠️ **IMPORTANT** : Ne jamais commiter les fichiers contenant des vrais mots de passe !

- Les fichiers `.env*` sont dans `.gitignore`
- Utilisez les fichiers `.example` comme templates
- Configurez les vraies valeurs directement sur Render

## Déploiement

1. Configurez les variables d'environnement sur Render
2. Le fichier `render.yaml` utilise les variables d'environnement Render
3. Le script `start-production.js` charge les variables depuis Render

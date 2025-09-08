# Guide de dépannage - Connexion Base de données PostgreSQL

## Problème actuel
Erreur: `no pg_hba.conf entry for host "34.213.214.55", user "avnadmin", database "defaultdb", no encryption`

## Solutions par étapes

### 1. Vérifier les variables d'environnement sur Render

Connectez-vous à votre dashboard Render et vérifiez que les variables suivantes sont correctement définies :

```bash
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=VOTRE_VRAI_MOT_DE_PASSE_AIVEN
DB_HOST=VOTRE_VRAI_HOST_AIVEN
DB_PORT=28221
```

### 2. Configuration SSL pour Aiven

Si vous utilisez Aiven PostgreSQL, essayez cette configuration SSL :

```javascript
// Dans db.production.js
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false, // Important pour Aiven
  }
}
```

### 3. Alternative : Utiliser la configuration flexible

Remplacez l'import dans `start-production.js` :

```javascript
// Au lieu de :
const { connectDB } = require('./config/db.production');

// Utilisez :
const { connectDB } = require('./config/db.production.alternative');
```

### 4. Test de connexion local

Pour tester la connexion localement :

```bash
cd back
node test-db-connection.js
```

### 5. Solutions spécifiques par fournisseur

#### Aiven PostgreSQL
- Utilisez `rejectUnauthorized: false`
- Port généralement 28221
- SSL obligatoire

#### Render PostgreSQL
- Utilisez `rejectUnauthorized: true`
- Port généralement 5432
- SSL obligatoire

#### Railway PostgreSQL
- Utilisez `rejectUnauthorized: true`
- Port généralement 5432
- SSL obligatoire

### 6. Vérifications importantes

1. **Mot de passe** : Assurez-vous que le mot de passe ne contient pas de caractères spéciaux non échappés
2. **Host** : Vérifiez que l'URL du host est correcte (sans `https://`)
3. **Port** : Confirmez le port avec votre fournisseur de base de données
4. **SSL** : Tous les fournisseurs cloud nécessitent SSL

### 7. Commandes de diagnostic

```bash
# Vérifier les variables d'environnement
echo $DB_HOST
echo $DB_PORT
echo $DB_NAME
echo $DB_USER

# Test de connexion directe (si vous avez psql installé)
psql "postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
```

### 8. Logs utiles

Sur Render, vérifiez les logs pour voir :
- Les variables d'environnement chargées
- Les tentatives de connexion
- Les erreurs détaillées

### 9. Redéploiement

Après avoir modifié les variables d'environnement :
1. Sauvegardez les changements
2. Redéployez le service sur Render
3. Vérifiez les nouveaux logs

## Contact support

Si le problème persiste, contactez le support de votre fournisseur de base de données avec :
- L'erreur exacte
- Les paramètres de connexion (sans le mot de passe)
- Les logs de votre application

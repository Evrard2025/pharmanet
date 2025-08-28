# 🚀 Gestion des Utilisateurs - Pharmanet

## 📋 Vue d'ensemble

Ce module permet aux administrateurs de gérer tous les utilisateurs du système Pharmanet, incluant la création, modification, suppression et surveillance des comptes utilisateurs.

## ✨ Fonctionnalités principales

### 🔐 **Gestion des profils utilisateurs**
- **Page Profile.tsx** : Interface complète pour que chaque utilisateur gère son profil
- Modification des informations personnelles (prénom, nom, téléphone, adresse)
- Changement de mot de passe sécurisé
- Affichage des informations de fidélité (pour les patients)
- Interface responsive et intuitive

### 👥 **Gestion administrative des utilisateurs**
- **Page Users.tsx** : Interface complète pour les administrateurs
- CRUD complet des utilisateurs (Créer, Lire, Mettre à jour, Supprimer)
- Gestion des rôles (Patient, Pharmacien, Administrateur)
- Activation/désactivation des comptes
- Recherche et filtres avancés
- Pagination des résultats
- Statistiques des utilisateurs

## 🏗️ Architecture technique

### **Frontend (React + TypeScript)**
- **Profile.tsx** : Gestion du profil utilisateur connecté
- **Users.tsx** : Interface d'administration des utilisateurs
- **Hooks React Query** : Gestion des données et cache
- **Validation des formulaires** : Gestion des erreurs et validation
- **Interface responsive** : Optimisée pour tous les appareils

### **Backend (Node.js + Express)**
- **Routes API** : `/api/admin/users` et `/api/auth/change-password`
- **Authentification** : Middleware de protection des routes
- **Validation** : Express-validator pour la validation des données
- **Base de données** : Sequelize ORM avec PostgreSQL
- **Sécurité** : Hachage des mots de passe avec bcrypt

## 🔌 Routes API

### **Gestion des utilisateurs (Admin)**
```
GET    /api/admin/users              # Liste des utilisateurs avec pagination
GET    /api/admin/users/:id          # Détails d'un utilisateur
POST   /api/admin/users              # Créer un nouvel utilisateur
PUT    /api/admin/users/:id          # Mettre à jour un utilisateur
PATCH  /api/admin/users/:id/status   # Activer/désactiver un utilisateur
DELETE /api/admin/users/:id          # Supprimer un utilisateur
GET    /api/admin/users/stats/overview # Statistiques des utilisateurs
```

### **Authentification et profil**
```
POST   /api/auth/change-password     # Changer le mot de passe
PUT    /api/auth/profile             # Mettre à jour le profil
GET    /api/auth/me                  # Informations de l'utilisateur connecté
```

## 📱 Interface utilisateur

### **Page Profile (Utilisateur)**
- **Section Informations personnelles** : Édition en ligne des données
- **Section Compte** : Affichage du rôle et statut
- **Section Mot de passe** : Changement sécurisé avec confirmation
- **Sidebar** : Statistiques et actions rapides
- **Responsive** : Adaptation automatique aux écrans

### **Page Users (Administrateur)**
- **Tableau des utilisateurs** : Vue d'ensemble avec actions
- **Filtres avancés** : Recherche, rôle, statut
- **Modales** : Création, édition, détails
- **Actions rapides** : Activer/désactiver, modifier, supprimer
- **Pagination** : Navigation dans les résultats

## 🔒 Sécurité

### **Authentification**
- JWT tokens pour l'authentification
- Middleware de protection des routes
- Vérification des rôles et permissions

### **Validation des données**
- Validation côté serveur avec express-validator
- Sanitisation des entrées utilisateur
- Gestion des erreurs de validation

### **Gestion des mots de passe**
- Hachage bcrypt avec salt rounds
- Validation de l'ancien mot de passe
- Exigences de complexité

## 🎯 Cas d'usage

### **Pour les utilisateurs (Profile.tsx)**
1. **Modifier le profil** : Mise à jour des informations personnelles
2. **Changer le mot de passe** : Sécurisation du compte
3. **Consulter les statistiques** : Points de fidélité et niveau
4. **Gérer les préférences** : Adresse et coordonnées

### **Pour les administrateurs (Users.tsx)**
1. **Créer des comptes** : Nouveaux utilisateurs du système
2. **Gérer les rôles** : Attribution des permissions
3. **Surveiller l'activité** : Statut des comptes
4. **Maintenir la base** : Suppression des comptes inactifs

## 🚀 Démarrage rapide

### **1. Vérifier le serveur backend**
```bash
cd back
npm start
```

### **2. Tester l'API**
```bash
node test-admin-users-api.js
```

### **3. Démarrer le frontend**
```bash
cd frontend
npm start
```

### **4. Accéder aux pages**
- **Profil utilisateur** : `/profile` (après connexion)
- **Gestion des utilisateurs** : `/admin/users` (rôle admin requis)

## 🧪 Tests

### **Script de test API**
Le fichier `test-admin-users-api.js` permet de tester toutes les fonctionnalités :
- Connexion administrateur
- CRUD des utilisateurs
- Gestion des statuts
- Recherche et filtres
- Statistiques

### **Exécution des tests**
```bash
cd back
node test-admin-users-api.js
```

## 📊 Base de données

### **Modèle User**
```javascript
{
  id: INTEGER (PK),
  firstName: STRING,
  lastName: STRING,
  email: STRING (unique),
  password: STRING (hashé),
  phone: STRING,
  role: ENUM('client', 'pharmacien', 'admin'),
  address: TEXT,
  isActive: BOOLEAN,
  loyaltyPoints: INTEGER,
  loyaltyLevel: ENUM('bronze', 'argent', 'or', 'platine'),
  createdAt: DATE,
  lastLogin: DATE
}
```

## 🔧 Configuration

### **Variables d'environnement**
```env
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=30d
```

### **Permissions requises**
- **Profile.tsx** : Utilisateur connecté
- **Users.tsx** : Rôle administrateur

## 🎨 Personnalisation

### **Thèmes et couleurs**
- Utilisation des classes Tailwind CSS
- Variables CSS personnalisées
- Adaptation automatique au thème

### **Responsive design**
- Breakpoints mobiles, tablette et desktop
- Grilles adaptatives
- Navigation mobile optimisée

## 🚨 Dépannage

### **Erreurs courantes**
1. **Token expiré** : Reconnectez-vous
2. **Permissions insuffisantes** : Vérifiez votre rôle
3. **Validation échouée** : Vérifiez les champs requis

### **Logs et débogage**
- Console du navigateur pour le frontend
- Logs du serveur pour le backend
- Base de données pour vérifier les données

## 📈 Évolutions futures

### **Fonctionnalités prévues**
- [ ] Export des données utilisateurs
- [ ] Import en lot
- [ ] Historique des modifications
- [ ] Notifications de sécurité
- [ ] Audit trail complet

### **Améliorations techniques**
- [ ] Cache Redis pour les performances
- [ ] Webhooks pour les événements
- [ ] API GraphQL
- [ ] Tests automatisés complets

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez la documentation
2. Consultez les logs d'erreur
3. Testez avec le script de test
4. Contactez l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Auteur** : Équipe Pharmanet

# PharmaNet - Plateforme de Gestion Pharmaceutique

## Description

PharmaNet est une solution complète de gestion pharmaceutique moderne qui permet aux pharmaciens de gérer efficacement leurs patients, ordonnances et programmes de fidélité.

## Fonctionnalités principales

### 👥 Gestion des Patients
- Enregistrement et suivi des patients
- Historique médical complet
- Informations de contact et adresses
- Système de recherche avancée

### 📋 Gestion des Ordonnances
- Création et suivi des ordonnances
- Gestion des médicaments prescrits
- Renouvellement automatique
- Notes et observations du pharmacien

### 💊 Gestion des Consultations
- Planification des consultations
- Suivi des rendez-vous
- Notes de consultation
- Historique des visites

### 🎯 Programme de Fidélité
- Système de points
- Niveaux de fidélité (Bronze, Argent, Or, Platine)
- Récompenses et avantages
- Suivi des transactions

### 👨‍⚕️ Gestion des Utilisateurs
- Rôles multiples (Admin, Pharmacien, Client)
- Permissions granulaires
- Authentification sécurisée
- Profils personnalisés

## Architecture

### Backend
- **Framework** : Node.js avec Express
- **Base de données** : PostgreSQL avec Sequelize ORM
- **Authentification** : JWT (JSON Web Tokens)
- **Validation** : Express-validator
- **Sécurité** : Helmet, CORS, Rate limiting

### Frontend
- **Framework** : React 18 avec TypeScript
- **Styling** : Tailwind CSS
- **Routing** : React Router DOM
- **État** : React Query pour la gestion des données
- **UI Components** : Headless UI + Lucide React
- **Formulaires** : React Hook Form

## Installation et Configuration

### Prérequis
- Node.js (v16 ou supérieur)
- PostgreSQL
- npm ou yarn

### Backend

1. **Cloner le projet et naviguer vers le dossier backend :**
   ```bash
   cd back
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer l'environnement :**
   ```bash
   cp env.example .env
   # Modifier les variables dans .env selon votre configuration
   ```

4. **Configurer la base de données :**
   ```bash
   # Créer la base de données PostgreSQL
   createdb pharmanet
   
   # Exécuter les migrations
   npm run db:migrate
   
   # Créer les utilisateurs de test (optionnel)
   node create-test-users.js
   ```

5. **Lancer le serveur :**
   ```bash
   npm run dev
   ```

### Frontend

1. **Naviguer vers le dossier frontend :**
   ```bash
   cd frontend
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer l'application :**
   ```bash
   npm start
   ```

## Utilisateurs de Test

Après avoir exécuté le script de création des utilisateurs de test :

- **👑 Admin** : `admin@pharmanet.fr` / `admin123`
- **⚕️ Pharmacien** : `pharmacien@pharmanet.fr` / `pharmacien123`
- **👤 Client** : `client@pharmanet.fr` / `client123`

## Structure du Projet

```
Projet_Fabrice/
├── back/                    # Backend Node.js
│   ├── config/             # Configuration base de données
│   ├── middleware/         # Middleware Express
│   ├── models/            # Modèles Sequelize
│   ├── routes/            # Routes API
│   ├── scripts/           # Scripts utilitaires
│   └── server.js          # Point d'entrée serveur
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── contexts/      # Contextes React
│   │   ├── pages/         # Pages de l'application
│   │   ├── services/      # Services API
│   │   └── types/         # Types TypeScript
│   └── public/            # Fichiers statiques
└── README.md
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Patients
- `GET /api/patients` - Liste des patients
- `POST /api/patients` - Créer un patient
- `GET /api/patients/:id` - Détails d'un patient
- `PUT /api/patients/:id` - Modifier un patient
- `DELETE /api/patients/:id` - Supprimer un patient

### Ordonnances
- `GET /api/prescriptions` - Liste des ordonnances
- `POST /api/prescriptions` - Créer une ordonnance
- `GET /api/prescriptions/:id` - Détails d'une ordonnance
- `PUT /api/prescriptions/:id` - Modifier une ordonnance
- `DELETE /api/prescriptions/:id` - Supprimer une ordonnance

### Consultations
- `GET /api/consultations` - Liste des consultations
- `POST /api/consultations` - Créer une consultation
- `GET /api/consultations/:id` - Détails d'une consultation
- `PUT /api/consultations/:id` - Modifier une consultation
- `DELETE /api/consultations/:id` - Supprimer une consultation

## Technologies Utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de données relationnelle
- **Sequelize** - ORM pour PostgreSQL
- **JWT** - Authentification
- **bcryptjs** - Hachage des mots de passe
- **cors** - Gestion CORS
- **helmet** - Sécurité HTTP
- **express-rate-limit** - Limitation de débit

### Frontend
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS
- **React Router** - Navigation
- **React Query** - Gestion d'état serveur
- **React Hook Form** - Gestion des formulaires
- **Lucide React** - Icônes
- **Headless UI** - Composants UI accessibles

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository GitHub.

---

**PharmaNet** - Votre santé, notre priorité 🏥

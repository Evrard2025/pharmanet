# 🧪 Système de Surveillance Biologique - Pharmacie Fidélité

## 📋 Vue d'ensemble

Le système de surveillance biologique permet de gérer les surveillances hépatiques et rénales des patients sous traitement médicamenteux, avec des rappels automatiques et un suivi des paramètres biologiques.

## 🎯 Fonctionnalités principales

### 1. **Gestion des Surveillances**
- ✅ Création et modification de surveillances
- ✅ Attribution de priorités (basse, moyenne, haute)
- ✅ Définition de la fréquence de surveillance
- ✅ Association avec des patients et médicaments
- ✅ Notes et informations de laboratoire

### 2. **Types de Surveillance**
- 🫁 **Hépatique** : ASAT, ALAT, Gamma-GT, Bilirubine
- 🫀 **Rénale** : Créatinine, Urée, Potassium, Sodium
- 🔄 **Mixte** : Combinaison hépatique et rénale
- 📊 **Autre** : Paramètres spécifiques (TSH, T4, T3, etc.)

### 3. **Système de Rappels**
- ⏰ **Alertes automatiques** selon la date prochaine d'analyse
- 🚨 **Urgent** : ≤ 3 jours
- ⚠️ **Proche** : ≤ 7 jours
- ❌ **En retard** : Date dépassée
- ✅ **Normal** : > 7 jours

### 4. **Interface de Gestion**
- 📱 Interface React moderne et responsive
- 🔍 Recherche et filtres avancés
- 📊 Tableau de bord avec surveillances urgentes
- 📝 Formulaires de création/édition
- 🗑️ Gestion complète (CRUD)

## 🏗️ Architecture technique

### **Backend (Node.js + Express)**
```
back/
├── models/
│   ├── SurveillanceBiologique.js    # Modèle principal
│   ├── Medicament.js               # Modèle médicament
│   └── Patient.js                  # Modèle patient
├── routes/
│   └── surveillance-biologique.js  # API REST
└── scripts/
    └── create-test-surveillances.js # Données de test
```

### **Frontend (React + TypeScript)**
```
frontend/src/
├── pages/admin/
│   └── SurveillanceBiologique.tsx  # Page principale
├── components/
│   └── SurveillanceDashboard.tsx   # Tableau de bord
└── types/                          # Interfaces TypeScript
```

## 🚀 Installation et démarrage

### 1. **Prérequis**
- Node.js 16+
- PostgreSQL 12+
- Base de données `pharmacie` créée

### 2. **Configuration de la base de données**
```bash
# Créer les tables
cd back
node scripts/create-medicament-tables.js

# Ajouter des données de test
node scripts/create-test-medicaments.js
node scripts/create-test-surveillances.js
```

### 3. **Démarrage du serveur**
```bash
cd back
npm start
```

### 4. **Démarrage du frontend**
```bash
cd frontend
npm start
```

## 📡 API Endpoints

### **Surveillances Biologiques**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/surveillance-biologique` | Liste paginée des surveillances |
| `GET` | `/api/surveillance-biologique/search?q=terme` | Recherche de surveillances |
| `GET` | `/api/surveillance-biologique/:id` | Détails d'une surveillance |
| `POST` | `/api/surveillance-biologique` | Créer une surveillance |
| `PUT` | `/api/surveillance-biologique/:id` | Modifier une surveillance |
| `DELETE` | `/api/surveillance-biologique/:id` | Supprimer une surveillance |

### **Endpoints spécialisés**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/surveillance-biologique/urgentes` | Surveillances urgentes |
| `GET` | `/api/surveillance-biologique/patient/:id` | Surveillances d'un patient |
| `GET` | `/api/surveillance-biologique/medicament/:id` | Surveillances d'un médicament |

## 💾 Structure de la base de données

### **Table `surveillance_biologique`**
```sql
CREATE TABLE surveillance_biologique (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  medicament_id INTEGER REFERENCES medicaments(id),
  type_surveillance VARCHAR(20) NOT NULL CHECK (type_surveillance IN ('hepatique', 'renale', 'mixte', 'autre')),
  parametres TEXT[] NOT NULL,
  frequence_mois INTEGER NOT NULL DEFAULT 3,
  date_debut_surveillance DATE NOT NULL,
  date_derniere_analyse DATE,
  date_prochaine_analyse DATE NOT NULL,
  resultats TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_cours',
  priorite VARCHAR(20) NOT NULL DEFAULT 'moyenne',
  notes TEXT,
  laboratoire VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Index recommandés**
```sql
CREATE INDEX idx_surveillance_patient ON surveillance_biologique(patient_id);
CREATE INDEX idx_surveillance_medicament ON surveillance_biologique(medicament_id);
CREATE INDEX idx_surveillance_date_prochaine ON surveillance_biologique(date_prochaine_analyse);
CREATE INDEX idx_surveillance_statut ON surveillance_biologique(statut);
CREATE INDEX idx_surveillance_priorite ON surveillance_biologique(priorite);
```

## 🔧 Configuration

### **Variables d'environnement**
```env
# Base de données
DB_NAME=pharmacie
DB_USER=postgres
DB_PASSWORD=2023
DB_HOST=localhost
DB_PORT=5432

# Serveur
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=24h
```

### **Permissions utilisateur**
- **Admin** : Accès complet (CRUD)
- **Pharmacien** : Lecture, création, modification
- **Client** : Lecture de ses propres surveillances

## 📱 Utilisation

### **1. Créer une surveillance**
1. Aller à `/admin/surveillance-biologique`
2. Cliquer sur "Nouvelle Surveillance"
3. Remplir le formulaire :
   - Sélectionner le patient
   - Choisir le médicament (optionnel)
   - Définir le type de surveillance
   - Spécifier les paramètres
   - Définir la fréquence
   - Choisir la priorité
   - Ajouter des notes

### **2. Gérer les surveillances**
- **Voir** : Cliquer sur l'icône œil
- **Modifier** : Cliquer sur l'icône crayon
- **Supprimer** : Cliquer sur l'icône poubelle

### **3. Tableau de bord**
- Affichage des surveillances urgentes
- Indicateurs visuels de priorité
- Actions rapides (planifier, marquer comme fait)

## 🔍 Fonctionnalités avancées

### **Recherche et filtres**
- Recherche par nom de patient
- Recherche par nom de médicament
- Filtrage par type de surveillance
- Filtrage par statut
- Filtrage par priorité

### **Calculs automatiques**
- Statut de la surveillance selon la date
- Alertes visuelles (couleurs, icônes)
- Indicateurs de retard

### **Intégration**
- Liaison avec les consultations
- Association avec les médicaments
- Historique des analyses

## 🧪 Tests

### **Données de test**
Le script `create-test-surveillances.js` crée :
- 8 surveillances de test
- Différents types (hépatique, rénale, mixte, autre)
- Différentes priorités et statuts
- Dates variées pour tester les alertes

### **Test de l'API**
```bash
# Test simple
node test-simple-api.js

# Test complet des médicaments
node test-medicament-api.js
```

## 🚨 Surveillance et maintenance

### **Rappels automatiques**
- Vérification quotidienne des dates
- Alertes pour les surveillances en retard
- Notifications pour les analyses proches

### **Maintenance**
- Synchronisation des modèles
- Vérification des contraintes
- Nettoyage des données obsolètes

## 🔮 Évolutions futures

### **Fonctionnalités prévues**
- 📧 Notifications par email
- 📱 Notifications push
- 📊 Rapports et statistiques
- 🔗 Intégration avec les laboratoires
- 📅 Calendrier de surveillance
- 📋 Templates de surveillance

### **Améliorations techniques**
- Cache Redis pour les performances
- Webhooks pour les mises à jour
- API GraphQL
- Tests automatisés
- Monitoring et alertes

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Consulter la documentation de l'API
3. Vérifier la configuration de la base de données
4. Tester avec les scripts de test

## 📄 Licence

Ce système fait partie du projet Pharmacie Fidélité et est développé pour un usage interne.

---

**Développé avec ❤️ pour la gestion pharmaceutique moderne**

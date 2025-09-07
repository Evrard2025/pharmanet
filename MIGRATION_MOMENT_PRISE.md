# Migration : Transformation de la période de prise en dates

## Résumé des changements

Cette migration transforme le système de gestion des moments de prise des médicaments d'un système basé sur des périodes textuelles (`momentPrise`) vers un système basé sur des dates de début et fin de prise.

## Changements effectués

### Backend

#### 1. Modèles de données
- **Prescription.js** : Remplacement de `momentPrise` (ARRAY) par 2 champs DATEONLY :
  - `dateDebutPrise` (DATEONLY)
  - `dateFinPrise` (DATEONLY)

- **Consultation.js** : Même transformation pour les médicaments de consultation

#### 2. Routes API
- **prescriptions.js** : Mise à jour des routes pour gérer les nouveaux champs de dates
- **consultations.js** : Mise à jour des validations et des routes

### Frontend

#### 1. Interfaces TypeScript
- **Prescriptions.tsx** : Mise à jour de l'interface `Prescription` pour inclure les nouveaux champs
- **Consultations.tsx** : Mise à jour de l'interface `Consultation` et `NewConsultationForm`
- **ConsultationMedicaments.tsx** : Mise à jour de l'interface `Consultation`

#### 2. Composants
- **Consultations.tsx** : Remplacement des champs de période par des champs de date (type="date")
- **ConsultationMedicaments.tsx** : Mise à jour de l'affichage des dates de prise

## Script de migration

### Fichiers créés
- `back/scripts/migrate-moment-prise-to-dates.js` : Script principal de migration
- `back/run-migration.js` : Script d'exécution simplifié

### Mapping des conversions
```javascript
const MOMENT_DUREE_MAPPING = {
  'matin': 1,      // 1 jour
  'midi': 1,       // 1 jour  
  'soir': 1,       // 1 jour
  'nuit': 1,       // 1 jour
  'quotidien': 7,  // 1 semaine
  'toutes_les_8h': 3,  // 3 jours
  'toutes_les_12h': 5, // 5 jours
  'avant_repas': 1,    // 1 jour
  'apres_repas': 1,    // 1 jour
  'a_jeun': 1          // 1 jour
};
```

### Exécution de la migration

```bash
# Depuis le dossier back/
node run-migration.js
```

**⚠️ ATTENTION** : La migration supprime définitivement les colonnes `momentPrise` après conversion.

## Avantages de la nouvelle approche

1. **Clarté** : Dates de début et fin précises au lieu de périodes vagues
2. **Flexibilité** : Possibilité de définir des durées personnalisées
3. **Cohérence** : Format standardisé pour tous les médicaments
4. **Extensibilité** : Facile d'ajouter de nouveaux types de traitement

## Impact sur les utilisateurs

- Les anciennes données sont automatiquement converties avec des dates calculées
- Les nouveaux formulaires utilisent des champs de date (type="date")
- L'affichage montre maintenant les périodes de traitement précises

## Rollback

En cas de problème, il faudrait :
1. Restaurer les colonnes `momentPrise` dans la base de données
2. Revenir aux anciennes versions des modèles et routes
3. Restaurer les anciens composants frontend

## Tests recommandés

1. Vérifier que la migration s'exécute sans erreur
2. Tester la création de nouvelles prescriptions/consultations
3. Vérifier l'affichage des dates de prise dans l'interface
4. Tester la modification des dates existantes

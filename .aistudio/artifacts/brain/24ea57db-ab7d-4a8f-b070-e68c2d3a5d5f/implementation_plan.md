# Plateforme Collaborative du Bureau - Association Sportive

Application web complète, sobre et performante pour centraliser le pilotage collaboratif des 5 pôles d'une association sportive (Sportif, Animations, Financier, Buvette, Technique), avec suivi des échéances, commentaires, historisation et gestion des rôles.

### User Review & Critical Decisions

> [!IMPORTANT]
> Les choix d'architecture et de fonctionnement ont été validés lors de la phase de cadrage :

- **Mode de persistance (Confirmé)** : Stockage local réactif et persistant (`LocalStorage` avec seed de démonstration riche), découplé via une couche service abstraite prête à basculer sur Firebase Firestore sans refonte de l'interface. Un export/import JSON de sauvegarde est également inclus.
- **Pièces jointes (Confirmé)** : Liens de partage externes vérifiés (Google Drive, Dropbox, OneDrive, Nextcloud, URLs personnalisées) avec titre, vignette du service, date et auteur, sans stockage lourd de fichiers binaires sur le serveur.
- **Vue par défaut (Confirmé)** : Tableau de bord synthétique avec indicateurs clés (dossiers par pôle et statut, alertes de retard, échéances imminentes, flux d'activité récent).
- **Permissions du rôle Lecteur (Confirmé)** : Consultation exhaustive des dossiers de tous les pôles avec permission explicite d'ajouter des commentaires et des liens, sans droit d'édition structurelle (changement de statut, suppression, réassignation réservés aux Membres et Admins).

---

### 1. Overview & Core Concept

- **Fonction principale** : Guichet unique pour les membres du bureau et bénévoles référents afin d'instruire, suivre et clôturer tous les dossiers de l'association sportive selon leur cycle de vie (À faire $\to$ En cours $\to$ En attente $\to$ Terminé).
- **Public cible & Personas** :
  - *Président & Trésorier (Admin)* : Pilotage global, arbitrages budgétaires, gestion des membres et archivage.
  - *Responsables de Pôle & Bénévoles actifs (Membre du bureau)* : Création de dossiers, mise à jour des statuts, gestion des échéances (convocations, tournois, commandes buvette, traçage terrain).
  - *Membres associés & Vérificateurs (Lecteur)* : Consultation en temps réel des avancées, ajout de retours et contributions par commentaires.
- **Valeur clé** : Élimination des pertes d'informations entre réunions de bureau, visibilité immédiate sur les retards critiques et centralisation des liens documentaires par dossier.

---

### 2. User Experience & Visual Design

#### Parcours Utilisateur
1. **Accès & Rôle** : Connexion par email/mot de passe ou sélection instantanée d'un profil de démonstration (Admin Président, Responsable Pôle Sportif, Trésorier, Lecteur Bénévole) pour un test immédiat.
2. **Tableau de Bord Exécutif** :
   - Bandeau supérieur avec compteurs consolidés : total dossiers actifs, dossiers en retard avec alerte rouge, échéances à 7 jours, dossiers terminés ce mois-ci.
   - Matrice synthétique par pôle (Sportif, Animations, Financier, Buvette, Technique) avec répartition des statuts.
   - Volet latéral des dernières activités (commentaires récents, modifications de statut avec horodatage et auteur).
3. **Exploration Multi-vues** :
   - *Vue Liste* : tableau haute densité avec tri multicritère, recherche textuelle instantanée, filtres combinés par pôle, priorité, responsable et statut, pagination et actions rapides.
   - *Vue Kanban* : colonnes de statuts fluides avec cartes informatives montrant le pôle, l'échéance et le nombre de commentaires.
   - *Vue Calendrier* : calendrier mensuel interactif positionnant les dossiers sur leurs dates d'échéance avec code couleur par pôle.
4. **Fiche Dossier Détail & Collaboration** :
   - En-tête : Pôle, statut modifiable, niveau de priorité (Basse, Moyenne, Haute, Urgente), échéance et responsable(s).
   - Description riche du dossier avec métadonnées de création.
   - Section Liens & Pièces jointes : ajout d'URLs Drive/Dropbox avec titre et prévisualisation de service.
   - Fil de commentaires horodatés : saisie rapide, identification de l'auteur, avatar et date relative.
   - Journal d'audit (Historique) : traçabilité complète des modifications (changement de statut, réassignation, modification de date).
5. **Création / Édition de Dossier** :
   - Modale ergonomique avec validation des champs obligatoires, sélecteur de pôle avec code couleur sobre, sélecteur de responsable et définition de l'échéance.

#### Identité Visuelle & Charte Graphique
- **Style** : Sobriété institutionnelle sportive, design épuré sans artifices inutiles, typographie nette et lisibilité maximale.
- **Palette chromatique** :
  - *Fond & Structure* : Blanc pur (`#FFFFFF`), gris ardoise ultra-léger (`#F8FAFC`), bordures subtiles 1px (`#E2E8F0`).
  - *Bleu Marine Institutionnel* (`#0F172A` / `#1E293B`) : Navigation latérale, titres majeurs, boutons d'action principale.
  - *Accents des 5 Pôles* :
    - Sportif : Bleu athlétique (`#2563EB`)
    - Animations : Ambre festif (`#D97706`)
    - Financier : Émeraude rigueur (`#059669`)
    - Buvette : Pourpre convivial (`#7C3AED`)
    - Technique : Ardoise mécanique (`#475569`)
  - *Priorités* :
    - Urgente : Rouge vif (`#DC2626`)
    - Haute : Orange (`#EA580C`)
    - Moyenne : Bleu (`#3B82F6`)
    - Basse : Gris neutre (`#64748B`)
- **Typographie** : `Plus Jakarta Sans` ou `DM Sans` pour l'interface, avec chiffres tabulaires (`tabular-nums`) pour toutes les dates, montants et compteurs.
- **Règle Zéro-Pill & Anti-Slop** : Pas de pilules bariolées superposées. Métadonnées affichées avec séparateurs typographiques subtils (`·`).

---

### 3. Décisions Clés d'Architecture & Compromis

- **Couche Données Hybride & Découplage Firebase** :
  - *Choix* : Création d'une interface `StorageService` TypeScript implémentée par défaut avec `LocalStorageStorageService` contenant un jeu de données initial complet et réaliste d'un club de football/rugby/handball.
  - *Bénéfice* : L'application fonctionne instantanément à 100% dans l'environnement sans configuration complexe préalable, tout en fournissant le fichier `src/services/firebase.ts`, `firestore.rules` et les schémas prêts à basculer sur Firebase en un clic.
- **Pièces Jointes sous forme de Liens Documentaires** :
  - *Choix* : Permettre le stockage de liens Cloud sécurisés (Google Drive, Dropbox, OneDrive, Box, Web) avec détection d'icônes automatique.
  - *Bénéfice* : Évite les dépassements de quota de stockage gratuit Firebase Storage, respecte le RGPD du club pour les pièces d'identité ou certificats médicaux stockés sur le Drive sécurisé du club, et offre une mise en place sans coût d'infrastructure.
- **Architecture Modulaire et Contrôle d'Accès par Rôles (RBAC)** :
  - *Choix* : Définition d'un contexte `AuthContext` avec rôles explicites (`admin`, `member`, `reader`).
  - *Bénéfice* : L'interface masque ou désactive les contrôles d'édition (boutons d'archivage, suppression, changement de responsable) selon le rôle de l'utilisateur actif.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Application Shell                             │
│       ┌──────────────────────┐  ┌───────────────────────────────┐      │
│       │ Navigation Latérale  │  │ En-tête : Filtres, Rôle &     │      │
│       │ 5 Pôles + Dashboard  │  │ Sélecteur Profil Utilisateur  │      │
│       └──────────┬───────────┘  └───────────────┬───────────────┘      │
└──────────────────┼──────────────────────────────┼──────────────────────┘
                   │                              │
                   ▼                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Vues Principales                              │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐   │
│   │  Tableau de   │ │  Vue Liste    │ │  Vue Kanban   │ │  Vue     │   │
│   │  Bord Synth.  │ │  Multicritère │ │  Glisser/Dép. │ │ Calendrier│  │
│   └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └────┬─────┘   │
└───────────┼─────────────────┼─────────────────┼──────────────┼─────────┘
            │                 │                 │              │
            ▼                 ▼                 ▼              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Fiche Dossier & Modales d'Action                      │
│     - Détails, Échéance, Priorité, Pôle & Assignation                  │
│     - Liens Externes Documentaires (Drive, Docs, Sheets)               │
│     - Fil de Commentaires & Horodatage                                 │
│     - Journal d'Historique des Modifications (Audit Log)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Couche d'Abstraction de Données                      │
│             AppRepository / StorageService (TypeScript)                │
│       ┌────────────────────────────┐  ┌────────────────────────┐       │
│       │  LocalStorage + Demo Seed  │  │  Firebase Firestore    │       │
│       │  (Immédiat & Réactif)      │  │  (Prêt au déploiement) │       │
│       └────────────────────────────┘  └────────────────────────┘       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Modèle de Données (Collections / Interfaces TypeScript)

1. **`User`**
   - `id`: `string`
   - `name`: `string`
   - `email`: `string`
   - `role`: `'admin' | 'member' | 'reader'`
   - `assignedPole?`: `'sportif' | 'animations' | 'financier' | 'buvette' | 'technique'`
   - `avatar`: `string`

2. **`Dossier`**
   - `id`: `string`
   - `title`: `string`
   - `description`: `string`
   - `pole`: `'sportif' | 'animations' | 'financier' | 'buvette' | 'technique'`
   - `status`: `'todo' | 'in_progress' | 'waiting' | 'done'`
   - `priority`: `'low' | 'medium' | 'high' | 'urgent'`
   - `assignedTo`: `string[]` (IDs des utilisateurs)
   - `createdBy`: `string` (ID utilisateur)
   - `createdAt`: `string` (ISO date)
   - `updatedAt`: `string` (ISO date)
   - `dueDate`: `string` (ISO date YYYY-MM-DD)
   - `isArchived`: `boolean`

3. **`Comment`**
   - `id`: `string`
   - `dossierId`: `string`
   - `authorId`: `string`
   - `authorName`: `string`
   - `authorRole`: `string`
   - `content`: `string`
   - `createdAt`: `string` (ISO date)

4. **`AttachmentLink`**
   - `id`: `string`
   - `dossierId`: `string`
   - `title`: `string`
   - `url`: `string`
   - `type`: `'drive' | 'dropbox' | 'onedrive' | 'document' | 'spreadsheet' | 'other'`
   - `addedBy`: `string`
   - `createdAt`: `string`

5. **`HistoryItem`**
   - `id`: `string`
   - `dossierId`: `string`
   - `userId`: `string`
   - `userName`: `string`
   - `action`: `'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'updated' | 'archived'`
   - `details`: `string`
   - `timestamp`: `string`

---

### 5. Plan d'Exécution par Modules

- **Étape 1 : Fondations & Services de données**
  - Configuration des types et modèles.
  - Implémentation du service de persistance avec données de démo riches représentatives d'une association sportive réelle.
  - Configuration du contexte d'authentification et gestion des permissions.
- **Étape 2 : Tableau de bord & Vues principales**
  - KPI synthétiques : dossiers par statut, répartition par pôle, alertes de retard.
  - Vues Liste, Kanban et Calendrier avec filtres par pôle, statut et recherche.
- **Étape 3 : Fiche détaillée du dossier, collaboration & historique**
  - Modale de création / édition avec validation.
  - Panneau latéral ou modal complet de détail du dossier.
  - Module de commentaires horodatés.
  - Gestion des liens externes avec détection automatique du service (Drive, Docs, Sheets, etc.).
  - Journal d'audit d'historique en temps réel.
- **Étape 4 : Déploiement & Connecteur Firebase**
  - Fichier de configuration Firebase (`firebase-config.ts`), règles de sécurité `firestore.rules` et guide de déploiement pas à pas (Firebase Hosting, Vercel).
  - Outil de sauvegarde / export JSON et import pour la gestion autonome de l'association.

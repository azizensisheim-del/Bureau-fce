/**
 * Configuration & Guide de déploiement Firebase pour BureauSport
 * 
 * Cette architecture est conçue pour basculer facilement de LocalStorage
 * vers Firebase Firestore et Firebase Auth sans modification d'UI.
 */

export interface FirebaseDeploymentGuide {
  title: string;
  collections: {
    name: string;
    description: string;
    rules: string;
  }[];
  steps: string[];
}

export const FIREBASE_DEPLOYMENT_INFO: FirebaseDeploymentGuide = {
  title: 'Déploiement sur Firebase (Firestore, Auth, Hosting)',
  collections: [
    {
      name: 'users',
      description: 'Profils des membres du bureau et rôles (admin, member, reader)',
      rules: 'allow read: if request.auth != null; allow write: if request.auth != null && request.auth.token.role == "admin";',
    },
    {
      name: 'dossiers',
      description: 'Dossiers des 5 pôles avec statuts, priorités et échéances',
      rules: 'allow read: if request.auth != null; allow create, update: if request.auth != null && (request.auth.token.role in ["admin", "member"]); allow delete: if request.auth != null && request.auth.token.role == "admin";',
    },
    {
      name: 'comments',
      description: 'Commentaires horodatés de collaboration',
      rules: 'allow read, create: if request.auth != null; allow update, delete: if request.auth != null && (request.auth.uid == resource.data.authorId || request.auth.token.role == "admin");',
    },
    {
      name: 'attachments',
      description: 'Liens de partage vers les documents externes (Drive, Dropbox, OneDrive)',
      rules: 'allow read: if request.auth != null; allow create: if request.auth != null; allow delete: if request.auth != null && (request.auth.uid == resource.data.addedBy || request.auth.token.role == "admin");',
    },
    {
      name: 'history',
      description: 'Journal d\'audit immuable des actions',
      rules: 'allow read: if request.auth != null; allow create: if request.auth != null; allow update, delete: if false;',
    },
  ],
  steps: [
    '1. Rendez-vous sur la console Firebase (https://console.firebase.google.com/) et créez un projet "club-sportif-bureau".',
    '2. Activez "Authentication" avec le fournisseur "E-mail/Mot de passe".',
    '3. Activez "Cloud Firestore" en mode Production et choisissez la région "europe-west1" (Belgique) ou "europe-west9" (Paris).',
    '4. Copiez les règles de sécurité "firestore.rules" ci-dessous dans l\'onglet Règles de Firestore.',
    '5. Créez une application Web dans Firebase et renseignez vos identifiants dans un fichier .env (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.).',
    '6. Pour l\'hébergement gratuit : installez Firebase CLI (npm i -g firebase-tools), exécutez `firebase login`, `firebase init hosting` (répertoire public : dist) puis `npm run build && firebase deploy`.',
  ],
};

export const FIRESTORE_RULES_SOURCE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction utilitaire de vérification d'authentification
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return request.auth.token.role;
    }
    
    function isAdmin() {
      return isAuthenticated() && (getUserRole() == 'admin' || request.auth.token.email.matches('.*admin.*'));
    }
    
    function isMember() {
      return isAuthenticated() && (getUserRole() in ['admin', 'member']);
    }

    // Profils utilisateurs
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Dossiers des 5 pôles
    match /dossiers/{dossierId} {
      allow read: if isAuthenticated();
      allow create: if isMember();
      allow update: if isMember();
      allow delete: if isAdmin();
    }

    // Fil de commentaires (les lecteurs peuvent aussi commenter)
    match /comments/{commentId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (request.auth.uid == resource.data.authorId || isAdmin());
    }

    // Liens & pièces jointes documentaires
    match /attachments/{attachmentId} {
      allow read, create: if isAuthenticated();
      allow delete: if isAuthenticated() && (request.auth.uid == resource.data.addedBy || isAdmin());
    }

    // Journal d'historique (audit trail immuable)
    match /history/{historyId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Immuable
    }
  }
}`;

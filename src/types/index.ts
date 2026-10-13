export type PoleId = 'sportif' | 'animations' | 'financier' | 'buvette' | 'technique';

export type DossierStatus = 'todo' | 'in_progress' | 'waiting' | 'done';

export type DossierPriority = 'low' | 'medium' | 'high' | 'urgent';

export type UserRole = 'admin' | 'member' | 'reader';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  assignedPole?: PoleId;
  avatar: string;
  phone?: string;
}

export interface AttachmentLink {
  id: string;
  dossierId: string;
  title: string;
  url: string;
  service: 'drive' | 'dropbox' | 'onedrive' | 'docs' | 'sheets' | 'web';
  addedBy: string;
  addedByName: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  dossierId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  dossierId: string;
  userId: string;
  userName: string;
  action: 'creation' | 'status_change' | 'priority_change' | 'assignment' | 'due_date' | 'link_added' | 'comment_added' | 'archived' | 'updated';
  details: string;
  timestamp: string;
}

export interface Dossier {
  id: string;
  title: string;
  description: string;
  pole: PoleId;
  status: DossierStatus;
  priority: DossierPriority;
  assignedTo: string[]; // user IDs
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string; // YYYY-MM-DD
  isArchived: boolean;
  tags?: string[];
}

export interface PoleConfig {
  id: PoleId;
  name: string;
  shortDesc: string;
  color: string;
  bgLight: string;
  borderLight: string;
  accentHex: string;
}

export const POLES: Record<PoleId, PoleConfig> = {
  sportif: {
    id: 'sportif',
    name: 'Pôle Sportif',
    shortDesc: 'Compétitions, matchs, engagements & convocations',
    color: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    accentHex: '#2563eb',
  },
  animations: {
    id: 'animations',
    name: 'Pôle Animations',
    shortDesc: 'Événements, tournois, afterworks & soirées du club',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    accentHex: '#d97706',
  },
  financier: {
    id: 'financier',
    name: 'Pôle Financier',
    shortDesc: 'Trésorerie, subventions, budgets & factures',
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    accentHex: '#059669',
  },
  buvette: {
    id: 'buvette',
    name: 'Pôle Buvette',
    shortDesc: 'Achats, stocks, plannings & réassort des matchs',
    color: 'text-purple-700',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    accentHex: '#7c3aed',
  },
  technique: {
    id: 'technique',
    name: 'Pôle Technique',
    shortDesc: 'Réparations, traçage des terrains & entretien',
    color: 'text-slate-700',
    bgLight: 'bg-slate-100',
    borderLight: 'border-slate-300',
    accentHex: '#475569',
  },
};

export const STATUS_CONFIG: Record<DossierStatus, { label: string; color: string; bg: string; dot: string }> = {
  todo: {
    label: 'À faire',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    dot: 'bg-slate-400',
  },
  in_progress: {
    label: 'En cours',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
  },
  waiting: {
    label: 'En attente',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
  },
  done: {
    label: 'Terminé',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
  },
};

export const PRIORITY_CONFIG: Record<DossierPriority, { label: string; color: string; border: string }> = {
  low: {
    label: 'Basse',
    color: 'text-slate-500',
    border: 'border-slate-200',
  },
  medium: {
    label: 'Moyenne',
    color: 'text-blue-600',
    border: 'border-blue-200',
  },
  high: {
    label: 'Haute',
    color: 'text-amber-600',
    border: 'border-amber-300',
  },
  urgent: {
    label: 'Urgente',
    color: 'text-red-600',
    border: 'border-red-300',
  },
};

export const ROLE_CONFIG: Record<UserRole, { label: string; desc: string }> = {
  admin: {
    label: 'Admin Bureau',
    desc: 'Accès complet, gestion des utilisateurs, archivage et configuration',
  },
  member: {
    label: 'Membre du Bureau',
    desc: 'Création et modification des dossiers, statuts et pièces jointes',
  },
  reader: {
    label: 'Lecteur',
    desc: 'Consultation générale et ajout de commentaires collaboratifs',
  },
};

export interface ClubSettings {
  clubName: string;
  season: string;
  contactEmail: string;
  imminentDeadlineDays: number;
  poleLeads: Record<PoleId, string>; // poleId -> userId
}

export const DEFAULT_CLUB_SETTINGS: ClubSettings = {
  clubName: 'Club Sportif & Omnisports',
  season: '2026 / 2027',
  contactEmail: 'bureau@club-sportif.fr',
  imminentDeadlineDays: 7,
  poleLeads: {
    sportif: 'user-2',    // Sarah Benali
    animations: 'user-4', // Claire Dubois
    financier: 'user-3',  // Julien Lefebvre
    buvette: 'user-4',    // Claire Dubois
    technique: 'user-5',  // Michel Bernard
  },
};


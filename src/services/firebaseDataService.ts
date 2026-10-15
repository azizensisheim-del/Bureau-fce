import {
  collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, updateDoc, writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebaseClient';
import type { AttachmentLink, Comment, Dossier, DossierPriority, DossierStatus, HistoryItem, PoleId, User } from '../types';

type DataState = {
  dossiers: Dossier[];
  comments: Comment[];
  attachments: AttachmentLink[];
  history: HistoryItem[];
};

const newId = (name: string) => doc(collection(db, name)).id;
const now = () => new Date().toISOString();

async function addHistory(item: Omit<HistoryItem, 'id'>) {
  const id = newId('history');
  await setDoc(doc(db, 'history', id), { id, ...item });
}

export const firebaseDataService = {
  subscribe(onChange: (state: DataState) => void, onError: (error: Error) => void): Unsubscribe {
    const state: DataState = { dossiers: [], comments: [], attachments: [], history: [] };
    const emit = () => onChange({ ...state });
    const listen = <K extends keyof DataState>(key: K) => onSnapshot(
      collection(db, key),
      (snapshot) => {
        state[key] = snapshot.docs.map((item) => item.data()) as DataState[K];
        emit();
      },
      (error) => onError(error),
    );
    const unsubscribers = [listen('dossiers'), listen('comments'), listen('attachments'), listen('history')];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  },

  async saveDossier(data: Partial<Dossier> & { title: string; pole: PoleId; priority: DossierPriority }, user: User) {
    const timestamp = now();
    const id = data.id || newId('dossiers');
    const dossier: Dossier = data.id
      ? ({ ...data, id, updatedAt: timestamp } as Dossier)
      : {
          id, title: data.title, description: data.description || '', pole: data.pole,
          status: data.status || 'todo', priority: data.priority, assignedTo: data.assignedTo || [user.id],
          createdBy: user.id, createdAt: timestamp, updatedAt: timestamp,
          dueDate: data.dueDate || new Date(Date.now() + 604800000).toISOString().slice(0, 10),
          isArchived: false, tags: data.tags || [],
        };
    await setDoc(doc(db, 'dossiers', id), dossier, { merge: Boolean(data.id) });
    await addHistory({ dossierId: id, userId: user.id, userName: user.name, action: data.id ? 'updated' : 'creation', details: data.id ? 'Dossier mis à jour' : `Création du dossier « ${data.title} »`, timestamp });
  },

  async updateStatus(dossierId: string, status: DossierStatus, user: User) {
    const timestamp = now();
    await updateDoc(doc(db, 'dossiers', dossierId), { status, updatedAt: timestamp });
    await addHistory({ dossierId, userId: user.id, userName: user.name, action: 'status_change', details: `Statut passé à « ${status} »`, timestamp });
  },

  async toggleArchive(dossier: Dossier, user: User) {
    const timestamp = now();
    await updateDoc(doc(db, 'dossiers', dossier.id), { isArchived: !dossier.isArchived, updatedAt: timestamp });
    await addHistory({ dossierId: dossier.id, userId: user.id, userName: user.name, action: 'archived', details: dossier.isArchived ? 'Dossier restauré' : 'Dossier archivé', timestamp });
  },

  async deleteDossier(dossierId: string) {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'dossiers', dossierId));
    for (const name of ['comments', 'attachments', 'history']) {
      const snapshot = await getDocs(collection(db, name));
      snapshot.docs.filter((item) => item.data().dossierId === dossierId).forEach((item) => batch.delete(item.ref));
    }
    await batch.commit();
  },

  async addComment(dossierId: string, content: string, user: User) {
    const timestamp = now();
    const id = newId('comments');
    const comment: Comment = { id, dossierId, authorId: user.id, authorName: user.name, authorRole: user.role, content: content.trim(), createdAt: timestamp };
    await setDoc(doc(db, 'comments', id), comment);
    await addHistory({ dossierId, userId: user.id, userName: user.name, action: 'comment_added', details: `Commentaire ajouté par ${user.name}`, timestamp });
  },

  async addAttachment(dossierId: string, title: string, url: string, user: User) {
    const timestamp = now();
    const id = newId('attachments');
    const lower = url.toLowerCase();
    let service: AttachmentLink['service'] = 'web';
    if (lower.includes('drive.google.com')) service = 'drive';
    else if (lower.includes('docs.google.com/spreadsheets')) service = 'sheets';
    else if (lower.includes('docs.google.com')) service = 'docs';
    else if (lower.includes('dropbox.com')) service = 'dropbox';
    else if (lower.includes('onedrive') || lower.includes('sharepoint')) service = 'onedrive';
    const attachment: AttachmentLink = { id, dossierId, title: title.trim(), url: url.trim(), service, addedBy: user.id, addedByName: user.name, createdAt: timestamp };
    await setDoc(doc(db, 'attachments', id), attachment);
    await addHistory({ dossierId, userId: user.id, userName: user.name, action: 'link_added', details: `Lien ajouté : « ${title.trim()} »`, timestamp });
  },

  removeAttachment: (id: string) => deleteDoc(doc(db, 'attachments', id)),
};

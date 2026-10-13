import { Dossier, Comment, AttachmentLink, HistoryItem, User, DossierStatus, DossierPriority, PoleId, ClubSettings, DEFAULT_CLUB_SETTINGS, UserRole } from '../types';
import { INITIAL_DOSSIERS, INITIAL_USERS, INITIAL_COMMENTS, INITIAL_ATTACHMENTS, INITIAL_HISTORY } from '../data/seedData';

const STORAGE_KEYS = {
  DOSSIERS: 'bureausport_dossiers_v1',
  USERS: 'bureausport_users_v1',
  COMMENTS: 'bureausport_comments_v1',
  ATTACHMENTS: 'bureausport_attachments_v1',
  HISTORY: 'bureausport_history_v1',
  CURRENT_USER_ID: 'bureausport_current_user_v1',
  SETTINGS: 'bureausport_settings_v1',
};

class StorageService {
  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  }

  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.DOSSIERS)) {
      this.set(STORAGE_KEYS.DOSSIERS, INITIAL_DOSSIERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
      this.set(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTACHMENTS)) {
      this.set(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      this.set(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      this.set(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, DEFAULT_CLUB_SETTINGS);
    }
  }

  // --- CLUB SETTINGS ---
  public getClubSettings(): ClubSettings {
    return this.get<ClubSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_CLUB_SETTINGS);
  }

  public saveClubSettings(settings: ClubSettings): ClubSettings {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public getCurrentUserId(): string {
    return this.get<string>(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
  }

  public setCurrentUserId(userId: string): void {
    this.set(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  public saveUser(userData: Partial<User> & { name: string; email: string; role: UserRole }): User {
    const users = this.getUsers();
    if (userData.id) {
      // Update existing user
      const index = users.findIndex((u) => u.id === userData.id);
      if (index === -1) throw new Error('User not found');
      const updated: User = {
        ...users[index],
        ...userData,
      };
      users[index] = updated;
      this.set(STORAGE_KEYS.USERS, users);
      return updated;
    } else {
      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name.trim(),
        email: userData.email.trim(),
        role: userData.role,
        roleTitle: userData.roleTitle || (userData.role === 'admin' ? 'Membre du Bureau (Admin)' : userData.role === 'member' ? 'Membre Référent' : 'Bénévole Lecteur'),
        assignedPole: userData.assignedPole,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
        phone: userData.phone,
      };
      users.push(newUser);
      this.set(STORAGE_KEYS.USERS, users);
      return newUser;
    }
  }

  public deleteUser(userId: string): { success: boolean; message?: string } {
    const users = this.getUsers();
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return { success: false, message: 'Utilisateur introuvable.' };

    // Prevent deleting the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Impossible de supprimer le dernier administrateur du club.' };
      }
    }

    const updatedUsers = users.filter((u) => u.id !== userId);
    this.set(STORAGE_KEYS.USERS, updatedUsers);

    // If current user was deleted, switch to first remaining
    if (this.getCurrentUserId() === userId && updatedUsers.length > 0) {
      this.setCurrentUserId(updatedUsers[0].id);
    }

    return { success: true };
  }

  // --- DOSSIERS ---
  public getDossiers(): Dossier[] {
    return this.get<Dossier[]>(STORAGE_KEYS.DOSSIERS, INITIAL_DOSSIERS);
  }

  public getDossierById(id: string): Dossier | undefined {
    return this.getDossiers().find((d) => d.id === id);
  }

  public saveDossier(dossier: Partial<Dossier> & { title: string; pole: PoleId; priority: DossierPriority }, currentUser: User): Dossier {
    const dossiers = this.getDossiers();
    const now = new Date().toISOString();

    if (dossier.id) {
      // Update existing
      const index = dossiers.findIndex((d) => d.id === dossier.id);
      if (index === -1) throw new Error('Dossier not found');

      const existing = dossiers[index];
      const updated: Dossier = {
        ...existing,
        ...dossier,
        updatedAt: now,
      };

      dossiers[index] = updated;
      this.set(STORAGE_KEYS.DOSSIERS, dossiers);

      // Record history
      if (existing.status !== updated.status) {
        this.addHistoryItem({
          dossierId: updated.id,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'status_change',
          details: `Statut modifié de "${existing.status}" à "${updated.status}"`,
          timestamp: now,
        });
      } else if (existing.priority !== updated.priority) {
        this.addHistoryItem({
          dossierId: updated.id,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'priority_change',
          details: `Priorité modifiée de "${existing.priority}" à "${updated.priority}"`,
          timestamp: now,
        });
      } else {
        this.addHistoryItem({
          dossierId: updated.id,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'updated',
          details: `Informations générales du dossier mises à jour`,
          timestamp: now,
        });
      }

      return updated;
    } else {
      // Create new
      const newDossier: Dossier = {
        id: `dos-${Date.now()}`,
        title: dossier.title,
        description: dossier.description || '',
        pole: dossier.pole,
        status: dossier.status || 'todo',
        priority: dossier.priority || 'medium',
        assignedTo: dossier.assignedTo || [currentUser.id],
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
        dueDate: dossier.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        isArchived: false,
        tags: dossier.tags || [],
      };

      dossiers.unshift(newDossier);
      this.set(STORAGE_KEYS.DOSSIERS, dossiers);

      // Record history
      this.addHistoryItem({
        dossierId: newDossier.id,
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'creation',
        details: `Création du dossier "${newDossier.title}"`,
        timestamp: now,
      });

      return newDossier;
    }
  }

  public updateDossierStatus(dossierId: string, newStatus: DossierStatus, currentUser: User): void {
    const dossiers = this.getDossiers();
    const index = dossiers.findIndex((d) => d.id === dossierId);
    if (index !== -1) {
      const prevStatus = dossiers[index].status;
      if (prevStatus !== newStatus) {
        dossiers[index].status = newStatus;
        dossiers[index].updatedAt = new Date().toISOString();
        this.set(STORAGE_KEYS.DOSSIERS, dossiers);

        this.addHistoryItem({
          dossierId,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'status_change',
          details: `Statut passé à "${newStatus}"`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  public toggleArchiveDossier(dossierId: string, currentUser: User): boolean {
    const dossiers = this.getDossiers();
    const index = dossiers.findIndex((d) => d.id === dossierId);
    if (index !== -1) {
      const isArchived = !dossiers[index].isArchived;
      dossiers[index].isArchived = isArchived;
      dossiers[index].updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.DOSSIERS, dossiers);

      this.addHistoryItem({
        dossierId,
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'archived',
        details: isArchived ? 'Dossier archivé' : 'Dossier restauré depuis les archives',
        timestamp: new Date().toISOString(),
      });

      return isArchived;
    }
    return false;
  }

  public deleteDossier(dossierId: string): void {
    const dossiers = this.getDossiers().filter((d) => d.id !== dossierId);
    this.set(STORAGE_KEYS.DOSSIERS, dossiers);

    // Also remove comments, attachments, history
    const comments = this.getComments().filter((c) => c.dossierId !== dossierId);
    this.set(STORAGE_KEYS.COMMENTS, comments);

    const attachments = this.getAttachments().filter((a) => a.dossierId !== dossierId);
    this.set(STORAGE_KEYS.ATTACHMENTS, attachments);

    const history = this.getHistory().filter((h) => h.dossierId !== dossierId);
    this.set(STORAGE_KEYS.HISTORY, history);
  }

  // --- COMMENTS ---
  public getComments(dossierId?: string): Comment[] {
    const comments = this.get<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    if (dossierId) {
      return comments.filter((c) => c.dossierId === dossierId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addComment(dossierId: string, content: string, currentUser: User): Comment {
    const comments = this.get<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    const newComment: Comment = {
      id: `com-${Date.now()}`,
      dossierId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    this.set(STORAGE_KEYS.COMMENTS, comments);

    this.addHistoryItem({
      dossierId,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'comment_added',
      details: `Commentaire ajouté par ${currentUser.name}`,
      timestamp: new Date().toISOString(),
    });

    return newComment;
  }

  // --- ATTACHMENTS (EXTERNAL LINKS) ---
  public getAttachments(dossierId?: string): AttachmentLink[] {
    const links = this.get<AttachmentLink[]>(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS);
    if (dossierId) {
      return links.filter((l) => l.dossierId === dossierId);
    }
    return links;
  }

  public addAttachment(
    dossierId: string,
    title: string,
    url: string,
    currentUser: User
  ): AttachmentLink {
    const links = this.get<AttachmentLink[]>(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS);

    // Detect service type based on url
    let service: AttachmentLink['service'] = 'web';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('drive.google.com')) service = 'drive';
    else if (lowerUrl.includes('docs.google.com/spreadsheets')) service = 'sheets';
    else if (lowerUrl.includes('docs.google.com')) service = 'docs';
    else if (lowerUrl.includes('dropbox.com')) service = 'dropbox';
    else if (lowerUrl.includes('onedrive') || lowerUrl.includes('sharepoint')) service = 'onedrive';

    const newLink: AttachmentLink = {
      id: `att-${Date.now()}`,
      dossierId,
      title: title.trim(),
      url: url.trim(),
      service,
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    links.unshift(newLink);
    this.set(STORAGE_KEYS.ATTACHMENTS, links);

    this.addHistoryItem({
      dossierId,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'link_added',
      details: `Lien externe ajouté : "${newLink.title}"`,
      timestamp: new Date().toISOString(),
    });

    return newLink;
  }

  public removeAttachment(attachmentId: string): void {
    const links = this.getAttachments().filter((l) => l.id !== attachmentId);
    this.set(STORAGE_KEYS.ATTACHMENTS, links);
  }

  // --- HISTORY ---
  public getHistory(dossierId?: string): HistoryItem[] {
    const history = this.get<HistoryItem[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    if (dossierId) {
      return history.filter((h) => h.dossierId === dossierId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addHistoryItem(item: Omit<HistoryItem, 'id'>): HistoryItem {
    const history = this.get<HistoryItem[]>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    const newItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...item,
    };
    history.unshift(newItem);
    this.set(STORAGE_KEYS.HISTORY, history);
    return newItem;
  }

  // --- BACKUP & RESTORE / RESET ---
  public exportBackupJson(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getClubSettings(),
      dossiers: this.getDossiers(),
      users: this.getUsers(),
      comments: this.getComments(),
      attachments: this.getAttachments(),
      history: this.getHistory(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackupJson(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.dossiers || !Array.isArray(data.dossiers)) {
        return { success: false, message: 'Format invalide : données dossiers manquantes' };
      }

      this.set(STORAGE_KEYS.DOSSIERS, data.dossiers);
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.users && Array.isArray(data.users)) this.set(STORAGE_KEYS.USERS, data.users);
      if (data.comments && Array.isArray(data.comments)) this.set(STORAGE_KEYS.COMMENTS, data.comments);
      if (data.attachments && Array.isArray(data.attachments)) this.set(STORAGE_KEYS.ATTACHMENTS, data.attachments);
      if (data.history && Array.isArray(data.history)) this.set(STORAGE_KEYS.HISTORY, data.history);

      return { success: true, message: `${data.dossiers.length} dossiers et paramètres restaurés avec succès.` };
    } catch (e: any) {
      return { success: false, message: `Erreur d'import : ${e.message}` };
    }
  }

  public resetToDefault(): void {
    this.set(STORAGE_KEYS.DOSSIERS, INITIAL_DOSSIERS);
    this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.set(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    this.set(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS);
    this.set(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
    this.set(STORAGE_KEYS.SETTINGS, DEFAULT_CLUB_SETTINGS);
    this.set(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
  }
}

export const storageService = new StorageService();

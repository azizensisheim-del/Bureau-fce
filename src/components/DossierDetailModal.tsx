import React, { useState } from 'react';
import {
  Dossier,
  Comment,
  AttachmentLink,
  HistoryItem,
  User,
  POLES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  DossierStatus,
  ROLE_CONFIG,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Calendar,
  AlertCircle,
  ExternalLink,
  Trash2,
  Paperclip,
  MessageSquare,
  History,
  Send,
  Edit,
  Archive,
  User as UserIcon,
  Plus,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Cloud,
  Globe,
} from 'lucide-react';

interface DossierDetailModalProps {
  dossier: Dossier;
  users: User[];
  comments: Comment[];
  attachments: AttachmentLink[];
  history: HistoryItem[];
  onClose: () => void;
  onUpdateStatus: (dossierId: string, status: DossierStatus) => void;
  onAddComment: (dossierId: string, content: string) => void;
  onAddAttachment: (dossierId: string, title: string, url: string) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onToggleArchive: (dossierId: string) => void;
  onDeleteDossier: (dossierId: string) => void;
  onEditDossier: (dossier: Dossier) => void;
}

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  dossier,
  users,
  comments,
  attachments,
  history,
  onClose,
  onUpdateStatus,
  onAddComment,
  onAddAttachment,
  onRemoveAttachment,
  onToggleArchive,
  onDeleteDossier,
  onEditDossier,
}) => {
  const { currentUser, canEditDossier, canComment, canArchive, canDelete } = useAuth();
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'history'>('comments');

  // Comment input state
  const [commentText, setCommentText] = useState('');

  // Link input state
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = dossier.status !== 'done' && dossier.dueDate < todayStr;
  const poleConfig = POLES[dossier.pole];
  const priorityConfig = PRIORITY_CONFIG[dossier.priority];
  const statusConfig = STATUS_CONFIG[dossier.status];

  const creator = users.find((u) => u.id === dossier.createdBy);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(dossier.id, commentText);
    setCommentText('');
  };

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) return;
    onAddAttachment(dossier.id, newLinkTitle, newLinkUrl);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowAddLinkForm(false);
  };

  const getServiceIcon = (service: AttachmentLink['service']) => {
    switch (service) {
      case 'sheets':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'docs':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'drive':
        return <FolderOpen className="w-4 h-4 text-amber-600" />;
      case 'dropbox':
      case 'onedrive':
        return <Cloud className="w-4 h-4 text-sky-600" />;
      default:
        return <Globe className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* En-tête de la modale */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="min-w-0 flex-1">
            {/* Tag Pôle + Statut + Priorité */}
            <div className="flex flex-wrap items-center gap-2 text-xs mb-1.5">
              <span className={`font-semibold ${poleConfig.color}`}>
                {poleConfig.name}
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className={`font-medium ${priorityConfig.color}`}>
                Priorité {priorityConfig.label}
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              {canEditDossier && !dossier.isArchived ? (
                <select
                  value={dossier.status}
                  onChange={(e) => onUpdateStatus(dossier.id, e.target.value as DossierStatus)}
                  className={`text-xs px-2 py-0.5 rounded font-semibold border border-slate-300 bg-white ${statusConfig.color}`}
                >
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="waiting">En attente</option>
                  <option value="done">Terminé</option>
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              )}

              {dossier.isArchived && (
                <span className="bg-slate-200 text-slate-700 text-[11px] px-2 py-0.5 rounded font-medium">
                  Archivé
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {dossier.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Métadonnées essentielles : Échéance, Responsables, Créateur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            {/* Échéance */}
            <div>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date d'échéance :</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono tabular-nums font-semibold text-slate-800 text-sm">
                  {dossier.dueDate}
                </span>
                {isOverdue && (
                  <span className="text-[10px] text-red-700 bg-red-100 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" />
                    En retard
                  </span>
                )}
              </div>
            </div>

            {/* Responsable(s) assigné(s) */}
            <div>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Responsable(s) :</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {dossier.assignedTo.map((userId) => {
                  const u = users.find((user) => user.id === userId);
                  return (
                    <div
                      key={userId}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-800 font-medium"
                    >
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-200">
                        {u?.avatar && (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <span>{u?.name || 'Membre'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Créé par & Date */}
            <div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">
                Créé par :
              </div>
              <div className="text-slate-700 font-medium">
                {creator?.name || 'Inconnu'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                le {formatTimestamp(dossier.createdAt)}
              </div>
            </div>
          </div>

          {/* Description complète */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-slate-500">
              Description du dossier
            </h3>
            <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-slate-800 leading-relaxed text-xs whitespace-pre-line">
              {dossier.description || 'Aucune description détaillée renseignée.'}
            </div>

            {dossier.tags && dossier.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                <span className="font-medium text-slate-400">Étiquettes :</span>
                {dossier.tags.map((tag, idx) => (
                  <span key={tag} className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Onglets de collaboration : Commentaires | Pièces jointes / Liens | Historique */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  activeTab === 'comments'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Commentaires ({comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('attachments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  activeTab === 'attachments'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Documents & Liens ({attachments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historique ({history.length})</span>
              </button>
            </div>

            {/* Contenu de l'onglet Commentaires */}
            {activeTab === 'comments' && (
              <div className="pt-4 space-y-4">
                {/* Formulaire de saisie d'un nouveau commentaire (disponible à tous y compris lecteur) */}
                {canComment && (
                  <form onSubmit={handleSendComment} className="space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={`Écrire un commentaire en tant que ${currentUser.name} (${ROLE_CONFIG[currentUser.role].label})...`}
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publier</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Liste des commentaires */}
                <div className="space-y-3 pt-1">
                  {comments.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                      Aucun commentaire sur ce dossier pour le moment.
                    </div>
                  ) : (
                    comments.map((c) => {
                      const author = users.find((u) => u.id === c.authorId);
                      return (
                        <div
                          key={c.id}
                          className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200">
                                {author?.avatar && (
                                  <img
                                    src={author.avatar}
                                    alt={c.authorName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>
                              <span className="font-semibold text-slate-900">{c.authorName}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                {c.authorRole === 'admin'
                                  ? 'Admin'
                                  : c.authorRole === 'member'
                                  ? 'Membre'
                                  : 'Lecteur'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatTimestamp(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed pl-7 whitespace-pre-line">
                            {c.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Contenu de l'onglet Liens & Documents */}
            {activeTab === 'attachments' && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-[11px]">
                    Centralisez les documents partagés du club (Google Drive, Dropbox, OneDrive, tableurs Sheets, etc.).
                  </p>
                  <button
                    onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                    className="flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un lien</span>
                  </button>
                </div>

                {/* Formulaire d'ajout de lien externe */}
                {showAddLinkForm && (
                  <form
                    onSubmit={handleAddLinkSubmit}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 animate-in fade-in"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Titre du document ou du dossier :
                      </label>
                      <input
                        type="text"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        placeholder="Ex : Feuille d'émargement AG (Google Sheets)"
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Adresse URL :
                      </label>
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://drive.google.com/... ou https://dropbox.com/..."
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddLinkForm(false)}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
                      >
                        Enregistrer le document
                      </button>
                    </div>
                  </form>
                )}

                {/* Liste des liens existants */}
                <div className="space-y-2">
                  {attachments.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                      Aucun document ni lien externe associé à ce dossier.
                    </div>
                  ) : (
                    attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-md shrink-0">
                            {getServiceIcon(att.service)}
                          </div>
                          <div className="min-w-0">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-slate-900 hover:text-blue-700 flex items-center gap-1 truncate"
                            >
                              <span>{att.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                            </a>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                              <span className="truncate max-w-[200px] text-slate-500">{att.url}</span>
                              <span>·</span>
                              <span>Ajouté par {att.addedByName}</span>
                            </div>
                          </div>
                        </div>

                        {(currentUser.id === att.addedBy || canDelete) && (
                          <button
                            onClick={() => onRemoveAttachment(att.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                            title="Supprimer ce lien"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Contenu de l'onglet Historique (Audit Trail) */}
            {activeTab === 'history' && (
              <div className="pt-4 space-y-2">
                {history.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-lg">
                    Aucun événement dans l'historique de ce dossier.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                    {history.map((h) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white ring-2 ring-slate-200" />
                        <div className="text-slate-800 font-medium">
                          {h.details}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{h.userName}</span>
                          <span>·</span>
                          <span>{formatTimestamp(h.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pied de modale : Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {canEditDossier && !dossier.isArchived && (
              <button
                onClick={() => {
                  onEditDossier(dossier);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md font-medium transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Modifier le dossier</span>
              </button>
            )}

            {canArchive && (
              <button
                onClick={() => {
                  onToggleArchive(dossier.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md font-medium transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{dossier.isArchived ? 'Restaurer du dossier' : 'Archiver'}</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Confirmer la suppression définitive de ce dossier et de ses éléments associés ?')) {
                    onDeleteDossier(dossier.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-md font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors ml-auto"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

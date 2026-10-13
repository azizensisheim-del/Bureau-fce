import React, { useState, useEffect } from 'react';
import {
  Dossier,
  PoleId,
  DossierStatus,
  DossierPriority,
  POLES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  User,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, User as UserIcon, Tag, AlertCircle } from 'lucide-react';

interface DossierFormModalProps {
  initialDossier?: Dossier | null;
  defaultStatus?: DossierStatus;
  defaultPole?: PoleId;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (dossierData: Partial<Dossier> & { title: string; pole: PoleId; priority: DossierPriority }) => void;
}

export const DossierFormModal: React.FC<DossierFormModalProps> = ({
  initialDossier,
  defaultStatus,
  defaultPole,
  users,
  isOpen,
  onClose,
  onSave,
}) => {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pole, setPole] = useState<PoleId>(defaultPole || 'sportif');
  const [status, setStatus] = useState<DossierStatus>(defaultStatus || 'todo');
  const [priority, setPriority] = useState<DossierPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDossier) {
      setTitle(initialDossier.title);
      setDescription(initialDossier.description);
      setPole(initialDossier.pole);
      setStatus(initialDossier.status);
      setPriority(initialDossier.priority);
      setDueDate(initialDossier.dueDate);
      setAssignedTo(initialDossier.assignedTo);
      setTagsInput(initialDossier.tags ? initialDossier.tags.join(', ') : '');
    } else {
      // Default new dossier values
      setTitle('');
      setDescription('');
      setPole(defaultPole || 'sportif');
      setStatus(defaultStatus || 'todo');
      setPriority('medium');
      // Default due date to in 7 days
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split('T')[0]);
      setAssignedTo([currentUser.id]);
      setTagsInput('');
    }
    setError(null);
  }, [initialDossier, defaultStatus, defaultPole, currentUser.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre du dossier est obligatoire.');
      return;
    }
    if (!dueDate) {
      setError('La date d\'échéance est obligatoire.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      id: initialDossier?.id,
      title: title.trim(),
      description: description.trim(),
      pole,
      status,
      priority,
      dueDate,
      assignedTo: assignedTo.length > 0 ? assignedTo : [currentUser.id],
      tags,
    });

    onClose();
  };

  const toggleAssignee = (userId: string) => {
    if (assignedTo.includes(userId)) {
      if (assignedTo.length === 1) return; // Keep at least one
      setAssignedTo(assignedTo.filter((id) => id !== userId));
    } else {
      setAssignedTo([...assignedTo, userId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Entête */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">
            {initialDossier ? 'Modifier le dossier' : 'Créer un nouveau dossier'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Titre du dossier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Engagements des équipes régionales U15 et U17..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
              required
            />
          </div>

          {/* Pôle (Parmi les 5) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Pôle d'activité <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(POLES) as PoleId[]).map((poleId) => {
                const p = POLES[poleId];
                const isSelected = pole === poleId;
                return (
                  <button
                    key={poleId}
                    type="button"
                    onClick={() => setPole(poleId)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 text-xs flex items-center justify-between">
                      <span>{p.name}</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.accentHex }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Description & Objectifs
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails du dossier, démarches à accomplir, contacts utiles, contraintes..."
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Statut & Priorité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Statut initial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DossierStatus)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="waiting">En attente</option>
                <option value="done">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Niveau de priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DossierPriority)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          {/* Date d'échéance */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date d'échéance <span className="text-red-500">*</span></span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono"
              required
            />
          </div>

          {/* Responsable(s) assigné(s) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Membres du bureau assignés</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
              {users.map((u) => {
                const isChecked = assignedTo.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                      isChecked ? 'bg-white shadow-2xs font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAssignee(u.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-200 shrink-0">
                      {u.avatar && (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <span className="truncate">{u.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Étiquettes / Tags */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Mots-clés / Étiquettes (séparés par des virgules)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex : Mairie, Subvention, Match, Sécurité"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
            />
          </div>

          {/* Pied de formulaire */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              {initialDossier ? 'Mettre à jour le dossier' : 'Créer le dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

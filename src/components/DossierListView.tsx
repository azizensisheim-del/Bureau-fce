import React, { useState, useMemo } from 'react';
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
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  User as UserIcon,
  MessageSquare,
  Paperclip,
  Check,
  Archive,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface DossierListViewProps {
  dossiers: Dossier[];
  users: User[];
  commentsCountMap: Record<string, number>;
  attachmentsCountMap: Record<string, number>;
  selectedPoleFilter: PoleId | 'all' | 'archived';
  onSelectDossier: (dossier: Dossier) => void;
  onUpdateStatus: (dossierId: string, status: DossierStatus) => void;
  onToggleArchive: (dossierId: string) => void;
  onOpenCreate: () => void;
  isOverdueOnly?: boolean;
}

export const DossierListView: React.FC<DossierListViewProps> = ({
  dossiers,
  users,
  commentsCountMap,
  attachmentsCountMap,
  selectedPoleFilter,
  onSelectDossier,
  onUpdateStatus,
  onToggleArchive,
  onOpenCreate,
  isOverdueOnly,
}) => {
  const { canEditDossier, canArchive, canCreateDossier } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      // Archive filter
      if (selectedPoleFilter === 'archived') {
        if (!d.isArchived) return false;
      } else {
        if (d.isArchived) return false;
        if (selectedPoleFilter !== 'all' && d.pole !== selectedPoleFilter) {
          return false;
        }
      }

      // Overdue filter
      if (isOverdueOnly) {
        if (d.status === 'done' || d.dueDate >= todayStr) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && d.priority !== priorityFilter) return false;

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (!d.assignedTo.includes(assigneeFilter)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(query);
        const matchesDesc = d.description.toLowerCase().includes(query);
        const matchesTags = d.tags?.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesTags;
      }

      return true;
    });
  }, [dossiers, selectedPoleFilter, isOverdueOnly, statusFilter, priorityFilter, assigneeFilter, searchTerm, todayStr]);

  // Sorting
  const sortedDossiers = useMemo(() => {
    return [...filteredDossiers].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        comparison = a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'priority') {
        const weights = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = weights[b.priority] - weights[a.priority];
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredDossiers, sortBy, sortOrder]);

  const toggleSort = (field: 'dueDate' | 'priority' | 'createdAt' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getUserName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? user.name : 'Inconnu';
  };

  return (
    <div className="space-y-4">
      {/* Barre d'outils et de filtrage */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Recherche textuelle */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, description, mot-clé..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
            />
          </div>

          {/* Bouton d'ajout rapide si permis */}
          {canCreateDossier && (
            <button
              onClick={onOpenCreate}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau dossier</span>
            </button>
          )}
        </div>

        {/* Filtres secondaires */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 mr-1 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtres :</span>
          </div>

          {/* Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="waiting">En attente</option>
            <option value="done">Terminé</option>
          </select>

          {/* Priorité */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgente</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          {/* Responsable */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tous les responsables</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.roleTitle.split(' ')[0]})
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setAssigneeFilter('all');
                setSearchTerm('');
              }}
              className="text-slate-500 hover:text-slate-800 underline text-xs ml-2 cursor-pointer"
            >
              Réinitialiser
            </button>
          )}

          <div className="ml-auto text-slate-400 font-mono tabular-nums text-xs">
            {sortedDossiers.length} résultat{sortedDossiers.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Tableau Haute Densité (SaaS Clean Grid) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 min-w-[280px]">
                  <button
                    onClick={() => toggleSort('title')}
                    className="flex items-center gap-1.5 hover:text-slate-900"
                  >
                    <span>Dossier & Objet</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 min-w-[120px]">Pôle</th>
                <th className="py-3 px-4 min-w-[130px]">Statut</th>
                <th className="py-3 px-4 min-w-[100px]">
                  <button
                    onClick={() => toggleSort('priority')}
                    className="flex items-center gap-1.5 hover:text-slate-900"
                  >
                    <span>Priorité</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 min-w-[130px]">
                  <button
                    onClick={() => toggleSort('dueDate')}
                    className="flex items-center gap-1.5 hover:text-slate-900"
                  >
                    <span>Échéance</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 min-w-[140px]">Responsable(s)</th>
                <th className="py-3 px-4 text-center min-w-[80px]">Docs</th>
                <th className="py-3 px-4 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDossiers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm">Aucun dossier ne correspond aux critères.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Essayez d'ajuster les filtres ou de créer un nouveau dossier.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedDossiers.map((dossier) => {
                  const poleConfig = POLES[dossier.pole];
                  const statusConfig = STATUS_CONFIG[dossier.status];
                  const priorityConfig = PRIORITY_CONFIG[dossier.priority];
                  const isOverdue = dossier.status !== 'done' && dossier.dueDate < todayStr;
                  const cCount = commentsCountMap[dossier.id] || 0;
                  const aCount = attachmentsCountMap[dossier.id] || 0;

                  return (
                    <tr
                      key={dossier.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => onSelectDossier(dossier)}
                    >
                      {/* Dossier Titre & Description */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                          {isOverdue && (
                            <span title="Dossier en retard">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 inline" />
                            </span>
                          )}
                          <span>{dossier.title}</span>
                        </div>
                        <p className="text-slate-500 line-clamp-1 mt-0.5 text-[11px]">
                          {dossier.description}
                        </p>
                      </td>

                      {/* Pôle (Zero-pill clean text) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-medium ${poleConfig.color}`}>
                          {poleConfig.name}
                        </span>
                      </td>

                      {/* Statut avec sélecteur interactif rapide si permission */}
                      <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {canEditDossier && !dossier.isArchived ? (
                          <select
                            value={dossier.status}
                            onChange={(e) => onUpdateStatus(dossier.id, e.target.value as DossierStatus)}
                            className={`text-xs px-2 py-1 rounded font-medium border border-transparent hover:border-slate-300 transition-colors cursor-pointer ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            <option value="todo">À faire</option>
                            <option value="in_progress">En cours</option>
                            <option value="waiting">En attente</option>
                            <option value="done">Terminé</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        )}
                      </td>

                      {/* Priorité */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-medium ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                      </td>

                      {/* Échéance (Tabular numerals, highlighted if overdue) */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                        <div className={`text-xs ${isOverdue ? 'text-red-700 font-bold' : 'text-slate-700'}`}>
                          {dossier.dueDate}
                        </div>
                        {isOverdue && (
                          <div className="text-[10px] text-red-600 font-sans font-medium">
                            En retard
                          </div>
                        )}
                      </td>

                      {/* Responsables */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {dossier.assignedTo.slice(0, 2).map((userId) => {
                            const u = users.find((user) => user.id === userId);
                            return (
                              <div
                                key={userId}
                                title={u?.name || 'Assigné'}
                                className="w-6 h-6 rounded-full bg-slate-200 border border-white overflow-hidden shrink-0"
                              >
                                {u?.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <UserIcon className="w-3.5 h-3.5 text-slate-500 m-1" />
                                )}
                              </div>
                            );
                          })}
                          {dossier.assignedTo.length > 2 && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              +{dossier.assignedTo.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Documents & Commentaires count */}
                      <td className="py-3 px-4 text-center whitespace-nowrap text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          {aCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-slate-600">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span className="font-mono tabular-nums">{aCount}</span>
                            </span>
                          )}
                          {cCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px] text-slate-600">
                              <MessageSquare className="w-3 h-3 text-slate-400" />
                              <span className="font-mono tabular-nums">{cCount}</span>
                            </span>
                          )}
                          {aCount === 0 && cCount === 0 && <span>-</span>}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectDossier(dossier)}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-medium transition-colors"
                          >
                            Consulter
                          </button>

                          {canArchive && (
                            <button
                              onClick={() => onToggleArchive(dossier.id)}
                              title={dossier.isArchived ? 'Désarchiver' : 'Archiver'}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

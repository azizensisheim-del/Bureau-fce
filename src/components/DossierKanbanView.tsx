import React, { useState } from 'react';
import {
  Dossier,
  DossierStatus,
  PoleId,
  POLES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  User,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  MessageSquare,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Plus,
  User as UserIcon,
} from 'lucide-react';

interface DossierKanbanViewProps {
  dossiers: Dossier[];
  users: User[];
  commentsCountMap: Record<string, number>;
  attachmentsCountMap: Record<string, number>;
  selectedPoleFilter: PoleId | 'all' | 'archived';
  onSelectDossier: (dossier: Dossier) => void;
  onUpdateStatus: (dossierId: string, status: DossierStatus) => void;
  onOpenCreateWithStatus: (status: DossierStatus) => void;
}

const COLUMNS: { id: DossierStatus; label: string }[] = [
  { id: 'todo', label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'waiting', label: 'En attente' },
  { id: 'done', label: 'Terminé' },
];

export const DossierKanbanView: React.FC<DossierKanbanViewProps> = ({
  dossiers,
  users,
  commentsCountMap,
  attachmentsCountMap,
  selectedPoleFilter,
  onSelectDossier,
  onUpdateStatus,
  onOpenCreateWithStatus,
}) => {
  const { canEditDossier, canCreateDossier } = useAuth();
  const [draggedDossierId, setDraggedDossierId] = useState<string | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter out archived unless explicitly viewing archives
  const activeDossiers = dossiers.filter((d) => {
    if (selectedPoleFilter === 'archived') return d.isArchived;
    if (d.isArchived) return false;
    if (selectedPoleFilter !== 'all' && d.pole !== selectedPoleFilter) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canEditDossier) return;
    setDraggedDossierId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEditDossier) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: DossierStatus) => {
    if (!canEditDossier) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedDossierId;
    if (id) {
      onUpdateStatus(id, targetStatus);
    }
    setDraggedDossierId(null);
  };

  const getAdjacentStatuses = (current: DossierStatus) => {
    const order: DossierStatus[] = ['todo', 'in_progress', 'waiting', 'done'];
    const index = order.indexOf(current);
    return {
      prev: index > 0 ? order[index - 1] : null,
      next: index < order.length - 1 ? order[index + 1] : null,
    };
  };

  return (
    <div className="space-y-4">
      {/* Grille des 4 colonnes Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colDossiers = activeDossiers.filter((d) => d.status === col.id);
          const colConfig = STATUS_CONFIG[col.id];

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-100/80 rounded-xl p-3 border border-slate-200/80 min-h-[500px] flex flex-col"
            >
              {/* Entête de colonne */}
              <div className="flex items-center justify-between px-1 py-1.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colConfig.dot}`} />
                  <h3 className="font-semibold text-slate-800 text-xs">{col.label}</h3>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {colDossiers.length}
                </span>
              </div>

              {/* Liste des cartes de la colonne */}
              <div className="space-y-2.5 flex-1">
                {colDossiers.map((dossier) => {
                  const poleConfig = POLES[dossier.pole];
                  const priorityConfig = PRIORITY_CONFIG[dossier.priority];
                  const isOverdue = dossier.status !== 'done' && dossier.dueDate < todayStr;
                  const cCount = commentsCountMap[dossier.id] || 0;
                  const aCount = attachmentsCountMap[dossier.id] || 0;
                  const { prev, next } = getAdjacentStatuses(dossier.status);

                  return (
                    <div
                      key={dossier.id}
                      draggable={canEditDossier}
                      onDragStart={(e) => handleDragStart(e, dossier.id)}
                      onClick={() => onSelectDossier(dossier)}
                      className={`bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer select-none group ${
                        draggedDossierId === dossier.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Métadonnées calmes sans pills flashy */}
                      <div className="flex items-center justify-between gap-1 text-[11px] mb-1.5">
                        <span className={`font-semibold ${poleConfig.color}`}>
                          {poleConfig.name}
                        </span>
                        <span className={`font-medium ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                      </div>

                      {/* Titre */}
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                        {dossier.title}
                      </h4>

                      {/* Description courte */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                        {dossier.description}
                      </p>

                      {/* Ligne inférieure : échéance, compteurs et responsables */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        {/* Échéance */}
                        <div
                          className={`font-mono tabular-nums flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {isOverdue && <AlertCircle className="w-3 h-3 text-red-600" />}
                          <span>{dossier.dueDate}</span>
                        </div>

                        {/* Avatars & compteurs */}
                        <div className="flex items-center gap-2">
                          {cCount > 0 && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <MessageSquare className="w-3 h-3" />
                              <span className="text-[10px] font-mono tabular-nums">{cCount}</span>
                            </span>
                          )}
                          {aCount > 0 && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Paperclip className="w-3 h-3" />
                              <span className="text-[10px] font-mono tabular-nums">{aCount}</span>
                            </span>
                          )}

                          <div className="flex -space-x-1.5 ml-1">
                            {dossier.assignedTo.slice(0, 2).map((userId) => {
                              const u = users.find((user) => user.id === userId);
                              return (
                                <div
                                  key={userId}
                                  title={u?.name}
                                  className="w-5 h-5 rounded-full bg-slate-200 border border-white overflow-hidden"
                                >
                                  {u?.avatar ? (
                                    <img
                                      src={u.avatar}
                                      alt={u.name}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <UserIcon className="w-3 h-3 text-slate-500" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Boutons d'avancement rapide (mobile ou drag alternatif) */}
                      {canEditDossier && (
                        <div
                          className="mt-2 pt-1 flex items-center justify-between text-slate-400 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {prev ? (
                            <button
                              onClick={() => onUpdateStatus(dossier.id, prev)}
                              title={`Déplacer vers "${STATUS_CONFIG[prev].label}"`}
                              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded text-[10px] flex items-center gap-0.5"
                            >
                              <ChevronLeft className="w-3 h-3" />
                              <span>{STATUS_CONFIG[prev].label}</span>
                            </button>
                          ) : (
                            <span />
                          )}

                          {next && (
                            <button
                              onClick={() => onUpdateStatus(dossier.id, next)}
                              title={`Déplacer vers "${STATUS_CONFIG[next].label}"`}
                              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded text-[10px] flex items-center gap-0.5 ml-auto"
                            >
                              <span>{STATUS_CONFIG[next].label}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bouton d'ajout rapide en bas de colonne */}
              {canCreateDossier && (
                <button
                  onClick={() => onOpenCreateWithStatus(col.id)}
                  className="mt-3 w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-md border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter dans cette colonne</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

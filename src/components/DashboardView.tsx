import React from 'react';
import { Dossier, PoleId, POLES, STATUS_CONFIG, PRIORITY_CONFIG, Comment, HistoryItem, User } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ListTodo,
  ArrowRight,
  MessageSquare,
  Trophy,
  PartyPopper,
  Wallet,
  Coffee,
  Wrench,
  FileText,
} from 'lucide-react';

interface DashboardViewProps {
  dossiers: Dossier[];
  users: User[];
  comments: Comment[];
  history: HistoryItem[];
  onSelectDossier: (dossier: Dossier) => void;
  onNavigateToPole: (poleId: PoleId) => void;
  onNavigateToList: () => void;
}

const POLE_ICONS: Record<PoleId, React.ReactNode> = {
  sportif: <Trophy className="w-5 h-5 text-blue-600" />,
  animations: <PartyPopper className="w-5 h-5 text-amber-600" />,
  financier: <Wallet className="w-5 h-5 text-emerald-600" />,
  buvette: <Coffee className="w-5 h-5 text-purple-600" />,
  technique: <Wrench className="w-5 h-5 text-slate-600" />,
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  dossiers,
  users,
  comments,
  history,
  onSelectDossier,
  onNavigateToPole,
  onNavigateToList,
}) => {
  const { clubSettings } = useAuth();
  const activeDossiers = dossiers.filter((d) => !d.isArchived);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Overdue dossiers (active, dueDate < today, status !== 'done')
  const overdueDossiers = activeDossiers.filter(
    (d) => d.status !== 'done' && d.dueDate < todayStr
  );

  // Imminent dossiers based on configurable threshold from clubSettings
  const imminentThresholdDays = clubSettings?.imminentDeadlineDays || 7;
  const inThresholdDays = new Date();
  inThresholdDays.setDate(inThresholdDays.getDate() + imminentThresholdDays);
  const inThresholdStr = inThresholdDays.toISOString().split('T')[0];
  const upcomingDossiers = activeDossiers.filter(
    (d) => d.status !== 'done' && d.dueDate >= todayStr && d.dueDate <= inThresholdStr
  );

  const doneDossiers = dossiers.filter((d) => d.status === 'done');

  // Breakdown by Pole
  const poleStats = (Object.keys(POLES) as PoleId[]).map((poleId) => {
    const poleDossiers = activeDossiers.filter((d) => d.pole === poleId);
    const todoCount = poleDossiers.filter((d) => d.status === 'todo').length;
    const inProgressCount = poleDossiers.filter((d) => d.status === 'in_progress').length;
    const waitingCount = poleDossiers.filter((d) => d.status === 'waiting').length;
    const doneCount = poleDossiers.filter((d) => d.status === 'done').length;
    const overdueCount = poleDossiers.filter((d) => d.status !== 'done' && d.dueDate < todayStr).length;

    // Assigned lead for this pole from clubSettings or fallback to user assignedPole
    const leadUserId = clubSettings?.poleLeads?.[poleId];
    const leadUser = leadUserId ? users.find((u) => u.id === leadUserId) : users.find((u) => u.assignedPole === poleId);

    return {
      poleId,
      config: POLES[poleId],
      total: poleDossiers.length,
      todoCount,
      inProgressCount,
      waitingCount,
      doneCount,
      overdueCount,
      leadUser,
    };
  });

  // Top urgent / upcoming dossiers sorted by urgency and date
  const prioritizedDossiers = [...activeDossiers.filter((d) => d.status !== 'done')].sort((a, b) => {
    // If one is overdue, it goes first
    const aOverdue = a.dueDate < todayStr ? 1 : 0;
    const bOverdue = b.dueDate < todayStr ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    // Then by priority weight
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
    const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pDiff !== 0) return pDiff;

    // Then by closest due date
    return a.dueDate.localeCompare(b.dueDate);
  }).slice(0, 6);

  // Recent activities (blend comments and history)
  const recentActivities = [
    ...comments.map((c) => ({
      id: c.id,
      type: 'comment' as const,
      dossierId: c.dossierId,
      author: c.authorName,
      authorRole: c.authorRole,
      content: c.content,
      timestamp: c.createdAt,
    })),
    ...history.slice(0, 15).map((h) => ({
      id: h.id,
      type: 'history' as const,
      dossierId: h.dossierId,
      author: h.userName,
      authorRole: 'member',
      content: h.details,
      timestamp: h.timestamp,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 7);

  // Format date helper
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getDaysDiffLabel = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const curr = new Date(todayStr);
    const diffTime = due.getTime() - curr.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Retard (${Math.abs(diffDays)} j)`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: "Aujourd'hui", isOverdue: false, isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: 'Demain', isOverdue: false, isUrgent: true };
    }
    return { text: `Dans ${diffDays} j`, isOverdue: false };
  };

  return (
    <div className="space-y-6">
      {/* En-tête du tableau de bord */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tableau de Bord du Bureau
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Suivi consolidé des opérations, alertes d'échéances et activités récentes des 5 pôles.
          </p>
        </div>
        <button
          onClick={onNavigateToList}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <span>Voir tous les dossiers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Barre KPI Consolidée (Single-elevation, Tabular figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total actifs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Dossiers actifs</span>
            <ListTodo className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {activeDossiers.length}
            </span>
            <span className="text-xs text-slate-500">en cours de traitement</span>
          </div>
        </div>

        {/* En retard (Alerte rouge) */}
        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          overdueDossiers.length > 0
            ? 'bg-red-50/50 border-red-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={overdueDossiers.length > 0 ? 'text-red-700 font-semibold' : 'text-slate-500'}>
              Dossiers en retard
            </span>
            <AlertTriangle className={`w-4 h-4 ${overdueDossiers.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${
              overdueDossiers.length > 0 ? 'text-red-700' : 'text-slate-900'
            }`}>
              {overdueDossiers.length}
            </span>
            <span className="text-xs text-slate-500">
              {overdueDossiers.length > 0 ? 'action requise immédiate' : 'aucun retard'}
            </span>
          </div>
        </div>

        {/* Échéances à 7 jours */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Échéances sous 7 jours</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {upcomingDossiers.length}
            </span>
            <span className="text-xs text-slate-500">à finaliser rapidement</span>
          </div>
        </div>

        {/* Clôturés / Terminés */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Dossiers terminés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {doneDossiers.length}
            </span>
            <span className="text-xs text-slate-500">clôturés avec succès</span>
          </div>
        </div>
      </div>

      {/* Section 1 : Synthèse par Pôle (Les 5 Pôles) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Répartition par Pôle d'activité
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              État d'avancement des dossiers dans chacun des 5 domaines de l'association.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {poleStats.map((stat) => (
            <div
              key={stat.poleId}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-[260px]">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                  {POLE_ICONS[stat.poleId]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{stat.config.name}</span>
                    {stat.overdueCount > 0 && (
                      <span className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        {stat.overdueCount} en retard
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{stat.config.shortDesc}</div>
                  {stat.leadUser && (
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Référent :</span>
                      <span className="text-slate-600 font-medium">{stat.leadUser.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statuts breakdown */}
              <div className="flex items-center gap-3 sm:gap-6 text-xs">
                <div className="text-center">
                  <div className="text-slate-400 text-[10px] uppercase font-medium">À faire</div>
                  <div className="font-mono tabular-nums font-semibold text-slate-700 text-sm mt-0.5">
                    {stat.todoCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-[10px] uppercase font-medium">En cours</div>
                  <div className="font-mono tabular-nums font-semibold text-blue-700 text-sm mt-0.5">
                    {stat.inProgressCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-[10px] uppercase font-medium">En attente</div>
                  <div className="font-mono tabular-nums font-semibold text-amber-700 text-sm mt-0.5">
                    {stat.waitingCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-[10px] uppercase font-medium">Terminé</div>
                  <div className="font-mono tabular-nums font-semibold text-emerald-700 text-sm mt-0.5">
                    {stat.doneCount}
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToPole(stat.poleId)}
                  className="ml-auto md:ml-4 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                >
                  Accéder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 : Deux colonnes (Échéances prioritaires & Dernières activités) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne Gauche : Dossiers prioritaires & Retards */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Dossiers prioritaires & Échéances imminentes
            </h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {prioritizedDossiers.length} dossiers
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {prioritizedDossiers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucun dossier urgent ou en retard. Tout est à jour !
              </div>
            ) : (
              prioritizedDossiers.map((dossier) => {
                const dateInfo = getDaysDiffLabel(dossier.dueDate);
                const poleConfig = POLES[dossier.pole];
                const priorityConfig = PRIORITY_CONFIG[dossier.priority];

                return (
                  <button
                    key={dossier.id}
                    onClick={() => onSelectDossier(dossier)}
                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Quiet unboxed metadata per zero-pill rule */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                        <span className={`font-medium ${poleConfig.color}`}>{poleConfig.name}</span>
                        <span aria-hidden="true">·</span>
                        <span className={priorityConfig.color}>Priorité {priorityConfig.label}</span>
                        <span aria-hidden="true">·</span>
                        <span>{STATUS_CONFIG[dossier.status].label}</span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {dossier.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {dossier.description}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div
                        className={`text-xs font-medium font-mono tabular-nums ${
                          dateInfo.isOverdue
                            ? 'text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded'
                            : dateInfo.isUrgent
                            ? 'text-amber-800 bg-amber-50 px-2 py-0.5 rounded'
                            : 'text-slate-600'
                        }`}
                      >
                        {dateInfo.text}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Échéance : {formatFriendlyDate(dossier.dueDate)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne Droite : Fil d'activité récent */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Dernières activités & Commentaires
            </h2>
            <span className="text-xs text-slate-400">Collaboration en direct</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucune activité enregistrée pour le moment.
              </div>
            ) : (
              recentActivities.map((act) => {
                const targetDossier = dossiers.find((d) => d.id === act.dossierId);
                const isComment = act.type === 'comment';

                return (
                  <div
                    key={act.id}
                    onClick={() => targetDossier && onSelectDossier(targetDossier)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isComment ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isComment ? (
                        <MessageSquare className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{act.author}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatFriendlyDate(act.timestamp)}
                        </span>
                      </div>

                      <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {act.content}
                      </p>

                      {targetDossier && (
                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1 truncate">
                          <span>Sur le dossier :</span>
                          <span className="text-blue-600 font-medium truncate">{targetDossier.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

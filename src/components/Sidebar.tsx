import React from 'react';
import { PoleId, POLES } from '../types';
import { Layers, Trophy, PartyPopper, Wallet, Coffee, Wrench, Archive, AlertCircle } from 'lucide-react';

interface SidebarProps {
  selectedPole: PoleId | 'all' | 'archived';
  onSelectPole: (pole: PoleId | 'all' | 'archived') => void;
  poleCounts: Record<PoleId, number>;
  totalActiveCount: number;
  archivedCount: number;
  overdueCount: number;
  onFilterOverdueOnly?: () => void;
  isOverdueOnly?: boolean;
}

const POLE_ICONS: Record<PoleId, React.ReactNode> = {
  sportif: <Trophy className="w-4 h-4 text-blue-600" />,
  animations: <PartyPopper className="w-4 h-4 text-amber-600" />,
  financier: <Wallet className="w-4 h-4 text-emerald-600" />,
  buvette: <Coffee className="w-4 h-4 text-purple-600" />,
  technique: <Wrench className="w-4 h-4 text-slate-600" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedPole,
  onSelectPole,
  poleCounts,
  totalActiveCount,
  archivedCount,
  overdueCount,
  onFilterOverdueOnly,
  isOverdueOnly,
}) => {
  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0">
      <div className="mb-4">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          Pôles d'activité (5)
        </div>

        <nav className="space-y-1">
          {/* Tous les pôles */}
          <button
            onClick={() => {
              if (isOverdueOnly && onFilterOverdueOnly) onFilterOverdueOnly();
              onSelectPole('all');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedPole === 'all' && !isOverdueOnly
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Tous les pôles</span>
            </div>
            <span
              className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded ${
                selectedPole === 'all' && !isOverdueOnly
                  ? 'bg-slate-800 text-slate-200'
                  : 'text-slate-500 bg-slate-100'
              }`}
            >
              {totalActiveCount}
            </span>
          </button>

          {/* Les 5 pôles distincts */}
          {(Object.keys(POLES) as PoleId[]).map((poleId) => {
            const pole = POLES[poleId];
            const isSelected = selectedPole === poleId && !isOverdueOnly;

            return (
              <button
                key={poleId}
                onClick={() => {
                  if (isOverdueOnly && onFilterOverdueOnly) onFilterOverdueOnly();
                  onSelectPole(poleId);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0">{POLE_ICONS[poleId]}</span>
                  <span className="truncate">{pole.name}</span>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {poleCounts[poleId] || 0}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Alertes & Vues annexes */}
      <div className="pt-3 border-t border-slate-100 space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          Filtres rapides
        </div>

        {/* Bouton Alertes En retard */}
        <button
          onClick={onFilterOverdueOnly}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isOverdueOnly
              ? 'bg-red-50 text-red-900 border border-red-200'
              : 'text-red-700 hover:bg-red-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Dossiers en retard</span>
          </div>
          <span className="text-xs font-mono tabular-nums bg-red-100 text-red-800 font-semibold px-1.5 py-0.5 rounded">
            {overdueCount}
          </span>
        </button>

        {/* Archives */}
        <button
          onClick={() => {
            if (isOverdueOnly && onFilterOverdueOnly) onFilterOverdueOnly();
            onSelectPole('archived');
          }}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedPole === 'archived' && !isOverdueOnly
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Archive className="w-4 h-4 text-slate-500" />
            <span>Dossiers archivés</span>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {archivedCount}
          </span>
        </button>
      </div>

      <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
        <div className="font-semibold text-slate-800 mb-1">Bureau 2026/2027</div>
        <p className="leading-relaxed text-[11px]">
          Suivi collaboratif des délibérations, des engagements sportifs et des opérations courantes.
        </p>
      </div>
    </aside>
  );
};

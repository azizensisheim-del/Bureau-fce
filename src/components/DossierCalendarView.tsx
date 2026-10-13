import React, { useState } from 'react';
import { Dossier, PoleId, POLES, STATUS_CONFIG } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

interface DossierCalendarViewProps {
  dossiers: Dossier[];
  selectedPoleFilter: PoleId | 'all' | 'archived';
  onSelectDossier: (dossier: Dossier) => void;
}

export const DossierCalendarView: React.FC<DossierCalendarViewProps> = ({
  dossiers,
  selectedPoleFilter,
  onSelectDossier,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const activeDossiers = dossiers.filter((d) => {
    if (selectedPoleFilter === 'archived') return d.isArchived;
    if (d.isArchived) return false;
    if (selectedPoleFilter !== 'all' && d.pole !== selectedPoleFilter) return false;
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month metadata
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Day of week for first day (0 = Sunday in JS, we want Monday = 0)
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  // Days from previous month
  const prevMonthDays: number[] = [];
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(prevMonthLastDate - i);
  }

  // Days in current month
  const currentMonthDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Trailing days to fill 35 or 42 cells
  const totalCells = startDayOfWeek + totalDays;
  const trailingDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays = Array.from({ length: trailingDaysCount }, (_, i) => i + 1);

  const monthName = firstDayOfMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Group dossiers by date string (YYYY-MM-DD)
  const dossiersByDate: Record<string, Dossier[]> = {};
  activeDossiers.forEach((d) => {
    if (!dossiersByDate[d.dueDate]) {
      dossiersByDate[d.dueDate] = [];
    }
    dossiersByDate[d.dueDate].push(d);
  });

  const DAYS_HEADER = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-4">
      {/* Barre de contrôle du calendrier */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">{capitalizedMonth}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Aujourd'hui
          </button>
          <div className="flex items-center border border-slate-200 rounded-md bg-white">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200" />
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Entêtes jours de semaine */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
          {DAYS_HEADER.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Cellules des jours */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-b border-slate-200">
          {/* Jours du mois précédent */}
          {prevMonthDays.map((day) => (
            <div key={`prev-${day}`} className="min-h-[110px] p-2 bg-slate-50/50 text-slate-300">
              <span className="text-xs font-mono">{day}</span>
            </div>
          ))}

          {/* Jours du mois courant */}
          {currentMonthDays.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayDossiers = dossiersByDate[dateStr] || [];

            return (
              <div
                key={`current-${day}`}
                className={`min-h-[110px] p-2 flex flex-col transition-colors ${
                  isToday ? 'bg-blue-50/30' : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold px-1.5 py-0.5 rounded ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>
                  {dayDossiers.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {dayDossiers.length} échéance{dayDossiers.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Échéances du jour */}
                <div className="space-y-1.5 overflow-y-auto max-h-[85px] flex-1">
                  {dayDossiers.map((dossier) => {
                    const poleConfig = POLES[dossier.pole];
                    const isOverdue = dossier.status !== 'done' && dateStr < todayStr;

                    return (
                      <button
                        key={dossier.id}
                        onClick={() => onSelectDossier(dossier)}
                        className={`w-full text-left p-1.5 rounded text-[11px] border leading-tight transition-all hover:shadow-xs block ${
                          isOverdue
                            ? 'bg-red-50 border-red-200 text-red-900'
                            : `${poleConfig.bgLight} ${poleConfig.borderLight} text-slate-800`
                        }`}
                        title={`${dossier.title} (${STATUS_CONFIG[dossier.status].label})`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-semibold text-[10px] ${isOverdue ? 'text-red-700' : poleConfig.color}`}>
                            {poleConfig.name.replace('Pôle ', '')}
                          </span>
                          {isOverdue && <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />}
                        </div>
                        <div className="font-medium truncate mt-0.5">{dossier.title}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Jours du mois suivant */}
          {nextMonthDays.map((day) => (
            <div key={`next-${day}`} className="min-h-[110px] p-2 bg-slate-50/50 text-slate-300">
              <span className="text-xs font-mono">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Légende des 5 Pôles */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Légende des pôles :</span>
        <div className="flex flex-wrap items-center gap-4">
          {(Object.keys(POLES) as PoleId[]).map((poleId) => {
            const p = POLES[poleId];
            return (
              <div key={poleId} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.accentHex }}
                />
                <span>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

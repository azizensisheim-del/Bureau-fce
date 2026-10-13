import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ListFilter, Columns3, Calendar, Plus, CloudUpload, UserCheck, Shield, Settings } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'list' | 'kanban' | 'calendar' | 'settings';
  onViewChange: (view: 'dashboard' | 'list' | 'kanban' | 'calendar' | 'settings') => void;
  onOpenCreate: () => void;
  onOpenExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenCreate,
  onOpenExportModal,
}) => {
  const { currentUser, users, switchUser, canCreateDossier, isAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-lg tracking-wider">
            BS
          </div>
          <button
            onClick={() => onViewChange('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap text-left"
          >
            BureauSport
          </button>
        </div>

        {/* Zone 2: Navigation Links (single-line, 1-2 words) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'list'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Dossiers</span>
          </button>

          <button
            onClick={() => onViewChange('kanban')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'kanban'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Columns3 className="w-4 h-4" />
            <span>Kanban</span>
          </button>

          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'calendar'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendrier</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onViewChange('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'settings'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-700" />
              <span>Paramétrage</span>
            </button>
          )}

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0"
            title="Sauvegarde JSON et configuration Firebase"
          >
            <CloudUpload className="w-4 h-4 text-slate-500" />
            <span>Cloud & Export</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Active Profile Selector */}
        <div className="flex items-center gap-3 shrink-0">
          {canCreateDossier && (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau dossier</span>
              <span className="sm:hidden">Créer</span>
            </button>
          )}

          {/* User selector with active role indicator */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 text-left"
              title="Changer d'utilisateur pour tester les rôles (Admin, Membre, Lecteur)"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden lg:block text-xs leading-tight">
                <div className="font-semibold text-slate-900 truncate max-w-[120px]">{currentUser.name}</div>
                <div className="text-slate-500 flex items-center gap-1">
                  <span>{currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'member' ? 'Membre' : 'Lecteur'}</span>
                </div>
              </div>
            </button>

            {/* Dropdown for role switching */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-slate-500 font-medium">Connecté en tant que :</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{currentUser.name}</div>
                  <div className="text-slate-500 text-[11px]">{currentUser.roleTitle}</div>
                </div>

                <div className="px-3 py-1.5 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                  Changer de profil (Simulation des rôles) :
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition-colors ${
                        user.id === currentUser.id ? 'bg-slate-50 font-medium' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-slate-200">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-900 truncate flex items-center gap-1.5">
                          {user.name}
                          {user.role === 'admin' && (
                            <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.2 rounded font-medium">Admin</span>
                          )}
                          {user.role === 'member' && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium">Membre</span>
                          )}
                          {user.role === 'reader' && (
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-medium">Lecteur</span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate">{user.roleTitle}</div>
                      </div>
                      {user.id === currentUser.id && (
                        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

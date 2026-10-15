import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { firebaseDataService } from './services/firebaseDataService';
import { Dossier, PoleId, DossierStatus, DossierPriority, Comment, AttachmentLink, HistoryItem } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DossierListView } from './components/DossierListView';
import { DossierKanbanView } from './components/DossierKanbanView';
import { DossierCalendarView } from './components/DossierCalendarView';
import { DossierDetailModal } from './components/DossierDetailModal';
import { DossierFormModal } from './components/DossierFormModal';
import { DataExportModal } from './components/DataExportModal';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';

function AppContent() {
  const { currentUser, users } = useAuth();

  // Primary state
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<AttachmentLink[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Navigation & Filtering (Default view = 'dashboard' as confirmed by user)
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'kanban' | 'calendar' | 'settings'>('dashboard');
  const [selectedPole, setSelectedPole] = useState<PoleId | 'all' | 'archived'>('all');
  const [isOverdueOnly, setIsOverdueOnly] = useState<boolean>(false);

  // Modals state
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<DossierStatus>('todo');
  const [createDefaultPole, setCreateDefaultPole] = useState<PoleId>('sportif');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Load and refresh state from storage
  useEffect(() => {
    return firebaseDataService.subscribe((data) => {
      setDossiers(data.dossiers);
      setComments(data.comments);
      setAttachments(data.attachments);
      setHistory(data.history);
    }, (error) => console.error('Synchronisation Firestore:', error));
  }, []);

  // Keep selected dossier up-to-date if it changes in state
  useEffect(() => {
    if (selectedDossier) {
      const updated = dossiers.find((d) => d.id === selectedDossier.id);
      if (updated) {
        setSelectedDossier(updated);
      }
    }
  }, [dossiers, selectedDossier]);

  // Comments and attachments count maps
  const commentsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach((c) => {
      map[c.dossierId] = (map[c.dossierId] || 0) + 1;
    });
    return map;
  }, [comments]);

  const attachmentsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    attachments.forEach((a) => {
      map[a.dossierId] = (map[a.dossierId] || 0) + 1;
    });
    return map;
  }, [attachments]);

  // Pole counts
  const poleCounts = useMemo(() => {
    const counts: Record<PoleId, number> = {
      sportif: 0,
      animations: 0,
      financier: 0,
      buvette: 0,
      technique: 0,
    };
    dossiers.forEach((d) => {
      if (!d.isArchived && counts[d.pole] !== undefined) {
        counts[d.pole]++;
      }
    });
    return counts;
  }, [dossiers]);

  const totalActiveCount = useMemo(() => {
    return dossiers.filter((d) => !d.isArchived).length;
  }, [dossiers]);

  const archivedCount = useMemo(() => {
    return dossiers.filter((d) => d.isArchived).length;
  }, [dossiers]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const overdueCount = useMemo(() => {
    return dossiers.filter((d) => !d.isArchived && d.status !== 'done' && d.dueDate < todayStr).length;
  }, [dossiers, todayStr]);

  // CRUD actions
  const handleSaveDossier = async (
    data: Partial<Dossier> & { title: string; pole: PoleId; priority: DossierPriority }
  ) => {
    if (!currentUser) return;
    await firebaseDataService.saveDossier(data, currentUser);
    setEditingDossier(null);
  };

  const handleUpdateStatus = async (dossierId: string, status: DossierStatus) => {
    if (!currentUser) return;
    await firebaseDataService.updateStatus(dossierId, status, currentUser);
  };

  const handleToggleArchive = async (dossierId: string) => {
    if (!currentUser) return;
    const dossier = dossiers.find((item) => item.id === dossierId);
    if (dossier) await firebaseDataService.toggleArchive(dossier, currentUser);
    if (selectedDossier?.id === dossierId) {
      setSelectedDossier(null);
    }
  };

  const handleDeleteDossier = async (dossierId: string) => {
    await firebaseDataService.deleteDossier(dossierId);
    if (selectedDossier?.id === dossierId) {
      setSelectedDossier(null);
    }
  };

  const handleAddComment = async (dossierId: string, content: string) => {
    if (!currentUser) return;
    await firebaseDataService.addComment(dossierId, content, currentUser);
  };

  const handleAddAttachment = async (dossierId: string, title: string, url: string) => {
    if (!currentUser) return;
    await firebaseDataService.addAttachment(dossierId, title, url, currentUser);
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    await firebaseDataService.removeAttachment(attachmentId);
  };

  // Quick navigation handlers
  const handleNavigateToPole = (poleId: PoleId) => {
    setSelectedPole(poleId);
    setIsOverdueOnly(false);
    setCurrentView('list');
  };

  const handleOpenCreateWithStatus = (status: DossierStatus) => {
    setCreateDefaultStatus(status);
    if (selectedPole !== 'all' && selectedPole !== 'archived') {
      setCreateDefaultPole(selectedPole);
    } else {
      setCreateDefaultPole('sportif');
    }
    setEditingDossier(null);
    setIsCreateOpen(true);
  };

  const handleFilterOverdue = () => {
    setIsOverdueOnly((prev) => !prev);
    setSelectedPole('all');
    if (currentView === 'dashboard') {
      setCurrentView('list');
    }
  };

  // Filtered comments & attachments for currently inspected dossier
  const currentDossierComments = useMemo(() => {
    if (!selectedDossier) return [];
    return comments.filter((c) => c.dossierId === selectedDossier.id);
  }, [comments, selectedDossier]);

  const currentDossierAttachments = useMemo(() => {
    if (!selectedDossier) return [];
    return attachments.filter((a) => a.dossierId === selectedDossier.id);
  }, [attachments, selectedDossier]);

  const currentDossierHistory = useMemo(() => {
    if (!selectedDossier) return [];
    return history.filter((h) => h.dossierId === selectedDossier.id);
  }, [history, selectedDossier]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Barre de navigation principale (Top Bar Contract) */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === 'dashboard') {
            setIsOverdueOnly(false);
          }
        }}
        onOpenCreate={() => {
          setEditingDossier(null);
          setCreateDefaultStatus('todo');
          if (selectedPole !== 'all' && selectedPole !== 'archived') {
            setCreateDefaultPole(selectedPole);
          } else {
            setCreateDefaultPole('sportif');
          }
          setIsCreateOpen(true);
        }}
        onOpenExportModal={() => setIsExportOpen(true)}
      />

      {/* Disposition principale : Sidebar + Contenu */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          selectedPole={selectedPole}
          onSelectPole={(pole) => {
            setSelectedPole(pole);
            setIsOverdueOnly(false);
            if (currentView === 'dashboard') {
              setCurrentView('list');
            }
          }}
          poleCounts={poleCounts}
          totalActiveCount={totalActiveCount}
          archivedCount={archivedCount}
          overdueCount={overdueCount}
          onFilterOverdueOnly={handleFilterOverdue}
          isOverdueOnly={isOverdueOnly}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              dossiers={dossiers}
              users={users}
              comments={comments}
              history={history}
              onSelectDossier={setSelectedDossier}
              onNavigateToPole={handleNavigateToPole}
              onNavigateToList={() => {
                setSelectedPole('all');
                setIsOverdueOnly(false);
                setCurrentView('list');
              }}
            />
          )}

          {currentView === 'list' && (
            <DossierListView
              dossiers={dossiers}
              users={users}
              commentsCountMap={commentsCountMap}
              attachmentsCountMap={attachmentsCountMap}
              selectedPoleFilter={selectedPole}
              onSelectDossier={setSelectedDossier}
              onUpdateStatus={handleUpdateStatus}
              onToggleArchive={handleToggleArchive}
              onOpenCreate={() => {
                setEditingDossier(null);
                setCreateDefaultStatus('todo');
                if (selectedPole !== 'all' && selectedPole !== 'archived') {
                  setCreateDefaultPole(selectedPole);
                }
                setIsCreateOpen(true);
              }}
              isOverdueOnly={isOverdueOnly}
            />
          )}

          {currentView === 'kanban' && (
            <DossierKanbanView
              dossiers={dossiers}
              users={users}
              commentsCountMap={commentsCountMap}
              attachmentsCountMap={attachmentsCountMap}
              selectedPoleFilter={selectedPole}
              onSelectDossier={setSelectedDossier}
              onUpdateStatus={handleUpdateStatus}
              onOpenCreateWithStatus={handleOpenCreateWithStatus}
            />
          )}

          {currentView === 'calendar' && (
            <DossierCalendarView
              dossiers={dossiers}
              selectedPoleFilter={selectedPole}
              onSelectDossier={setSelectedDossier}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Modale de consultation détaillée du dossier */}
      {selectedDossier && (
        <DossierDetailModal
          dossier={selectedDossier}
          users={users}
          comments={currentDossierComments}
          attachments={currentDossierAttachments}
          history={currentDossierHistory}
          onClose={() => setSelectedDossier(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddComment={handleAddComment}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          onToggleArchive={handleToggleArchive}
          onDeleteDossier={handleDeleteDossier}
          onEditDossier={(dossier) => {
            setEditingDossier(dossier);
            setIsCreateOpen(true);
          }}
        />
      )}

      {/* Modale de création ou d'édition de dossier */}
      <DossierFormModal
        isOpen={isCreateOpen}
        initialDossier={editingDossier}
        defaultStatus={createDefaultStatus}
        defaultPole={createDefaultPole}
        users={users}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingDossier(null);
        }}
        onSave={handleSaveDossier}
      />

      {/* Modale d'export de données, restauration et guide Firebase */}
      <DataExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onDataReload={() => undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-500">Connexion à Firebase…</div>;
  return currentUser ? <AppContent /> : <LoginView />;
}

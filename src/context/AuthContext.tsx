import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ClubSettings, DEFAULT_CLUB_SETTINGS, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface AuthContextType {
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  refreshUsers: () => void;
  saveUser: (userData: Partial<User> & { name: string; email: string; role: UserRole }) => User;
  deleteUser: (userId: string) => { success: boolean; message?: string };
  clubSettings: ClubSettings;
  updateClubSettings: (settings: ClubSettings) => void;
  isAdmin: boolean;
  isMember: boolean;
  isReader: boolean;
  canCreateDossier: boolean;
  canEditDossier: boolean;
  canComment: boolean;
  canArchive: boolean;
  canDelete: boolean;
  loginWithEmail: (email: string, role?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clubSettings, setClubSettings] = useState<ClubSettings>(DEFAULT_CLUB_SETTINGS);

  const refreshUsers = useCallback(() => {
    storageService.init();
    const loadedUsers = storageService.getUsers();
    setUsers(loadedUsers);

    const currentId = storageService.getCurrentUserId();
    const found = loadedUsers.find((u) => u.id === currentId) || loadedUsers[0];
    setCurrentUser(found);

    setClubSettings(storageService.getClubSettings());
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      storageService.setCurrentUserId(userId);
    }
  };

  const saveUser = (userData: Partial<User> & { name: string; email: string; role: UserRole }) => {
    const saved = storageService.saveUser(userData);
    refreshUsers();
    return saved;
  };

  const deleteUser = (userId: string) => {
    const res = storageService.deleteUser(userId);
    if (res.success) {
      refreshUsers();
    }
    return res;
  };

  const updateClubSettings = (settings: ClubSettings) => {
    storageService.saveClubSettings(settings);
    setClubSettings(settings);
  };

  const loginWithEmail = (email: string) => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      switchUser(existing.id);
      return true;
    }
    return false;
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Chargement du bureau...</div>;
  }

  const isAdmin = currentUser.role === 'admin';
  const isMember = currentUser.role === 'member';
  const isReader = currentUser.role === 'reader';

  const canCreateDossier = isAdmin || isMember;
  const canEditDossier = isAdmin || isMember;
  const canComment = true; // Readers can also comment
  const canArchive = isAdmin || isMember;
  const canDelete = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        refreshUsers,
        saveUser,
        deleteUser,
        clubSettings,
        updateClubSettings,
        isAdmin,
        isMember,
        isReader,
        canCreateDossier,
        canEditDossier,
        canComment,
        canArchive,
        canDelete,
        loginWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

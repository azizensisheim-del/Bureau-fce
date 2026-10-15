import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../services/firebaseClient';
import { ClubSettings, DEFAULT_CLUB_SETTINGS, User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User; users: User[]; loading: boolean; authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveUser: (data: Partial<User> & { name: string; email: string; role: UserRole }) => Promise<User>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  clubSettings: ClubSettings; updateClubSettings: (settings: ClubSettings) => Promise<void>;
  isAdmin: boolean; isMember: boolean; isReader: boolean; canCreateDossier: boolean;
  canEditDossier: boolean; canComment: boolean; canArchive: boolean; canDelete: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const authMessage = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('invalid-credential')) return 'Adresse e-mail ou mot de passe incorrect.';
  if (code.includes('email-already-in-use')) return 'Cette adresse e-mail possède déjà un compte.';
  if (code.includes('weak-password')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  return 'La connexion à Firebase a échoué. Réessayez dans quelques instants.';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [clubSettings, setClubSettings] = useState(DEFAULT_CLUB_SETTINGS);

  useEffect(() => onAuthStateChanged(auth, (account) => { setFirebaseUid(account?.uid || null); if (!account) setCurrentUser(null); setLoading(false); }), []);
  useEffect(() => {
    if (!firebaseUid) { setUsers([]); return; }
    const stopUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map((item) => item.data() as User)));
    const stopSettings = onSnapshot(doc(db, 'config', 'club'), (snap) => snap.exists() && setClubSettings(snap.data() as ClubSettings));
    return () => { stopUsers(); stopSettings(); };
  }, [firebaseUid]);
  useEffect(() => { if (firebaseUid) setCurrentUser(users.find((user) => user.id === firebaseUid) || null); }, [firebaseUid, users]);

  const signIn = async (email: string, password: string) => { setAuthError(null); try { await signInWithEmailAndPassword(auth, email.trim(), password); } catch (error) { const message = authMessage(error); setAuthError(message); throw new Error(message); } };
  const signUp = async (name: string, email: string, password: string) => {
    setAuthError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profile: User = { id: credential.user.uid, name: name.trim(), email: email.trim(), role: 'reader', roleTitle: 'Bénévole Lecteur', avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}` };
      await setDoc(doc(db, 'users', profile.id), profile);
      const bootstrapRef = doc(db, 'config', 'bootstrap');
      if (!(await getDoc(bootstrapRef)).exists()) {
        const batch = writeBatch(db);
        profile.role = 'admin'; profile.roleTitle = 'Administrateur du Bureau';
        batch.update(doc(db, 'users', profile.id), { role: profile.role, roleTitle: profile.roleTitle });
        batch.set(bootstrapRef, { uid: profile.id, createdAt: new Date().toISOString() });
        try { await batch.commit(); } catch { profile.role = 'reader'; profile.roleTitle = 'Bénévole Lecteur'; }
      }
      setCurrentUser(profile);
    } catch (error) { const message = authMessage(error); setAuthError(message); throw new Error(message); }
  };
  const saveUser = async (data: Partial<User> & { name: string; email: string; role: UserRole }) => {
    if (!data.id) throw new Error("Le membre doit d’abord créer son compte depuis l’écran de connexion.");
    const saved = { ...users.find((u) => u.id === data.id), ...data } as User;
    await setDoc(doc(db, 'users', saved.id), saved, { merge: true }); return saved;
  };
  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target?.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1) return { success: false, message: 'Impossible de supprimer le dernier administrateur.' };
    await deleteDoc(doc(db, 'users', id)); return { success: true };
  };
  const updateClubSettings = async (settings: ClubSettings) => { await setDoc(doc(db, 'config', 'club'), settings); setClubSettings(settings); };
  const rights = useMemo(() => { const isAdmin = currentUser?.role === 'admin'; const isMember = currentUser?.role === 'member'; return { isAdmin, isMember, isReader: currentUser?.role === 'reader', canCreateDossier: isAdmin || isMember, canEditDossier: isAdmin || isMember, canComment: Boolean(currentUser), canArchive: isAdmin || isMember, canDelete: isAdmin }; }, [currentUser]);

  return <AuthContext.Provider value={{ currentUser: currentUser as User, users, loading, authError, signIn, signUp, signOut: () => firebaseSignOut(auth), saveUser, deleteUser, clubSettings, updateClubSettings, ...rights }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('useAuth doit être utilisé dans AuthProvider'); return value; };

import React, { useState } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { signIn, signUp, authError } = useAuth();
  const [create, setCreate] = useState(false); const [name, setName] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); try { if (create) await signUp(name, email, password); else await signIn(email, password); } catch { /* Le contexte affiche le message. */ } finally { setBusy(false); } };
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-7">
    <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-xl bg-slate-900 text-white grid place-items-center"><ShieldCheck /></div><div><h1 className="text-xl font-bold">BureauSport</h1><p className="text-sm text-slate-500">Espace sécurisé du bureau</p></div></div>
    <form onSubmit={submit} className="space-y-4">{create && <label className="block text-sm font-medium">Nom complet<input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>}<label className="block text-sm font-medium">Adresse e-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label><label className="block text-sm font-medium">Mot de passe<input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>{authError && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{authError}</p>}<button disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white p-2.5 font-semibold disabled:opacity-60"><LogIn className="w-4 h-4" />{busy ? 'Connexion…' : create ? 'Créer mon compte' : 'Se connecter'}</button></form>
    <button onClick={() => setCreate(!create)} className="mt-4 w-full text-sm text-blue-700 hover:underline">{create ? 'J’ai déjà un compte' : 'Créer un premier compte'}</button>{create && <p className="mt-3 text-xs text-slate-500">Un nouveau compte reçoit d’abord le rôle Lecteur. Un administrateur peut ensuite modifier son rôle.</p>}
  </div></main>;
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, PoleId, POLES, UserRole, ROLE_CONFIG, ClubSettings } from '../types';
import {
  ShieldAlert,
  Users,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Trophy,
  PartyPopper,
  Wallet,
  Coffee,
  Wrench,
  User as UserIcon,
  X,
  Save,
  Phone,
  Mail,
  Building,
  Calendar,
} from 'lucide-react';

const POLE_ICONS: Record<PoleId, React.ReactNode> = {
  sportif: <Trophy className="w-4 h-4 text-blue-600" />,
  animations: <PartyPopper className="w-4 h-4 text-amber-600" />,
  financier: <Wallet className="w-4 h-4 text-emerald-600" />,
  buvette: <Coffee className="w-4 h-4 text-purple-600" />,
  technique: <Wrench className="w-4 h-4 text-slate-600" />,
};

export const SettingsView: React.FC = () => {
  const { currentUser, users, isAdmin, saveUser, deleteUser, clubSettings, updateClubSettings } = useAuth();

  // General settings state
  const [clubName, setClubName] = useState(clubSettings.clubName);
  const [season, setSeason] = useState(clubSettings.season);
  const [contactEmail, setContactEmail] = useState(clubSettings.contactEmail);
  const [imminentDays, setImminentDays] = useState(clubSettings.imminentDeadlineDays);
  const [poleLeads, setPoleLeads] = useState<Record<PoleId, string>>(clubSettings.poleLeads);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userModalName, setUserModalName] = useState('');
  const [userModalEmail, setUserModalEmail] = useState('');
  const [userModalRole, setUserModalRole] = useState<UserRole>('member');
  const [userModalRoleTitle, setUserModalRoleTitle] = useState('');
  const [userModalPole, setUserModalPole] = useState<PoleId | ''>('');
  const [userModalPhone, setUserModalPhone] = useState('');
  const [userModalAvatar, setUserModalAvatar] = useState('');
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Guard: if not admin
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-xl mx-auto my-12 shadow-xs">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Accès restreint</h2>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          L'onglet de paramétrage est strictement réservé aux administrateurs du bureau (Président / Trésorier).
          Vous êtes actuellement connecté avec le profil de <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.roleTitle}).
        </p>
        <p className="text-[11px] text-slate-400">
          Pour tester cet écran, utilisez le sélecteur de profil en haut à droite pour basculer sur Thomas Moreau (Président Admin) ou Julien Lefebvre (Trésorier Admin).
        </p>
      </div>
    );
  }

  // Handle saving general settings & pole leads
  const handleSaveClubSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ClubSettings = {
      clubName: clubName.trim(),
      season: season.trim(),
      contactEmail: contactEmail.trim(),
      imminentDeadlineDays: Number(imminentDays),
      poleLeads,
    };
    await updateClubSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePoleLeadChange = (poleId: PoleId, userId: string) => {
    setPoleLeads((prev) => ({
      ...prev,
      [poleId]: userId,
    }));
  };

  // Open modal for new user
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserModalName('');
    setUserModalEmail('');
    setUserModalRole('member');
    setUserModalRoleTitle('Membre du Bureau');
    setUserModalPole('');
    setUserModalPhone('');
    setUserModalAvatar('');
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  // Open modal for editing user
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserModalName(u.name);
    setUserModalEmail(u.email);
    setUserModalRole(u.role);
    setUserModalRoleTitle(u.roleTitle);
    setUserModalPole(u.assignedPole || '');
    setUserModalPhone(u.phone || '');
    setUserModalAvatar(u.avatar || '');
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  // Submit user form
  const handleUserModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userModalName.trim()) {
      setUserModalError('Le nom complet est obligatoire.');
      return;
    }
    if (!userModalEmail.trim()) {
      setUserModalError('L\'adresse email est obligatoire.');
      return;
    }

    try { await saveUser({
      id: editingUser ? editingUser.id : undefined,
      name: userModalName.trim(),
      email: userModalEmail.trim(),
      role: userModalRole,
      roleTitle: userModalRoleTitle.trim() || (userModalRole === 'admin' ? 'Membre du Bureau (Admin)' : userModalRole === 'member' ? 'Membre Référent' : 'Bénévole Lecteur'),
      assignedPole: userModalPole ? (userModalPole as PoleId) : undefined,
      phone: userModalPhone.trim() || undefined,
      avatar: userModalAvatar.trim() || undefined,
    }); setIsUserModalOpen(false); } catch (error) { setUserModalError(error instanceof Error ? error.message : 'Enregistrement impossible.'); }
  };

  // Handle delete user
  const handleDeleteUser = async (u: User) => {
    if (window.confirm(`Confirmer la suppression de "${u.name}" du bureau ?`)) {
      const res = await deleteUser(u.id);
      if (!res.success) {
        setDeleteError(res.message || 'Erreur lors de la suppression.');
        setTimeout(() => setDeleteError(null), 4000);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Paramétrage du Club & Bureau
            </h1>
            <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              Espace Administrateur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez directement les informations institutionnelles, les référents des 5 pôles et les membres du bureau sans intervention technique.
          </p>
        </div>
      </div>

      {deleteError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* SECTION 1 : Référents des 5 Pôles */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Responsables Référents des 5 Pôles</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Attribuez directement un référent principal pour chacun des domaines clés de l'association.
            </p>
          </div>
        </div>

        <div className="p-5 divide-y divide-slate-100">
          {(Object.keys(POLES) as PoleId[]).map((poleId) => {
            const pole = POLES[poleId];
            const currentLeadId = poleLeads[poleId];
            const leadUser = users.find((u) => u.id === currentLeadId);

            return (
              <div
                key={poleId}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                    {POLE_ICONS[poleId]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                      <span>{pole.name}</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: pole.accentHex }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{pole.shortDesc}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] text-slate-400 font-medium">Référent :</span>
                  <select
                    value={currentLeadId || ''}
                    onChange={(e) => handlePoleLeadChange(poleId, e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un responsable...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleTitle.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 : Annuaire des Membres & Rôles */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Membres du Bureau & Utilisateurs ({users.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajoutez des bénévoles, attribuez des rôles (Admin, Membre, Lecteur) et définissez les fonctions officielles.
            </p>
          </div>

          <button
            onClick={handleOpenAddUser}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un membre</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4 min-w-[200px]">Membre & Fonction</th>
                <th className="py-2.5 px-4 min-w-[130px]">Rôle Système</th>
                <th className="py-2.5 px-4 min-w-[120px]">Pôle Principal</th>
                <th className="py-2.5 px-4 min-w-[180px]">Contact</th>
                <th className="py-2.5 px-4 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const assignedPoleConfig = u.assignedPole ? POLES[u.assignedPole] : null;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nom & Titre */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4 text-slate-400 m-1.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.roleTitle}</div>
                        </div>
                      </div>
                    </td>

                    {/* Rôle Système */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {u.role === 'admin' && (
                        <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          Admin Bureau
                        </span>
                      )}
                      {u.role === 'member' && (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          Membre du Bureau
                        </span>
                      )}
                      {u.role === 'reader' && (
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Lecteur
                        </span>
                      )}
                    </td>

                    {/* Pôle principal */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {assignedPoleConfig ? (
                        <span className={`font-medium ${assignedPoleConfig.color}`}>
                          {assignedPoleConfig.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Transversal</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Modifier les informations"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer du bureau"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 : Paramètres Généraux du Club */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-purple-600" />
            <span>Identité du Club & Paramètres d'Alerte</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurez le nom officiel de l'association, la saison sportive et la sensibilité des alertes d'échéances.
          </p>
        </div>

        <form onSubmit={handleSaveClubSettings} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nom officiel de l'association sportive
              </label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Ex : Football Club Ensisheim..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Saison sportive en cours</span>
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="Ex : 2026 / 2027"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Adresse email officielle du bureau</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="bureau@club-sportif.fr"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Seuil d'alerte des échéances imminentes
              </label>
              <select
                value={imminentDays}
                onChange={(e) => setImminentDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs font-mono"
              >
                <option value={3}>3 jours avant l'échéance</option>
                <option value={5}>5 jours avant l'échéance</option>
                <option value={7}>7 jours avant l'échéance (Standard)</option>
                <option value={10}>10 jours avant l'échéance</option>
                <option value={14}>14 jours avant l'échéance (2 semaines)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {saveSuccess ? (
              <div className="text-emerald-700 flex items-center gap-1.5 font-medium text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Paramètres enregistrés avec succès !</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">
                Les modifications sont instantanément appliquées à l'ensemble du bureau.
              </span>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer tous les paramètres</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODALE D'AJOUT / ÉDITION D'UN MEMBRE */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingUser ? 'Modifier le membre du bureau' : 'Ajouter un nouveau membre'}
              </h2>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUserModalSubmit} className="p-5 space-y-3.5 text-xs">
              {userModalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{userModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nom et prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userModalName}
                  onChange={(e) => setUserModalName(e.target.value)}
                  placeholder="Ex : Thomas Moreau"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userModalEmail}
                  onChange={(e) => setUserModalEmail(e.target.value)}
                  placeholder="prenom.nom@club-sportif.fr"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Rôle d'accès système
                  </label>
                  <select
                    value={userModalRole}
                    onChange={(e) => setUserModalRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
                  >
                    <option value="admin">Admin (Président / Trésorier)</option>
                    <option value="member">Membre du bureau actif</option>
                    <option value="reader">Lecteur (Bénévole associé)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Pôle de référence
                  </label>
                  <select
                    value={userModalPole}
                    onChange={(e) => setUserModalPole(e.target.value as PoleId | '')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
                  >
                    <option value="">Transversal (Tous pôles)</option>
                    <option value="sportif">Pôle Sportif</option>
                    <option value="animations">Pôle Animations</option>
                    <option value="financier">Pôle Financier</option>
                    <option value="buvette">Pôle Buvette</option>
                    <option value="technique">Pôle Technique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Titre officiel de la fonction
                </label>
                <input
                  type="text"
                  value={userModalRoleTitle}
                  onChange={(e) => setUserModalRoleTitle(e.target.value)}
                  placeholder="Ex : Trésorière adjointe, Référent matériel..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={userModalPhone}
                    onChange={(e) => setUserModalPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    URL Avatar (Facultatif)
                  </label>
                  <input
                    type="url"
                    value={userModalAvatar}
                    onChange={(e) => setUserModalAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  {editingUser ? 'Enregistrer les modifications' : 'Ajouter le membre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

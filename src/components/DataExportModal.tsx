import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { FIREBASE_DEPLOYMENT_INFO, FIRESTORE_RULES_SOURCE } from '../services/firebaseConfig';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Cloud,
  FileCode,
  CheckCircle,
  Copy,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  onDataReload,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'firebase' | 'schema'>('backup');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const jsonStr = storageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bureausport_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = storageService.importBackupJson(content);
        setImportMessage(result.message);
        if (result.success) {
          onDataReload();
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Voulez-vous réinitialiser tous les dossiers et retrouver le jeu de données officiel initial du club ?')) {
      storageService.resetToDefault();
      onDataReload();
      setImportMessage('Données réinitialisées avec succès aux valeurs de démonstration.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Entête */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Gestion des Données & Déploiement Cloud
              </h2>
              <p className="text-xs text-slate-500">
                Sauvegarde autonome, modèle relationnel et connecteur Firebase Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-200 px-5 pt-2 gap-2 text-xs font-semibold bg-slate-50/50">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sauvegarde & Restauration JSON
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'firebase'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Guide & Règles Firebase (Hébergement)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Modèle de Données (Schéma)
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {importMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center justify-between">
              <span>{importMessage}</span>
              <button
                onClick={() => setImportMessage(null)}
                className="text-xs underline text-blue-600 ml-2"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Onglet 1 : Sauvegarde locale */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Exporter une sauvegarde complète</span>
                </h3>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Téléchargez l'intégralité des dossiers, commentaires, liens externes et journal d'audit dans un fichier JSON structuré. Idéal pour conserver une copie de sécurité lors des assemblées générales ou réunions de bureau.
                </p>
                <button
                  onClick={handleExportJson}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger la sauvegarde JSON</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Restaurer une sauvegarde</span>
                </h3>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Sélectionnez un fichier JSON de sauvegarde précédemment exporté pour recharger instantanément les dossiers sur un autre ordinateur.
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Choisir un fichier JSON à importer</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-4 bg-red-50/50 rounded-xl border border-red-200 space-y-3">
                <h3 className="font-bold text-red-900 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  <span>Réinitialisation d'usine</span>
                </h3>
                <p className="text-red-700 text-xs">
                  Réinitialise la base locale pour retrouver les données types de démonstration (15 dossiers représentatifs répartis sur les 5 pôles).
                </p>
                <button
                  onClick={handleResetData}
                  className="px-3.5 py-1.5 bg-white border border-red-300 hover:bg-red-50 text-red-700 font-medium rounded-md transition-colors"
                >
                  Restaurer les données démo par défaut
                </button>
              </div>
            </div>
          )}

          {/* Onglet 2 : Firebase */}
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <div className="font-bold mb-1">Architecture Serverless Firebase</div>
                <p className="leading-relaxed">
                  L'application est prête à être connectée à Firebase pour un hébergement gratuit sans gestion de serveur. Les collections Firestore correspondent exactement au modèle de données.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Étapes de déploiement pas à pas
                </h3>
                <ol className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {FIREBASE_DEPLOYMENT_INFO.steps.map((step, idx) => (
                    <li key={idx} className="text-slate-700 leading-relaxed pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Règles de sécurité Firestore (`firestore.rules`)
                  </h3>
                  <button
                    onClick={() => copyToClipboard(FIRESTORE_RULES_SOURCE, 'rules')}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    {copyFeedback === 'rules' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier les règles</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                  {FIRESTORE_RULES_SOURCE}
                </pre>
              </div>
            </div>
          )}

          {/* Onglet 3 : Schéma */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Le modèle de données de BureauSport est découpé en 5 collections principales respectant le contrôle d'accès basé sur les rôles (RBAC) :
              </p>

              <div className="space-y-3">
                {FIREBASE_DEPLOYMENT_INFO.collections.map((col) => (
                  <div key={col.name} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-700 text-xs">
                        collection: /{col.name}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs mb-2">{col.description}</p>
                    <div className="text-[11px] font-mono bg-white p-2 rounded border border-slate-200 text-slate-600">
                      Règles : {col.rules}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

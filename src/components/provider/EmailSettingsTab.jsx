import { useEffect, useState } from 'react';
import { getMyEmailSettings, updateMyEmailSettings, sendMyTestEmail } from '../../services/listingService';
import { IconMail, IconSend, IconCheckCircle } from '../icons';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const initialForm = {
  provider: '',
  host: '',
  port: '',
  user: '',
  fromEmail: '',
  pass: '',
  apiKey: '',
};

// Onglet "Email SMTP" du dashboard prestataire (M5) : configuration propre
// au prestataire pour que les emails envoyes a SES clients (factures,
// contrats) partent de sa propre adresse plutot que du SMTP central de la
// plateforme. Sans configuration, le SMTP central reste utilise (comportement
// inchange) - c'est donc une option, pas une obligation.
function EmailSettingsTab() {
  const [form, setForm] = useState(initialForm);
  const [hasPassword, setHasPassword] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    getMyEmailSettings()
      .then((data) => {
        setForm({
          provider: data.provider || '',
          host: data.host || '',
          port: data.port || '',
          user: data.user || '',
          fromEmail: data.fromEmail || '',
          pass: '',
          apiKey: '',
        });
        setHasPassword(data.hasPassword);
        setHasApiKey(data.hasApiKey);
      })
      .catch(() => setError('Impossible de charger votre configuration email.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectProvider = (provider) => setForm((prev) => ({ ...prev, provider }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        provider: form.provider || null,
        host: form.host,
        port: form.port,
        user: form.user,
        fromEmail: form.fromEmail,
      };
      // Un champ secret laisse vide = on conserve celui deja enregistre ;
      // il n'est donc envoye que si l'utilisateur l'a effectivement saisi.
      if (form.pass) payload.pass = form.pass;
      if (form.apiKey) payload.apiKey = form.apiKey;

      const data = await updateMyEmailSettings(payload);
      setHasPassword(data.hasPassword);
      setHasApiKey(data.hasApiKey);
      setForm((prev) => ({ ...prev, pass: '', apiKey: '' }));
      setMessage('Configuration email enregistrée avec succès.');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Impossible de sauvegarder la configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearProvider = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateMyEmailSettings({ provider: null, pass: '', apiKey: '' });
      setForm(initialForm);
      setHasPassword(false);
      setHasApiKey(false);
      setMessage('Configuration réinitialisée — le SMTP de la plateforme sera utilisé.');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de réinitialiser la configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    setTesting(true);
    setTestMessage('');
    setTestError('');
    try {
      const data = await sendMyTestEmail(testTo || undefined);
      setTestMessage(data.message);
    } catch (err) {
      setTestError(err.response?.data?.message || "Impossible d'envoyer l'email de test.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Chargement...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Email SMTP</h2>
      <p className="mt-1 text-sm text-gray-500">
        Envoyez vos factures et contrats à vos clients depuis votre propre adresse email, au lieu de
        celle de Mounesba. Facultatif : sans configuration, le SMTP de la plateforme est utilisé.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectProvider('resend')}
            className={`rounded-xl border p-4 text-left transition ${
              form.provider === 'resend' ? 'border-rose-500 bg-rose-50/60' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="font-semibold text-gray-900">Resend (recommandé)</p>
            <p className="mt-1 text-xs text-gray-500">
              Créez un compte gratuit sur resend.com, générez une clé API et collez-la ci-dessous.
            </p>
          </button>

          <button
            type="button"
            onClick={() => selectProvider('smtp')}
            className={`rounded-xl border p-4 text-left transition ${
              form.provider === 'smtp' ? 'border-rose-500 bg-rose-50/60' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="font-semibold text-gray-900">SMTP personnalisé</p>
            <p className="mt-1 text-xs text-gray-500">
              Gmail, Outlook ou votre propre serveur SMTP (hôte, port, identifiants).
            </p>
          </button>
        </div>

        {form.provider === 'resend' && (
          <div>
            <label className={labelClass}>Clé API Resend</label>
            <input
              type="password"
              name="apiKey"
              value={form.apiKey}
              onChange={handleChange}
              placeholder={hasApiKey ? '•••••••••••• (déjà enregistrée)' : 're_xxxxxxxxxxxxxxxx'}
              className={inputClass}
            />
          </div>
        )}

        {form.provider === 'smtp' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Hôte SMTP</label>
              <input
                name="host"
                value={form.host}
                onChange={handleChange}
                placeholder="smtp.gmail.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Port</label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="65535"
                name="port"
                value={form.port}
                onChange={handleChange}
                placeholder="587"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Utilisateur</label>
              <input
                name="user"
                value={form.user}
                onChange={handleChange}
                placeholder="votre@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mot de passe</label>
              <input
                type="password"
                name="pass"
                value={form.pass}
                onChange={handleChange}
                placeholder={hasPassword ? '•••••••••••• (déjà enregistré)' : 'Mot de passe ou mot de passe application'}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {form.provider && (
          <div>
            <label className={labelClass}>Adresse d&apos;expédition (optionnel)</label>
            <input
              type="email"
              autoComplete="email"
              name="fromEmail"
              value={form.fromEmail}
              onChange={handleChange}
              placeholder="contact@votre-entreprise.tn"
              className={inputClass}
            />
          </div>
        )}

        {message && <p className="flex items-center gap-1.5 text-sm text-green-600"><IconCheckCircle className="h-4 w-4" />{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {(form.provider || hasPassword || hasApiKey) && (
            <button
              type="button"
              onClick={handleClearProvider}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Revenir au SMTP par défaut
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <IconMail className="h-4 w-4 text-gray-400" />
          Envoyer un email de test
        </h3>
        <form onSubmit={handleSendTest} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1" style={{ minWidth: '220px' }}>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="destinataire@example.com"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">Laissez vide pour utiliser votre email de connexion.</p>
          </div>
          <button
            type="submit"
            disabled={testing}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            <IconSend className="h-4 w-4" />
            {testing ? 'Envoi...' : "Envoyer l'email de test"}
          </button>
        </form>
        {testMessage && <p className="mt-2 text-sm text-green-600">{testMessage}</p>}
        {testError && <p className="mt-2 text-sm text-red-600">{testError}</p>}
      </div>
    </div>
  );
}

export default EmailSettingsTab;

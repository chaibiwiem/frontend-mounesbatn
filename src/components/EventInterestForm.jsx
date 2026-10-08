import { useEffect, useState } from 'react';
import { createLead } from '../services/leadService';
import { useAuth } from '../hooks/useAuth';
import { formatTunisianPhone, stripPhoneSpaces } from '../utils/phone';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4E8BC4] focus:outline-none focus:ring-1 focus:ring-[#4E8BC4]';

// Formulaire dedie a une demande d'interet sur un evenement prestataire (M5,
// "Mes evenements") - distinct du formulaire de demande de devis/reservation
// (ContactForm) : pas de date d'evenement, d'invites ni de champs Transport,
// la date/le lieu sont deja fixes par l'evenement lui-meme. Le prestataire
// recoit un lead classique (leads.provider_event_id renseigne cote backend).
function EventInterestForm({ listingId, event, onClose }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: `Intéressé(e) par l'événement : ${event.title}`,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  // Client deja connecte : coordonnees reprises dans les champs encore vides.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || user.firstName || '',
      lastName: prev.lastName || user.lastName || '',
      email: prev.email || user.email || '',
      phone: prev.phone || (user.phone ? formatTunisianPhone(user.phone) : ''),
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'phone' ? formatTunisianPhone(value) : value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'Prénom requis.';
    if (!form.lastName.trim()) nextErrors.lastName = 'Nom requis.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Email invalide.';
    if (!/^\+?\d{8,15}$/.test(stripPhoneSpaces(form.phone))) nextErrors.phone = 'Téléphone invalide.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createLead({ ...form, phone: stripPhoneSpaces(form.phone), listingId, providerEventId: event.id });
      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Une erreur est survenue. Vos informations ont été conservées, veuillez réessayer.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2C3E50]">
            {success ? 'Demande envoyée' : 'Je suis intéressé(e)'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            ✕
          </button>
        </div>

        {!success && <p className="mt-1 text-sm text-gray-500">{event.title}</p>}

        {success ? (
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Votre demande a bien été transmise. Le prestataire va vous recontacter directement.
              Un accusé de réception vous a été envoyé par email.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Cette mise en relation est gratuite : aucun paiement n'est traité par la plateforme.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-lg bg-[#4E8BC4] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3f74a3]"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                <input required name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} />
                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom *</label>
                <input required name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} />
                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input required type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone (+216) *</label>
              <input required
                type="tel"
                pattern="[+]216 [0-9]{2} [0-9]{3} [0-9]{3}"
                inputMode="tel"
                autoComplete="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+21620000000"
                className={inputClass}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                className={inputClass}
              />
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#4E8BC4] py-2 text-sm font-semibold text-white transition hover:bg-[#3f74a3] disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default EventInterestForm;

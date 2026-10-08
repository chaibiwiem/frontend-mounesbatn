import useDocumentMeta from '../hooks/useDocumentMeta';

const CONTACT_EMAIL = 'contact@mounesba.tn';
const PROVIDERS_EMAIL = 'prestataires@mounesba.tn';

const HELP_CATEGORIES = [
  {
    title: 'Compte utilisateur',
    items: [
      'Créer ou modifier votre compte',
      'Réinitialiser votre mot de passe',
      'Gérer vos informations personnelles',
      'Supprimer votre compte',
    ],
  },
  {
    title: 'Demandes de devis',
    items: [
      'Comment demander un devis à un prestataire',
      'Suivre vos demandes et les réponses reçues',
      'Contacter plusieurs prestataires pour comparer',
      "Liste des services disponibles : lieux de réception, traiteurs, photographes, décoration, animation, transport, tenues et bien d'autres",
    ],
  },
  {
    title: 'Avis',
    items: [
      'Laisser un avis après votre événement',
      'Répondre à un avis reçu (prestataires)',
      'Signaler un avis abusif',
    ],
  },
  {
    title: 'Espace prestataire',
    items: [
      'Créer et compléter votre fiche',
      'Gérer les demandes reçues',
      "Comprendre les formules d'abonnement",
      'Modifier ou résilier votre abonnement',
    ],
  },
  {
    title: 'Assistance technique',
    items: ["Problèmes d'affichage ou de connexion", "Difficultés lors de l'envoi d'une demande", 'Téléversement de photos'],
  },
];

// Reponses conformes aux regles structurantes Mounesba (CLAUDE.md) : pas de
// paiement en ligne, pas de commission, monetisation par abonnement
// prestataire uniquement, comptes prestataires crees par l'equipe (pas
// d'inscription en libre-service), plateforme web uniquement.
const FAQ_ITEMS = [
  {
    question: 'Mounesba est-il gratuit pour les clients ?',
    answer:
      "Oui, entièrement gratuit. Demander un devis, comparer des prestataires et laisser un avis ne coûte rien. Seuls les prestataires ont des formules d'abonnement (Starter gratuit, Pro, Premium) pour publier leur fiche.",
  },
  {
    question: 'Comment demander un devis à un prestataire ?',
    answer:
      "Depuis la fiche du prestataire qui vous intéresse, remplissez le formulaire de demande (type d'événement, date, nombre d'invités, budget, message). Le prestataire reçoit votre demande et vous recontacte directement.",
  },
  {
    question: 'Sous quel délai vais-je recevoir une réponse ?',
    answer:
      "La plupart des prestataires répondent sous 24 à 48h. Si une demande reste sans réponse au-delà de ce délai, elle est signalée comme en retard côté prestataire.",
  },
  {
    question: 'Le paiement se fait-il sur Mounesba ?',
    answer:
      'Non. Le prix et les modalités de règlement (espèces ou virement) se conviennent directement avec le prestataire.',
  },
  {
    question: 'Que faire si un prestataire ne répond pas ?',
    answer:
      "Vous pouvez contacter d'autres prestataires en parallèle pour comparer, ou nous signaler l'absence de réponse via la page Contact.",
  },
  {
    question: 'Comment laisser un avis après mon événement ?',
    answer:
      "Un avis ne peut être laissé qu'après un événement terminé, un seul par réservation. Vous y êtes invité depuis votre espace client une fois la prestation passée.",
  },
  {
    question: 'Comment devenir prestataire sur Mounesba ?',
    answer:
      "Les fiches prestataires sont créées par notre équipe après validation, pas en inscription libre-service. Écrivez-nous via la page Contact avec les informations de votre activité.",
  },
  {
    question: 'Prenez-vous une commission sur les contrats ?',
    answer:
      "Non, aucune commission. Notre modèle repose uniquement sur l'abonnement des prestataires (Starter gratuit, Pro, Premium).",
  },
];

function HelpCategoryCard({ title, items }) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <p className="font-semibold text-gray-900">{title}</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// Page /centre-aide (lien footer, colonne "Informations") : contenu fourni
// tel quel. La rubrique "Application mobile" n'existe pas (plateforme web
// uniquement, CLAUDE.md regle 4) et le sujet paiement n'apparait qu'en FAQ
// ("Le paiement se fait-il sur Mounesba ?"), jamais comme rubrique a part -
// reprendre une rubrique "Paiements" laisserait croire que la plateforme
// encaisse, ce qui n'est pas le cas. Telephone volontairement omis (valeur
// placeholder "+216 ..." fournie, pas un vrai numero) ; horaires conserves.
function HelpCenter() {
  useDocumentMeta(
    "Centre d'aide | Mounesba",
    "Toutes les réponses pour organiser votre événement sur Mounesba : compte, demandes de devis, avis, espace prestataire et FAQ."
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:!px-[90px]">
      <h1
        className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Centre d&apos;aide
      </h1>
      <p className="mt-3 text-gray-600">
        Bienvenue dans le centre d&apos;aide de Mounesba. Retrouvez ici les informations
        nécessaires pour organiser votre événement et répondre à vos questions.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Catégories d&apos;aide disponibles
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HELP_CATEGORIES.map((category) => (
            <HelpCategoryCard key={category.title} {...category} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Contactez-nous
        </h2>
        <p className="mt-3 text-gray-600">Pour traiter votre demande rapidement, merci de nous indiquer :</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-gray-600">
          <li>Votre adresse e-mail de connexion</li>
          <li>Le numéro de votre demande, le cas échéant</li>
          <li>Le nom du prestataire concerné, le cas échéant</li>
        </ul>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">E-mail</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-rose-600 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Prestataires</p>
            <a href={`mailto:${PROVIDERS_EMAIL}`} className="font-medium text-rose-600 hover:underline">
              {PROVIDERS_EMAIL}
            </a>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 sm:col-span-2">
            <p className="text-sm text-gray-500">Horaires</p>
            <p className="font-medium text-gray-900">Du lundi au vendredi, 9h – 17h</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          FAQ — Questions fréquentes
        </h2>
        <div className="mt-4 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="rounded-xl border border-gray-200 p-4">
              <p className="font-medium text-gray-900">{item.question}</p>
              <p className="mt-1.5 text-sm text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HelpCenter;

import { Link } from 'react-router-dom';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { IconChevronRight } from '../components/icons';

const CONTACT_EMAIL = 'contact@mounesba.tn';

// Hub des pages legales (/centre-legal, lien footer). Chaque entree pointe
// vers une vraie page quand elle existe (Politique de confidentialite,
// Politique de cookies) ou vers /contact quand la demarche decrite (exercer
// ses droits, signaler un contenu/avis, reclamation) passe par un email a
// l'equipe, faute de flux dedie pour l'instant. Les documents legaux dont le
// contenu n'a pas encore ete redige (mentions legales, CGU, CGV abonnement,
// conditions de referencement) sont listes mais non cliquables ("Bientot
// disponible") plutot que de pointer vers une page vide ou un texte invente.
const SECTIONS = [
  {
    title: 'Informations légales',
    items: [
      {
        title: 'Mentions légales',
        description: 'Éditeur du site, hébergement, propriété intellectuelle et droit applicable.',
      },
      {
        title: "Conditions générales d'utilisation",
        description: "Règles d'accès et d'usage de la plateforme pour les clients et les prestataires.",
      },
      {
        title: "Conditions générales d'abonnement",
        description: 'Formules, tarifs, durée, facturation et résiliation des abonnements prestataires.',
      },
      {
        title: 'Conditions de référencement',
        description: 'Critères de validation des fiches, engagements des prestataires et motifs de suspension.',
      },
    ],
  },
  {
    title: 'Données personnelles',
    items: [
      {
        title: 'Politique de confidentialité',
        description:
          'Données collectées, finalités, durée de conservation et destinataires, conformément à la loi organique n° 2004-63 du 27 juillet 2004.',
        to: '/politique-de-confidentialite',
      },
      {
        title: 'Gestion des cookies',
        description: 'Cookies utilisés sur le site et moyens de les paramétrer.',
        to: '/politique-de-cookies',
      },
      {
        title: 'Exercer vos droits',
        description: "Formulaire de demande d'accès, de rectification ou d'opposition sur vos données personnelles.",
        to: '/contact',
      },
    ],
  },
  {
    title: 'Signalements',
    items: [
      {
        title: 'Signaler un contenu',
        description: 'Signaler une fiche, une photographie ou un texte contraire à la loi ou à nos conditions.',
        to: '/contact',
      },
      {
        title: 'Signaler un avis',
        description: "Demander l'examen d'un avis que vous estimez faux, injurieux ou frauduleux.",
        to: '/contact',
      },
      {
        title: 'Signaler une atteinte aux droits',
        description:
          "Signaler l'utilisation non autorisée de vos photographies, de votre marque ou de votre nom commercial.",
        to: '/contact',
      },
      {
        title: 'Réclamation',
        description: 'Contester une décision de suspension ou de refus de publication de votre fiche.',
        to: '/contact',
      },
    ],
  },
];

function LegalItem({ title, description, to }) {
  const content = (
    <>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      {to && <IconChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-rose-300 hover:bg-rose-50"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">{content}</div>;
}

// Hub des pages legales (/centre-legal), liste depuis le footer.
function LegalCenter() {
  useDocumentMeta(
    'Centre légal | Mounesba',
    "L'ensemble des informations juridiques relatives à l'utilisation de Mounesba : mentions légales, conditions, données personnelles et signalements."
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:!px-[90px]">
      <h1
        className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Centre légal
      </h1>
      <p className="mt-3 text-gray-600">
        Retrouvez ici l&apos;ensemble des informations juridiques relatives à l&apos;utilisation de
        Mounesba.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            {section.title}
          </h2>
          <div className="mt-4 space-y-3">
            {section.items.map((item) => (
              <LegalItem key={item.title} {...item} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Contact
        </h2>
        <p className="mt-3 text-gray-600">
          Pour toute question juridique :{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-rose-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="mt-1 text-gray-600">Montplaisir, Tunisie</p>
      </section>
    </div>
  );
}

export default LegalCenter;

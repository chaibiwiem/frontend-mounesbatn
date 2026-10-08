import { Link } from 'react-router-dom';
import useDocumentMeta from '../hooks/useDocumentMeta';

const CONTACT_EMAIL = 'contact@mounesba.tn';

const ESSENTIAL_COOKIES = [
  { name: 'mounesba_session', purpose: 'Maintien de votre session de connexion', duration: 'Session' },
  { name: 'mounesba_refresh', purpose: 'Renouvellement sécurisé de votre authentification', duration: '7 jours' },
  { name: 'mounesba_consent', purpose: 'Mémorisation de vos choix en matière de cookies', duration: '6 mois' },
];

const AUDIENCE_COOKIES = [{ name: '_ga / autre', purpose: 'Statistiques de fréquentation', duration: '13 mois' }];

const BROWSER_SETTINGS = [
  { browser: 'Chrome', path: 'Paramètres → Confidentialité et sécurité → Cookies' },
  { browser: 'Firefox', path: 'Paramètres → Vie privée et sécurité → Cookies' },
  { browser: 'Safari', path: 'Préférences → Confidentialité' },
  { browser: 'Edge', path: 'Paramètres → Cookies et autorisations de site' },
];

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-gray-600">{children}</div>
    </section>
  );
}

function CookieTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[480px] divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Cookie</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Finalité</th>
            <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">Durée</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-gray-900">
                {row.name}
              </td>
              <td className="px-4 py-3 text-gray-600">{row.purpose}</td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Page legale (/politique-de-cookies, lien footer) : contenu fourni tel
// quel, complement de PrivacyPolicy.jsx. Note : Mounesba n'a pas (encore) de
// bandeau de consentement cookies implemente cote frontend - cette page
// decrit la politique/l'intention telle que fournie par l'utilisateur, le
// lien "Gerer mes cookies" qu'elle mentionne n'est donc pas rendu comme un
// vrai lien cliquable tant que ce composant n'existe pas.
function CookiePolicy() {
  useDocumentMeta(
    'Politique de cookies | Mounesba',
    'Quels cookies Mounesba utilise, pourquoi, et comment gérer vos préférences.'
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:!px-[90px]">
      <h1
        className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Politique de cookies
      </h1>

      <Section title="1. Qu'est-ce qu'un cookie ?">
        <p>
          Un cookie est un petit fichier texte déposé sur votre appareil lors de la consultation
          d&apos;un site web. Il permet notamment de vous maintenir connecté, de mémoriser vos
          préférences ou de mesurer l&apos;audience du site.
        </p>
        <p>
          Cette politique complète notre{' '}
          <Link to="/politique-de-confidentialite" className="font-medium text-rose-600 hover:underline">
            Politique de confidentialité
          </Link>{' '}
          et détaille les cookies utilisés sur mounesba.tn.
        </p>
      </Section>

      <Section title="2. Cookies utilisés sur Mounesba">
        <h3 className="font-semibold text-gray-900">Cookies strictement nécessaires</h3>
        <p>
          Indispensables au fonctionnement du site, ils ne peuvent pas être désactivés. Sans eux,
          vous ne pouvez ni vous connecter, ni accéder à votre espace personnel.
        </p>
        <CookieTable rows={ESSENTIAL_COOKIES} />

        <h3 className="pt-2 font-semibold text-gray-900">Cookies de mesure d&apos;audience</h3>
        <p>
          Ils nous permettent de comprendre comment le site est utilisé (pages consultées, durée
          de visite, parcours) afin de l&apos;améliorer. Les données sont agrégées et ne permettent
          pas de vous identifier.
        </p>
        <CookieTable rows={AUDIENCE_COOKIES} />
        <p>Ces cookies ne sont déposés qu&apos;après votre consentement.</p>

        <h3 className="pt-2 font-semibold text-gray-900">Cookies tiers</h3>
        <p>
          Mounesba n&apos;intègre aucun cookie publicitaire et ne pratique aucun suivi à des fins
          de ciblage marketing.
        </p>
        <p>
          Les cartes affichées sur les fiches prestataires sont fournies par OpenStreetMap, qui ne
          dépose pas de cookie de suivi.
        </p>
      </Section>

      <Section title="3. Gérer vos préférences">
        <p>
          Lors de votre première visite, un bandeau vous permet d&apos;accepter ou de refuser les
          cookies non essentiels.
        </p>
        <p>
          Vous pouvez modifier votre choix à tout moment depuis le lien « Gérer mes cookies »
          situé en bas de chaque page.
        </p>
        <p>Le refus des cookies de mesure d&apos;audience n&apos;affecte en rien votre utilisation du site.</p>
      </Section>

      <Section title="4. Paramétrer votre navigateur">
        <p>Vous pouvez également configurer votre navigateur pour bloquer ou supprimer les cookies :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          {BROWSER_SETTINGS.map((row) => (
            <li key={row.browser}>
              <span className="font-medium text-gray-900">{row.browser} :</span> {row.path}
            </li>
          ))}
        </ul>
        <p>Le blocage des cookies strictement nécessaires vous empêchera d&apos;accéder à votre compte.</p>
      </Section>

      <Section title="5. Durée de conservation">
        <p>
          Les durées figurent dans les tableaux ci-dessus. Vos préférences en matière de cookies
          sont conservées 6 mois ; passé ce délai, le bandeau vous est présenté à nouveau.
        </p>
      </Section>

      <Section title="6. Modification de la politique">
        <p>
          Cette politique peut être modifiée, notamment en cas d&apos;ajout d&apos;un nouvel
          outil. La version applicable est celle publiée sur cette page, dont la date de mise à
          jour figure en tête.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          Pour toute question relative aux cookies :{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-rose-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </div>
  );
}

export default CookiePolicy;

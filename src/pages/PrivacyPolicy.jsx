import useDocumentMeta from '../hooks/useDocumentMeta';

const CONTACT_EMAIL = 'contact@mounesba.tn';

const RETENTION_ROWS = [
  { data: 'Compte utilisateur', duree: "Durée d'utilisation, puis 12 mois après fermeture" },
  { data: 'Demandes de devis', duree: '24 mois' },
  { data: 'Avis publiés', duree: 'Durée de publication de la fiche concernée' },
  { data: 'Données de facturation', duree: '10 ans (obligations comptables)' },
  { data: 'Journaux de connexion', duree: '12 mois' },
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

// Page legale (/politique-de-confidentialite, lien footer) : contenu fourni
// tel quel, conforme a la loi organique tunisienne n° 2004-63 du 27 juillet
// 2004 relative a la protection des donnees a caractere personnel - reflete
// le fonctionnement reel de Mounesba (aucun paiement en ligne traite par la
// plateforme, cf. CLAUDE.md).
function PrivacyPolicy() {
  useDocumentMeta(
    'Politique de confidentialité | Mounesba',
    'Comment Mounesba collecte, utilise et protège vos données personnelles, conformément à la loi organique n° 2004-63 du 27 juillet 2004.'
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:!px-[90px]">
      <h1
        className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Politique de confidentialité
      </h1>
      <p className="mt-3 text-gray-600">
        Bienvenue sur Mounesba. La protection de vos données personnelles est une priorité. Cette
        politique explique comment nous collectons, utilisons et protégeons vos informations
        lorsque vous utilisez notre plateforme, conformément à la loi organique n° 2004-63 du 27
        juillet 2004 relative à la protection des données à caractère personnel.
      </p>

      <Section title="1. Collecte des données personnelles">
        <p>Nous collectons plusieurs types de données lorsque vous utilisez notre service :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-medium text-gray-900">Informations d&apos;identification :</span> nom,
            prénom, adresse e-mail, numéro de téléphone, ville ou gouvernorat.
          </li>
          <li>
            <span className="font-medium text-gray-900">Informations de compte :</span> mot de passe,
            stocké sous forme chiffrée.
          </li>
          <li>
            <span className="font-medium text-gray-900">Informations relatives à vos demandes :</span>{' '}
            type d&apos;événement, date envisagée, nombre d&apos;invités, budget indicatif, message
            adressé au prestataire.
          </li>
          <li>
            <span className="font-medium text-gray-900">Informations professionnelles (prestataires) :</span>{' '}
            raison sociale, adresse, description des prestations, tarifs, photographies.
          </li>
          <li>
            <span className="font-medium text-gray-900">Informations de navigation :</span> adresse IP,
            type de navigateur, journaux de connexion.
          </li>
        </ul>
        <p>
          Mounesba ne collecte aucune donnée bancaire. Aucun paiement n&apos;est traité par la
          plateforme : les règlements s&apos;effectuent directement entre le client et le
          prestataire.
        </p>
      </Section>

      <Section title="2. Utilisation des données personnelles">
        <p>Les données collectées sont utilisées pour :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>créer et gérer votre compte ;</li>
          <li>transmettre vos demandes de devis aux prestataires concernés ;</li>
          <li>permettre la publication et la consultation des fiches prestataires ;</li>
          <li>localiser les prestataires sur une carte ;</li>
          <li>publier et modérer les avis ;</li>
          <li>gérer les abonnements des prestataires ;</li>
          <li>vous adresser les notifications liées au service ;</li>
          <li>assurer la sécurité de la plateforme et prévenir les usages frauduleux.</li>
        </ul>
        <p>
          Nous ne vous adressons de communications promotionnelles qu&apos;avec votre consentement,
          et vous pouvez le retirer à tout moment.
        </p>
      </Section>

      <Section title="3. Partage des données">
        <p>Nous ne vendons ni ne louons vos données personnelles.</p>
        <p>
          <span className="font-medium text-gray-900">Transmission aux prestataires</span> — Lorsque
          vous envoyez une demande de devis, les informations que vous avez renseignées (nom,
          e-mail, téléphone, détails de l&apos;événement) sont communiquées au prestataire
          destinataire de cette demande, afin qu&apos;il puisse vous répondre. Ce prestataire
          s&apos;engage à n&apos;utiliser ces données que pour traiter votre demande.
        </p>
        <p>Nous partageons également certaines informations avec :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>nos prestataires techniques (hébergement, envoi des e-mails, cartographie) ;</li>
          <li>les autorités judiciaires ou administratives sur réquisition légale.</li>
        </ul>
        <p>
          Certaines données sont hébergées sur des serveurs situés hors du territoire tunisien,
          dans le respect des articles 50 et suivants de la loi organique n° 2004-63.
        </p>
      </Section>

      <Section title="4. Sécurité des données">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos
          informations : chiffrement des mots de passe, transmission par protocole HTTPS, contrôle
          des accès par rôle, limitation des tentatives de connexion et sauvegardes régulières.
        </p>
        <p>
          Aucune transmission sur internet ne pouvant être garantie comme totalement inviolable,
          nous vous invitons à choisir un mot de passe robuste et à ne pas le communiquer.
        </p>
      </Section>

      <Section title="5. Durée de conservation">
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[420px] divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                  Donnée
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-700">
                  Durée
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {RETENTION_ROWS.map((row) => (
                <tr key={row.data}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.data}</td>
                  <td className="px-4 py-3 text-gray-600">{row.duree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>À l&apos;issue de ces durées, les données sont supprimées ou anonymisées.</p>
      </Section>

      <Section title="6. Vos droits">
        <p>
          Conformément aux articles 32 et suivants de la loi organique n° 2004-63, vous disposez
          des droits suivants :
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>accès à vos données ;</li>
          <li>rectification des données inexactes ou incomplètes ;</li>
          <li>opposition au traitement, pour motif légitime ;</li>
          <li>suppression de votre compte et des données associées.</li>
        </ul>
        <p>
          Ces droits s&apos;exercent à l&apos;adresse{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-rose-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
          , accompagnés d&apos;un justificatif d&apos;identité. Une réponse vous est apportée sous
          30 jours.
        </p>
        <p>
          Vous pouvez également saisir l&apos;Instance Nationale de Protection des Données à
          Caractère Personnel (INPDP).
        </p>
      </Section>

      <Section title="7. Cookies et technologies similaires">
        <p>
          Notre site utilise des cookies strictement nécessaires à son fonctionnement (session,
          authentification), qui ne peuvent être désactivés, et, le cas échéant, des cookies de
          mesure d&apos;audience soumis à votre consentement.
        </p>
        <p>
          Vous pouvez paramétrer votre navigateur pour les refuser. Le refus des cookies
          nécessaires empêche l&apos;accès à votre espace personnel.
        </p>
      </Section>

      <Section title="8. Modifications de la politique">
        <p>
          Nous nous réservons le droit de modifier cette politique à tout moment. Toute
          modification est publiée sur cette page avec mise à jour de la date figurant en tête du
          document. Les modifications substantielles sont notifiées par e-mail aux utilisateurs
          inscrits.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Pour toute question relative à vos données personnelles :{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-rose-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </div>
  );
}

export default PrivacyPolicy;

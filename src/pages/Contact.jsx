import { IconMail, IconClock, IconInstagram, IconFacebook, IconTikTok } from '../components/icons';
import useDocumentMeta from '../hooks/useDocumentMeta';

const CONTACT_EMAIL = 'contact@mounesba.tn';

function Contact() {
  useDocumentMeta(
    'Contactez Mounesba | Mariage & événements en Tunisie',
    'Une question sur votre événement ou envie de rejoindre Mounesba en tant que prestataire ? Contactez notre équipe par formulaire, téléphone ou WhatsApp.',
    {
      ogTitle: 'Contactez Mounesba | Mariage & événements en Tunisie',
      ogDescription:
        'Clients ou prestataires, notre équipe vous répond rapidement pour organiser votre événement ou référencer votre activité.',
      url: 'https://mounesba.vercel.app/contact',
    }
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:!px-[90px]">
      <h1
        className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Contactez-nous
      </h1>
      <p className="mt-3 text-gray-600">
        Une question sur la plateforme, votre inscription en tant que prestataire, ou tout
        simplement besoin d&apos;aide ? Écrivez-nous, notre équipe vous répond au plus vite.
      </p>

      <div className="mt-8 space-y-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-rose-300 hover:bg-rose-50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <IconMail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{CONTACT_EMAIL}</p>
          </div>
        </a>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <IconClock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-gray-500">Délai de réponse</p>
            <p className="font-medium text-gray-900">Sous 48h ouvrées</p>
          </div>
        </div>

        {/* Instagram, Facebook et TikTok ont tous de vrais comptes Mounesba
            (memes liens que le footer). */}
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Réseaux sociaux</p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href="https://www.instagram.com/mounesbatn/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mounesba sur Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-rose-100 hover:text-rose-600"
            >
              <IconInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61594699323909"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mounesba sur Facebook"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-rose-100 hover:text-rose-600"
            >
              <IconFacebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.tiktok.com/@mounesba.tn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mounesba sur TikTok"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-rose-100 hover:text-rose-600"
            >
              <IconTikTok className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Vous cherchez un prestataire pour votre événement ? Rendez-vous directement sur sa fiche
        pour lui envoyer une demande de devis — c&apos;est gratuit et sans engagement.
      </p>
    </div>
  );
}

export default Contact;

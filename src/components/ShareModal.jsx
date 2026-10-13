import { useEffect, useState } from 'react';
import { IconX, IconLink, IconFacebook, IconMessenger, IconInstagram, IconWhatsapp, IconShare } from './icons';

const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Navigateur sans API presse-papiers (ou page non securisee) : repli.
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}

const openPopup = (url) => window.open(url, '_blank', 'noopener,noreferrer,width=600,height=560');

// Partage d'une fiche prestataire (reference fournie : "Partager Album").
// Facebook et WhatsApp ont un lien de partage public. Messenger n'en a pas
// sur ordinateur sans application Facebook enregistree, et Instagram n'en a
// pas du tout sur le web : dans ces cas on copie le lien puis on ouvre
// l'application, avec un message pour que le visiteur le colle. Sur mobile,
// Instagram passe par le menu de partage du telephone (navigator.share), qui
// le propose directement.
function ShareModal({ url, title, onClose }) {
  const [notice, setNotice] = useState('');
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const encodedUrl = encodeURIComponent(url);
  const shareText = `${title} sur Mounesba`;

  const copyThenOpen = async (appUrl, appName) => {
    const ok = await copyToClipboard(url);
    setNotice(ok ? `Lien copié : collez-le dans ${appName}.` : 'Copiez le lien de la page pour le partager.');
    window.open(appUrl, '_blank', 'noopener,noreferrer');
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: shareText, url });
    } catch {
      // Partage annule par l'utilisateur : rien a faire.
    }
  };

  const options = [
    {
      key: 'copy',
      label: 'Copier le lien',
      Icon: IconLink,
      circle: 'bg-gray-100 text-gray-900',
      onClick: async () => setNotice((await copyToClipboard(url)) ? 'Lien copié ✓' : 'Impossible de copier le lien.'),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      Icon: IconFacebook,
      circle: 'bg-[#1877F2] text-white',
      onClick: () => openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      key: 'messenger',
      label: 'Messenger',
      Icon: IconMessenger,
      circle: 'bg-gradient-to-br from-[#00B2FF] via-[#7B61FF] to-[#FF5C87] text-white',
      onClick: () =>
        isMobileDevice()
          ? (window.location.href = `fb-messenger://share/?link=${encodedUrl}`)
          : copyThenOpen('https://www.messenger.com/', 'Messenger'),
    },
    {
      key: 'instagram',
      label: 'Instagram',
      Icon: IconInstagram,
      circle: 'bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] text-white',
      onClick: () =>
        isMobileDevice() && canNativeShare
          ? nativeShare()
          : copyThenOpen('https://www.instagram.com/direct/inbox/', 'Instagram'),
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      Icon: IconWhatsapp,
      circle: 'bg-[#25D366] text-white',
      onClick: () => openPopup(`https://wa.me/?text=${encodeURIComponent(`${shareText} : ${url}`)}`),
    },
  ];
  // "Plus d'options" : menu de partage du telephone (SMS, e-mail, autres apps).
  if (canNativeShare) {
    options.push({
      key: 'native',
      label: "Plus d'options",
      Icon: IconShare,
      circle: 'bg-gray-100 text-gray-900',
      onClick: nativeShare,
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Partager"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Partager</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-y-5 sm:grid-cols-6">
          {options.map(({ key, label, Icon, circle, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex flex-col items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900"
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-full transition hover:scale-105 ${circle}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {notice && (
          <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2 text-center text-sm text-gray-700" role="status">
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}

export default ShareModal;

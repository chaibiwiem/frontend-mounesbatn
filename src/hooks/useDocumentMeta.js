import { useEffect } from 'react';

// Cree (ou reutilise) une balise <meta>/<link> du <head> et renvoie une
// fonction de nettoyage qui la retire si c'est ce hook qui l'a creee - evite
// qu'une balise propre a une page (canonical, og:url...) reste en place apres
// navigation vers une autre page de la SPA.
function upsertHeadTag(selector, create, setValue) {
  let tag = document.head.querySelector(selector);
  let created = false;
  if (!tag) {
    tag = create();
    document.head.appendChild(tag);
    created = true;
  }
  setValue(tag);
  return () => {
    if (created) tag.remove();
  };
}

function upsertMeta(attr, key, content) {
  return upsertHeadTag(
    `meta[${attr}="${key}"]`,
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute(attr, key);
      return meta;
    },
    (meta) => meta.setAttribute('content', content)
  );
}

// Definit le <title> et la <meta name="description"> de la page courante -
// utilise sur chaque page publique (SEO), en complement des balises par
// defaut dans index.html (utilisees par les robots qui n'executent pas le
// JS et pour le premier affichage avant hydratation).
// `social` (optionnel) : partage reseaux sociaux (Open Graph) + URL canonique
// - { ogTitle, ogDescription, url }.
function useDocumentMeta(title, description, social = {}) {
  const { ogTitle, ogDescription, url } = social;

  useEffect(() => {
    document.title = title;

    const cleanups = [upsertMeta('name', 'description', description)];
    if (ogTitle) cleanups.push(upsertMeta('property', 'og:title', ogTitle));
    if (ogDescription) cleanups.push(upsertMeta('property', 'og:description', ogDescription));
    if (url) {
      cleanups.push(upsertMeta('property', 'og:url', url));
      cleanups.push(
        upsertHeadTag(
          'link[rel="canonical"]',
          () => {
            const link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            return link;
          },
          (link) => link.setAttribute('href', url)
        )
      );
    }

    // La meta description est partagee par toutes les pages (jamais retiree) ;
    // les balises propres a cette page le sont a la navigation.
    return () => cleanups.slice(1).forEach((cleanup) => cleanup());
  }, [title, description, ogTitle, ogDescription, url]);
}

export default useDocumentMeta;

// Lien externe saisi par un prestataire (site web, reseaux sociaux, Google
// Maps) avant de le placer dans un href : React 18 n'empeche PAS un
// "javascript:..." dans href (simple avertissement console), qui executerait
// du code au clic (XSS). On ne garde que http(s) ; une adresse sans schema
// ("www.site.tn") est completee en https:// (sinon le navigateur la traite
// comme un chemin relatif du site). null = lien ignore. Meme regle que la
// validation backend (backend/src/middleware/safeUrl.js).
export function safeExternalUrl(value) {
  const url = String(value ?? '').trim();
  if (!url || /\s/.test(url)) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;
  return `https://${url.replace(/^\/+/, '')}`;
}

// Champ de lien (type="url") : a la sortie du champ, "www.site.tn" devient
// "https://www.site.tn" - sinon la validation native du navigateur refuserait
// d'envoyer le formulaire pour une adresse saisie sans http(s)://.
export function withHttps(value) {
  const url = String(value ?? '').trim();
  if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
}

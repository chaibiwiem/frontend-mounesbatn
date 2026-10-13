// Formate en direct un numero tunisien saisi/colle sous n'importe quelle
// forme ("20123456", "21620123456", "+216 20 123 456"...) vers "+216 XX XXX
// XXX" (regroupement standard 2-3-3 du numero local a 8 chiffres) - l'indicatif
// +216 est toujours pre-rempli. Utilise partout ou un numero de telephone
// tunisien est saisi (formulaire de devis, creation prestataire...).
export function formatTunisianPhone(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('216')) digits = digits.slice(3);
  digits = digits.slice(0, 8);
  if (!digits) return '';
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)].filter(Boolean);
  return `+216 ${groups.join(' ')}`;
}

// Retire les espaces d'un numero formate avant validation/envoi au backend
// (express-validator : /^\+?\d{8,15}$/, n'accepte pas les espaces).
export function stripPhoneSpaces(value) {
  return value.replace(/\s/g, '');
}

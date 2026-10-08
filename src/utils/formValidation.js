// Messages de validation des formulaires, pour toute la plateforme.
//
// Remplace la bulle native du navigateur ("Veuillez inclure "@" dans
// l'adresse e-mail..."), dont le texte et le style changent d'un navigateur
// a l'autre, par un message clair en francais affiche en rouge sous le champ
// + bordure rouge. Fonctionne automatiquement pour tout champ portant les
// attributs HTML habituels (required, type="email|tel|url|number|date",
// min/max, minLength, pattern) : aucun code a ajouter dans les formulaires.
// Message sur mesure possible via l'attribut data-error-message.
//
// Installe une seule fois au demarrage (main.jsx).

const MSG_ATTR = 'data-validation-msg';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const formatBound = (field, value) => {
  if (field.type === 'date' && value) {
    return new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR');
  }
  if (field.type === 'datetime-local' && value) {
    return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }
  return value;
};

function messageFor(field) {
  const v = field.validity;
  const isDate = /^(date|datetime-local|time|month)$/.test(field.type);

  if (field.dataset.errorMessage && !v.valid) return field.dataset.errorMessage;

  if (v.valueMissing) {
    if (field.type === 'checkbox') return 'Veuillez cocher cette case pour continuer.';
    if (field.tagName === 'SELECT') return 'Veuillez sélectionner une option.';
    if (isDate) return 'Veuillez choisir une date.';
    return 'Ce champ est obligatoire.';
  }
  if (v.customError) return field.validationMessage;
  if (v.typeMismatch || (field.type === 'email' && v.patternMismatch)) {
    if (field.type === 'email') return 'Adresse email invalide. Exemple : nom@exemple.com';
    if (field.type === 'url') return 'Lien invalide. Exemple : https://www.exemple.tn';
    return 'Format invalide.';
  }
  if (v.patternMismatch) {
    if (field.type === 'tel') return 'Numéro de téléphone invalide. Exemple : +216 20 123 456';
    return field.title || 'Format invalide.';
  }
  if (v.badInput) return isDate ? 'Date invalide.' : 'Veuillez saisir un nombre valide.';
  if (v.rangeUnderflow) {
    return isDate
      ? `La date doit être au plus tôt le ${formatBound(field, field.min)}.`
      : `La valeur doit être supérieure ou égale à ${field.min}.`;
  }
  if (v.rangeOverflow) {
    return isDate
      ? `La date doit être au plus tard le ${formatBound(field, field.max)}.`
      : `La valeur doit être inférieure ou égale à ${field.max}.`;
  }
  if (v.stepMismatch) return 'Valeur non valide.';
  if (v.tooShort) return `Au moins ${field.minLength} caractères requis.`;
  if (v.tooLong) return `${field.maxLength} caractères maximum.`;
  return 'Valeur non valide.';
}

// Le message est place juste sous le champ - ou sous son conteneur
// "relative" quand le champ est accompagne d'une icone positionnee
// (UnderlineField, champs mot de passe avec bouton oeil...), pour ne pas
// decaler l'icone.
function anchorOf(field) {
  if (field.type === 'checkbox' || field.type === 'radio') return field.closest('label') || field;
  const parent = field.parentElement;
  if (parent && parent.classList.contains('relative') && parent.children.length > 1) return parent;
  return field;
}

function findMessage(field) {
  const id = field.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
}

let counter = 0;

function showMessage(field) {
  let msg = findMessage(field);
  if (!msg) {
    msg = document.createElement('p');
    counter += 1;
    msg.id = `validation-msg-${counter}`;
    msg.setAttribute(MSG_ATTR, '');
    msg.setAttribute('role', 'alert');
    msg.className = 'mt-1 text-xs font-medium text-red-600';
    msg.validationField = field;
    anchorOf(field).insertAdjacentElement('afterend', msg);
    field.setAttribute('aria-describedby', msg.id);
  }
  msg.textContent = messageFor(field);
  field.setAttribute('aria-invalid', 'true');
}

function clearMessage(field) {
  const msg = findMessage(field);
  if (msg && msg.hasAttribute(MSG_ATTR)) msg.remove();
  if (msg) field.removeAttribute('aria-describedby');
  field.removeAttribute('aria-invalid');
}

// Email : le navigateur accepte "nom@domaine" sans extension (.tn, .com...),
// on exige une adresse complete.
function checkEmail(field) {
  if (field.type !== 'email') return;
  const value = field.value.trim();
  field.setCustomValidity(value && !EMAIL_RE.test(value) ? 'Adresse email invalide. Exemple : nom@exemple.com' : '');
}

const isField = (el) => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;

let focusedThisRound = false;

function onInvalid(e) {
  const field = e.target;
  if (!isField(field)) return;
  e.preventDefault(); // supprime la bulle native du navigateur
  showMessage(field);
  // Le navigateur declenche "invalid" pour chaque champ invalide du
  // formulaire : on n'amene a l'ecran que le premier.
  if (!focusedThisRound) {
    focusedThisRound = true;
    field.focus({ preventScroll: true });
    field.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => {
      focusedThisRound = false;
    }, 0);
  }
}

function onEdit(e) {
  const field = e.target;
  if (!isField(field)) return;
  checkEmail(field);
  if (field.getAttribute('aria-invalid') !== 'true') return;
  if (field.validity.valid) clearMessage(field);
  else findMessage(field) && (findMessage(field).textContent = messageFor(field));
}

// Avant l'envoi : verification email stricte (sinon une adresse pre-remplie
// jamais modifiee ne serait pas controlee).
function onSubmitCapture(e) {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  form.querySelectorAll('input[type="email"]').forEach(checkEmail);
}

export function installFormValidation() {
  if (typeof document === 'undefined' || window.__formValidationInstalled) return;
  window.__formValidationInstalled = true;
  document.addEventListener('invalid', onInvalid, true);
  document.addEventListener('input', onEdit, true);
  document.addEventListener('change', onEdit, true);
  // "click" sur un bouton submit : intervient AVANT la validation native
  // (contrairement a "submit", declenche seulement si le formulaire est valide).
  document.addEventListener(
    'click',
    (e) => {
      const button = e.target.closest?.('button, input[type="submit"]');
      if (button?.form && (button.type === 'submit' || button.getAttribute('type') === null)) {
        onSubmitCapture({ target: button.form });
      }
    },
    true
  );
  document.addEventListener('focusin', (e) => isField(e.target) && checkEmail(e.target), true);

  // Champ retire de la page par React (champ conditionnel masque, ex.
  // adresse de livraison quand on passe en "Retrait") : son message ne doit
  // pas rester affiche seul.
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      document.querySelectorAll(`[${MSG_ATTR}]`).forEach((msg) => {
        if (!msg.validationField?.isConnected) msg.remove();
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

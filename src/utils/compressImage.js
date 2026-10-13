// Compression des photos AVANT envoi : en production l'API tourne sur Vercel,
// qui refuse toute requete de plus de 4,5 Mo (erreur 413, avant meme
// d'atteindre le backend) - une photo de telephone depasse vite cette taille.
// Redimensionnement a MAX_DIMENSION px max (cote le plus long) + recompression.
// Toujours sans risque : en cas d'echec ou si le resultat n'est pas plus
// leger, le fichier d'origine est envoye tel quel.

const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_SIZE_TO_COMPRESS = 1024 * 1024; // 1 Mo : les petites images partent telles quelles
const MAX_DIMENSION = 2560;
const QUALITY = 0.85;
// Au-dela, un PNG redimensionne reste trop lourd : passage en WebP (garde la
// transparence, contrairement au JPEG).
const MAX_PNG_SIZE = 3 * 1024 * 1024;

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function renamed(name, type) {
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  return `${base}${EXTENSIONS[type]}`;
}

export async function compressImage(file) {
  if (!(file instanceof File) || !COMPRESSIBLE_TYPES.includes(file.type) || file.size < MIN_SIZE_TO_COMPRESS) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    let type = file.type;
    let blob = await canvasToBlob(canvas, type, QUALITY);
    if (type === 'image/png' && blob && blob.size > MAX_PNG_SIZE) {
      type = 'image/webp';
      blob = await canvasToBlob(canvas, type, QUALITY);
    }
    // Navigateur sans encodeur WebP : toBlob renvoie du PNG a la place.
    if (blob && blob.type !== type) type = blob.type;

    if (!blob || blob.size >= file.size || !EXTENSIONS[type]) return file;
    return new File([blob], renamed(file.name, type), { type, lastModified: file.lastModified });
  } catch {
    return file;
  }
}

// Remplace dans un FormData chaque photo compressible par sa version
// compressee (videos, SVG et champs texte inchanges).
export async function compressFormDataImages(formData) {
  const entries = [...formData.entries()];
  if (!entries.some(([, value]) => value instanceof File && COMPRESSIBLE_TYPES.includes(value.type))) {
    return formData;
  }

  const next = new FormData();
  for (const [key, value] of entries) {
    // eslint-disable-next-line no-await-in-loop
    const processed = value instanceof File ? await compressImage(value) : value;
    if (processed instanceof File) next.append(key, processed, processed.name);
    else next.append(key, processed);
  }
  return next;
}

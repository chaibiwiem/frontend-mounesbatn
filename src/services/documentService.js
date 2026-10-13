import api from './api';

// PDF de facture/contrat : plus accessible par lien public (donnees
// personnelles des clients), seulement via l'API authentifiee
// (GET /api/documents/:filename, proprietaire ou admin). Fenetre ouverte
// AVANT la requete (geste utilisateur direct) pour ne pas etre bloquee par le
// bloqueur de popups, puis remplie avec le PDF recu.
export async function openDocument(pdfUrl) {
  const win = window.open('', '_blank');
  try {
    const filename = String(pdfUrl).split('/').pop();
    const res = await api.get(`/documents/${encodeURIComponent(filename)}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    if (win) win.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    win?.close();
    window.alert("Impossible d'ouvrir le document.");
  }
}

// URL publique SEO d'une fiche prestataire : /:categorySlug/:listingSlug.
// Repli sur /listings/:id si le slug ou la categorie manquent (donnees pas
// encore migrees), pour ne jamais casser un lien.
export function getListingUrl(listing) {
  if (listing?.slug && listing?.category?.slug) {
    return `/${listing.category.slug}/${listing.slug}`;
  }
  return `/listings/${listing.id}`;
}

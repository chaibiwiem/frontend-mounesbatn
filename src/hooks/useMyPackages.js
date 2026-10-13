import { useEffect, useState } from 'react';
import { getMyListing } from '../services/listingService';

// Packs de la fiche du prestataire connecte (choix du pack dans les
// formulaires de reservation). Liste vide si le chargement echoue.
function useMyPackages() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    let active = true;
    getMyListing()
      .then((listing) => active && setPackages(listing.packages || []))
      .catch(() => active && setPackages([]));
    return () => {
      active = false;
    };
  }, []);

  return packages;
}

export default useMyPackages;

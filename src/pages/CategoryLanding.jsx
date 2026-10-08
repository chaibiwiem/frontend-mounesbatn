import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCategories, searchListings } from '../services/listingService';
import CategoryCarousel from '../components/CategoryCarousel';
import CategorySearchBar from '../components/CategorySearchBar';
import CategoryResultsPanel from '../components/CategoryResultsPanel';
import ListingCard from '../components/ListingCard';
import { IconSearch } from '../components/icons';

// Page de destination d'une categorie principale (ex. /categorie/lieux-de-mariage) :
// presente ses sous-categories puis la liste des prestataires de la categorie.
// Sans sous-categories, la liste est remplacee par le panneau complet
// filtres + resultats (comme la page /search) pour aller droit au but.
function CategoryLanding() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    setCategory(null);
    setNotFound(false);
    getCategories()
      .then((tree) => {
        setCategories(tree);
        const match = tree.find((c) => c.slug === slug);
        if (match) setCategory(match);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!category || !(category.children?.length > 0)) return;
    setListingsLoading(true);
    searchListings({ category: slug, limit: 8 })
      .then((data) => setListings(data.results))
      .catch(() => setListings([]))
      .finally(() => setListingsLoading(false));
  }, [slug, category]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-gray-600">Catégorie introuvable.</p>
        <Link to="/" className="mt-4 inline-block text-rose-600 hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (!category) {
    return <p className="py-16 text-center text-sm text-gray-500">Chargement...</p>;
  }

  return (
    <div>
      <div className="bg-white">
        <div className="w-full !px-[50px] py-16">
          <p className="text-sm text-gray-500">
            <Link to="/" className="hover:text-rose-600">
              Accueil
            </Link>{' '}
            / {category.name}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {category.name}
            </h1>

            <CategorySearchBar
              key={category.slug}
              categories={categories}
              defaultCategory={category.slug}
              containerClassName="w-full max-w-2xl sm:w-[600px]"
            />
          </div>
        </div>
      </div>

      {category.children?.length > 0 && (
        <div className="py-14">
          <div className="w-full !px-[50px]">
            <h2 className="text-center text-2xl font-bold text-gray-900">Sous-catégories</h2>
            <div className="mt-10">
              <CategoryCarousel
                categories={category.children}
                onSelect={(sub) => navigate(`/search?category=${sub.slug}`)}
              />
            </div>
          </div>
        </div>
      )}

      {category.children?.length > 0 ? (
        <div className="pb-16">
          <div className="w-full !px-[50px]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Prestataires « {category.name} »</h2>
              {listings.length > 0 && (
                <Link
                  to={`/search?category=${category.slug}`}
                  className="text-sm font-semibold text-rose-600 hover:underline"
                >
                  Voir tous les prestataires
                </Link>
              )}
            </div>

            {listingsLoading ? (
              <p className="mt-6 text-sm text-gray-500">Chargement...</p>
            ) : listings.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <IconSearch className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Aucun prestataire disponible pour le moment dans « {category.name} ».
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-8">
          <CategoryResultsPanel key={category.slug} lockedCategorySlug={category.slug} />
        </div>
      )}
    </div>
  );
}

export default CategoryLanding;

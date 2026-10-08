import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { addFavorite, removeFavorite } from '../services/favoriteService';
import { IconHeart } from './icons';

function FavoriteButton({ listingId, initialFavorited = false, className = '', onChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'client') return;
    if (loading) return;

    setLoading(true);
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    try {
      if (nextState) {
        await addFavorite(listingId);
      } else {
        await removeFavorite(listingId);
      }
      onChange?.(nextState);
    } catch (err) {
      setIsFavorited(!nextState);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role !== 'client') return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`flex items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-white ${className}`}
    >
      <IconHeart
        filled={isFavorited}
        className={`h-4 w-4 ${isFavorited ? 'text-rose-600' : 'text-gray-500'}`}
      />
    </button>
  );
}

export default FavoriteButton;

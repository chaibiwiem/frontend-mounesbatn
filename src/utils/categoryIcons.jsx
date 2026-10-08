import {
  IconBuilding,
  IconSparkles,
  IconConfetti,
  IconCake,
  IconShirt,
  IconCamera,
  IconCar,
  IconMusic,
  IconFlower,
  IconUtensils,
  IconScissors,
  IconDroplet,
  IconMail,
  IconGift,
  IconSuitcase,
  IconBriefcase,
  IconPerfumeBottle,
  IconLotusHands,
} from '../components/icons';

export const CATEGORY_ICONS = {
  building: IconBuilding,
  sparkles: IconSparkles,
  confetti: IconConfetti,
  cake: IconCake,
  shirt: IconShirt,
  camera: IconCamera,
  car: IconCar,
  music: IconMusic,
  flower: IconFlower,
  utensils: IconUtensils,
  scissors: IconScissors,
  droplet: IconDroplet,
  mail: IconMail,
  gift: IconGift,
  suitcase: IconSuitcase,
  briefcase: IconBriefcase,
  perfume: IconPerfumeBottle,
  lotusHands: IconLotusHands,
};

export const DEFAULT_CATEGORY_ICON = IconBuilding;

// Rendu d'icone d'une categorie : prefere le SVG televerse par l'admin
// (cat.iconUrl - CategoryForm.jsx) si present, sinon replie sur l'icone
// predefinie associee au mot-cle cat.icon (CATEGORY_ICONS ci-dessus).
export function CategoryIcon({ category, className = 'h-5 w-5' }) {
  if (category?.iconUrl) {
    return <img src={category.iconUrl} alt="" className={`${className} object-contain`} />;
  }
  const Icon = CATEGORY_ICONS[category?.icon] || DEFAULT_CATEGORY_ICON;
  return <Icon className={className} />;
}

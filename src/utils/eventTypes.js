import {
  IconHeart,
  IconFlower,
  IconSparkles,
  IconCake,
  IconBaby,
  IconGraduationCap,
  IconMusic,
  IconBuilding,
  IconUsers,
  IconMoon,
  IconBriefcase,
  IconDoorOpen,
  IconClipboardCheck,
  IconGlobe,
  IconUser,
  IconCamera,
  IconRing,
} from '../components/icons';

// Icone (composant SVG) par cle - reutilisee par l'affichage public
// (ListingDetail, bandeau "Types d'evenements").
export const EVENT_TYPE_ICONS = {
  heart: IconHeart,
  flower: IconFlower,
  sparkles: IconSparkles,
  cake: IconCake,
  baby: IconBaby,
  graduation: IconGraduationCap,
  music: IconMusic,
  building: IconBuilding,
  users: IconUsers,
  moon: IconMoon,
  briefcase: IconBriefcase,
  door: IconDoorOpen,
  clipboard: IconClipboardCheck,
  globe: IconGlobe,
  user: IconUser,
  camera: IconCamera,
  ring: IconRing,
};

// Taxonomie fixe des types d'evenements Mounesba (liste complete fournie) -
// regroupee par theme, chaque type reference une cle d'EVENT_TYPE_ICONS.
// Stockee cote listing comme simple tableau de cles (Listing.eventTypes,
// JSON) : pas de table de reference dediee, la liste est figee et geree en
// code plutot que via l'admin (contrairement aux categories).
export const EVENT_TYPE_GROUPS = [
  {
    title: 'Célébrations familiales',
    items: [
      { key: 'mariage', label: 'Mariage', icon: 'heart' },
      { key: 'fiancailles', label: 'Fiançailles', icon: 'ring' },
      { key: 'henne', label: 'Henné', icon: 'flower' },
      { key: 'circoncision', label: 'Thour / Circoncision', icon: 'sparkles' },
      { key: 'anniversaire', label: 'Anniversaire', icon: 'cake' },
      { key: 'baby_shower', label: 'Naissance', icon: 'baby' },
      { key: 'aqiqa', label: 'Aqiqa', icon: 'baby' },
    ],
  },
  {
    title: 'Réussite & étapes de vie',
    items: [
      { key: 'reussite', label: 'Fête de réussite', icon: 'graduation' },
    ],
  },
  {
    title: 'Événements sociaux',
    items: [
      { key: 'soiree_privee', label: 'Soirée privée', icon: 'music' },
      { key: 'diner_gala', label: 'Dîner de gala', icon: 'building' },
      { key: 'reunion_famille', label: 'Réunion de famille', icon: 'users' },
      { key: 'iftar', label: 'Iftar / Ftour Ramadan', icon: 'moon' },
    ],
  },
  {
    title: "Événements d'entreprise",
    items: [
      { key: 'seminaire', label: "Séminaire d'entreprise", icon: 'briefcase' },
      { key: 'congres', label: 'Congrès', icon: 'users' },
      { key: 'gala_corporate', label: "Soirée d'entreprise", icon: 'briefcase' },
      { key: 'team_building', label: 'Team building', icon: 'users' },
      { key: 'lancement_produit', label: 'Lancement de produit', icon: 'sparkles' },
      { key: 'inauguration', label: 'Inauguration', icon: 'door' },
      { key: 'salon_pro', label: 'Salon professionnel', icon: 'building' },
      { key: 'assemblee_generale', label: 'Assemblée générale', icon: 'clipboard' },
    ],
  },
  {
    title: 'Formation & Conférences',
    items: [
      { key: 'formation_pro', label: 'Formation professionnelle', icon: 'clipboard' },
      { key: 'atelier', label: 'Atelier / Workshop', icon: 'clipboard' },
      { key: 'conference', label: 'Conférence', icon: 'users' },
      { key: 'webinaire', label: 'Webinaire', icon: 'globe' },
      { key: 'coaching', label: 'Session de coaching', icon: 'user' },
    ],
  },
  {
    title: 'Autres',
    items: [
      { key: 'shooting', label: 'Shooting photo/vidéo', icon: 'camera' },
      { key: 'tournage', label: 'Tournage', icon: 'camera' },
    ],
  },
];

export const ALL_EVENT_TYPES = EVENT_TYPE_GROUPS.flatMap((group) => group.items);

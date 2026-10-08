/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        // Palette de marque "Bleu & Rose" (voir reference fournie) : remplace
        // les palettes "rose" et "blue" natives de Tailwind. Toutes les
        // classes rose-*/blue-* existantes (boutons, liens, badges...)
        // heritent de ces teintes sans avoir a toucher chaque composant.
        // Ancrages exacts de la reference : rose-300 = FFC2D9, rose-600 = FF74B1
        // (couleur principale utilisee sur boutons/liens/logo), blue-200/300/600.
        rose: {
          50: '#FFF5F9',
          100: '#FFEBF3',
          200: '#FFD6E6',
          300: '#FFC2D9',
          400: '#FFB4D0',
          500: '#FFA7C7',
          600: '#FF74B1',
          700: '#FF337D',
          800: '#FF005D',
          900: '#CC004A',
          950: '#990038',
        },
        blue: {
          50: '#F3F8FE',
          100: '#E3F0FD',
          200: '#C2E1FC',
          300: '#96CBFC',
          400: '#7EB6E9',
          500: '#66A0D7',
          600: '#4E8BC4',
          700: '#306391',
          800: '#264E73',
          900: '#1D3C58',
          950: '#132739',
        },
        // Fond "papier" chaleureux (arriere-plan des pages, derriere les
        // cartes blanches) plutot qu'un blanc/gris froid.
        paper: '#F0EEE6',
      },
    },
  },
  plugins: [],
}


import api from './api';

export const getListingVehicles = (listingId) =>
  api.get(`/listings/${listingId}/vehicles`).then((res) => res.data);

const buildFormData = (payload, { keepEmptyStrings = false } = {}) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'image') {
      if (value) formData.append('image', value);
    } else if (value !== undefined && value !== null && (keepEmptyStrings || value !== '')) {
      formData.append(key, value);
    }
  });
  return formData;
};

export const addVehicle = (listingId, payload) =>
  api
    .post(`/listings/${listingId}/vehicles`, buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const updateVehicle = (vehicleId, payload) =>
  api
    .patch(`/vehicles/${vehicleId}`, buildFormData(payload, { keepEmptyStrings: true }), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const deleteVehicle = (vehicleId) => api.delete(`/vehicles/${vehicleId}`).then((res) => res.data);

// Modeles de decoration (photo/nom/prix) proposes par un vehicule - le
// client en choisit un dans un popup dedie (cf. DecorationPickerModal).
export const addVehicleDecoration = (vehicleId, payload) =>
  api
    .post(`/vehicles/${vehicleId}/decorations`, buildFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const updateVehicleDecoration = (decorationId, payload) =>
  api
    .patch(`/vehicle-decorations/${decorationId}`, buildFormData(payload, { keepEmptyStrings: true }), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);

export const deleteVehicleDecoration = (decorationId) =>
  api.delete(`/vehicle-decorations/${decorationId}`).then((res) => res.data);

// Options supplementaires (2eme conducteur, GPS, siege bebe...) proposees par
// un vehicule - le client choisit ses options (et leur quantite) lors de sa
// demande de location (cf. ContactForm).
export const addVehicleOption = (vehicleId, payload) =>
  api.post(`/vehicles/${vehicleId}/options`, payload).then((res) => res.data);

export const updateVehicleOption = (optionId, payload) =>
  api.patch(`/vehicle-options/${optionId}`, payload).then((res) => res.data);

export const deleteVehicleOption = (optionId) =>
  api.delete(`/vehicle-options/${optionId}`).then((res) => res.data);

export const getVehicleBookings = (vehicleId) =>
  api.get(`/vehicles/${vehicleId}/bookings`).then((res) => res.data);

// Toutes les locations de la fiche (tous vehicules confondus), avec les
// memes champs que la demande de location d'origine (passagers/chauffeur/
// decoration via le lead associe) - utilise par l'onglet "Reservations" du
// tableau de bord prestataire pour les fiches Transport.
export const getListingVehicleBookings = (listingId) =>
  api.get(`/listings/${listingId}/vehicle-bookings`).then((res) => res.data);

// Public : periodes deja reservees pour ce vehicule (depart/retour, sans
// donnee client) - permet d'afficher au client les dates indisponibles et de
// bloquer cote front une demande qui chevaucherait une location active.
export const getVehicleReservedPeriods = (vehicleId) =>
  api.get(`/vehicles/${vehicleId}/reserved-periods`).then((res) => res.data);

export const createVehicleBooking = (vehicleId, payload) =>
  api.post(`/vehicles/${vehicleId}/bookings`, payload).then((res) => res.data);

export const updateVehicleBookingStatus = (bookingId, status) =>
  api.patch(`/vehicle_bookings/${bookingId}/status`, { status }).then((res) => res.data);

export const updateVehicleBooking = (bookingId, payload) =>
  api.patch(`/vehicle_bookings/${bookingId}`, payload).then((res) => res.data);

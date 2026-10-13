import api from './api';

export const getListingCalendar = (listingId, from, to) =>
  api.get(`/listings/${listingId}/calendar`, { params: { from, to } }).then((res) => res.data);

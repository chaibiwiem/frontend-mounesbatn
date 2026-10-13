// Les champs DECIMAL Sequelize sont serialises en chaines ("0.00"), donc
// truthy meme a zero - un tarif n'est "defini" que s'il est strictement > 0.
export function hasPositivePrice(value) {
  return Number(value) > 0;
}

// Cout total des options supplementaires choisies (2eme conducteur, GPS,
// siege bebe...) : prix x quantite, multiplie par le nombre de jours si
// pricingType === 'per_day', sinon forfait unique ('flat'). selectedOptions
// est un tableau de {option: VehicleOption, quantity}. Meme regle appliquee
// cote backend (leadController.estimatedLeadAmount).
function computeOptionsAmount(selectedOptions, days) {
  return (selectedOptions || []).reduce((sum, selected) => {
    const price = hasPositivePrice(selected.option?.price) ? Number(selected.option.price) : 0;
    if (!price) return sum;
    const quantity = selected.quantity || 1;
    const unitAmount = selected.option.pricingType === 'flat' ? price : price * days;
    return sum + unitAmount * quantity;
  }, 0);
}

// Calcul du montant estime d'une location de vehicule (prestataires
// Transport) : tarif horaire si la location dure moins de 24h et que le
// prestataire a defini un prix/heure, sinon tarif/jour (toute journee
// entamee compte, jamais 0), plus le prix du modele de decoration choisi
// (decoration = objet VehicleDecoration {name, price, ...} ou null/undefined
// si aucun choisi) et des options supplementaires choisies (selectedOptions).
// Meme regle appliquee cote backend (leadController.estimatedLeadAmount) pour
// l'export Excel.
export function estimateRentalPrice(departureDatetime, returnDatetime, vehicle, decoration = null, selectedOptions = []) {
  if (!departureDatetime || !returnDatetime) return null;

  const departure = new Date(departureDatetime);
  const returnDate = new Date(returnDatetime);
  if (Number.isNaN(departure.getTime()) || Number.isNaN(returnDate.getTime())) return null;

  const diff = returnDate.getTime() - departure.getTime();
  if (diff <= 0) return null;

  const hours = Math.ceil(diff / (60 * 60 * 1000));
  const days = Math.ceil(hours / 24);
  const pricePerHour = hasPositivePrice(vehicle?.pricePerHour) ? Number(vehicle.pricePerHour) : null;
  const pricePerDay = hasPositivePrice(vehicle?.pricePerDay) ? Number(vehicle.pricePerDay) : null;
  const decorationAmount = hasPositivePrice(decoration?.price) ? Number(decoration.price) : 0;
  const optionsAmount = computeOptionsAmount(selectedOptions, days);
  const extrasAmount = decorationAmount + optionsAmount;

  if (hours < 24 && pricePerHour) {
    return {
      amount: Math.round((hours * pricePerHour + extrasAmount) * 100) / 100,
      quantity: hours,
      unit: 'heure',
      rate: pricePerHour,
      decorationAmount,
      optionsAmount,
    };
  }
  if (pricePerDay) {
    return {
      amount: Math.round((days * pricePerDay + extrasAmount) * 100) / 100,
      quantity: days,
      unit: 'jour',
      rate: pricePerDay,
      decorationAmount,
      optionsAmount,
    };
  }
  if (extrasAmount > 0) {
    return { amount: Math.round(extrasAmount * 100) / 100, quantity: 0, unit: null, rate: null, decorationAmount, optionsAmount };
  }
  return null;
}

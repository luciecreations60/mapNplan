const VEHICLE_BASE_CONSUMPTION = Object.freeze({
  city: 5.8,
  compact: 6.5,
  sedan: 7.2,
  suv: 8.8,
  van: 10.2,
});

const FUEL_FACTORS = Object.freeze({
  petrol: 1,
  diesel: 0.9,
  hybrid: 0.72,
});

export function getSuggestedConsumption(vehicleType = 'compact', fuelType = 'petrol') {
  const base = VEHICLE_BASE_CONSUMPTION[vehicleType] ?? VEHICLE_BASE_CONSUMPTION.compact;
  const factor = FUEL_FACTORS[fuelType] ?? 1;
  return Math.round(base * factor * 10) / 10;
}

export function estimateDrivingCost({ distanceKm, consumptionLPer100Km, fuelPricePerLiter, tolls = 0 }) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const consumption = Math.max(0, Number(consumptionLPer100Km) || 0);
  const fuelPrice = Math.max(0, Number(fuelPricePerLiter) || 0);
  const tollAmount = Math.max(0, Number(tolls) || 0);
  const fuelLiters = (distance / 100) * consumption;
  const fuelCost = fuelLiters * fuelPrice;
  return {
    distanceKm: Math.round(distance * 10) / 10,
    fuelLiters: Math.round(fuelLiters * 10) / 10,
    fuelCost: Math.round(fuelCost * 100) / 100,
    tolls: Math.round(tollAmount * 100) / 100,
    total: Math.round((fuelCost + tollAmount) * 100) / 100,
  };
}

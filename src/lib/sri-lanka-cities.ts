export type CityPoint = {
  name: string;
  lat: number;
  lng: number;
};

export const SRI_LANKA_CITIES: CityPoint[] = [
  { name: "Colombo", lat: 6.9271, lng: 79.8612 },
  { name: "Kandy", lat: 7.2906, lng: 80.6337 },
  { name: "Galle", lat: 6.0535, lng: 80.221 },
  { name: "Matara", lat: 5.9497, lng: 80.5353 },
  { name: "Jaffna", lat: 9.6615, lng: 80.0255 },
  { name: "Negombo", lat: 7.2083, lng: 79.8358 },
  { name: "Kurunegala", lat: 7.4863, lng: 80.3623 },
  { name: "Anuradhapura", lat: 8.3114, lng: 80.4037 },
  { name: "Trincomalee", lat: 8.5874, lng: 81.2152 },
  { name: "Batticaloa", lat: 7.7102, lng: 81.6924 },
  { name: "Badulla", lat: 6.9934, lng: 81.055 },
  { name: "Nuwara Eliya", lat: 6.9497, lng: 80.7891 },
  { name: "Ella", lat: 6.8667, lng: 81.0466 },
  { name: "Ratnapura", lat: 6.6828, lng: 80.3992 },
  { name: "Kalutara", lat: 6.5854, lng: 79.9607 },
  { name: "Panadura", lat: 6.7132, lng: 79.9026 },
  { name: "Puttalam", lat: 8.0362, lng: 79.8283 },
  { name: "Chilaw", lat: 7.5758, lng: 79.7953 },
  { name: "Hambantota", lat: 6.1241, lng: 81.1185 },
  { name: "Dambulla", lat: 7.8742, lng: 80.6511 },
];

export function normalizeCityName(value: string): string {
  return value.trim().toLowerCase();
}

export function findCityByName(name: string): CityPoint | null {
  const normalized = normalizeCityName(name);
  return SRI_LANKA_CITIES.find((city) => normalizeCityName(city.name) === normalized) ?? null;
}

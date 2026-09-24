// Sample data for `npm run seed`. Every seed account uses the SEED_DOMAIN email domain
// so the seed script can find and replace its own data without touching real users.

const SEED_DOMAIN = "seed.pawshare.test";
const SEED_PASSWORD = "PawShare@123";

const point = (lng, lat) => ({ type: "Point", coordinates: [lng, lat] });

// Placeholder photos until image uploads exist; `lock` keeps each animal's image stable.
const photo = (species, lock) => ({
  url: `https://loremflickr.com/640/480/${species}?lock=${lock}`,
});

const CITIES = {
  bengaluru: { city: "Bengaluru", state: "Karnataka", lng: 77.5946, lat: 12.9716 },
  hyderabad: { city: "Hyderabad", state: "Telangana", lng: 78.4867, lat: 17.385 },
  chennai: { city: "Chennai", state: "Tamil Nadu", lng: 80.2707, lat: 13.0827 },
  pune: { city: "Pune", state: "Maharashtra", lng: 73.8567, lat: 18.5204 },
};

const locationFor = (cityKey, dLng = 0, dLat = 0) => {
  const c = CITIES[cityKey];
  return {
    city: c.city,
    state: c.state,
    country: "India",
    coordinates: point(+(c.lng + dLng).toFixed(4), +(c.lat + dLat).toFixed(4)),
  };
};

const shelters = [
  {
    key: "bengaluru",
    name: "Namma Paws Rescue",
    phone: "9845012345",
    registrationNumber: "AWBI/KA/2019/0142",
    about: "Volunteer-run rescue in Indiranagar focused on street dogs and senior pets.",
    website: "https://example.org/namma-paws",
  },
  {
    key: "hyderabad",
    name: "Deccan Animal Shelter",
    phone: "9848022334",
    registrationNumber: "AWBI/TS/2016/0087",
    about: "Shelter and clinic in Gachibowli caring for dogs, cats and rabbits.",
    website: "https://example.org/deccan-shelter",
  },
  {
    key: "chennai",
    name: "Marina Friends of Animals",
    phone: "9840033445",
    registrationNumber: "AWBI/TN/2014/0033",
    about: "Foster network across Chennai, specialising in kittens and puppies.",
    website: "https://example.org/marina-foa",
  },
  {
    key: "pune",
    name: "Sahyadri Strays Trust",
    phone: "9822044556",
    registrationNumber: "AWBI/MH/2018/0210",
    about: "Rescue and rehabilitation centre near Kothrud with a large foster community.",
    website: "https://example.org/sahyadri-strays",
  },
];

const admin = { name: "PawShare Admin", localPart: "admin" };

// Demo adopter; the "adopted" animals below are adopted by this account.
const adopter = {
  name: "Demo Adopter",
  localPart: "adopter",
  phone: "9000000001",
  cityKey: "hyderabad",
};

// ageMonths → ageGroup: baby < 12, young < 36, adult < 96, senior 96+
const animals = [
  // Bengaluru
  { shelter: "bengaluru", name: "Bruno", species: "dog", breed: "Indie", ageMonths: 30, gender: "male", size: "medium", color: "brown", listingType: "adoption", temperament: ["friendly", "energetic", "good-with-kids"], health: "Vaccinated (DHPPi + rabies), dewormed", vaccinated: true, neutered: true, offset: [0.02, 0.01] },
  { shelter: "bengaluru", name: "Mishti", species: "cat", breed: "Indian Domestic", ageMonths: 5, gender: "female", size: "small", color: "calico", listingType: "both", temperament: ["playful", "curious"], health: "First vaccine done, second due next month", vaccinated: false, neutered: false, offset: [-0.01, 0.02] },
  { shelter: "bengaluru", name: "Raja", species: "dog", breed: "Labrador Retriever", ageMonths: 110, gender: "male", size: "large", color: "yellow", listingType: "adoption", temperament: ["calm", "gentle", "good-with-kids"], health: "Senior health check done; mild arthritis, on joint supplements", vaccinated: true, neutered: true, offset: [0.03, -0.02] },
  { shelter: "bengaluru", name: "Kaju", species: "rabbit", breed: "Dutch", ageMonths: 14, gender: "male", size: "small", color: "black and white", listingType: "foster", temperament: ["shy", "gentle"], health: "Healthy; teeth checked", vaccinated: false, neutered: true, offset: [-0.02, -0.01] },
  { shelter: "bengaluru", name: "Tara", species: "dog", breed: "Beagle", ageMonths: 48, gender: "female", size: "medium", color: "tricolour", listingType: "adoption", status: "adopted", adoptedBy: "adopter", temperament: ["friendly", "vocal"], health: "Vaccinated, spayed", vaccinated: true, neutered: true, offset: [0.01, 0.03] },

  // Hyderabad
  { shelter: "hyderabad", name: "Simba", species: "cat", breed: "Persian", ageMonths: 36, gender: "male", size: "medium", color: "white", listingType: "adoption", temperament: ["calm", "affectionate", "indoor"], health: "Vaccinated, neutered; needs regular grooming", vaccinated: true, neutered: true, offset: [0.01, 0.01] },
  { shelter: "hyderabad", name: "Chintu", species: "dog", breed: "Indie", ageMonths: 3, gender: "male", size: "small", color: "black", listingType: "foster", temperament: ["playful", "energetic"], health: "First vaccine done, dewormed", vaccinated: false, neutered: false, offset: [-0.03, 0.02] },
  { shelter: "hyderabad", name: "Gauri", species: "dog", breed: "German Shepherd", ageMonths: 60, gender: "female", size: "large", color: "black and tan", listingType: "adoption", temperament: ["loyal", "protective", "trained"], health: "Vaccinated, spayed; hip X-ray normal", vaccinated: true, neutered: true, offset: [0.04, -0.01] },
  { shelter: "hyderabad", name: "Mittu", species: "rabbit", breed: "New Zealand White", ageMonths: 8, gender: "female", size: "small", color: "white", listingType: "both", temperament: ["curious", "gentle"], health: "Healthy; diet of hay and greens", vaccinated: false, neutered: false, offset: [-0.01, -0.03] },
  { shelter: "hyderabad", name: "Rocky", species: "dog", breed: "Rottweiler", ageMonths: 84, gender: "male", size: "xlarge", color: "black and tan", listingType: "adoption", temperament: ["calm", "loyal"], health: "Vaccinated, neutered; on a weight-management diet", vaccinated: true, neutered: true, offset: [0.02, 0.04] },

  // Chennai
  { shelter: "chennai", name: "Pinky", species: "cat", breed: "Indian Domestic", ageMonths: 2, gender: "female", size: "small", color: "orange tabby", listingType: "foster", temperament: ["playful", "vocal"], health: "Bottle-weaned, dewormed; vaccines start next week", vaccinated: false, neutered: false, offset: [0.01, -0.01] },
  { shelter: "chennai", name: "Karuppu", species: "dog", breed: "Rajapalayam", ageMonths: 26, gender: "male", size: "large", color: "white", listingType: "adoption", temperament: ["loyal", "independent"], health: "Vaccinated, neutered", vaccinated: true, neutered: true, offset: [-0.02, 0.02] },
  { shelter: "chennai", name: "Lucky", species: "dog", breed: "Indie", ageMonths: 100, gender: "female", size: "medium", color: "fawn", listingType: "both", temperament: ["gentle", "calm", "good-with-cats"], health: "Senior check-up done; cataract in left eye", vaccinated: true, neutered: true, offset: [0.03, 0.01] },
  { shelter: "chennai", name: "Snowy", species: "cat", breed: "Siamese", ageMonths: 20, gender: "male", size: "small", color: "seal point", listingType: "adoption", status: "adopted", adoptedBy: "adopter", temperament: ["affectionate", "vocal"], health: "Vaccinated, neutered", vaccinated: true, neutered: true, offset: [-0.01, -0.02] },

  // Pune
  { shelter: "pune", name: "Motu", species: "dog", breed: "Pug", ageMonths: 72, gender: "male", size: "small", color: "fawn", listingType: "adoption", temperament: ["friendly", "lazy", "good-with-kids"], health: "Vaccinated, neutered; monitor breathing in heat", vaccinated: true, neutered: true, offset: [0.01, 0.02] },
  { shelter: "pune", name: "Chiku", species: "rabbit", breed: "Lionhead", ageMonths: 30, gender: "female", size: "small", color: "grey", listingType: "adoption", temperament: ["shy", "gentle", "indoor"], health: "Healthy; spayed", vaccinated: false, neutered: true, offset: [-0.02, 0.01] },
  { shelter: "pune", name: "Sheru", species: "dog", breed: "Indie", ageMonths: 9, gender: "male", size: "medium", color: "tan", listingType: "both", temperament: ["energetic", "playful", "good-with-dogs"], health: "Vaccinated, dewormed", vaccinated: true, neutered: false, offset: [0.03, -0.03] },
  { shelter: "pune", name: "Billo", species: "cat", breed: "Bombay", ageMonths: 130, gender: "female", size: "small", color: "black", listingType: "foster", temperament: ["calm", "independent"], health: "Senior; kidney values borderline, on renal diet", vaccinated: true, neutered: true, offset: [-0.01, -0.01] },
];

module.exports = {
  SEED_DOMAIN,
  SEED_PASSWORD,
  CITIES,
  locationFor,
  photo,
  shelters,
  admin,
  adopter,
  animals,
};

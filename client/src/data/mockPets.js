// The 9 pets from design/neighborhood-reference.html plus 4 birds, in the frontend pet shape (see CLAUDE.md).
// house is derived from species (houseTypeFor) and map positions come from the Neighborhood lot layout.
export const mockPets = [
  {
    id: 'biscuit', name: 'Biscuit', species: 'dog', status: 'available', age: '2 yrs', breed: 'Golden Retriever', sex: 'Male', size: 'Medium', shelter: 'Happy Tails Shelter', area: 'Koramangala', vax: 'Up to date',
    tags: ['Loves fetch', 'Good with kids', 'House-trained'],
    blurb: 'Biscuit follows his nose everywhere and will sit for a single treat. He does best with a family that walks him twice a day.',
    colors: { fur: '#E8B77A', dark: '#9A6A3C', bg: '#FFE8C7' },
    photoUrl: '/demo-pets/biscuit.jpg',
  },
  {
    id: 'mochi', name: 'Mochi', species: 'cat', status: 'urgent', age: '8 mos', breed: 'Indie (domestic short-hair)', sex: 'Female', size: 'Small', shelter: 'Whisker Walk Rescue', area: 'Indiranagar', vax: '1st dose done',
    tags: ['Lap cat', 'Shy at first', 'Indoor only'],
    blurb: 'Mochi was found in a parking lot during the monsoon. Her foster family is moving out soon, so she needs a new home quickly.',
    colors: { fur: '#F4F1EC', dark: '#C9C1B5', bg: '#E7DEFA' },
    photoUrl: '/demo-pets/mochi.jpg',
  },
  {
    id: 'clover', name: 'Clover', species: 'bunny', status: 'available', age: '1 yr', breed: 'Dutch rabbit', sex: 'Female', size: 'Small', shelter: 'Happy Tails Shelter', area: 'Koramangala', vax: 'Not required',
    tags: ['Litter-trained', 'Quiet', 'Likes coriander'],
    blurb: 'Clover spends her mornings doing laps and her afternoons asleep in a cardboard box. Apartment-friendly.',
    colors: { fur: '#FFFFFF', dark: '#7B6F8F', bg: '#DDF2E4' },
    photoUrl: '/demo-pets/clover.jpg',
  },
  {
    id: 'pepper', name: 'Pepper', species: 'dog', status: 'pending', age: '4 yrs', breed: 'Labrador mix', sex: 'Female', size: 'Medium', shelter: 'Stray Hearts Trust', area: 'HSR Layout', vax: 'Up to date',
    tags: ['Calm', 'Leash-trained', 'Spayed'],
    blurb: 'Pepper already has an application in review. You can still favorite her in case it falls through.',
    colors: { fur: '#4A3F45', dark: '#2A2328', bg: '#FFE1EA' },
    photoUrl: '/demo-pets/pepper.jpg',
  },
  {
    id: 'luna', name: 'Luna', species: 'cat', status: 'available', age: '4 mos', breed: 'Grey British Shorthair mix', sex: 'Female', size: 'Small', shelter: 'Whisker Walk Rescue', area: 'Indiranagar', vax: 'Up to date',
    tags: ['Playful', 'Curious', 'Indoor only'],
    blurb: 'Luna is a grey kitten who investigates every bag and box that comes into the house, then naps on top of it.',
    colors: { fur: '#B9B3C9', dark: '#8C84A3', bg: '#FFF3D6' },
    photoUrl: '/demo-pets/luna.jpg',
  },
  {
    id: 'rocky', name: 'Rocky', species: 'dog', status: 'urgent', age: '9 yrs', breed: 'Golden Retriever', sex: 'Male', size: 'Large', shelter: 'Stray Hearts Trust', area: 'HSR Layout', vax: 'Up to date',
    tags: ['Senior', 'Arthritis meds', 'Very gentle'],
    blurb: 'Rocky was surrendered when his family moved abroad. He needs a ground-floor foster while the shelter is full.',
    colors: { fur: '#F2D089', dark: '#C99A45', bg: '#DDF2E4' },
    photoUrl: '/demo-pets/rocky.jpg',
  },
  {
    id: 'tofu', name: 'Tofu', species: 'hamster', status: 'pending', age: '6 mos', breed: 'Dwarf hamster', sex: 'Male', size: 'Small', shelter: 'Happy Tails Shelter', area: 'Koramangala', vax: 'Not required',
    tags: ['Playful', 'Chews cables', 'Neutered'],
    blurb: 'Tofu is tiny and busy. Keep cables away from his cage, because he will find them.',
    colors: { fur: '#EFE4D3', dark: '#B79E7E', bg: '#FFE1EA' },
    photoUrl: '/demo-pets/tofu.jpg',
  },
  {
    id: 'sushi', name: 'Sushi', species: 'cat', status: 'available', age: '2 yrs', breed: 'Ginger Persian mix', sex: 'Female', size: 'Small', shelter: 'Whisker Walk Rescue', area: 'Indiranagar', vax: 'Up to date',
    tags: ['Chatty', 'Good with cats', 'Spayed'],
    blurb: 'Sushi has a long ginger coat that needs brushing a few times a week. She shares her space well with other cats.',
    colors: { fur: '#F7E7CF', dark: '#D08A47', bg: '#E7DEFA' },
    photoUrl: '/demo-pets/sushi.jpg',
  },
  {
    id: 'peanut', name: 'Peanut', species: 'hamster', status: 'available', age: '1 yr', breed: 'Syrian hamster', sex: 'Male', size: 'Small', shelter: 'Stray Hearts Trust', area: 'HSR Layout', vax: 'Not required',
    tags: ['Night owl', 'Lives solo', 'Cheek stuffer'],
    blurb: 'Peanut is a Syrian hamster, so he lives on his own. He wakes up in the evening and runs laps on his wheel.',
    colors: { fur: '#F3DEC0', dark: '#A26A3B', bg: '#FFF3D6' },
    photoUrl: '/demo-pets/peanut.jpg',
  },
  // the birds (Session 23): with 13 pets the map has a second street
  {
    id: 'mango', name: 'Mango', species: 'bird', status: 'available', age: '7 yrs', breed: 'Blue-and-gold macaw', sex: 'Male', size: 'Large', shelter: 'Bengaluru Paws Collective', area: 'Bengaluru', vax: 'Not required',
    tags: ['Talkative', 'Needs big aviary', 'Experienced owner', 'Registered exotic species'],
    blurb: 'Mango says hello to everyone who walks in and has learned to copy the kettle. He needs a big aviary and an owner who has kept large parrots before.',
    colors: { fur: '#8FC3F0', dark: '#3F3A4A', bg: '#FFE8C7' },
    photoUrl: '/demo-pets/mango.jpg',
  },
  {
    id: 'kiwi', name: 'Kiwi', species: 'bird', status: 'available', age: '1.5 yrs', breed: 'Budgie', sex: 'Female', size: 'Small', shelter: 'Bengaluru Paws Collective', area: 'Bengaluru', vax: 'Not required',
    tags: ['Gentle', 'Good for beginners'],
    blurb: 'Kiwi chirps along to the radio and steps onto a finger without any fuss. A lovely first bird for a calm home.',
    colors: { fur: '#F4F1EC', dark: '#E8A94A', bg: '#DDF2E4', cheek: '#6E7FD6' },
    photoUrl: '/demo-pets/kiwi.jpg',
  },
  {
    id: 'pearl', name: 'Pearl', species: 'bird', status: 'pending', age: '6 yrs', breed: 'Umbrella cockatoo', sex: 'Female', size: 'Medium', shelter: 'Happy Tails Shelter', area: 'Koramangala', vax: 'Not required',
    tags: ['Very social', 'Loud', 'Needs daily attention', 'Registered exotic species'],
    blurb: 'Pearl raises her crest and calls out whenever someone she knows comes home. She loves company and already has an application in review.',
    colors: { fur: '#FFFFFF', dark: '#3F3A4A', bg: '#E7DEFA' },
    crest: true,
    photoUrl: '/demo-pets/pearl.jpg',
  },
  {
    id: 'sunny', name: 'Sunny', species: 'bird', status: 'urgent', age: '1 yr', breed: 'Cockatiel', sex: 'Male', size: 'Small', shelter: 'Bengaluru Paws Collective', area: 'Bengaluru', vax: 'Not required',
    tags: ['Whistles', 'Hand-tame'],
    blurb: 'Sunny whistles a full tune before breakfast and is happy riding on a shoulder. His foster home fell through, so he needs somewhere safe to stay soon.',
    colors: { fur: '#F7DE7A', dark: '#C9A391', bg: '#FFE1EA', cheek: '#F28A3C' },
    crest: true,
    photoUrl: '/demo-pets/sunny.jpg',
  },
]

export default mockPets

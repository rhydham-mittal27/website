// Placeholder project content: swap in the client's real figures before launch.
// v2: a single 62-floor tower on a 4-acre site (from merged.mp4).
export const residences = [
  {
    name: '3 BHK Residence',
    size: '2,150 sq ft',
    levels: 'Levels 8 to 30',
    price: 'From ₹3.9 Cr',
    note: 'Corner living room with windows on two sides and a deep balcony off the master bedroom.',
    image: '/stills/s_2_4.jpg',
  },
  {
    name: '4 BHK Residence',
    size: '2,980 sq ft',
    levels: 'Levels 12 to 48',
    price: 'From ₹5.8 Cr',
    note: 'A separate family lounge, staff room with its own entrance, and a 30 ft balcony facing the hills.',
    image: '/stills/s_0_4.jpg',
  },
  {
    name: 'Sky Villa',
    size: '5,200 sq ft',
    levels: 'Levels 50 to 58',
    price: 'From ₹11.5 Cr',
    note: 'Two homes per floor, each with a double-height living room and a terrace that wraps the corner.',
    image: '/stills/s_4_4.jpg',
  },
  {
    name: 'Crown Penthouse',
    size: '9,800 sq ft',
    levels: 'Level 62',
    price: 'Price on request',
    note: 'The only home under the glass crown, with a private pool and views on all four sides.',
    image: '/stills/s_9_0.jpg',
  },
]

// `range` is in floor levels and drives the highlight band on the 3D tower.
export const levels = [
  {
    level: 'G',
    name: 'Arrival court',
    text: 'A gold-columned porte-cochère beside a 60-metre reflecting pool, with a triple-height glass lobby behind it.',
    range: [0, 1.4],
  },
  {
    level: 'P1 to P4',
    name: 'Podium club',
    text: 'Clubhouse, 25-metre lap pool, gym, spa and a children’s garden on the planted podium roof.',
    range: [1.4, 5],
  },
  {
    level: '8 to 48',
    name: 'Residences',
    text: 'Four homes per floor around a central core, so every home has a corner living room and light from two sides.',
    range: [8, 48],
  },
  {
    level: '50 to 58',
    name: 'Sky villas',
    text: 'Two homes per floor with double-height living rooms and terraces that wrap the corner of the tower.',
    range: [50, 58],
  },
  {
    level: '60',
    name: 'The sky deck',
    text: 'A glass-edged terrace around the whole floor, with a residents’ lounge, an observatory and a private dining room.',
    range: [59.4, 60.8],
  },
  {
    level: '62',
    name: 'The crown',
    text: 'A single penthouse under the glass crown, with a private pool and views on all four sides.',
    range: [61, 63.5],
  },
]

export const gallery = [
  { src: '/stills/s_0_4.jpg', caption: 'The tower at dusk, from the valley', short: 'Dusk over the valley' },
  { src: '/stills/s_2_4.jpg', caption: 'First light on the eastern façade', short: 'First light' },
  { src: '/stills/s_4_4.jpg', caption: 'The glass lobby and the residents’ crest', short: 'The lobby' },
  { src: '/stills/s_5_6.jpg', caption: 'The reflecting pool and porte-cochère', short: 'Arrival court' },
  { src: '/stills/s_9_0.jpg', caption: 'Sunset from the sky deck, level 60', short: 'Sky deck, level 60' },
]

export const places = [
  { name: 'International airport', time: '35 min' },
  { name: 'Central business district', time: '18 min' },
  { name: 'Metro station, Line 2', time: '6 min walk' },
  { name: 'International school campus', time: '9 min' },
  { name: 'Multi-speciality hospital', time: '12 min' },
  { name: 'Hill trailheads', time: '25 min' },
]

// Placeholder amenities, specifications and developer details: replace with the client's.
export const amenities = [
  {
    group: 'Wellness',
    where: 'Podium level, beside the gardens',
    items: [
      { name: '25 m lap pool', detail: 'Temperature controlled, with a shallow children’s pool' },
      { name: 'Spa', detail: 'Steam, sauna and two treatment rooms' },
      { name: 'Gym', detail: 'Strength and cardio floors with a studio for yoga' },
      { name: 'Jogging track', detail: '400 m around the podium gardens' },
    ],
  },
  {
    group: 'Club',
    where: 'Podium and the sky deck, level 60',
    items: [
      { name: 'Residents’ lounge', detail: 'On the sky deck, open until midnight' },
      { name: 'Private dining room', detail: 'Seats twelve, bookable with a chef' },
      { name: 'Screening room', detail: '18 seats with a full sound system' },
      { name: 'Business centre', detail: 'Meeting rooms and quiet work booths' },
    ],
  },
  {
    group: 'Family',
    where: 'Podium level',
    items: [
      { name: 'Children’s garden', detail: 'Shaded play area within sight of the lounge' },
      { name: 'Indoor play room', detail: 'For the monsoon months' },
      { name: 'Pet park', detail: 'Fenced, with a wash station' },
      { name: 'Party lawn', detail: 'For up to 150 guests' },
    ],
  },
  {
    group: 'Services',
    where: 'Throughout the building',
    items: [
      { name: 'Concierge', detail: 'At the lobby round the clock' },
      { name: 'Valet parking', detail: 'At the porte-cochère' },
      { name: 'Three-tier security', detail: 'Gate, lobby and floor access by card' },
      { name: 'Full power backup', detail: 'For every home and common area' },
    ],
  },
]

export const specs = [
  { label: 'Structure', value: 'RCC frame, designed for seismic zone IV' },
  { label: 'Floor-to-ceiling height', value: '3.3 m in residences, 6.6 m in sky villas' },
  { label: 'Flooring', value: 'Italian marble in living areas, engineered wood in bedrooms' },
  { label: 'Windows', value: 'Double-glazed, full-height, with bronze-tinted frames' },
  { label: 'Kitchen', value: 'Modular, with built-in appliances and a separate utility' },
  { label: 'Bathrooms', value: 'Imported fittings and a rain shower in every bathroom' },
  { label: 'Lifts', value: 'Four high-speed passenger lifts and a service lift' },
  { label: 'Parking', value: 'Three covered spaces per home, with EV charging' },
]

export const developer = {
  name: 'Meridian Developers',
  text: 'Twenty-two years of residential projects across the city, every one handed over with its occupancy certificate.',
  facts: [
    { value: '22', label: 'years building homes' },
    { value: '14', label: 'projects handed over' },
    { value: '3,800', label: 'families living in them' },
  ],
  past: [
    { name: 'The Willows', meta: 'Hill Road, completed 2021' },
    { name: 'Harbour Point', meta: 'Bay Front, completed 2018' },
    { name: 'Cedar Court', meta: 'Sector 9, completed 2015' },
  ],
}

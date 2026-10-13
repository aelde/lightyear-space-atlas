// Approximate distances from Earth, ordered for exploration; not a straight flight path.
// English display copy with the same data and source references as landmarks.js.
export const landmarksEn = [
  {
    id: 'oort',
    name: 'Oort Cloud',
    thaiName: 'The outer reaches of our Solar System',
    distance: 1,
    distanceLabel: 'About 1 light-year',
    category: 'region',
    chapter: 'near',
    kicker: 'A hypothesized region of icy bodies',
    description: 'At 1 light-year from Earth, we may still be within the Oort Cloud, a reservoir of icy bodies and comets thought to surround our Solar System. Its boundaries are uncertain and it has never been directly imaged; objects are so sparse that this is no wall of rocks or dense fog.',
    fact: 'The Oort Cloud is inferred from astronomical evidence and has not been directly imaged.',
    sources: [
      { title: 'NASA · Oort Cloud Facts', url: 'https://science.nasa.gov/solar-system/oort-cloud/facts/' },
      { title: 'NASA · Solar System Facts', url: 'https://science.nasa.gov/solar-system/solar-system-facts/' }
    ],
    color: '#a6c8e8'
  },
  {
    id: 'interstellar',
    name: 'Interstellar Space',
    thaiName: 'Between the stars',
    distance: 2.5,
    distanceLabel: 'About 2–3 light-years',
    category: 'region',
    chapter: 'near',
    kicker: 'The sparse space between stars',
    description: 'At 2–3 light-years from Earth, we have not yet reached the nearest other star and are generally exploring sparse interstellar space. This is an inference from the distances of nearby stars, rather than a promise of a new landmark every light-year.',
    fact: 'The nearest other star is still about 4.2 light-years away.',
    sources: [
      { title: 'NASA · Our Nearest Celestial Neighbor', url: 'https://science.nasa.gov/exoplanets/other-stars-other-worlds/our-nearest-celestial-neighbor-an-exotic-3-star-system/' }
    ],
    color: '#9aabe4'
  },
  {
    id: 'centauri',
    name: 'Proxima & Alpha Centauri',
    thaiName: 'Our nearest stellar neighbors',
    distance: 4.24,
    distanceLabel: 'About 4.24–4.37 light-years',
    category: 'star',
    chapter: 'near',
    kicker: 'The nearest neighboring star system',
    description: 'Proxima Centauri is a red dwarf about 4.24 light-years away, making it the closest other star to the Sun. Alpha Centauri A and B form a binary pair in the same system at about 4.37 light-years, but the three stars are far more separated than the illustration suggests.',
    fact: 'The explorer’s 4.24-light-year distance refers to Proxima Centauri.',
    sources: [
      { title: 'NASA NTRS · Alpha Centauri', url: 'https://ntrs.nasa.gov/api/citations/20170005527/downloads/20170005527.pdf?attachment=true' },
      { title: 'NASA · Our Nearest Celestial Neighbor', url: 'https://science.nasa.gov/exoplanets/other-stars-other-worlds/our-nearest-celestial-neighbor-an-exotic-3-star-system/' }
    ],
    color: '#f0b683'
  },
  {
    id: 'barnard',
    name: 'Barnard’s Star',
    thaiName: 'A nearby red dwarf',
    distance: 6,
    distanceLabel: 'About 6 light-years',
    category: 'star',
    chapter: 'near',
    kicker: 'Red dwarf',
    description: 'Barnard’s Star is a red dwarf in the Sun’s neighborhood, about 6 light-years away. This is its distance from Earth; reaching it also requires traveling in the star’s particular direction.',
    fact: 'NASA lists a distance of 5.97 light-years, rounded here to about 6.',
    sources: [
      { title: 'NASA · The Solar Neighborhood', url: 'https://imagine.gsfc.nasa.gov/features/cosmic/solar_neighborhood_info.html' }
    ],
    color: '#ed937f'
  },
  {
    id: 'luhman',
    name: 'Luhman 16',
    thaiName: 'A pair of brown dwarfs',
    distance: 6.5,
    distanceLabel: 'About 6.5 light-years',
    category: 'star',
    chapter: 'near',
    kicker: 'Brown dwarf binary',
    description: 'Luhman 16 is a binary system of brown dwarfs about 6.5 light-years from Earth. The illustration enlarges both objects to show the kind of destination we are exploring, rather than their actual size or brightness through a spacecraft window.',
    fact: 'This destination consists of two brown dwarfs.',
    sources: [
      { title: 'ESO · Luhman 16 Paper Model', url: 'https://www.hq.eso.org/public/products/papermodels/papermodel_0004/' },
      { title: 'ESO · Weather Map of a Brown Dwarf', url: 'https://www.eso.org/public/news/eso1404/' }
    ],
    color: '#cc8c68'
  },
  {
    id: 'sirius',
    name: 'Sirius A / B',
    thaiName: 'A bright star and its compact companion',
    distance: 8.6,
    distanceLabel: 'About 8.6 light-years',
    category: 'star',
    chapter: 'near',
    kicker: 'A bright star and a white dwarf',
    description: 'The Sirius system lies about 8.6 light-years away and contains the bright star Sirius A and the white dwarf Sirius B. This binary is another destination in our stellar neighborhood, but it does not lie beyond Centauri on a single straight flight path.',
    fact: 'Sirius A and B are different types of objects in one binary system.',
    sources: [
      { title: 'NASA · The Solar Neighborhood', url: 'https://imagine.gsfc.nasa.gov/features/cosmic/solar_neighborhood_info.html' }
    ],
    color: '#a2d4ff'
  },
  {
    id: 'vega',
    name: 'Vega',
    thaiName: 'A nearby blue-white star',
    distance: 25,
    distanceLabel: 'About 25 light-years',
    category: 'star',
    chapter: 'far',
    kicker: 'Blue-white star',
    description: 'Vega is a blue-white star about 25 light-years from Earth. As we explore beyond our closest stellar neighbors, distances grow from a few light-years to tens of light-years.',
    fact: '25 light-years is a distance, not a travel time shared by every spacecraft.',
    sources: [
      { title: 'NASA · DART Captures Vega', url: 'https://www.nasa.gov/missions/dart/nasas-dart-captures-one-of-night-skys-brightest-stars/' }
    ],
    color: '#c4e2ff'
  },
  {
    id: 'pleiades',
    name: 'Pleiades',
    thaiName: 'A gathering of stars',
    distance: 440,
    distanceLabel: 'About 440 light-years',
    category: 'cluster',
    chapter: 'far',
    kicker: 'Star cluster',
    description: 'The Pleiades shifts our exploration from individual stars to a group of stars gathered together. We use an approximate distance of 440 light-years to convey how far this cluster lies from Earth.',
    fact: 'This is an approximate distance to the cluster, not a waypoint on every spacecraft’s route.',
    sources: [
      { title: 'NASA · Hyades and Pleiades', url: 'https://science.nasa.gov/solar-system/skywatching/night-sky-network/spot-the-young-stars-of-the-hyades-and-pleiades/' }
    ],
    color: '#83b9f0'
  },
  {
    id: 'orion',
    name: 'Orion Nebula',
    thaiName: 'A stellar nursery',
    distance: 1300,
    distanceLabel: 'About 1,300 light-years',
    category: 'nebula',
    chapter: 'far',
    kicker: 'Star-forming region',
    description: 'The Orion Nebula is a star-forming region about 1,300 light-years from Earth. The illustration’s colors and brightness help convey its nature, but do not guarantee equally vivid colors to the naked eye.',
    fact: 'This destination is a region where stars form, rather than a single star.',
    sources: [
      { title: 'NASA · The Universe Through Orion', url: 'https://science.nasa.gov/universe/stories/quick-reads/discovering-the-universe-through-the-constellation-orion/' }
    ],
    color: '#d99cb9'
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius A*',
    thaiName: 'At the heart of the Milky Way',
    distance: 26000,
    distanceLabel: 'About 26,000 light-years',
    category: 'blackhole',
    chapter: 'far',
    kicker: 'Supermassive black hole',
    description: 'Sagittarius A* is the supermassive black hole at the center of the Milky Way, about 26,000 light-years from Earth. The explorer presents a conceptual visualization, rather than an actual photograph of this black hole.',
    fact: 'This is the scale of the distance to our galaxy’s center.',
    sources: [
      { title: 'NASA JPL · Milky Way’s Black Hole', url: 'https://www.jpl.nasa.gov/edu/resources/teachable-moment/telescopes-get-extraordinary-view-of-milky-ways-black-hole/' }
    ],
    color: '#e9ad72'
  },
  {
    id: 'lmc',
    name: 'Large Magellanic Cloud',
    thaiName: 'A satellite of the Milky Way',
    distance: 160000,
    distanceLabel: 'About 160,000 light-years',
    category: 'galaxy',
    chapter: 'far',
    kicker: 'Milky Way satellite galaxy',
    description: 'The Large Magellanic Cloud is a satellite galaxy of the Milky Way, about 160,000 light-years away. This destination takes us into a neighboring galaxy much closer than Andromeda.',
    fact: 'It is a satellite galaxy, with an irregular form rather than Andromeda’s spiral structure.',
    sources: [
      { title: 'NASA · Hubble Uncovers a Celestial Fossil', url: 'https://science.nasa.gov/image-detail/hubble-uncovers-a-celestial-fossil-2/' }
    ],
    color: '#83c1cc'
  },
  {
    id: 'andromeda',
    name: 'Andromeda',
    thaiName: 'A major neighboring galaxy',
    distance: 2500000,
    distanceLabel: 'About 2.5 million light-years',
    category: 'galaxy',
    chapter: 'far',
    kicker: 'Major neighboring galaxy',
    description: 'Andromeda is a major neighboring galaxy about 2.5 million light-years from Earth. Although it is a prominent neighbor, it is not the closest galaxy of every kind: satellite galaxies lie much nearer.',
    fact: 'From the first light-year to 2.5 million, the scale of our exploration expands enormously.',
    sources: [
      { title: 'NASA · The Hidden History of Andromeda', url: 'https://science.nasa.gov/missions/hubble/nasas-hubble-traces-hidden-history-of-andromeda-galaxy/' }
    ],
    color: '#d2c1a6'
  }
];

export const learningNotesEn = [
  {
    id: 'distance',
    title: 'A light-year measures distance',
    text: '1 light-year is about 9.46 trillion kilometers. Actual travel time depends on the spacecraft’s speed.',
    sources: [{ title: 'NASA · What Is a Light-Year?', url: 'https://science.nasa.gov/exoplanets/what-is-a-light-year/' }]
  },
  {
    id: 'route',
    title: 'Distance from Earth ≠ flight path',
    text: 'These destinations lie in different directions and are ordered by their distance from Earth for exploration. A spacecraft would not pass all of them in sequence on one straight route.',
    sources: []
  },
  {
    id: 'illustration',
    title: 'Images help us imagine',
    text: 'The illustrations are conceptual and not to scale. They do not show the actual sizes, colors, or brightness you would see from a spacecraft.',
    sources: []
  }
];

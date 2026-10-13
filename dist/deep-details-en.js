// English counterpart of the final effective deepDetails data, including
// Object.assign destinations and the trailing observational image overrides.
// Hotspots identify feature types, not measured coordinates on these models.
export const deepDetailsEn = {
  earth: {
    metrics: [
      { label: 'Rotation relative to the stars', value: 'About 23.9 hours per rotation' },
      { label: 'Axial tilt', value: 'About 23.4°' },
      { label: 'Surface covered by ocean', value: 'About 71%' }
    ],
    sections: [
      { title: 'Earth rotates; clouds move', text: 'Earth’s surface rotates around its axis, while winds carry clouds through the atmosphere. Clouds can therefore move differently from the continents below.' },
      { title: 'Light and shadow', text: 'Earth does not shine by itself like a star. Its daytime side is illuminated by sunlight reflected from the surface and clouds; the side facing away from the Sun is in night.' },
      { title: 'White clouds', text: 'Water droplets and ice crystals in clouds scatter sunlight back into space. Clouds stand out above the oceans, which reflect less light.' }
    ],
    hotspots: [
      { title: 'Cloud layer', text: 'Clouds sit above the surface and move with the wind. Their motion relative to the continents makes the separate atmospheric layer visible.' },
      { title: 'Day–night boundary', text: 'The gradual transition from light to shadow comes from facing toward or away from the Sun. Earth’s rotation carries this boundary across the surface.' },
      { title: 'Oceans and continents', text: 'The surface uses imagery based on NASA satellite data. Clouds passing overhead do not change the positions of the continents.' }
    ],
    modelNote: 'The surface and clouds reference archival NASA satellite composites, mapped onto a globe and a separate atmospheric layer. Cloud motion and rotation are accelerated for exploration; this is not live weather.',
    sources: [
      { title: 'NASA · Facts About Earth', url: 'https://science.nasa.gov/earth/facts/' },
      { title: 'NASA · Clouds and Radiation', url: 'https://science.nasa.gov/earth/earth-observatory/clouds-and-radiation/' },
      { title: 'NASA · Atmosphere: Earth Photo-Essay', url: 'https://science.nasa.gov/earth/earth-observatory/earth-a-photo-essay/atmosphere/' }
    ]
  },
  centauri: {
    metrics: [
      { label: 'Object in this scene', value: 'Proxima Centauri' },
      { label: 'Distance from Earth', value: 'About 4.24 light-years' },
      { label: 'Type', value: 'A red dwarf with stellar flares' }
    ],
    sections: [
      { title: 'A plasma surface', text: 'A star is hot, luminous gas, not a solid crust like Earth’s. The flowing surface pattern illustrates the motion of plasma and the star’s rotation.' },
      { title: 'Magnetic energy', text: 'Flares on Proxima have been observed. When twisted magnetic fields release energy, the star can brighten suddenly across several wavelengths.' },
      { title: 'What happens during a flare?', text: 'Curved plasma features and sudden brightening illustrate magnetic activity. Flares are intermittent events, rather than steady fire streaming from the entire star.' }
    ],
    hotspots: [
      { title: 'Luminous layer', text: 'The visible surface is a layer of glowing gas. The moving pattern illustrates that the star is rotating plasma.' },
      { title: 'Plasma loops', text: 'The arcs illustrate the connection between plasma and magnetic fields. Detailed loops on Proxima have not been imaged like close-up features on the Sun.' },
      { title: 'Flare site', text: 'Brief brightening illustrates stellar flares supported by measurements of Proxima’s light. It does not indicate that a real flare occurs at this location.' }
    ],
    modelNote: 'Only Proxima is shown as a spherical star. Plasma loops draw on solar physics; surface detail, depth and flare timing are illustrative, not close-up imagery or events measured directly on Proxima.',
    sources: [
      { title: 'NASA · Proxima’s Large and Frequent Flares', url: 'https://science.nasa.gov/universe/exoplanets/neighboring-stars-bad-behavior-large-and-frequent-flares/' },
      { title: 'NASA · Sun Facts: Plasma and Magnetic Features', url: 'https://science.nasa.gov/sun/facts/' }
    ]
  },
  barnard: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 6 light-years' },
      { label: 'Type', value: 'Red dwarf' },
      { label: 'Estimated age', value: 'About 10 billion years' }
    ],
    sections: [
      { title: 'An old star that still flares', text: 'Barnard’s Star is older than the Sun, but Hubble and Chandra observations have still detected flares in ultraviolet and X-ray light.' },
      { title: 'Dim does not mean quiet', text: 'Red dwarfs are cooler and less massive than the Sun. Their ordinary visible brightness therefore does not reveal all of their high-energy activity.' },
      { title: 'Rotation and flares', text: 'Surface patterns move with rotation, while a flare is a temporary release of magnetic energy. These two kinds of motion should be read separately.' }
    ],
    hotspots: [
      { title: 'Warm-colored surface', text: 'Red represents a star cooler than the Sun. Brightness and surface detail are enhanced in this scene for exploration.' },
      { title: 'Magnetic region', text: 'Plasma loops help explain the connection between hot gas and magnetic fields. They are a conceptual illustration of activity on a red dwarf.' },
      { title: 'Flare light', text: 'Evidence for this star’s flares comes from UV and X-ray light. The flashes in this scene make events invisible to the eye observable.' }
    ],
    modelNote: 'Observed flares support the underlying activity. A spherical star and plasma loops illustrate its physics; surface detail, depth, colors, locations and flare timing are designed, not directly photographed features.',
    sources: [
      { title: 'NASA · Flares from the Old Red Dwarf Barnard’s Star', url: 'https://www.nasa.gov/image-article/assessing-habitability-of-planets-around-old-red-dwarfs/' },
      { title: 'NASA · Magnetic Features of the Sun', url: 'https://science.nasa.gov/sun/facts/' }
    ]
  },
  luhman: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 6.5 light-years' },
      { label: 'System', value: 'Two brown dwarfs' },
      { label: 'Observed behavior', value: 'Brightness changes during rotation' }
    ],
    sections: [
      { title: 'Brown dwarfs', text: 'These objects have masses between giant planets and stars. They cannot sustain hydrogen fusion in their cores like ordinary stars.' },
      { title: 'Weather beyond Earth', text: 'Observations of Luhman 16B reveal bright and dark regions passing through view as it rotates, consistent with an atmosphere containing uneven, patchy clouds.' },
      { title: 'Clouds rather than flames', text: 'Flowing patterns and atmospheric bands are the main features to explore. Much of a brown dwarf’s light is infrared, so the brown colors here do not represent what the eye would necessarily see.' }
    ],
    hotspots: [
      { title: 'Cloud patches', text: 'Bright and dark areas illustrate cloud differences inferred from brightness changes. They are not a map of actual patches photographed by a camera in this scene.' },
      { title: 'Atmospheric rotation', text: 'As the object rotates, different parts of its atmosphere face the observer in turn, changing the measured brightness over several hours.' },
      { title: 'Brown dwarf pair', text: 'Luhman 16 has members A and B. The weather study cited here focuses specifically on member B.' }
    ],
    modelNote: 'Rotation and patchy clouds are supported by observations, with the cited weather study focused on Luhman 16B. Both objects are spherical, but cloud patterns, colors, depth and separation are designed for exploration, not close-up surface images.',
    sources: [
      { title: 'ESO · First Weather Map of a Brown Dwarf', url: 'https://www.eso.org/public/news/eso1404/' },
      { title: 'ESO · Luhman 16 at 6.5 Light-Years', url: 'https://www.hq.eso.org/public/products/papermodels/papermodel_0004/' }
    ]
  },
  vega: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 25 light-years' },
      { label: 'Features to explore', value: 'The star and its dust disk' },
      { label: 'Disk structure', value: 'Relatively smooth and symmetric' }
    ],
    sections: [
      { title: 'A broad debris disk', text: 'Vega has a disk of dust and debris around it. Hubble and Webb observations reveal a smoother dust distribution than expected.' },
      { title: 'Starlight sorts the dust', text: 'Starlight affects small and large dust grains differently, helping create a layered distribution. The dust is also associated with collisions between larger objects.' },
      { title: 'How the dust shines', text: 'Hubble detects starlight scattered by dust, while Webb detects infrared emission from warm dust. The same disk can therefore look different at different wavelengths.' }
    ],
    hotspots: [
      { title: 'The central star', text: 'Vega supplies light and energy to the debris around it. The star is much brighter than the dust, so observing the disk requires separating out the starlight.' },
      { title: 'Dust disk', text: 'The visible ring illustrates the distribution of debris. It is not a solid ring or a rope rotating as one piece.' },
      { title: 'Small dust grains', text: 'Radiation pressure affects grains of different sizes differently. The moving points illustrate particle motion within the disk.' }
    ],
    modelNote: 'Observations establish the dust disk. The model gives it thickness and particles distributed in three dimensions; thickness, particle positions, brightness and speed are interpretations, not a measured depth map.',
    sources: [
      { title: 'NASA · Hubble and Webb Probe Vega’s Smooth Disk', url: 'https://science.nasa.gov/missions/hubble/nasas-hubble-webb-probe-surprisingly-smooth-disk-around-vega/' },
      { title: 'NASA · DART Images Vega at 25 Light-Years', url: 'https://www.nasa.gov/missions/dart/nasas-dart-captures-one-of-night-skys-brightest-stars/' }
    ]
  },
  orion: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 1,300 light-years' },
      { label: 'Type', value: 'Star-forming nebula' },
      { label: 'Prominent central stars', value: 'The Trapezium cluster' }
    ],
    sections: [
      { title: 'Stars sculpt the cloud', text: 'Ultraviolet light and winds from massive Trapezium stars push and sculpt the gas and dust, creating cavities and complex cloud edges.' },
      { title: 'Glowing gas', text: 'Radiation from stars excites and ionizes gas, causing it to emit light. Dense dust blocks light behind it, producing both bright regions and dark shadows within the nebula.' },
      { title: 'The flow is not this fast', text: 'The cloud has real structure and motion across an enormous volume. Motion over a few seconds makes its three-dimensional form easier to see; it does not show the nebula’s actual speed.' }
    ],
    hotspots: [
      { title: 'A cavity carved by stellar winds', text: 'This open region illustrates how winds from stars can push gas outward and create denser cloud edges.' },
      { title: 'Bright gas edge', text: 'Gas receives energy from stars and emits light. Bright edges help reveal the relationship between stars and their surrounding clouds.' },
      { title: 'Opaque dust', text: 'Dark regions may be dust blocking light from behind. Darkness therefore does not mean an absence of matter.' }
    ],
    modelNote: 'Color and filament reference: ESO/G. Beccari · CC BY 4.0, an actual multi-filter image. Gas and dust volumes, depth and the unseen back are modeled for exploration, not three-dimensional measurements recovered from the photograph. Flow is accelerated to make it visible.',
    sources: [
      { title: 'NASA · A 3D Journey Through the Orion Nebula', url: 'https://science.nasa.gov/missions/hubble/nasa-space-telescopes-provide-a-3d-journey-through-the-orion-nebula/' },
      { title: 'NASA · Hubble’s Nebulae', url: 'https://science.nasa.gov/mission/hubble/science/universe-uncovered/hubble-nebulae/' },
      { title: 'NASA · Exploring the Universe Through Orion', url: 'https://science.nasa.gov/universe/stories/quick-reads/discovering-the-universe-through-the-constellation-orion/' },
      { title: 'ESO/G. Beccari · Orion Image from VST', url: 'https://www.eso.org/public/images/eso1723a/' },
      { title: 'Image License · CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' }
    ]
  },
  sagittarius: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 26,000 light-years' },
      { label: 'Mass', value: 'About 4 million times the Sun’s mass' },
      { label: 'Location', value: 'The center of the Milky Way' }
    ],
    sections: [
      { title: 'Light comes from around the black hole', text: 'The black hole does not emit light from inside its event horizon. The bright surroundings are matter still outside the horizon and gaining energy.' },
      { title: 'Orbiting gas', text: 'Hot gas near Sagittarius A* may orbit or flow toward the black hole. The rotating disk illustrates accretion: matter does not all fall straight inward.' },
      { title: 'The light ring and bent light', text: 'Intense gravity bends the paths of light. The ring near the black hole’s shadow is therefore related to distorted images of matter, rather than a solid ring around a ball’s surface.' }
    ],
    hotspots: [
      { title: 'Central shadow', text: 'The dark area represents the black hole’s shadow. The observed shadow and the event horizon are different things and do not have the same size.' },
      { title: 'Circling hot gas', text: 'Flow around the center illustrates orbiting matter and accretion. The light comes from matter outside the black hole, not from within it.' },
      { title: 'Inner light ring', text: 'This illustrates the bending of light paths near a black hole. The ring is explanatory and does not result from a complete calculation of photon paths.' }
    ],
    modelNote: 'Gas with finite thickness, the light ring and the dark region conceptually illustrate matter and gravity. The unseen back and motion are designed; this is not an EHT image or a general-relativistic calculation of light paths.',
    sources: [
      { title: 'NASA JPL · Hot Gas Around Sagittarius A*', url: 'https://www.jpl.nasa.gov/news/milky-way-black-hole-snacks-on-hot-gas/' },
      { title: 'NASA · Black Hole Anatomy', url: 'https://science.nasa.gov/universe/black-holes/anatomy/' },
      { title: 'NASA JPL · Imaging the Milky Way’s Black Hole', url: 'https://www.jpl.nasa.gov/edu/resources/teachable-moment/telescopes-get-extraordinary-view-of-milky-ways-black-hole/' }
    ]
  },
  oort: {
    metrics: [
      { label: 'Distance explored', value: 'About 1 light-year from Earth' },
      { label: 'Expected objects', value: 'Ice and dust that supply comets' },
      { label: 'Estimated outer boundary', value: 'Possibly up to about 100,000 AU' }
    ],
    sections: [
      { title: 'A distant reservoir of ice', text: 'The Oort Cloud is a hypothesized region of icy objects surrounding the Solar System. It helps explain where long-period comets arriving from many directions originate.' },
      { title: 'Small objects in an immense volume', text: 'Although many objects are expected, the region is so vast that they are far apart. Crossing the Oort Cloud would not resemble flying through a wall of rocks or thick fog.' },
      { title: 'The Sun becomes a distant star', text: 'From this region, the Sun would look like a bright star. The icy objects do not shine by themselves like stars, and their orbits can tilt in many directions.' }
    ],
    hotspots: [
      { title: 'Icy object', text: 'The object selected for close inspection represents a mixture of ice and dust. Its surface shape is an illustration of objects that have not been directly photographed in the Oort Cloud.' },
      { title: 'The distant Sun', text: 'A distant point of light helps locate the Solar System. At this distance, the Sun should not appear as a fireball filling the sky.' },
      { title: 'Space between objects', text: 'Dark space is an essential part of the scene: objects are spread through an enormous volume, rather than lined up in a wall.' }
    ],
    modelNote: 'The Oort Cloud and its boundaries remain hypothetical. Icy bodies are enlarged three-dimensional objects for inspection; surface shapes, positions and rotation are designed, not measured from photographs of actual Oort Cloud objects.',
    sources: [
      { title: 'NASA · Oort Cloud Facts', url: 'https://science.nasa.gov/solar-system/oort-cloud/facts/' },
      { title: 'NASA · Solar System Facts', url: 'https://science.nasa.gov/solar-system/solar-system-facts/' }
    ]
  },
  interstellar: {
    metrics: [
      { label: 'Example distance from Earth', value: 'About 2–3 light-years' },
      { label: 'Surrounding matter', value: 'Extremely thin gas and dust' },
      { label: 'Prominent in the view', value: 'Light from distant stars' }
    ],
    sections: [
      { title: 'Space is not completely empty', text: 'There is gas, dust and other particles between stars, but it is extremely thin. Where matter gathers more densely, clouds and nebulae can form.' },
      { title: 'Still short of the neighboring stars', text: 'A distance of 2–3 light-years from Earth is less than the distance to the nearest other star. Most stars in the sky are therefore a distant background, rather than objects you pass every second.' },
      { title: 'How travel becomes visible', text: 'Differences in apparent motion and changes in camera angle reveal depth. Passing a distance marker does not guarantee encountering a new object along the same route.' }
    ],
    hotspots: [
      { title: 'The Milky Way’s band of light', text: 'The faint band represents the combined light of distant stars in our galaxy, rather than clouds immediately beside the observer.' },
      { title: 'Background stars', text: 'Star points help establish direction and viewpoint. Their depth is arranged for this scene, rather than taken from a measured star map.' },
      { title: 'Thin gas and dust', text: 'Dark regions are not necessarily empty, but particles should not appear as a dense snowstorm throughout the journey.' }
    ],
    modelNote: 'Sky reference photographed from Earth: ESO/S. Brunier · CC BY 4.0. The panorama represents the distant sky; star-point depths and positions are arranged for exploration, not a three-dimensional star catalog or an observation made 2–3 light-years away.',
    sources: [
      { title: 'NASA · 10 Things: Going Interstellar', url: 'https://science.nasa.gov/solar-system/10-things-going-interstellar/' },
      { title: 'NASA · The Interstellar Medium and Nebulae', url: 'https://science.nasa.gov/mission/hubble/science/universe-uncovered/hubble-nebulae/' },
      { title: 'ESO/S. Brunier · Milky Way Panorama', url: 'https://www.eso.org/public/images/eso0932a/' },
      { title: 'Image License · CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' }
    ]
  },
  sirius: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 8.6 light-years' },
      { label: 'System', value: 'Sirius A and the white dwarf Sirius B' },
      { label: 'Binary orbital period', value: 'About 50 years' }
    ],
    sections: [
      { title: 'Two very different stars', text: 'Sirius A is a bright blue-white star, while Sirius B is a remnant stellar core that has evolved into a white dwarf. They share a system but have very different physical conditions.' },
      { title: 'Small but dense', text: 'Sirius B is similar in size to Earth and slightly smaller, but has a mass close to the Sun’s. Its gravity shifts the wavelengths of escaping light toward the red.' },
      { title: 'Heat is not total brightness', text: 'A white dwarf is very hot but has little emitting surface area, making it appear much fainter than star A. The real binary’s motion unfolds over an orbit lasting decades.' }
    ],
    hotspots: [
      { title: 'Sirius A', text: 'The large, bright star represents the system’s main member. Its blue-white color illustrates the light of a hot star.' },
      { title: 'Sirius B', text: 'The small object is a white dwarf, not a planet. It remains hot and luminous despite being the remnant core of a star that exhausted its fuel.' },
      { title: 'Space between the stars', text: 'The two stars are gravitationally bound and orbit one another. Their clear separation here helps compare object types; it is not their true relative scale.' }
    ],
    modelNote: 'Stars A and B are modeled as different spherical object types. Surface detail, sizes, brightness, separation and motion timing are adjusted for comparison, not close-up imagery or the system’s true scale.',
    sources: [
      { title: 'NASA · Measuring a White Dwarf Star', url: 'https://science.nasa.gov/missions/hubble/measuring-a-white-dwarf-star/' },
      { title: 'NASA · Sirius and Its Tiny Companion', url: 'https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/' }
    ]
  },
  pleiades: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 440 light-years' },
      { label: 'Type', value: 'Open star cluster M45' },
      { label: 'Light from the dust', value: 'Scattered starlight' }
    ],
    sections: [
      { title: 'Many stars in one region', text: 'The Pleiades has more than a thousand members, but a handful of bright stars dominate the view. Bright and faint stars should therefore have clearly different point sizes and intensities.' },
      { title: 'Blue dust filaments', text: 'Dust scatters blue starlight efficiently, forming thin sheets and filaments around the stars. This cloud is passing through the cluster; it is not necessarily gas left over from the birth of these stars.' },
      { title: 'Light pushes the dust', text: 'Near Merope, radiation pressure affects small and large grains differently, creating aligned dust structures. The scene’s flow illustrates a process that unfolds far more slowly in reality.' }
    ],
    hotspots: [
      { title: 'Bright cluster stars', text: 'The bright stars provide the light that makes nearby dust visible. They do not represent every member of the cluster.' },
      { title: 'Reflection dust sheets', text: 'This marks thin dust filaments and blue regions produced by scattered starlight. Dust is not a burning flame.' },
      { title: 'Dark gaps and dust filaments', text: 'Different densities make some dust prominent and other regions dark. Sharp filaments are dust structures, while crosses in star images may be effects of the telescope.' }
    ],
    modelNote: 'Color and dust-filament reference: NOIRLab/NSF/AURA/T.A. Rector (University of Alaska Anchorage), R. Cool (University of Arizona) and WIYN · CC BY 4.0. Dust volume, stellar depths and the unseen back are inferred for exploration, not a measured three-dimensional map. Flow is accelerated to make it visible.',
    sources: [
      { title: 'NOIRLab · M45 Optical Image and Filters', url: 'https://www.astropix.org/image/noirlab/noao-m45' },
      { title: 'NASA · Messier 45 and Reflection Dust', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45/' },
      { title: 'NOIRLab · M45 Observational Image and Credits', url: 'https://www.astropix.org/image/noirlab/noao-m45' },
      { title: 'Image License · CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' }
    ]
  },
  lmc: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 160,000 light-years' },
      { label: 'Type', value: 'Small satellite galaxy' },
      { label: 'Prominent structures', value: 'A dense stellar bar and star-forming knots' }
    ],
    sections: [
      { title: 'Called a cloud, but it is a galaxy', text: 'The Large Magellanic Cloud contains many stars, gas and dust. Its irregular shape should not be read as a single nebula or a symmetric spiral like Andromeda.' },
      { title: 'The central stellar bar', text: 'An elongated region of densely packed stars is called a stellar bar. Its brightness is the combined light of many stars, rather than one gigantic star.' },
      { title: 'Star-forming knots', text: 'This galaxy contains major star-forming regions, such as the Tarantula Nebula. Light and winds from young stars push gas, producing complex cavities and cloud knots.' }
    ],
    hotspots: [
      { title: 'Dense stellar bar', text: 'This marks an elongated concentration of stars, representing the stellar bar that is one feature of the Large Magellanic Cloud.' },
      { title: 'Star-forming gas knot', text: 'Pink represents gas associated with young stars. It does not place this simulated knot at the Tarantula Nebula’s actual location.' },
      { title: 'Irregular galaxy edge', text: 'Stars and gas are distributed in patches and gradually fade outward. This asymmetry helps distinguish the object from a large spiral galaxy.' }
    ],
    modelNote: 'Color and stellar-morphology reference: ESO/VMC Survey · CC BY 4.0, an actual infrared image with colors assigned to Y/J/Ks filters. The stellar-bar and gas-knot volumes, depth and unseen back are modeled, not measured from the photograph. Star positions and motion are arranged for exploration.',
    sources: [
      { title: 'ESO · The LMC Stellar Bar and Nebulae', url: 'https://www.eso.org/public/news/eso9931/' },
      { title: 'NASA JPL · The Tarantula in the Large Magellanic Cloud', url: 'https://www.jpl.nasa.gov/news/a-cosmic-tarantula-caught-by-nasas-webb/' },
      { title: 'ESO/VMC Survey · Large Magellanic Cloud Image', url: 'https://www.eso.org/public/images/eso1914a/' },
      { title: 'Image License · CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' }
    ]
  },
  andromeda: {
    metrics: [
      { label: 'Distance from Earth', value: 'About 2.5 million light-years' },
      { label: 'Catalog name', value: 'Messier 31 / M31' },
      { label: 'Type', value: 'Large spiral galaxy' }
    ],
    sections: [
      { title: 'A city of stars', text: 'Andromeda is our large neighboring galaxy. Its seemingly continuous glow comes from an immense number of stars. Each point in the scene therefore represents a stellar population, not every actual star individually.' },
      { title: 'The center and stellar disk', text: 'The dense center contains a different stellar population from the outer disk. Young blue groups often help identify regions associated with star formation.' },
      { title: 'Dark dust lanes', text: 'Dust blocks starlight behind it, creating dark lanes within the disk. The galaxy’s actual rotation is extremely slow compared with the time spent exploring this website.' }
    ],
    hotspots: [
      { title: 'Central galactic bulge', text: 'The bright center is the combined light of densely packed stars. Warm colors distinguish it from the blue stellar groups farther out.' },
      { title: 'Spiral arms and blue stellar groups', text: 'Patterns in the disk reveal the structure of stars, gas and star-forming regions. They are not solid arms rotating as a single object.' },
      { title: 'Dark dust lanes', text: 'Dark bands mark dust that absorbs and blocks light. Some dark-looking areas still contain matter and have stars behind them.' }
    ],
    modelNote: 'Color and structure reference: Local Group Survey Team and T.A. Rector (University of Alaska Anchorage) · CC BY 4.0, an actual multi-filter image. A disk with thickness, the bulge, depth and unseen back are inferred, not three-dimensional measurements. Star positions and motion are arranged for exploration.',
    sources: [
      { title: 'NASA · Hubble’s Andromeda History', url: 'https://science.nasa.gov/missions/hubble/nasas-hubble-traces-hidden-history-of-andromeda-galaxy/' },
      { title: 'NASA · M31 PHAT Mosaic: Stars and Dust', url: 'https://science.nasa.gov/asset/hubble/hubble-m31-phat-mosaic/' },
      { title: 'NOIRLab · Local Group Survey M31 Image and Credits', url: 'https://www.astropix.org/image/noirlab/noao-m31lgs_ubvIha' },
      { title: 'Image License · CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' }
    ]
  }
};

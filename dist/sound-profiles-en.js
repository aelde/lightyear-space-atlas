// English copy only. Scene IDs, synthesis kinds and gains match sound-profiles.js.
// These descriptions distinguish Earth field recordings from designed space scenes.
export const soundProfilesEn = {
  earth: {
    kind:'earth-fallback', gain:2,
    title:'Flowing water · Birds · Nature',
    basis:'A streamside soundscape on Earth evokes water, the atmosphere and living things.',
    note:"Field recordings made on Earth's surface, not sound heard from orbit.",
    type:'Nature recording'
  },
  oort: {
    kind:'quiet', gain:.08,
    title:'Silence · Sparse icy dust',
    basis:'A very quiet texture suggests a vast region with sparse objects. It does not depict wind blowing through space.',
    note:'A very faint sound texture designed for exploration.',
    type:'Designed sound'
  },
  interstellar: {
    kind:'quiet', gain:.025,
    title:'Near silence · Between the stars',
    basis:'Quiet spaces suggest the distance between stars. The faint texture is part of the storytelling.',
    note:'Mechanical sound does not travel through a vacuum.',
    type:'Designed sound'
  },
  centauri: {
    kind:'stellar-red', gain:.74,
    title:'Plasma · Eruptions · Energy flows',
    basis:"Crackling and low rushing textures evoke a red dwarf's plasma surface and releases of magnetic energy.",
    note:'An interpretation of the plasma imagery, not fire, lava or a recording of Proxima.',
    type:'Designed sound'
  },
  barnard: {
    kind:'stellar-red', gain:.56,
    title:'Plasma flows · Intermittent eruptions',
    basis:'The same red dwarf textures used for Proxima play more quietly here to give this scene its own character. Measured brightness is not converted into loudness.',
    note:'The eruption sounds interpret the imagery; there is no audio data specific to this star.',
    type:'Designed sound'
  },
  luhman: {
    kind:'storm', gain:.78,
    title:'Heavy winds · Clouds · Storms',
    basis:"Swelling gusts evoke a brown dwarf's cloud layers and weather. The rumbling atmosphere is designed for this scene.",
    note:'Observations support the cloud imagery, but the storm sound was not recorded at Luhman 16.',
    type:'Designed sound'
  },
  sirius: {
    kind:'stellar-hot', gain:.62,
    title:'Hot flows · Luminous plasma',
    basis:"Fine hissing and rushing textures give this bright-star scene a different character from a red dwarf's crackling.",
    note:'Star colour and type inspire the sound; temperature is not mapped to frequency.',
    type:'Designed sound'
  },
  vega: {
    kind:'dust', gain:.58,
    title:'Soft plasma · Dust disk',
    basis:'An airy, fine hiss evokes a luminous star and its thin dust disk, without the sound of rocks colliding in a solid ring.',
    note:'The dust sound interprets the imagery; it is not sound reaching the viewer from dust in space.',
    type:'Designed sound'
  },
  pleiades: {
    kind:'nebula', gain:.27,
    title:'Thin gas · Light from many stars',
    basis:'A light, airy texture evokes dust reflecting starlight around the cluster, without adding animal sounds or sounds from stellar surfaces.',
    note:'A designed atmosphere, not a conversion of light data into sound.',
    type:'Designed sound'
  },
  orion: {
    kind:'nebula', gain:.67,
    title:'Flowing gas · Star-forming clouds',
    basis:'A slowly shifting hiss evokes gas and clouds in a star-forming region, rather than wind actually blowing at the viewer.',
    note:'The timing and loudness are designed to fit the scene.',
    type:'Designed sound'
  },
  sagittarius: {
    kind:'accretion', gain:.65,
    title:'Swirling flows · Hot gas',
    basis:"Low, circulating pulses evoke a hot gas disk and flow around a black hole. They do not depict suction or a black hole's roar.",
    note:'Designed for the scene, not event-horizon audio or a sonification of EHT data.',
    type:'Designed sound'
  },
  lmc: {
    kind:'galaxy', gain:.28,
    title:'Open space · Scattered starlight',
    basis:'A quiet texture spread across the stereo field evokes viewing a whole galaxy, without combining individual sounds from all its stars.',
    note:'A soundscape inspired by the imagery; there is no recording of the galaxy as a whole.',
    type:'Designed sound'
  },
  andromeda: {
    kind:'galaxy', gain:.19,
    title:'Distant space · Near silence',
    basis:'Spaces between the textures make the final scene feel vast and distant.',
    note:"The actual distance is not used to calculate this scene's volume.",
    type:'Designed sound'
  }
};

export const soundScienceSourceEn = {
  title:'NASA · Sound and waves in space',
  url:'https://science.nasa.gov/ems/02_anatomy/'
};

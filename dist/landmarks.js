// Approximate distances from Earth, ordered for exploration; not a straight flight path.
// Content and sources follow space-landmarks-guide.txt, checked 13 October 2026.
export const landmarks = [
  {
    id: 'oort',
    name: 'Oort Cloud',
    thaiName: 'เมฆออร์ต',
    distance: 1,
    distanceLabel: 'ประมาณ 1 ปีแสง',
    category: 'region',
    chapter: 'near',
    kicker: 'บริเวณวัตถุน้ำแข็งที่คาดว่ามีอยู่',
    description: 'เมื่อห่างจากโลก 1 ปีแสง เราอาจยังอยู่ในบริเวณเมฆออร์ต แหล่งวัตถุน้ำแข็งและดาวหางที่นักดาราศาสตร์คาดว่ามีอยู่รอบระบบสุริยะ. ขอบเขตยังไม่แน่นอนและยังไม่มีภาพถ่ายโดยตรง วัตถุเบาบางมากจนไม่ควรนึกถึงกำแพงก้อนหินหรือหมอกหนา.',
    fact: 'เมฆออร์ตเป็นข้อคาดหมายทางดาราศาสตร์ ยังไม่ได้ถ่ายภาพโดยตรง',
    sources: [
      { title: 'NASA · Oort Cloud Facts', url: 'https://science.nasa.gov/solar-system/oort-cloud/facts/' },
      { title: 'NASA · Solar System Facts', url: 'https://science.nasa.gov/solar-system/solar-system-facts/' }
    ],
    color: '#a6c8e8'
  },
  {
    id: 'interstellar',
    name: 'ช่องว่างระหว่างดาว',
    thaiName: 'อวกาศระหว่างดวงดาว',
    distance: 2.5,
    distanceLabel: 'ประมาณ 2–3 ปีแสง',
    category: 'region',
    chapter: 'near',
    kicker: 'บริเวณระหว่างดวงดาวที่เบาบาง',
    description: 'ที่ระยะ 2–3 ปีแสงจากโลก เรายังไปไม่ถึงดาวฤกษ์ดวงอื่นที่ใกล้ที่สุด และโดยทั่วไปกำลังสำรวจบริเวณระหว่างดาวที่เบาบาง. นี่เป็นข้ออนุมานจากระยะของดาวเพื่อนบ้าน ไม่ได้หมายความว่าจะมีแลนด์มาร์กใหม่รออยู่ทุก ๆ 1 ปีแสง.',
    fact: 'ดาวฤกษ์ดวงอื่นที่ใกล้ที่สุดยังอยู่ไกลออกไปประมาณ 4.2 ปีแสง',
    sources: [
      { title: 'NASA · Our Nearest Celestial Neighbor', url: 'https://science.nasa.gov/exoplanets/other-stars-other-worlds/our-nearest-celestial-neighbor-an-exotic-3-star-system/' }
    ],
    color: '#9aabe4'
  },
  {
    id: 'centauri',
    name: 'Proxima & Alpha Centauri',
    thaiName: 'ระบบดาวเพื่อนบ้านเซนทอรี',
    distance: 4.24,
    distanceLabel: 'ประมาณ 4.24–4.37 ปีแสง',
    category: 'star',
    chapter: 'near',
    kicker: 'ระบบดาวเพื่อนบ้านใกล้ที่สุด',
    description: 'Proxima Centauri เป็นดาวแคระแดงที่อยู่ห่างประมาณ 4.24 ปีแสง และเป็นดาวฤกษ์ดวงอื่นที่ใกล้ดวงอาทิตย์ที่สุด. Alpha Centauri A และ B เป็นดาวคู่ในระบบเดียวกันที่ระยะประมาณ 4.37 ปีแสง แต่ดาวทั้งสามไม่ได้อยู่ติดกันตามขนาดภาพประกอบ.',
    fact: 'ระยะ 4.24 ปีแสงในตัวสำรวจนี้ใช้ตำแหน่งของ Proxima Centauri',
    sources: [
      { title: 'NASA NTRS · Alpha Centauri', url: 'https://ntrs.nasa.gov/api/citations/20170005527/downloads/20170005527.pdf?attachment=true' },
      { title: 'NASA · Our Nearest Celestial Neighbor', url: 'https://science.nasa.gov/exoplanets/other-stars-other-worlds/our-nearest-celestial-neighbor-an-exotic-3-star-system/' }
    ],
    color: '#f0b683'
  },
  {
    id: 'barnard',
    name: 'Barnard’s Star',
    thaiName: 'ดาวบาร์นาร์ด',
    distance: 6,
    distanceLabel: 'ประมาณ 6 ปีแสง',
    category: 'star',
    chapter: 'near',
    kicker: 'ดาวแคระแดง',
    description: 'ดาวบาร์นาร์ดเป็นดาวแคระแดงในกลุ่มดาวเพื่อนบ้านของดวงอาทิตย์ อยู่ห่างประมาณ 6 ปีแสง. ระยะนี้บอกความห่างจากโลก ส่วนการเดินทางไปหาเราต้องเลือกทิศทางของดาวโดยเฉพาะ.',
    fact: 'ข้อมูล NASA ให้ระยะ 5.97 ปีแสง ซึ่งที่นี่ปัดเป็นประมาณ 6',
    sources: [
      { title: 'NASA · The Solar Neighborhood', url: 'https://imagine.gsfc.nasa.gov/features/cosmic/solar_neighborhood_info.html' }
    ],
    color: '#ed937f'
  },
  {
    id: 'luhman',
    name: 'Luhman 16',
    thaiName: 'ลูห์มัน 16',
    distance: 6.5,
    distanceLabel: 'ประมาณ 6.5 ปีแสง',
    category: 'star',
    chapter: 'near',
    kicker: 'ดาวแคระน้ำตาลคู่',
    description: 'Luhman 16 เป็นระบบดาวแคระน้ำตาลคู่ที่อยู่ห่างจากโลกประมาณ 6.5 ปีแสง. ภาพประกอบขยายวัตถุทั้งสองเพื่อให้เห็นประเภทของจุดหมาย ไม่ได้แสดงขนาดหรือความสว่างที่จะเห็นจากหน้าต่างยาน.',
    fact: 'จุดหมายนี้ประกอบด้วยดาวแคระน้ำตาลสองดวง',
    sources: [
      { title: 'ESO · Luhman 16 Paper Model', url: 'https://www.hq.eso.org/public/products/papermodels/papermodel_0004/' },
      { title: 'ESO · Weather Map of a Brown Dwarf', url: 'https://www.eso.org/public/news/eso1404/' }
    ],
    color: '#cc8c68'
  },
  {
    id: 'sirius',
    name: 'Sirius A / B',
    thaiName: 'ดาวซิริอุส',
    distance: 8.6,
    distanceLabel: 'ประมาณ 8.6 ปีแสง',
    category: 'star',
    chapter: 'near',
    kicker: 'ดาวฤกษ์สว่างและดาวแคระขาว',
    description: 'ระบบซิริอุสอยู่ห่างประมาณ 8.6 ปีแสง มี Sirius A ซึ่งเป็นดาวฤกษ์สว่าง และ Sirius B ซึ่งเป็นดาวแคระขาว. ดาวคู่นี้เป็นอีกจุดหมายในย่านเพื่อนบ้านของเรา แต่ไม่ได้อยู่ต่อจากเซนทอรีบนเส้นทางตรงเส้นเดียวกัน.',
    fact: 'Sirius A และ B เป็นวัตถุต่างชนิดกันในระบบดาวคู่',
    sources: [
      { title: 'NASA · The Solar Neighborhood', url: 'https://imagine.gsfc.nasa.gov/features/cosmic/solar_neighborhood_info.html' }
    ],
    color: '#a2d4ff'
  },
  {
    id: 'vega',
    name: 'Vega',
    thaiName: 'ดาวเวกา',
    distance: 25,
    distanceLabel: 'ประมาณ 25 ปีแสง',
    category: 'star',
    chapter: 'far',
    kicker: 'ดาวฤกษ์สีขาวอมฟ้า',
    description: 'เวกาเป็นดาวฤกษ์สีขาวอมฟ้าที่อยู่ห่างจากโลกประมาณ 25 ปีแสง. เมื่อขยายการสำรวจออกจากดาวเพื่อนบ้าน ระยะเริ่มกระโดดจากหลักหน่วยไปเป็นหลักสิบปีแสง.',
    fact: '25 ปีแสงคือระยะทาง ไม่ใช่เวลาที่ทุกยานใช้เดินทาง',
    sources: [
      { title: 'NASA · DART Captures Vega', url: 'https://www.nasa.gov/missions/dart/nasas-dart-captures-one-of-night-skys-brightest-stars/' }
    ],
    color: '#c4e2ff'
  },
  {
    id: 'pleiades',
    name: 'Pleiades',
    thaiName: 'กระจุกดาวลูกไก่',
    distance: 440,
    distanceLabel: 'ประมาณ 440 ปีแสง',
    category: 'cluster',
    chapter: 'far',
    kicker: 'กระจุกดาว',
    description: 'กระจุกดาวลูกไก่หรือ Pleiades เป็นจุดหมายที่พาเราจากการมองดาวรายดวงไปสู่กลุ่มดาวที่อยู่รวมกัน. ที่นี่ใช้ระยะโดยประมาณ 440 ปีแสงเพื่อแสดงระดับความห่างจากโลก.',
    fact: 'ค่าระยะนี้เป็นค่าประมาณของกระจุกดาว ไม่ใช่จุดแวะบนเส้นทางของทุกยาน',
    sources: [
      { title: 'NASA · Hyades and Pleiades', url: 'https://science.nasa.gov/solar-system/skywatching/night-sky-network/spot-the-young-stars-of-the-hyades-and-pleiades/' }
    ],
    color: '#83b9f0'
  },
  {
    id: 'orion',
    name: 'Orion Nebula',
    thaiName: 'เนบิวลานายพราน',
    distance: 1300,
    distanceLabel: 'ประมาณ 1,300 ปีแสง',
    category: 'nebula',
    chapter: 'far',
    kicker: 'แหล่งกำเนิดดาวฤกษ์',
    description: 'เนบิวลานายพรานเป็นแหล่งกำเนิดดาวฤกษ์ที่อยู่ห่างจากโลกประมาณ 1,300 ปีแสง. สีและความสว่างในภาพประกอบช่วยสื่อชนิดของวัตถุ แต่ไม่รับรองว่าเมื่อมองด้วยตาเปล่าจะเห็นสีสดเช่นเดียวกัน.',
    fact: 'จุดหมายนี้เป็นบริเวณกำเนิดดาว ไม่ใช่ดาวดวงเดียว',
    sources: [
      { title: 'NASA · The Universe Through Orion', url: 'https://science.nasa.gov/universe/stories/quick-reads/discovering-the-universe-through-the-constellation-orion/' }
    ],
    color: '#d99cb9'
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius A*',
    thaiName: 'หลุมดำกลางทางช้างเผือก',
    distance: 26000,
    distanceLabel: 'ประมาณ 26,000 ปีแสง',
    category: 'blackhole',
    chapter: 'far',
    kicker: 'หลุมดำมวลมหาศาล',
    description: 'Sagittarius A* เป็นหลุมดำมวลมหาศาลที่ใจกลางทางช้างเผือก อยู่ห่างจากโลกประมาณ 26,000 ปีแสง. ภาพในตัวสำรวจเป็นแนวคิดอธิบายและภาพจำลอง ไม่ใช่ภาพถ่ายจริงของหลุมดำดวงนี้.',
    fact: 'นี่คือระดับระยะถึงใจกลางกาแล็กซีของเรา',
    sources: [
      { title: 'NASA JPL · Milky Way’s Black Hole', url: 'https://www.jpl.nasa.gov/edu/resources/teachable-moment/telescopes-get-extraordinary-view-of-milky-ways-black-hole/' }
    ],
    color: '#e9ad72'
  },
  {
    id: 'lmc',
    name: 'Large Magellanic Cloud',
    thaiName: 'เมฆแมเจลแลนใหญ่',
    distance: 160000,
    distanceLabel: 'ประมาณ 160,000 ปีแสง',
    category: 'galaxy',
    chapter: 'far',
    kicker: 'กาแล็กซีบริวารของทางช้างเผือก',
    description: 'เมฆแมเจลแลนใหญ่เป็นกาแล็กซีบริวารของทางช้างเผือก อยู่ห่างประมาณ 160,000 ปีแสง. จุดหมายนี้พาการสำรวจออกไปสู่กาแล็กซีข้างเคียงที่อยู่ใกล้กว่าแอนโดรเมดามาก.',
    fact: 'เป็นกาแล็กซีบริวาร ไม่ใช่กาแล็กซีกังหันแบบภาพแอนโดรเมดา',
    sources: [
      { title: 'NASA · Hubble Uncovers a Celestial Fossil', url: 'https://science.nasa.gov/image-detail/hubble-uncovers-a-celestial-fossil-2/' }
    ],
    color: '#83c1cc'
  },
  {
    id: 'andromeda',
    name: 'Andromeda',
    thaiName: 'กาแล็กซีแอนโดรเมดา',
    distance: 2500000,
    distanceLabel: 'ประมาณ 2.5 ล้านปีแสง',
    category: 'galaxy',
    chapter: 'far',
    kicker: 'กาแล็กซีขนาดใหญ่เพื่อนบ้าน',
    description: 'แอนโดรเมดาเป็นกาแล็กซีขนาดใหญ่เพื่อนบ้านที่อยู่ห่างจากโลกประมาณ 2.5 ล้านปีแสง. แม้จะเป็นเพื่อนบ้านสำคัญ แต่ไม่ได้เป็นกาแล็กซีที่ใกล้เราที่สุดทุกประเภท เพราะมีกาแล็กซีบริวารอยู่ใกล้กว่านี้.',
    fact: 'จาก 1 ปีแสงแรกสู่ 2.5 ล้านปีแสง ขนาดการสำรวจเปลี่ยนไปมหาศาล',
    sources: [
      { title: 'NASA · The Hidden History of Andromeda', url: 'https://science.nasa.gov/missions/hubble/nasas-hubble-traces-hidden-history-of-andromeda-galaxy/' }
    ],
    color: '#d2c1a6'
  }
];

export const learningNotes = [
  {
    id: 'distance',
    title: 'ปีแสงเป็นระยะทาง',
    text: '1 ปีแสงเท่ากับประมาณ 9.46 ล้านล้านกิโลเมตร เวลาที่ใช้เดินทางจริงขึ้นอยู่กับความเร็วของยาน.',
    sources: [{ title: 'NASA · What Is a Light-Year?', url: 'https://science.nasa.gov/exoplanets/what-is-a-light-year/' }]
  },
  {
    id: 'route',
    title: 'ระยะจากโลก ≠ เส้นทางบิน',
    text: 'จุดหมายเหล่านี้อยู่คนละทิศและเรียงตามระยะจากโลกเพื่อช่วยสำรวจ ไม่ใช่สถานที่ที่ยานจะบินตรงผ่านครบตามลำดับ.',
    sources: []
  },
  {
    id: 'illustration',
    title: 'ภาพช่วยจินตนาการ',
    text: 'ภาพทั้งหมดเป็นภาพจำลอง ไม่ตามมาตราส่วน และไม่ได้แสดงขนาด สี หรือความสว่างที่จะเห็นจริงจากยาน.',
    sources: []
  }
];

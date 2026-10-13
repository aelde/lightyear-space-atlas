import * as THREE from './vendor/three.module.js';

// Distances, scales and animation speeds are compressed for exploration.
// Spheres, atmospheric shells and depth-bearing particles are artist concepts.
const TAU = Math.PI * 2;
const noiseGLSL = `
float hash3(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.13, 0.27, 0.41));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x),
                 mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
                 mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  v += 0.52 * noise3(p); p = p * 2.03 + 13.1;
  v += 0.27 * noise3(p); p = p * 2.01 + 7.7;
  v += 0.14 * noise3(p); p = p * 2.02 + 3.9;
  v += 0.07 * noise3(p);
  return v;
}`;

const sphereVertex = `
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vLocal = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const starFragment = `
uniform vec3 uColor;
uniform float uTime;
uniform float uSeed;
uniform float uBrown;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
${noiseGLSL}
void main() {
  vec3 p = vLocal;
  float face = max(0.0, dot(normalize(vNormal), normalize(vView)));
  vec3 flow = p * 8.0 + vec3(uSeed, uTime * 0.025, 0.0);
  float broad = fbm(flow);
  float fine = noise3(p * 125.0 + vec3(uSeed, uTime * 0.035, 0));
  float granule = fbm(p * 44.0 + vec3(0, uTime * 0.065, uSeed));
  float surface = 0.44 + 0.38 * broad + 0.25 * granule + 0.18 * fine;
  float brightPatch = smoothstep(0.6, 0.82, broad);
  float cells = smoothstep(0.34,0.66,granule);
  vec3 hot = mix(uColor * 0.38, min(vec3(1.8), uColor * 1.7 + 0.11), cells);
  hot *= 0.78 + fine * 0.4;
  hot *= 0.4 + 0.6 * smoothstep(0.26,0.5,broad);
  hot += uColor * brightPatch * 0.28;
  if (uBrown > 0.5) {
    float curl = fbm(p * 5.0 + vec3(uSeed, uTime * 0.013, 0));
    float latitude = sin(p.y * 26.0 + curl * 7.0 + granule * 1.8);
    float clouds = smoothstep(-0.9, 0.85, latitude) * 0.5 + granule * 0.5;
    hot = mix(vec3(0.055, 0.012, 0.007), uColor * 0.7, clouds);
    hot += vec3(0.18, 0.048, 0.012) * smoothstep(0.67, 0.86, broad);
    hot *= 0.46 + 0.54 * pow(face, 0.5);
  } else {
    hot *= 0.20 + 0.80 * pow(face, 0.55);
  }
  gl_FragColor = vec4(hot, 1.0);
  #include <colorspace_fragment>
}`;

const glowFragment = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uPower;
uniform float uTime;
uniform float uTexture;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
${noiseGLSL}
void main() {
  float d = abs(dot(normalize(vNormal), normalize(vView)));
  float rim = pow(1.0 - d, uPower);
  float texture = mix(1.0, 0.68 + 0.5 * fbm(vLocal * 14.0 + uTime * 0.015), uTexture);
  gl_FragColor = vec4(uColor, rim * uOpacity * texture);
  #include <colorspace_fragment>
}`;

const pointsVertex = `
attribute float aSize;
attribute float aOpacity;
varying vec3 vColor;
varying float vOpacity;
uniform float uPointScale;
uniform float uMaxSize;
void main() {
  vColor = color;
  vOpacity = aOpacity;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPointScale / max(0.2, -mv.z), 0.6, uMaxSize);
}`;

const pointsFragment = `
varying vec3 vColor;
varying float vOpacity;
uniform float uSoft;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float glow = exp(-r * r * mix(6.0, 3.2, uSoft));
  float edge = 1.0 - smoothstep(0.72, 1.0, r);
  float core = exp(-r * r * 38.0) * (1.0 - uSoft) * 0.46;
  gl_FragColor = vec4(vColor + core * 0.2, (glow + core) * edge * vOpacity);
  #include <colorspace_fragment>
}`;

function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function gaussian(random) {
  return Math.sqrt(-2 * Math.log(Math.max(0.0001, random()))) * Math.cos(TAU * random());
}

function seedFor(id) {
  return Array.from(id).reduce((seed, character) => Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);
}

function fallbackEarth() {
  const width = 512, height = 256;
  const pixels = new Uint8Array(width * height * 4);
  const continents = [
    [-110, 45, 36, 26], [-90, 17, 23, 18], [-62, -13, 20, 31],
    [18, 8, 26, 32], [52, 47, 70, 25], [104, 22, 42, 24],
    [135, -25, 20, 15], [-43, 74, 13, 16], [46, -20, 5, 13],
  ];
  for (let y = 0; y < height; y++) {
    const latitude = 90 - y / height * 180;
    for (let x = 0; x < width; x++) {
      const longitude = x / width * 360 - 180;
      const ripple = Math.sin(longitude * 0.12) * Math.cos(latitude * 0.19) * 0.2 + Math.sin(longitude * 0.4 + latitude * 0.13) * 0.08;
      let land = Math.abs(latitude) > 74;
      for (const [cx, cy, sx, sy] of continents) {
        if ((longitude - cx) ** 2 / sx ** 2 + (latitude - cy) ** 2 / sy ** 2 < 0.81 + ripple) land = true;
      }
      const pole = Math.abs(latitude) > 71;
      const arid = latitude > 10 && latitude < 35;
      const rgb = land ? pole ? [194, 213, 222] : arid ? [133, 119, 63] : [37, 73, 43] : [6, 30, 65];
      const index = (y * width + x) * 4;
      pixels[index] = rgb[0]; pixels[index + 1] = rgb[1]; pixels[index + 2] = rgb[2]; pixels[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createWorld(id) {
  const group = new THREE.Group();
  group.name = `world-${id}`;
  group.userData.landmark = id;
  const resources = new Set();
  const timeUniforms = [];
  const rotations = [];
  const motions = [];
  const cameraUpdates = [];
  const random = randomGenerator(seedFor(id));
  let disposed = false;
  let elapsed = 0;
  let radius = 8;
  let cameraDistance = 18;
  const own = resource => { resources.add(resource); return resource; };

  function timeUniform() {
    const uniform = { value: 0 };
    timeUniforms.push(uniform);
    return uniform;
  }

  function shell(parent, sphereRadius, color, opacity, power = 3.2, texture = 0) {
    const material = own(new THREE.ShaderMaterial({
      vertexShader: sphereVertex,
      fragmentShader: glowFragment,
      uniforms: {
        uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity },
        uPower: { value: power }, uTime: timeUniform(), uTexture: { value: texture },
      },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.FrontSide,
    }));
    const mesh = new THREE.Mesh(own(new THREE.SphereGeometry(sphereRadius, 56, 40)), material);
    mesh.name = 'atmospheric-shell';
    parent.add(mesh);
    return mesh;
  }

  function star(parent, starRadius, color, brown = false, seed = 1) {
    const system = new THREE.Group();
    const material = own(new THREE.ShaderMaterial({
      vertexShader: sphereVertex, fragmentShader: starFragment,
      uniforms: {
        uColor: { value: new THREE.Color(color) }, uTime: timeUniform(),
        uSeed: { value: seed }, uBrown: { value: brown ? 1 : 0 },
      },
    }));
    const sphere = new THREE.Mesh(own(new THREE.SphereGeometry(starRadius, 80, 56)), material);
    sphere.name = brown ? 'brown-dwarf' : 'stellar-photosphere';
    system.add(sphere);
    rotations.push({ object: sphere, y: brown ? 0.038 : 0.012, x: 0 });
    if (brown) {
      shell(system, starRadius * 1.014, '#b64b20', 0.11, 4.2);
    } else {
      shell(system, starRadius * 1.035, color, 0.34, 3.8, 1);
      shell(system, starRadius * 1.16, color, 0.048, 4.1, 1);
      if (color === '#ff632b' || color === '#ed4b22') {
        const plasma=own(new THREE.MeshBasicMaterial({color:'#ffba66',transparent:true,opacity:.48,blending:THREE.AdditiveBlending,depthWrite:false}));
        for(let loop=0;loop<7;loop++){
          const azimuth=loop*TAU/7+.4;
          const normal=new THREE.Vector3(Math.cos(azimuth),Math.sin(azimuth),.15*Math.sin(loop)).normalize();
          const tangent=new THREE.Vector3(-Math.sin(azimuth),Math.cos(azimuth),0);
          const points=[];
          for(let step=0;step<=24;step++){
            const t=step/24;
            points.push(normal.clone().multiplyScalar(starRadius*(1.005+.065*Math.sin(t*Math.PI))).addScaledVector(tangent,(t-.5)*starRadius*.12));
          }
          const arc=new THREE.Mesh(own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,starRadius*.0013,5,false)),plasma);
          sphere.add(arc);
        }
      }
    }
    parent.add(system);
    return system;
  }

  function particleCloud(parent, list, { soft = 0, pointScale = 460, maxSize = 15, opacity = 1 } = {}) {
    const positions = new Float32Array(list.length * 3);
    const colors = new Float32Array(list.length * 3);
    const sizes = new Float32Array(list.length);
    const alphas = new Float32Array(list.length);
    list.forEach((point, index) => {
      positions.set(point.position, index * 3);
      const color = new THREE.Color(point.color ?? '#bbcfff');
      colors.set([color.r, color.g, color.b], index * 3);
      sizes[index] = point.size ?? 0.09;
      alphas[index] = (point.alpha ?? 1) * opacity;
    });
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(alphas, 1));
    const material = own(new THREE.ShaderMaterial({
      vertexShader: pointsVertex, fragmentShader: pointsFragment, vertexColors: true,
      uniforms: { uSoft: { value: soft }, uPointScale: { value: pointScale }, uMaxSize: { value: maxSize } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    const cloud = new THREE.Points(geometry, material);
    cloud.frustumCulled = false;
    parent.add(cloud);
    return cloud;
  }

  function distantPoints(parent, count, extent = 25, opacity = 0.6) {
    const points = [];
    for (let i = 0; i < count; i++) {
      const azimuth = random() * TAU, vertical = random() * 2 - 1;
      const r = extent * (0.6 + random() * 0.4);
      const horizontal = Math.sqrt(1 - vertical * vertical);
      points.push({ position: [Math.cos(azimuth) * horizontal * r, vertical * r, Math.sin(azimuth) * horizontal * r], size: 0.055 + random() * 0.09, color: i % 5 ? '#b8d0ec' : '#ffd2ac', alpha: opacity });
    }
    return particleCloud(parent, points, { maxSize: 4 });
  }

  function buildEarth() {
    radius = 5.35; cameraDistance = 14;
    const globe = new THREE.Group();
    globe.rotation.z = THREE.MathUtils.degToRad(23.4);
    group.add(globe);
    const fallback = own(fallbackEarth());
    const material = own(new THREE.MeshPhongMaterial({
      map: fallback, color: '#ffffff', shininess: 16, specular: '#152d40',
      emissive: '#071221', emissiveIntensity: 0.16,
    }));
    const surface = new THREE.Mesh(own(new THREE.SphereGeometry(5, 96, 64)), material);
    surface.rotation.y = -1.35;
    surface.name = 'earth-surface';
    globe.add(surface);
    const cloudMaterial = own(new THREE.MeshPhongMaterial({ color: '#ffffff', transparent: true, opacity: 0.72, depthWrite: false, shininess: 0 }));
    const clouds = new THREE.Mesh(own(new THREE.SphereGeometry(5.045, 80, 56)), cloudMaterial);
    clouds.rotation.y = surface.rotation.y;
    clouds.visible = false;
    clouds.name = 'earth-clouds';
    globe.add(clouds);
    shell(globe, 5.09, '#4fbbff', 0.51, 3.4);
    shell(globe, 5.24, '#1574cf', 0.08, 4.2);
    const loader = new THREE.TextureLoader();
    try {
      const dayTexture = loader.load(new URL('./assets/earth/earth-day.jpg', import.meta.url).href, texture => {
        if (disposed) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        material.map = texture;
        material.needsUpdate = true;
        group.userData.earthTexture = 'NASA day map';
      }, undefined, () => { group.userData.earthTexture = 'procedural fallback'; });
      own(dayTexture);
      const cloudTexture = loader.load(new URL('./assets/earth/earth-clouds.jpg', import.meta.url).href, texture => {
        if (disposed) { texture.dispose(); return; }
        texture.colorSpace = THREE.NoColorSpace;
        cloudMaterial.alphaMap = texture;
        cloudMaterial.needsUpdate = true;
        clouds.visible = true;
      });
      own(cloudTexture);
    } catch {
      group.userData.earthTexture = 'procedural fallback';
    }
    rotations.push({ object: surface, y: 0.026, x: 0 }, { object: clouds, y: 0.034, x: 0 });
  }

  function buildOort() {
    radius = 22; cameraDistance = 31;
    star(group, 0.34, '#ffe5a5', false, 8);
    const iceMaterial = own(new THREE.MeshPhongMaterial({ color: '#cad8e0', emissive: '#53778c', emissiveIntensity: 0.13, shininess: 7 }));
    const geometry = own(new THREE.IcosahedronGeometry(0.055, 1));
    for (let i = 0; i < 20; i++) {
      const azimuth = random() * TAU, vertical = random() * 2 - 1;
      const r = 14 + random() * 7, horizontal = Math.sqrt(1 - vertical * vertical);
      const ice = new THREE.Mesh(geometry, iceMaterial);
      ice.position.set(Math.cos(azimuth) * horizontal * r, vertical * r, Math.sin(azimuth) * horizontal * r);
      ice.rotation.set(random() * TAU, random() * TAU, random() * TAU);
      group.add(ice);
    }
    rotations.push({ object: group, y: 0.003, x: 0.001 });
  }

  function buildStars() {
    if (id === 'centauri') {
      radius = 5.6; cameraDistance = 14.5;
      const primary = star(group, 4.7, '#ff632b', false, 31);
      primary.rotation.z = 0.14;
    } else if (id === 'barnard') {
      radius = 4.8; cameraDistance = 13.3;
      star(group, 4.0, '#ed4b22', false, 97);
    } else if (id === 'luhman') {
      radius = 8.0; cameraDistance = 20;
      const a = star(group, 3.6, '#b65b28', true, 12);
      const b = star(group, 3.05, '#95421c', true, 69);
      a.position.set(-3.8, 0.55, 0.45); b.position.set(4.0, -0.75, -0.65);
      a.rotation.z = -0.15; b.rotation.z = 0.21;
    } else if (id === 'sirius') {
      radius = 7.9; cameraDistance = 19;
      const a = star(group, 4.2, '#c5e6ff', false, 43);
      a.position.set(-1.2, 0.15, 0);
      const b = star(group, 0.57, '#ffffff', false, 76);
      b.position.set(6.2, -1.1, 0.4);
    } else {
      radius = 5.7; cameraDistance = 15;
      star(group, 4.8, '#bedfff', false, 24);
    }
  }

  function buildPleiades() {
    radius = 12.2; cameraDistance = 29;
    const locations = [[-5, 2, 1], [-2.7, 4.6, -1.8], [0.9, 1.9, 1.2], [4.3, 3.2, -1.9], [5.8, -1.2, 0.7], [-0.8, -2.4, 2.1], [-3.9, -1.7, -1.1]];
    const glowGeometry=own(new THREE.PlaneGeometry(2.6,2.6));
    const glowMaterial=own(new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 vUv;
        void main(){float r=length(vUv-.5)*2.0;if(r>1.0)discard;
          float halo=exp(-r*r*9.0)*.16;float core=exp(-r*r*140.0);
          gl_FragColor=vec4(mix(vec3(.18,.42,.95),vec3(1.0),core),halo+core);
          #include <colorspace_fragment>
        }`,
    }));
    locations.forEach((position, index) => {
      const body = star(group, 0.07 + index % 3 * 0.02, '#c6e9ff', false, index * 23 + 1);
      body.position.set(...position);
      shell(body, 0.48 + index % 3 * 0.05, '#6bb7ff', 0.05, 2.4);
      const glow=new THREE.Mesh(glowGeometry,glowMaterial);body.add(glow);
      cameraUpdates.push(cameraPosition=>{group.updateWorldMatrix(true,false);glow.lookAt(cameraPosition);});
    });
    const mist = [];
    for (let i = 0; i < 2200; i++) {
      const center = locations[Math.floor(random() * locations.length)];
      const x = gaussian(random) * 1.4;
      const y = gaussian(random) * 0.52 + Math.sin(x * 2) * 0.35;
      mist.push({ position: [center[0] + x, center[1] + y, center[2] + gaussian(random) * 0.7], color: '#376cb2', size: 0.8 + random() * 0.9, alpha: 0.07 });
    }
    particleCloud(group, mist, { soft: 1, maxSize: 29 });
    distantPoints(group, 190, 11, 0.5);
    rotations.push({ object: group, y: 0.0035, x: 0 });
  }

  function buildOrion() {
    radius = 13.5; cameraDistance = 30;
    const nebula = new THREE.Group();
    group.add(nebula);
    const clouds = [];
    const tones = ['#b44087', '#ad3980', '#743db0', '#356bc4', '#53a4b9', '#dc7baf'];
    for (let i = 0; i < 1800; i++) {
      const t = random() * TAU;
      const branch = Math.floor(random() * 3);
      const length = 3.0 + random() * 5.8;
      const x = Math.cos(t + branch * 0.65) * length * 0.98 + gaussian(random) * 0.65;
      const y = Math.sin(t * 1.15 + branch) * length * 0.55 + Math.sin(x * 0.6) * 1.8 + gaussian(random) * 0.5;
      const z = Math.sin(t * 2.0 + branch) * 2.0 + gaussian(random) * (0.5 + random() * 1.3);
      const tone = tones[branch * 2 + (Math.sin(t * 1.3) > 0 ? 1 : 0)];
      clouds.push({ position: [x, y, z], color: tone, size: 0.8 + random() * 1.2, alpha: 0.015 + random() * 0.015 });
    }
    particleCloud(nebula, clouds, { soft: 1, maxSize: 36 });
    // Integrate emission through a depth-bearing procedural gas volume.
    // This is an artist concept of a star-forming cloud, not an observational map.
    const gasMaterial=own(new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{uTime:timeUniform(),uCamera:{value:new THREE.Vector3(0,0,40)}},
      vertexShader:`varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform float uTime;uniform vec3 uCamera;varying vec3 vLocal;${noiseGLSL}
        void main(){vec3 ray=normalize(vLocal-uCamera);vec3 p=vLocal+ray*.04;vec3 emission=vec3(0);float alpha=0.0;
          for(int i=0;i<32;i++){
            if(abs(p.x)>12.05||abs(p.y)>7.05||abs(p.z)>5.05)break;
            vec3 q=p*.32+vec3(0,uTime*.004,0);
            float n=fbm(q*3.0);float tendrils=fbm(q*7.0+vec3(n*3.5));
            float y=p.y+sin(p.x*.43)*1.6;
            float form=exp(-p.x*p.x/62.0-y*y/7.0-p.z*p.z/10.0);
            form+=exp(-(p.x+4.0)*(p.x+4.0)/12.0-(p.y-2.0)*(p.y-2.0)/9.0-p.z*p.z/7.0)*.65;
            form+=exp(-(p.x-4.5)*(p.x-4.5)/12.0-(p.y+2.4)*(p.y+2.4)/5.0-p.z*p.z/7.0)*.7;
            float density=max(0.0,n*.7+tendrils*.5-.34)*form;
            float a=clamp(density*.14,0.0,.22);
            vec3 color=mix(vec3(.14,.32,.70),vec3(1.0,.16,.39),smoothstep(-6.0,5.0,p.x));
            color=mix(color,vec3(.65,.50,.89),smoothstep(.5,.8,tendrils)*.5);
            float centerLight=exp(-dot(p,p)*.045);
            color+=vec3(.44,.52,.70)*centerLight;
            emission+=(1.0-alpha)*color*a*2.2;alpha+=(1.0-alpha)*a;
            p+=ray*.47;
          }
          gl_FragColor=vec4(emission,alpha*.9);
          #include <colorspace_fragment>
        }`,
    }));
    const volume=new THREE.Mesh(own(new THREE.BoxGeometry(24,14,10)),gasMaterial);
    nebula.add(volume);
    cameraUpdates.push(cameraPosition=>{
      volume.updateWorldMatrix(true,false);
      gasMaterial.uniforms.uCamera.value.copy(cameraPosition);
      volume.worldToLocal(gasMaterial.uniforms.uCamera.value);
    });
    [[-0.7, 0.6, 1.5], [0.2, 1.1, 1.6], [1.0, 0.5, 1.1], [0.2, -0.1, 1.7]].forEach((position, index) => {
      const body = star(nebula, 0.11 + index % 2 * 0.035, '#e2edff', false, index * 27);
      body.position.set(...position);
    });
    distantPoints(group, 170, 12.5, 0.46);
    rotations.push({ object: nebula, y: 0.004, x: 0.002 });
    motions.push(time => { nebula.position.y = Math.sin(time * 0.018) * 0.17; });
  }

  function buildBlackHole() {
    radius = 10; cameraDistance = 22.5;
    const hole = new THREE.Mesh(own(new THREE.SphereGeometry(2.18, 72, 48)), own(new THREE.MeshBasicMaterial({ color: '#000000' })));
    hole.name = 'black-hole-shadow';
    hole.renderOrder = 1;
    group.add(hole);
    const disk = new THREE.Group();
    disk.rotation.x = 1.10; disk.rotation.z = -0.15;
    group.add(disk);
    const diskMaterial = own(new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vLocal; void main(){ vLocal=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime; varying vec3 vLocal; ${noiseGLSL}
        void main(){
          float r=length(vLocal.xy); float a=atan(vLocal.y,vLocal.x);
          float heat=1.0-smoothstep(2.5,7.8,r);
          float rings=0.73+0.27*sin(r*15.0+fbm(vec3(vLocal.xy*3.0,uTime*0.1))*8.0);
          float spiral=0.6+0.4*fbm(vec3(cos(a-uTime*0.18)*8.0,sin(a-uTime*0.18)*8.0,r*1.8));
          float edge=smoothstep(2.35,2.68,r)*(1.0-smoothstep(5.3,7.8,r));
          vec3 col=mix(vec3(0.64,0.13,0.018),vec3(1.4,0.97,0.46),pow(heat,3.0));
          gl_FragColor=vec4(col,edge*rings*spiral*(0.35+heat*0.58));
          #include <colorspace_fragment>
        }`,
      uniforms: { uTime: timeUniform() }, side: THREE.DoubleSide,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    const accretion = new THREE.Mesh(own(new THREE.RingGeometry(2.38, 7.8, 160, 6)), diskMaterial);
    accretion.name = 'accretion-disk';
    disk.add(accretion);
    const torusMaterial = own(new THREE.MeshBasicMaterial({ color: '#ffd290', transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false }));
    const innerEdge = new THREE.Mesh(own(new THREE.TorusGeometry(2.56, 0.055, 12, 128)), torusMaterial);
    disk.add(innerEdge);
    shell(group, 2.26, '#ffb86c', 0.52, 7);
    shell(group, 2.39, '#ff9142', 0.075, 6);
    const photonRing=new THREE.Mesh(own(new THREE.TorusGeometry(2.22,.024,10,128)),own(new THREE.MeshBasicMaterial({color:'#ffd5a0',transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})));
    group.add(photonRing);
    cameraUpdates.push(cameraPosition=>{group.updateWorldMatrix(true,false);photonRing.lookAt(cameraPosition);});
    distantPoints(group, 95, 14, 0.33);
  }

  function buildGalaxy(irregular = false) {
    radius = irregular ? 14.5 : 18.2;
    cameraDistance = irregular ? 32 : 40;
    const galaxy = new THREE.Group();
    galaxy.rotation.set(irregular ? 0.35 : 0.93, irregular ? -0.18 : 0.07, irregular ? -0.21 : -0.29);
    group.add(galaxy);
    const stars = [], haze = [];
    if (irregular) {
      const knots = [[-5.6, 1.4, 1.2], [-1.2, 1, 0], [2.8, -0.1, -0.6], [6.1, -1.7, 0.5], [0.3, -4.1, 0.7]];
      for (let i = 0; i < 10000; i++) {
        const bar = random() < 0.46;
        const knot = knots[Math.floor(random() * knots.length)];
        const x = bar ? gaussian(random) * 4.9 : knot[0] + gaussian(random) * 2.0;
        const y = bar ? gaussian(random) * 1.27 : knot[1] + gaussian(random) * 1.6;
        const z = gaussian(random) * 0.8 + (bar ? 0 : knot[2]);
        const color = random() < 0.15 ? '#d291d1' : random() < 0.5 ? '#accfff' : '#e4daca';
        stars.push({ position: [x, y, z], color, size: 0.038 + random() ** 4 * 0.18, alpha: 0.45 + random() * 0.45 });
        if (i % 5 === 0) haze.push({ position: [x, y, z], color: bar ? '#45588b' : '#76457b', size: 0.7 + random() * 0.8, alpha: 0.022 });
      }
      const birthCloud = [];
      for (let i = 0; i < 470; i++) {
        birthCloud.push({ position: [5.4 + gaussian(random) * 0.8, -1.7 + gaussian(random) * 0.58, 0.95 + gaussian(random) * 0.48], color: random() < 0.5 ? '#c15996' : '#777db8', size: 0.45 + random() * 0.65, alpha: 0.034 });
      }
      particleCloud(galaxy, birthCloud, { soft: 1, maxSize: 24 });
    } else {
      for (let i = 0; i < 15500; i++) {
        const core = random() < 0.24;
        let x, y, z, color;
        if (core) {
          x = gaussian(random) * 1.2; y = gaussian(random) * 1.16; z = gaussian(random) * 0.72;
          color = random() > 0.17 ? '#ffdba7' : '#fff1d7';
        } else {
          const r = 1.9 + Math.pow(random(), 0.7) * 13.2;
          const arm = Math.floor(random() * 2) * Math.PI;
          const angle = arm + Math.log(r + 0.5) * 2.13 + gaussian(random) * (0.07 + r * 0.011);
          x = Math.cos(angle) * r + gaussian(random) * 0.17;
          y = Math.sin(angle) * r + gaussian(random) * 0.17;
          z = gaussian(random) * (0.10 + r * 0.017);
          color = r < 4.2 ? '#e8cbac' : random() < 0.19 ? '#dba6cb' : '#b3cff0';
        }
        stars.push({ position: [x, y, z], color, size: core ? 0.052 + random() * 0.11 : 0.035 + random() ** 4 * 0.19, alpha: 0.46 + random() * 0.47 });
        if (i % 6 === 0) haze.push({ position: [x + gaussian(random) * 0.33, y + gaussian(random) * 0.33, z], color: core ? '#be803e' : '#4265a3', size: core ? 0.64 : 0.9 + random() * 0.65, alpha: core ? 0.036 : 0.025 });
      }
      // A very faint diffuse disk connects arms without flattening the star field.
      for (let i = 0; i < 1700; i++) {
        const r = Math.sqrt(random()) * 14.8, angle = random() * TAU;
        haze.push({ position: [Math.cos(angle) * r, Math.sin(angle) * r, gaussian(random) * 0.22], color: '#404b70', size: 0.65 + random() * 0.65, alpha: 0.013 });
      }
    }
    const glowMaterial=own(new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      uniforms:{uTime:timeUniform(),uIrregular:{value:irregular?1:0}},
      vertexShader:`varying vec3 vLocal;void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec3 vLocal;uniform float uTime;uniform float uIrregular;${noiseGLSL}
        void main(){vec2 p=vLocal.xy;float r=length(p);float n=fbm(vec3(p*.8,uTime*.006));
          float density;vec3 color;
          if(uIrregular>.5){
            float bar=exp(-p.x*p.x/36.0-p.y*p.y/2.2);
            float knots=exp(-dot(p-vec2(-5.5,1.4),p-vec2(-5.5,1.4))/7.0);
            knots+=exp(-dot(p-vec2(5.4,-1.6),p-vec2(5.4,-1.6))/5.0);
            knots+=exp(-dot(p-vec2(.3,-4.1),p-vec2(.3,-4.1))/6.0)*.6;
            density=(bar*.38+knots*.23)*smoothstep(.2,.65,n);
            color=mix(vec3(.2,.31,.58),vec3(.8,.62,.55),bar*.65);
          }else{
            float a=atan(p.y,p.x);float arm=exp(-pow(sin(a-log(r+.5)*2.13)*6.0,2.0));
            float outer=1.0-smoothstep(9.0,15.4,r);float inner=smoothstep(1.0,3.4,r);
            float core=exp(-r*r/3.0);float halo=exp(-r*r/12.0);
            density=outer*inner*(arm*.23+.018)*(.35+n*.9)+core*.87+halo*.065;
            color=mix(vec3(.24,.36,.67),vec3(1.0,.73,.39),clamp(core+halo*.55,0.0,1.0));
          }
          gl_FragColor=vec4(color*1.7,clamp(density,0.0,.94));
          #include <colorspace_fragment>
        }`,
    }));
    const lightDisk=new THREE.Mesh(own(new THREE.PlaneGeometry(irregular?29:32,irregular?22:32)),glowMaterial);
    lightDisk.position.z=-.06;
    galaxy.add(lightDisk);
    particleCloud(galaxy, haze, { soft: 1, maxSize: 29 });
    particleCloud(galaxy, stars, { maxSize: 7, pointScale: 510 });
    rotations.push({ object: galaxy, y: 0.0015, x: 0 });
    distantPoints(group, 95, radius * 1.3, 0.28);
  }

  if (id === 'earth') buildEarth();
  else if (id === 'oort') buildOort();
  else if (id === 'interstellar') {
    radius = 22; cameraDistance = 28;
    distantPoints(group, 27, 35, 0.38);
  }
  else if (['centauri', 'barnard', 'luhman', 'sirius', 'vega'].includes(id)) buildStars();
  else if (id === 'pleiades') buildPleiades();
  else if (id === 'orion') buildOrion();
  else if (id === 'sagittarius') buildBlackHole();
  else if (id === 'lmc') buildGalaxy(true);
  else if (id === 'andromeda') buildGalaxy(false);
  else {
    // Unknown destinations retain an empty navigable region rather than a wrong object.
    radius = 20; cameraDistance = 25;
    distantPoints(group, 20, 30, 0.4);
  }

  return {
    group, radius, cameraDistance,
    update(dt, time, cameraPosition) {
      if (disposed) return;
      const delta = Math.min(0.1, Math.max(0, Number(dt) || 0));
      elapsed += delta;
      const seconds = Number.isFinite(time) ? time : elapsed;
      timeUniforms.forEach(uniform => { uniform.value = seconds; });
      rotations.forEach(({ object, y, x }) => { object.rotation.y += y * delta; object.rotation.x += x * delta; });
      motions.forEach(motion => motion(seconds));
      if(cameraPosition)cameraUpdates.forEach(update=>update(cameraPosition));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      resources.forEach(resource => resource.dispose());
      resources.clear();
      group.clear();
    },
  };
}

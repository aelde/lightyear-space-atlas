import * as THREE from './vendor/three.module.js';
import { addStellarWeather, addDustDisk } from './flight-effects.js?v=13.1';
import { enhancedStarMaterial, addDetailedCorona } from './stellar-surfaces.js?v=9.5';
import { addPhotographicNebula } from './nebula-renderer.js?v=13.2';
import { addDetailedGalaxy } from './galaxy-renderer.js?v=13.1';
import { addDetailedIce, addInterstellarContext, addAccretionDetail } from './deep-space-details.js?v=13.1';

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
  float texture = mix(1.0, 0.45 + 0.85 * fbm(vLocal * 14.0 + uTime * 0.11), uTexture);
  gl_FragColor = vec4(uColor, rim * uOpacity * texture);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const pointsVertex = `
attribute float aSize;
attribute float aOpacity;
varying vec3 vColor;
varying float vOpacity;
uniform float uPointScale;
uniform float uMaxSize;
uniform float uTime;
uniform float uFlow;
void main() {
  vColor = color;
  vOpacity = aOpacity;
  vec3 wind=vec3(sin(position.y*.6+uTime*.13),cos(position.x*.5+uTime*.11),sin(position.z*.7+uTime*.09))*uFlow;
  vec4 mv = modelViewMatrix * vec4(position+wind, 1.0);
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
  #include <tonemapping_fragment>
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
  const featurePoints={
    earth:[[0,2.7,4.3],[4.3,.6,2.3],[-1.8,-1.0,4.4]],
    oort:[[1.7,.8,7.5],[-6,-.7,-3],[-2.3,-1,0]],
    interstellar:[[0,-3.5,-70],[12,-6,-65],[-10,4,-60]],
    sirius:[[-1.2,.5,4],[6.2,-1.1,.6],[2.5,-.4,.2]],
    pleiades:[[-4,2.5,2.8],[3,-1.5,2],[-2.2,-3,1.5]],
    lmc:[[-2,.6,1.4],[5.3,-1.7,1.6],[-5.5,2,1]],
    andromeda:[[0,0,1.6],[6,2.8,1.7],[-6.5,-3.2,.6]],
    centauri:[[0,.6,4.6],[5.1,1.6,.3],[3.2,4.7,.1]],
    barnard:[[0,.6,3.9],[4.5,1.3,.3],[2.6,4.0,.1]],
    luhman:[[-3.8,.8,3.5],[-4.2,-1.3,3.0],[3.8,-.6,2.9]],
    vega:[[0,.2,3.2],[9.2,0,.3],[-9.5,-1.0,.2]],
    orion:[[-2.8,1.0,2.8],[4,-2,2.0],[-5.3,3,1.6]],
    sagittarius:[[0,0,2.2],[5.7,-.9,1.6],[2.25,.2,1.8]],
  };

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
      toneMapped: id !== 'earth',
    }));
    const mesh = new THREE.Mesh(own(new THREE.SphereGeometry(sphereRadius, 56, 40)), material);
    mesh.name = 'atmospheric-shell';
    parent.add(mesh);
    return mesh;
  }

  function star(parent, starRadius, color, brown = false, seed = 1) {
    const system = new THREE.Group();
    const material = enhancedStarMaterial({color,brown,seed,timeUniform,own});
    const sphere = new THREE.Mesh(own(new THREE.SphereGeometry(starRadius, 96, 64)), material);
    sphere.name = brown ? 'brown-dwarf' : 'stellar-photosphere';
    system.add(sphere);
    rotations.push({object:sphere,y:brown?.052:.022,x:0});
    addDetailedCorona(system,sphere,starRadius,color,own,timeUniform,motions,cameraUpdates,{brown});
    if(color==='#ff632b'||color==='#ed4b22')motions.push(addStellarWeather(sphere,starRadius,own));
    parent.add(system);return system;
  }

  function particleCloud(parent, list, { soft = 0, pointScale = 460, maxSize = 15, opacity = 1, flow = 0 } = {}) {
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
      uniforms: { uSoft: { value: soft }, uPointScale: { value: pointScale }, uMaxSize: { value: maxSize },uTime:timeUniform(),uFlow:{value:flow} },
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
    const cloudTime=timeUniform();
    cloudMaterial.onBeforeCompile=shader=>{
      shader.uniforms.uCloudTime=cloudTime;
      shader.fragmentShader='uniform float uCloudTime;\n'+shader.fragmentShader.replace('#include <alphamap_fragment>',`#ifdef USE_ALPHAMAP
        vec2 weatherUv=vAlphaMapUv;
        weatherUv.x+=uCloudTime*.0007*sin((weatherUv.y-.5)*6.28)+.003*sin(weatherUv.y*35.0+uCloudTime*.17);
        weatherUv.y+=.0015*sin(weatherUv.x*30.0+uCloudTime*.12);
        diffuseColor.a*=texture2D(alphaMap,weatherUv).g;
        #endif`);
    };
    cloudMaterial.customProgramCacheKey=()=> 'earth-cloud-weather-v5';
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
        texture.wrapS = THREE.RepeatWrapping;
        cloudMaterial.alphaMap = texture;
        cloudMaterial.needsUpdate = true;
        clouds.visible = true;
      });
      own(cloudTexture);
    } catch {
      group.userData.earthTexture = 'procedural fallback';
    }
    rotations.push({ object: surface, y: 0.036, x: 0 }, { object: clouds, y: 0.056, x: 0 });
  }

  function buildOort() {
    radius = 22; cameraDistance = 25;
    const distantSun=star(group,.34,'#ffe5a5',false,8);distantSun.position.set(-6,-.7,-3);
    addDetailedIce(group,{own,rotations});
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
      radius = 13.2; cameraDistance = 26;
      star(group, 3.2, '#bedfff', false, 24);
      addDustDisk(group,own,timeUniform,cameraUpdates);
    }
  }

  function buildPleiades() {
    const framing=addPhotographicNebula(group,{id:'pleiades',own,timeUniform,cameraUpdates});
    radius=framing.radius;cameraDistance=framing.cameraDistance;
    distantPoints(group,110,16,.22);
  }

  function buildOrion() {
    const framing=addPhotographicNebula(group,{id:'orion',own,timeUniform,cameraUpdates});
    radius=framing.radius;cameraDistance=framing.cameraDistance;
    distantPoints(group,140,17,.23);
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
    const torusMaterial = own(new THREE.MeshBasicMaterial({ color: '#ffd290', transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false }));
    const innerEdge = new THREE.Mesh(own(new THREE.TorusGeometry(2.56, 0.055, 12, 128)), torusMaterial);
    disk.add(innerEdge);
    const count=1800,orbitPositions=new Float32Array(count*3);
    for(let i=0;i<count;i++)orbitPositions.set([2.42+random()*4.9,random()*TAU,(random()-.5)*.08],i*3);
    const flowGeometry=own(new THREE.BufferGeometry());flowGeometry.setAttribute('position',new THREE.BufferAttribute(orbitPositions,3));
    const flowMaterial=own(new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:timeUniform()},
      vertexShader:`uniform float uTime;varying float vHeat;void main(){float r=position.x;float a=position.y-uTime*.85/pow(r/2.5,1.5);
        vec3 p=vec3(cos(a)*r,sin(a)*r,position.z);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(38.0/max(1.0,-mv.z),1.0,3.0);vHeat=1.0-smoothstep(2.5,7.4,r);}`,
      fragmentShader:`varying float vHeat;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;
        gl_FragColor=vec4(mix(vec3(.85,.24,.035),vec3(1.0,.9,.61),vHeat),exp(-r*r*4.0)*(.12+vHeat*.28));
        #include <tonemapping_fragment>
  #include <colorspace_fragment>
      }`,
    }));
    const gasFlow=new THREE.Points(flowGeometry,flowMaterial);gasFlow.frustumCulled=false;disk.add(gasFlow);
    shell(group, 2.26, '#ffb86c', 0.52, 7);
    shell(group, 2.39, '#ff9142', 0.075, 6);
    const photonRing=new THREE.Mesh(own(new THREE.TorusGeometry(2.22,.024,10,128)),own(new THREE.MeshBasicMaterial({color:'#ffd5a0',transparent:true,opacity:.40,depthWrite:false,blending:THREE.AdditiveBlending})));
    group.add(photonRing);
    cameraUpdates.push(cameraPosition=>{group.updateWorldMatrix(true,false);photonRing.lookAt(cameraPosition);});
    addAccretionDetail(group,disk,{own,timeUniform,cameraUpdates});
    distantPoints(group, 95, 14, 0.33);
  }

  function buildGalaxy(irregular = false) {
    const observationTexture=new THREE.TextureLoader().load(new URL(`./assets/observations/${irregular?'lmc-infrared.jpg':'andromeda-optical.jpg'}`,import.meta.url).href,texture=>{
      if(disposed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;group.userData.observationTexture=id;
    },undefined,()=>{group.userData.observationTexture='unavailable';});
    const framing=addDetailedGalaxy(group,{irregular,own,timeUniform,random,particleCloud,cameraUpdates,observationTexture,
      observationScale:irregular?[14.5,11.5]:[16.7,16.7],observationStrength:.96});
    radius=framing.radius;cameraDistance=framing.cameraDistance;
    const model=group.getObjectByName(irregular?'lmc-asymmetric-populations':'andromeda-populations-and-dust');
    if(!irregular)model.rotation.x=1.30;
    const points=irregular?[[0,0,.7],[-4.35,2.5,.8],[6.5,2,.4]]:[[0,0,.6],[8,3.3,.5],[-7.1,-3.5,.4]];
    featurePoints[id]=points.map(point=>new THREE.Vector3(...point).applyEuler(model.rotation).toArray());
    distantPoints(group,95,radius*1.3,.23);
  }

  if (id === 'earth') buildEarth();
  else if (id === 'oort') buildOort();
  else if (id === 'interstellar') {
    radius = 22; cameraDistance = 28;
    addInterstellarContext(group,{own,timeUniform});
    distantPoints(group, 150, 35, .38);
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
    features:(featurePoints[id]||[]).map((point,index)=>({index,point:new THREE.Vector3(...point)})),
    update(dt, time, cameraPosition) {
      if (disposed) return;
      const delta = Math.min(0.25, Math.max(0, Number(dt) || 0));
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

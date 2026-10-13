import * as THREE from './vendor/three.module.js';

// Seamless, evolving surface illustrations. Cell size, contrast, storm geometry
// and elapsed time are exaggerated for inspection; these are not observed maps.
const surfaceVertex = `
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

const fieldFunctions = `
float hash1(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
vec3 hashVector(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float field(vec3 p) {
  vec3 cell = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash1(cell), hash1(cell + vec3(1,0,0)), f.x),
                 mix(hash1(cell + vec3(0,1,0)), hash1(cell + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash1(cell + vec3(0,0,1)), hash1(cell + vec3(1,0,1)), f.x),
                 mix(hash1(cell + vec3(0,1,1)), hash1(cell + vec3(1,1,1)), f.x), f.y), f.z);
}
// One 27-candidate cellular evaluation, entirely in 3D: no longitude seam.
// Return nearest distance, separation from second-nearest and stable cell ID.
vec3 convectionCells(vec3 p) {
  vec3 cell = floor(p), f = fract(p), selected = cell;
  float nearest = 9.0, second = 9.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 neighbor = vec3(float(x), float(y), float(z));
        vec3 jitter = 0.18 + hashVector(cell + neighbor) * 0.64;
        vec3 delta = neighbor + jitter - f;
        float distanceSquared = dot(delta, delta);
        if (distanceSquared < nearest) {
          second = nearest;
          nearest = distanceSquared;
          selected = cell + neighbor;
        } else {
          second = min(second, distanceSquared);
        }
      }
    }
  }
  float first = sqrt(nearest);
  return vec3(first, sqrt(second) - first, hash1(selected + 4.17));
}
// Surface derivatives give relief without displacing the sphere or weather
// attachments. Both vectors are in view space, so detail works from any angle.
vec3 reliefNormal(float height, float strength) {
  vec3 normal = normalize(vNormal);
  vec3 dx = normalize(dFdx(-vView));
  vec3 dy = normalize(dFdy(-vView));
  vec3 rx = cross(dy, normal), ry = cross(normal, dx);
  float determinant = dot(dx, rx);
  vec3 gradient = dFdx(height) * rx + dFdy(height) * ry;
  return normalize(abs(determinant) * normal - sign(determinant) * gradient * strength);
}
vec3 turnAround(vec3 p, vec3 axis, float angle) {
  float c = cos(angle), s = sin(angle);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}
`;

const surfaceFragment = `
uniform vec3 uColor;
uniform float uTime;
uniform float uSeed;
uniform float uBrown;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
${fieldFunctions}
void main() {
  vec3 p = normalize(vLocal);
  vec3 viewDirection = normalize(vView);
  float face = max(0.0, dot(normalize(vNormal), viewDirection));
  vec3 seed = vec3(uSeed * 0.137 + 3.7, uSeed * 0.271 + 7.2, uSeed * 0.193 + 13.5);
  vec3 finalColor;

  #if BROWN_DWARF == 1
    // Smooth cloud decks and differentially advected belts, not stellar cells.
    float latitude = p.y;
    float longitude = atan(p.z, p.x);
    float wind = uTime * 0.019 * (0.62 + 0.46 * sin(latitude * 9.0 + uSeed));
    float horizontal = sqrt(max(0.0, 1.0 - latitude * latitude));
    vec3 weather = vec3(cos(longitude + wind) * horizontal, latitude, sin(longitude + wind) * horizontal);
    vec3 axisA = normalize(vec3(sin(uSeed * 1.13), 0.16, cos(uSeed * 1.13)));
    vec3 axisB = normalize(vec3(cos(uSeed * 0.79 + 1.2), -0.36, sin(uSeed * 0.79 + 1.2)));
    float vortexA = exp((dot(weather, axisA) - 1.0) * 23.0);
    float vortexB = exp((dot(weather, axisB) - 1.0) * 31.0);
    weather = turnAround(weather, axisA, vortexA * (2.5 + uTime * 0.015));
    weather = turnAround(weather, axisB, -vortexB * (2.1 + uTime * 0.012));

    float large = field(weather * 5.4 + seed + vec3(0, uTime * 0.012, 0));
    float medium = field(weather * 17.0 + seed * 0.41);
    float wisps = field(weather * 48.0 + seed * 1.27 + vec3(uTime * 0.015, 0, 0));
    float detail = field(weather * 112.0 + seed * 0.71);
    float foldedLatitude = weather.y * 22.0 + (large - 0.5) * 3.7 + (medium - 0.5) * 0.9;
    float belts = 0.5 + 0.5 * sin(foldedLatitude);
    float cloudDeck = 0.28 + 0.50 * (belts * 0.52 + large * 0.30 + medium * 0.18);
    float ridge = smoothstep(0.19, 0.85, medium * 0.55 + wisps * 0.45);
    float fineWeight = 1.0 - smoothstep(0.5, 1.8, length(fwidth(weather * 112.0)));
    float height = cloudDeck * 0.69 + ridge * 0.29 + detail * 0.02 * fineWeight;
    vec3 relief = reliefNormal(height, 1.0);
    vec3 darkDeck = vec3(0.065, 0.020, 0.008);
    vec3 copperDeck = uColor * 0.40 + vec3(0.046, 0.018, 0.007);
    vec3 warmDeck = uColor * 0.60 + vec3(0.058, 0.026, 0.012);
    float layers = clamp((cloudDeck - 0.28) * 1.8 + (ridge - 0.5) * 0.10, 0.0, 1.0);
    vec3 cloudColor = mix(darkDeck, copperDeck, smoothstep(0.0, 0.50, layers));
    cloudColor = mix(cloudColor, warmDeck, smoothstep(0.45, 1.0, layers));
    cloudColor += uColor * (wisps - 0.5) * 0.055;
    cloudColor *= 0.93 + 0.12 * ridge + 0.025 * detail * fineWeight;
    float cloudLight = 0.63 + 0.37 * max(0.0, dot(relief, normalize(vec3(-0.5, 0.42, 0.95))));
    float limb = 0.50 + 0.50 * pow(face, 0.44);
    float warmRim = pow(1.0 - face, 3.0) * 0.065;
    finalColor = cloudColor * cloudLight * limb + uColor * warmRim;

  #else
    float red = smoothstep(1.18, 1.85, uColor.r / max(0.03, uColor.b));
    // Low-frequency advection bends the cellular mesh instead of translating a
    // static bitmap. The convective brightness of each cell evolves smoothly.
    float flowA = field(p * 5.5 + seed + vec3(uTime * 0.015, 0, 0));
    float flowB = field(p * 11.3 + seed * 0.47 + vec3(0, uTime * 0.027, 0));
    vec3 stream = vec3(flowA - 0.5, flowB - 0.5, sin(p.y * 7.0 + flowA * 5.0 + uTime * 0.035) * 0.28);
    vec3 flowing = normalize(p + stream * 0.028);
    // Blue-white disks are often viewed at a smaller apparent size. Larger,
    // gentler cells retain coherent texture instead of sub-pixel television grain.
    vec3 cells = convectionCells(flowing * mix(17.0, 46.0, red) + seed);
    float aa = max(0.007, fwidth(cells.y) * 0.85);
    float lanes = smoothstep(0.019 - aa, 0.13 + aa, cells.y);
    float centers = 1.0 - smoothstep(0.17, 0.65, cells.x);
    float turnover = 0.82 + 0.18 * sin(uTime * 0.48 + cells.z * 19.0);
    float interiors = lanes * (0.61 + 0.25 * centers) * turnover;
    float network = field(flowing * 23.0 + seed * 1.31);
    float filaments = smoothstep(0.38, 0.48, network) * (1.0 - smoothstep(0.53, 0.65, network));
    float microScale = mix(48.0, 148.0, red);
    float micro = field(flowing * microScale + seed * 0.81 + vec3(uTime * 0.036, 0, 0));
    float microWeight = 1.0 - smoothstep(0.48, 1.8, length(fwidth(flowing * microScale)));
    float height = mix(interiors * 0.58 + network * 0.34 + micro * 0.08 * microWeight,
                       interiors * 0.77 + filaments * 0.13 + micro * 0.10 * microWeight, red);
    vec3 relief = reliefNormal(height, mix(0.40, 1.9, red));
    float reliefLight = max(0.0, dot(relief, normalize(vec3(-0.38, 0.66, 0.9))));
    float detailLight = mix(0.985 + 0.02 * reliefLight, 0.85 + 0.18 * reliefLight, red);

    float magnetic = field(p * 3.5 + seed * 0.28 + vec3(0, uTime * 0.008, 0));
    float penumbra = smoothstep(0.63, 0.77, magnetic);
    float darkCore = smoothstep(0.76, 0.86, magnetic);
    float spotStrength = mix(0.035, 0.48, red) * penumbra + mix(0.04, 0.34, red) * darkCore;
    float brightness = mix(0.88 + interiors * 0.82 + centers * lanes * 0.22 + (network - 0.5) * 0.20,
                           0.29 + interiors * 1.02 + centers * lanes * 0.19 + filaments * 0.085, red);
    brightness *= mix(1.0, 0.96, red) + (micro - 0.5) * mix(0.045, 0.16, red) * microWeight;
    brightness *= (1.0 - spotStrength) * detailLight;

    // Cool stars keep a broad blue-white range rather than clipping to a flat
    // white disk. Red stars retain warm cell interiors and darker magnetic areas.
    vec3 spectral = mix(mix(uColor, vec3(1.0), 0.24), uColor, red);
    vec3 warmCenters = mix(vec3(0.07, 0.09, 0.11), vec3(0.24, 0.068, 0.012), red);
    float limb = mix(0.62 + 0.38 * pow(face, 0.48), 0.37 + 0.63 * pow(face, 0.65), red);
    finalColor = spectral * brightness * limb + warmCenters * centers * lanes * 0.13;
  #endif

  gl_FragColor = vec4(max(vec3(0.0), finalColor), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const coronaFragment = `
uniform vec3 uColor;
uniform float uTime;
uniform float uOpacity;
uniform float uPower;
uniform float uBrown;
uniform float uScale;
uniform float uCool;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
${fieldFunctions}
void main() {
  vec3 p = normalize(vLocal);
  float face = abs(dot(normalize(vNormal), normalize(vView)));
  float flow = field(p * 8.0 + vec3(0, uTime * 0.028, 4.7));
  float fine = field(p * 37.0 + vec3(uTime * 0.017, 0, 3.1));
  float filaments = 0.34 + 0.66 * smoothstep(0.30, 0.77, fine * 0.67 + flow * 0.33);
  float atmospheric = mix(filaments, 0.75 + flow * 0.25, uBrown);
  float projectedRadius = sqrt(max(0.0, 1.0 - face * face)) * uScale;
  float surfaceRim = smoothstep(0.73, 0.98, projectedRadius);
  float outsideFalloff = exp(-max(0.0, projectedRadius - 1.0) * mix(16.0, 9.0, uCool));
  float silhouetteFade = smoothstep(0.0, 0.14, face);
  float coronaProfile = mix(pow(1.0 - face, uPower), surfaceRim * outsideFalloff * silhouetteFade, uCool);
  float alpha = coronaProfile * uOpacity * atmospheric;
  vec3 glowColor = mix(uColor, vec3(1.0), uCool * 0.24) * mix(1.0, 1.35, uCool);
  gl_FragColor = vec4(glowColor, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const resolveTime = value => typeof value === 'function' ? value() : value ?? { value: 0 };
const register = (own, resource) => { if (typeof own === 'function') own(resource); return resource; };

/**
 * Drop-in replacement for flight-worlds.js star material construction:
 * enhancedStarMaterial({color,brown,seed,timeUniform,own}).
 * timeUniform may be the existing factory or an existing {value:seconds} object.
 * The returned material is registered with own exactly once. Weather meshes,
 * sphere rotations and all caller-owned time/lighting controls remain separate.
 */
export function enhancedStarMaterial({ color = '#ff632b', brown = false, seed = 1, timeUniform, own } = {}) {
  const material = new THREE.ShaderMaterial({
    name: brown ? 'layered-brown-dwarf-atmosphere' : 'cellular-stellar-photosphere',
    defines: { BROWN_DWARF: brown ? 1 : 0 },
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: resolveTime(timeUniform),
      uSeed: { value: Number(seed) || 0 },
      uBrown: { value: brown ? 1 : 0 },
    },
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    toneMapped: true,
    side: THREE.FrontSide,
  });
  material.userData.interpretation = 'Exaggerated procedural surface detail, not an observed stellar map';
  return register(own, material);
}

/**
 * Optional replacement for the existing sphere shells / billboard halo. Uses
 * only genuine concentric meshes: no plane facing the camera. If used, avoid
 * stacking the old halos as well. Root can preserve existing weather hooks.
 * motions/cameraUpdates are accepted for the caller's current helper signature;
 * these shells need no camera callback or independent rigid-body spin.
 */
export function addDetailedCorona(parent, sphere, radius, color, own, timeUniform, motions, cameraUpdates, { brown = false } = {}) {
  const corona = new THREE.Group();
  corona.name = brown ? 'layered-thermal-haze' : 'layered-stellar-corona';
  if (sphere) {
    corona.position.copy(sphere.position);
    corona.quaternion.copy(sphere.quaternion);
    corona.scale.copy(sphere.scale);
  }
  const tint = new THREE.Color(color);
  const cool = !brown && tint.r <= tint.b * 1.18;
  const layers = brown
    ? [[1.011, 0.12, 3.2], [1.032, 0.046, 4.0], [1.062, 0.012, 5.0]]
    : cool ? [[1.028, 0.18, 3.2], [1.14, 0.15, 3.7], [1.30, 0.065, 4.4]]
      : [[1.018, 0.29, 3.6], [1.074, 0.09, 4.3], [1.18, 0.025, 5.1]];
  for (const [scale, opacity, power] of layers) {
    const material = register(own, new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) }, uTime: resolveTime(timeUniform),
        uOpacity: { value: opacity }, uPower: { value: power }, uBrown: { value: brown ? 1 : 0 },
        uScale: { value: scale }, uCool: { value: cool ? 1 : 0 },
      },
      vertexShader: surfaceVertex, fragmentShader: coronaFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      side: cool ? THREE.BackSide : THREE.FrontSide, toneMapped: true,
    }));
    const geometry = register(own, new THREE.SphereGeometry(radius * scale, 48, 32));
    corona.add(new THREE.Mesh(geometry, material));
  }
  parent.add(corona);
  return corona;
}

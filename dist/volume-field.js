import * as THREE from './vendor/three.module.js';

// Integrate light through a closed 3D density field. The box is only a ray-entry
// boundary: no image is displayed on its faces. Noise is sampled in XYZ space.
let noiseTexture = null;
function getNoiseTexture() {
  if (noiseTexture) return noiseTexture;
  const size = 64, data = new Uint8Array(size ** 3);
  let seed = 0x81f3b621;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = seed >>> 24;
  }
  noiseTexture = new THREE.Data3DTexture(data, size, size, size);
  noiseTexture.format = THREE.RedFormat;
  noiseTexture.type = THREE.UnsignedByteType;
  noiseTexture.minFilter = THREE.LinearFilter;
  noiseTexture.magFilter = THREE.LinearFilter;
  noiseTexture.wrapS = noiseTexture.wrapT = noiseTexture.wrapR = THREE.RepeatWrapping;
  noiseTexture.unpackAlignment = 1;
  noiseTexture.needsUpdate = true;
  // One small shared immutable noise texture, retained for the application.
  return noiseTexture;
}

export function addVolume(parent, { name = 'three-dimensional-density', halfSize,
  own, timeUniform, cameraUpdates, field, uniforms = {}, steps = 96,
  extinction = 1, emission = 1, renderOrder = 2, emissiveDensity = false }) {
  const compact = window.innerWidth < 600;
  const marchSteps = compact ? Math.max(40, Math.round(steps * .5)) : steps;
  const material = own(new THREE.ShaderMaterial({
    name: 'integrated-volume-light',
    defines: { VOLUME_STEPS: marchSteps, VOLUME_EMISSIVE: emissiveDensity ? 1 : 0 },
    transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: emissiveDensity ? THREE.CustomBlending : THREE.NormalBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendEquation: THREE.AddEquation, forceSinglePass: true,
    uniforms: { uCamera: { value: new THREE.Vector3() },
      uBounds: { value: new THREE.Vector3(...halfSize) },
      uNoise: { value: getNoiseTexture() },
      uTime: timeUniform(), uExtinction: { value: extinction },
      uEmission: { value: emission }, ...uniforms },
    vertexShader: `varying vec3 vVolumePosition;
      void main(){vVolumePosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `precision highp sampler3D;
      uniform sampler3D uNoise;uniform vec3 uCamera;uniform vec3 uBounds;
      uniform float uTime;uniform float uExtinction;uniform float uEmission;
      varying vec3 vVolumePosition;
      float volumeNoise(vec3 p){
        vec3 cell=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return texture(uNoise,(cell+f+.5)/64.0).r;
      }
      float volumeFbm(vec3 p){return volumeNoise(p)*.57+volumeNoise(p*2.03+vec3(13.1,7.7,3.9))*.28+volumeNoise(p*4.09+vec3(7.3,15.2,9.8))*.15;}
      ${field}
      void main(){
        vec3 direction=normalize(vVolumePosition-uCamera);
        vec3 inv=1.0/(direction+vec3(.0000001));
        vec3 a=(-uBounds-uCamera)*inv,b=(uBounds-uCamera)*inv;
        vec3 nearPoint=min(a,b),farPoint=max(a,b);
        float entry=max(0.0,max(nearPoint.x,max(nearPoint.y,nearPoint.z)));
        float exit=min(farPoint.x,min(farPoint.y,farPoint.z));
        if(exit<=entry)discard;
        float segment=(exit-entry)/float(VOLUME_STEPS);
        float jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
        float distance=entry+segment*jitter;
        vec3 sum=vec3(0.0);float transmission=1.0;
        for(int i=0;i<VOLUME_STEPS;i++){
          vec3 position=uCamera+direction*distance;
          vec4 sampleValue=sampleVolume(position);
          float opacity=1.0-exp(-max(0.0,sampleValue.a)*segment*uExtinction);
          #if VOLUME_EMISSIVE == 1
            sum+=transmission*segment*max(vec3(0.0),sampleValue.rgb)*uEmission;
          #else
            sum+=transmission*opacity*max(vec3(0.0),sampleValue.rgb)*uEmission;
          #endif
          transmission*=1.0-opacity;
          if(transmission<.006)break;
          distance+=segment;
        }
        float alpha=1.0-transmission;
        #if VOLUME_EMISSIVE == 1
          if(alpha<.0015&&max(sum.r,max(sum.g,sum.b))<.00003)discard;
          gl_FragColor=vec4(sum,alpha);
        #else
          if(alpha<.0015)discard;
          gl_FragColor=vec4(sum/max(alpha,.0001),alpha);
        #endif
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  const mesh = new THREE.Mesh(own(new THREE.BoxGeometry(...halfSize.map(x => x * 2))), material);
  mesh.name = name; mesh.renderOrder = renderOrder; mesh.frustumCulled = false;
  mesh.userData.renderTechnique = 'volumetric-ray-integration';
  mesh.userData.marchSteps = marchSteps;
  parent.add(mesh);
  const observer = new THREE.Vector3();
  cameraUpdates.push(cameraPosition => {
    mesh.updateWorldMatrix(true, false);
    observer.copy(cameraPosition); mesh.worldToLocal(observer);
    material.uniforms.uCamera.value.copy(observer);
  });
  return mesh;
}

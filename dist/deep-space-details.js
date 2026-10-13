import * as THREE from './vendor/three.module.js';
import { addVolume } from './volume-field.js?v=13.1';

const noise=`float h(vec3 p){p=fract(p*.3183099+vec3(.13,.27,.41));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float f(vec3 p){return n(p)*.54+n(p*2.03+11.7)*.28+n(p*4.09+7.3)*.13+n(p*8.2)*.05;}`;

export function addDetailedIce(group,{own,rotations}){
  const geometry=own(new THREE.IcosahedronGeometry(3.4,5)),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const shape=.86+.055*Math.sin(x*2.3+y*.8)+.06*Math.sin(z*2.8-y*1.9)+.035*Math.cos(x*7.3-z*3.1);
    p.setXYZ(i,x*shape*1.2,y*shape*.85,z*shape);}
  geometry.computeVertexNormals();
  const material=own(new THREE.MeshPhongMaterial({color:'#b0b5b8',shininess:7,specular:'#1c2529',emissive:'#071018',emissiveIntensity:.3}));
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vIcePosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvIcePosition=position;');
    shader.fragmentShader=`varying vec3 vIcePosition;${noise}\n`+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float ridges=f(vIcePosition*7.0);float grains=n(vIcePosition*103.0);float cracks=pow(1.0-abs(sin(vIcePosition.x*9.0+vIcePosition.y*5.0+f(vIcePosition*4.0)*7.0)),13.0);
      diffuseColor.rgb*=mix(vec3(.12,.13,.145),vec3(1.0,.91,.77),smoothstep(.24,.71,ridges));diffuseColor.rgb*=.82+grains*.35;diffuseColor.rgb*=1.0-cracks*.52;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec3 bump=vec3(dFdx(ridges),dFdy(ridges),0.0);normal=normalize(normal+bump*.55);`);
  };
  material.customProgramCacheKey=()=> 'illustrative-icy-body-v9';
  const ice=new THREE.Mesh(geometry,material);ice.position.set(1.7,.8,4.5);ice.rotation.z=.33;ice.name='enlarged-illustrative-icy-body';group.add(ice);
  rotations.push({object:ice,y:.021,x:.008});return ice;
}

export function addInterstellarContext(group,{own,timeUniform}){
  const map={value:null},ready={value:0};let disposed=false;
  own({dispose(){disposed=true;}});
  const texture=own(new THREE.TextureLoader().load(new URL('./assets/observations/milky-way-panorama.jpg',import.meta.url).href,loaded=>{if(disposed){loaded.dispose();return;}loaded.colorSpace=THREE.SRGBColorSpace;loaded.anisotropy=4;map.value=loaded;ready.value=1;group.userData.observationTexture='interstellar';},undefined,()=>{group.userData.observationTexture='unavailable';}));
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;map.value=texture;
  const material=own(new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    uniforms:{uTime:timeUniform(),uMap:map,uReady:ready},
    vertexShader:`varying vec3 vDirection;varying vec2 vUv;void main(){vUv=uv;vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec3 vDirection;varying vec2 vUv;uniform float uTime;uniform sampler2D uMap;uniform float uReady;${noise}
      void main(){vec3 p=normalize(vDirection);float band=exp(-pow((p.y+p.x*.26+.05)*8.0,2.0));
        float structure=f(p*65.0);float ridges=pow(f(p*120.0+structure*2.0),2.0);
        float dust=smoothstep(.33,.68,f(p*34.0))*band;
        vec3 glow=mix(vec3(.035,.032,.027),vec3(.022,.036,.056),structure)*band*(.3+structure*1.4+ ridges*.5);
        glow*=1.0-dust*.8;vec3 sky=uReady>.5?texture2D(uMap,vUv).rgb*.54:vec3(.0006,.001,.0017)+glow;
        gl_FragColor=vec4(sky,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}));
  const dome=new THREE.Mesh(own(new THREE.SphereGeometry(95,80,48)),material);dome.rotation.set(0,Math.PI*.5,.14);dome.name='distant-milky-way-and-dust';dome.renderOrder=-9;group.add(dome);
}

export function addAccretionDetail(group,disk,{own,timeUniform,cameraUpdates}){
  // A flared three-dimensional gas density, including the full bright disk.
  // No disk sheets or camera-facing plane: the ray traverses finite gas depth.
  const gas=addVolume(disk,{
    name:'finite-depth-hot-accretion-flow',halfSize:[8.25,8.25,1.85],
    own,timeUniform,cameraUpdates,steps:112,extinction:1.05,emission:1.5,renderOrder:3,
    field:`vec4 sampleVolume(vec3 p){
      float r=length(p.xy);if(r<2.30||r>8.15)return vec4(0.0);
      float inner=smoothstep(2.30,2.61,r),outer=1.0-smoothstep(5.5,8.15,r);
      float a=atan(p.y,p.x),omega=.56/pow(max(.9,r/2.5),1.5);
      float orbital=a-uTime*omega;
      vec3 advected=vec3(cos(orbital)*r,sin(orbital)*r,p.z*2.4);
      float broad=volumeNoise(advected*.78+vec3(2.7,8.1,4.5));
      float strands=volumeNoise(vec3(r*4.8,cos(orbital)*2.5+1.7,sin(orbital)*2.5+p.z*8.0));
      float filaments=.36+.64*smoothstep(.28,.78,strands);
      float corrugation=(broad-.5)*.095;
      float height=.235+r*.028;
      float vertical=exp(-pow((p.z-corrugation)/height,2.0));
      float heat=1.0-smoothstep(2.45,7.2,r);
      float density=inner*outer*vertical*(.52+.48*broad)*filaments*(.34+heat*.96);
      vec3 color=mix(vec3(.62,.065,.007),vec3(2.9,1.75,.72),pow(heat,2.1));
      color*=.83+.17*sin(a+.5);
      return vec4(color,density);
    }`,
  });
  // A weak closed spherical light field gives a soft curved glow from every
  // view. It is a visual metaphor for lensing, not gas at a measured radius or
  // a general-relativistic tracing of photons. The opaque shadow remains separate.
  const lens=addVolume(group,{
    name:'curved-lensing-like-light-volume',halfSize:[2.70,2.70,2.70],
    own,timeUniform,cameraUpdates,steps:88,extinction:1.0,emission:1.2,renderOrder:4,
    field:`vec4 sampleVolume(vec3 p){
      float r=length(p);if(r<2.18||r>2.62)return vec4(0.0);
      float ring=exp(-pow((r-2.31)/.073,2.0));
      float density=ring*.34;
      return vec4(vec3(1.55,.91,.37),density);
    }`,
  });
  group.userData.accretionInterpretation='Finite-depth gas illustration and lensing-like glow; no exact general-relativistic photon tracing';
  return{gas,lens};
}

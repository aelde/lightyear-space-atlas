import * as THREE from './vendor/three.module.js';
import { addVolume } from './volume-field.js?v=13.1';

// A 3D stellar-density interpretation, not a reconstruction of catalogue stars.
// Photos inform colour and small-scale morphology inside a continuous volume;
// they are never rendered on a surface, box face or camera-facing sheet.
const TAU = Math.PI * 2;
const finish = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
const galaxyField = `
uniform float uIrregular;
uniform sampler2D uObservation;
uniform float uObservationStrength;
uniform vec2 uObservationScale;
uniform float uObservationRotation;
uniform float uObservationLod;
uniform float uStellarEmission;
float gaussian3(vec3 p,vec3 scale){
  vec3 q=p/scale;return exp(-dot(q,q));
}
vec4 sampleVolume(vec3 p){
  vec2 xy=p.xy;float r=length(xy);
  float bound;
  if(uIrregular>.5){
    bound=(1.-smoothstep(13.,15.,abs(p.x)))*(1.-smoothstep(9.8,12.,abs(p.y)))
      *(1.-smoothstep(3.6,4.4,abs(p.z)));
  }else{
    bound=(1.-smoothstep(14.2,16.85,r))*(1.-smoothstep(3.,3.8,abs(p.z)));
  }
  if(bound<.0002)return vec4(0.);
  float a=r>.0001?atan(p.y,p.x):0.;
  float warp=sin(a*2.+r*.24)*.15*smoothstep(3.,15.,r);
  float z=p.z-warp;
  float diskStars,bulgeStars,nursery,dust,base;
  vec3 oldColour,youngColour=vec3(.56,.68,.84);
  float coarse,fine;
  if(uIrregular>.5){
    // The bar and knots have separate scale heights and irregular XYZ centres.
    vec3 barP=vec3(p.x+.21*p.y,p.y-.085*p.x,p.z-.10*sin(p.x*.36));
    float bar=gaussian3(barP,vec3(6.2,1.18,.78));
    float knots=gaussian3(p-vec3(-5.8,1.5,.55),vec3(2.2,1.5,.92));
    knots+=gaussian3(p-vec3(2.6,-.2,-.55),vec3(2.2,1.35,.78))*.66;
    knots+=gaussian3(p-vec3(5.5,-1.7,.45),vec3(2.3,1.5,.87))*.55;
    knots+=gaussian3(p-vec3(.5,-4.,.22),vec3(2.3,1.8,.85))*.49;
    float outskirts=gaussian3(p,vec3(8.6,5.2,1.15));
    base=bar*.98+knots*.36+outskirts*.18;
    if(base<.0005)return vec4(0.);
    coarse=volumeNoise(p*.72+vec3(19.,4.,11.)+vec3(0.,uTime*.0015,0.));
    fine=volumeFbm(vec3(p.xy*3.5,p.z*4.8)+vec3(7.,13.,2.)+vec3(uTime*.002,0.,0.));
    diskStars=base*(.46+coarse*.63)*(.38+fine*.91);
    bulgeStars=0.;
    oldColour=mix(vec3(.49,.54,.62),vec3(1.11,.65,.28),clamp(bar*.85,0.,1.));
    vec3 t=p-vec3(-4.35,2.5,.75);
    float cloud=gaussian3(t,vec3(2.2,1.55,.93));
    float filament=pow(1.-abs(2.*volumeFbm(t*vec3(1.7,2.8,3.9)+vec3(11.,3.,17.)+vec3(0.,uTime*.003,0.))-1.),4.);
    float cavity=1.-gaussian3(t-vec3(.24,.05,.08),vec3(.62,.48,.42))*.76;
    nursery=cloud*(.08+filament*.98)*cavity*.91;
    float woven=pow(1.-abs(2.*fine-1.),5.);
    float largeCloud=smoothstep(.46,.73,coarse);
    dust=(bar*.57+knots*.49+cloud*.64)*(woven*1.65+largeCloud*.61)
      *exp(-pow(z/.42,2.));
  }else{
    float radial=exp(-r/7.6);
    float thin=exp(-pow(z/(.38+r*.014),2.));
    float thick=exp(-pow(z/1.12,2.));
    bulgeStars=gaussian3(p,vec3(3.1,2.8,1.85))*.83;
    base=radial*(thin*1.27+thick*.12)+bulgeStars;
    if(base<.0005)return vec4(0.);
    coarse=volumeNoise(p*.69+vec3(2.,17.,9.)+vec3(0.,uTime*.001,0.));
    fine=volumeFbm(vec3(p.xy*3.8,p.z*5.4)+vec3(13.,3.,7.)+vec3(uTime*.0015,0.,0.));
    float phase=a-1.84*log(r+.72)+(coarse-.5)*.19;
    float arms=exp(-pow(sin(phase)*2.0,2.));
    float branches=exp(-pow(sin(phase*2.+.73+(fine-.5)*.36)*3.1,2.));
    // Stellar arms remain broad and low contrast; extinction carries the
    // narrow filaments. Separate scales keep this from becoming neon tubes.
    diskStars=radial*(thin*1.11+thick*.13)*(.56+arms*.38+branches*.17)
      *(.35+coarse*.31+fine*.69);
    oldColour=mix(vec3(.51,.55,.62),vec3(1.13,.71,.33),exp(-r*r/36.));
    float birth=radial*thin*smoothstep(4.2,7.,r)*smoothstep(.6,.76,fine);
    nursery=birth*.19;
    // Narrow, interrupted dust filaments have their own vertical thickness.
    // They absorb the integrated light rather than painting black screen rings.
    float lane=exp(-pow((sin(phase)-.1)/.039,2.));
    float branch=exp(-pow((sin(phase+.12)+.065)/.026,2.));
    float lace=exp(-pow((sin(phase-.17)-.13)/.017,2.));
    float broken=smoothstep(.26,.69,volumeNoise(p*2.15+vec3(12.,6.,4.)));
    float radialDust=smoothstep(1.8,3.5,r)*(1.-smoothstep(13.2,16.4,r));
    float ringR=r+sin(a*3.+.34)*.27+(coarse-.5)*.66;
    float rings=exp(-pow((ringR-8.45)/.28,2.))*.83
      +exp(-pow((ringR-5.25)/.19,2.))*.44
      +exp(-pow((ringR-11.35)/.22,2.))*.36;
    float diffuse=smoothstep(.51,.7,fine)*(.11+coarse*.25);
    dust=((lane*2.75+branch*1.55+lace*.86+ rings*1.37)*(.19+broken*.81)+diffuse)
      *radialDust*exp(-pow((z-.055*sin(p.x*.7))/.29,2.));
  }
  vec3 referenceColour=oldColour;
  float referenceStructure=1.;
  if(uObservationStrength>.001){
    float c=cos(uObservationRotation),s=sin(uObservationRotation);
    vec2 referenceP=mat2(c,-s,s,c)*xy;
    // M31's supplied mosaic already contains its observed inclination. Its
    // minor axis is deprojected when used to inform the modeled circular disk;
    // the new 3D viewing angle must not compress the photograph a second time.
    if(uIrregular<.5)referenceP.y*=.56;
    vec2 uv=referenceP/uObservationScale*.5+.5;
    if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.)))){
      // SRGB8 is decoded by hardware. A filtered mip and bounded normalized
      // chroma preserve dust detail without extruding foreground stellar peaks.
      vec3 observed=textureLod(uObservation,uv,uObservationLod).rgb;
      float luminance=dot(observed,vec3(.2126,.7152,.0722));
      // Bounded imprint only: background stars and mosaic edges cannot turn
      // into a rectangular or triangular emitting boundary in this volume.
      float weight=uObservationStrength*smoothstep(.004,.045,luminance)*.56;
      vec3 chroma=clamp(observed/max(luminance,.045),vec3(.23),vec3(1.65));
      referenceColour=mix(oldColour,chroma*.59+oldColour*.27,weight);
      float expected=.06+.65*exp(-r/3.2);
      float morphology=clamp(luminance/expected,.38,1.38);
      referenceStructure=mix(1.,morphology,uObservationStrength*.44);
      if(uIrregular<.5){
        float deficit=1.-smoothstep(.38,.86,morphology);
        dust+=deficit*uObservationStrength*.68*smoothstep(3.8,5.5,r)
          *(1.-smoothstep(12.4,15.1,r))*exp(-pow(z/.31,2.));
      }
    }
  }
  diskStars*=referenceStructure;
  vec3 bulbColour=vec3(1.19,.75,.34);
  vec3 gasColour=mix(vec3(1.08,.22,.34),vec3(.29,.53,.84),fine*.56);
  vec3 stellarEmission=diskStars*referenceColour+bulgeStars*bulbColour+nursery*gasColour;
  // Unresolved starlight is optically thin: it emits without absorbing itself.
  // Only intervening dust reduces transmission. RGB is linear emission per
  // local-world unit for addVolume's emissive-density integration mode.
  return vec4(stellarEmission*uStellarEmission*bound,max(0.,dust)*bound);
}
`;

export function addDetailedGalaxy(group, { irregular = false, own, timeUniform, random, particleCloud, cameraUpdates,
  observationTexture = null, observationScale = [16.7,16.7], observationRotation = 0, observationStrength = .85 }) {
  const galaxy=new THREE.Group();
  galaxy.name=irregular?'lmc-asymmetric-populations':'andromeda-populations-and-dust';
  galaxy.rotation.set(irregular ? .35 : .93,irregular ? -.18 : .07,irregular ? -.21 : -.29);
  group.add(galaxy);
  const compact=typeof window!=='undefined'&&window.innerWidth<600;
  const radius=irregular?14.5:18.2,cameraDistance=irregular?29:40;
  const ready=()=>Boolean(observationTexture?.image?.width&&observationTexture?.image?.height);
  const strength=observationTexture?Math.max(0,Math.min(1,Number.isFinite(observationStrength)?observationStrength:.85)):0;
  const observationUniform={value:ready()?strength:0};
  const observationLod={value:3};
  if(observationTexture){observationTexture.colorSpace=THREE.SRGBColorSpace;if(ready())observationTexture.needsUpdate=true;own(observationTexture);}
  cameraUpdates.push(()=>{
    observationUniform.value=ready()?strength:0;
    if(ready())observationLod.value=Math.max(3,Math.log2(Math.max(observationTexture.image.width,observationTexture.image.height)/512));
  });
  const volume=addVolume(galaxy,{
    name:irregular?'lmc-stellar-bar-and-nursery-volume':'m31-starlight-bulge-and-dust-volume',
    halfSize:irregular?[15,12,4.4]:[17,17,3.8],
    own,timeUniform,cameraUpdates,field:galaxyField,steps:112,extinction:1,emission:1,emissiveDensity:true,renderOrder:2,
    uniforms:{
      uIrregular:{value:irregular?1:0},
      uObservation:{value:observationTexture},
      uObservationStrength:observationUniform,
      uObservationScale:{value:new THREE.Vector2(...observationScale)},
      uObservationRotation:{value:observationRotation},uObservationLod:observationLod,
      uStellarEmission:{value:irregular?.092:.065}
    }
  });
  volume.userData.structure=irregular?'asymmetric stellar bar, clumps, gas cavities and dust':'thin and thick stellar disks, diffuse bulge and dust extinction';
  volume.userData.observationRole='colour and bounded morphology reference inside modeled XYZ density';
  galaxy.userData.renderTechnique='volumetric-ray-integration-with-native-stellar-populations';
  const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(.0001,random())))*Math.cos(TAU*random());
  const warp=(x,y)=>{const r=Math.hypot(x,y);return Math.sin(Math.atan2(y,x)*2+r*.24)*.15*Math.max(0,Math.min(1,(r-3)/12));};
  const faint=[],bright=[],clumps=irregular?[[-5.8,1.5,.55],[-1,1.1,-.2],[2.5,-.1,-.6],[5.3,-1.9,.8],[.4,-4,.25]]:null;
  const total=irregular?(compact?10200:21600):(compact?11400:23800);
  for(let i=0;i<total;i++){
    let x,y,z;
    if(irregular){
      const chance=random(),clump=clumps[Math.floor(random()*clumps.length)];
      if(chance<.46){x=gaussian()*4.6;y=gaussian()*1.1+x*.085;z=gaussian()*.56+.1*Math.sin(x*.36);}
      else if(chance<.82){x=clump[0]+gaussian()*1.65;y=clump[1]+gaussian()*1.1;z=clump[2]+gaussian()*.65;}
      else{x=gaussian()*4.9;y=gaussian()*2.25;z=gaussian()*.9;}
    }else{
      const chance=random();
      if(chance<.15){x=gaussian()*1.62;y=gaussian()*1.47;z=gaussian()*.86;}
      else{
        const r=1.8+Math.pow(random(),.76)*13.3;
        let angle;
        if(chance<.57){
          const branch=random(),offset=branch<.34?0:branch<.68?Math.PI:branch<.79?1.2:branch<.9?4.4:2.25;
          angle=1.84*Math.log(r+.72)+offset+gaussian()*(.16+r*.016);
        }else angle=random()*TAU;
        x=Math.cos(angle)*r+gaussian()*.14;y=Math.sin(angle)*r+gaussian()*.14;
        z=gaussian()*(.24+r*.019)+warp(x,y);
      }
    }
    const r=Math.hypot(x,y),warm=irregular?Math.exp(-y*y/3.-x*x/42.):Math.exp(-r*r/22.);
    const choice=random(),colour=warm>.45?(choice<.65?'#f0c487':'#e7ca9f'):
      choice<.48?'#ded1bb':choice<.8?'#c7c9ce':choice<.94?'#bcc7d8':'#9fbde0';
    const luminosity=random(),coreDimming=irregular?1:.43+.57*Math.min(1,r/3.3);
    const point={position:[x,y,z],color:colour,size:.044+luminosity**3*.097,alpha:(.11+luminosity**2*.47)*coreDimming};
    if(i%67===0){point.size=.079+random()**4*.15;point.alpha=(.32+random()*.39)*coreDimming;bright.push(point);}
    else faint.push(point);
  }
  if(irregular){
    const nurseryCount=compact?320:720;
    for(let i=0;i<nurseryCount;i++)faint.push({
      position:[-4.35+gaussian()*1.05,2.5+gaussian()*.72,.75+gaussian()*.55],
      color:i%7?'#a1bdd3':'#dca3ad',size:.034+random()**3*.09,alpha:.1+random()*.2
    });
  }
  const cloud=(list,options,name,order)=>{
    const result=particleCloud(galaxy,list,options);result.name=name;result.renderOrder=order;
    if(!result.material.fragmentShader.includes('tonemapping_fragment')){
      result.material.fragmentShader=result.material.fragmentShader.replace('#include <colorspace_fragment>',finish);
      result.material.needsUpdate=true;
    }
    result.userData.structure='native XYZ stellar population';
    return result;
  };
  cloud(faint,{pointScale:670,maxSize:2.3},'subpixel-stellar-population-through-volume',1);
  cloud(bright,{pointScale:625,maxSize:2.9},'sparse-resolved-foreground-stars',3);
  return {radius,cameraDistance};
}

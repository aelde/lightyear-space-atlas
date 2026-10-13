import * as THREE from './vendor/three.module.js';

// A depth-bearing artist model: population gradients, unresolved starlight and
// dust morphology are illustrative, not catalogue positions or measured flux.
const TAU = Math.PI * 2;
const finish = '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
const noise = `
float hash3(vec3 p){p=fract(p*.3183099+vec3(.13,.27,.41));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=.57*noise3(p);p=p*2.03+13.1;v+=.28*noise3(p);p=p*2.01+7.7;return v+.15*noise3(p);}
`;
const diskVertex = `
varying vec3 vLocal;
void main(){vLocal=position;vec3 p=position;float r=length(p.xy);
 p.z+=sin(atan(p.y,p.x)*2.+r*.24)*.13*smoothstep(3.,15.,r);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}
`;
const morphology = `
float spiralPhase(vec2 p){float r=length(p);return atan(p.y,p.x)-1.84*log(r+.72);}
float knots(vec2 p){
 float k=exp(-dot(p-vec2(-5.8,1.5),p-vec2(-5.8,1.5))/5.5);
 k+=.85*exp(-dot(p-vec2(-1.,1.1),p-vec2(-1.,1.1))/5.);
 k+=1.15*exp(-dot(p-vec2(5.3,-1.9),p-vec2(5.3,-1.9))/4.);
 k+=.6*exp(-dot(p-vec2(.4,-4.),p-vec2(.4,-4.))/7.);
 return k;}
float bar(vec2 p){vec2 q=vec2(p.x+.22*p.y,p.y-.08*p.x);return exp(-q.x*q.x/35.-q.y*q.y/1.8);}
`;

export function addDetailedGalaxy(group, { irregular = false, own, timeUniform, random, particleCloud, cameraUpdates,
  observationTexture = null, observationScale = [16.7,16.7], observationRotation = 0, observationStrength = .85 }) {
  const galaxy = new THREE.Group();
  galaxy.name = irregular ? 'lmc-asymmetric-populations' : 'andromeda-populations-and-dust';
  galaxy.rotation.set(irregular ? .35 : .93, irregular ? -.18 : .07, irregular ? -.21 : -.29);
  group.add(galaxy);
  const radius = irregular ? 14.5 : 18.2;
  const cameraDistance = irregular ? 32 : 40;
  const time = timeUniform();
  const observedStrength = observationTexture ? Math.max(0,Math.min(1,Number.isFinite(observationStrength)?observationStrength:.85)) : 0;
  const observationReady = () => Boolean(observationTexture?.image?.width && observationTexture?.image?.height);
  const observationUniform = {value:observationReady()?observedStrength:0};
  if (observationTexture) { observationTexture.colorSpace=THREE.SRGBColorSpace; if(observationReady())observationTexture.needsUpdate=true; own(observationTexture); }
  cameraUpdates.push(()=>{observationUniform.value=observationReady()?observedStrength:0;});
  const normal = () => ({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
    forceSinglePass: true, blending: THREE.NormalBlending });
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(.0001, random()))) * Math.cos(TAU * random());
  const warp = (x,y) => {
    const r = Math.hypot(x,y);
    return Math.sin(Math.atan2(y,x)*2+r*.24)*.13*Math.max(0,Math.min(1,(r-3)/12));
  };
  const points = (parent, list, options, name, order) => {
    const cloud = particleCloud(parent, list, options);
    cloud.name = name; cloud.renderOrder = order;
    // Reuse the existing cloud implementation, adding its missing output transform.
    if (!cloud.material.fragmentShader.includes('tonemapping_fragment')) {
      cloud.material.fragmentShader = cloud.material.fragmentShader.replace('#include <colorspace_fragment>', finish);
      cloud.material.needsUpdate = true;
    }
    return cloud;
  };

  const geometry = own(irregular ? new THREE.PlaneGeometry(29,23,64,40) : new THREE.RingGeometry(.02,16.7,192,32));
  const starlight = own(new THREE.ShaderMaterial({
    ...normal(), vertexShader: diskVertex,
    uniforms: { uTime: time, uIrregular: { value: irregular ? 1 : 0 },
      uObservation:{value:observationTexture},uObservationStrength:observationUniform,
      uObservationScale:{value:new THREE.Vector2(...observationScale)},uObservationRotation:{value:observationRotation}},
    fragmentShader: `uniform float uTime;uniform float uIrregular;uniform sampler2D uObservation;
    uniform float uObservationStrength;uniform vec2 uObservationScale;uniform float uObservationRotation;
    varying vec3 vLocal;${noise}${morphology}
    void main(){vec2 p=vLocal.xy;float r=length(p);float n=fbm(vec3(p*.72,uTime*.005));
      float density;vec3 color;
      if(uIrregular>.5){
        float b=bar(p),k=knots(p);float faint=exp(-p.x*p.x/65.-p.y*p.y/21.);
        float mask=(1.-smoothstep(10.,14.4,abs(p.x)))*(1.-smoothstep(7.6,11.3,abs(p.y)));
        float grain=fbm(vec3(p*5.3,4.7));
        density=(b*.68+k*.29+faint*.15)*(.5+n*.65)*(.7+grain*.5)*mask;
        color=mix(vec3(.58,.57,.57),vec3(1.45,.95,.49),clamp(b*.72+k*.22,0.,1.));
      }else{
        float phase=spiralPhase(p)+(.5-n)*.34;
        float arm=exp(-pow(sin(phase)*1.4,2.));
        float secondary=exp(-pow(sin(phase*2.+.7)*2.7,2.));
        float grain=fbm(vec3(p*6.8,6.4));
        float clumps=pow(smoothstep(.35,.76,fbm(vec3(p*1.65,2.7))),2.);
        float disk=exp(-r/9.4)*(1.-smoothstep(12.,16.5,r));
        float core=exp(-r*r/1.7),halo=exp(-r*r/24.);
        density=disk*(.51+.16*arm+.06*secondary+.12*clumps)*(.58+n*.7)*(.64+grain*.64)+core*.62+halo*.23;
        color=mix(vec3(.65,.61,.53),vec3(1.6,.97,.40),clamp(core*.7+halo*.67,0.,1.));
        color=mix(color,vec3(.63,.72,.87),clumps*smoothstep(5.,12.,r)*.18);
      }
      if(uObservationStrength>.001){
        float c=cos(uObservationRotation),s=sin(uObservationRotation);
        vec2 uv=mat2(c,-s,s,c)*p/uObservationScale*.5+.5;
        if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.)))){
          vec3 observed=texture2D(uObservation,uv).rgb;
          float luminance=dot(observed,vec3(.2126,.7152,.0722));
          float photographicAlpha=smoothstep(.003,.022,luminance)*(1.-smoothstep(13.5,16.6,r));
          color=mix(color,observed*1.6,uObservationStrength*photographicAlpha);
          density=mix(density,max(density*.7,photographicAlpha*.95),uObservationStrength);
        }
      }
      gl_FragColor=vec4(color,clamp(density,0.,.9));${finish}
    }`
  }));
  const disk = new THREE.Mesh(geometry, starlight);
  disk.name = 'unresolved-starlight-disk'; disk.renderOrder = 1; galaxy.add(disk);

  if (!irregular) {
    const bulgeMaterial = own(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
      uniforms: { uTime: time, uCamera:{value:new THREE.Vector3(0,0,40)},uObservationStrength:observationUniform },
      vertexShader: `varying vec3 vLocal;
        void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float uTime;uniform vec3 uCamera;uniform float uObservationStrength;varying vec3 vLocal;${noise}
        void main(){vec3 ray=normalize(vLocal-uCamera);float travel=max(0.,-2.*dot(vLocal,ray));
          float column=0.;
          for(int i=0;i<16;i++){
            vec3 p=vLocal+ray*travel*(float(i)+.5)/16.;
            column+=exp(-dot(p,p)*4.5)*travel/16.;
          }
          float opacity=(1.-exp(-column*.75))*(1.-uObservationStrength*.72);
          float grain=fbm(vLocal*13.+vec3(0.,uTime*.005,0.));
          vec3 color=mix(vec3(1.15,.69,.29),vec3(1.65,1.07,.54),clamp(column,0.,1.));
          color*=.91+grain*.15;gl_FragColor=vec4(color,opacity);${finish}}
      `
    }));
    const bulge = new THREE.Mesh(own(new THREE.SphereGeometry(1,40,28)),bulgeMaterial);
    bulge.name='diffuse-three-dimensional-bulge';bulge.scale.set(3.65,3.25,1.05);bulge.renderOrder=2;galaxy.add(bulge);
    const bulgeCamera=new THREE.Vector3();
    cameraUpdates.push(cameraPosition=>{bulge.updateWorldMatrix(true,false);bulgeCamera.copy(cameraPosition);bulge.worldToLocal(bulgeCamera);bulgeMaterial.uniforms.uCamera.value.copy(bulgeCamera);});
  }

  // Most resolved stars are faint. Sparse bright stars add scale without making
  // every member a large, identical blue point or drawing a solid spiral tube.
  const faint=[],bright=[],foreground=[];
  const clumps=[[-5.8,1.5,.55],[-1,1.1,-.2],[2.5,-.1,-.6],[5.3,-1.9,.8],[.4,-4,.25]];
  const total=irregular ? 18000 : 21400;
  for(let index=0;index<total;index++){
    let x,y,z;
    if(irregular){
      const chance=random(),clump=clumps[Math.floor(random()*clumps.length)];
      if(chance<.46){x=gaussian()*4.6;y=gaussian()*1.1+x*.085;z=gaussian()*.45;}
      else if(chance<.82){x=clump[0]+gaussian()*1.65;y=clump[1]+gaussian()*1.1;z=clump[2]+gaussian()*.5;}
      else{x=gaussian()*4.9;y=gaussian()*2.25;z=gaussian()*.6;}
    }else{
      const chance=random();
      if(chance<.12){x=gaussian()*1.55;y=gaussian()*1.4;z=gaussian()*.65;}
      else{
        const r=1.8+Math.pow(random(),.76)*13.3;
        let angle;
        if(chance<.57){
          const branch=random();const offset=branch<.34?0:branch<.68?Math.PI:branch<.79?1.2:branch<.9?4.4:2.25;
          angle=1.84*Math.log(r+.72)+offset+gaussian()*(.16+r*.016);
        }else angle=random()*TAU;
        x=Math.cos(angle)*r+gaussian()*.14;y=Math.sin(angle)*r+gaussian()*.14;
        z=gaussian()*(.12+r*.017)+warp(x,y);
      }
    }
    const r=Math.hypot(x,y),warm=irregular ? Math.exp(-y*y/3.-x*x/42.) : Math.exp(-r*r/22.);
    const colorChoice=random();
    const color=warm>.45 ? (colorChoice<.65?'#f0c487':'#e7ca9f') :
      colorChoice<.48?'#ded1bb':colorChoice<.8?'#c7c9ce':colorChoice<.94?'#bcc7d8':'#9fbde0';
    const luminosity=random();
    const coreDimming=irregular?1:.25+.75*Math.min(1,r/3.3);
    const point={position:[x,y,z],color,size:.052+luminosity**4*.13,alpha:(.12+luminosity**2*.5)*coreDimming};
    if(index%47===0){point.size=.092+random()**4*.2;point.alpha=(.38+random()*.5)*coreDimming;bright.push(point);}
    else if(index%31===0&&z>.25){point.alpha*=.66;foreground.push(point);}
    else faint.push(point);
  }
  points(galaxy,faint,{pointScale:625,maxSize:2.6},'faint-resolved-stellar-population',3);
  points(galaxy,bright,{pointScale:620,maxSize:3.6},'sparse-bright-stellar-population',3);

  // Normal blending darkens the light behind dust. Its filament masks are tied
  // to the same spiral/bar morphology as the stars, not a screen-space overlay.
  const dustMaterial=own(new THREE.ShaderMaterial({
    ...normal(),vertexShader:diskVertex,
    uniforms:{uTime:time,uIrregular:{value:irregular?1:0},uObservationStrength:observationUniform},
    fragmentShader:`uniform float uTime;uniform float uIrregular;uniform float uObservationStrength;varying vec3 vLocal;${noise}${morphology}
      float ridge(float value,float width){return exp(-pow(value/max(width,fwidth(value)*.65),2.));}
      void main(){vec2 p=vLocal.xy;float r=length(p);float n=fbm(vec3(p*1.45,uTime*.003));
        float fine=fbm(vec3(p*4.7,2.3));float opacity;
        if(uIrregular>.5){
          float b=bar(p),k=knots(p);float weave=sin(p.y*3.2+p.x*.62+(n-.5)*4.2);
          float stripe=exp(-pow((weave-.24)*2.9,2.));
          opacity=(b*.28+k*.18)*stripe*(.3+fine*.6);
          opacity*=(1.-smoothstep(10.,14.4,abs(p.x)))*(1.-smoothstep(7.6,11.3,abs(p.y)));
        }else{
          float phase=spiralPhase(p)+(n-.5)*.15;
          float lane=ridge(sin(phase)-.1,.014);
          float branch=ridge(sin(phase+.09)+.06,.011);
          float lace=ridge(sin(phase-.16)-.14,.007);
          float radial=smoothstep(1.7,3.4,r)*(1.-smoothstep(12.9,16.3,r));
          float broken=smoothstep(.22,.72,fbm(vec3(p*2.4,3.1)));
          opacity=(lane*.30+branch*.2+lace*.12)*radial*(.18+broken*.72)*(.5+fine*.4);
        }
        if(opacity<.004)discard;
        gl_FragColor=vec4(vec3(.012,.009,.007),clamp(opacity*(1.-uObservationStrength*.88),0.,.43));${finish}
      }`
  }));
  const dust=new THREE.Mesh(geometry,dustMaterial);dust.name='woven-extinction-lanes';dust.position.z=.38;dust.renderOrder=4;galaxy.add(dust);
  points(galaxy,foreground,{pointScale:535,maxSize:2},'foreground-stars-in-front-of-dust',5);
  const cameraLocal=new THREE.Vector3();
  cameraUpdates.push(cameraPosition=>{
    galaxy.updateWorldMatrix(true,false);cameraLocal.copy(cameraPosition);galaxy.worldToLocal(cameraLocal);
    dust.position.z=cameraLocal.z>=0?.38:-.38;
  });

  if(irregular){
    const birth=new THREE.Group();birth.name='tarantula-star-formation-artist-model';birth.position.set(5.3,-1.9,.82);galaxy.add(birth);
    const position=[],side=[],along=[],shade=[],indices=[];
    const filaments=19,steps=52;
    for(let index=0;index<filaments;index++){
      const angle=random()*TAU,reach=1.35+random()*2.1,seed=random()*TAU;
      const base=position.length/3;
      for(let step=0;step<=steps;step++){
        const t=step/steps,a=angle+Math.sin(t*4.8+seed)*.24+t*.42,r=.22+t*reach;
        const x=Math.cos(a)*r,y=Math.sin(a)*r*.69,z=Math.sin(t*5.+seed)*.25;
        const width=(.019+random()*.016)*(.35+Math.sin(t*Math.PI)*.65);
        for(const sign of [-1,1]){
          position.push(x-Math.sin(a)*width*sign,y+Math.cos(a)*width*sign,z);
          side.push(sign);along.push(t);shade.push(index%3/2);
        }
      }
      for(let step=0;step<steps;step++){const a=base+step*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    const filamentsGeometry=own(new THREE.BufferGeometry());
    filamentsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
    filamentsGeometry.setAttribute('aSide',new THREE.Float32BufferAttribute(side,1));
    filamentsGeometry.setAttribute('aAlong',new THREE.Float32BufferAttribute(along,1));
    filamentsGeometry.setAttribute('aShade',new THREE.Float32BufferAttribute(shade,1));filamentsGeometry.setIndex(indices);
    const filamentMaterial=own(new THREE.ShaderMaterial({
      ...normal(),uniforms:{uTime:time},
      vertexShader:`attribute float aSide;attribute float aAlong;attribute float aShade;
        varying float vSide;varying float vAlong;varying float vShade;uniform float uTime;
        void main(){vSide=aSide;vAlong=aAlong;vShade=aShade;vec3 p=position;
          p.z+=sin(p.x*2.+p.y*1.4+uTime*.016)*.035;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader:`varying float vSide;varying float vAlong;varying float vShade;
        void main(){float edge=1.-smoothstep(.08,1.,abs(vSide));float end=smoothstep(0.,.12,vAlong)*(1.-smoothstep(.65,1.,vAlong));
          vec3 color=mix(vec3(.6,.20,.30),vec3(.30,.46,.58),vShade);
          gl_FragColor=vec4(color,edge*end*.23);${finish}}`
    }));
    const threads=new THREE.Mesh(filamentsGeometry,filamentMaterial);threads.name='ionized-gas-filaments';threads.renderOrder=6;birth.add(threads);
    const nursery=[];
    for(let index=0;index<760;index++){
      const x=gaussian()*1.12,y=gaussian()*.74,z=gaussian()*.36;
      nursery.push({position:[x,y,z],color:index%7?'#9cbacf':'#d29fa5',size:.027+random()**3*.095,alpha:.1+random()*.23});
    }
    points(birth,nursery,{pointScale:550,maxSize:2.8},'young-stars-within-filaments',6);
  }
  return {radius,cameraDistance};
}

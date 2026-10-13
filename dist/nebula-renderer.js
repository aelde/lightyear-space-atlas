import * as THREE from './vendor/three.module.js';
import { addVolume } from './volume-field.js?v=13.1';

// Photographs guide colour and projected morphology. Density, cavities, dust
// and illumination occupy XYZ space; depth is an astronomical artist model.
export function addPhotographicNebula(group, { id, own, timeUniform, cameraUpdates }) {
  const orion = id === 'orion';
  const holder = new THREE.Group(); holder.name = 'three-dimensional-nebular-environment';
  group.add(holder);
  const fallback = own(new THREE.DataTexture(new Uint8Array(orion ? [84,48,42,255] : [32,57,94,255]),1,1));
  fallback.needsUpdate=true;
  const map={value:fallback},ready={value:0}; let disposed=false;
  own({dispose(){disposed=true;}});
  const source=own(new THREE.TextureLoader().load(new URL(`./assets/observations/${orion?'orion-vst-optical.jpg':'pleiades-optical.jpg'}`,import.meta.url).href,texture=>{
    if(disposed){texture.dispose();return;}
    texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    // Remove isolated photographed stellar peaks before using image colour
    // inside the volume; otherwise each peak becomes an artificial bright tube.
    const imageCanvas=document.createElement('canvas');
    imageCanvas.width=1280;imageCanvas.height=Math.round(1280*texture.image.height/texture.image.width);
    const context=imageCanvas.getContext('2d',{willReadFrequently:true});
    if(context){
      context.filter='blur(.6px)';context.drawImage(texture.image,0,0,imageCanvas.width,imageCanvas.height);context.filter='none';
      const image=context.getImageData(0,0,imageCanvas.width,imageCanvas.height),original=new Uint8ClampedArray(image.data);
      const offsets=[[-6,0],[6,0],[0,-6],[0,6],[-4,-4],[4,-4],[-4,4],[4,4],[-12,0],[12,0],[0,-12],[0,12],[-8,-8],[8,-8],[-8,8],[8,8]];
      for(let y=13;y<imageCanvas.height-13;y++)for(let x=13;x<imageCanvas.width-13;x++){
        const index=(y*imageCanvas.width+x)*4,center=Math.max(original[index],original[index+1],original[index+2]);
        if(center<35)continue;
        let red=0,green=0,blue=0;
        for(const [dx,dy] of offsets){const i=((y+dy)*imageCanvas.width+x+dx)*4;red+=original[i];green+=original[i+1];blue+=original[i+2];}
        red/=16;green/=16;blue/=16;
        const average=Math.max(red,green,blue);
        if(center>average*1.42+12){image.data[index]=red;image.data[index+1]=green;image.data[index+2]=blue;}
      }
      context.putImageData(image,0,0);
      const gasMap=own(new THREE.CanvasTexture(imageCanvas));gasMap.colorSpace=THREE.SRGBColorSpace;gasMap.anisotropy=4;map.value=gasMap;
    }else map.value=texture;
    ready.value=1;group.userData.observationTexture=id;
  },undefined,()=>{group.userData.observationTexture='unavailable';}));
  source.colorSpace=THREE.SRGBColorSpace;
  const centers=orion?[[-2.4,.7,-.9],[-1.7,1.2,.2],[-2.7,1.5,.6],[-1.5,.45,-.5]]:
    [[-5,2.8,-1.1],[-2,.6,1.8],[1.1,2.4,-2],[4.3,-.3,1.2],[.2,-3.6,-.5],[-3.2,-3.1,-1.8],[4.9,3.6,.4]];
  const illumination=centers.slice(0,4).map(p=>new THREE.Vector3(...p));
  addVolume(holder, { name: orion?'orion-ionized-gas-and-extinguishing-dust':'pleiades-reflection-dust-volume',
    halfSize:[14,11,orion?9:7.5],own,timeUniform,cameraUpdates,steps:104,extinction:1.0,emission:1.4,emissiveDensity:true,
    uniforms:{uMap:map,uReady:ready,uKind:{value:orion?1:0},uIlluminators:{value:illumination}},
    field:`uniform sampler2D uMap;uniform float uReady;uniform float uKind;uniform vec3 uIlluminators[4];
            vec4 sampleVolume(vec3 p){
        float depthScale=mix(4.2,5.8,uKind);
        vec3 q=p/vec3(13.5,10.5,depthScale);
        float edge=1.0-smoothstep(.66,1.0,length(q*vec3(.84,.9,.8)));
        if(edge<.001)return vec4(0.0);
        vec3 flow=vec3(volumeNoise(p*.23+vec3(0.,uTime*.007,0.)),volumeNoise(p*.23+vec3(9.,0.,uTime*.006)),volumeNoise(p*.23+vec3(uTime*.005,0.,17.)))-.5;
        vec3 cloudPoint=p+flow*1.4;
        float cloud=volumeFbm(cloudPoint*vec3(.65,.95,.8));
        float fine=volumeFbm(cloudPoint*vec3(2.9,3.7,2.5));
        float filament=pow(1.0-abs(volumeFbm(cloudPoint*vec3(.9,2.3,1.4))*2.0-1.0),7.0);
        // Project the reference into the sculpted volume from a fixed reference
        // viewpoint. This is a static XYZ field, never a camera-facing surface.
        // Perspective correction avoids dragging a photographed filament into
        // a radial streak along the reference line of sight.
        float referenceDistance=mix(29.5,27.14,uKind);
        vec3 referencePoint=vec3(p.x,p.y*.99782-p.z*.06595,p.y*.06595+p.z*.99782);
        vec2 referenceXY=referencePoint.xy*referenceDistance/max(15.0,referenceDistance-referencePoint.z);
        vec2 uv=referenceXY/vec2(26.0,20.19)+.5;
        uv+=flow.xy*.0012;
        uv=clamp(uv,vec2(.002),vec2(.998));
        vec3 photo=textureLod(uMap,uv,2.8).rgb;
        vec2 sideUv=p.yz/vec2(21.0,17.0)+.5;
        vec2 topUv=p.xz/vec2(26.0,17.0)+.5;
        vec3 sideColour=textureLod(uMap,clamp(sideUv,vec2(.003),vec2(.997)),3.5).rgb;
        vec3 topColour=textureLod(uMap,clamp(topUv,vec2(.003),vec2(.997)),3.5).rgb;
        vec3 localShape=abs(p/vec3(13.5,10.5,7.0));
        vec3 axisWeight=pow(localShape,vec3(4.0));axisWeight/=max(.001,axisWeight.x+axisWeight.y+axisWeight.z);
        vec3 observed=mix(photo,photo*axisWeight.z+sideColour*axisWeight.x+topColour*axisWeight.y,.46);
        float light=dot(observed,vec3(.2126,.7152,.0722));
        // Photo colour is a broad reference; every density feature is defined
        // in XYZ rather than extending a photographed pixel into a bright tube.
        vec3 bodyA=p*vec3(.10,.13,.11);
        vec3 bodyB=(p-vec3(4.6,-2.0,1.5))*vec3(.19,.23,.20);
        vec3 bodyC=(p-vec3(-5.0,4.2,-2.0))*vec3(.21,.23,.22);
        float body=exp(-dot(bodyA,bodyA))+.60*exp(-dot(bodyB,bodyB))+.45*exp(-dot(bodyC,bodyC));
        float molecular=smoothstep(.27,.65,volumeNoise(cloudPoint*.38+vec3(3.1,6.0,2.7)));
        float photoMorphology=uKind<.5?.48:mix(.50,smoothstep(.001,.15,light),uReady);
        if(uKind<.5){observed*=min(1.0,.10/max(.10,light));observed=mix(observed,vec3(.035,.105,.23),.62);}
        float depthCenter=(volumeNoise(vec3(p.xy*.25,4.7))-.5)*6.0+sin(p.y*.27)*1.3;
        float thickness=mix(2.8,5.4,volumeNoise(vec3(p.xy*.17,11.3)));
        float depthCloud=exp(-pow((p.z-depthCenter)/thickness,2.0));
        float structure=.12+pow(molecular,1.6)*.80+fine*.24+filament*.22;
        float gas=body*edge*depthCloud*(.035+photoMorphology*.36)*structure;
        gas*=mix(.48,1.0,uKind);
        vec3 windCavity=(p-vec3(-2.0,.8,-.5))/vec3(2.2,1.7,2.5);
        gas*=1.0-uKind*.63*exp(-dot(windCavity,windCavity));
        float dust=pow(smoothstep(.40,.71,volumeFbm(cloudPoint*vec3(.55,1.25,.71)+vec3(12.,5.,3.))),2.0)*body*edge*depthCloud*.34;
        dust*=mix(.47,1.0,uKind);
        float irradiation=0.0;
        for(int s=0;s<4;s++){vec3 delta=p-uIlluminators[s];irradiation+=1.0/(1.0+dot(delta,delta)*.2);}
        vec3 base=mix(vec3(.075,.15,.30),vec3(.43,.13,.085),uKind);
        vec3 colour=mix(base,observed*1.95,uReady*.84);
        colour=mix(colour,mix(vec3(.17,.33,.57),vec3(.64,.42,.34),uKind),clamp(irradiation*.11,0.,.42));
        vec3 lightDirection=normalize(vec3(-2.0,.8,-.5)-p);
        float adjacent=volumeFbm((cloudPoint+lightDirection*.55)*vec3(.65,.95,.8));
        float litEdge=clamp(.55+(cloud-adjacent)*3.7,.18,1.15);
        colour*=.28+fine*.36+irradiation*.19+litEdge*.82;
        if(uKind<.5){colour=mix(colour,vec3(.20,.40,.72),.64);gas*=.30+clamp(irradiation*.7,0.,1.6);}
        float total=gas+dust;
        return vec4(colour*gas*.26,dust*1.25);
      }`,
  });
  let seed=orion?81937:445981;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const positions=[],colours=[],sizes=[],alpha=[],colour=new THREE.Color();
  const count=window.innerWidth<600?1600:4200;
  for(let i=0;i<count;i++){
    const a=random()*Math.PI*2,z=random()*2-1,r=7+Math.pow(random(),.46)*13;
    const horizontal=Math.sqrt(1-z*z);
    positions.push(Math.cos(a)*horizontal*r,Math.sin(a)*horizontal*r*.75,z*r);
    colour.set(i%11===0?'#edc8ad':i%5===0?'#a8bfd9':'#c9d0db');colours.push(colour.r,colour.g,colour.b);
    sizes.push(.028+random()**6*.12);alpha.push(.11+random()**2*.54);
  }
  const starsGeometry=own(new THREE.BufferGeometry());
  starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  starsGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  starsGeometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  starsGeometry.setAttribute('aAlpha',new THREE.Float32BufferAttribute(alpha,1));
  const starsMaterial=own(new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aSize;attribute float aAlpha;varying vec3 vColor;varying float vAlpha;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*600.0/max(1.0,-mv.z),.65,3.2);vColor=color;vAlpha=aAlpha;}`,
    fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;
      gl_FragColor=vec4(vColor,exp(-r*r*6.0)*vAlpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`}));
  const population=new THREE.Points(starsGeometry,starsMaterial);population.name='three-dimensional-surrounding-stellar-population';
  population.renderOrder=1;population.frustumCulled=false;holder.add(population);
  for(const [index,position] of centers.entries()){
    const radius=orion?.052:.078;
    const core=new THREE.Mesh(own(new THREE.SphereGeometry(radius,20,14)),own(new THREE.MeshBasicMaterial({color:'#ddeaff',toneMapped:false})));
    core.position.set(...position);core.name=orion?'trapezium-illuminating-star':'pleiades-cluster-star';core.renderOrder=4;holder.add(core);
    for(const [scale,opacity] of [[2.8,.17],[7,.035]]){
      const glow=new THREE.Mesh(own(new THREE.SphereGeometry(radius*scale,20,14)),own(new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,
        uniforms:{uAlpha:{value:opacity}},
        vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalMatrix*normal;vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
        fragmentShader:`varying vec3 vN;varying vec3 vV;uniform float uAlpha;void main(){float center=abs(dot(normalize(vN),normalize(vV)));gl_FragColor=vec4(.52,.73,1.0,pow(center,2.0)*uAlpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`})));
      glow.position.copy(core.position);glow.renderOrder=4;holder.add(glow);
    }
  }
  group.userData.modelKind='volume-with-spatial-stars';
  return {radius:orion?15:14,cameraDistance:orion?23:25};
}

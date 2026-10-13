import * as THREE from './vendor/three.module.js';

// Observational detail projected onto curved, layered gas sheets. The relief,
// depth and very slow local flow are an illustration, not recovered 3D data.
export function addPhotographicNebula(group,{id,own,timeUniform,cameraUpdates}){
  const orion=id==='orion',width=orion?26:25,height=orion?20.19:18.25;
  const holder=new THREE.Group();holder.name='observation-based-nebula';group.add(holder);
  const fallback=own(new THREE.DataTexture(new Uint8Array([25,32,48,255]),1,1));fallback.needsUpdate=true;
  const facing={value:1};
  const shared={uMap:{value:fallback},uReady:{value:0},uTime:timeUniform(),uKind:{value:orion?1:0},uFacing:facing};
  let disposed=false;
  // Registered as a disposable resource along with geometry and materials.
  own({dispose(){disposed=true;}});
  const texture=own(new THREE.TextureLoader().load(new URL(`./assets/observations/${orion?'orion-vst-optical.jpg':'pleiades-optical.jpg'}`,import.meta.url).href,loaded=>{
    if(disposed){loaded.dispose();return;}
    loaded.colorSpace=THREE.SRGBColorSpace;loaded.anisotropy=4;
    shared.uMap.value=loaded;shared.uReady.value=1;
    group.userData.observationTexture=id;
    addPhotographicVolume(loaded.image);
  },undefined,()=>{group.userData.observationTexture='unavailable';}));
  texture.colorSpace=THREE.SRGBColorSpace;
  const vertex=`uniform sampler2D uMap;uniform float uReady;uniform float uTime;uniform float uLayer;varying vec2 vUv;
    void main(){vUv=uv;vec3 p=position;
      vec3 broad=texture2D(uMap,uv).rgb*.4;
      broad+=texture2D(uMap,uv+vec2(.012,0)).rgb*.15+texture2D(uMap,uv-vec2(.012,0)).rgb*.15;
      broad+=texture2D(uMap,uv+vec2(0,.012)).rgb*.15+texture2D(uMap,uv-vec2(0,.012)).rgb*.15;
      float density=dot(broad,vec3(.2126,.7152,.0722));
      float arch=sin(uv.x*3.14159)*sin(uv.y*3.14159);
      p.z+=(density*2.7+arch*.8)*uReady+uLayer;
      p.z+=sin(uv.x*8.0+uv.y*5.0+uTime*.026)*.045*arch;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
  const fragment=`uniform sampler2D uMap;uniform float uReady;uniform float uTime;uniform float uLayer;uniform float uKind;
    uniform float uOpacity;uniform float uFacing;varying vec2 vUv;
    void main(){
      vec2 uv=vUv;float edge=(1.0-smoothstep(.37,.5,abs(uv.x-.5)))*(1.0-smoothstep(.37,.5,abs(uv.y-.5)));
      vec3 photo=texture2D(uMap,uv).rgb;
      float luminance=dot(photo,vec3(.2126,.7152,.0722));
      vec2 flow=vec2(sin(uv.y*27.0+uTime*.035),cos(uv.x*22.0-uTime*.027))*.00048;
      float starMask=smoothstep(.28,.72,max(photo.r,max(photo.g,photo.b)));
      vec3 gas=texture2D(uMap,uv+flow*(1.0-starMask)).rgb;
      if(abs(uLayer)>.1){
        gas=(texture2D(uMap,uv+vec2(.005,0)).rgb+texture2D(uMap,uv-vec2(.005,0)).rgb+texture2D(uMap,uv+vec2(0,.005)).rgb+texture2D(uMap,uv-vec2(0,.005)).rgb)*.25;
        // Secondary sheets contain faint gas, without duplicating bright stars.
        gas*=1.0-smoothstep(.2,.7,max(gas.r,max(gas.g,gas.b)))*.82;
      }
      float shape=smoothstep(.0003,.012,luminance);
      float alpha=edge*shape*uOpacity*uFacing;
      vec3 color=gas*(uKind>.5?1.43:1.8);
      if(uReady<.5){float r=length((uv-.5)*vec2(1.0,1.35));color=mix(vec3(.06,.12,.22),vec3(.22,.09,.08),uv.x);alpha=exp(-r*r*13.0)*.42;}
      gl_FragColor=vec4(color,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  for(const [depth,opacity,scale] of [[-1.65,.34,1.075],[0,.98,1],[1.3,.105,.985]]){
    const material=own(new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,
      uniforms:{...shared,uLayer:{value:depth},uOpacity:{value:opacity}},transparent:true,
      depthWrite:false,side:THREE.DoubleSide,blending:THREE.NormalBlending}));
    const sheet=new THREE.Mesh(own(new THREE.PlaneGeometry(width,height,160,112)),material);
    sheet.scale.setScalar(scale);sheet.name=depth===0?'observed-filaments-and-dark-dust':'illustrative-depth-layer';holder.add(sheet);
  }
  // Very faint foreground filaments produce real parallax when the camera moves.
  // They add depth without replacing the fine photographed structures.
  const wisps=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.NormalBlending,
    uniforms:{uTime:shared.uTime,uKind:shared.uKind},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime;uniform float uKind;
      void main(){vec2 p=(vUv-.5)*2.0;float envelope=exp(-p.x*p.x*2.7-p.y*p.y*5.0);
        float filament=pow(.5+.5*sin(p.x*19.0+sin(p.y*5.0)*4.0-uTime*.028),12.0);
        gl_FragColor=vec4(uKind>.5?vec3(.13,.11,.095):vec3(.055,.095,.16),envelope*filament*.095);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` }));
  const veil=new THREE.Mesh(own(new THREE.PlaneGeometry(width*.85,height*.62,1,1)),wisps);
  veil.position.set(1.0,-1.5,3.1);veil.rotation.z=-.27;holder.add(veil);
  const localCamera=new THREE.Vector3();
  cameraUpdates.push(cameraPosition=>{group.updateWorldMatrix(true,false);localCamera.copy(cameraPosition);group.worldToLocal(localCamera);
    const align=Math.abs(localCamera.z)/Math.max(.01,localCamera.length());facing.value=THREE.MathUtils.smoothstep(align,.18,.72);
  });
  function addPhotographicVolume(sourceImage){
    // Image sampling is runtime texture construction; no raster artwork is
    // fabricated. Points retain the photograph's colors and gain illustrative
    // depth so an edge-on view still contains a navigable, textured cloud.
    if(disposed)return;
    const imageCanvas=document.createElement('canvas');imageCanvas.width=640;imageCanvas.height=Math.round(640*height/width);
    const ctx=imageCanvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;
    ctx.drawImage(sourceImage,0,0,imageCanvas.width,imageCanvas.height);
    const pixels=ctx.getImageData(0,0,imageCanvas.width,imageCanvas.height).data;
    let seed=orion?710329:193852;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const positions=[],colors=[],sizes=[],alphas=[],color=new THREE.Color();
    for(let i=0;i<75000;i++){
      const u=random(),v=random(),px=Math.floor(u*imageCanvas.width),py=Math.floor((1-v)*imageCanvas.height);
      const index=(py*imageCanvas.width+px)*4,r=pixels[index]/255,g=pixels[index+1]/255,b=pixels[index+2]/255;
      const light=Math.max(r,g,b);if(light<.085||random()>light*.9)continue;
      const gaussian=Math.sqrt(-2*Math.log(Math.max(.0001,random())))*Math.cos(random()*6.283185);
      positions.push((u-.5)*width,(v-.5)*height,gaussian*(orion?2.3:1.7)+(light-.35)*1.5);
      color.setRGB(r,g,b,THREE.SRGBColorSpace);colors.push(color.r,color.g,color.b);
      sizes.push(.13+random()*.23);alphas.push(.12+light*.22);
    }
    const geometry=own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));geometry.setAttribute('aAlpha',new THREE.Float32BufferAttribute(alphas,1));
    const material=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending,
      uniforms:{uTime:shared.uTime,uFacing:facing},
      vertexShader:`attribute float aSize;attribute float aAlpha;varying vec3 vColor;varying float vAlpha;uniform float uTime;void main(){
        vec3 p=position;p.xy+=vec2(sin(position.y*.43+uTime*.024),cos(position.x*.38-uTime*.021))*.04;
        vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*540.0/max(1.0,-mv.z),1.0,12.0);vColor=color;vAlpha=aAlpha;}`,
      fragmentShader:`varying vec3 vColor;varying float vAlpha;uniform float uFacing;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;
        gl_FragColor=vec4(vColor*1.7,exp(-r*r*5.0)*vAlpha*(.2+.8*(1.0-uFacing)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}));
    const cloud=new THREE.Points(geometry,material);cloud.name='photograph-colored-depth-cloud';cloud.frustumCulled=false;holder.add(cloud);
  }
  return{radius:orion?14.2:13.5,cameraDistance:orion?25:26};
}

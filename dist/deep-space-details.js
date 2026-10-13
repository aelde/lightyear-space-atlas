import * as THREE from './vendor/three.module.js';

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
  const material=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uTime:timeUniform()},
    vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec3 vP;uniform float uTime;${noise}
      void main(){float r=length(vP.xy),a=atan(vP.y,vP.x);float orbital=a-uTime*.6/pow(max(.9,r/2.5),1.5);
        float f1=f(vec3(cos(orbital)*r*4.0,sin(orbital)*r*4.0,r*8.0));
        float streaks=pow(.5+.5*sin(r*47.0+f1*9.0+a*.6),5.0);
        float hot=1.0-smoothstep(2.42,6.4,r);float taper=smoothstep(2.37,2.65,r)*(1.0-smoothstep(5.0,8.0,r));
        vec3 color=mix(vec3(.61,.055,.005),vec3(2.0,1.17,.48),pow(hot,2.8));
        float beaming=.62+.38*sin(a+.5);gl_FragColor=vec4(color,taper*(.06+streaks*.38)*(.35+hot*.65)*beaming);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}));
  for(const z of [-.11,.12]){const layer=new THREE.Mesh(own(new THREE.RingGeometry(2.39,7.9,192,12)),material);layer.position.z=z;layer.name='fine-differential-gas-filaments';disk.add(layer);}
  const lensMaterial=own(new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:timeUniform()},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime;${noise}
      void main(){vec2 p=(vUv-.5)*10.0;float r=length(p),a=atan(p.y,p.x);
        float ring=exp(-pow((r-2.31)/.055,2.0))*.42+exp(-pow((r-2.39)/.025,2.0))*.20;
        float farArc=exp(-pow((r-3.06)/.19,2.0))*(.25+.75*smoothstep(-.15,.7,p.y/ max(.1,r)));
        float turbulent=f(vec3(cos(a)*8.0,sin(a)*8.0,uTime*.028));
        farArc*=smoothstep(.29,.65,turbulent)*.22;
        float inner=smoothstep(2.2,2.3,r);vec3 color=mix(vec3(.74,.19,.026),vec3(1.8,1.22,.65),ring*2.0);
        gl_FragColor=vec4(color,(ring+farArc)*inner);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`}));
  const lens=new THREE.Mesh(own(new THREE.PlaneGeometry(10,10)),lensMaterial);lens.name='illustrative-lensed-far-disk';group.add(lens);
  cameraUpdates.push(cameraPosition=>{group.updateWorldMatrix(true,false);lens.lookAt(cameraPosition);});
}

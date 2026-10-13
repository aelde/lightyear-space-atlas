import * as THREE from './vendor/three.module.js';
import { addVolume } from './volume-field.js?v=13.1';

// Animated explanatory plasma and dust. Timing and dimensions are cinematic.
export function addStellarWeather(sphere, radius, own) {
  const compact=typeof window!=='undefined'&&window.innerWidth<600;
  const steps=compact?40:64, loops=6, strands=3, sides=compact?8:10;
  const positions=[], normals=[], tangents=[], binormals=[], seeds=[], indices=[];
  for(let loop=0;loop<loops;loop++){
    const angle=loop*Math.PI*2/loops+.25;
    const normal=new THREE.Vector3(Math.cos(angle),Math.sin(angle),.32*Math.sin(loop*1.7)).normalize();
    const tangent=new THREE.Vector3(-normal.y,normal.x,0).normalize();
    const binormal=new THREE.Vector3().crossVectors(normal,tangent).normalize();
    for(let strand=0;strand<strands;strand++){
      const first=positions.length/3;
      const addVertex=(s,angle)=>{
        positions.push(s,angle,strand-1);
        normals.push(...normal.toArray());tangents.push(...tangent.toArray());binormals.push(...binormal.toArray());seeds.push(loop*.173);
      };
      for(let step=0;step<=steps;step++)for(let side=0;side<=sides;side++)addVertex(step/steps,side/sides*Math.PI*2);
      for(let step=0;step<steps;step++)for(let side=0;side<sides;side++){
        const a=first+step*(sides+1)+side,b=a+sides+1;
        indices.push(a,a+1,b,a+1,b+1,b);
      }
      // Closed round cross-sections, including end caps: no flat ribbon faces.
      const startCap=positions.length/3;addVertex(0,-1);
      const endCap=positions.length/3;addVertex(1,-1);
      for(let side=0;side<sides;side++){
        indices.push(startCap,first+side+1,first+side);
        const end=first+steps*(sides+1);indices.push(endCap,end+side,end+side+1);
      }
    }
  }
  const geometry=own(new THREE.BufferGeometry());
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('aNormal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('aTangent',new THREE.Float32BufferAttribute(tangents,3));
  geometry.setAttribute('aBinormal',new THREE.Float32BufferAttribute(binormals,3));
  geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));geometry.setIndex(indices);
  const uniforms={uTime:{value:0},uRadius:{value:radius},uWidth:{value:1},uOpacity:{value:1}};
  const material=own(new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,side:THREE.FrontSide,blending:THREE.AdditiveBlending,
    vertexShader:`attribute vec3 aNormal;attribute vec3 aTangent;attribute vec3 aBinormal;attribute float aSeed;
      uniform float uTime;uniform float uRadius;uniform float uWidth;varying vec3 vTubeNormal;varying vec3 vTubeView;varying float vEnergy;varying float vAlong;varying float vStrand;
      vec3 centerAt(float s,float life){
        s=clamp(s,0.0,1.0);float arch=pow(max(0.0,sin(s*3.14159265)),.8);
        float shear=sin(s*12.0-uTime*.9+aSeed*40.0)*.012*arch;
        vec3 p=aNormal*uRadius*(1.003+arch*(.07+.29*life));
        p+=aTangent*uRadius*(cos(s*3.14159265)*(.16+life*.05)+shear);
        return p+aBinormal*uRadius*(position.z*.005+sin(s*6.28+uTime*.35)*.025*arch*life);
      }
      void main(){float s=position.x;float phase=fract(uTime/17.0+aSeed);
        float life=smoothstep(.03,.25,phase)*(1.0-smoothstep(.64,.96,phase));
        float arch=pow(max(0.0,sin(s*3.14159265)),.8);
        vec3 direction=normalize(centerAt(s+.002,life)-centerAt(s-.002,life));
        vec3 radialA=normalize(cross(direction,aBinormal));vec3 radialB=normalize(cross(direction,radialA));
        bool cap=position.y<0.0;
        vec3 tubeNormal=cap?(s<.5?-direction:direction):(radialA*cos(position.y)+radialB*sin(position.y));
        float tubeRadius=uRadius*(.0028+life*.0048)*uWidth;
        vec3 p=centerAt(s,life)+(cap?vec3(0.0):tubeNormal*tubeRadius);
        vec4 mv=modelViewMatrix*vec4(p,1.0);vTubeNormal=normalMatrix*tubeNormal;vTubeView=-mv.xyz;
        vEnergy=life;vAlong=arch;vStrand=s;
        gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uOpacity;uniform float uTime;varying vec3 vTubeNormal;varying vec3 vTubeView;varying float vEnergy;varying float vAlong;varying float vStrand;
      void main(){float face=abs(dot(normalize(vTubeNormal),normalize(vTubeView)));float edge=pow(face,.6);
        vec3 color=mix(vec3(.92,.20,.018),vec3(1.5,.76,.26),vEnergy*.75+vAlong*.2);
        gl_FragColor=vec4(color,edge*(.08+.48*vEnergy)*pow(vAlong,.3)*(.45+.55*pow(.5+.5*sin(vStrand*35.0-uTime*.7),2.0))*uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  const arches=new THREE.Mesh(geometry,material);arches.name='round-tubular-magnetic-plasma-loops';arches.frustumCulled=false;sphere.add(arches);
  const haloMaterial=own(material.clone());
  haloMaterial.uniforms={uTime:uniforms.uTime,uRadius:uniforms.uRadius,uWidth:{value:3.7},uOpacity:{value:.18}};
  const halo=new THREE.Mesh(geometry,haloMaterial);halo.frustumCulled=false;sphere.add(halo);

  const count=1440,p=new Float32Array(count*3),n=new Float32Array(count*3),t=new Float32Array(count*3),b=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const loop=i%loops,angle=loop*6.28/loops+.25;
    const normal=new THREE.Vector3(Math.cos(angle),Math.sin(angle),.32*Math.sin(loop*1.7)).normalize();
    const tangent=new THREE.Vector3(-normal.y,normal.x,0).normalize();const bi=new THREE.Vector3().crossVectors(normal,tangent);
    p.set([((i*73)%719)/719,((i*137)%719)/719,loop*.173],i*3);n.set(normal.toArray(),i*3);t.set(tangent.toArray(),i*3);b.set(bi.toArray(),i*3);
  }
  const windGeo=own(new THREE.BufferGeometry());windGeo.setAttribute('position',new THREE.BufferAttribute(p,3));
  windGeo.setAttribute('aNormal',new THREE.BufferAttribute(n,3));windGeo.setAttribute('aTangent',new THREE.BufferAttribute(t,3));windGeo.setAttribute('aBinormal',new THREE.BufferAttribute(b,3));
  const windMaterial=own(new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute vec3 aNormal;attribute vec3 aTangent;attribute vec3 aBinormal;uniform float uTime;uniform float uRadius;varying float vAlpha;
      void main(){float phase=fract(uTime/17.0+position.z);float eruption=smoothstep(.16,.4,phase)*(1.0-smoothstep(.65,.92,phase));
        float life=fract(uTime*.115+position.x);float spread=(position.y-.5)*(.04+life*.14);
        vec3 p=aNormal*uRadius*(1.015+life*life*(.12+eruption*.55));
        p+=aTangent*uRadius*spread;p+=aBinormal*uRadius*sin(position.x*44.0+uTime*.3)*.035*life;
        vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(45.0/max(1.0,-mv.z),1.5,4.0);
        vAlpha=(.07+eruption*.65)*(1.0-life)*sin(life*3.14159265);}`,
    fragmentShader:`varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;
      gl_FragColor=vec4(1.0,.36,.035,vAlpha*exp(-r*r*5.0));
      #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }`,
  }));
  const wind=new THREE.Points(windGeo,windMaterial);wind.name='erupting-plasma-particles';wind.frustumCulled=false;sphere.add(wind);
  return seconds=>{uniforms.uTime.value=seconds;};
}

export function addDustDisk(parent, own, timeUniform, cameraUpdates = []) {
  const disk=new THREE.Group();disk.rotation.set(1.03,0,-.22);parent.add(disk);
  disk.name='finite-thickness-vega-debris-disk';
  addVolume(disk,{
    name:'three-dimensional-debris-density',halfSize:[13.3,13.3,1.8],
    own,timeUniform,cameraUpdates,steps:96,extinction:1.15,emission:1.08,renderOrder:2,
    field:`vec4 sampleVolume(vec3 p){
      float r=length(p.xy);if(r<4.9||r>13.1)return vec4(0.0);
      float broad=exp(-pow((r-9.0)/3.0,2.0));
      float gap=1.0-.32*exp(-pow((r-8.0)/.42,2.0));
      float inner=smoothstep(4.9,6.15,r),outer=1.0-smoothstep(11.65,13.1,r);
      float height=.29+r*.024;
      float vertical=exp(-pow(p.z/height,2.0));
      float noise=volumeNoise(p*.34+vec3(0.0,uTime*.006,0.0));
      float density=.045*broad*gap*inner*outer*vertical*(.88+.12*noise);
      return vec4(vec3(.46,.55,.73),density);
    }`,
  });
  const count=9200,positions=new Float32Array(count*3),rand=new Float32Array(count);
  let seed=5821;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++){
    const r=6.0+random()*6.7;
    const vertical=Math.sqrt(-2*Math.log(Math.max(.0001,random())))*Math.cos(random()*6.28)*(.23+r*.02);
    positions.set([r,random()*6.28,vertical],i*3);rand[i]=random();
  }
  const geometry=own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('aRandom',new THREE.BufferAttribute(rand,1));
  const particles=own(new THREE.ShaderMaterial({
    uniforms:{uTime:timeUniform()},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`uniform float uTime;attribute float aRandom;varying float vAlpha;void main(){float r=position.x;
      float a=position.y+uTime*.07/pow(r/6.0,1.5);vec3 p=vec3(cos(a)*r,sin(a)*r,position.z);
      vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((22.0+aRandom*25.0)/max(1.0,-mv.z),.6,2.0);
      vAlpha=(.12+aRandom*.15)*(1.0-.4*exp(-pow((r-8.0)/.35,2.0)));}`,
    fragmentShader:`varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;gl_FragColor=vec4(.7,.79,.91,exp(-r*r*7.0)*vAlpha);
      #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }`,
  }));
  const points=new THREE.Points(geometry,particles);points.frustumCulled=false;disk.add(points);
  return disk;
}

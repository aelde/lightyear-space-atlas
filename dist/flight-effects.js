import * as THREE from './vendor/three.module.js';

// Animated explanatory plasma and dust. Timing and dimensions are cinematic.
export function addStellarWeather(sphere, radius, own) {
  const steps=64, loops=6, strands=3;
  const positions=[], normals=[], tangents=[], binormals=[], seeds=[], indices=[];
  for(let loop=0;loop<loops;loop++){
    const angle=loop*Math.PI*2/loops+.25;
    const normal=new THREE.Vector3(Math.cos(angle),Math.sin(angle),.32*Math.sin(loop*1.7)).normalize();
    const tangent=new THREE.Vector3(-normal.y,normal.x,0).normalize();
    const binormal=new THREE.Vector3().crossVectors(normal,tangent).normalize();
    for(let strand=0;strand<strands;strand++){
      const first=positions.length/3;
      for(let step=0;step<=steps;step++)for(const side of [-1,1]){
        positions.push(step/steps,side,strand-1);
        normals.push(...normal.toArray());tangents.push(...tangent.toArray());binormals.push(...binormal.toArray());seeds.push(loop*.173);
      }
      for(let step=0;step<steps;step++){const a=first+step*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
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
    uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:`attribute vec3 aNormal;attribute vec3 aTangent;attribute vec3 aBinormal;attribute float aSeed;
      uniform float uTime;uniform float uRadius;uniform float uWidth;varying float vEdge;varying float vEnergy;varying float vAlong;varying float vStrand;
      void main(){float s=position.x;float phase=fract(uTime/17.0+aSeed);
        float life=smoothstep(.03,.25,phase)*(1.0-smoothstep(.64,.96,phase));
        float arch=pow(max(0.0,sin(s*3.14159265)),.8);
        float height=.07+.29*life;float shear=sin(s*12.0-uTime*.9+aSeed*40.0)*.012*arch;
        vec3 p=aNormal*uRadius*(1.003+arch*height);
        p+=aTangent*uRadius*(cos(s*3.14159265)*(.16+life*.05)+shear);
        p+=aBinormal*uRadius*(position.z*.005+sin(s*6.28+uTime*.35)*.025*arch*life);
        p+=aBinormal*position.y*uRadius*(.004+life*.006)*uWidth;
        vEdge=position.y;vEnergy=life;vAlong=arch;vStrand=position.x;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float uOpacity;uniform float uTime;varying float vEdge;varying float vEnergy;varying float vAlong;varying float vStrand;
      void main(){float edge=1.0-smoothstep(.4,1.0,abs(vEdge));
        vec3 color=mix(vec3(.92,.20,.018),vec3(1.5,.76,.26),vEnergy*.75+vAlong*.2);
        gl_FragColor=vec4(color,edge*(.08+.48*vEnergy)*pow(vAlong,.3)*(.45+.55*pow(.5+.5*sin(vStrand*35.0-uTime*.7),2.0))*uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  const arches=new THREE.Mesh(geometry,material);arches.name='dynamic-magnetic-plasma-loops';arches.frustumCulled=false;sphere.add(arches);
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

export function addDustDisk(parent, own, timeUniform) {
  const disk=new THREE.Group();disk.rotation.set(1.03,0,-.22);parent.add(disk);
  const material=own(new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uTime:timeUniform()},
    vertexShader:`varying vec2 vLocal;void main(){vLocal=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vLocal;uniform float uTime;void main(){float r=length(vLocal);float a=atan(vLocal.y,vLocal.x);
      float broad=exp(-pow((r-9.0)/3.0,2.0));float gap=1.0-.32*exp(-pow((r-8.0)/.35,2.0));
      float inner=smoothstep(4.8,6.3,r);float outer=1.0-smoothstep(11.7,13.0,r);
      float fine=.96+.04*sin(a*9.0-uTime*.18/pow(r/6.0,1.5));
      gl_FragColor=vec4(.43,.52,.68,broad*gap*inner*outer*fine*.23);
      #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }`,
  }));
  disk.add(new THREE.Mesh(own(new THREE.RingGeometry(4.8,13,160,5)),material));
  const count=9200,positions=new Float32Array(count*3),rand=new Float32Array(count);
  let seed=5821;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count;i++){
    const r=6.0+random()*6.7;positions.set([r,random()*6.28,(random()-.5)*.21],i*3);rand[i]=random();
  }
  const geometry=own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('aRandom',new THREE.BufferAttribute(rand,1));
  const particles=own(new THREE.ShaderMaterial({
    uniforms:{uTime:timeUniform()},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`uniform float uTime;attribute float aRandom;varying float vAlpha;void main(){float r=position.x;
      float a=position.y+uTime*.07/pow(r/6.0,1.5);vec3 p=vec3(cos(a)*r,sin(a)*r,position.z);
      vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((22.0+aRandom*25.0)/max(1.0,-mv.z),.6,2.0);
      vAlpha=(.21+aRandom*.23)*(1.0-.4*exp(-pow((r-8.0)/.35,2.0)));}`,
    fragmentShader:`varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;gl_FragColor=vec4(.7,.79,.91,exp(-r*r*7.0)*vAlpha);
      #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }`,
  }));
  const points=new THREE.Points(geometry,particles);points.frustumCulled=false;disk.add(points);
  return disk;
}

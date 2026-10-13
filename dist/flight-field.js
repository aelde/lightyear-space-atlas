import * as THREE from './vendor/three.module.js';

// An artistic field of distant suns, deliberately not a navigational star catalogue.
export function createSpaceField() {
  const group = new THREE.Group();
  const count = 11000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  let seed = 93241;
  const random = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
  for (let i = 0; i < count; i++) {
    positions.set([(random()-.5)*10000, (random()-.5)*7600, (random()-.65)*10000], i*3);
    const color = new THREE.Color(i % 11 === 0 ? '#e7bd98' : i % 5 === 0 ? '#92b9e0' : '#c7d3de');
    colors.set([color.r, color.g, color.b], i*3);
    sizes[i] = 1.25 + Math.pow(random(), 5)*1.65;
    phases[i] = random()*6.28;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    vertexColors:true, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uPixelRatio:{value:1}},
    vertexShader:`attribute float aSize; attribute float aPhase;
      uniform float uTime; uniform float uPixelRatio;
      varying vec3 vColor; varying float vAlpha;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=aSize*uPixelRatio*clamp(1500.0/max(100.0,-mv.z),.9,1.8);
        vColor=color; vAlpha=.72+.12*sin(uTime*.25+aPhase); }`,
    fragmentShader:`varying vec3 vColor; varying float vAlpha;
      void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;
        gl_FragColor=vec4(vColor,vAlpha*exp(-r*r*5.0));
        #include <colorspace_fragment>
      }`,
  });
  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled=false;
  group.add(stars);

  const domeGeometry=new THREE.SphereGeometry(8500,32,20);
  const domeMaterial=new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false,
    vertexShader:`varying vec3 vDirection;void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec3 vDirection;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.3,.5));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 d=normalize(vDirection);float band=exp(-pow((d.y+d.x*.38+.14)*6.0,2.0));
        float cloud=noise(d*17.0)*.6+noise(d*38.0)*.3+noise(d*79.0)*.1;
        float dust=smoothstep(.25,.68,cloud)*band;
        vec3 base=vec3(.0003,.0005,.001);vec3 haze=vec3(.003,.0045,.008)*dust;
        gl_FragColor=vec4(base+haze,1.0);
        #include <colorspace_fragment>
      }`,
  });
  const dome=new THREE.Mesh(domeGeometry,domeMaterial);
  dome.renderOrder=-10;
  group.add(dome);
  return {group,
    update(dt,time,cameraPosition,pixelRatio=1){
      material.uniforms.uTime.value=time;
      material.uniforms.uPixelRatio.value=pixelRatio;
      dome.position.copy(cameraPosition);
    },
    dispose(){geometry.dispose();material.dispose();domeGeometry.dispose();domeMaterial.dispose();group.clear();}
  };
}

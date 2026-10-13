import * as THREE from './vendor/three.module.js';
import { landmarks } from './landmarks.js?v=3';
import { selectExhibit, openDetail, escapeHtml } from './app.js?v=5';
import { createWorld } from './flight-worlds.js?v=5';
import { createSpaceField } from './flight-field.js?v=4';
import { createSpaceAudio } from './flight-audio.js?v=5';
import { deepDetails } from './deep-details.js?v=5';

const $ = selector => document.querySelector(selector);
const canvas = $('#flight-canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ids = ['earth', ...landmarks.map(item => item.id)];
const earth = {id:'earth',name:'Earth',thaiName:'โลกของเรา',distance:0,kicker:'OUR PALE BLUE DOT',description:'จุดเล็ก ๆ ที่เราเรียกว่าบ้าน\nแล้วนอกเหนือจากนี้… มีอะไรอยู่บ้าง?'};
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
} catch {
  $('#flight-fallback').hidden = false;
  $('#journey').remove();
}

if (renderer) startJourney();

function startJourney() {
  document.body.classList.add('flight-mode');
  $('.skip-link').href = '#flight-canvas';
  // Keep the existing, verified radius control, destination selector and source content.
  $('#destination-content').append($('.collection-toolbar'), $('#landmark-grid'));
  $('#knowledge-content').append($('#distance'), $('#understand'));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(49, 1, .08, 16000);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor('#010309', 1);
  scene.add(new THREE.AmbientLight('#718ca6', .14));
  const sun = new THREE.DirectionalLight('#f4f6ff', 2.2);
  scene.add(sun, sun.target);
  const field = createSpaceField();
  scene.add(field.group);
  const audio=createSpaceAudio();
  let world = createWorld('earth');
  scene.add(world.group);
  let currentId='earth', currentIndex=0, retired=null, transition=null;
  let yaw=0, pitch=.05, zoom=1, smoothYaw=0, smoothPitch=.05, smoothZoom=1;
  let paused=reducedMotion, touring=false, tourElapsed=0, animationTime=0, lastTime=0;
  let effectTime=0,effectRate=1,lastSoundUpdate=0,inspecting=false,activeFeature=0;
  let inspectPreviousZoom=null,soundMixerTimer=null;
  let pointer=null;
  let width=1,height=1,pixelRatio=1;
  const center=new THREE.Vector3();
  const focus=new THREE.Vector3();
  const eye=new THREE.Vector3();
  const targetEye=new THREE.Vector3();
  const transitionStart=new THREE.Vector3();
  const focusStart=new THREE.Vector3();
  const sunlightOffset=new THREE.Vector3(-22,13,24);
  const featureProjection=new THREE.Vector3();
  let featureButtons=[];
  const directions = ['จุดเริ่มต้นของการสำรวจ', 'ขอบเขตที่ยังไม่แน่นอน', 'บริเวณระหว่างดวงดาว', 'ฉากนี้แสดง Proxima Centauri', 'ดาวแคระแดง', 'ดาวแคระน้ำตาลคู่', 'ระบบดาวคู่', 'ดาวฤกษ์สีขาวอมฟ้า', 'กระจุกดาว', 'บริเวณกำเนิดดาว', 'ภาพแนวคิดบริเวณหลุมดำ', 'กาแล็กซีบริวารรูปร่างไม่แน่นอน', 'กาแล็กซีเพื่อนบ้านขนาดใหญ่'];

  function fitDistance(){const framing=['pleiades','orion','lmc','andromeda'].includes(currentId)?1.18:1.36;return world.cameraDistance*Math.max(framing, 1/camera.aspect);}
  function orbitPosition(destination, angle, latitude, factor=1) {
    const distance=fitDistance()*factor;
    return targetEye.set(Math.sin(angle)*Math.cos(latitude)*distance, Math.sin(latitude)*distance, Math.cos(angle)*Math.cos(latitude)*distance).add(destination);
  }
  function resize() {
    width=window.innerWidth;height=window.innerHeight;
    pixelRatio=Math.min(window.devicePixelRatio || 1, width<600 ? 1.35 : 1.65);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.setViewOffset(width,height,width<600 ? 0 : -width*.13,width<600 ? height*.15 : height*.035,width,height);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize',resize,{passive:true});
  center.copy(world.group.position);
  focus.copy(center);
  camera.position.copy(orbitPosition(center, yaw, pitch, reducedMotion ? 1 : 1.7));
  if (!reducedMotion) transition={elapsed:0,duration:3.7};
  transitionStart.copy(camera.position);focusStart.copy(focus);

  $('#route-line').innerHTML=ids.map((id,index) => `<button type="button" class="route-dot" data-flight-id="${id}" aria-label="ไปยัง ${index===0?'โลก':landmarks[index-1].thaiName}" ${index===0?'aria-current="step"':''}></button>`).join('');
  function syncDestinationSelection(){
    document.querySelectorAll('.rail-stop').forEach(button=>{const selected=button.dataset.select===currentId;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
  }
  function updateCaption() {
    const item=currentIndex===0 ? earth : landmarks[currentIndex-1];
    $('#flight-kicker').textContent=item.kicker;
    $('#flight-name').replaceChildren(document.createTextNode(currentId==='centauri'?'Proxima Centauri':item.name));
    const thai=document.createElement('span');thai.textContent=currentId==='centauri'?'ดาวฤกษ์เพื่อนบ้านที่ใกล้ที่สุด':item.thaiName;
    $('#flight-name').append(thai);
    $('#flight-copy').textContent=currentId==='earth'?earth.description:currentId==='oort'?'รอบระบบสุริยะอาจมีวัตถุน้ำแข็งที่เบาบางมาก\nหนึ่งปีแสงแรก… ยังไม่ถึงดาวฤกษ์ดวงอื่น':currentId==='interstellar'?'ไม่มีจุดแวะใหม่ในทุก ๆ หนึ่งปีแสง\nระหว่างทางส่วนใหญ่ คือความว่างและความเงียบ':item.description.split('. ')[0];
    $('#flight-copy').style.whiteSpace='pre-line';
    $('#flight-distance').replaceChildren(document.createTextNode(currentId==='interstellar'?'2–3':new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(item.distance)));
    const unit=document.createElement('small');unit.textContent='ปีแสง';$('#flight-distance').append(unit);
    $('#flight-location-note').textContent=directions[currentIndex];
    $('#flight-index').innerHTML=`${String(currentIndex).padStart(2,'0')} <i>/</i> 12`;
    $('#flight-prev').disabled=currentIndex===0;
    $('#flight-next').disabled=currentIndex===12;
    $('#flight-next').innerHTML=`${currentIndex===0?'ออกจากโลก':currentIndex===12?'ถึงปลายทางแล้ว':'จุดหมายถัดไป'} <span aria-hidden="true">→</span>`;
    $('#flight-detail').textContent=currentIndex===0?'ก่อนออกเดินทาง ↗':'รู้จักจุดนี้ ↗';
    canvas.setAttribute('aria-label',`ฉากสามมิติ ${currentId==='centauri'?'Proxima Centauri':item.thaiName} ลากเพื่อเปลี่ยนมุมมอง เลื่อนเพื่อเข้าใกล้ ลูกศรซ้ายขวาเปลี่ยนจุดหมาย ปุ่มบวกลบซูม`);
    $('#route-line').querySelectorAll('button').forEach((button,index)=>{
      button.classList.toggle('is-visited',index<currentIndex);
      if(index===currentIndex)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    });
    syncDestinationSelection();
    renderInspector();
  }
  function showFeature(index){
    const detail=deepDetails[currentId];if(!detail)return;
    activeFeature=Math.min(detail.hotspots.length-1,Math.max(0,index));
    $('#feature-title').textContent=detail.hotspots[activeFeature].title;
    $('#feature-text').textContent=detail.hotspots[activeFeature].text;
    document.querySelectorAll('[data-feature]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.feature)===activeFeature)));
  }
  function renderInspector(){
    const detail=deepDetails[currentId];$('#flight-inspect').hidden=!detail;
    if(!detail){setInspect(false);return;}
    $('#inspector-title').textContent=currentIndex===0?'โลกของเรา':currentId==='centauri'?'Proxima Centauri':landmarks[currentIndex-1].thaiName;
    $('#feature-tabs').innerHTML=detail.hotspots.map((part,index)=>`<button type="button" data-feature="${index}" aria-label="ดู ${escapeHtml(part.title)}" aria-pressed="false">${String(index+1).padStart(2,'0')}</button>`).join('');
    $('#scene-hotspots').innerHTML=detail.hotspots.map((part,index)=>`<button type="button" class="scene-hotspot" data-feature="${index}" aria-label="ชี้ ${escapeHtml(part.title)}" aria-pressed="false"><span>${index+1}</span><em>${escapeHtml(part.title)}</em></button>`).join('');
    featureButtons=Array.from($('#scene-hotspots').children);
    $('#effect-model-note').textContent=detail.modelNote;
    $('#inspector-data').innerHTML=`<div class="inspect-metrics">${detail.metrics.map(metric=>`<div><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong></div>`).join('')}</div>${detail.sections.map(section=>`<section class="inspect-section"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.text)}</p></section>`).join('')}<div class="inspect-sources">${detail.sources.map(source=>`<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} ↗</a>`).join('')}</div>`;
    showFeature(0);
  }
  function setInspect(enabled){
    const next=enabled&&Boolean(deepDetails[currentId]);
    if(next&&!inspecting){inspectPreviousZoom=zoom;zoom=Math.min(3.6,zoom*1.15);}
    else if(!next&&inspecting&&inspectPreviousZoom!==null){zoom=inspectPreviousZoom;inspectPreviousZoom=null;}
    inspecting=next;
    $('#effect-inspector').hidden=!inspecting;$('#scene-hotspots').hidden=!inspecting;
    $('#flight-inspect').setAttribute('aria-expanded',String(inspecting));
    $('#journey').classList.toggle('is-inspecting',inspecting);
    $('.flight-caption').inert=inspecting;
    $('.flight-caption').setAttribute('aria-hidden',String(inspecting));
  }
  $('#flight-inspect').addEventListener('click',()=>{setInspect(!inspecting);if(inspecting)$('#close-inspector').focus({preventScroll:true});});
  $('#close-inspector').addEventListener('click',()=>{setInspect(false);$('#flight-inspect').focus({preventScroll:true});});
  document.addEventListener('click',event=>{const feature=event.target.closest('[data-feature]');if(feature)showFeature(Number(feature.dataset.feature));});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&inspecting){setInspect(false);$('#flight-inspect').focus({preventScroll:true});}});
  $('#effect-speed').addEventListener('change',event=>{effectRate=Number(event.target.value);});
  function updateAudioUi(){
    const status=audio.getStatus(),button=$('#flight-sound');
    button.setAttribute('aria-pressed',String(status.enabled));button.setAttribute('aria-label',status.enabled?'ปิดเสียงประกอบ':'เปิดเสียงประกอบ');button.dataset.state=status.state;
    $('#sound-mixer').hidden=!status.enabled;$('#journey').classList.toggle('sound-enabled',status.enabled);
    const meter=$('#sound-meter');meter.style.setProperty('--level',String(Math.min(1,status.level*85)));meter.dataset.level=status.level.toFixed(6);
  }
  function showSoundMixer(duration=6000){
    clearTimeout(soundMixerTimer);
    if(!audio.getStatus().enabled)return;
    $('#journey').classList.add('audio-adjusting');
    soundMixerTimer=setTimeout(()=>{if(!$('#sound-mixer').contains(document.activeElement))$('#journey').classList.remove('audio-adjusting');},duration);
  }
  $('#flight-sound').addEventListener('pointerenter',()=>showSoundMixer());
  $('#sound-mixer').addEventListener('pointerenter',()=>showSoundMixer());
  $('#sound-mixer').addEventListener('focusin',()=>showSoundMixer());
  $('#sound-mixer').addEventListener('focusout',()=>showSoundMixer(1200));
  $('#flight-sound').addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;
    const wasEnabled=audio.getStatus().enabled;
    try{await audio.toggle();updateAudioUi();if(audio.getStatus().enabled)showSoundMixer();else $('#journey').classList.remove('audio-adjusting');if(!wasEnabled&&!audio.getStatus().enabled)$('#flight-state').textContent='เปิดเสียงไม่สำเร็จ ลองกดอีกครั้งหรือเปิดในเบราว์เซอร์ที่รองรับเสียง';}
    finally{button.disabled=false;}
  });
  $('#sound-volume').addEventListener('input',event=>{const value=Number(event.target.value);audio.setVolume(value/100);$('#sound-volume-value').textContent=`${value}%`;});
  document.addEventListener('visibilitychange',async()=>{if(document.hidden)await audio.suspend();else await audio.resume();updateAudioUi();});
  window.addEventListener('pagehide',()=>audio.dispose(),{once:true});
  updateAudioUi();
  function go(id) {
    if (id===currentId || !ids.includes(id)) return;
    setInspect(false);
    if(retired){scene.remove(retired.group);retired.dispose();retired=null;}
    retired=world;
    world=createWorld(id);
    currentIndex=ids.indexOf(id);currentId=id;
    // Camera positions are an exhibit layout, separate from the stated Earth distances.
    center.set(Math.sin(currentIndex*1.7)*70, Math.sin(currentIndex*.7)*22, -currentIndex*225);
    world.group.position.copy(center);scene.add(world.group);
    yaw=0;pitch=.05;zoom=1;smoothYaw=0;smoothPitch=.05;smoothZoom=1;
    transitionStart.copy(camera.position);focusStart.copy(focus);
    transition={elapsed:0,duration:(reducedMotion||paused)?.01:4.1};
    $('#journey').classList.add('is-transiting');
    $('#flight-state').textContent=`กำลังเคลื่อนเข้าสู่ ${id==='earth'?'โลก':landmarks[currentIndex-1].thaiName}`;
    tourElapsed=0;
    audio.setScene(id);audio.transition();
    updateCaption();
  }
  function navigate(id) {
    if (id==='earth')go(id);else selectExhibit(id);
    $('#destinations-dialog').close();
  }
  document.addEventListener('exhibitselect',event=>{
    go(event.detail);
    $('#destinations-dialog').close();
  });
  $('#route-line').addEventListener('click',event=>{const button=event.target.closest('[data-flight-id]');if(button)navigate(button.dataset.flightId);});
  $('#flight-home').addEventListener('click',()=>navigate('earth'));
  $('#destination-earth').addEventListener('click',()=>navigate('earth'));
  $('#flight-prev').addEventListener('click',()=>navigate(ids[Math.max(0,currentIndex-1)]));
  $('#flight-next').addEventListener('click',()=>navigate(ids[Math.min(12,currentIndex+1)]));

  function openPanel(id, opener) {
    if(id==='#destinations-dialog')syncDestinationSelection();
    const panel=$(id);panel.showModal();panel.scrollTop=0;panel.querySelector('.panel-close').focus({preventScroll:true});
    panel._opener=opener;
  }
  $('#open-destinations').addEventListener('click',event=>openPanel('#destinations-dialog',event.currentTarget));
  document.querySelectorAll('.filter-button').forEach(button=>button.addEventListener('click',syncDestinationSelection));
  $('#open-knowledge').addEventListener('click',event=>openPanel('#knowledge-dialog',event.currentTarget));
  $('#open-about').addEventListener('click',event=>openPanel('#knowledge-dialog',event.currentTarget));
  $('#flight-detail').addEventListener('click',event=>{if(currentId==='earth')openPanel('#knowledge-dialog',event.currentTarget);else openDetail(currentId);});
  document.querySelectorAll('.flight-panel').forEach(panel=>{
    panel.querySelector('.panel-close').addEventListener('click',()=>panel.close());
    panel.addEventListener('close',()=>panel._opener?.focus({preventScroll:true}));
    panel.addEventListener('click',event=>{if(event.target===panel){const bounds=panel.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)panel.close();}});
  });

  function changeZoom(factor){zoom=THREE.MathUtils.clamp(zoom*factor,.67,3.6);}
  $('#flight-zoom-in').addEventListener('click',()=>changeZoom(.83));
  $('#flight-zoom-out').addEventListener('click',()=>changeZoom(1.2));
  $('#flight-reset').addEventListener('click',()=>{yaw=0;pitch=.05;zoom=1;});
  function updatePause(){const button=$('#flight-pause');button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'เริ่มการเคลื่อนไหว':'หยุดการเคลื่อนไหว');button.textContent=paused?'▷':'Ⅱ';}
  $('#flight-pause').addEventListener('click',()=>{paused=!paused;updatePause();});
  updatePause();
  function stopTour(){touring=false;$('#flight-tour').setAttribute('aria-pressed','false');$('#flight-tour').setAttribute('aria-label','เปิดการเดินทางอัตโนมัติ');$('#flight-tour').innerHTML='▷ <span>เดินทางอัตโนมัติ</span>';}
  $('#flight-tour').addEventListener('click',()=>{
    if(touring){stopTour();return;}
    touring=true;tourElapsed=0;paused=false;updatePause();
    $('#flight-tour').setAttribute('aria-pressed','true');$('#flight-tour').setAttribute('aria-label','หยุดการเดินทางอัตโนมัติ');$('#flight-tour').innerHTML='Ⅱ <span>หยุดเดินทาง</span>';
    if(currentIndex===12)navigate('earth');
  });
  if (!document.fullscreenEnabled) $('#flight-fullscreen').hidden=true;
  $('#flight-fullscreen').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{$('#flight-state').textContent='เบราว์เซอร์นี้ไม่รองรับโหมดเต็มจอ';}
  });
  document.addEventListener('fullscreenchange',()=>$('#flight-fullscreen').setAttribute('aria-label',document.fullscreenElement?'ออกจากเต็มจอ':'เปิดเต็มจอ'));
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');});
  canvas.addEventListener('pointermove',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.005,-1.15,1.15);
    pointer.x=event.clientX;pointer.y=event.clientY;
  });
  const release=()=>{pointer=null;canvas.classList.remove('is-dragging');};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('wheel',event=>{event.preventDefault();changeZoom(Math.exp(THREE.MathUtils.clamp(event.deltaY,-100,100)*.002));},{passive:false});
  canvas.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'){event.preventDefault();navigate(ids[Math.min(12,currentIndex+1)]);}
    else if(event.key==='ArrowLeft'){event.preventDefault();navigate(ids[Math.max(0,currentIndex-1)]);}
    else if(event.key==='+'||event.key==='='){event.preventDefault();changeZoom(.83);}
    else if(event.key==='-'){event.preventDefault();changeZoom(1.2);}
    else if(event.key==='ArrowUp'){event.preventDefault();pitch=Math.min(1.15,pitch+.1);}
    else if(event.key==='ArrowDown'){event.preventDefault();pitch=Math.max(-1.15,pitch-.1);}
    else if(event.key===' '){event.preventDefault();paused=!paused;updatePause();}
  });
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();$('#flight-state').textContent='ฉากหยุดชั่วคราว กดโหลดหน้าใหม่เพื่อกลับมาสำรวจ';});
  updateCaption();
  const initialScene=new URLSearchParams(location.search).get('scene');
  if(initialScene&&ids.includes(initialScene)&&initialScene!=='earth')navigate(initialScene);
  function frame(timestamp) {
    requestAnimationFrame(frame);
    const dt=Math.min(.05,Math.max(0,(timestamp-lastTime)/1000));lastTime=timestamp;
    if(document.hidden)return;
    const modalOpen=Boolean(document.querySelector('dialog[open]'));
    const running=!paused&&!modalOpen;
    if(running){animationTime+=dt;effectTime+=dt*effectRate;}
    const damping=1-Math.exp(-dt*5);
    smoothYaw=THREE.MathUtils.lerp(smoothYaw,yaw,damping);
    smoothPitch=THREE.MathUtils.lerp(smoothPitch,pitch,damping);
    smoothZoom=THREE.MathUtils.lerp(smoothZoom,zoom,damping);
    const floatingYaw=reducedMotion?0:Math.sin(animationTime*.10)*.035;
    const floatingPitch=reducedMotion?0:Math.cos(animationTime*.13)*.016;
    eye.copy(orbitPosition(center,smoothYaw+floatingYaw,smoothPitch+floatingPitch,smoothZoom));
    if(transition){
      if(!modalOpen&&(!paused||transition.duration<=.02))transition.elapsed+=dt;
      const t=Math.min(1,transition.elapsed/transition.duration);
      const eased=t*t*t*(t*(t*6-15)+10);
      camera.position.lerpVectors(transitionStart,eye,eased);
      if(currentIndex>0)camera.position.y+=Math.sin(t*Math.PI)*12;
      focus.lerpVectors(focusStart,center,eased);
      if(t===1){transition=null;$('#journey').classList.remove('is-transiting');$('#flight-state').textContent=`กำลังสำรวจ ${currentId==='earth'?'โลก':landmarks[currentIndex-1].thaiName}`;if(retired){scene.remove(retired.group);retired.dispose();retired=null;}}
    }else{camera.position.copy(eye);focus.copy(center);}
    camera.lookAt(focus);
    world.update(running?dt*effectRate:0,effectTime,camera.position);
    if(retired)retired.update(running?dt*effectRate:0,effectTime,camera.position);
    sun.position.copy(center).add(sunlightOffset);sun.target.position.copy(center);
    field.update(dt,animationTime,camera.position,pixelRatio);
    if(touring&&running&&!transition&&!inspecting){tourElapsed+=dt;if(tourElapsed>13){if(currentIndex<12)navigate(ids[currentIndex+1]);else stopTour();}}
    if(inspecting){
      world.features.forEach((feature,index)=>{
        featureProjection.copy(feature.point);world.group.localToWorld(featureProjection);featureProjection.project(camera);
        const x=(featureProjection.x*.5+.5)*width,y=(-featureProjection.y*.5+.5)*height;
        const button=featureButtons[index];if(!button)return;
        button.hidden=featureProjection.z>1||featureProjection.z< -1||x<40||x>width-40||y<120||y>height*.8;
        button.classList.toggle('is-left-label',x>width*.63);
        button.style.left=`${x}px`;button.style.top=`${y}px`;
      });
    }
    if(timestamp-lastSoundUpdate>80){updateAudioUi();lastSoundUpdate=timestamp;}
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}

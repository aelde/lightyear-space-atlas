import { createEnvironmentalLayer } from './environment-synthesis.js?v=7';
import { soundProfiles } from './sound-profiles.js?v=7';

// Environment-first sound design. Importing is silent; the user's click unlocks
// Web Audio. Earth uses a licensed field recording; other scenes are designed
// textures, not measurements or audio recorded from a distant object.
export function createSpaceAudio({ contextFactory, loadRecording } = {}) {
  let context=null, master=null, analyser=null, samples=null, graph=[];
  let enabled=false, held=false, disposed=false, volume=.5, sceneId='earth';
  let offline=false, revision=0, sceneRevision=0, muteTimer=null, retireTimer=null;
  let current=null, outgoing=null, recordingPromise=null, loading=false, fallback=false, failed=false, audibleScene=null;
  const recordingUrl=new URL('./assets/audio/earth-river-birds.mp3',import.meta.url);

  function ramp(parameter,value,duration=.7){
    const now=context.currentTime;
    if(typeof parameter.cancelAndHoldAtTime==='function')parameter.cancelAndHoldAtTime(now);
    else{const valueNow=parameter.value;parameter.cancelScheduledValues(now);parameter.setValueAtTime(valueNow,now);}
    parameter.linearRampToValueAtTime(value,now+duration);
  }
  function updateLevel(duration=.7){
    if(master)ramp(master.gain,enabled&&!held&&!disposed?volume*.9:0,duration);
  }
  function initialize(){
    const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Constructor&&typeof contextFactory!=='function')return false;
    context=typeof contextFactory==='function'?contextFactory():new Constructor({latencyHint:'playback'});
    offline=typeof context.startRendering==='function';
    const highpass=context.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=28;highpass.Q.value=.5;
    const compressor=context.createDynamicsCompressor();
    compressor.threshold.value=-15;compressor.knee.value=12;compressor.ratio.value=2.5;
    compressor.attack.value=.015;compressor.release.value=.45;
    master=context.createGain();master.gain.value=0;
    analyser=context.createAnalyser();analyser.fftSize=2048;samples=new Float32Array(analyser.fftSize);
    highpass.connect(compressor);compressor.connect(master);master.connect(analyser);analyser.connect(context.destination);
    graph=[highpass,compressor,master,analyser];
    return true;
  }
  function earthRecording(){
    if(!recordingPromise){
      recordingPromise=(async()=>{
        if(typeof loadRecording==='function')return loadRecording(context);
        const response=await fetch(recordingUrl);
        if(!response.ok)throw new Error('Nature recording unavailable');
        return context.decodeAudioData(await response.arrayBuffer());
      })().catch(error=>{recordingPromise=null;throw error;});
    }
    return recordingPromise;
  }
  function recordedLayer(buffer){
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(graph[0]);source.start();
    let removed=false;
    return{gain,dispose(){if(removed)return;removed=true;try{source.stop();}catch{}source.disconnect();gain.disconnect();}};
  }
  async function applyScene(duration=2.8){
    if(!context||disposed)return;
    const operation=++sceneRevision,id=sceneId,profile=soundProfiles[id];
    loading=id==='earth';fallback=false;failed=false;
    let layer;
    if(id==='earth'){
      try{
        const decoded=await earthRecording();
        if(disposed||operation!==sceneRevision)return;
        layer=recordedLayer(decoded);
      }catch{
        if(disposed||operation!==sceneRevision)return;
        fallback=true;
        layer=createEnvironmentalLayer(context,graph[0],'earth-fallback');
      }
    }else{
      layer=createEnvironmentalLayer(context,graph[0],profile.kind);
    }
    if(disposed||operation!==sceneRevision){layer.dispose();return;}
    loading=false;
    // A rapid second navigation retires the oldest fade immediately: two layers
    // maximum, regardless of how many destinations have been clicked.
    if(retireTimer!==null){clearTimeout(retireTimer);retireTimer=null;}
    if(outgoing){outgoing.dispose();outgoing=null;}
    outgoing=current;current=layer;audibleScene=id;
    layer.gain.gain.value=0;ramp(layer.gain.gain,profile.gain,duration);
    if(outgoing){
      ramp(outgoing.gain.gain,0,duration);
      const retiring=outgoing;
      retireTimer=setTimeout(()=>{retiring.dispose();if(outgoing===retiring)outgoing=null;retireTimer=null;},duration*1000+100);
    }
  }
  function queueScene(duration){
    const expected=sceneId;
    void applyScene(duration).catch(()=>{if(!disposed&&sceneId===expected){loading=false;failed=true;}});
  }
  async function toggle(){
    if(disposed)return false;
    const operation=++revision;
    if(muteTimer!==null){clearTimeout(muteTimer);muteTimer=null;}
    if(enabled){
      enabled=false;updateLevel(.65);
      if(context&&!offline)muteTimer=setTimeout(async()=>{
        muteTimer=null;if(disposed||enabled||held)return;
        try{await context.suspend();if(!disposed&&enabled&&!held){await context.resume();updateLevel(1.1);}}catch{}
      },750);
      return false;
    }
    if(typeof contextFactory!=='function'&&globalThis.navigator?.userActivation&&!navigator.userActivation.isActive)return false;
    enabled=true;
    try{
      const fresh=!context;
      if(fresh&&!initialize()){enabled=false;return false;}
      // Preparing the layer does not unlock playback. Do this before a resume
      // promise can be interrupted by visibility or a second mute gesture.
      if((audibleScene!==sceneId||!current||failed)&&!loading)queueScene(.8);
      // Resume before awaiting a recording: retain the originating user gesture.
      if(!offline&&!held)await context.resume();
      if(operation!==revision||disposed)return enabled&&!disposed;
      if(held){
        if(!offline){
          await context.suspend();
          if(!disposed&&enabled&&!held){await context.resume();updateLevel(1.1);}
        }
        return enabled;
      }
      if(!offline&&context.state!=='running'){enabled=false;return false;}
      updateLevel(1.25);return true;
    }catch{
      if(graph.length!==4){
        const broken=context;context=null;master=null;analyser=null;samples=null;graph=[];
        try{broken?.close?.()?.catch?.(()=>{});}catch{}
      }
      if(operation===revision){enabled=false;updateLevel(.2);}return false;
    }
  }
  function setScene(id){
    if(disposed)return;
    const next=Object.hasOwn(soundProfiles,id)?id:'interstellar';
    if(sceneId===next)return;
    sceneId=next;sceneRevision++;loading=false;if(context&&enabled)queueScene();
  }
  function setVolume(value){
    if(disposed||!Number.isFinite(value))return;
    volume=Math.max(0,Math.min(1,value));updateLevel(.2);
  }
  function getStatus(){
    let level=0;
    if(enabled&&!held&&!disposed&&analyser&&context.state==='running'){
      analyser.getFloatTimeDomainData(samples);let energy=0;
      for(let i=0;i<samples.length;i++)energy+=samples[i]*samples[i];
      level=Math.sqrt(energy/samples.length);
    }
    return{enabled:enabled&&!disposed,held,state:context?.state||'uninitialized',level,sceneId,
      loading,fallback,failed,activeLayers:(current?1:0)+(outgoing?1:0)};
  }
  async function suspend(){
    if(disposed)return false;held=true;const operation=++revision;
    if(!context)return false;updateLevel(.22);if(offline)return enabled;
    await new Promise(resolve=>setTimeout(resolve,260));
    if(disposed||operation!==revision||!held)return false;
    try{await context.suspend();if(!disposed&&enabled&&!held){await context.resume();updateLevel(1.1);}}catch{return false;}
    return enabled;
  }
  async function resume(){
    if(disposed)return false;held=false;const operation=++revision;
    if(!enabled||!context)return false;
    try{if(!offline)await context.resume();if(operation!==revision||disposed)return enabled&&!disposed;
      if(!offline&&context.state!=='running')return false;updateLevel(1.1);return true;
    }catch{return false;}
  }
  function dispose(){
    if(disposed)return;disposed=true;enabled=false;held=true;revision++;sceneRevision++;
    clearTimeout(muteTimer);clearTimeout(retireTimer);current?.dispose();outgoing?.dispose();
    current=null;outgoing=null;recordingPromise=null;
    for(const node of graph)node.disconnect();graph=[];
    if(context&&typeof context.close==='function')context.close().catch(()=>{});
  }
  // Environment crossfades replace the previous travel whoosh; no music bus.
  return{toggle,setScene,transition:()=>enabled&&!held&&!disposed,setVolume,getStatus,suspend,resume,dispose};
}

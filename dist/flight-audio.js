// Original procedural soundscape. Audio is opt-in; importing this module is silent.
const SCENES = {
  earth:        [55,     1200, 0.042],
  oort:         [49,      800, 0.052],
  interstellar: [41.203,  640, 0.032],
  centauri:     [55,     1350, 0.038],
  barnard:      [49,      930, 0.044],
  luhman:       [36.708,  760, 0.046],
  sirius:       [61.735, 1500, 0.032],
  vega:         [65.406, 1450, 0.031],
  pleiades:     [73.416, 1600, 0.045],
  orion:        [55,     1180, 0.062],
  sagittarius:  [36.708,  600, 0.048],
  lmc:          [49,     1150, 0.044],
  andromeda:    [43.654, 1020, 0.048]
};

function noiseBuffer(context) {
  // Independent, seeded brown-noise channels; tapered endpoints make the loop quiet.
  const length = Math.ceil(context.sampleRate * 9);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  const edge = Math.ceil(context.sampleRate * 0.18);
  let seed = 0x63a42bc1;
  const random = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let brown = 0;
    for (let index = 0; index < length; index++) {
      brown = (brown + (random() * 2 - 1) * 0.026) / 1.026;
      const fade = Math.min(1, index / edge, (length - 1 - index) / edge);
      data[index] = brown * 3.1 * Math.sin(fade * Math.PI / 2) ** 2;
    }
  }
  return buffer;
}

export function createSpaceAudio({ contextFactory } = {}) {
  let context = null, master = null, toneFilter = null, textureGain = null;
  let analyser = null, samples = null, muteTimer = null, offline = false, ready = false;
  let buffer = null, enabled = false, held = false, disposed = false;
  let volume = 0.5, sceneId = 'earth', revision = 0, lastTransition = -Infinity;
  const voices = [], sources = [], nodes = [], transients = new Set();
  const keep = node => { nodes.push(node); return node; };

  function ramp(parameter, value, duration = 0.7) {
    const now = context.currentTime;
    if (typeof parameter.cancelAndHoldAtTime === 'function') {
      parameter.cancelAndHoldAtTime(now);
    } else {
      const current = parameter.value;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
    }
    parameter.linearRampToValueAtTime(value, now + duration);
  }

  function updateLevel(duration = 0.7) {
    if (master) ramp(master.gain, enabled && !held && !disposed ? volume * 0.18 : 0, duration);
  }

  function applyScene(duration = 6) {
    if (!context) return;
    const [root, cutoff, air] = SCENES[sceneId] || SCENES.interstellar;
    for (const voice of voices) ramp(voice.oscillator.frequency, root * voice.ratio, duration);
    ramp(toneFilter.frequency, cutoff, duration);
    ramp(textureGain.gain, air, duration);
  }

  function initialize() {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass && typeof contextFactory !== 'function') return false;
    // Injection is only needed for deterministic OfflineAudioContext verification.
    context = typeof contextFactory === 'function' ? contextFactory() : new AudioContextClass({ latencyHint: 'playback' });
    offline = typeof context.startRendering === 'function';
    const mix = keep(context.createGain());
    const highpass = keep(context.createBiquadFilter());
    highpass.type = 'highpass'; highpass.frequency.value = 26; highpass.Q.value = 0.6;
    toneFilter = keep(context.createBiquadFilter());
    toneFilter.type = 'lowpass'; toneFilter.frequency.value = 1200; toneFilter.Q.value = 0.5;
    const compressor = keep(context.createDynamicsCompressor());
    compressor.threshold.value = -17; compressor.knee.value = 20;
    compressor.ratio.value = 3; compressor.attack.value = 0.035; compressor.release.value = 0.8;
    master = keep(context.createGain()); master.gain.value = 0;
    analyser = keep(context.createAnalyser()); analyser.fftSize = 2048;
    samples = new Float32Array(analyser.fftSize);
    mix.connect(highpass); highpass.connect(toneFilter); toneFilter.connect(compressor);
    compressor.connect(master); master.connect(analyser); analyser.connect(context.destination);

    const breath = keep(context.createOscillator());
    breath.frequency.value = 0.037;
    const drift = keep(context.createOscillator());
    drift.frequency.value = 0.021;
    const detuneDepth = keep(context.createGain()); detuneDepth.gain.value = 2.6;
    drift.connect(detuneDepth);
    sources.push(breath, drift);

    // Open fifths, soft low harmonics and small stereo offsets, with no sharp attacks.
    const layers = [
      [1,    0.15,  -0.36, 'sine',      -1.5],
      [1,    0.105,  0.36, 'sine',       1.5],
      [1.5,  0.075, -0.55, 'sine',      -0.6],
      [2,    0.11,   0.52, 'triangle',   0.6],
      [3,    0.065, -0.18, 'sine',       1.0],
      [4.5,  0.04,   0.21, 'sine',      -1.0]
    ];
    for (const [ratio, level, pan, type, detune] of layers) {
      const oscillator = keep(context.createOscillator());
      oscillator.type = type; oscillator.frequency.value = 55 * ratio; oscillator.detune.value = detune;
      const gain = keep(context.createGain()); gain.gain.value = level;
      const panner = keep(context.createStereoPanner()); panner.pan.value = pan;
      const breathDepth = keep(context.createGain()); breathDepth.gain.value = level * 0.12;
      oscillator.connect(gain); gain.connect(panner); panner.connect(mix);
      breath.connect(breathDepth); breathDepth.connect(gain.gain); detuneDepth.connect(oscillator.detune);
      sources.push(oscillator); voices.push({ oscillator, ratio });
    }

    buffer = noiseBuffer(context);
    const texture = keep(context.createBufferSource()); texture.buffer = buffer; texture.loop = true;
    const airHighpass = keep(context.createBiquadFilter());
    airHighpass.type = 'highpass'; airHighpass.frequency.value = 95; airHighpass.Q.value = 0.5;
    const airLowpass = keep(context.createBiquadFilter());
    airLowpass.type = 'lowpass'; airLowpass.frequency.value = 720; airLowpass.Q.value = 0.5;
    textureGain = keep(context.createGain()); textureGain.gain.value = 0.042;
    texture.connect(airHighpass); airHighpass.connect(airLowpass);
    airLowpass.connect(textureGain); textureGain.connect(mix);
    sources.push(texture);
    applyScene(0.02);
    for (const source of sources) source.start();
    ready = true;
    return true;
  }

  async function toggle() {
    if (disposed) return false;
    const operation = ++revision;
    if (muteTimer !== null) { clearTimeout(muteTimer); muteTimer = null; }
    if (enabled) {
      enabled = false;
      updateLevel(0.65);
      if (context && !offline) {
        muteTimer = setTimeout(async () => {
          muteTimer = null;
          if (disposed || enabled || held) return;
          try {
            await context.suspend();
            if (!disposed && enabled && !held) { await context.resume(); updateLevel(1.1); }
          } catch { /* A closed or externally suspended context remains silent. */ }
        }, 750);
      }
      return false;
    }
    // A scene change or lifecycle callback can never unlock audio on its own.
    if (typeof contextFactory !== 'function' && globalThis.navigator?.userActivation && !navigator.userActivation.isActive) return false;
    enabled = true;
    try {
      if (!context && !initialize()) { enabled = false; return false; }
      if (held) {
        if (!offline) {
          await context.suspend();
          if (!disposed && enabled && !held) { await context.resume(); updateLevel(1.1); }
        }
        return enabled;
      }
      if (!offline) await context.resume(); // Called directly within the originating user gesture.
      if (operation !== revision || disposed) return enabled && !disposed;
      if (!offline && context.state !== 'running') { enabled = false; return false; }
      updateLevel(1.8);
      return true;
    } catch {
      if (operation === revision) { enabled = false; updateLevel(0.2); }
      if (!ready && context) {
        if (typeof context.close === 'function') context.close().catch(() => {});
        nodes.length = 0; sources.length = 0; voices.length = 0;
        context = null; master = null; analyser = null; samples = null; buffer = null;
      }
      return false;
    }
  }

  function setScene(id) {
    if (disposed) return;
    sceneId = Object.hasOwn(SCENES, id) ? id : 'interstellar';
    applyScene();
  }

  function setVolume(value) {
    if (disposed || !Number.isFinite(value)) return;
    volume = Math.max(0, Math.min(1, value));
    updateLevel();
  }

  function getStatus() {
    let level = 0;
    if (enabled && !held && !disposed && analyser && context.state === 'running') {
      analyser.getFloatTimeDomainData(samples);
      let energy = 0;
      for (let index = 0; index < samples.length; index++) energy += samples[index] * samples[index];
      level = Math.sqrt(energy / samples.length);
    }
    return { enabled: enabled && !disposed, held, state: context?.state || 'uninitialized', level };
  }

  function transition() {
    if (!enabled || held || disposed || !context || (!offline && context.state !== 'running')) return false;
    const now = context.currentTime;
    if (now - lastTransition < 0.75) return false;
    lastTransition = now;
    const localNodes = [];
    const track = node => { localNodes.push(node); return node; };
    const noise = track(context.createBufferSource()); noise.buffer = buffer;
    const highpass = track(context.createBiquadFilter());
    highpass.type = 'highpass'; highpass.frequency.value = 100; highpass.Q.value = 0.5;
    const lowpass = track(context.createBiquadFilter());
    lowpass.type = 'lowpass'; lowpass.Q.value = 0.45;
    lowpass.frequency.setValueAtTime(220, now);
    lowpass.frequency.exponentialRampToValueAtTime(1400, now + 0.75);
    lowpass.frequency.exponentialRampToValueAtTime(240, now + 2.1);
    const sweepGain = track(context.createGain()); sweepGain.gain.setValueAtTime(0, now);
    sweepGain.gain.linearRampToValueAtTime(0.095, now + 0.65);
    sweepGain.gain.linearRampToValueAtTime(0.032, now + 1.3);
    sweepGain.gain.linearRampToValueAtTime(0, now + 2.15);
    const pan = track(context.createStereoPanner());
    pan.pan.setValueAtTime(-0.3, now); pan.pan.linearRampToValueAtTime(0.3, now + 2.1);
    noise.connect(highpass); highpass.connect(lowpass); lowpass.connect(sweepGain);
    sweepGain.connect(pan); pan.connect(toneFilter);

    const bass = track(context.createOscillator()); bass.type = 'sine';
    bass.frequency.setValueAtTime(72, now); bass.frequency.exponentialRampToValueAtTime(38, now + 2.15);
    const bassGain = track(context.createGain()); bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.035, now + 0.7);
    bassGain.gain.linearRampToValueAtTime(0, now + 2.15);
    bass.connect(bassGain); bassGain.connect(toneFilter);
    const entry = { sources: [noise, bass], nodes: localNodes };
    transients.add(entry);
    noise.onended = () => {
      for (const node of localNodes) node.disconnect();
      transients.delete(entry);
    };
    noise.start(now, 0.5); bass.start(now);
    noise.stop(now + 2.2); bass.stop(now + 2.2);
    return true;
  }

  async function suspend() {
    if (disposed) return false;
    held = true;
    const operation = ++revision;
    if (!context) return false;
    updateLevel(0.22);
    if (offline) return enabled;
    await new Promise(resolve => setTimeout(resolve, 260));
    if (disposed || operation !== revision || !held) return false;
    try {
      await context.suspend();
      // A resume gesture can arrive while the browser processes suspension.
      if (!disposed && enabled && !held) { await context.resume(); updateLevel(1.1); }
    } catch { return false; }
    return enabled;
  }

  async function resume() {
    if (disposed) return false;
    held = false;
    const operation = ++revision;
    if (!enabled || !context) return false;
    try {
      if (!offline) await context.resume();
      if (operation !== revision || disposed) return enabled && !disposed;
      if (!offline && context.state !== 'running') return false;
      updateLevel(1.1);
      return true;
    } catch { return false; }
  }

  function dispose() {
    if (disposed) return;
    disposed = true; enabled = false; held = true; revision++;
    if (muteTimer !== null) { clearTimeout(muteTimer); muteTimer = null; }
    if (!context) return;
    updateLevel(0.08);
    const end = context.currentTime + 0.12;
    for (const source of sources) { try { source.stop(end); } catch { /* Already stopped. */ } }
    for (const entry of transients) {
      for (const source of entry.sources) { try { source.stop(end); } catch { /* Already ended. */ } }
    }
    setTimeout(() => {
      for (const node of nodes) node.disconnect();
      for (const entry of transients) for (const node of entry.nodes) node.disconnect();
      transients.clear(); voices.length = 0; sources.length = 0; nodes.length = 0; buffer = null;
      if (typeof context.close === 'function') context.close().catch(() => {});
    }, 170);
  }

  return { toggle, setScene, transition, setVolume, getStatus, suspend, resume, dispose };
}

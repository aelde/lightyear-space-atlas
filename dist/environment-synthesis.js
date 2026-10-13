// Original procedural environmental audio: a visual interpretation, not sound
// recorded in space or a physical model of sound propagating through a vacuum.
// Importing this module is silent. No oscillator, musical pitch, timer or fetch.

export const ENVIRONMENT_PROFILES = Object.freeze({
  'stellar-red': Object.freeze({
    seed: 0x71ce193d, rms: 0.105, roll: 0.84, air: 0.26, grain: 0.12,
    lowCut: 42, highCut: 3200, eventRate: 3.6, eventMin: 0.009,
    eventMax: 0.075, eventLevel: 0.65, eventCut: 2200, eventShape: 'crackle',
    swellPeriod: 2.9, swellDepth: 0.3,
  }),
  'stellar-hot': Object.freeze({
    seed: 0x4529af61, rms: 0.092, roll: 0.29, air: 0.75, grain: 0.2,
    lowCut: 125, highCut: 4100, eventRate: 7.4, eventMin: 0.004,
    eventMax: 0.032, eventLevel: 0.32, eventCut: 3400, eventShape: 'crackle',
    swellPeriod: 1.75, swellDepth: 0.17,
  }),
  storm: Object.freeze({
    seed: 0xbb41752b, rms: 0.105, roll: 0.91, air: 0.33, grain: 0.02,
    lowCut: 38, highCut: 2250, eventRate: 0.25, eventMin: 0.85,
    eventMax: 2.7, eventLevel: 1.8, eventCut: 210, eventShape: 'rolling',
    swellPeriod: 4.8, swellDepth: 0.46,
  }),
  nebula: Object.freeze({
    seed: 0xcf10e29b, rms: 0.052, roll: 0.17, air: 0.59, grain: 0,
    lowCut: 115, highCut: 1850, eventRate: 0.16, eventMin: 2.8,
    eventMax: 6.3, eventLevel: 0.27, eventCut: 1100, eventShape: 'wisp',
    swellPeriod: 6.7, swellDepth: 0.42,
  }),
  accretion: Object.freeze({
    seed: 0x29f6d423, rms: 0.11, roll: 1.0, air: 0.12, grain: 0.06,
    lowCut: 32, highCut: 1050, eventRate: 2.1, eventMin: 0.095,
    eventMax: 0.47, eventLevel: 1.22, eventCut: 280, eventShape: 'rolling',
    swellPeriod: 0.72, swellDepth: 0.55,
  }),
  quiet: Object.freeze({
    seed: 0x9492a521, rms: 0.0055, roll: 0.035, air: 0.008, grain: 0,
    lowCut: 85, highCut: 1250, eventRate: 0.07, eventMin: 0.018,
    eventMax: 0.075, eventLevel: 0.034, eventCut: 1000, eventShape: 'grain',
    swellPeriod: 8.2, swellDepth: 0.7,
  }),
  galaxy: Object.freeze({
    seed: 0xa0136fc5, rms: 0.025, roll: 0.075, air: 0.18, grain: 0,
    lowCut: 180, highCut: 2100, eventRate: 0.09, eventMin: 2.9,
    eventMax: 7.1, eventLevel: 0.14, eventCut: 1650, eventShape: 'wisp',
    swellPeriod: 7.8, swellDepth: 0.54,
  }),
  dust: Object.freeze({
    seed: 0x65df1329, rms: 0.021, roll: 0.043, air: 0.085, grain: 0.012,
    lowCut: 170, highCut: 2500, eventRate: 1.1, eventMin: 0.003,
    eventMax: 0.022, eventLevel: 0.095, eventCut: 1900, eventShape: 'grain',
    swellPeriod: 5.2, swellDepth: 0.38,
  }),
  'earth-fallback': Object.freeze({
    seed: 0xe44523d1, rms: 0.078, roll: 0.25, air: 0.65, grain: 0.035,
    lowCut: 75, highCut: 2600, eventRate: 0.22, eventMin: 1.5,
    eventMax: 4.6, eventLevel: 0.44, eventCut: 1250, eventShape: 'wisp',
    swellPeriod: 5.3, swellDepth: 0.37,
  }),
});

export const ENVIRONMENT_KINDS = Object.freeze(Object.keys(ENVIRONMENT_PROFILES));

// Weak keys do not keep a caller's AudioContext alive. Each context retains at
// most three 24-second stereo buffers; Map order is least-to-most recently used.
const contextBuffers = new WeakMap();
const MAX_CACHED_BUFFERS = 3;

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const coefficient = (cutoff, sampleRate) => 1 - Math.exp(-2 * Math.PI * Math.min(cutoff, sampleRate * 0.42) / sampleRate);
const smooth = value => value * value * (3 - 2 * value);

function randomEnvelope(random, length, sampleRate, period) {
  const count = Math.ceil(length / (sampleRate * period)) + 3;
  const knots = Array.from({ length: count }, () => 0.2 + random() * 0.8);
  return index => {
    const position = index / (sampleRate * period);
    const integer = Math.floor(position), fraction = smooth(position - integer);
    return knots[integer] * (1 - fraction) + knots[integer + 1] * fraction;
  };
}

function addEvents(channels, profile, sampleRate, random) {
  const length = channels[0].length;
  const totalDuration = length / sampleRate;
  let seconds = random() / Math.max(0.01, profile.eventRate);
  const filterCoefficient = coefficient(profile.eventCut, sampleRate);
  while (seconds < totalDuration) {
    const eventDuration = profile.eventMin + random() * (profile.eventMax - profile.eventMin);
    const start = Math.floor(seconds * sampleRate);
    const frames = Math.max(8, Math.floor(eventDuration * sampleRate));
    const amplitude = profile.eventLevel * (0.4 + random() * 0.6);
    const pan = (random() * 2 - 1) * 0.65;
    const left = Math.sqrt((1 - pan) * 0.5), right = Math.sqrt((1 + pan) * 0.5);
    let noise = 0, sub = 0;
    for (let frame = 0; frame < frames && start + frame < length; frame++) {
      const phase = frame / frames;
      const white = random() * 2 - 1;
      noise += filterCoefficient * (white - noise);
      sub += coefficient(66, sampleRate) * (noise - sub);
      let envelope, signal;
      if (profile.eventShape === 'rolling') {
        const attack = smooth(Math.min(1, phase / 0.19));
        envelope = attack * (1 - phase) ** 1.7;
        signal = noise * 5.3 + sub * 4.2;
      } else if (profile.eventShape === 'wisp') {
        const arch = 4 * phase * (1 - phase);
        envelope = arch * arch;
        signal = (noise - sub) * 2.7;
      } else {
        const attackFrames = Math.max(6, sampleRate * 0.0015);
        const attack = smooth(Math.min(1, frame / attackFrames));
        envelope = attack * (1 - phase) ** (profile.eventShape === 'grain' ? 3.6 : 2.25);
        signal = (noise - sub * 0.6) * 2.2;
      }
      const sample = signal * amplitude * envelope;
      channels[0][start + frame] += sample * left;
      channels[1][start + frame] += sample * right;
    }
    // Poisson spacing avoids a musical beat or predictable repeating flare pulse.
    seconds += -Math.log(Math.max(0.0001, random())) / profile.eventRate;
  }
}

/**
 * Pure deterministic stereo renderer, usable in a browser or Node.
 * Recommended runtime duration is 24 s. Short durations are useful for previews.
 * The returned peak is bounded below 0.8; quieter profiles deliberately have a
 * lower RMS than the stellar/storm profiles, so empty space remains nearly silent.
 */
export function renderEnvironment(kind, { sampleRate = 48000, duration = 24, seed } = {}) {
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000) {
    throw new RangeError('sampleRate must be between 8000 and 192000 Hz');
  }
  if (!Number.isFinite(duration) || duration <= 0 || duration > 60) {
    throw new RangeError('duration must be greater than zero and at most 60 seconds');
  }
  const resolvedKind = ENVIRONMENT_PROFILES[kind] ? kind : 'quiet';
  const profile = ENVIRONMENT_PROFILES[resolvedKind];
  const random = seededRandom(seed === undefined ? profile.seed : Number(seed) >>> 0);
  const frames = Math.max(128, Math.floor(duration * sampleRate));
  const seamFrames = Math.min(Math.floor(sampleRate * 0.48), Math.floor(frames / 4));
  const warmupFrames = Math.floor(sampleRate * 0.22);
  const renderFrames = frames + seamFrames;
  const raw = [new Float32Array(renderFrames), new Float32Array(renderFrames)];
  const swell = randomEnvelope(random, renderFrames, sampleRate, profile.swellPeriod);
  const leftRandom = seededRandom((seed ?? profile.seed) ^ 0x9e3779b9);
  const rightRandom = seededRandom((seed ?? profile.seed) ^ 0x85ebca6b);
  const sharedRandom = seededRandom((seed ?? profile.seed) ^ 0xc2b2ae35);
  const rollCoefficient = coefficient(110, sampleRate);
  const floorCoefficient = coefficient(30, sampleRate);
  const airCoefficient = coefficient(2900, sampleRate);
  const middleCoefficient = coefficient(340, sampleRate);
  const grainCoefficient = coefficient(6500, sampleRate);
  const grainFloorCoefficient = coefficient(1700, sampleRate);
  const states = Array.from({ length: 2 }, () => ({ roll: 0, floor: 0, air: 0, middle: 0, grain: 0, grainFloor: 0 }));

  for (let index = -warmupFrames; index < renderFrames; index++) {
    const common = sharedRandom() * 2 - 1;
    const depth = index < 0 ? 0.7 : 1 - profile.swellDepth + profile.swellDepth * swell(index);
    for (let channel = 0; channel < 2; channel++) {
      const state = states[channel];
      const independent = (channel === 0 ? leftRandom() : rightRandom()) * 2 - 1;
      const white = common * 0.57 + independent * 0.68;
      state.roll += rollCoefficient * (white - state.roll);
      state.floor += floorCoefficient * (white - state.floor);
      state.air += airCoefficient * (white - state.air);
      state.middle += middleCoefficient * (white - state.middle);
      state.grain += grainCoefficient * (white - state.grain);
      state.grainFloor += grainFloorCoefficient * (white - state.grainFloor);
      const roll = (state.roll - state.floor) * 7.1;
      const air = (state.air - state.middle) * 2.4;
      const grain = (state.grain - state.grainFloor) * 1.65;
      if (index >= 0) {
        raw[channel][index] = (roll * profile.roll + air * profile.air + grain * profile.grain) * depth;
      }
    }
  }
  addEvents(raw, profile, sampleRate, random);
  const lowCoefficient = coefficient(profile.highCut, sampleRate);
  const highCoefficient = coefficient(profile.lowCut, sampleRate);
  const channels = [new Float32Array(frames), new Float32Array(frames)];

  for (let channel = 0; channel < 2; channel++) {
    let low = 0, high = 0;
    for (let index = 0; index < renderFrames; index++) {
      low += lowCoefficient * (raw[channel][index] - low);
      high += highCoefficient * (low - high);
      raw[channel][index] = low - high;
    }
    channels[channel].set(raw[channel].subarray(0, frames));
    // Overlap the generated tail with the beginning using an equal-power seam.
    // At wraparound, the last raw frame continues into the saved tail, rather
    // than fading to silence or restarting an unrelated white-noise waveform.
    for (let index = 0; index < seamFrames; index++) {
      const fraction = index / Math.max(1, seamFrames - 1);
      const theta = fraction * Math.PI * 0.5;
      channels[channel][index] = raw[channel][frames + index] * Math.cos(theta) + raw[channel][index] * Math.sin(theta);
    }
    // A sub-millisecond bridge gives an exact matching sample at the loop seam.
    const bridge = Math.min(32, Math.floor(frames / 16));
    const first = channels[channel][0];
    for (let index = 0; index < bridge; index++) {
      const position = frames - bridge + index;
      const blend = smooth((index + 1) / bridge);
      channels[channel][position] = channels[channel][position] * (1 - blend) + first * blend;
    }
  }

  // Remove DC, match the profile's intended level, then softly limit sharp
  // transients. A shared gain preserves stereo panning and relative dynamics.
  const means = channels.map(data => data.reduce((sum, value) => sum + value, 0) / frames);
  let squareSum = 0;
  for (let channel = 0; channel < 2; channel++) {
    for (let index = 0; index < frames; index++) {
      const sample = channels[channel][index] - means[channel];
      channels[channel][index] = sample;
      squareSum += sample * sample;
    }
  }
  const originalRms = Math.sqrt(squareSum / (frames * 2));
  const normalization = profile.rms / Math.max(1e-9, originalRms);
  let peak = 0, finalSquares = 0;
  for (let channel = 0; channel < 2; channel++) {
    for (let index = 0; index < frames; index++) {
      const sample = Math.tanh(channels[channel][index] * normalization / 0.73) * 0.73;
      channels[channel][index] = sample;
      peak = Math.max(peak, Math.abs(sample));
      finalSquares += sample * sample;
    }
  }
  return {
    kind: resolvedKind, channels, sampleRate, duration: frames / sampleRate,
    loopStart: 0, loopEnd: frames / sampleRate,
    peak, rms: Math.sqrt(finalSquares / (frames * 2)),
  };
}

/**
 * Runtime buffers use exactly the same renderer as offline/WAV previews.
 * Only AudioBuffers are cached; temporary rendering arrays are released.
 */
function getEnvironmentalBuffer(context, kind) {
  let cache = contextBuffers.get(context);
  if (!cache) {
    cache = new Map();
    contextBuffers.set(context, cache);
  }
  if (cache.has(kind)) {
    const buffer = cache.get(kind);
    cache.delete(kind);
    cache.set(kind, buffer);
    return buffer;
  }
  const rendered = renderEnvironment(kind, { sampleRate: context.sampleRate, duration: 24 });
  const buffer = context.createBuffer(2, rendered.channels[0].length, context.sampleRate);
  rendered.channels.forEach((channel, index) => {
    if (typeof buffer.copyToChannel === 'function') buffer.copyToChannel(channel, index);
    else buffer.getChannelData(index).set(channel);
  });
  cache.set(kind, buffer);
  if (cache.size > MAX_CACHED_BUFFERS) cache.delete(cache.keys().next().value);
  return buffer;
}

/**
 * The destination and AudioContext are owned by the caller. This layer owns
 * only its own looping source and gains. gain starts at 1 for caller fades.
 * update(time,{activity}) optionally adds a small non-pitched activity lift.
 */
export function createEnvironmentalLayer(context, destination, kind) {
  const resolvedKind = ENVIRONMENT_KINDS.includes(kind) ? kind : 'quiet';
  const buffer = getEnvironmentalBuffer(context, resolvedKind);
  const source = context.createBufferSource();
  const activityGain = context.createGain();
  const gain = context.createGain();
  let disposed = false;
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;
  activityGain.gain.value = 1;
  gain.gain.value = 1;
  source.connect(activityGain);
  activityGain.connect(gain);
  gain.connect(destination);
  source.start();

  return {
    gain, kind: resolvedKind,
    update(_time, { activity = 0 } = {}) {
      if (disposed) return;
      const value = 1 + clamp(Number(activity) || 0, 0, 1) * 0.18;
      activityGain.gain.setTargetAtTime(value, context.currentTime, 0.12);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const now = context.currentTime;
      const disconnect = () => {
        source.disconnect(); activityGain.disconnect(); gain.disconnect();
        source.buffer = null;
        source.onended = null;
      };
      if (context.state !== 'running') {
        // A suspended context cannot advance a fade or emit onended promptly.
        try { source.stop(); } catch { /* Already stopped by context closure. */ }
        disconnect();
        return;
      }
      activityGain.gain.cancelScheduledValues(now);
      activityGain.gain.setValueAtTime(activityGain.gain.value, now);
      activityGain.gain.linearRampToValueAtTime(0, now + 0.025);
      source.onended = disconnect;
      try { source.stop(now + 0.03); } catch {
        disconnect();
      }
    },
  };
}

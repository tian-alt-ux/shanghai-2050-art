// Reference: claudiuangheloni.com/audio.js and its public space-01.mp3.
// One sound controller spans the globe, menu and artwork; it starts on a real gesture.
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const preferenceKey = 'sh2050-sound-enabled';
let enabled = true;
try { enabled = localStorage.getItem(preferenceKey) !== 'false'; } catch {}
let language = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
let unlocked = false;
let status = enabled ? 'waiting' : 'muted';
let context, fxBus, fxMaster, noiseBuffer, soundtrack, soundtrackGain;
let requestId = 0, pauseTimer, hoverUntil = 0;
let view = document.body.dataset.view || 'landing';

const copy = {
  en: {on:'SOUND ON',off:'SOUND OFF',error:'SOUND UNAVAILABLE',enable:'Enable music and interface sounds',disable:'Mute music and interface sounds',waiting:'Music starts with your first interaction'},
  zh: {on:'声音开',off:'声音关',error:'声音不可用',enable:'开启背景音乐与界面音效',disable:'关闭背景音乐与界面音效',waiting:'首次操作后播放背景音乐'}
};

function refresh() {
  const text = copy[language];
  document.querySelectorAll('[data-sound-toggle], #sound').forEach(button => {
    const label = status === 'error' ? text.error : enabled ? text.on : text.off;
    const inner = button.querySelector('.sound-label');
    if (inner) inner.textContent = label;
    else button.textContent = label;
    const title = status === 'error' ? text.error : enabled ? (status === 'waiting' ? text.waiting : text.disable) : text.enable;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', title);
    button.title = title;
    button.dataset.soundState = status;
  });
  document.body.dataset.sound = status;
  window.dispatchEvent(new CustomEvent('sh2050:sound-state', {detail:{enabled,status,playing:!!soundtrack && !soundtrack.paused && status === 'playing'}}));
}

function makeContext() {
  if (context || !AudioContextClass) return;
  context = new AudioContextClass();
  fxMaster = context.createGain();
  fxBus = context.createGain();
  // The reference mixes UI tones at 0.54 × 0.62.
  fxMaster.gain.value = enabled ? .54 : 0;
  fxBus.gain.value = .62;
  fxBus.connect(fxMaster);
  fxMaster.connect(context.destination);
  noiseBuffer = context.createBuffer(1, Math.round(context.sampleRate * 2), context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1)*.18;
}

function makeSoundtrack() {
  if (soundtrack) return;
  soundtrack = new Audio(new URL('./assets/audio/space-01.mp3', import.meta.url).href);
  soundtrack.loop = true;
  soundtrack.preload = 'auto';
  soundtrack.playsInline = true;
  soundtrack.volume = 1;
  soundtrack.id = 'site-soundtrack';
  soundtrack.hidden = true;
  soundtrack.setAttribute('aria-hidden','true');
  document.body.append(soundtrack);
  if (context) {
    const source = context.createMediaElementSource(soundtrack);
    soundtrackGain = context.createGain();
    soundtrackGain.gain.value = 0;
    source.connect(soundtrackGain);
    soundtrackGain.connect(context.destination);
  } else soundtrack.volume = 0;
  soundtrack.addEventListener('error', () => { status='error'; refresh(); });
}

function trackLevel() { return view === 'menu' ? .10 : .12; }
function ramp(gain, target, seconds=.6) {
  if (!gain || !context) return;
  const time = context.currentTime;
  if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(time);
  else { const value = gain.value; gain.cancelScheduledValues(time); gain.setValueAtTime(value,time); }
  gain.linearRampToValueAtTime(target,time+seconds);
}

async function play() {
  if (!enabled || !unlocked || document.hidden) return;
  const id = ++requestId;
  clearTimeout(pauseTimer);
  try {
    makeContext();
    makeSoundtrack();
    // Calls are made while the gesture is still active, rather than waiting for a fetch.
    const resume = context?.resume();
    const mediaPlay = soundtrack.play();
    await Promise.all([resume,mediaPlay]);
    if (id !== requestId || !enabled || document.hidden) return;
    status = 'playing';
    ramp(fxMaster?.gain,.54,.06);
    if (soundtrackGain) ramp(soundtrackGain.gain,trackLevel(),.9);
    else soundtrack.volume = trackLevel();
    refresh();
  } catch (error) {
    if (id !== requestId) return;
    status = error?.name === 'NotAllowedError' ? 'waiting' : 'error';
    refresh();
  }
}

function quiet(immediate=false) {
  ++requestId;
  clearTimeout(pauseTimer);
  ramp(fxMaster?.gain,0,.07);
  ramp(soundtrackGain?.gain,0,immediate ? .01 : .24);
  if (!soundtrackGain && soundtrack) soundtrack.volume = 0;
  const pause = () => {
    soundtrack?.pause();
    if (document.hidden) context?.suspend().catch(()=>{});
  };
  if (immediate) pause(); else pauseTimer = setTimeout(pause,260);
  status = enabled ? (unlocked ? 'paused' : 'waiting') : 'muted';
  refresh();
}

function setEnabled(next) {
  enabled = !!next;
  try { localStorage.setItem(preferenceKey,String(enabled)); } catch {}
  if (enabled) {
    status = unlocked ? 'paused' : 'waiting';
    refresh();
    void play();
  } else quiet();
  return enabled;
}

function prime(event) {
  if (!event.isTrusted || (event.type === 'keydown' && event.repeat)) return;
  unlocked = true;
  // A sound-toggle click must toggle once, without first starting the track.
  if (event.target.closest?.('[data-sound-toggle], #sound')) return;
  if (enabled) {
    makeContext();
    if (context?.state !== 'running') context?.resume().catch(()=>{});
    if (!soundtrack || soundtrack.paused || status !== 'playing') void play();
  }
}

function tone(frequency,type,duration,volume,attack,release,detune=0) {
  if (!context || !fxBus) return;
  const start = context.currentTime, end = start+duration;
  const oscillator = context.createOscillator(), gain=context.createGain();
  oscillator.type=type;
  oscillator.frequency.setValueAtTime(frequency,start);
  oscillator.detune.setValueAtTime(detune,start);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+attack);
  gain.gain.exponentialRampToValueAtTime(.0001,end+release);
  oscillator.connect(gain);gain.connect(fxBus);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  oscillator.start(start);oscillator.stop(end+release+.02);
}

function noise(volume) {
  if (!context || !noiseBuffer) return;
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  const start=context.currentTime;
  source.buffer=noiseBuffer;source.loop=true;
  filter.type='bandpass';filter.frequency.value=2200;filter.Q.value=1.2;
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.006);
  gain.gain.exponentialRampToValueAtTime(.0001,start+.006);
  source.connect(filter);filter.connect(gain);gain.connect(fxBus);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  source.start(start);source.stop(start+.026);
}

function clickSound() {
  if (!enabled || !unlocked || document.hidden || !context) return;
  ramp(fxMaster.gain,.54,.001);
  tone(4680,'triangle',.012,.04,.0007,.01);
  tone(9280,'square',.009,.03,.0005,.009);
  tone(13240,'sine',.006,.024,.0005,.006,24);
  noise(.01);
}

function hoverSound() {
  if (!enabled || !unlocked || document.hidden || !context || performance.now()<hoverUntil) return;
  hoverUntil=performance.now()+100;
  tone(7040,'square',.008,.05,.0005,.008);
  tone(9880,'sine',.006,.034,.0005,.007,22);
  tone(12160,'sine',.004,.022,.0005,.006,14);
  noise(.008);
}

const interactive = 'button, a, input[type="checkbox"], [role="button"]';
document.addEventListener('pointerdown',prime,{capture:true});
document.addEventListener('keydown',prime,{capture:true});
document.addEventListener('click', event => {
  if (!event.isTrusted) return;
  const control=event.target.closest?.(interactive);
  if (!control || control.disabled) return;
  if (control.matches('[data-sound-toggle], #sound')) {
    // A genuine toggle is also a valid autoplay-unlock gesture.
    unlocked=true;
    const next=!enabled;
    if (next) { makeContext(); context?.resume().catch(()=>{}); }
    setEnabled(next);
    if (next) clickSound();
    return;
  }
  clickSound();
}, {capture:true});
document.addEventListener('pointerover',event=>{
  if (event.pointerType !== 'mouse') return;
  const control=event.target.closest?.(interactive);
  if (!control || control.disabled || control.contains(event.relatedTarget)) return;
  hoverSound();
});
window.addEventListener('sh2050:language',event=>{language=event.detail?.lang==='zh'?'zh':'en';refresh();});
window.addEventListener('sh2050:navigation',event=>{
  view=event.detail?.view||document.body.dataset.view||'landing';
  if (enabled && soundtrack && !soundtrack.paused) ramp(soundtrackGain?.gain,trackLevel(),.55);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)quiet(true);else if(enabled&&unlocked)void play();});
window.addEventListener('pagehide',()=>quiet(true));
window.addEventListener('pageshow',()=>{if(enabled&&unlocked&&!document.hidden)void play();});

window.SH2050_SOUND = Object.freeze({
  toggle:()=>setEnabled(!enabled),setEnabled,isEnabled:()=>enabled,
  getState:()=>({enabled,status,unlocked,playing:!!soundtrack&&!soundtrack.paused,currentTime:soundtrack?.currentTime||0}),
  refresh,playClick:clickSound,
  setLanguage:lang=>{language=lang==='zh'?'zh':'en';refresh();}
});
refresh();

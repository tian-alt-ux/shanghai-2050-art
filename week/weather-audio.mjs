const clamp=n=>Math.max(0,Math.min(1,n));
export function weatherAudioLevel({rainMm=0,playing=false,active=false,layerOn=false,enabled=false}={}){return playing&&active&&layerOn&&enabled?clamp(Math.log1p(Math.max(0,rainMm))/Math.log(7)):0;}

/** Procedural weather foley, not recorded Shanghai audio. Shares the site's
 * gesture-unlocked AudioContext and master mute; no extra autoplay player. */
export function createWeatherAudio(context,output){
 const bus=context.createGain(),rainGain=context.createGain(),high=context.createBiquadFilter(),low=context.createBiquadFilter();
 bus.gain.value=0;rainGain.gain.value=0;bus.connect(output);high.type='highpass';high.frequency.value=450;low.type='lowpass';low.frequency.value=6200;
 const buffer=context.createBuffer(2,context.sampleRate*4,context.sampleRate);let seed=20261101;
 for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);let slow=0;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=(seed/4294967296)*2-1;slow=.985*slow+.015*white;data[i]=white*.34+slow*1.1;}}
 const rain=context.createBufferSource();rain.buffer=buffer;rain.loop=true;rain.connect(high);high.connect(low);low.connect(rainGain);rainGain.connect(bus);rain.start();
 let lastHour=null,lastSeed=0,enabledNow=false,thunderCount=0;const voices=[];
 function ramp(param,value,seconds=.25){const now=context.currentTime;if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);else{param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);}param.linearRampToValueAtTime(value,now+seconds);}
 function stopThunder(){for(const item of voices.splice(0)){try{item.source.stop();}catch{}item.source.disconnect();item.gain.disconnect();}}
 function thunder(id){
  const now=context.currentTime,delay=.18+(id%3)*.14,start=now+delay,duration=2.4+(id%3)*.35;
  while(voices.length>=2){const old=voices.shift();try{old.source.stop();}catch{}old.gain.disconnect();}
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;source.loop=true;source.playbackRate.value=.28+(id%3)*.06;
  filter.type='lowpass';filter.frequency.setValueAtTime(2200,start);filter.frequency.exponentialRampToValueAtTime(130,start+duration);
  gain.gain.setValueAtTime(0,now);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.38,start+.025);gain.gain.exponentialRampToValueAtTime(.10,start+.24);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.connect(filter);filter.connect(gain);gain.connect(bus);const item={source,gain};voices.push(item);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();const i=voices.indexOf(item);if(i>=0)voices.splice(i,1);};source.start(start);source.stop(start+duration+.05);thunderCount++;
 }
 return {update(input={}){
  const permitted=!!(input.enabled&&input.active&&input.playing&&input.layerOn),level=weatherAudioLevel(input),jump=lastHour!==null&&(input.hour<lastHour-.3||Math.abs(input.hour-lastHour)>2);
  if(jump){lastSeed=0;stopThunder();}
  if(permitted!==enabledNow){enabledNow=permitted;ramp(bus.gain,permitted?1:0,permitted?.12:.045);if(!permitted)stopThunder();}
  ramp(rainGain.gain,level*(.12+.15*level),.23);
  if(permitted&&input.flashStrength>.06&&input.flashSeed&&input.flashSeed!==lastSeed){thunder(input.flashSeed);lastSeed=input.flashSeed;}
  if(Number.isFinite(input.hour))lastHour=input.hour;
 },getState:()=>({audible:enabledNow,thunderCount,activeThunder:voices.length}),dispose(){stopThunder();rain.stop();rain.disconnect();bus.disconnect();}};
}

import {signalHash,signalLinkStyle,signalNodeDemand} from './signal-demand.mjs';
const step=.25,steps=673,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const caches=new WeakMap();
const finiteCondition=value=>{
 if(!value||!Number.isFinite(value.rainIndex)||!Number.isFinite(value.trafficPressure))throw new TypeError('signal conditions require finite rainIndex and trafficPressure');
 return {rainIndex:clamp(value.rainIndex),trafficPressure:clamp(value.trafficPressure)};
};
// A smooth, non-periodic sequence of authored batches. It has a stable history,
// including after backward seeking; it is not new randomness on each frame.
function batchAt(id,hour,span){const p=hour/span,k=Math.floor(p),t=p-k,s=t*t*(3-2*t);return mix(signalHash(id+':'+k),signalHash(id+':'+(k+1)),s);}

/** Relative business-queue replay. Units are authored work units, NOT real packets,
 * Mb/s, latency or electromagnetic propagation. Every directed relationship has
 * its own finite queue and persistent integrated display clock. */
export function createSignalWeekPlayback(network,{conditionsAt,rainIndex=0,trafficPressure=0}={}){
 const nodeIndex=new Map(network.nodes.map((n,i)=>[n.id,i]));
 if(nodeIndex.size!==network.nodes.length)throw new Error('duplicate signal node ID');
 const styles=network.links.map(signalLinkStyle),links=network.links.map((l,i)=>{
  const source=nodeIndex.get(l.source),target=nodeIndex.get(l.target);
  if(source===undefined||target===undefined)throw new Error('unresolved signal link '+l.id);
  return {source,target,style:styles[i],phase:signalHash(l.id),span:.55+signalHash(l.id+':span')*1.65};
 });
 const nodeFrames=[],linkFrames=[],queue=new Float64Array(links.length),clock=new Float64Array(links.length),machineClock=new Float64Array(network.nodes.length),publicClock=new Float64Array(network.nodes.length),totals={arrived:0,served:0,discarded:0};let maxResidual=0;
 for(let frame=0;frame<steps;frame++){
  const hour=frame*step,conditions=finiteCondition(conditionsAt?conditionsAt(hour):{rainIndex,trafficPressure});
  const nodes=network.nodes.map(n=>signalNodeDemand(n,hour,conditions));
  const frameLinks=links.map((spec,i)=>{
   const original=network.links[i],s=nodes[spec.source],t=nodes[spec.target],warm=spec.style.warm;
   // Requests follow consumer demand; compute/exchange includes both ends so
   // business-hour, residential evening and nocturnal compute routes differ.
   const load=warm?(.35*s.publicLoad+.65*t.publicLoad):original.kind==='request'?s.machineLoad*.47+s.publicLoad*.53:s.machineLoad*.46+t.machineLoad*.54;
   const batch=batchAt(original.id+':batches',hour,spec.span);
   const serviceDemand=Math.pow(clamp(load),1.35);
   const dispatchWindow=.035+Math.pow(clamp((batch-.12)/.88),1.5)*2.15;
   const offered=(.055+serviceDemand*1.85)*dispatchWindow*(original.weight??.7);
   const capacity=.19+spec.style.capacityIndex*.85;
   const before=queue[i],arrived=frame===0?0:offered*step,available=before+arrived;
   const served=frame===0?0:Math.min(available,capacity*step),stored=Math.min(1.6+spec.style.capacityIndex*2.2,available-served),discarded=Math.max(0,available-served-stored);
   queue[i]=stored;totals.arrived+=arrived;totals.served+=served;totals.discarded+=discarded;
   maxResidual=Math.max(maxResidual,Math.abs(before+arrived-served-discarded-stored));
   const throughput=frame===0?Math.min(offered,capacity):served/step,utilization=clamp(throughput/capacity),pressure=clamp(stored/(1.6+spec.style.capacityIndex*2.2));
   // Continuous visual speed integrates each queue's service instead of h*fixed
   // rate. A queued route has many packets and slightly slower visible service.
   const visualRate=spec.style.cyclesPerHour*(.42+utilization*1.55)/(1+pressure*.65);
   if(frame)clock[i]+=visualRate*step;
   const density=Math.max(0,(Math.pow(utilization,1.55)-.15)*1.18)*spec.style.packetCount;
   const active=clamp((utilization-.23)/.53);
   return {intensity:clamp(utilization*.8+pressure*.2),machineLoad:s.machineLoad,publicLoad:t.publicLoad,phaseClock:clock[i]+spec.phase,visualRate,packetDensity:density,active,queueIndex:pressure,offered,throughput,arrived,served,discarded};
  });
  // Business point groups follow the same emitted/received work, not a separate
  // citywide glow. Preserve independent machine/public demand for their colour.
  const received=new Float32Array(nodes.length),counts=new Uint16Array(nodes.length);
  for(let i=0;i<links.length;i++){received[links[i].target]+=frameLinks[i].intensity;counts[links[i].target]++;}
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i],localBatch=batchAt(network.nodes[i].id+':local',hour,.60+signalHash(network.nodes[i].id)*1.10);
   n.receivedIntensity=received[i]/Math.max(1,counts[i]);
   n.machineActivity=clamp(n.machineLoad*(.36+localBatch*1.05));
   n.publicActivity=clamp(n.publicLoad*(1.40-localBatch*.92));
   n.machineRate=.10+n.machineActivity*.50;n.publicRate=.07+n.publicActivity*.47;
   if(frame){machineClock[i]+=n.machineRate*step;publicClock[i]+=n.publicRate*step;}
   n.machineClock=machineClock[i];n.publicClock=publicClock[i];
  }
  nodeFrames.push(nodes);linkFrames.push(frameLinks);
 }
 const finalQueue=queue.reduce((a,b)=>a+b,0);
 const audit={...totals,finalQueue,maxResidual,weekResidual:Math.abs(totals.arrived-totals.served-totals.discarded-finalQueue),stepHours:step,units:'authored business-work units; not observed packet counts',capacityPhysical:false};
 return {audit,sample(hour){
  if(!Number.isFinite(hour)||hour<0||hour>168)throw new RangeError('hour must be between 0 and 168');
  const p=hour/step,lo=Math.min(steps-1,Math.floor(p)),hi=Math.min(steps-1,lo+1),t=p-lo;
  const interpolate=(a,b)=>Object.fromEntries(Object.entries(a).map(([k,v])=>[k,typeof v==='number'?mix(v,b[k],t):v]));
  const nodes=nodeFrames[lo].map((n,i)=>({...network.nodes[i],...interpolate(n,nodeFrames[hi][i])}));
  const sampledLinks=linkFrames[lo].map((l,i)=>{const v=interpolate(l,linkFrames[hi][i]);return {...network.links[i],...v,phase:v.phaseClock-Math.floor(v.phaseClock),sendIntensity:v.intensity,receiveIntensity:clamp(v.intensity*(.8+.2*v.active)),delayIndex:v.queueIndex};});
  return {hour,nodes,links:sampledLinks,meta:{evidenceKind:'PUBLIC-ROLES+HISTORICAL-WEATHER+ASSUMP-DEMAND+ART',units:'relative-business-load',inputScope:conditionsAt?'historical-reference-week':'symbolic-current-condition',relayHops:0,packetConservation:false,businessWorkConservation:true,networkLatencyMeasured:false,radioPropagationSolved:false,weatherInfluence:'authored indoor-content, travel-notification and machine-service demand, not rain attenuation of fibre',playback:'15-minute stateful finite queues; deterministic seeking; integrated non-uniform display clocks',activeLinks:sampledLinks.filter(l=>l.active>.5).length,visiblePackets:sampledLinks.reduce((sum,l)=>sum+l.packetDensity,0),queueTotal:sampledLinks.reduce((sum,l)=>sum+l.queueIndex,0),colorSemantics:network.meta.visualSemantics,audit}};
 }};
}

export function signalWeekState(network,hour,options={}){
 let entries=caches.get(network);if(!entries){entries=[];caches.set(network,entries);}
 const fallbackKey=options.conditionsAt??`${options.rainIndex??0}|${options.trafficPressure??0}`;
 let entry=entries.find(e=>e.key===fallbackKey);
 if(!entry){entry={key:fallbackKey,playback:createSignalWeekPlayback(network,options)};entries.length=0;entries.push(entry);}
 return entry.playback.sample(hour);
}

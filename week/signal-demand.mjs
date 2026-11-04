import {SIGNAL_2050_SCENARIO} from './signal-reference.mjs';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),g=(x,c,s)=>Math.exp(-.5*((x-c)/s)**2);
export function signalHash(text){let h=2166136261;for(const c of String(text)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}
/** Relative demand composition, not observed packets. Monday replays the 2025 holiday-return calendar. */
export function signalNodeDemand(node,hour,conditions={rainIndex:0,trafficPressure:0}){
 const t=clamp(hour,0,168),day=Math.min(6,Math.floor(t/24)),h=t===168?24:t%24,holiday=day===0,rest=holiday||day>=5,p=node.serviceProfile??(node.type==='culture'?'culture':node.type==='transport'?'transport':'residential'),seed=signalHash(node.id),shift=(seed-.5)*1.1;
 let machine,publicContent;
 if(p==='business'){
  machine=.20+(rest?.18:.53)*g(h,13.3+shift,4.2)+.12*g(h,3.5+shift,2.1);
  publicContent=.07+(rest?.24:.15)*g(h,14+shift,3.4)+.25*g(h,20+shift,2.3);
 }else if(p==='industrial'){
  machine=.39+(rest?.20:.37)*g(h,11.8+shift,4.6)+.19*g(h,2.5+shift,2.7);
  publicContent=.05+.12*g(h,12+shift,2.3)+.22*g(h,20.2+shift,2.7);
 }else if(p==='logistics'||p==='transport'){
  machine=.28+.23*g(h,5.5+shift,2.2)+.25*g(h,14.7+shift,3.3)+.14*g(h,23+shift,1.7);
  publicContent=.06+(rest?.22:.34)*(g(h,8.2+shift,1.5)+g(h,18.3+shift,1.9));
 }else if(p==='ecology'){
  machine=.22+.15*g(h,6.5+shift,2.8)+.20*g(h,15+shift,4.3);
  publicContent=.05+(rest?.38:.13)*g(h,14.3+shift,3.3)+.18*g(h,20+shift,2.1);
 }else if(p==='culture'){
  machine=.13+.13*g(h,11+shift,3.4);
  publicContent=.12+(rest?.55:.36)*g(h,19.1+shift,3.5)+.19*g(h,13.1+shift,2.3);
 }else{
  machine=.19+.16*g(h,9+shift,2.4)+.15*g(h,16+shift,2.9);
  publicContent=.09+(rest?.28:.12)*g(h,13.5+shift,3.4)+.47*g(h,20.3+shift,2.7);
 }
 if(node.facilityKind==='data-center'||node.facilityKind==='compute')machine+=.20+.10*g(h,2+shift,2.5);
 if(node.facilityKind==='internet-exchange')machine+=.15;
 if(node.facilityKind==='international-region')machine+=.18;
 // Weather changes authored demand, never optical/radio propagation. Even light
 // rain can change travel/content use; this saturating response is an assumption.
 const rain=1-Math.exp(-clamp(conditions.rainIndex??0)*7),traffic=clamp(conditions.trafficPressure??0);
 machine+=rain*(p==='transport'||p==='logistics'?.18:.055)+(p==='transport'||p==='logistics'?traffic*.17:traffic*.025);
 publicContent+=rain*(p==='residential'?.23:p==='culture'?-.08:p==='ecology'?-.10:.04)+(p==='transport'?traffic*.17:0);
 if(p==='culture'||p==='ecology')publicContent*=1-rain*.20;
 // Distinct daily calendars, not seven repetitions of one 24-hour waveform.
 const dayFactor=.88+.24*signalHash((node.regionId??node.id)+':day:'+day);
 machine*=dayFactor;publicContent*=1.96-dayFactor;
 // Discrete region/category-specific event windows; not one citywide breathing sine.
 const window=Math.floor(t/(.45+seed*.9)),burst=signalHash(node.id+':'+window)>.86?(.10+.08*seed)*g(t%( .45+seed*.9),(.45+seed*.9)*.55,(.45+seed*.9)*.20):0;
 machine=clamp(machine*SIGNAL_2050_SCENARIO.machineServiceMultiplier/4.2+burst);
 publicContent=clamp(publicContent*SIGNAL_2050_SCENARIO.mobileDataMultiplier/2.8+burst*.35);
 return {machineLoad:machine,publicLoad:publicContent,intensity:clamp(machine*.57+publicContent*.43),publicShare:publicContent/Math.max(.001,machine+publicContent),calendarKind:holiday?'holiday-return':day>=5?'weekend':day===4?'friday':'workday'};
}
export function signalLinkStyle(link){
 const seed=signalHash(link.id),machine=!['broadcast','community','traffic-notice'].includes(link.kind),backbone=link.networkTier==='backbone',capacity=link.capacityIndex??(backbone?1:link.kind==='compute'?.85:machine?.48:.34);
 return {classKey:machine?'machine':'public',warm:machine?0:1,capacityIndex:capacity,cyclesPerHour:(machine?.17:.10)+(seed*.27)+(backbone?.10:0),widthPixels:(backbone?1.35:.65)+capacity*.95,packetCount:backbone?6:capacity>.58?4:3,phaseOffset:seed};
}

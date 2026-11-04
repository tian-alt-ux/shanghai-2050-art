// Authored scenario states, never factual construction or communications records.
import {signalNodeDemand,signalLinkStyle} from './signal-demand.mjs';
import {signalWeekState} from './signal-week-playback.mjs';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const fraction=n=>n-Math.floor(n);
const gaussian=(x,c,s)=>Math.exp(-.5*((x-c)/s)**2);
function numeric(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be a finite number`);return value;}
function weekHour(value){numeric(value,'hour');if(value<0||value>168)throw new RangeError('hour must be between 0 and 168');return value;}
function index(value,name){return clamp(numeric(value,name));}
function phaseFor(text){let h=2166136261;for(const c of text){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}

/** Four display states only. Ordinary and unverified stock stays unmarked. */
export function projectStatus(project,simulatedYear=2050,hour=0){
  numeric(simulatedYear,'simulatedYear');weekHour(hour);
  if(!project||typeof project!=='object'||project.changeType==='unknown')return 'unknown';
  const baseline=Number.isFinite(project.baselineYear)?project.baselineYear:2026;
  if(simulatedYear<baseline)return 'unknown';
  // Fractional years here describe authored lifecycle windows, not dated observations.
  const at=simulatedYear+hour/(365*24);
  const start=Number.isFinite(project.startYear)?project.startYear:null;
  const complete=Number.isFinite(project.completeYear)?project.completeYear:null;
  if(start!==null&&complete!==null&&complete<=start)throw new RangeError('completion must follow construction start');
  if(start!==null&&at>=start&&(complete===null||at<complete))return 'construction';
  if(complete!==null&&complete>baseline&&at>=complete)return 'completed';
  if(Number.isFinite(project.renewalFromYear)&&at>=project.renewalFromYear)return 'renewal';
  return 'unknown';
}

/** A bounded semantic influence model with one delayed relay hop, not packet traffic. */
export function signalState(network,hour,{rainIndex=0,trafficPressure=0,conditionsAt}={}){
  weekHour(hour);
  const fallback={rainIndex:index(rainIndex,'rainIndex'),trafficPressure:index(trafficPressure,'trafficPressure')};
  if(conditionsAt!==undefined&&typeof conditionsAt!=='function')throw new TypeError('conditionsAt must be a function');
  if(!network||!Array.isArray(network.nodes)||!Array.isArray(network.links))throw new TypeError('network must contain nodes and links');
  if(network.meta?.citywideDemandModel===2||network.meta?.version==='shanghai-information-network-20261031-citywide')return signalWeekState(network,hour,{...fallback,conditionsAt});
  const byId=new Map(network.nodes.map(n=>[n.id,n]));
  if(byId.size!==network.nodes.length)throw new Error('duplicate signal node ID');
  const incoming=new Map(network.nodes.map(n=>[n.id,[]])),conditionCache=new Map(),baseCache=new Map(),emissionCache=new Map();
  for(const link of network.links){if(!byId.has(link.source)||!byId.has(link.target))throw new Error(`unresolved signal link ${link.id}`);numeric(link.weight,'weight');if(!(link.travelMinutes>0)||!Number.isFinite(link.travelMinutes))throw new RangeError('travelMinutes must be positive');incoming.get(link.target).push(link);}
  const conditions=t=>{
    if(!conditionsAt)return fallback;
    t=clamp(t,0,168);if(conditionCache.has(t))return conditionCache.get(t);
    const value=conditionsAt(t);
    if(!value||typeof value!=='object')throw new TypeError('conditionsAt must return conditions');
    const result={rainIndex:index(value.rainIndex,'conditionsAt.rainIndex'),trafficPressure:index(value.trafficPressure,'conditionsAt.trafficPressure')};conditionCache.set(t,result);return result;
  };
  const computeBase=(node,t)=>{
    if(network.meta?.version==='shanghai-information-network-20261031-citywide')return signalNodeDemand(node,t,conditions(t)).intensity;
    const at=clamp(t,0,168),day=Math.min(6,Math.floor(at/24)),h=at%24,weekend=day>=5,weather=conditions(at);
    const seed=phaseFor(node.id),pulse=.64+.36*(.5+.5*Math.sin(at*Math.PI*2/(.43+seed*.22)+seed*Math.PI*2));
    let normal,event;
    if(node.type==='transport'){
      normal=.09+(weekend?.25:.44)*(gaussian(h,8.1,1.3)+.88*gaussian(h,17.8,1.6));
      event=.34*weather.rainIndex+.43*weather.trafficPressure;
    }else if(node.type==='culture'){
      normal=.13+(weekend?.43:.29)*gaussian(h,19,3.4)+.1*gaussian(h,12,2.2);
      event=.1*weather.rainIndex+.07*weather.trafficPressure;
    }else{
      normal=.07+(weekend?.36:.17)*gaussian(h,14.4,3.1)+.25*gaussian(h,20,2.1);
      event=.1*weather.rainIndex+.14*weather.trafficPressure;
    }
    return clamp(normal+event)*pulse;
  };
  const base=(node,t)=>{t=clamp(t,0,168);const key=node.id+'|'+t;if(!baseCache.has(key))baseCache.set(key,computeBase(node,t));return baseCache.get(key);};
  const relayGain=clamp(Number.isFinite(network.meta?.relayGain)?network.meta.relayGain:.3,0,.5);
  const emission=(id,t)=>{
    t=clamp(t,0,168);const key=id+'|'+t;if(emissionCache.has(key))return emissionCache.get(key);
    const node=byId.get(id),firstHop=incoming.get(id).reduce((sum,link)=>sum+base(byId.get(link.source),t-link.travelMinutes/60)*clamp(link.weight),0);
    const result=clamp(base(node,t)+relayGain*firstHop/Math.max(1,incoming.get(id).length));emissionCache.set(key,result);return result;
  };
  const links=network.links.map(link=>{
    const weight=clamp(link.weight),travel=link.travelMinutes/60;
    const send=emission(link.source,hour)*weight;
    const receive=emission(link.source,hour-travel)*weight*.84;
    const local=conditions(hour),phase=fraction(network.meta?.version==='shanghai-information-network-20261031-citywide'?hour*(link.cyclesPerHour??signalLinkStyle(link).cyclesPerHour)+phaseFor(link.id):hour*60/link.travelMinutes+phaseFor(link.id));
    return {...link,intensity:clamp((send+receive)/2),sendIntensity:send,receiveIntensity:receive,
      delayIndex:clamp(link.travelMinutes/30*.35+.34*local.trafficPressure+.16*local.rainIndex),phase};
  });
  const nodes=network.nodes.map(node=>{
    const arriving=links.filter(l=>l.target===node.id),received=arriving.reduce((sum,l)=>sum+l.receiveIntensity,0)/Math.max(1,arriving.length);
    const demand=network.meta?.version==='shanghai-information-network-20261031-citywide'?signalNodeDemand(node,hour,conditions(hour)):{};
    return {...node,...demand,intensity:clamp(base(node,hour)+received*(network.meta?.version==='shanghai-information-network-20261031-citywide'?.35:.45)),receivedIntensity:received};
  });
  return {hour,nodes,links,meta:{evidenceKind:'ASSUMP+ART',units:'relative-index',
    inputScope:conditionsAt?'historically-delayed-authored-conditions':'symbolic-current-input',
    relayHops:1,packetConservation:false,networkLatencyMeasured:false,colorSemantics:network.meta?.visualSemantics??null}};
}

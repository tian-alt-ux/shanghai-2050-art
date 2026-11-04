// Deterministic relative road-service scenario. Public facts constrain the shape;
// every road demand, capacity, weather response and 2050 state remains authored.
import {trafficRoleAt,spatialDemandRate,referenceDayAt,TRAFFIC_REFERENCE_WEEK} from './traffic-spatial-reference.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const number=(n,f=0)=>Number.isFinite(Number(n))?Number(n):f;
function stableUnit(text,seed){let h=(2166136261^seed)>>>0;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h/4294967295;}

export const TRAFFIC_SCENARIO_PARAMETERS=Object.freeze({
 version:'spatial-reference-week-20261031',
 loadRange:[.70,1.10],
 primaryLoadAddition:.055,secondaryLoadAddition:.025,tertiaryLoadAddition:-.025,
 rainDirectCapacityLoss:.14,wetSurfaceCapacityLoss:.09,maxWeatherCapacityLoss:.21,
 wettingHours:.4,dryingHours:2.5,constructionCapacityLoss:.52,
 weekdayRainDemandLoss:.055,weekendRainDemandLoss:.12,
 pressureAmberFrom:.45,pressureRedFrom:.78,
 // Source numbers are contextual evidence, never targets fitted by this engine.
 sources:[
  {url:'https://jtw.sh.gov.cn/xwfb2/20250912/304328c870354296add7f82b7f1a768a.html',kind:'Shanghai 2024 annual aggregate report',use:'Recurring weekday AM/PM congestion, slightly stronger PM, centre/periphery differentiation. Not a per-road calibration.'},
  {url:'https://ops.fhwa.dot.gov/weather/roadimpact.htm',kind:'General road-weather research summary',use:'Rain/wet pavement can reduce arterial saturation flow and speed; coefficients here are authored, not transferred Shanghai measurements.'}
 ]
});

export function createTrafficSimulation(network,{stepMinutes=15,seed=205026,rainAt=()=>0,constructionAt}={}){
 if(!network?.edges?.length||!Array.isArray(network.nodes))throw Error('A nonempty local road network is required');
 if(!Number.isFinite(stepMinutes)||stepMinutes<=0||168*60%stepMinutes!==0)throw Error('stepMinutes must divide one 168-hour week');
 const edges=network.edges,n=edges.length,stepH=stepMinutes/60,steps=168/stepH;
 const selected=new Set(network.meta?.selectedRoadIds||[]);
 const defaultConstruction=(hour,edge)=>selected.has(edge.id)&&hour>=56&&hour<66?1:0;
 const constructionFn=constructionAt||defaultConstruction;
 const base=Float64Array.from(edges,e=>Math.max(.05,number(e.capacityUnits,4))*stepMinutes/15);
 const baseSum=base.reduce((sum,v)=>sum+v,0);
 // A source-way/name seed keeps neighbouring pieces of the same corridor coherent.
 // Geometry bears on the scenario's spatial role, but does not certify actual trip purpose.
 const roles=edges.map(edge=>{
  const p=edge.points||[],a=p[0]||[0,0],b=p.at(-1)||a;
  const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
  const corridor=String(edge.sourceWayId??edge.scenarioCorridorKey??edge.name??edge.id),u=stableUnit(corridor,seed);
  const spatial=trafficRoleAt(x,y),job=spatial.jobPoint;
  // Only the directed OSM core gets signed commuting demand. Regional source
  // segment endpoint order is not evidence of a legal traffic direction.
  const direction=edge.highway==='unknown'?0:clamp(((b[0]-a[0])*(job[0]-x)+(b[1]-a[1])*(job[1]-y))/Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])*Math.hypot(job[0]-x,job[1]-y)),-1,1);
  const hierarchy=edge.highway==='primary'?.055:edge.highway==='secondary'?.025:-.025;
  return {...spatial,u,direction,load:(.70+.40*u+hierarchy)*clamp(number(edge.scenarioLoadMultiplier,1),.35,1.15),
   peakShift:(stableUnit(corridor,seed+1)-.5)*.7,
   weatherSensitivity:.80+.35*stableUnit(corridor,seed+2)};
 });
 const storage=Float64Array.from(edges,(e,i)=>base[i]*(4+Math.min(2,number(e.lengthM,100)/500)));
 const nodeIndex=new Map(network.nodes.map((node,i)=>[node.id,i]));
 const ends=edges.map(e=>[nodeIndex.get(e.from),nodeIndex.get(e.to)]);
 const parameters={stepMinutes,seed,unit:'relative service units; NOT vehicles',...TRAFFIC_SCENARIO_PARAMETERS,
  rainCapacityReduction:'min(.21, (.14 * rainIndex + .09 * wetSurfaceIndex) * corridorSensitivity)',
  constructionCapacityReduction:.52,workZoneHours:[56,66],maxStoredBaseSteps:[4,6],
  pressure:{formula:'clamp(0.46 * min(2,demand/effectiveCapacity) + 0.36 * min(2,queue/baseCapacity),0,1)',range:[0,1],amberFrom:.45,redFrom:.78,fixedAcrossWeek:true},
  demand:'Authored spatial purpose mix, OSM-core directional AM/PM reversal, holiday-return Monday, weekday/Friday/weekend roles and rain response. Historical calendar/weather and annual public aggregates constrain this 2050 scenario; no observed OD.',
  referenceWeek:TRAFFIC_REFERENCE_WEEK,constructionDefault:false,
  futureAssumption:'2050 scenario preserves present geographic centres and introduces authored service-demand mixes; no unique future values can be inferred from a historical week.',
  limitations:[
   'Roads have independent synthetic arrivals and finite-service queues; NOT network route assignment.',
   'Public Shanghai aggregate indices support recurring patterns, not road-specific loads or a validated 2050 forecast.',
   'Rain/wet-surface coefficients are authored. General international road-weather findings are not Shanghai calibration.',
   'Graph connectivity is audited but rerouting, turning queues, downstream spillback and physical vehicle interactions are not simulated.',
   'No physical vehicle count, measured speed, real travel time or official congestion index is inferred.',
   'With/without construction runs share exactly the same rain and arrival demand.',
   'Queue overflow is recorded as cancelled relative demand, never silently deleted.'
  ]};
 const demandRate=(hour,i,rainValue)=>spatialDemandRate(hour,roles[i],rainValue);
 function generateWeek({rainAt:rain=rainAt,constructionAt:works=constructionFn,construction=false}={}){
  const frames=[];let q=new Float64Array(n),wet=new Float64Array(n),cumArr=0,cumServed=0,cumCancelled=0;
  frames.push({hour:0,values:new Float32Array(n*7),totals:{arrivals:0,served:0,queue:0,cancelled:0,stepArrivals:0,stepServed:0,stepCancelled:0,meanPressure:0,queuedEdgeFraction:0,amberFraction:0,redFraction:0,queueCapacityRatio:0},meanPressure:0,maxPressure:0});
  for(let step=1;step<=steps;step++){
   const hour=step*stepH,time=hour-stepH/2,values=new Float32Array(n*7);
   let stepArr=0,stepServed=0,stepCancel=0,totalQueue=0,maxPressure=0,sumPressure=0,queuedEdges=0,amber=0,red=0;
   for(let i=0;i<n;i++){
    const rainValue=clamp(number(rain(time,edges[i]))),workValue=construction?clamp(number(works(time,edges[i]))):0;
    const wetTarget=rainValue>0?.35+.65*rainValue:0;
    const tau=wetTarget>wet[i]?TRAFFIC_SCENARIO_PARAMETERS.wettingHours:TRAFFIC_SCENARIO_PARAMETERS.dryingHours;
    wet[i]+=(wetTarget-wet[i])*(1-Math.exp(-stepH/tau));
    const weatherLoss=Math.min(.21,(.14*rainValue+.09*wet[i])*roles[i].weatherSensitivity);
    const cap=base[i]*(1-weatherLoss)*(1-.52*workValue);
    const arrival=base[i]*roles[i].load*demandRate(time,i,rainValue),available=q[i]+arrival;
    const served=Math.min(available,cap),remaining=available-served,cancelled=Math.max(0,remaining-storage[i]);q[i]=remaining-cancelled;
    const ratio=arrival/cap,pressure=clamp(.46*Math.min(2,ratio)+.36*Math.min(2,q[i]/base[i])),speedRatio=clamp(1/(1+.8*q[i]/base[i]+.9*Math.max(0,ratio-.7)),.06,1);
    const o=i*7;values[o]=pressure;values[o+1]=q[i];values[o+2]=served;values[o+3]=arrival;values[o+4]=speedRatio;values[o+5]=cap;values[o+6]=cancelled;
    stepArr+=arrival;stepServed+=served;stepCancel+=cancelled;totalQueue+=q[i];maxPressure=Math.max(maxPressure,pressure);sumPressure+=pressure;
    if(q[i]>1e-6)queuedEdges++;if(pressure>=.78)red++;else if(pressure>=.45)amber++;
   }
   cumArr+=stepArr;cumServed+=stepServed;cumCancelled+=stepCancel;
   const totals={arrivals:cumArr,served:cumServed,queue:totalQueue,cancelled:cumCancelled,stepArrivals:stepArr,stepServed:stepServed,stepCancelled:stepCancel,
    meanPressure:sumPressure/n,queuedEdgeFraction:queuedEdges/n,amberFraction:amber/n,redFraction:red/n,queueCapacityRatio:totalQueue/baseSum};
   frames.push({hour,values,totals,maxPressure,meanPressure:totals.meanPressure});
  }
  function sample(hour){
   const requested=number(hour),idx=Math.min(steps,Math.max(0,Math.floor(clamp(requested,0,168)/stepH+1e-8))),frame=frames[idx];
   const heat=new Float64Array(network.nodes.length),weight=new Float64Array(network.nodes.length);
   const edgeStates=edges.map((edge,i)=>{const o=i*7,v=frame.values,queue=v[o+1],nodeDelay=queue/base[i];for(const endpoint of ends[i])if(endpoint!==undefined){heat[endpoint]+=nodeDelay;weight[endpoint]++;}return {id:edge.id,pressure:v[o],queue,served:v[o+2],demand:v[o+3],speedRatio:idx?v[o+4]:1,effectiveCapacity:idx?v[o+5]:base[i],cancelled:v[o+6]};});
   const nodeHeat=network.nodes.map((node,i)=>({id:node.id,x:node.x,y:node.y,intensity:weight[i]?clamp(heat[i]/weight[i]/2):0})).filter(node=>node.intensity>.015).sort((a,b)=>b.intensity-a.intensity||a.id.localeCompare(b.id));
   return {hour:frame.hour,requestedHour:requested,edgeStates,nodeHeat,totals:{...frame.totals},meta:{...parameters,referenceDay:referenceDayAt(Math.min(167.999,frame.hour)),constructionEnabled:construction,sampleRule:'previous completed 15-minute step; no invented substep observations'}};
  }
  return {sample,frames,meta:{...parameters,constructionEnabled:construction,frameStride:7,frameFields:['pressure','queue','served','demand','speedRatio','effectiveCapacity','cancelled'],frameCount:frames.length}};
 }
 let defaultWeek;
 return {sample(hour){defaultWeek??=generateWeek();return defaultWeek.sample(hour);},generateWeek,meta:parameters};
}

import {createTrafficSimulation} from './traffic-engine.mjs';

const unit=.02,R=6378137,defaultOrigin=[13524761.533928772,3663957.0930902106];
const clamp=x=>Math.max(0,Math.min(1,x));
function hash(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}
const project=(lon,lat,origin)=>[R*lon*Math.PI/180-origin[0],R*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))-origin[1]];
// These are named geographic anchors with authored influence sizes, NOT observed OD catchments.
const centres=[
 ['central',121.485,31.235,12500,1,.85],['hongqiao',121.31611,31.19612,6200,.94,.65],
 ['yangpu',121.5331,31.2554,6200,.82,.74],['zhangjiang',121.59,31.20,7500,.88,.52],
 ['lingang',121.90,30.91,8500,.84,.62],['songjiang',121.23,31.03,8500,.74,.62],
 ['qingpu',121.11,31.15,7800,.68,.60],['jiading',121.25,31.38,7800,.74,.57],
 ['pudong-airport',121.80,31.15,6800,.80,.40],['chongming',121.40,31.62,8000,.50,.64]
];

/**
 * Select real source-model segments and run explicitly authored regional service states.
 * Input contract: float32 world xyz pairs from regional-roads.bin, same origin as the core.
 * No actual lanes, speeds, road class, direction or connectivity are inferred from geometry.
 */
export function createRegionalTraffic(float32Positions,{rainAt=()=>0,targetCount=2200,centreProjected=defaultOrigin}={}){
 if(!(float32Positions instanceof Float32Array)||float32Positions.length%6)throw new TypeError('Regional traffic needs float32 xyz segment pairs');
 if(!Number.isFinite(targetCount)||targetCount<1)throw new RangeError('Regional sample target must be positive');
 const hubs=centres.map(([id,lon,lat,radius,business,culture])=>({id,point:project(lon,lat,centreProjected),radius,business,culture}));
 function roleAt(x,y){let best=0,hub=hubs[0];for(const h of hubs){const score=Math.exp(-.5*((x-h.point[0])**2+(y-h.point[1])**2)/h.radius**2);if(score>best){best=score;hub=h;}}
  return {activity:clamp(best),business:clamp(best*hub.business),culture:clamp(.1+best*hub.culture),job:hub.point,district:hub.id};}
 const buckets=new Map(),bounds=[Infinity,Infinity,-Infinity,-Infinity];
 let eligible=0;
 for(let offset=0;offset<float32Positions.length;offset+=6){
  const ax=float32Positions[offset]/unit,ay=-float32Positions[offset+2]/unit,bx=float32Positions[offset+3]/unit,by=-float32Positions[offset+5]/unit;
  if(![ax,ay,bx,by].every(Number.isFinite))throw new TypeError('Regional source contains a nonfinite coordinate');
  bounds[0]=Math.min(bounds[0],ax,bx);bounds[1]=Math.min(bounds[1],ay,by);bounds[2]=Math.max(bounds[2],ax,bx);bounds[3]=Math.max(bounds[3],ay,by);
  const x=(ax+bx)/2,y=(ay+by)/2,length=Math.hypot(bx-ax,by-ay);
  if(length<15||Math.max(Math.abs(x),Math.abs(y))<2350)continue;
  eligible++;
  const gx=Math.floor(x/1200),gy=Math.floor(y/1200),key=`${gx},${gy}`,role=roleAt(x,y);
  // One genuine segment per spatial cell prevents source vertex density from monopolising the sample.
  const pickScore=length*(.8+.4*hash(String(offset/6)));
  if(!buckets.has(key)||pickScore>buckets.get(key).pickScore)buckets.set(key,{key,gx,gy,sourceIndex:offset/6,points:[[ax,ay],[bx,by]],x,y,length,role,pickScore});
 }
 const selected=[...buckets.values()].sort((a,b)=>{
  const ar=hash(a.key)/(.35+a.role.activity),br=hash(b.key)/(.35+b.role.activity);return ar-br||a.sourceIndex-b.sourceIndex;
 }).slice(0,Math.min(Math.floor(targetCount),buckets.size));
 const nodes=[],edges=[],cosLat=Math.cos(31.24*Math.PI/180);
 for(const item of selected){
  const {sourceIndex:i,points,role,gx,gy}=item,id=`regional-source-${i}`,from=`${id}-a`,to=`${id}-b`;
  nodes.push({id:from,x:points[0][0],y:points[0][1],degree:1,evidenceKind:'MODEL endpoint; connectivity unresolved'},
   {id:to,x:points[1][0],y:points[1][1],degree:1,evidenceKind:'MODEL endpoint; connectivity unresolved'});
  edges.push({id,from,to,points,sourceSegmentIndex:i,lengthM:item.length*cosLat,
   sourceKind:'MODEL geometry + ASSUMP service',highway:'unknown',bridge:false,tunnel:false,capacityUnits:8,
   capacityEvidence:'ASSUMP: eight relative service units per 15 min; no vehicle inference',
   bridgeTunnelEvidence:'unknown; displayed at source road geometry, not certified routing',
   scenarioCorridorKey:`ASSUMP-grid-${gx},${gy}-${Math.abs(points[1][0]-points[0][0])>Math.abs(points[1][1]-points[0][1])?'EW':'NS'}`,
   scenarioDistrict:role.district,scenarioBusiness:role.business,scenarioCulture:role.culture,
   scenarioLoadMultiplier:.82+.42*role.activity,scenarioJobCentre:role.job,
   assumptions:['No source road classification, lane count, legal direction or observed flow is available.',
    'Named subcentres and Gaussian influence radii author a relative 2050 demand pattern, not a measured catchment.',
    'Each source segment has isolated candidate endpoints. Crossings and routable connectivity are not inferred.']});
 }
 const network={nodes,edges,meta:{schema:'regional-source-service-scenario-1',evidenceKind:'MODEL+ASSUMP+ART',
  source:'regional-roads.bin from original Shanghai blend; source mesh subset, not OSM road attributes',
  referenceCalendar:'2025-06-02 holiday return; June 3–6 workdays; June 7–8 weekend. No observed per-road counts.',
  centreProjected:centreProjected.slice(),boundsXY:bounds,coordinateUnit:'EPSG:3857 relative east/north projected metres',
  sourceSegmentCount:float32Positions.length/6,eligibleSegmentCount:eligible,spatialCellCount:buckets.size,selectedSegmentCount:edges.length,
  selection:'Real source segments, excluding original core midpoints; 1200m spatial cells, longest weighted representative, deterministic activity-weighted selection',
  selectedRoadIds:[],capacityEvidence:'ASSUMP',scenarioCentres:hubs.map(h=>({...h,evidence:'Geographic anchor + authored future influence; not measured OD'})),
  pressureScale:{range:[0,1],amberFrom:.45,redFrom:.78,fixedAcrossWeek:true},
  limitations:['Regional demand and capacity are authored, not Shanghai road-flow observations or a validated forecast.',
   'Unselected source roads remain geometric context only. Source coverage is not certified city completeness.',
   'No lane topology, turns, route choice, grade separation, real vehicle counts or travel times are inferred.']}};
 if(!edges.length)throw new RangeError('No eligible regional segments outside the core');
 const simulation=createTrafficSimulation(network,{rainAt}),week=simulation.generateWeek({construction:false});
 return {network,week,sample:hour=>week.sample(hour)};
}

import {SIGNAL_FACILITIES,SIGNAL_SOURCE_URLS} from './signal-facilities.mjs';
import {SIGNAL_LANDMARKS} from './signal-landmarks.mjs';
import {SIGNAL_ADDITIONAL_FACILITIES,SIGNAL_SERVICE_REGIONS,SIGNAL_BASELINE,SIGNAL_2050_SCENARIO,SIGNAL_REFERENCES} from './signal-reference.mjs';
import {signalHash,signalLinkStyle} from './signal-demand.mjs';
const R=6378137;
export function signalProject(lon,lat,origin=[13524761.533928772,3663957.0930902106]){return {x:R*lon*Math.PI/180-origin[0],y:R*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))-origin[1]};}
/** Real public roles and approximate anchors, with authored semantic traffic. */
export function createSignalNetwork(base,catalog,{landmarks=SIGNAL_LANDMARKS}={}){
 const network=structuredClone(base),origin=catalog.meta?.originMercator;
 network.nodes=network.nodes.filter(n=>!n.boundaryPortal);
 network.links=network.links.filter(l=>network.nodes.some(n=>n.id===l.source)&&network.nodes.some(n=>n.id===l.target));
 const pearl=network.nodes.find(n=>n.id==='culture-pearl');
 if(pearl)Object.assign(pearl,{labelZh:'东方明珠 · 广播发射',labelEn:'ORIENTAL PEARL · BROADCAST',lon:121.49526211756614,lat:31.241893672347146,...signalProject(121.49526211756614,31.241893672347146,origin),facilityKind:'broadcast',isFacility:true,sourceKind:'FACT-ROLE+OSM-POSITION+ASSUMP-STATE',positionKind:'cached-OSM-WGS84-outline-centroid',coordinateAccuracyM:100,roleZh:'真实广播电视塔；显示的发送强度、接收关系与光迹为2050作者情景。',roleEn:'A real broadcasting tower; displayed intensity, reception and paths are authored 2050 relations.',address:'上海市浦东新区世纪大道1号',sourceUrls:[SIGNAL_SOURCE_URLS.pearl],boundaryPortal:false});
 for(const facility of [...SIGNAL_FACILITIES,...SIGNAL_ADDITIONAL_FACILITIES])network.nodes.push({...structuredClone(facility),...signalProject(facility.lon,facility.lat,origin),isFacility:true,coordinateSystem:'WGS84 / approximate address-area anchor where noted',sourceKind:'FACT-ROLE-OR-APPROVED-PROJECT+APPROX-POSITION+ASSUMP-STATE',boundaryPortal:false});
 const usedPairs=new Set(network.links.map(l=>l.source+'>'+l.target));let sequence=0;
 const add=(source,target,kind,weight=.7,relationshipEvidence='ASSUMP',sourceUrl=null)=>{const pair=source+'>'+target;if(source===target||usedPairs.has(pair))return;usedPairs.add(pair);network.links.push({id:'city-link-'+String(++sequence).padStart(3,'0'),source,target,kind,weight,travelMinutes:7+(sequence*7)%19,sourceKind:'ASSUMP+ART',relationshipEvidence,sourceUrl,pathEvidence:'ART, not fibre/radio route',visualWidth:kind==='exchange'?1.45:kind==='compute'?1.25:1});};
 // Public dual-core / dual-uplink architecture informs the relationship only.
 for(const [a,b,evidence] of [['shixp','shixp-lingang','FACT-CORE-PAIR'],['shixp','shixp-waigaoqiao','FACT-ARCHITECTURE-REFERENCE'],['shixp-lingang','shixp-waigaoqiao','FACT-ARCHITECTURE-REFERENCE'],['compute','shixp','ASSUMP'],['smg','shixp','ASSUMP'],['smg-radio','shixp','ASSUMP']]){add(a,b,'exchange',.82,evidence,evidence.startsWith('FACT')?SIGNAL_SOURCE_URLS.shixp:null);add(b,a,'exchange',.78,evidence,evidence.startsWith('FACT')?SIGNAL_SOURCE_URLS.shixp:null);}
 add('smg','culture-pearl','broadcast',.88);add('smg-radio','culture-pearl','broadcast',.78);
 const infrastructure=network.nodes.filter(n=>n.isFacility),exchanges=infrastructure.filter(n=>n.facilityKind==='internet-exchange');
 const nearest=(node,choices)=>[...choices].sort((a,b)=>Math.hypot(a.x-node.x,a.y-node.y)-Math.hypot(b.x-node.x,b.y-node.y)||a.id.localeCompare(b.id))[0];
 const receiverIds=[];
 for(const [i,l] of landmarks.filter(l=>l.id!=='oriental-pearl').entries()){
  const id='place-'+l.id,node={id,labelZh:l.labelZh,labelEn:l.labelEn,lon:l.lon,lat:l.lat,...signalProject(l.lon,l.lat,origin),type:l.id==='hongqiao-station'?'transport':'culture',facilityKind:'cultural-service-endpoint',isLandmark:true,sourceKind:'USER-POI+ASSUMP-SERVICE',positionKind:l.coordinateEvidence||'user-provided coordinate',coordinateSystem:l.coordinateSystem||'user coordinates / CRS not independently certified',status:l.status,roleZh:'文化、公共或交通地点的信息服务接收/请求端；不自动视为通信基站或发射台。',roleEn:'An authored information-service endpoint, not a certified transmitter.',noteZh:l.noteZh,noteEn:l.noteEn,sourceUrls:l.officialSources||[]};
  network.nodes.push(node);receiverIds.push(id);const exchange=nearest(node,exchanges),content=node.x<0?'smg-radio':'culture-pearl';
  add(content,id,'broadcast',.56+(i%4)*.08);add(id,exchange.id,'request',.60+(i%3)*.06);if(i%4===0)add('compute',id,'compute',.68);
 }
 for(let i=0;i<receiverIds.length;i++)add(receiverIds[i],receiverIds[(i+1)%receiverIds.length],'community',.54+(i%3)*.04);
 const choices=catalog.features.filter(f=>f.height>40&&f.height<180&&!f.touchesClipBoundary);
 for(let i=0;i<24&&choices.length;i++){
  const f=choices[Math.floor(i*choices.length/24)],id='receiver-'+i,node={id,labelZh:'模拟建筑接收点 '+(i+1),labelEn:'SCENARIO RECEIVER '+(i+1),type:i%3===0?'transport':'community',facilityKind:'authored-building-receiver',x:f.center[0],y:f.center[1],candidateId:f.id,sourceKind:'ASSUMP',positionKind:'source-model geometric candidate',roleZh:'原模型上的作者接收端，不是已核实通信设备。',roleEn:'An authored receiver on source geometry, not a certified device.'};
  network.nodes.push(node);const source=nearest(node,infrastructure),exchange=nearest(node,exchanges);
  add(source.id,id,i%3===0?'traffic-notice':'community',.58+(i%4)*.07);add(id,exchange.id,'request',.55+(i%3)*.06);if(i%3===0)add(id,receiverIds[(i*5)%receiverIds.length],'community',.55);
 }
 // Every public-role facility joins the conceptual dual-core metro fabric; the links are authored.
 for(const facility of infrastructure){
  if(['shixp','shixp-lingang'].includes(facility.id))continue;
  const tier=facility.facilityKind==='internet-exchange'?'exchange':'compute';
  for(const core of ['shixp','shixp-lingang']){add(facility.id,core,tier,.78);add(core,facility.id,tier,.72);}
 }
 const regions=SIGNAL_SERVICE_REGIONS.map(r=>({...r,...signalProject(r.lon,r.lat,origin)}));
 for(const [i,r] of regions.entries()){
  const hub={...r,id:'service-'+r.id,labelZh:r.labelZh+' · 区域服务',labelEn:r.labelEn+' · SERVICE',type:r.serviceProfile==='logistics'?'transport':'community',facilityKind:'authored-regional-service',isRegionalService:true,coordinateAccuracyM:10000,sourceKind:'PUBLIC-REGIONAL-ROLE+ASSUMP-CATCHMENT',roleZh:'区域业务聚合符号；不是某栋通信设施或真实行政边界。',roleEn:'A regional service aggregate, not one building or an administrative boundary.',sourceUrls:[r.sourceUrl]};network.nodes.push(hub);
  const nearby=[...exchanges].sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y)).slice(0,2);
  for(const exchange of nearby){add(exchange.id,hub.id,'exchange',.68);add(hub.id,exchange.id,'request',.65);}
  const datacenter=nearest(r,infrastructure.filter(n=>['compute','data-center'].includes(n.facilityKind)));
  add(hub.id,datacenter.id,'compute',.72);add(datacenter.id,hub.id,'compute',.76);
  // Distributed local service cells make suburban exchanges visible at neighbourhood scale.
  for(let k=0;k<4;k++){
   const angle=(k*.5+signalHash(r.id)*.4)*Math.PI,radius=1900+(k%2)*1700,cell={id:'cell-'+r.id+'-'+k,labelZh:r.labelZh+' · 情景业务格 '+(k+1),labelEn:r.labelEn+' · SERVICE CELL '+(k+1),x:r.x+Math.cos(angle)*radius,y:r.y+Math.sin(angle)*radius,type:k%2?'culture':'community',facilityKind:'authored-service-cell',serviceProfile:k%2?'residential':r.serviceProfile,regionId:r.id,isServiceCell:true,sourceKind:'ASSUMP-SERVICE-AGGREGATE',positionKind:'authored-regional-cell-not-an-equipment-location',roleZh:'用于2050情景负载的地区业务汇聚点，不是实测基站。',roleEn:'An authored service aggregate, not a measured base station.'};
   network.nodes.push(cell);add(hub.id,cell.id,k%2?'community':'exchange',.52+(k%3)*.08);add(cell.id,hub.id,'request',.54+(k%2)*.10);
  }
 }
 for(const node of network.nodes){const region=nearest(node,regions);node.regionId??=region.id;node.serviceProfile??=node.type==='culture'?'culture':node.type==='transport'?'transport':region.serviceProfile;node.heightM??=node.isFacility?120:node.isRegionalService?100:node.isServiceCell?60:100;}
 for(const link of network.links){const source=network.nodes.find(n=>n.id===link.source),target=network.nodes.find(n=>n.id===link.target);link.networkTier=source.isFacility&&target.isFacility?'backbone':source.isServiceCell||target.isServiceCell?'access':'metro';link.capacityIndex=link.networkTier==='backbone'?1:link.kind==='compute'?.8:link.networkTier==='metro'?.6:.28;Object.assign(link,signalLinkStyle(link));}
 network.meta={...network.meta,version:'shanghai-information-network-20261101-week-queues',citywideDemandModel:2,nodeCount:network.nodes.length,linkCount:network.links.length,coreRelayCount:1,evidenceKind:'PUBLIC-FACILITY-ROLES+APPROX-ANCHORS+ASSUMP-TRAFFIC+ART-PATHS',sourceNote:'Public facility roles and approved projects, district-scale service catchments and source-geometry display points. No measured 2050 topology or weekly telecom log.',geographicPolicy:'Shared EPSG:3857 origin; all added sites are coarse address-area or planning-region anchors, not surveyed devices. Source-model cloud assignment is by nearest authored catchment, not administrative polygons.',physicalTrafficMeasured:false,radioPropagationSolved:false,backboneLatencyMeasured:false,notificationTime:'7–25 simulated minutes are viewing parameters, not network latency',publicArchitectureReference:SIGNAL_SOURCE_URLS.shixp,baseline:SIGNAL_BASELINE,scenario2050:SIGNAL_2050_SCENARIO,serviceRegions:regions,referenceUrls:SIGNAL_REFERENCES,visualSemantics:{blue:'ice-violet blue: machine, compute, exchange and service requests',orange:'public content, community interaction and travel notices',speed:'integrated per-link business-queue display clock, not physical propagation speed',width:'authored capacity class',brightness:'relative dispatch load; inactive batches vanish; density and route activation change over the week'},limitations:['Named cultural sites are service endpoints, not automatic radio transmitters.','Approved projects are not certifications of current operation.','Address-area points require precise geocoding before building-level matching.','All paths, rates and operational 2050 persistence are authored.','City aggregate telecom statistics do not identify district or building traffic.']};
 return network;
}

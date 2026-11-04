import * as THREE from 'three';
import {particles,world} from './visuals.mjs';
import {CITY_FADE_GLSL,CITY_FADE_UNIFORMS} from './horizon-field.mjs';
import {signalHash,signalLinkStyle} from './signal-demand.mjs';
import {buildSignalField} from './signal-field-layout.mjs';
import {makeLocalSignalAccess} from './signal-local-access.mjs';
const PI=Math.PI,clamp=n=>Math.max(0,Math.min(1,n));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function readableCloud(points){
 points.material.vertexShader=CITY_FADE_GLSL+'attribute float phase,size;uniform float time,gain,pixelFloor,localDetail;varying vec3 c;varying float a;void main(){c=color;float beacon=step(6.,size);vec2 ground=(modelMatrix*vec4(position,1.)).xz;float localEnvelope=exp(-1.3*pow(length((ground-cityFocus)/(vec2(80.,90.)*cityScale)),3.));a=mix(1.,localEnvelope,localDetail)*gain*(.78+.22*sin(time*1.3+phase))*step(.001,size)*cityFade((modelMatrix*vec4(position,1.)).xz)*mix(.62,.95,beacon);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;float rawSize=size*210.*projectionMatrix[1][1]*.45/max(12.,-p.z);gl_PointSize=clamp(rawSize,pixelFloor*mix(1.,1.9,beacon),16.);}';
 points.material.uniforms.pixelFloor.value=1.9;points.material.uniforms.localDetail={value:0};
 return points;
}

/** Seven batched draws including a sparse local access path/star overlay. */
export function makeSignals(network,catalog,parent,{buildingPositions=new Float32Array()}={}){
 const nodeById=new Map(network.nodes.map(n=>[n.id,n])),heights=new Map();
 for(const node of network.nodes){let h=node.id==='culture-pearl'?468:node.heightM??100;for(const f of catalog.features)if(node.x>=f.min[0]&&node.x<=f.max[0]&&node.y>=f.min[1]&&node.y<=f.max[1])h=Math.max(h,f.max[2]+18);heights.set(node.id,h);}
 const p=[],along=[],side=[],directions=[],flow=[],strength=[],density=[],indices=[],records=[],hp=[],ht=[],hs=[],hl=[],hf=[],hc=[],hi=[],hd=[],hslot=[];
 const segments=28;
 for(const [index,link] of network.links.entries()){
  const a=nodeById.get(link.source),b=nodeById.get(link.target),A=world(a.x,a.y,heights.get(a.id)),B=world(b.x,b.y,heights.get(b.id)),style=signalLinkStyle(link),lift=Math.min(link.networkTier==='backbone'?13:4.5,A.distanceTo(B)*.055),tangent=B.clone().sub(A).normalize(),start=p.length/3;
  for(let i=0;i<=segments;i++){
   const t=i/segments,v=A.clone().lerp(B,t);v.y+=Math.sin(t*PI)*lift;
   p.push(...v,...v);along.push(t,t);side.push(-1,1);directions.push(...tangent,...tangent);strength.push(.3,.3);density.push(0,0);
   for(let k=0;k<2;k++)flow.push(style.cyclesPerHour,style.phaseOffset,style.widthPixels,style.warm);
   if(i<segments){const k=start+i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const headStart=hp.length/3;
  for(let j=0;j<style.packetCount;j++){
   hp.push(...A);ht.push(...B);hs.push(style.cyclesPerHour);hl.push(lift);hf.push(style.phaseOffset+j/style.packetCount);hc.push(...(style.warm?[1,.43,.10]:[.57,.49,1]));hi.push(.3);hd.push(0);hslot.push(j); 
  }
  records.push({link,index,start,count:(segments+1)*2,headStart,headCount:style.packetCount,style});
 }
 const uniforms={...CITY_FADE_UNIFORMS,time:{value:0},gain:{value:1},resolution:{value:new THREE.Vector2(innerWidth,innerHeight)}};
 const geo=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(p,3)).setAttribute('along',new THREE.Float32BufferAttribute(along,1)).setAttribute('edge',new THREE.Float32BufferAttribute(side,1)).setAttribute('tangent',new THREE.Float32BufferAttribute(directions,3)).setAttribute('flow',new THREE.Float32BufferAttribute(flow,4)).setAttribute('strength',new THREE.Float32BufferAttribute(strength,1)).setAttribute('density',new THREE.Float32BufferAttribute(density,1));geo.setIndex(indices);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms,vertexShader:'attribute float along,edge,strength,density;attribute vec3 tangent;attribute vec4 flow;uniform vec2 resolution;uniform float time;varying float v,e,phase,power,warm,width,packets;varying vec2 w;void main(){v=along;e=edge;phase=fract(time*flow.x+flow.y);power=strength;warm=flow.w;width=flow.z;packets=density;w=(modelMatrix*vec4(position,1.)).xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);vec4 next=projectionMatrix*modelViewMatrix*vec4(position+tangent,1.);vec2 d=(next.xy/next.w-gl_Position.xy/gl_Position.w)*resolution;vec2 normal=normalize(vec2(-d.y,d.x)+vec2(.00001));gl_Position.xy+=normal*edge*(2./resolution)*flow.z*(.85+.55*power)*gl_Position.w;}',fragmentShader:CITY_FADE_GLSL+'uniform float gain;varying float v,e,phase,power,warm,width,packets;varying vec2 w;void main(){if(packets<.04)discard;float count=max(1.,floor(packets+.5));float d=fract(phase*count-v*count);float pulse=exp(-d*(width>2.?8.:11.));vec3 c=mix(vec3(.58,.47,1.),vec3(1.,.40,.09),warm);float edge=pow(max(0.,1.-abs(e)),1.1);float activity=smoothstep(.03,.9,packets);float a=(.018*power+2.8*pulse)*power*edge*activity;gl_FragColor=vec4(c,a*gain*cityFade(w));}'});
 const ribbons=new THREE.Mesh(geo,material);ribbons.frustumCulled=false;parent.add(ribbons);

 const headGeo=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(hp,3)).setAttribute('target',new THREE.Float32BufferAttribute(ht,3)).setAttribute('speed',new THREE.Float32BufferAttribute(hs,1)).setAttribute('lift',new THREE.Float32BufferAttribute(hl,1)).setAttribute('offset',new THREE.Float32BufferAttribute(hf,1)).setAttribute('color',new THREE.Float32BufferAttribute(hc,3)).setAttribute('strength',new THREE.Float32BufferAttribute(hi,1)).setAttribute('density',new THREE.Float32BufferAttribute(hd,1)).setAttribute('slot',new THREE.Float32BufferAttribute(hslot,1));
 const headMaterial=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms,vertexShader:CITY_FADE_GLSL+'attribute vec3 target;attribute float speed,lift,offset,strength,density,slot;uniform float time;varying vec3 c;varying float a;void main(){float t=fract(time*speed+offset);vec3 p=mix(position,target,t);p.y+=sin(t*3.14159265)*lift;c=color;a=cityFade((modelMatrix*vec4(p,1.)).xz)*strength*clamp(density-slot,0.,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=4.5+7.5*sqrt(strength);}',fragmentShader:'varying vec3 c;varying float a;uniform float gain;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;vec3 star=mix(c,vec3(1.,.96,1.),.48*exp(-d*d*28.));gl_FragColor=vec4(star,a*gain*(exp(-d*d*7.)*2.1+exp(-d*d*2.)*.22));}'});
 const photons=new THREE.Points(headGeo,headMaterial);photons.frustumCulled=false;parent.add(photons);

 const regions=network.meta.serviceRegions??[],field=buildSignalField(buildingPositions,regions),cp=Array.from(field.positions),cc=[],cs=Array.from(field.sizes),anchor=Array.from(field.anchors),classes=Array.from(field.classes),cluster=[];
 for(let i=0;i<cs.length;i++)cc.push(...(classes[i]?[1,.36,.065]:[.52,.40,1]));
 const fieldCount=cs.length;
 for(let i=0;i<fieldCount;i++){cp[i*3+1]+=.85;const bright=signalHash('beacon:'+i)<.09;cs[i]=bright?7+signalHash('star:'+i)*4:1.5+signalHash('grain:'+i)*2.1;}
 for(const node of network.nodes.filter(n=>n.isFacility||n.isRegionalService)){
  const id=network.nodes.indexOf(node),origin=world(node.x,node.y,heights.get(node.id)),count=node.isFacility?110:80;
  for(let j=0;j<count;j++){
   const seed=signalHash(node.id+':cloud:'+j),angle=seed*PI*2,r=(.3+signalHash(node.id+':r:'+j)*2.4)*(node.isFacility?1:.8),warm=node.type==='culture';
   cp.push(origin.x+Math.cos(angle)*r,origin.y+(signalHash(node.id+':y:'+j)-.5)*3.2,origin.z+Math.sin(angle)*r);cc.push(...(warm?[1,.36,.065]:[.52,.40,1]));cs.push(.9+seed*2.6);anchor.push(id);classes.push(warm?1:0);cluster.push({index:cs.length-1,node:id,base:origin.clone(),angle,r,y:cp[cp.length-2],orbitRate:.06+signalHash(id)*.10});
  }
 }
 const cloud=readableCloud(particles(cp,cc,cs,parent)),baseSizes=Float32Array.from(cs),regionStateIds=regions.map(r=>network.nodes.findIndex(n=>n.id==='service-'+r.id));
 const activeThreshold=Float32Array.from(cs,(_,i)=>signalHash('active:'+i)),nodeAnchors=Uint16Array.from(anchor,(id,i)=>i<fieldCount?regionStateIds[id]:id);
 const localAccess=makeLocalSignalAccess(parent,buildingPositions,regions,regionStateIds);
 // The same close-view detail follows any part of Shanghai, never just the original centre.
 const detailLimit=80000,detail=readableCloud(particles(new Float32Array(detailLimit*3),new Float32Array(detailLimit*3),new Float32Array(detailLimit),parent)),detailNodes=new Uint16Array(detailLimit),detailClasses=new Uint8Array(detailLimit),detailSizes=new Float32Array(detailLimit),detailThresholds=new Float32Array(detailLimit);
 detail.geometry.setDrawRange(0,0);detail.material.uniforms.pixelFloor.value=1.25;detail.material.uniforms.localDetail.value=1;let detailCount=0,detailX=Infinity,detailZ=Infinity,detailScale=0;
 const rebuildDetail=()=>{
  const {x,y:z}=CITY_FADE_UNIFORMS.cityFocus.value,s=CITY_FADE_UNIFORMS.cityScale.value;
  if(Math.hypot(x-detailX,z-detailZ)<7*s&&Math.abs(s-detailScale)<.08*s)return false;detailX=x;detailZ=z;detailScale=s;
  if(s>4.2){detailCount=0;detail.geometry.setDrawRange(0,0);localAccess.clear();return true;}
  const extent=125*s,candidates=[];for(let i=0;i<buildingPositions.length;i+=3)if(Math.abs(buildingPositions[i]-x)<extent&&Math.abs(buildingPositions[i+2]-z)<extent)candidates.push(i);
  localAccess.rebuild(candidates);
  detailCount=Math.min(detailLimit,candidates.length);const out=detail.geometry.attributes.position;
  for(let j=0;j<detailCount;j++){
   const i=candidates[Math.floor(j*candidates.length/detailCount)],px=buildingPositions[i],pz=buildingPositions[i+2];let nearest=0,best=Infinity;
   for(let k=0;k<regions.length;k++){const r=regions[k],distance=(px-r.x*.02)**2+(pz+r.y*.02)**2;if(distance<best){best=distance;nearest=k;}}
   const profile=regions[nearest]?.serviceProfile,publicShare=profile==='industrial'?.30:profile==='business'?.40:.52,key='detail:'+i;detailNodes[j]=regionStateIds[nearest];detailClasses[j]=signalHash(key)<publicShare?1:0;detailSizes[j]=signalHash(key+':bright')<.075?7+signalHash(key+':size')*4:1.4+signalHash(key+':size')*2.2;detailThresholds[j]=signalHash(key+':active');out.setXYZ(j,px,buildingPositions[i+1]+1.0,pz);
  }
  out.needsUpdate=true;detail.geometry.setDrawRange(0,detailCount);return true;
 };
 const haloPositions=network.nodes.flatMap(n=>world(n.x,n.y,heights.get(n.id)).toArray()),haloColor=network.nodes.flatMap(n=>n.type==='culture'?[1,.4,.08]:[.52,.4,1]),haloSizes=network.nodes.map(n=>n.isFacility?5:3);
 const halo=particles(haloPositions,haloColor,haloSizes,parent);halo.material.fragmentShader='varying vec3 c;varying float a;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float ring=exp(-pow((r-.7)*8.,2.));gl_FragColor=vec4(c,a*ring*.3);}';halo.material.uniforms.pixelFloor.value=2.2;
 let lastBucket=-1;
 return {cloud,positions:network.nodes.map(n=>world(n.x,n.y,heights.get(n.id))),fieldStats:field.counts,drawBatches:7,update(state,h,gain){
  uniforms.time.value=h;uniforms.gain.value=gain;uniforms.resolution.value.set(innerWidth,innerHeight);
  const bucket=Math.floor(h*8),rebuilt=rebuildDetail();
  if(bucket!==lastBucket||rebuilt){
   lastBucket=bucket;const states=new Map(state.links.map(l=>[l.id,l])),load=geo.attributes.strength,headLoad=headGeo.attributes.strength,den=geo.attributes.density,headDen=headGeo.attributes.density,fl=geo.attributes.flow,hsp=headGeo.attributes.speed,hoff=headGeo.attributes.offset;
   for(const item of records){
    const l=states.get(item.link.id),intensity=clamp(l?.intensity??0)*(l?.active??1),packets=l?.packetDensity??item.headCount,rate=l?.visualRate??item.style.cyclesPerHour,offset=(l?.phaseClock??(h*rate+item.style.phaseOffset))-h*rate;
    load.array.fill(intensity,item.start,item.start+item.count);den.array.fill(packets,item.start,item.start+item.count);headLoad.array.fill(intensity,item.headStart,item.headStart+item.headCount);headDen.array.fill(packets,item.headStart,item.headStart+item.headCount);
    for(let k=item.start;k<item.start+item.count;k++){fl.array[k*4]=rate;fl.array[k*4+1]=offset;}
    for(let k=0;k<item.headCount;k++){hsp.array[item.headStart+k]=rate;hoff.array[item.headStart+k]=offset+k/item.headCount;}
   }
   for(const attribute of [load,den,headLoad,headDen,fl,hsp,hoff])attribute.needsUpdate=true;
   const size=cloud.geometry.attributes.size,color=cloud.geometry.attributes.color,hs=halo.geometry.attributes.size;
   for(let i=0;i<baseSizes.length;i++){
    const node=state.nodes[nodeAnchors[i]],value=classes[i]?(node?.publicActivity??node?.publicLoad??.2):(node?.machineActivity??node?.machineLoad??.2),active=activeThreshold[i]<.05+.95*value;
    size.array[i]=active?baseSizes[i]*(.65+.65*value):0;
    const light=.22+.78*value;if(classes[i])color.setXYZ(i,light,light*.36,light*.065);else color.setXYZ(i,light*.52,light*.40,light);
   }
   for(let i=0;i<state.nodes.length;i++)hs.array[i]=haloSizes[i]*(.7+(state.nodes[i].receivedIntensity??0)*1.3);
   size.needsUpdate=color.needsUpdate=hs.needsUpdate=true;
   const ds=detail.geometry.attributes.size,dc=detail.geometry.attributes.color;
   for(let i=0;i<detailCount;i++){const node=state.nodes[detailNodes[i]],warm=detailClasses[i],value=warm?(node?.publicActivity??node?.publicLoad??.2):(node?.machineActivity??node?.machineLoad??.2),light=.26+.74*value;ds.array[i]=detailThresholds[i]<.05+.95*value?detailSizes[i]*(.75+.5*value):0;if(warm)dc.setXYZ(i,light,light*.36,light*.065);else dc.setXYZ(i,light*.52,light*.40,light);}
   ds.needsUpdate=dc.needsUpdate=true;
  }
  // These small orbits are ART cues; geographic samples themselves stay on the supplied source mesh.
  const positions=cloud.geometry.attributes.position;for(const c of cluster){const a=c.angle+h*c.orbitRate;positions.setXYZ(c.index,c.base.x+Math.cos(a)*c.r,c.y,c.base.z+Math.sin(a)*c.r);}positions.addUpdateRange?.(fieldCount*3,cluster.length*3);positions.needsUpdate=true;
  cloud.material.uniforms.time.value=h*.45;cloud.material.uniforms.gain.value=gain*(1.25+.35*Math.min(1,CITY_FADE_UNIFORMS.cityScale.value/6));cloud.material.uniforms.activity.value=.45;
  const detailGain=1-smooth(1.8,4.2,CITY_FADE_UNIFORMS.cityScale.value);detail.material.uniforms.time.value=h*.45;detail.material.uniforms.gain.value=gain*.95*detailGain;localAccess.update(state,h,gain,detailGain);
  halo.material.uniforms.time.value=h*.15;halo.material.uniforms.gain.value=gain*.7;
 }};
}

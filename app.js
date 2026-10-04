import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import {createLayerEffects,decorateAtmosphere,atmosphereVertex,atmosphereFragment} from './layer-effects.js';

const $ = (id) => document.getElementById(id);
const mobile = innerWidth < 700;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { mode: 'culture', minute: 1080, playing: !reduced, nature: 0, cloud: 0, elapsed: 26, metrics: [0, 0], ready: false };
const viewScale = mobile ? 1.35 : 1;
const sceneViews = { nature:[4,110,164], culture:[22,46,88], cloud:[5,32,62] };
let zoomLayers = true, previousDistance = 0, resettingView = false;
try { zoomLayers = localStorage.getItem('shanghai2050.tidePulseSignal.zoomLayers') !== 'false'; } catch {}
let seed = 20502209;
function random() { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const project = (lon,lat) => [(lon-121.49)*950, (31.235-lat)*1110];
const landmarkData = [
  {name:'SHANGHAI TOWER',cn:'上海中心',lon:121.5055,lat:31.2336,h:31.6,kind:'twist',description:'陆家嘴的垂直地标。点云沿塔身旋转上升，与周围城市光流相互汇聚。现有建筑的比例经过艺术化处理。'},
  {name:'ORIENTAL PEARL',cn:'东方明珠',lon:121.4998,lat:31.2397,h:23.4,kind:'pearl',description:'黄浦江畔的球体与塔身被拆解为发光粒子。它在未来情景中保留城市记忆，连接江岸与陆家嘴。'},
  {name:'THE BUND',cn:'外滩',lon:121.4905,lat:31.2380,h:2,kind:'label',description:'沿江的历史建筑界面，在点云中形成密集而低缓的光带，与对岸的垂直城市相呼应。'},
  {name:'WORLD FINANCIAL CENTER',cn:'环球金融中心',lon:121.5079,lat:31.2360,h:24.6,kind:'portal',description:'陆家嘴的几何地标。矩形轮廓与顶部开口以点线近似表达，构成城市中心的垂直节奏。'},
  {name:'JIN MAO TOWER',cn:'金茂大厦',lon:121.5050,lat:31.2370,h:21.1,kind:'step',description:'层层收分的轮廓被转译为发光的离散点，随城市活动强度改变呼吸节奏。'},
  {name:'PEOPLE’S SQUARE',cn:'人民广场',lon:121.4752,lat:31.2304,h:1,kind:'label',description:'城市公共空间的汇聚节点。模拟的人群活动沿道路与轨道网络扩散，形成明暗变化的城市脉搏。'},
  {name:'SUZHOU CREEK',cn:'苏州河',lon:121.4840,lat:31.2446,h:0,kind:'label',description:'穿过城市的水脉。在自然场景中，水的流动与风场叠加；在城市场景中，它保留为连续的暗色留白。'}
];
landmarkData.forEach(p=>{[p.x,p.z]=project(p.lon,p.lat);p.h*=.48;});

let renderer,scene,camera,controls,pointMaterial,flowMaterial,trafficMaterial,postMaterial;
let targetA,targetB,targetC,postScene,postCamera,quad,blurMaterial;
let cityGroup,roadGroup,naturalGroup,cloudGroup,trafficPoints;
let trafficPaths=[], glows=[], rings=[], labelElements=[], cityPoints, flowingPoints;
let cityDensity=0, dataSource='schematic', cameraDestination=null;
const cityPos=[],cityCols=[],citySizes=[],citySeeds=[],cityCloud=[];
const roadSegments=[], waterLines=[];
let riverPathForLayers=[],layerEffects;
const clock = new THREE.Clock();

function addPoint(x,y,z,r,g,b,size=1){
  cityPos.push(x,y,z);cityCols.push(r,g,b);citySizes.push(size);citySeeds.push(random()*6.283);
  const u=random()*2-1,branch=Math.floor(random()*5),spread=Math.pow(random(),2)*11,angle=random()*Math.PI*2;
  cityCloud.push(u*110+Math.cos(angle)*spread,14+Math.sin(u*4+branch*1.3)*10+Math.sin(angle)*spread,Math.sin(u*3+branch*1.7)*28+(branch-2)*13+Math.cos(angle)*spread);
}
function building(x,z,w,d,h,rot=0,bright=1){
  const cs=Math.cos(rot),sn=Math.sin(rot);
  const push=(a,y,b)=>{const f=.35+random()*.65;addPoint(x+a*cs-b*sn,y,z+a*sn+b*cs,.30*bright*f,.39*bright*f,.68*bright*f,.6+random()*.9);};
  const n=Math.min(160,Math.max(12,Math.ceil((w+d)*h*6)));
  for(let j=0;j<n;j++){
    const y=random()*h, side=j%4;
    if(side<2)push((random()-.5)*w,y,(side===0?-.5:.5)*d);
    else push((side===2?-.5:.5)*w,y,(random()-.5)*d);
  }
  for(let j=0;j<8;j++)push((random()-.5)*w,h,(random()-.5)*d);
}

function pointShader(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uNature:{value:0},uCloud:{value:0},uEnergy:{value:1},uPixel:{value:Math.min(devicePixelRatio,1.5)}},
 vertexShader:`attribute vec3 tint; attribute float size; attribute float phase; attribute vec3 cloudPosition; varying vec3 vColor; varying float vAlpha; uniform float uTime,uNature,uCloud,uEnergy,uPixel;
 void main(){vec3 p=position;float wave=sin(p.x*.055+uTime*.14)*cos(p.z*.045-uTime*.1)*2.0; p.y=mix(p.y,wave,uNature);p=mix(p,cloudPosition+vec3(sin(uTime*.1+phase)*2.,cos(uTime*.17+phase)*2.,sin(uTime*.13+phase)*2.),uCloud); vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;float scale=clamp(140./max(8.,-mv.z),.4,4.);gl_PointSize=clamp(size*scale*uPixel, .7, 10.);vec3 cloudTint=phase>3.0?vec3(tint.b*1.4,tint.b*.66,tint.b*.12):vec3(tint.b*.26,tint.b*.65,tint.b*1.35);vColor=mix(tint,cloudTint,uCloud);vAlpha=(.69+.31*sin(phase+uTime*.55))*(1.-uNature)*uEnergy*(1.+uCloud*.38);}`,
 fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=pow(1.-d*2.,1.6);gl_FragColor=vec4(vColor*1.45,a*vAlpha);}`});}

function geometryPoints(pos,cols,sizes,phases,cloud){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('tint',new THREE.Float32BufferAttribute(cols,3));g.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));g.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));g.setAttribute('cloudPosition',new THREE.Float32BufferAttribute(cloud||pos,3));return g;}

function makeLine(points,color,opacity,parent){const geom=new THREE.BufferGeometry().setFromPoints(points);const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});const line=new THREE.Line(geom,mat);parent.add(line);return line;}

function distanceToRiver(x,z){let min=999;for(const river of waterLines){for(let i=1;i<river.length;i++){const a=river[i-1],b=river[i];const vx=b[0]-a[0],vz=b[1]-a[1];const t=clamp(((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz||1),0,1);min=Math.min(min,Math.hypot(x-a[0]-t*vx,z-a[1]-t*vz));}}return min;}

async function loadMap(){
 let elements=[];
 try{const r=await fetch('./data/shanghai-osm.json');if(r.ok){const data=await r.json();elements=data.elements||[];if(elements.length)dataSource='osm';}}catch(e){console.warn('Map unavailable; schematic fallback active.');}
 for(const e of elements){if(!e.geometry?.length)continue;const line=e.geometry.map(p=>project(p.lon,p.lat));
  if(e.tags?.waterway){waterLines.push(line);}
  else if(e.tags?.highway){roadSegments.push({points:line,kind:e.tags.highway});}
 }
 // A continuous Huangpu centerline is also retained for coherent water masking between OSM segments.
 const huangpu=[[121.445,31.155],[121.452,31.18],[121.462,31.197],[121.484,31.208],[121.505,31.215],[121.503,31.226],[121.493,31.233],[121.488,31.242],[121.499,31.250],[121.520,31.256],[121.539,31.267],[121.545,31.285],[121.56,31.315]];
 const riverCurve=new THREE.CatmullRomCurve3(huangpu.map(([lon,lat])=>{const[x,z]=project(lon,lat);return new THREE.Vector3(x,0,z);}));
 const riverPath=riverCurve.getPoints(420).map(p=>[p.x,p.z]);waterLines.push(riverPath);riverPathForLayers=riverPath;
 if(!roadSegments.length){for(let i=-65;i<95;i+=3.1){const p=[];for(let j=-80;j<75;j+=2)p.push([i+Math.sin(j*.026)*9,j]);roadSegments.push({points:p,kind:'secondary'});}for(let i=-65;i<80;i+=3.8){const p=[];for(let j=-90;j<95;j+=2)p.push([j,i+Math.cos(j*.037)*7]);roadSegments.push({points:p,kind:'residential'});}}
 const lp=[],lc=[];
 for(const road of roadSegments){const pts=road.points;
  for(let i=1;i<pts.length;i++){lp.push(pts[i-1][0],.03,pts[i-1][1],pts[i][0],.03,pts[i][1]);const b=road.kind==='residential'?.095:.19;lc.push(b*.32,b*.50,b,b*.32,b*.50,b);}
  if(pts.length>3&&road.kind!=='residential')trafficPaths.push(pts);
 }
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));geom.setAttribute('color',new THREE.Float32BufferAttribute(lc,3));roadGroup.add(new THREE.LineSegments(geom,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false})));
 // Particle banks make the river readable without a basemap texture.
 for(let i=0;i<riverPath.length-1;i++){const a=riverPath[i],b=riverPath[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len;
  for(const side of [-1,1])for(let j=0;j<5;j++){const off=2.15+random()*.55;addPoint(a[0]+nx*off*side,.07,a[1]+nz*off*side,.13,.33,.55,.75);}
 }
 // River masking is geometric (distanceToRiver), not an invisible depth-writing mesh.
 // The visible PULSE ribbon is created separately by createLayerEffects.
 for(const e of elements){if(!e.tags?.building||!e.geometry||e.geometry.length<4)continue;const p=e.geometry.map(q=>project(q.lon,q.lat));const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]),x=(Math.min(...xs)+Math.max(...xs))/2,z=(Math.min(...zs)+Math.max(...zs))/2;
  if(landmarkData.some(q=>q.kind!=='label'&&Math.hypot(q.x-x,q.z-z)<1))continue;
  const h=(parseFloat(e.tags.height)||parseFloat(e.tags['building:levels'])*3.4||12+random()*40)/100*1.7;
  building(x,z,Math.max(.12,Math.max(...xs)-Math.min(...xs)),Math.max(.12,Math.max(...zs)-Math.min(...zs)),Math.min(10,h),0,.9);
 }
 // Street-adjacent volumes are artistic infill, not predicted building footprints.
 const maxBuildings=mobile?3600:6100;
 for(let n=0;n<maxBuildings;n++){const road=roadSegments[Math.floor(random()*roadSegments.length)],i=Math.floor(random()*(road.points.length-1)),a=road.points[i],b=road.points[i+1];const t=random(),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1,side=random()>.5?1:-1;
  const x=lerp(a[0],b[0],t)-dz/len*(.3+random()*.5)*side,z=lerp(a[1],b[1],t)+dx/len*(.3+random()*.5)*side;
  if(distanceToRiver(x,z)<2.5||landmarkData.some(p=>p.kind!=='label'&&Math.hypot(p.x-x,p.z-z)<1.1))continue;
  const central=Math.exp(-((x-7)**2+(z+2)**2)/420),w=.18+random()*.52,d=.18+random()*.58,h=.18+Math.pow(random(),3)*(2+central*5);
  building(x,z,w,d,h,Math.atan2(dz,dx),.55+central*.8);
 }
 cityDensity=cityPos.length/3;
}

function createLandmarks(){
 for(const p of landmarkData){
  if(p.kind==='label')continue;
  const layers=Math.floor(p.h*16), sides=p.kind==='pearl'?24:32;
  for(let l=0;l<layers;l++){const v=l/layers,y=v*p.h;
   let radius=1.15*(1-v*.68), angleOffset=v*.85;
   if(p.kind==='pearl'){radius=.13;for(const[s,r]of [[.20,1.2],[.56,1.05],[.78,.4]]){const dy=y-p.h*s;if(Math.abs(dy)<r)radius=Math.max(radius,Math.sqrt(r*r-dy*dy));}}
   if(p.kind==='step')radius=(1-Math.floor(v*11)/13)*.8;
   for(let s=0;s<sides;s++){const angle=s/sides*Math.PI*2+angleOffset;
    let dx=Math.cos(angle)*radius,dz=Math.sin(angle)*radius;
    if(p.kind==='portal'){const side=s%4,u=(Math.floor(s/4)/(sides/4)-.5)*1.8;dx=side<2?u:(side===2?-.9:.9);dz=side<2?(side===0?-.5:.5):u*.56;dx*=1-v*.45;dz*=1-v*.45;if(v>.82&&v<.94&&Math.abs(dx)<.37)continue;}
    if(p.kind==='step'){const scale=.85/Math.max(Math.abs(Math.cos(angle)),Math.abs(Math.sin(angle)));dx*=scale;dz*=scale;}
    const intensity=.23+random()*.24;addPoint(p.x+dx,y,p.z+dz,intensity*.56,intensity*.73,intensity,.6+random()*.55);
   }
  }
  if(p.kind==='pearl'||p.kind==='step')for(let y=p.h*.85;y<p.h*1.07;y+=.06)addPoint(p.x,y,p.z,.7,.85,1,1.1);
 }
 const shown=landmarkData.filter(p=>p.kind!=='step'&&p.kind!=='portal');
 for(const p of shown){const el=document.createElement('button');el.className='landmark';el.innerHTML=`${p.name}<span>${p.cn}</span>`;el.setAttribute('aria-label',`查看${p.cn}`);el.onclick=()=>{ $('place-name').textContent=p.cn;$('place-description').textContent=p.description;$('place-coord').textContent=`${p.lat.toFixed(4)}° N / ${p.lon.toFixed(4)}° E`;$('place-dialog').showModal();};$('landmarks').append(el);labelElements.push({el,p});}
}

function createFlows(){
 const positions=[];
 for(let z=-210;z<210;z+=2){for(let x=-240;x<240;x+=1.5)positions.push(x,0,z,x+1.5,0,z);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 flowMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uNature:{value:0},uCloud:{value:0},uTide:{value:0},uHumidity:{value:.6},uWind:{value:.4}},
 vertexShader:`varying float vLight;uniform float uTime,uNature,uCloud,uTide;void main(){vec3 p=position;float r=length(p.xz);float w=sin(p.x*.045+uTime*.13)*cos(p.z*.027-uTime*.10)*4.+sin(p.x*.11+p.z*.05+uTime*.2)*1.6+sin(p.x*.28+p.z*.12+uTime*.31)*.6+sin(p.x*.55-p.z*.23+uTime*.17)*.24;float swell=exp(-length(p.xz-vec2(15.,-20.))*.022)*7.;p.y=(w+swell+uTide)*(0.12+uNature*.88)-.7;p.x+=sin(p.z*.03+uTime*.08)*uNature*2.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;vLight=(.13+uNature*.55)*(1.-uCloud*.55)*clamp(1.-r/350.,.1,1.);}`,
 fragmentShader:`varying float vLight;void main(){gl_FragColor=vec4(.22,.32,.56,vLight);}`});
 decorateAtmosphere(g);flowMaterial.vertexShader=atmosphereVertex;flowMaterial.fragmentShader=atmosphereFragment;naturalGroup.add(new THREE.LineSegments(g,flowMaterial));
 // Glowing parcels travel through a continuous vector field; the field is an artistic scenario.
 const fp=[],fc=[],fs=[],fh=[];
 for(let i=0;i<(mobile?1700:3500);i++){const center=landmarkData[Math.floor(random()*landmarkData.length)];const radius=Math.pow(random(),2)*70,angle=random()*Math.PI*2;fp.push(center.x+Math.cos(angle)*radius,random()*3,center.z+Math.sin(angle)*radius);const blue=random()>.23;fc.push(blue?.15:1,blue?.48:.28,blue?1:.07);fs.push(2+Math.pow(random(),3)*10);fh.push(random()*6.28);}
 const geo=geometryPoints(fp,fc,fs,fh);
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uNature:{value:0},uCloud:{value:0},uPixel:{value:Math.min(devicePixelRatio,1.5)}},
 vertexShader:`attribute vec3 tint;attribute float size,phase;varying vec3 vColor;varying float vAlpha;uniform float uTime,uNature,uCloud,uPixel;void main(){vec3 p=position;p.x+=sin(phase+uTime*.12+p.z*.035)*(2.+uNature*5.);p.z+=cos(phase+uTime*.09)*3.;p.y+=abs(sin(phase+uTime*.15))*(1.+uCloud*28.)+uNature*(sin(p.x*.045+uTime*.13)*cos(p.z*.027-uTime*.1)*4.+3.);p.xz*=1.+uCloud*.45;p.xz=mix(p.xz,p.xz*2.5+vec2(sin(phase*7.)*25.,cos(phase*4.)*20.),uNature);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*180./max(8.,-mv.z)*uPixel,1.,32.);vColor=tint;vAlpha=.4+.6*sin(phase+uTime*.25)*sin(phase+uTime*.25);}`,
 fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=exp(-d*d*5.);vec3 col=vColor+vec3(.35)*pow(1.-d,7.);gl_FragColor=vec4(col,a*vAlpha);}`});
 flowingPoints=new THREE.Points(geo,mat);scene.add(flowingPoints);
 for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(.97,1,90),new THREE.MeshBasicMaterial({color:0x749bd9,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));ring.rotation.x=-Math.PI/2;ring.position.set((random()-.5)*110,.3,(random()-.5)*100);ring.userData.offset=random()*10;scene.add(ring);rings.push(ring);}
 // Spatial axes belong to the information-cloud view.
 for(let i=-2;i<=2;i++){const z=i*28;makeLine([new THREE.Vector3(-140,12,z),new THREE.Vector3(140,12,z)],0x6486c8,.20,cloudGroup);makeLine([new THREE.Vector3(z,12,-140),new THREE.Vector3(z,12,140)],0x6486c8,.20,cloudGroup);}
 for(const [text,x,z] of [['121.4900° E',-26,-32],['31.2350° N',24,14],['2050',-32,40]]){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle='#d9e5ff';ctx.font='36px Consolas, monospace';ctx.fillText(text,12,63);const label=new THREE.Mesh(new THREE.PlaneGeometry(28,5.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));label.rotation.x=-Math.PI/2;label.position.set(x,12.2,z);cloudGroup.add(label);}
 for(const [ax,az,bx,bz]of [[-85,65,65,-70],[-90,-55,80,55],[-45,90,35,-75]]){const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),nx=-dz/len*.15,nz=dx/len*.15;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([ax+nx,10,az+nz,ax-nx,10,az-nz,bx+nx,10,bz+nz,bx+nx,10,bz+nz,ax-nx,10,az-nz,bx-nx,10,bz-nz],3));const ray=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x37d4ff,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));ray.userData.ray=true;ray.userData.phase=cloudGroup.children.length*.7;cloudGroup.add(ray);}
}

function createTraffic(){
 if(!trafficPaths.length)return;
 const positions=new Float32Array(900*3),colors=[],sizes=[],phases=[];
 for(let i=0;i<900;i++){colors.push(.12,.67,1);sizes.push(1+random()*1.2);phases.push(random()*Math.PI*2);}
 const g=geometryPoints(positions,colors,sizes,phases);trafficMaterial=pointShader();trafficPoints=new THREE.Points(g,trafficMaterial);trafficPoints.frustumCulled=false;scene.add(trafficPoints);
 // Discrete city connections appear as thin cyan rays, with moving pulses along them.
 for(let i=0;i<12;i++){const p=landmarkData[i%landmarkData.length],q=landmarkData[(i*3+2)%landmarkData.length];if(p===q)continue;const a=new THREE.Vector3(p.x,1,p.z),b=new THREE.Vector3(q.x,1,q.z),mid=a.clone().lerp(b,.5);mid.y=2+random()*4;const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const line=makeLine(curve.getPoints(50),0x36b8ef,.32,cityGroup);line.userData.connection=true;}
 for(let i=0;i<8;i++){const path=trafficPaths[Math.floor(i*trafficPaths.length/8)],a=path[0],b=path[path.length-1];makeLine([new THREE.Vector3(a[0]*1.8,1.6,a[1]*1.8),new THREE.Vector3(b[0]*1.8,1.6,b[1]*1.8)],0x4ccfff,.42,cityGroup);}
}

function initPost(){
 const opts={depthBuffer:true,type:THREE.HalfFloatType};targetA=new THREE.WebGLRenderTarget(1,1,opts);targetB=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});targetC=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false});
 postScene=new THREE.Scene();postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
 blurMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tDiffuse:{value:null},direction:{value:new THREE.Vector2()}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse;uniform vec2 direction;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb*.227027;c+=texture2D(tDiffuse,vUv+direction*1.384615).rgb*.316216;c+=texture2D(tDiffuse,vUv-direction*1.384615).rgb*.316216;c+=texture2D(tDiffuse,vUv+direction*3.230769).rgb*.070270;c+=texture2D(tDiffuse,vUv-direction*3.230769).rgb*.070270;gl_FragColor=vec4(c,1.);}`});
 postMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tScene:{value:targetA.texture},tGlow:{value:targetC.texture},uTime:{value:0}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D tScene,tGlow;uniform float uTime;void main(){vec2 v=vUv-.5;float edge=dot(v,v);vec2 offset=v*.0015;vec3 base=texture2D(tScene,vUv).rgb;base.r=texture2D(tScene,vUv+offset).r;base.b=texture2D(tScene,vUv-offset).b;vec3 bloom=texture2D(tGlow,vUv).rgb;vec3 c=base+bloom*.82;c+=vec3(.006,.009,.021);c*=1.-edge*.52;float noise=fract(sin(dot(vUv+uTime*.0001,vec2(12.9898,78.233)))*43758.5453);c+=(noise-.5)*.009;gl_FragColor=vec4(c,1.);}`});
 quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMaterial);postScene.add(quad);
}

function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const px=Math.min(devicePixelRatio,mobile?1.25:1.5);renderer.setPixelRatio(px);targetA.setSize(Math.floor(w*px),Math.floor(h*px));targetB.setSize(Math.floor(w*px/3),Math.floor(h*px/3));targetC.setSize(Math.floor(w*px/3),Math.floor(h*px/3));drawCharts();}
function resetView(){resettingView=true;cameraDestination=null;setMode('culture',false);controls.target.set(0,0,0);camera.position.set(...sceneViews.culture).multiplyScalar(viewScale);controls.update();previousDistance=controls.getDistance();resettingView=false;}
function setMode(mode,moveCamera=true){if(!['nature','culture','cloud'].includes(mode))throw new Error('Unknown scene');state.mode=mode;state.metrics=[0,0];document.body.dataset.mode=mode;$('data-panel').setAttribute('aria-hidden',String(mode!=='culture'));if(moveCamera)cameraDestination=new THREE.Vector3(...sceneViews[mode]).multiplyScalar(viewScale);document.querySelectorAll('[data-layer]').forEach(el=>{const selected=el.dataset.layer===mode;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});$('rail-thumb').style.top={nature:'0%',culture:'45%',cloud:'90%'}[mode];updateWords();drawCharts();return {mode,year:2050,data:'scenario'};}
function syncZoomLayer(){
 const distance=controls.getDistance()/viewScale;
 // Separate entry/exit distances prevent flickering at a layer boundary.
 let next=state.mode;
 if(state.mode==='nature'){if(distance<180)next=distance<95?'cloud':'culture';}
 else if(state.mode==='cloud'){if(distance>102)next=distance>190?'nature':'culture';}
 else if(distance>190)next='nature';else if(distance<95)next='cloud';
 // A zoom transition changes the artwork without moving the camera again.
 if(next!==state.mode)setMode(next,false);
}
function updateZoomSetting(){
 $('zoom-layers').checked=zoomLayers;
 $('zoom-hint').textContent=zoomLayers?'滚轮缩放 / 切换场景':'滚轮缩放';
 $('world').setAttribute('aria-label',`三维城市：拖动旋转，${zoomLayers?'滚轮拉远进入潮、拉近进入讯，中间为脉':'滚轮缩放'}，方向键移动视角，数字1、2、3切换场景`);
}
function updateWords(){const words=state.mode==='cloud'?['2050 / 情景信号','连接 CONNECTION','共生 SYMBIOSIS','流动 MOVEMENT','重组 REASSEMBLY','城市 CITY','记忆 MEMORY','相遇 ENCOUNTER','潮汐 TIDES','未来 FUTURES']:['上海 / 人文情景','里弄记忆','社区相遇','江岸公共空间','文化与创作','城市数字记忆','流动的社区','开放的文化','上海 · 2050'];$('words').replaceChildren(...[...words,...words].map(word=>{const d=document.createElement('div');d.textContent=word;return d;}));$('news-title').textContent=state.mode==='cloud'?'DATA CONNECTIONS':'CULTURAL SIGNALS';$('stat-heading').textContent=state.mode==='cloud'?'DATA CLOUD':'PEOPLE & CULTURE';}

const metrics={
 community:{label:'COMMUNITY',unit:'社区活动 · 模拟',color:'#a77af1',phase:2,fn:h=>.15+.5*Math.exp(-Math.pow((h-19)/3.8,2))+.20*Math.exp(-Math.pow((h-11)/3,2))},
 humidity:{label:'HUMIDITY',unit:'水汽强度 · 模拟',color:'#32cfff',phase:2,fn:h=>.45+.25*Math.sin(h*.3)**2},
 stream:{label:'DATA STREAM',unit:'传播强度 · 模拟',color:'#8765ff',phase:3,fn:h=>.2+.38*Math.sin(h*.26)**2+.18*Math.sin(h*.68)**2},
 archive:{label:'CONNECTIONS',unit:'关联强度 · 模拟',color:'#ed992b',phase:4,fn:h=>.2+.45*Math.sin(h*.18)**2},
 social:{label:'SOCIAL',unit:'活动强度 · 模拟',color:'#7955ff',phase:1,fn:h=>.14+.35*Math.exp(-Math.pow((h-13)/4,2))+.55*Math.exp(-Math.pow((h-20)/3.6,2))},
 metro:{label:'MOBILITY',unit:'出行强度 · 模拟',color:'#e88a2c',phase:3,fn:h=>.09+.70*Math.exp(-Math.pow((h-8)/2.1,2))+.65*Math.exp(-Math.pow((h-18)/2.6,2))},
 news:{label:'NEWS',unit:'主题活跃度 · 构想',color:'#bca9ff',phase:2,fn:h=>.2+.30*Math.sin(h*.24)**2+.20*Math.sin(h*.77)**2},
 weather:{label:'WEATHER',unit:'风场强度 · 情景',color:'#ee8c3c',phase:4,fn:h=>.38+.22*Math.sin((h-7)*.2)+.10*Math.sin(h*.75)},
 climate:{label:'CLIMATE',unit:'季节热量 · 情景',color:'#f79b77',phase:6,fn:h=>.35+.4*Math.sin(h/24*Math.PI)**2},
 ocean:{label:'WATER LEVEL',unit:'相对水位 · 模拟',color:'#45c3ef',phase:7,fn:h=>.45+.35*Math.sin(h/12.42*Math.PI*2)},
};
const modeMetrics={culture:[['social','news'],['metro','community']],nature:[['ocean','humidity'],['weather','climate']],cloud:[['stream','social'],['archive','news']]};
function drawCharts(){for(let panel=0;panel<2;panel++){const key=modeMetrics[state.mode][panel][state.metrics[panel]%modeMetrics[state.mode][panel].length],metric=metrics[key],letter=panel?'b':'a',canvas=$(`bars-${letter}`),ctx=canvas.getContext('2d'),rect=canvas.getBoundingClientRect();if(rect.width===0)continue;canvas.width=Math.round(rect.width*2);canvas.height=Math.round(rect.height*2);ctx.scale(2,2);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#8298b520';ctx.lineWidth=.5;for(let j=1;j<4;j++){ctx.beginPath();ctx.moveTo(w*j/4,0);ctx.lineTo(w*j/4,h);ctx.stroke();}const total=48;for(let i=0;i<total;i++){const hour=i/2,base=metric.fn(hour),mod=1,v=clamp(base*mod,.02,.98);ctx.fillStyle=metric.color;ctx.globalAlpha=hour<=state.minute/60?.92:.42;ctx.fillRect(5+i*(w-10)/total,h-v*(h-7),1.35,v*(h-7));}ctx.globalAlpha=1;ctx.fillStyle='#d4e7ff';const cursor=state.minute/1440*w;ctx.fillRect(cursor,0,1,h);$(`metric-${letter}`).textContent=metric.label;$(`summary-${letter}`).textContent=metric.unit;canvas.setAttribute('aria-label',`${metric.label}：${metric.unit}`);}}

let audioCtx,audioGain,audioOscillators=[];
async function toggleSound(){try{if(!audioCtx){audioCtx=new AudioContext();audioGain=audioCtx.createGain();audioGain.gain.value=0;audioGain.connect(audioCtx.destination);for(const hz of [55,82.41,110.1]){const osc=audioCtx.createOscillator(),g=audioCtx.createGain();osc.type='sine';osc.frequency.value=hz;g.gain.value=.065;osc.connect(g);g.connect(audioGain);osc.start();audioOscillators.push(osc);}}await audioCtx.resume();const on=$('sound').getAttribute('aria-pressed')!=='true';audioGain.gain.setTargetAtTime(on?.45:0,audioCtx.currentTime,.7);$('sound').setAttribute('aria-pressed',String(on));$('sound').textContent=on?'SOUND ON':'SOUND OFF';}catch(e){$('sound').textContent='SOUND UNAVAILABLE';}}
function installUI(){document.querySelectorAll('[data-layer]').forEach(el=>el.onclick=()=>setMode(el.dataset.layer));$('about-button').onclick=()=>$('about-dialog').showModal();document.querySelectorAll('.dialog-close').forEach(el=>el.onclick=()=>el.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));$('reset').onclick=resetView;$('sound').onclick=toggleSound;
 updateZoomSetting();
 $('zoom-layers').onchange=e=>{zoomLayers=e.target.checked;try{localStorage.setItem('shanghai2050.tidePulseSignal.zoomLayers',String(zoomLayers));}catch{}updateZoomSetting();if(zoomLayers&&!cameraDestination)syncZoomLayer();};
 controls.addEventListener('change',()=>{const distance=controls.getDistance(),zoomed=Math.abs(distance-previousDistance)>.005;previousDistance=distance;if(zoomLayers&&zoomed&&state.ready&&!resettingView&&!cameraDestination)syncZoomLayer();});
 $('play').onclick=()=>{state.playing=!state.playing;updatePlay();};$('timeline').oninput=e=>{state.minute=Number(e.target.value);state.playing=false;updatePlay();drawCharts();};$('metric-a').onclick=()=>{state.metrics[0]++;drawCharts();};$('metric-b').onclick=()=>{state.metrics[1]++;drawCharts();};
 $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){$('fullscreen').title='当前浏览器不支持全屏';}};
 addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.matches('input,textarea'))return;if(['1','2','3'].includes(e.key))setMode(['nature','culture','cloud'][Number(e.key)-1]);if(e.code==='Space'&&!e.target.matches('button')){e.preventDefault();state.playing=!state.playing;updatePlay();}if(e.key==='Home')resetView();});controls.listenToKeyEvents($('world'));updatePlay();updateWords();
 const context=document.modelContext;if(context?.registerTool){try{context.registerTool({name:'set_city_scene',description:'Switch Shanghai 2050 between TIDE (environment), PULSE (people) and SIGNAL (data cloud).' ,inputSchema:{type:'object',properties:{scene:{type:'string',enum:['tide','pulse','signal']}},required:['scene'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{const mapping={tide:'nature',pulse:'culture',signal:'cloud'};if(!input||!mapping[input.scene])throw new Error('scene must be tide, pulse or signal');setMode(mapping[input.scene]);await new Promise(requestAnimationFrame);return{scene:input.scene,year:2050,data:'illustrative scenario'};}});}catch(e){console.info('Optional scene tool unavailable.');}}
}
function updatePlay(){$('play').textContent=state.playing?'Ⅱ':'▷';$('play').setAttribute('aria-label',state.playing?'暂停时间':'播放时间');$('play').title=state.playing?'暂停时间':'播放时间';}

let lastCharts=0,lastLabels=0;
function animate(){requestAnimationFrame(animate);if(document.hidden)return;const dt=Math.min(clock.getDelta(),.06);if(state.playing){state.elapsed+=dt;state.minute=(state.minute+dt*1.6)%1440;}const t=state.elapsed;state.nature=lerp(state.nature,state.mode==='nature'?1:0,Math.min(1,dt*1.8));state.cloud=lerp(state.cloud,state.mode==='cloud'?1:0,Math.min(1,dt*1.8));const n=state.nature,c=state.cloud,hour=state.minute/60;
 const channels={tide:metrics.ocean.fn(hour),humidity:metrics.humidity.fn(hour),wind:metrics.weather.fn(hour),stream:metrics.stream.fn(hour)};
 layerEffects.update(t,n,c,channels);
 if(cameraDestination){camera.position.lerp(cameraDestination,Math.min(1,dt*2));controls.target.lerp(new THREE.Vector3(),Math.min(1,dt*2));if(camera.position.distanceTo(cameraDestination)<.08)cameraDestination=null;}controls.update();
 pointMaterial.uniforms.uTime.value=t;pointMaterial.uniforms.uNature.value=n;pointMaterial.uniforms.uCloud.value=c;pointMaterial.uniforms.uEnergy.value=(.84+.24*metrics.social.fn(hour))*(1+c*(channels.stream-.4)*.35);
 flowMaterial.uniforms.uTime.value=t;flowMaterial.uniforms.uNature.value=n;flowMaterial.uniforms.uCloud.value=c;flowMaterial.uniforms.uTide.value=(channels.tide-.45)*1.4;flowMaterial.uniforms.uHumidity.value=channels.humidity;flowMaterial.uniforms.uWind.value=channels.wind;
 flowingPoints.material.uniforms.uTime.value=t;flowingPoints.material.uniforms.uNature.value=n;flowingPoints.material.uniforms.uCloud.value=c;
 roadGroup.children[0].material.opacity=(1-n)*(1-c)*.85;cityGroup.children.forEach(line=>line.material.opacity=.24*(1-n)*(1-c));cloudGroup.visible=c>.01;cloudGroup.children.forEach(l=>l.material.opacity=c*(l.userData.ray?(.5+.22*Math.pow(Math.sin(t*.65+l.userData.phase),2)):.42));
 if(trafficPoints){const pos=trafficPoints.geometry.attributes.position;for(let i=0;i<pos.count;i++){const path=trafficPaths[i%trafficPaths.length],phase=(t*(.08+(i%9)*.013)+i*.37)%1,index=phase*(path.length-1),a=Math.floor(index),b=Math.min(a+1,path.length-1);pos.setXYZ(i,lerp(path[a][0],path[b][0],index-a),.2,lerp(path[a][1],path[b][1],index-a));}pos.needsUpdate=true;trafficMaterial.uniforms.uEnergy.value=(1-n)*(1-c)*(.5+metrics.metro.fn(state.minute/60)*2);}
 rings.forEach(r=>{const phase=(t*.1+r.userData.offset)%1;r.scale.setScalar(1+phase*12);r.material.opacity=0;});
 if(performance.now()-lastLabels>60){lastLabels=performance.now();const occupied=[];for(const {el,p}of labelElements){const v=new THREE.Vector3(p.x,p.h+2.6,p.z).project(camera),x=(v.x*.5+.5)*innerWidth,y=(-v.y*.5+.5)*innerHeight;const hidden=v.z>1||x<innerWidth*.19||x>innerWidth*.78||y<110||y>innerHeight*.79||n>.6||c>.65;let yy=y;for(const o of occupied)if(Math.abs(o.x-x)<190&&Math.abs(o.y-yy)<31)yy=o.y-34;occupied.push({x,y:yy});el.style.transform=`translate(${x.toFixed(1)}px,${yy.toFixed(1)}px)`;el.style.opacity=hidden?'0':String(.85*(1-n)*(1-c));el.style.pointerEvents=hidden?'none':'auto';el.tabIndex=hidden?-1:0;}const h=Math.floor(state.minute/60),m=Math.floor(state.minute%60);$('clock').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(Math.floor(state.minute*60%60)).padStart(2,'0')}`;$('timeline').value=Math.floor(state.minute);$('words').style.transform=`translateY(-${(t*6)%306}px)`;}
 if(performance.now()-lastCharts>600){drawCharts();lastCharts=performance.now();}
 renderer.setRenderTarget(targetA);renderer.render(scene,camera);quad.material=blurMaterial;blurMaterial.uniforms.tDiffuse.value=targetA.texture;blurMaterial.uniforms.direction.value.set(2/targetB.width,0);renderer.setRenderTarget(targetB);renderer.render(postScene,postCamera);blurMaterial.uniforms.tDiffuse.value=targetB.texture;blurMaterial.uniforms.direction.value.set(0,2/targetC.height);renderer.setRenderTarget(targetC);renderer.render(postScene,postCamera);quad.material=postMaterial;postMaterial.uniforms.uTime.value=t;renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
}

async function init(){try{
 renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:false,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.setClearColor(0x01030c);
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,1200);controls=new OrbitControls(camera,$('world'));controls.enableDamping=true;controls.dampingFactor=.045;controls.minDistance=15;controls.maxDistance=370;controls.maxPolarAngle=Math.PI*.47;controls.minPolarAngle=.12;controls.panSpeed=.55;controls.rotateSpeed=.32;controls.zoomSpeed=.65;controls.enablePan=true;
 cityGroup=new THREE.Group();roadGroup=new THREE.Group();naturalGroup=new THREE.Group();cloudGroup=new THREE.Group();scene.add(cityGroup,roadGroup,naturalGroup,cloudGroup);
 await loadMap();createLandmarks();pointMaterial=pointShader();cityPoints=new THREE.Points(geometryPoints(cityPos,cityCols,citySizes,citySeeds,cityCloud),pointMaterial);cityPoints.frustumCulled=false;scene.add(cityPoints);layerEffects=createLayerEffects(riverPathForLayers);scene.add(layerEffects.river,layerEffects.contours,layerEffects.signal);createFlows();createTraffic();initPost();installUI();resetView();resize();controls.addEventListener('start',()=>{cameraDestination=null;});addEventListener('resize',resize);state.ready=true;
 const sceneParams=new URLSearchParams(location.search),sceneNames={tide:'nature',pulse:'culture',signal:'cloud'},initialMode=sceneNames[sceneParams.get('scene')];
 if(initialMode){resettingView=true;setMode(initialMode,false);camera.position.set(...sceneViews[initialMode]).multiplyScalar(viewScale);state.nature=initialMode==='nature'?1:0;state.cloud=initialMode==='cloud'?1:0;controls.update();previousDistance=controls.getDistance();resettingView=false;}
 if(sceneParams.get('paused')==='1'){state.playing=false;updatePlay();}
 document.body.dataset.mapSource=dataSource;$('scenario-status').textContent=dataSource==='osm'?'2050 情景 · 模拟':'2050 情景 · 示意地图';document.body.dataset.pointCount=String(cityPos.length/3);$('loading').classList.add('loaded');setTimeout(()=>$('loading').remove(),1100);animate();
 console.info(`Shanghai artwork ready: ${cityPos.length/3} city points, ${roadSegments.length} roads, source: ${dataSource}`);
 }catch(error){console.error(error);const pending=$('loading');if(pending)pending.remove();$('error').hidden=false;}}
init();

import * as THREE from 'three';
import {particles} from './visuals.mjs';
import {CITY_FADE_GLSL,CITY_FADE_UNIFORMS} from './horizon-field.mjs';

export function projectGeo(lon,lat){const R=6378137;return [(R*lon*Math.PI/180-13524761.533928772)*.02,0,-(R*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))-3663957.0930902106)*.02];}
const load=async name=>{const r=await fetch(new URL('./data/'+name,import.meta.url));if(!r.ok)throw Error(name+' '+r.status);return new Float32Array(await r.arrayBuffer());};
function lineMaterial(kind){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.NormalBlending,uniforms:{...CITY_FADE_UNIFORMS,gain:{value:kind==='building'?.8:kind==='water'?.3:.20}},vertexShader:'varying vec2 w;void main(){w=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:CITY_FADE_GLSL+`varying vec2 w;uniform float gain;void main(){gl_FragColor=vec4(${kind==='water'?'vec3(.035,.48,.9)':'vec3(.04,.25,.64)'},cityFade(w)*gain);}`});}
// Subtle building bodies use the same source-roof LOD everywhere, never a core-only mesh.
// These roof bounding volumes are display proxies; the source edges retain shape detail.
function roofBodies(raw,scene,covers){
 const limit=40000,matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.NormalBlending,uniforms:{...CITY_FADE_UNIFORMS},vertexShader:'varying vec2 w;varying float light;void main(){vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);w=world.xz;light=.45+.55*abs(dot(normalize(normalMatrix*normal),normalize(vec3(.3,.6,.75))));gl_Position=projectionMatrix*viewMatrix*world;}',fragmentShader:CITY_FADE_GLSL+'varying vec2 w;varying float light;void main(){gl_FragColor=vec4(vec3(.035,.25,.64)*light,.28*cityFade(w));}'});
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,limit);mesh.renderOrder=-12;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);
 let previousX=Infinity,previousZ=Infinity,previousScale=0;
 return ()=>{
  const {x,y:focusZ}=CITY_FADE_UNIFORMS.cityFocus.value,s=CITY_FADE_UNIFORMS.cityScale.value;
  if(Math.hypot(x-previousX,focusZ-previousZ)<4*s&&Math.abs(s-previousScale)<.04*s)return;
  previousX=x;previousZ=focusZ;previousScale=s;
  const extent=150*s;let count=0;
  // Large/concave complexes keep source points and edges: a broad box would invent solid roof areas.
  // The asset has fixed spatial priority, so crossing a density threshold never resamples the whole city.
  for(let i=0;i<raw.length;i+=6)if(raw[i+3]<=5&&raw[i+5]<=5&&!covers(raw[i],raw[i+2],raw[i+3]*.5,raw[i+5]*.5)&&Math.abs(raw[i]-x)<extent&&Math.abs(raw[i+2]-focusZ)<extent){position.set(raw[i],raw[i+1],raw[i+2]);scale.set(raw[i+3],raw[i+4],raw[i+5]);matrix.compose(position,rotation,scale);mesh.setMatrixAt(count++,matrix);if(count===limit)break;}
  mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
 };
}
export async function loadRegional(scene,pulse,landmarks,{loadBinary}={}){
 const read=loadBinary?async name=>new Float32Array(await loadBinary(name)):load;
 const [p,road,water,edge,roof]=await Promise.all(['regional-buildings.bin','regional-roads.bin','regional-water.bin','regional-building-edges.bin','regional-roof-volumes.bin'].map(read));
 // Only the two freestanding particle towers replace overlapping blue placeholder bodies.
 const footprints=landmarks.filter(l=>l.artworkFootprint).map(l=>{const q=projectGeo(l.lon,l.lat);return {x:q[0],z:q[2],rx:l.id==='shanghai-tower'?2.45:1.1,rz:l.id==='shanghai-tower'?1.85:1.1};});
 const covers=(x,z,rx=0,rz=0)=>footprints.some(f=>Math.abs(x-f.x)<f.rx+rx&&Math.abs(z-f.z)<f.rz+rz);
 const updateBodies=roofBodies(roof,scene,covers),filtered=[];
 for(let i=0;i<edge.length;i+=6)if(!covers((edge[i]+edge[i+3])*.5,(edge[i+2]+edge[i+5])*.5))for(let k=0;k<6;k++)filtered.push(edge[i+k]);
 const n=p.length/3,colors=new Float32Array(n*3),sizes=new Float32Array(n);
 for(let i=0;i<n;i++){colors.set([.06,.30,.72],i*3);sizes[i]=covers(p[i*3],p[i*3+2])?0:.9;}
 // A single full-source point/edge base covers both the centre and the outskirts.
 const city=particles(p,colors,sizes,scene);city.material.blending=THREE.NormalBlending;city.renderOrder=-11;city.material.uniforms.gain.value=.65;city.material.uniforms.energyPreserve.value=1;city.material.uniforms.activity.value=.2;
 const lines=[];for(const [a,kind] of [[Float32Array.from(filtered),'building'],[road,'road'],[water,'water']]){const line=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(a,3)),lineMaterial(kind));line.renderOrder=-10;scene.add(line);lines.push({line,kind});}
 // Ordinary PULSE buildings get sparse low-energy glints, never a white city-wide shell.
 const gp=[],gc=[],gs=[];for(let i=0;i<n;i+=31){if(covers(p[i*3],p[i*3+2]))continue;gp.push(p[i*3],p[i*3+1],p[i*3+2]);gc.push(.22,.39,.58);gs.push(.8);}
 const glints=particles(gp,gc,gs,pulse);glints.material.blending=THREE.NormalBlending;glints.renderOrder=-8;glints.material.uniforms.gain.value=.10;glints.material.uniforms.energyPreserve.value=1;
 return {rawRoadPositions:road,rawBuildingPositions:p,update(h,pulseOn,activity){updateBodies();city.material.uniforms.time.value=0;glints.material.uniforms.time.value=h*.5;glints.material.uniforms.activity.value=activity;for(const {line,kind} of lines)if(kind==='water')line.material.uniforms.gain.value=pulseOn?.48:.30;}};
}

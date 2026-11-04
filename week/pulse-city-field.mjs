import * as THREE from 'three';
import {CITY_FADE_GLSL,CITY_FADE_UNIFORMS} from './horizon-field.mjs';

const hash=n=>{let x=Math.imul(n+17,1597334677);x=Math.imul(x^(x>>>16),2246822519);return ((x^(x>>>13))>>>0)/4294967296;};
// Sparse source-surface glints express authored public activity. They are not
// people counts or devices; source geometry is never moved or fabricated.
export function makePulseCityField(parent,source){
 const indices=[];for(let i=0;i<source.length/3;i+=4)indices.push(i);
 const stride=Math.max(1,Math.ceil(indices.length/85000)),p=[],seeds=[],radii=[];
 for(let k=0;k<indices.length;k+=stride){const i=indices[k];p.push(source[i*3],source[i*3+1]+.16,source[i*3+2]);seeds.push(hash(i));radii.push(hash(i+731));}
 const geo=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(p,3)).setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1)).setAttribute('radius',new THREE.Float32BufferAttribute(radii,1));
 const uniforms={...CITY_FADE_UNIFORMS,hour:{value:0},activity:{value:.5},gain:{value:1},viewportHeight:{value:1080}};
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,uniforms,
 vertexShader:CITY_FADE_GLSL+`attribute float seed,radius;uniform float hour,activity,gain,viewportHeight;varying float a,warm,star;void main(){
 vec4 w=modelMatrix*vec4(position,1.);vec4 v=viewMatrix*w;gl_Position=projectionMatrix*v;
 float local=.5+.5*sin(w.x*.035+w.z*.047+floor(hour/24.)*.9);float load=clamp(activity*(.55+.45*local),0.,1.);
 float near=1.-smoothstep(220.,1800.,-v.z);float alive=1.-smoothstep(.26+load*.44,.31+load*.44,seed);
 warm=step(.68,fract(seed*37.719+radius*2.331));star=step(.985,radius);float twinkle=.68+.32*sin(hour*2.8+seed*127.+w.x*.09);
 a=alive*gain*cityFade(w.xz)*(.55+.60*load)*twinkle*1.8;
 float size=(radius>.985?20.:radius>.82?12.:5.)*(viewportHeight/1080.);
 gl_PointSize=clamp(size*(.45+.55*near)*(1.+star),1.4,20.);a*=.55+.45*near;
 }`,fragmentShader:`varying float a,warm,star;void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=length(q);if(r>1.)discard;
 vec3 col=mix(vec3(.18,.50,1.),vec3(1.,.25,.045),warm);float core=exp(-r*r*13.);col=mix(col,vec3(.84,.91,1.),core*mix(.48,.28,warm));
 float glow=exp(-r*r*5.)*1.6+exp(-r*r*1.6)*.10;
 float flare=star*(exp(-abs(q.x)*45.)*exp(-abs(q.y)*4.)+exp(-abs(q.y)*45.)*exp(-abs(q.x)*4.))*.3;
 gl_FragColor=vec4(col,a*(glow+flare));}`});
 const points=new THREE.Points(geo,mat);points.frustumCulled=false;points.renderOrder=3;parent.add(points);
 const limit=18000,local=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(limit*3),3)).setAttribute('seed',new THREE.BufferAttribute(new Float32Array(limit),1)).setAttribute('radius',new THREE.BufferAttribute(new Float32Array(limit),1));
 const nearPoints=new THREE.Points(local,mat);nearPoints.frustumCulled=false;nearPoints.renderOrder=3;local.setDrawRange(0,0);parent.add(nearPoints);
 let previousX=Infinity,previousZ=Infinity,previousScale=0;
 return {points,count:p.length/3,update(hour,activity,gain,viewportHeight){
  uniforms.hour.value=hour;uniforms.activity.value=activity;uniforms.gain.value=gain;uniforms.viewportHeight.value=viewportHeight;
  const {x,y:z}=CITY_FADE_UNIFORMS.cityFocus.value,s=CITY_FADE_UNIFORMS.cityScale.value;
  if(Math.hypot(x-previousX,z-previousZ)<6*s&&Math.abs(s-previousScale)<.1*s)return;
  previousX=x;previousZ=z;previousScale=s;
  if(s>4.2){local.setDrawRange(0,0);return;}
  const candidates=[];for(let i=0;i<source.length;i+=9)if(Math.abs(source[i]-x)<95*s&&Math.abs(source[i+2]-z)<95*s)candidates.push(i);
  const count=Math.min(limit,candidates.length);
  for(let k=0;k<count;k++){const i=candidates[Math.floor(k*candidates.length/count)];local.attributes.position.setXYZ(k,source[i],source[i+1]+.25,source[i+2]);local.attributes.seed.setX(k,hash(i));local.attributes.radius.setX(k,hash(i+731));}
  for(const key of ['position','seed','radius'])local.attributes[key].needsUpdate=true;local.setDrawRange(0,count);
 }};
}

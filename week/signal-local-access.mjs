import * as THREE from 'three';
import {CITY_FADE_GLSL,CITY_FADE_UNIFORMS} from './horizon-field.mjs';
import {signalHash} from './signal-demand.mjs';
const starLimit=1200,traceLimit=220,segments=12;
const envelope='float localEnvelope(vec2 w){return exp(-1.4*pow(length((w-cityFocus)/(vec2(78.,88.)*cityScale)),3.));}';
/** Readable ART access samples on source vertices; not measured equipment or physical fibre paths. */
export function makeLocalSignalAccess(parent,source,regions,regionIds){
 const uniforms={...CITY_FADE_UNIFORMS,time:{value:0},gain:{value:1}};
 const sp=new Float32Array(starLimit*3),sc=new Float32Array(starLimit*3),ss=new Float32Array(starLimit),phase=new Float32Array(starLimit),starNodes=new Uint16Array(starLimit),starWarm=new Uint8Array(starLimit),threshold=new Float32Array(starLimit),baseSize=new Float32Array(starLimit);
 const starGeo=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(sp,3)).setAttribute('color',new THREE.BufferAttribute(sc,3)).setAttribute('size',new THREE.BufferAttribute(ss,1)).setAttribute('phase',new THREE.BufferAttribute(phase,1));
 const starMaterial=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,uniforms,vertexShader:CITY_FADE_GLSL+envelope+'attribute float size,phase;uniform float time,gain;varying vec3 c;varying float a;void main(){vec2 w=(modelMatrix*vec4(position,1.)).xz;c=color;a=gain*cityFade(w)*localEnvelope(w)*step(.1,size)*(.86+.14*sin(time*1.8+phase));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size;}',fragmentShader:'varying vec3 c;varying float a;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float core=exp(-r*r*8.)*2.4+exp(-r*r*1.6)*.16;vec3 glow=mix(c,vec3(1.,.94,.87),.64*exp(-r*r*45.));gl_FragColor=vec4(glow,a*core);}'});
 const stars=new THREE.Points(starGeo,starMaterial);stars.frustumCulled=false;stars.renderOrder=5;starGeo.setDrawRange(0,0);parent.add(stars);
 const vertices=traceLimit*segments*2,tp=new Float32Array(vertices*3),ta=new Float32Array(vertices),tf=new Float32Array(vertices*3),tl=new Float32Array(vertices),traceNodes=new Uint16Array(traceLimit),traceWarm=new Uint8Array(traceLimit),traceSeed=new Float32Array(traceLimit),traceThreshold=new Float32Array(traceLimit);
 const traceGeo=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(tp,3)).setAttribute('along',new THREE.BufferAttribute(ta,1)).setAttribute('flow',new THREE.BufferAttribute(tf,3)).setAttribute('load',new THREE.BufferAttribute(tl,1));
 const traceMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,uniforms,vertexShader:'attribute float along,load;attribute vec3 flow;varying float v,power,warm,rate,offset;varying vec2 w;void main(){v=along;power=load;warm=flow.z;rate=flow.x;offset=flow.y;w=(modelMatrix*vec4(position,1.)).xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:CITY_FADE_GLSL+envelope+'uniform float time,gain;varying float v,power,warm,rate,offset;varying vec2 w;void main(){if(power<.03)discard;float d=fract(time*rate+offset-v);float head=exp(-d*7.);vec3 c=mix(vec3(.58,.47,1.),vec3(1.,.42,.075),warm);float a=(.012+head*2.8)*power;gl_FragColor=vec4(c,a*gain*cityFade(w)*localEnvelope(w));}'});
 const traces=new THREE.LineSegments(traceGeo,traceMaterial);traces.frustumCulled=false;traces.renderOrder=4;traceGeo.setDrawRange(0,0);parent.add(traces);
 let starCount=0,traceCount=0,revision=0,lastBucket=-1;
 return {clear(){starCount=traceCount=0;starGeo.setDrawRange(0,0);traceGeo.setDrawRange(0,0);revision++;},rebuild(candidates){
  starCount=Math.min(starLimit,candidates.length);traceCount=0;
  for(let j=0;j<starCount;j++){
   const i=candidates[Math.floor(j*candidates.length/starCount)],x=source[i],z=source[i+2];let nearest=0,best=Infinity;
   for(let k=0;k<regions.length;k++){const r=regions[k],d=(x-r.x*.02)**2+(z+r.y*.02)**2;if(d<best){best=d;nearest=k;}}
   const seed=signalHash('access-star:'+i),profile=regions[nearest].serviceProfile;starNodes[j]=regionIds[nearest];starWarm[j]=seed<(profile==='industrial'?.36:.50)?1:0;threshold[j]=signalHash('access-active:'+i);baseSize[j]=12+signalHash('access-size:'+i)*8;phase[j]=seed*Math.PI*2;sp.set([x,source[i+1]+1.35,z],j*3);
  }
  for(let j=0;j<starCount&&traceCount<traceLimit;j+=5){
   const x=sp[j*3],z=sp[j*3+2],seed=signalHash('access-pair:'+j),wanted=3+seed*13,angle=signalHash('access-angle:'+j)*Math.PI*2,tx=x+Math.cos(angle)*wanted,tz=z+Math.sin(angle)*wanted;let selected=-1,best=Infinity;
   for(let k=0;k<starCount;k++){const dx=sp[k*3]-x,dz=sp[k*3+2]-z,d2=dx*dx+dz*dz;if(d2<.35||d2>23*23)continue;const score=(sp[k*3]-tx)**2+(sp[k*3+2]-tz)**2;if(score<best){best=score;selected=k;}}
   if(selected<0)continue;const b=selected*3,idx=traceCount,rate=.14+signalHash('access-rate:'+j)*.29,lift=.35+seed*.65;traceNodes[idx]=starNodes[j];traceWarm[idx]=starWarm[j];traceSeed[idx]=seed;traceThreshold[idx]=signalHash('access-trace-active:'+j);
   for(let k=0;k<segments;k++)for(let side=0;side<2;side++){const t=(k+side)/segments,v=(idx*segments+k)*2+side;tp.set([x+(sp[b]-x)*t,sp[j*3+1]+(sp[b+1]-sp[j*3+1])*t+Math.sin(t*Math.PI)*lift,z+(sp[b+2]-z)*t],v*3);ta[v]=t;tf.set([rate,seed,starWarm[j]],v*3);}
   traceCount++;
  }
  for(const key of ['position','phase'])starGeo.attributes[key].needsUpdate=true;
  for(const key of ['position','along','flow'])traceGeo.attributes[key].needsUpdate=true;
  starGeo.setDrawRange(0,starCount);traceGeo.setDrawRange(0,traceCount*segments*2);revision++;
 },update(state,h,gain,detailGain){
  uniforms.time.value=h;uniforms.gain.value=gain*detailGain;const key=Math.floor(h*8)+':'+revision;
  if(key===lastBucket)return;lastBucket=key;
  for(let i=0;i<starCount;i++){const n=state.nodes[starNodes[i]],warm=starWarm[i],value=warm?(n?.publicActivity??n?.publicLoad??.2):(n?.machineActivity??n?.machineLoad??.2),light=.28+.72*value;ss[i]=threshold[i]<.04+.96*value?baseSize[i]*(.65+.55*value):0;sc.set(warm?[light,light*.40,light*.065]:[light*.52,light*.40,light],i*3);}
  for(let i=0;i<traceCount;i++){
   const n=state.nodes[traceNodes[i]],warm=traceWarm[i],value=warm?(n?.publicActivity??n?.publicLoad??.2):(n?.machineActivity??n?.machineLoad??.2),clock=(warm?n?.publicClock:n?.machineClock)??h*.2,rate=((warm?n?.publicRate:n?.machineRate)??.2)*(.7+traceSeed[i]*.8),phase=clock*(.7+traceSeed[i]*.8)+traceSeed[i]-h*rate;
   const gate=Math.max(0,Math.min(1,(value-traceThreshold[i]+.18)*4));tl.fill(value*gate,i*segments*2,(i+1)*segments*2);
   for(let v=i*segments*2;v<(i+1)*segments*2;v++){tf[v*3]=rate;tf[v*3+1]=phase;}
  }
  starGeo.attributes.size.needsUpdate=starGeo.attributes.color.needsUpdate=traceGeo.attributes.load.needsUpdate=traceGeo.attributes.flow.needsUpdate=true;
 }};
}

import * as THREE from 'three';

// Art-directed scalar fields, not measured water level or humidity.
let riverSamples=[];
export function moistureAt(x,z){
  let d=1e6;for(const p of riverSamples)d=Math.min(d,(x-p[0])**2+(z-p[1])**2);
  const river=Math.exp(-d/160),coast=.7*Math.exp(-((x-100)**2+(z+65)**2)/3600);
  const air=.52*Math.exp(-((x+52)**2+(z+20)**2)/950)+.38*Math.exp(-((x-20)**2+(z-62)**2)/1300);
  return Math.min(1,river*.7+coast+air);
}
export function decorateAtmosphere(geometry){const p=geometry.attributes.position,wet=[];for(let i=0;i<p.count;i++)wet.push(moistureAt(p.getX(i),p.getZ(i)));geometry.setAttribute('moisture',new THREE.Float32BufferAttribute(wet,1));}
export const atmosphereVertex=`attribute float moisture;varying float vLight,vWet;uniform float uTime,uNature,uCloud,uTide,uHumidity,uWind;
void main(){vec3 p=position;float r=length(p.xz),t=uTime*(.7+uWind);float w=sin(p.x*.045+t*.13)*cos(p.z*.027-t*.10)*4.+sin(p.x*.11+p.z*.05+t*.2)*1.6+sin(p.x*.28+p.z*.12+t*.31)*.6+sin(p.x*.55-p.z*.23+t*.17)*.24;
p.y=(w+moisture*3.+uTide)*(0.12+uNature*.88)-.7;p.x+=sin(p.z*.03+t*.08)*uNature*2.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);vWet=clamp(moisture*(.72+uHumidity*.5),0.,1.);vLight=(.13+uNature*.62)*(1.-uCloud)*clamp(1.-r/400.,.14,1.);}`;
export const atmosphereFragment=`varying float vLight,vWet;uniform float uNature;void main(){vec3 col=mix(vec3(.19,.28,.53),vec3(.08,.62,1.15),pow(vWet,1.5)*uNature);gl_FragColor=vec4(col,vLight*(.65+vWet*.8));}`;

export function createLayerEffects(path){
  riverSamples=path.filter((_,i)=>i%6===0);
  const river=new THREE.Group(),contours=new THREE.Group(),signal=new THREE.Group();
  const curve=new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(p[0],0,p[1])));
  const p=[],uv=[],index=[],lineIndex=[];
  const lanes=36,steps=500;
  for(let j=0;j<=lanes;j++)for(let i=0;i<=steps;i++){
    const s=i/steps,v=j/lanes*2-1,q=curve.getPointAt(s),t=curve.getTangentAt(s);
    p.push(q.x-t.z*v*1.9,.5,q.z+t.x*v*1.9);uv.push(s,v);
    const k=j*(steps+1)+i;if(i<steps)lineIndex.push(k,k+1);
    if(i<steps&&j<lanes){const b=k+steps+1;index.push(k,b,k+1,k+1,b,b+1);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);
  const uniforms={uTime:{value:0},uOpacity:{value:1},uTide:{value:.5}};
  const vertex=`uniform float uTime,uTide;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.y+=(uTide-.5)*.5+.18*sin(uv.x*82.-uTime*.38+uv.y*3.)+.08*cos(uv.x*160.+uv.y*5.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
  const mat=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`uniform float uTime,uOpacity;varying vec2 vUv;void main(){float edge=pow(max(0.,1.-vUv.y*vUv.y),.5);float flow=pow(.5+.5*sin(vUv.x*110.-uTime*.8+vUv.y*8.),4.);vec3 col=mix(vec3(.02,.16,.45),vec3(.06,.68,1.),flow);gl_FragColor=vec4(col,edge*.32*uOpacity);}`,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const surface=new THREE.Mesh(geo,mat);surface.frustumCulled=false;river.add(surface);
  const lg=geo.clone();lg.setIndex(lineIndex);
  const lm=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`uniform float uTime,uOpacity;varying vec2 vUv;void main(){float stream=pow(.5+.5*sin(vUv.x*90.-uTime*.6+vUv.y*6.),7.);float edge=pow(max(0.,1.-vUv.y*vUv.y),.5);gl_FragColor=vec4(mix(vec3(.06,.30,.7),vec3(.24,.86,1.),stream),edge*(.22+.35*stream)*uOpacity);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const threads=new THREE.LineSegments(lg,lm);threads.frustumCulled=false;river.add(threads);

  // Marching squares on an illustrative relative water-potential field, separate from humidity color.
  const potential=(x,z)=>.7*Math.exp(-((x+42)**2/2400+(z+8)**2/1300))+.88*Math.exp(-((x-53)**2/3100+(z+55)**2/2100))+.42*Math.exp(-((x-10)**2/2500+(z-66)**2/1800))+.04*Math.sin(x*.058+z*.027);
  const cp=[],cc=[];const step=3;
  for(let level=.12;level<1.1;level+=.042)for(let x=-160;x<170;x+=step)for(let z=-150;z<155;z+=step){
    const corners=[[x,z],[x+step,z],[x+step,z+step],[x,z+step]],values=corners.map(([a,b])=>potential(a,b)),cross=[];
    for(let e=0;e<4;e++){const n=(e+1)%4,a=values[e],b=values[n];if((a<level)!==(b<level)){const t=(level-a)/(b-a);cross.push([THREE.MathUtils.lerp(corners[e][0],corners[n][0],t),THREE.MathUtils.lerp(corners[e][1],corners[n][1],t)]);}}
    for(let k=0;k+1<cross.length;k+=2)for(const q of [cross[k],cross[k+1]]){cp.push(q[0],1+level*8,q[1]);const wet=moistureAt(...q);cc.push(.11,.28+wet*.30,.68+wet*.32);}
  }
  const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));cg.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
  const cm=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});contours.add(new THREE.LineSegments(cg,cm));
  const starts=[],ends=[],phases=[];
  for(const [ax,az,bx,bz]of [[-85,65,65,-70],[-90,-55,80,55],[-45,90,35,-75]])for(let i=0;i<36;i++){starts.push(ax,10,az);ends.push(bx,10,bz);phases.push(i/36);}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(starts,3));sg.setAttribute('destination',new THREE.Float32BufferAttribute(ends,3));sg.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));
  const sm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uAlpha:{value:0}},vertexShader:`attribute vec3 destination;attribute float phase;uniform float uTime;varying float vFade;void main(){float f=fract(phase+uTime*.045);vec3 p=mix(position,destination,f);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(500./max(8.,-mv.z),2.,13.);vFade=sin(f*3.14159);}`,fragmentShader:`uniform float uAlpha;varying float vFade;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.22,.8,1.,pow(1.-r,2.)*vFade*uAlpha);}`});
  const packets=new THREE.Points(sg,sm);packets.frustumCulled=false;signal.add(packets);
  return{river,contours,signal,update(t,n,c,data){uniforms.uTime.value=t;uniforms.uOpacity.value=Math.max(0,1-n-c);uniforms.uTide.value=data.tide;river.visible=uniforms.uOpacity.value>.01;cm.opacity=n*(.30+data.humidity*.08);contours.position.y=(data.tide-.45)*2;contours.visible=n>.01;sm.uniforms.uTime.value=t;sm.uniforms.uAlpha.value=c*(.5+data.stream);signal.visible=c>.01;}};
}

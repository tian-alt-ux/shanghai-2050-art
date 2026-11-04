import {createParticleBuilder} from './landmark-particle-builder.mjs';

/** Approved landmark interpretations, 2026-11-02.
 * Real silhouettes and the user's 2050 place images guide recognition. Sections,
 * individual component dimensions and layouts are authored, not surveyed meshes.
 */
export const MODERN_FORM_SPECS=Object.freeze({
 'grand-opera':{heightM:45.5,kind:'continuous-fan-roof-and-spiral-public-stair',evidence:'architect-and-completed-photo / authored-fan-surface-and-components',reference:'上海大歌剧院.png',sources:['https://www.snohetta.com/projects/shanghai-grand-opera-house','https://www.sbp.de/en/project/shanghai-grand-opera-house/']},
 'thousand-trees':{heightM:65,kind:'asymmetric-connected-terraces-and-planter-columns',evidence:'architect-described-typology / authored-first-phase-mountain-motif',reference:'天安千树.png',sources:['https://heatherwick.com/projects/public-space/1000trees/']},
 'west-bund-dream-center':{heightM:43,kind:'industrial-silo-cluster-and-public-roof-deck',evidence:'official-completed-silo-photo / authored-place-composition',reference:'西岸.png',sources:['https://www.xuhui.gov.cn/gzfw_tpdt/20250506/556391.html']},
 'yangpu-riverside':{heightM:44,kind:'industrial-riverbank-hall-gantry-and-wharf',evidence:'user-approved-2050-riverside-composition / not-certified-individual-factory',reference:'杨浦滨江 日.png / 杨浦滨江 夜.png',sources:['https://whlyj.sh.gov.cn/gqfc/20220321/65f8e3ccf8584dfb933a644925f88e8b.html']},
 'hongqiao-station':{heightM:40,kind:'wide-station-hall-platforms-and-parallel-tracks',evidence:'official-aerial-and-completed-facade / authored-span-and-roof-sections',reference:'虹桥 日.png / 虹桥 夜.png',sources:['https://www.shhqcbd.gov.cn/ywdt/mtjj/532520545529925.html']},
 'shanghai-tower':{heightM:632,kind:'rounded-triangle-twist-and-asymmetric-crown',evidence:'published-height-and-120-degree-twist / authored-rounded-section-and-crown',reference:'上海中心 日.png / 上海中心 夜.png',sources:['https://www.gensler.com/projects/shanghai-tower','https://global.ctbuh.org/resources/papers/download/1006-the-parametric-design-of-shanghai-towers-form-and-facade.pdf']}
});

// Radius of a convex, genuinely rounded triangular section. A triangular core
// plus a circular offset gives rounded vertices without the concave three-lobed
// outline caused by simply increasing the amplitude of a cos(3a) radius.
const TAU=Math.PI*2,sectionSamples=720;
const sectionRadius=Float64Array.from({length:sectionSamples+1},(_,i)=>{
 const angle=i/sectionSamples*TAU;let radius=Infinity;
 for(let n=0;n<120;n++){
  const normal=n/120*TAU,dot=Math.cos(angle-normal);if(dot<=0)continue;
  let support=-Infinity;for(let k=0;k<3;k++)support=Math.max(support,32*Math.cos(normal-k*TAU/3));
  radius=Math.min(radius,(support+14)/dot);
 }
 return radius;
});
export function revisedTowerSection(t,a){
 const normal=((a%TAU)+TAU)%TAU,index=normal/TAU*sectionSamples,lo=Math.floor(index),f=index-lo;
 const radius=(sectionRadius[lo]*(1-f)+sectionRadius[lo+1]*f)*(1-.49*t),twist=t*TAU/3;
 return [Math.cos(a+twist)*radius,t*632,Math.sin(a+twist)*radius];
}

function modernTower(b){
 const crown=(t,a)=>{const p=revisedTowerSection(t,a);p[1]-=14*(1+Math.cos(a-Math.PI*.2))*.5*Math.pow(t,14);return p;};
 b.surface((u,v)=>crown(v,u*TAU),84,205,.27,.72);
 for(let k=0;k<12;k++)b.stroke(t=>crown(t,k*TAU/12),230,k%4===0?.87:.61,k%4===0?.92:.78);
 // A few structural bands support the long continuous facade; no bright disc stack.
 for(const t of [.12,.29,.47,.65,.82,.965])b.stroke(u=>crown(t,u*TAU),112,.39,.7);
 b.stroke(u=>crown(1,u*TAU),180,.86,.9);
 b.stroke(u=>{const p=crown(1,u*TAU);return[p[0]*.77,p[1]-6,p[2]*.77];},150,.42,.68);
 for(let k=0;k<9;k++){
  const a=k*TAU/9,p=crown(1,a),q=crown(1,a+TAU/9);
  b.line([p[0]*.77,p[1]-6,p[2]*.77],q,.46,.72,1.1);
 }
 // Explicit highest crown ridge keeps the accepted 632-m source bound exact.
 b.point(...crown(1,Math.PI*1.2),.88,.9);
}

function grandOpera(b){
 // One continuous folded roof surrounds an off-centre spiral opening. The
 // asymmetrical fan perimeter is deliberately not three overlapping rotors.
 const roofPoint=(u,v)=>{
  const a=u*TAU,outer=1+.12*Math.cos(a-.3)-.065*Math.cos(a*2+.8);
  const ix=-25+Math.cos(a)*20,iz=-8+Math.sin(a)*17;
  const ox=Math.cos(a)*119*outer,oz=Math.sin(a)*92*outer;
  return[ix+(ox-ix)*v,24+6*v+3*Math.sin(a-.6)*v+.8*Math.cos(a*48)*v*v,iz+(oz-iz)*v];
 };
 b.surface(roofPoint,210,31,.24,.69);
 b.stroke(t=>roofPoint(t,1),360,.82,.9);
 b.stroke(t=>roofPoint(t,0),180,.86,.9);
 for(let k=0;k<48;k++)b.stroke(t=>roofPoint(k/48,t),66,.53,.76);
 // Glass skirt: sparse vertical rhythm with a substantially quieter skin.
 for(let k=0;k<96;k++){
  const p=roofPoint(k/96,.91);b.line([p[0],1,p[2]],[p[0],p[1]-.8,p[2]],.31,.64,1.25);
 }
 for(const y of [1,9,17])b.stroke(t=>{const p=roofPoint(t,.91);return[p[0],y,p[2]];},250,.27,.62);
 // Two broad public stair ribbons climb into the opening, with actual width
 // and occasional stair treads rather than decorative free-floating spirals.
 for(const phase of [0,Math.PI]){
  const stair=(u,v)=>{const a=phase-1.7+u*Math.PI*1.32,r=21+u*20+v*5;return[-25+Math.cos(a)*r,1+u*27,-8+Math.sin(a)*r*.84];};
  b.surface(stair,112,5,.3,.68);
  for(const side of [0,1])b.stroke(t=>stair(t,side),190,.71,.82);
  for(let k=0;k<50;k++)b.line(stair(k/50,0),stair(k/50,1),.37,.66,.75);
 }
 // Stage houses sit toward the inland/back edge, subordinate to the roof.
 for(const [x,z,w,d,h] of [[-61,-29,27,31,45.5],[-12,-44,31,28,42],[39,-33,24,29,38]]){
  b.box(x,z,w,d,h-27,27,.15);
  b.surface((u,v)=>[x+(u-.5)*w,h,z+(v-.5)*d],18,16,.19,.64);
 }
}

function thousandTrees(b){
 const width=9,depth=5,step=17.5;
 const height=(ix,iz)=>{if(ix<0||ix>=width||iz<0||iz>=depth)return 0;return 8+Math.max(1,5-Math.floor(Math.abs(ix-5)/2)-(4-iz))*8.5;};
 const face=(x,z,w,d,y0,y1,side)=>{
  const along=side<2?w:d;
  b.surface((u,v)=>side===0?[x+(u-.5)*w,y0+(y1-y0)*v,z-d/2]:side===1?[x+(u-.5)*w,y0+(y1-y0)*v,z+d/2]:side===2?[x-w/2,y0+(y1-y0)*v,z+(u-.5)*d]:[x+w/2,y0+(y1-y0)*v,z+(u-.5)*d],Math.max(8,Math.ceil(along/2)),Math.max(4,Math.ceil((y1-y0)/2)),.17,.62);
 };
 for(let iz=0;iz<depth;iz++)for(let ix=0;ix<width;ix++){
  const x=(ix-4)*step,z=(2-iz)*step,h=height(ix,iz);
  b.surface((u,v)=>[x+(u-.5)*step,h,z+(v-.5)*step],7,7,.19,.63);
  const ns=[height(ix,iz+1),height(ix,iz-1),height(ix-1,iz),height(ix+1,iz)];
  ns.forEach((n,side)=>{if(n<h)face(x,z,step,step,n,h,side);});
  // Terraces join, sharing their edges rather than separate outlined cube cages.
  if(ns[1]!==h)b.line([x-step/2,h,z+step/2],[x+step/2,h,z+step/2],.57,.77,.8);
  if(ns[0]!==h)b.line([x-step/2,h,z-step/2],[x+step/2,h,z-step/2],.49,.74,.9);
  if(ns[3]!==h)b.line([x+step/2,h,z-step/2],[x+step/2,h,z+step/2],.51,.75,.85);
 }
 // Wide column-top planters, stems and branched irregular crowns are separate
 // structural layers. Their layout follows the terrace grid, not ball trees on boxes.
 for(let iz=0;iz<=depth;iz++)for(let ix=0;ix<=width;ix++){
  const x=(ix-4.5)*step,z=(2.5-iz)*step;
  const h=Math.max(height(ix-1,iz-1),height(ix,iz-1),height(ix-1,iz),height(ix,iz));
  const base=Math.max(0,h-9),stemH=h+1.5-base;
  b.surface((u,v)=>[x+Math.cos(u*TAU)*.72,base+v*stemH,z+Math.sin(u*TAU)*.72],8,4,.14,.63);
  b.surface((u,v)=>{const a=u*TAU,r=1.1+v*2;return[x+Math.cos(a)*r,h+1.3+v*2.5,z+Math.sin(a)*r];},12,4,.28,.68);
  b.ring(x,h+3.8,z,3.1,3.1,.69,.82,30);
  const treeY=h+4.1,lean=(ix%3-1)*.8;
  b.line([x,treeY,z],[x+lean,treeY+3.7,z+.4],.45,.72,.5);
  for(let k=0;k<3;k++){
   const a=k*TAU/3+ix*.8,tip=[x+Math.cos(a)*2.6,treeY+4.2+(k%2)*1.5,z+Math.sin(a)*2.6];
   b.line([x+lean,treeY+2.4,z+.4],tip,.34,.66,.75);
   // Scattered branched foliage avoids three identical spherical lollipops.
   for(let n=0;n<20;n++){
    const az=b.random()*TAU,cy=b.random()*2-1,r=Math.cbrt(b.random()),s=Math.sqrt(1-cy*cy),rr=2.1+(k%2)*.5;
    b.point(tip[0]+Math.cos(az)*s*rr*r,tip[1]+.8+cy*rr*.7*r,tip[2]+Math.sin(az)*s*rr*r,.18,.62);
   }
  }
 }
 // One cut-back facade receives horizontal bands, giving the mountain a legible back.
 for(const y of [8,16.5,25,33.5])b.line([-78.75,y,-43.75],[78.75,y,-43.75],.23,.62,1.5);
}

function industrialHall(b,x,z,length,depth,height,archWindows=false){
 const front=z+depth/2;
 // Sparse long walls, with openings kept dark when the historic arch rhythm is used.
 b.surface((u,v)=>[x+(u-.5)*length,v*height,z-depth/2],Math.ceil(length/1.8),Math.ceil(height/1.6),.16,.61);
 for(let u=0;u<=Math.ceil(length/1.8);u++)for(let v=0;v<=Math.ceil(height/1.6);v++){
  const xx=x+(u/Math.ceil(length/1.8)-.5)*length,yy=v/Math.ceil(height/1.6)*height;
  const bay=length/8,k=Math.min(7,Math.floor((xx-x+length/2)/bay)),cx=x-length/2+(k+.5)*bay,r=Math.min(4.6,length/22),dx=xx-cx,shoulder=height-7;
  const opening=archWindows&&Math.abs(dx)<r&&yy>=3&&yy<shoulder+Math.sqrt(r*r-dx*dx);
  if(!opening&&b.random()>.04)b.point(xx,yy,front,.16,.61);
 }
 for(const end of [-1,1])b.surface((u,v)=>[x+end*length/2,v*height,z+(u-.5)*depth],Math.ceil(depth/1.7),Math.ceil(height/1.6),.16,.61);
 const roof=(u,v)=>[x+(u-.5)*(length+3),height+4*(1-Math.abs(v*2-1)),z+(v-.5)*(depth+3)];
 b.surface(roof,Math.ceil(length/1.7),16,.24,.68);
 for(const v of [0,.5,1])b.stroke(t=>roof(t,v),Math.ceil(length/.65),v===.5?.7:.61,.8);
 for(const u of [0,1])b.stroke(t=>roof(u,t),50,.7,.82);
 for(let k=0;k<=8;k++){
  const xx=x-length/2+k*length/8;b.line([xx,0,front],[xx,height,front],.5,.76,.7);
 }
 b.line([x-length/2,2,front],[x+length/2,2,front],.39,.7,.85);
 b.line([x-length/2,height,front],[x+length/2,height,front],.64,.8,.75);
 if(archWindows)for(let k=0;k<8;k++){
  const cx=x-length/2+(k+.5)*length/8,r=Math.min(4.6,length/22),bottom=3,shoulder=height-7;
  b.line([cx-r,bottom,front+.1],[cx-r,shoulder,front+.1],.6,.79,.55);
  b.line([cx+r,bottom,front+.1],[cx+r,shoulder,front+.1],.6,.79,.55);
  b.stroke(t=>[cx-Math.cos(t*Math.PI)*r,shoulder+Math.sin(t*Math.PI)*r,front+.1],33,.73,.82);
  b.line([cx,bottom,front+.1],[cx,shoulder+r,front+.1],.35,.65,.8);
  b.line([cx-r,bottom+4,front+.1],[cx+r,bottom+4,front+.1],.3,.63,.8);
 }
}

function westBund(b){
 // Clustered cement silos retain cylindrical mass; no inherited oil-tank park
 // or duplicate generic Yangpu crane is substituted for this place.
 for(const [x,z,r] of [[-41,-6,9],[-23,-6,9],[-5,-6,9]]){
  b.cylinder(x,z,r,25,14,.25,54);
  b.surface((u,v)=>{const a=u*TAU,rr=3+v*(r-3);return[x+Math.cos(a)*rr,8+v*6,z+Math.sin(a)*rr];},38,9,.2,.66);
  for(const dz of [-5,5])for(const dx of [-5,5])b.line([x+dx,0,z+dz],[x+dx,12,z+dz],.49,.77,.65);
  for(let k=0;k<10;k++){const a=k*TAU/10;b.line([x+Math.cos(a)*r,14,z+Math.sin(a)*r],[x+Math.cos(a)*r,39,z+Math.sin(a)*r],.33,.68,1.1);}
 }
 // An elongated rooftop public deck and its railing bind the three silos.
 b.ring(-23,40.5,-6,31,16,.84,.9,230);b.ring(-23,39.2,-6,31,16,.53,.77,210);
 b.ring(-23,42,-6,31,16,.65,.8,210);
 for(let k=0;k<42;k++){const a=k*TAU/42;b.line([-23+Math.cos(a)*31,40.5,-6+Math.sin(a)*16],[-23+Math.cos(a)*31,42,-6+Math.sin(a)*16],.4,.66,.5);}
 for(let k=0;k<9;k++){const z=-18+k*3;b.line([-40,40.5,z],[-5,40.5,z],.15,.59,1.7);}
 industrialHall(b,39,-4,63,25,14,true);
 // External switchback stairs: different from the crane-shaped Yangpu motif.
 for(let flight=0;flight<5;flight++){
  const y=flight*8,xa=flight%2?-63:-50,xb=flight%2?-50:-63,z=9;
  for(const dz of [-2,2]){b.line([xa,y,z+dz],[xb,y+8,z+dz],.65,.8,.7);b.line([xa,y+1.1,z+dz],[xb,y+9.1,z+dz],.43,.69,.8);}
  for(let k=0;k<14;k++){const t=k/13;b.line([xa+(xb-xa)*t,y+8*t,z-2],[xa+(xb-xa)*t,y+8*t,z+2],.35,.68,.65);}
 }
 // Visible structure and a short upper gallery attach the stair to the public
 // roof. The zigzag is a supported circulation route, not a floating light motif.
 for(const x of [-63,-50])for(const z of [7,11])b.line([x,0,z],[x,40.5,z],.28,.67,1.25);
 for(const z of [7,11]){
  b.line([-63,40,z],[-39,40.5,z-5],.62,.79,.75);
  b.line([-63,41.2,z],[-39,41.7,z-5],.38,.69,.85);
 }
 b.line([-63,40,7],[-63,40,11],.5,.72,.7);
 b.line([-39,40.5,2],[-39,40.5,6],.48,.72,.7);
 for(const z of [25,30,35])b.line([-76,1,z],[78,1,z],z===30?.22:.48,.7,1);
 for(let k=-7;k<=7;k++)b.line([k*10,1,35],[k*10,4,35],.31,.65,.6);
}

function yangpu(b){
 industrialHall(b,-18,-19,118,29,20,true);
 // Re-used industrial riverfront: tall portal crane, bracing and hoist over
 // a long wharf. It remains a place composition, not a certified exact factory.
 const legs=[];
 for(const x of [16,48])for(const z of [12,39]){
  const top=[x<30?23:41,39,z<25?22:30],base=[x,0,z];legs.push({base,top});
  b.line(base,top,.77,.91,.55);
  b.line([base[0]+1.5,base[1],base[2]],[top[0]+1.5,top[1],top[2]],.49,.77,.65);
 }
 for(const z of [22,30]){
  b.line([6,42,z],[64,42,z],.85,.94,.5);b.line([6,39,z],[64,39,z],.62,.82,.6);
  for(let k=0;k<8;k++){const x=6+k*7.25;b.line([x,39,z],[x+7.25,42,z],.43,.71,.6);}
 }
 for(const x of [6,64])b.line([x,42,22],[x,42,30],.73,.85,.55);
 b.box(36,26,12,12,5,39,.2);
 for(const z of [24.5,27.5])b.line([54,39,z],[54,15,z],.6,.78,.6);
 b.line([50,15,26],[58,15,26],.78,.86,.45);
 for(const x of [16,48])b.polyline([[x,0,12],[x<30?23:41,20,26],[x,0,39]],.45,.73,.7);
 for(const z of [40,46,52])b.line([-85,1,z],[85,1,z],z===46?.2:.56,.74,.8);
 for(let k=-8;k<=8;k++){
  b.line([k*10,1,52],[k*10,4.2,52],.35,.66,.55);
  b.line([k*10,0,39],[k*10,-3,45],.27,.65,.65);
 }
 b.line([-84,4.2,52],[84,4.2,52],.42,.72,.75);
 // Quiet wharf planks and crane rail pairs provide depth without a glowing slab.
 for(let k=-8;k<=8;k++)b.line([k*10,1,40],[k*10,1,52],.16,.58,1.1);
 for(const x of [15,17,47,49])b.line([x,.7,5],[x,.7,52],.3,.65,.85);
}

function hongqiao(b){
 const roof=(u,v)=>{const x=(u-.5)*280,z=(v-.5)*134;return[x,33+5*Math.pow(Math.cos(x/280*Math.PI),2)+1.5*Math.sin(v*Math.PI),z];};
 b.surface(roof,116,32,.22,.67);
 for(const u of [0,1])b.stroke(t=>roof(u,t),150,.71,.83);
 for(const v of [0,1])b.stroke(t=>roof(t,v),260,.77,.88);
 for(let k=0;k<=20;k++)b.stroke(t=>roof(k/20,t),90,k%5===0?.52:.33,.72);
 // Low, wide glass hall volume: the building is no longer only platform roofs.
 for(const z of [-52,52]){
  b.surface((u,v)=>[(u-.5)*247,2+v*29,z],105,14,.14,.61);
  for(let k=-8;k<=8;k++)b.line([k*15,2,z],[k*15,31,z],.43,.72,.8);
  for(const y of [2,12,22,31])b.line([-123.5,y,z],[123.5,y,z],y===31?.58:.31,.7,1.1);
 }
 for(const x of [-123.5,123.5]){
  b.surface((u,v)=>[x,2+v*29,(u-.5)*104],47,16,.14,.61);
  for(let k=-3;k<=3;k++)b.line([x,2,k*15],[x,31,k*15],.38,.69,.8);
 }
 // Entrance overhang and its clear structural columns face the concourse.
 b.surface((u,v)=>[(u-.5)*208,17+v*1.8,-52-v*28],95,9,.23,.66);
 for(const z of [-52,-80])b.line([-104,17,z],[104,17,z],.66,.8,.8);
 for(const x of [-90,-60,-30,0,30,60,90])b.line([x,0,-76],[x,17,-76],.48,.75,.75);
 for(const z of [-94,94]){
  const canopy=(u,v)=>[(u-.5)*418,17.2+1.7*Math.sin(v*Math.PI),z+(v-.5)*17];
  b.surface(canopy,126,7,.2,.64);
  for(const v of [0,.5,1])b.stroke(t=>canopy(t,v),220,.4,.72);
  for(let k=-7;k<=7;k++)b.line([k*27,0,z],[k*27,17.7,z],.29,.65,1);
 }
 for(let rail=-5;rail<=5;rail++)for(const side of [-1,1])b.line([-230,.9,rail*15+side*1.1],[230,.9,rail*15+side*1.1],.25,.65,2.15);
}

export function buildModernForm(id){
 const spec=MODERN_FORM_SPECS[id];if(!spec)return null;
 const b=createParticleBuilder(id);
 switch(id){
  case 'shanghai-tower':modernTower(b);break;
  case 'grand-opera':grandOpera(b);break;
  case 'thousand-trees':thousandTrees(b);break;
  case 'west-bund-dream-center':westBund(b);break;
  case 'yangpu-riverside':yangpu(b);break;
  case 'hongqiao-station':hongqiao(b);break;
 }
 return b.finish(spec);
}

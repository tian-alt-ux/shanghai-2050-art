import {createParticleBuilder} from './landmark-particle-builder.mjs';

// Authored, compact place interpretations. Public descriptions and photographs
// identify the silhouettes, not certified dimensions or cadastral footprints.
export const HERITAGE_FORM_SPECS=Object.freeze({
 'bund':{heightM:82,kind:'customs-clock-hsbc-dome-waterfront-cluster',evidence:'real-facade-reference / authored-place-cluster-not-parcel-survey',reference:'外滩.png',sources:['https://www.shanghai.gov.cn/citywalk/20260625/9dfb6f86b9664e018607b5cc9ec9a53c.html']},
 'jing-an-temple':{heightM:48,kind:'vajrasana-five-stupas-and-double-eaved-courtyard',evidence:'real-photograph-typology / authored-component-proportions',reference:'静安寺.png',sources:['https://jp.xinhuanet.com/20251224/ebc098f639e44e6ebc764a8ddfcef8e2/c.html']},
 'people-square':{heightM:41,kind:'open-civic-square-museum-and-theatre',evidence:'real-place-character / authored-place-composition',reference:'人民广场 日.png / 人民广场 夜.png',sources:['https://english.shanghai.gov.cn/en-ScenicSpots/20231218/6a92c131565646c59bf9db015ca82ed2.html']},
 'suzhou-creek':{heightM:24,kind:'sihang-warehouse-river-bank-and-truss-walkway',evidence:'real-warehouse-reference / user-2050-bank-composition-not-surveyed-bridge',reference:'苏州河 日.png / 苏州河 夜.png',sources:['https://www.ccphistory.org.cn/shds/shhm/content/f14dea94-2ca2-4fb3-ae1b-ff954d6d82aa.html']},
 'yuyuan':{heightM:24,kind:'huxinting-double-eaves-zigzag-bridge-and-open-pond',evidence:'real-greater-yuyuan-place-character / authored-garden-composition',reference:'豫园 日.png / 豫园 夜.png',sources:['https://whlyj.sh.gov.cn/gqfc/20250711/07b690c043ea4bfa92473ca80aa306fd.html']},
 'wukang-road':{heightM:30,kind:'wukang-mansion-long-wedge-rounded-bow-and-arcades',evidence:'real-building-reference / street-representative-authored-section',reference:'武康路 日.png / 武康路 夜.png',sources:['https://whlyj.sh.gov.cn/gqfc/20210209/b3a2fe2bddc249069814c3084cd02f70.html']},
 'cpc-first-congress':{heightM:11.6,kind:'continuous-two-storey-shikumen-streetwall-and-four-portals',evidence:'historic-old-site-reference / authored-frontage-not-new-museum',reference:'一大会址 日.png / 一大旧址 夜.png',sources:['https://www.zgyd1921.com/about.html']}
});

export function buildHeritageForm(id){
 const spec=HERITAGE_FORM_SPECS[id];if(!spec)return null;
 const b=createParticleBuilder(id),{point,random,line,polyline,stroke,surface,ring,box,cylinder,roof}=b;
 const rect=(x,z,y,w,h,strength=.53)=>polyline([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y+h,z],[x-w/2,y+h,z]],strength,.7,1.05,true);
 function column(x,z,r,h,y=0){
  surface((u,v)=>[x+Math.cos(u*Math.PI*2)*r,y+v*h,z+Math.sin(u*Math.PI*2)*r],10,Math.max(4,Math.ceil(h/2)),.2,.65);
  ring(x,y,z,r,r,.48,.7,20);ring(x,y+h,z,r,r,.59,.76,20);
 }
 function front(x,z,w,h,y=0,holes=[],strength=.22,spacing=1.55){
  for(let xx=-w/2;xx<=w/2;xx+=spacing)for(let yy=0;yy<=h;yy+=spacing){
   if(holes.some(q=>Math.abs(x+xx-q[0])<q[2]/2&&y+yy>=q[1]&&y+yy<=q[1]+q[3]))continue;
   point(x+xx,y+yy,z,strength,.65);
  }
 }
 function arch(x,z,y,w,h,strength=.76){
  const r=w/2,spring=y+h-r;
  line([x-r,y,z],[x-r,spring,z],strength,.8,.75);line([x+r,y,z],[x+r,spring,z],strength,.8,.75);
  stroke(t=>[x+Math.cos(Math.PI*t)*r,spring+Math.sin(Math.PI*t)*r,z],30,strength,.83);
 }
 function roofPyramid(x,z,w,d,y,h,strength=.36){
  for(const sign of [-1,1]){
   surface((u,v)=>[x+(u-.5)*w*(1-v),y+v*h,z+sign*d/2*(1-v)],26,18,strength,.67);
   surface((u,v)=>[x+sign*w/2*(1-v),y+v*h,z+(u-.5)*d*(1-v)],22,18,strength,.67);
  }
  for(const [xx,zz] of [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]])line([x+xx,y,z+zz],[x,y+h,z],.82,.9);
 }
 function classicalBlock(x,z,w,d,h,floors=4){
  box(x,z,w,d,h,0,.18);
  for(let floor=1;floor<=floors;floor++)line([x-w/2,h*floor/floors,z+d/2+.25],[x+w/2,h*floor/floors,z+d/2+.25],floor===floors?.74:.45,.76,.85);
  for(let xx=x-w/2+4;xx<x+w/2-1;xx+=7.5)for(let floor=0;floor<floors;floor++)rect(xx,z+d/2+.35,3+floor*h/floors,2.6,3.8,.47);
 }
 if(id==='bund'){
  // A low, continuous frontage, with a ROUND dome and a separate SQUARE clock.
  classicalBlock(-105,-1,33,30,28,4);classicalBlock(-72,-2,26,32,32,4);
  classicalBlock(-32,0,55,37,33,4);classicalBlock(22,-1,44,35,35,5);classicalBlock(65,-2,34,32,31,4);
  classicalBlock(101,-3,36,34,44,6);
  // HSBC: columned portico, drum and hemispherical dome with a small lantern.
  for(let k=-4;k<=4;k++)column(-32+k*5.3,22,1,18,2);
  box(-32,20.5,53,5,2.3,20,.2);box(-32,0,30,26,4,33,.2);
  cylinder(-32,0,12.1,7,37,.26,44);
  surface((u,v)=>{const a=u*Math.PI*2,p=v*Math.PI/2;return[-32+Math.cos(a)*Math.cos(p)*12.1,44+Math.sin(p)*12.1,Math.sin(a)*Math.cos(p)*12.1];},52,22,.34,.73);
  for(let k=0;k<12;k++)stroke(t=>{const a=k*Math.PI/6,p=t*Math.PI/2;return[-32+Math.cos(a)*Math.cos(p)*12.15,44+Math.sin(p)*12.15,Math.sin(a)*Math.cos(p)*12.15];},32,.72,.82);
  cylinder(-32,0,2.2,3.4,55,.24,20);ring(-32,58.4,0,2.6,2.6,.72,.83,42);
  // Customs clock tower: square shaft, cornices, clock faces and stepped cap.
  box(22,-1,20,20,31,35,.25);for(const yy of [39,57,65])box(22,-1,22,22,1.3,yy,.2);
  box(22,-1,16,16,6,67,.23);box(22,-1,19,19,1.8,73,.24);roofPyramid(22,-1,15,15,74.8,3.2,.31);line([22,78,-1],[22,82,-1],.79,.9,.55);
  for(const side of [-1,1]){
   const z=-1+side*10.15;
   stroke(t=>[22+Math.cos(t*Math.PI*2)*5.1,53+Math.sin(t*Math.PI*2)*5.1,z],70,.87,.91);
   for(let k=0;k<12;k++){const a=k*Math.PI/6;line([22+Math.cos(a)*4.3,53+Math.sin(a)*4.3,z],[22+Math.cos(a)*4.8,53+Math.sin(a)*4.8,z],.68,.76,.5);}
   line([22,53,z],[22,56.8,z],.86,.85,.55);line([22,53,z],[24.6,51.5,z],.86,.85,.55);
  }
  // Peace Hotel's distinct pyramidal top is a secondary northern bookend.
  box(101,-3,22,22,7,44,.2);roofPyramid(101,-3,25,25,51,16,.31);line([101,67,-3],[101,69,-3],.7,.8);
  for(const z of [26,30])line([-124,.4,z],[122,.4,z],.3,.65,1.8);
 }
 else if(id==='jing-an-temple'){
  const hall=(x,z,w,d,h,rise)=>{box(x,z,w*.86,d*.8,h,0,.17);roof(x,z,w,d,h,rise,.28);roof(x,z,w*.77,d*.72,h+rise*.74,rise*.75,.3);for(const xx of [-.35,-.18,0,.18,.35])column(x+w*xx,z+d*.39,.7,h);};
  hall(0,2,65,37,13,10);hall(0,-42,60,28,13,8);
  // Gate and low side galleries leave the front court genuinely empty.
  box(0,50,76,15,7,0,.17);roof(0,50,82,20,8,6,.27);roof(0,50,58,17,13,5,.27);
  for(const x of [-43,43]){box(x,20,12,54,7,0,.15);roof(x,20,17,60,8,5,.24);}
  for(const x of [-24,0,24])arch(x,58,0,7.2,5.7,.72);
  // Vajrasana: lotus-bearing terrace and five tapering stupas, not a six-eaved pagoda.
  box(0,-66,36,29,7,0,.23);box(0,-66,38,31,1.5,7,.22);
  for(let k=0;k<14;k++)stroke(t=>{const a=(k+t)/14*Math.PI*2,r=16+Math.sin(t*Math.PI)*2.2;return[Math.cos(a)*r,9+Math.sin(t*Math.PI)*2.4,-66+Math.sin(a)*r*.77];},24,.72,.79);
  function stupa(x,z,w,y,h,tiers){
   for(let k=0;k<tiers;k++){
    const t=k/tiers,ww=w*(1-.68*t),base=y+h*t,step=h/tiers;
    const square=(w,yy)=>[[x-w/2,yy,z-w/2],[x+w/2,yy,z-w/2],[x+w/2,yy,z+w/2],[x-w/2,yy,z+w/2]];
    polyline(square(ww,base),.49,.73,1.2,true);polyline(square(ww+1,base+step*.68),.74,.82,1.1,true);
    for(const sign of [-1,1]){
     surface((u,v)=>[x+(u-.5)*ww,base+v*step*.62,z+sign*ww/2],8,2,.19,.64);
     surface((u,v)=>[x+sign*ww/2,base+v*step*.62,z+(u-.5)*ww],8,2,.19,.64);
    }
   }
   const top=y+h;roofPyramid(x,z,w*.28,w*.28,top,3,.25);line([x,top+3,z],[x,top+6,z],.8,.86,.55);
  }
  stupa(0,-66,10.8,11,31,10);
  for(const x of [-13,13])for(const z of [-76,-56])stupa(x,z,6.1,10,18,7);
  for(const z of [32,40])line([-29,.3,z],[29,.3,z],.27,.62,1.6);
 }
 else if(id==='people-square'){
  // Museum: circular upper volume standing above a SQUARE base, not a lone cylinder.
  box(-39,40,65,49,17,0,.18);box(-39,40,69,53,2,17,.18);cylinder(-39,40,27,9,19,.22,68);
  surface((u,v)=>{const a=u*Math.PI*2,r=27*v;return[-39+Math.cos(a)*r,28+2*(1-v*v),40+Math.sin(a)*r];},72,22,.27,.7);
  for(const yy of [7,14])for(const sign of [-1,1])line([-70,yy,40+sign*25],[-8,yy,40+sign*25],.44,.73);
  for(const x of [-52,-26])stroke(t=>[x,29+4*Math.sin(t*Math.PI),31+(t-.5)*20],40,.68,.8);
  // Grand Theatre: one wide roof that turns upward at its ends.
  box(48,-38,75,46,24,0,.17);
  const theatreRoof=(u,v)=>{const x=(u-.5)*86,z=(v-.5)*57;return[48+x,30+9*Math.pow(Math.abs(x)/43,2.2)+1.2*Math.pow(z/29,2),-38+z];};
  surface(theatreRoof,66,42,.3,.7);for(const u of [0,1])stroke(t=>theatreRoof(u,t),70,.83,.88);for(const v of [0,1])stroke(t=>theatreRoof(t,v),100,.83,.88);
  for(let x=16;x<=80;x+=5)line([x,1,-14.8],[x,24,-14.8],.38,.67,1.2);
  // Only fragments of the plaza, planting beds and roof lights: keep the square open.
  polyline([[-92,.35,4],[-92,.35,-58],[-44,.35,-58]],.29,.65,1.8);
  polyline([[91,.35,22],[91,.35,77],[20,.35,77]],.29,.65,1.8);
  polyline([[-13,.45,-11],[14,.45,-11],[14,.45,10],[-13,.45,10]],.37,.66,1.2,true);
  for(let k=0;k<5;k++){
   const x=3+k*14,z=38;
   polyline([[x-5,.4,z-8],[x+5,.4,z-8],[x+5,.4,z+8],[x-5,.4,z+8]],.26,.62,1.2,true);
   for(const zz of [-8,8])polyline([[x-5,.5,z+zz],[x,5.8,z+zz],[x+5,.5,z+zz]],.49,.72,1.1);
   line([x,5.8,z-8],[x,5.8,z+8],.51,.72);
  }
 }
 else if(id==='suzhou-creek'){
  // A flat-roofed warehouse faces a truly empty river corridor.
  const openings=[];for(let x=-64;x<=13;x+=10.8)for(let y=4;y<=19;y+=4.8)openings.push([x,y,3.6,2.8]);
  front(-23,-1,98,23.4,0,openings,.2,1.2);
  front(-23,-43,98,23.4,0,[],.16,1.7);
  for(const side of [-1,1])surface((u,v)=>[-23+side*49,v*23.4,-43+u*42],32,22,.17,.65);
  polyline([[-73,23.4,-44],[27,23.4,-44],[27,23.4,0],[-73,23.4,0]],.75,.85,.9,true);
  polyline([[-72,24,-43],[26,24,-43],[26,24,-1],[-72,24,-1]],.65,.8,.9,true);
  surface((u,v)=>[-72+98*u,23.35,-43+42*v],48,21,.14,.64);
  for(const [x,y,w,h] of openings)rect(x,-.86,y,w,h,.5);
  for(const yy of [3,7.4,12.2,17,22])line([-72,yy,-.7],[26,yy,-.7],.35,.66,1.2);
  // Subtle broken marks reference the historical west wall without inventing text.
  for(let k=0;k<44;k++){const y=4+random()*17,z=-39+random()*32,r=.18+random()*.46;stroke(t=>[-72.1,y+Math.sin(t*Math.PI*2)*r,z+Math.cos(t*Math.PI*2)*r],8,.4,.64);}
  for(const z of [4,9,61])line([-84,.7,z],[84,.7,z],z===61?.23:.42,.67,1.3);
  for(let x=-78;x<=45;x+=10)line([x,.65,4],[x,.65,9],.24,.62,1.1);
  // Steel-truss walkway is the user's 2050 composition, not a certified bridge location.
  const xmin=61,xmax=73,z0=7,z1=61,y0=4.1,y1=9.2;
  for(const x of [xmin,xmax]){
   line([x,y0,z0],[x,y0,z1],.75,.83,.75);line([x,y1,z0],[x,y1,z1],.79,.85,.75);
   for(let k=0;k<8;k++){const za=z0+k*(z1-z0)/8,zb=z0+(k+1)*(z1-z0)/8;line([x,y0,za],[x,y1,zb],.68,.79,.75);line([x,y1,za],[x,y0,zb],.58,.76,.8);line([x,y0,za],[x,y1,za],.61,.77,.75);}
  }
  for(let z=z0;z<=z1;z+=4.5)line([xmin,y0,z],[xmax,y0,z],.39,.68,1);
  for(const z of [z0,z1])for(const x of [xmin+1,xmax-1])line([x,0,z],[x,y0,z],.4,.7);
 }
 else if(id==='yuyuan'){
  // Pond and bridge are negative space; halls are intentionally irregular.
  const pavilion=(x,z,w,d,h,rise)=>{for(const xx of [-.35,.35])for(const zz of [-.32,.32])column(x+w*xx,z+d*zz,.48,h);roof(x,z,w,d,h,rise,.29);};
  pavilion(-8,0,30,25,7,5);box(-8,0,18,14,4.8,12,.18);roof(-8,0,25,21,16.8,6.2,.31);
  line([-8,23,0],[-8,24,0],.78,.86,.45);
  for(const z of [-7.2,7.2])for(const x of [-13,-8,-3])rect(x,z,12.5,2.3,3.3,.5);
  pavilion(-37,-30,42,19,7.3,5);pavilion(34,-25,23,41,6.2,5);pavilion(-48,14,18,23,5.6,4);pavilion(28,42,36,18,5.7,4);
  const bridge=[[-4,12],[7,17],[3,23],[18,26],[13,32],[29,35],[23,40],[40,44],[35,49],[44,54]];
  for(let k=1;k<bridge.length;k++){
   const a=bridge[k-1],c=bridge[k],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*1.45,nz=dx/len*1.45;
   for(const sign of [-1,1])for(const yy of [1.5,3.1])line([a[0]+nx*sign,yy,a[1]+nz*sign],[c[0]+nx*sign,yy,c[1]+nz*sign],yy>2?.68:.48,.77,.8);
   for(let t=0;t<=1;t+=.25)for(const sign of [-1,1])line([a[0]+dx*t+nx*sign,1.5,a[1]+dz*t+nz*sign],[a[0]+dx*t+nx*sign,3.1,a[1]+dz*t+nz*sign],.42,.67,.7);
  }
  const shore=[[-43,-14],[-21,-19],[5,-15],[17,-7],[26,6],[52,13],[56,32],[48,57],[6,59],[-22,48],[-40,35],[-51,15]];
  polyline(shore.map(([x,z])=>[x,.45,z]),.29,.65,1.25,true);
  // Small jagged rock contours sit behind the pavilion, not across the pond.
  for(let level=0;level<6;level++)stroke(t=>{const a=t*Math.PI*2,r=(8.5-level*.8)*(1+.17*Math.sin(a*5+level));return[-27+Math.cos(a)*r,level*1.1,-27+Math.sin(a)*r*.65];},75,.3,.67);
 }
 else if(id==='wukang-road'){
  // A long ship-like wedge; the front is rounded while its sides diverge behind it.
  const outline=[];
  for(let k=0;k<=75;k++){const t=k/75;outline.push([-27+(27-3.8)*t,0,52+(-60-52)*t]);}
  for(let k=0;k<=24;k++){const a=Math.PI+k/24*Math.PI;outline.push([Math.cos(a)*3.8,0,-60+Math.sin(a)*3.8]);}
  for(let k=0;k<=75;k++){const t=k/75;outline.push([3.8+(27-3.8)*t,0,-60+(52+60)*t]);}
  for(let k=0;k<=30;k++)outline.push([27-54*k/30,0,52]);
  for(let j=0;j<outline.length;j++)for(let y=5.3;y<=28.4;y+=1.5){const [x,,z]=outline[j];point(x,y,z,.18,.65);}
  for(const y of [5,8.8,12.5,16.2,19.9,23.6,27.3,29.1])polyline(outline.map(([x,,z])=>[x,y,z]),y>28?.79:.46,.77,1.15,true);
  // Recessed uppermost floor gives the profile a legible cornice/crown.
  polyline(outline.map(([x,,z])=>[x*.91,30,z*.94]),.72,.83,1,true);
  for(let z=-59;z<=48;z+=2.7){const width=(3.8+(z+60)/112*23.2)*.9;for(let x=-width;x<=width;x+=2.7)point(x,29.7,z,.15,.64);}
  for(const sign of [-1,1]){
   const ax=sign*3.8,az=-60,bx=sign*27,bz=52,dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),tx=dx/len,tz=dz/len,nx=sign*.98,nz=-.2;
   for(let k=0;k<17;k++){
    const t=(k+.5)/17,cx=ax+dx*t,cz=az+dz*t;
    for(const y of [6,9.7,13.4,17.1,20.8,24.5]){
     const w=1.7,h=2.1;
     polyline([[cx-tx*w,y,cz-tz*w],[cx+tx*w,y,cz+tz*w],[cx+tx*w,y+h,cz+tz*w],[cx-tx*w,y+h,cz-tz*w]],.5,.72,.9,true);
    }
    // Open arcade: bright columns and arch, never a filled ground-floor wall.
    if(k%2===0){
     const ww=2.45,hh=4.4,spring=hh-ww;
     for(const q of [-1,1])line([cx+tx*ww*q,0,cz+tz*ww*q],[cx+tx*ww*q,spring,cz+tz*ww*q],.55,.75,.75);
     stroke(t=>{const v=Math.cos(t*Math.PI)*ww;return[cx+tx*v,spring+Math.sin(t*Math.PI)*ww,cz+tz*v];},26,.66,.8);
    }
    if(k<6&&k%2===0)for(const y of [12.5,19.9,27.3]){
     const w=2.3,ox=nx*1.2,oz=nz*1.2;
     line([cx-tx*w,y,cz-tz*w],[cx-tx*w+ox,y,cz-tz*w+oz],.58,.77);
     line([cx+tx*w,y,cz+tz*w],[cx+tx*w+ox,y,cz+tz*w+oz],.58,.77);
     line([cx-tx*w+ox,y+.9,cz-tz*w+oz],[cx+tx*w+ox,y+.9,cz+tz*w+oz],.67,.79);
    }
   }
  }
  // Pavement outlines are fragments, avoiding a white fenced footprint.
  line([-39,.25,52],[-13,.25,-66],.26,.64,1.5);line([39,.25,52],[13,.25,-66],.26,.64,1.5);
 }
 else if(id==='cpc-first-congress'){
  // Two continuous low rows, with the old site's distinct four-door street wall.
  const frontZ=21,doorX=[-24,-8,8,24],holes=doorX.map(x=>[x,0,4.8,4.6]);
  for(let x=-28;x<=28;x+=8)holes.push([x,6.2,2.1,1.5]);
  front(0,frontZ,66,8.6,0,holes,.24,.8);
  front(0,1,66,8.6,0,[],.16,1.25);front(0,-11,66,8.6,0,[],.16,1.25);front(0,-29,66,8.6,0,[],.16,1.25);
  for(const x of [-33,33])for(const [z0,z1] of [[1,21],[-29,-11]])surface((u,v)=>[x,v*8.6,z0+(z1-z0)*u],18,10,.18,.65);
  roof(0,11,70,23,8.6,3,.26);roof(0,-20,70,21,8.6,3,.25);
  for(const yy of [.6,2.4,4.9,5.6,8.4])line([-33,yy,frontZ+.12],[33,yy,frontZ+.12],yy===8.4?.7:.38,.71,.8);
  for(const x of doorX){
   // Rectangular dark door, dressed stone jambs, then the rounded carved pediment.
   for(const sign of [-1,1]){
    line([x+sign*2.55,0,frontZ+.25],[x+sign*2.55,4.85,frontZ+.25],.82,.87,.55);
    line([x+sign*3.1,0,frontZ+.18],[x+sign*3.1,4.9,frontZ+.18],.59,.77,.65);
   }
   line([x-2.55,4.7,frontZ+.25],[x+2.55,4.7,frontZ+.25],.86,.87,.55);
   arch(x,frontZ+.22,4.8,6.2,3.1,.82);
   stroke(t=>[x+Math.cos(t*Math.PI)*2.3,4.9+Math.sin(t*Math.PI)*2.3,frontZ+.3],31,.56,.74);
   for(let k=0;k<7;k++){const a=k/6*Math.PI;line([x+Math.cos(a)*1.7,4.9+Math.sin(a)*1.7,frontZ+.3],[x+Math.cos(a)*2.25,4.9+Math.sin(a)*2.25,frontZ+.3],.48,.68,.6);}
  }
  for(let x=-28;x<=28;x+=8)rect(x,frontZ+.14,6.2,2.1,1.5,.5);
  for(const x of [-32,-16,0,16,32])line([x,8.6,1],[x,8.6,21],.43,.72,1.1);
  for(const z of [24,27])line([-36,.25,z],[36,.25,z],.29,.65,1.2);
 }
 const form=b.finish(spec);
 // Dense classical roof and facade grids do not need as much sampling as their
 // identifying edges. Retain every bright structural point; deterministically
 // thin only diffuse surfaces in the two largest heritage clusters.
 if(id==='bund'||id==='jing-an-temple'){
  const p=[],power=[],s=[],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<form.pointCount;i++){
   const hash=(Math.imul(i+7,2654435761)>>>0)/4294967296;
   if(form.brightness[i]<.4&&hash<.52)continue;
   for(let k=0;k<3;k++){const v=form.positions[i*3+k];p.push(v);lo[k]=Math.min(lo[k],v);hi[k]=Math.max(hi[k],v);}
   power.push(form.brightness[i]);s.push(form.sizes[i]);
  }
  return {...form,positions:new Float32Array(p),brightness:new Float32Array(power),sizes:new Float32Array(s),boundsM:[lo,hi],pointCount:power.length};
 }
 return form;
}

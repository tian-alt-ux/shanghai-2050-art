import {createParticleBuilder} from './landmark-particle-builder.mjs';

const conceptEvidence='user-approved-authored-2050-concept / unverified-real-project / reference-image-interpretation';
export const FUTURE_FORM_SPECS=Object.freeze({
 'indoor-botanic':Object.freeze({heightM:48,kind:'future-atrium-ringwalks-and-ecological-tree',evidence:conceptEvidence,reference:'室内植物园.png',sources:['https://www.dmaa.at/work/expo-cultural-park-greenhouse-garden-shanghai'],status:'authored-2050-concept',approvalDate:'2026-11-02',sourceRole:'Real greenhouse typology reference only; the pictured future atrium and its exterior shell are authored, not the built DMAA facility.'}),
 'lane-renewal':Object.freeze({heightM:22,kind:'future-laneway-courtyards-and-footbridges',evidence:conceptEvidence,reference:'弄堂改造.png / 弄堂改造 风格化.png',sources:['https://www.ihchina.cn/art/detail/id/20377.html'],status:'authored-2050-concept',approvalDate:'2026-11-02',sourceRole:'Historic Shanghai lane typology; future terraces, bridges and public uses follow the user concept image, not a certified redevelopment project.'}),
 'dishui-lake':Object.freeze({heightM:31,kind:'future-lakefront-public-roof-and-oculi',evidence:conceptEvidence,reference:'滴水湖 日.png / 滴水湖 夜.png',sources:[],status:'authored-2050-concept',approvalDate:'2026-11-02',sourceRole:'User-selected 2050 lakeside public-building concept, not the existing lake-centre waterdrop sculpture.',anchorPolicy:'Retains the supplied artwork anchor as a concept location; local geometry does not establish a real shoreline building parcel or alter the lake boundary.'})
});

/**
 * User-approved WHITE PARTICLE CONCEPTS, units: metres.
 * These are authored 2050 proposals derived from the user's reference pictures.
 * They are authored spatial concepts, not surveys, certified real facilities, or official construction plans.
 * The artwork renderer keeps positioning, display scale and lighting separate.
 */
const approvedConcepts = {
  'indoor-botanic': {
    title: '2050 室内植物园 · 环廊生态中庭',
    status: 'authored-2050-concept',
    reference: '室内植物园.png',
    rationale: '透明单体中庭、中央生态树与山岛、多层环廊；保留参考图内部空间关系，外壳为作者概括。',
    features: ['单体椭圆肋壳', '中央生态树与山岛', '三层环状游廊', '连接环廊的缓坡', '小尺度瀑布与水池'],
    dimensionsM: [104, 50, 88]
  },
  'lane-renewal': {
    title: '2050 弄堂改造 · 新旧共生街巷',
    status: 'authored-2050-concept',
    reference: '弄堂改造.png / 弄堂改造 风格化.png',
    rationale: '连排低楼围合可通行的主弄，错落露台、沿街店面与轻步桥表达图中的生活更新；并非复制已建项目。',
    features: ['狭长主弄与支弄', '不等高连排坡屋顶', '沿街小店与雨棚', '两处轻步桥', '退台花园与侧院'],
    dimensionsM: [70, 22, 118]
  }
};

function buildApprovedConcept(id) {
  const spec = approvedConcepts[id];
  if (!spec) throw new Error(`Unknown future concept: ${id}`);
  const positions = [], sizes = [], brightness = [];
  let seed = id === 'indoor-botanic' ? 720513 : 423985;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const pt = (x, y, z, b = .65, s = .3) => {
    positions.push(x, y, z); brightness.push(b); sizes.push(s);
  };
  const line = (a, b, strength = .76, size = .29, spacing = .48) => {
    const distance = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const count = Math.max(2, Math.ceil(distance / spacing));
    for (let n = 0; n <= count; n++) {
      const t = n / count;
      pt(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, strength, size);
    }
  };
  const curve = (fn, count = 240, strength = .76, size = .29) => {
    for (let n = 0; n <= count; n++) {
      const p = fn(n / count); pt(p[0], p[1], p[2], strength, size);
    }
  };
  const ring = (rx, rz, y, strength = .8, size = .3, cx = 0, cz = 0) => curve(t => [cx + Math.cos(t * Math.PI * 2) * rx, y, cz + Math.sin(t * Math.PI * 2) * rz], Math.ceil(Math.max(rx, rz) * 13), strength, size);
  const frame = (x, z, width, height, strength = .72, y = 0) => {
    line([x - width / 2, y, z], [x - width / 2, y + height, z], strength);
    line([x + width / 2, y, z], [x + width / 2, y + height, z], strength);
    line([x - width / 2, y + height, z], [x + width / 2, y + height, z], strength);
  };
  const shrub = (x, y, z, rx, ry, rz, count, strength = .32) => {
    for (let i = 0; i < count; i++) {
      const az = rand() * Math.PI * 2, cy = rand() * 2 - 1, r = Math.cbrt(rand());
      const sx = Math.sqrt(1 - cy * cy);
      pt(x + Math.cos(az) * sx * rx * r, y + cy * ry * r, z + Math.sin(az) * sx * rz * r, strength * (.7 + rand() * .6), .23 + rand() * .13);
    }
  };

  if (id === 'indoor-botanic') {
    // One atrium, not a pair of generic domes. Deliberately quiet glazing
    // allows the ecological island and rising circulation to remain legible.
    const rx = 49, rz = 40, spring = 28, roofRise = 20, oculus = .19;
    ring(rx, rz, .6, .66, .26);
    ring(rx, rz, spring, .86, .31);
    for (let n = 0; n < 28; n++) {
      const a = n / 28 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      line([ca * rx, .6, sa * rz], [ca * rx, spring, sa * rz], .58, .24, .55);
      curve(t => {
        const u = t * (1 - oculus) + oculus, phi = u * Math.PI / 2;
        return [ca * rx * Math.sin(phi), spring + roofRise * Math.cos(phi), sa * rz * Math.sin(phi)];
      }, 100, .65, .25);
    }
    for (const y of [7, 14, 21]) ring(rx, rz, y, .36, .2);
    for (const phi of [.42, .72, 1.04, 1.31]) ring(rx * Math.sin(phi), rz * Math.sin(phi), spring + roofRise * Math.cos(phi), .43, .22);
    ring(rx * Math.sin(oculus * Math.PI / 2), rz * Math.sin(oculus * Math.PI / 2), spring + roofRise * Math.cos(oculus * Math.PI / 2), .81, .28);

    // Three perforated circulation rings, not continuous solid white floors.
    for (const [floor, outerX, outerZ] of [[8, 42, 33], [17, 40, 31], [26, 38, 29]]) {
      ring(outerX, outerZ, floor, .85, .31);
      ring(outerX - 4, outerZ - 4, floor, .87, .31);
      ring(outerX - 4, outerZ - 4, floor + 1.25, .66, .23);
      for (let n = 0; n < 38; n++) {
        const a = n / 38 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        line([ca * (outerX - 4), floor, sa * (outerZ - 4)], [ca * outerX, floor, sa * outerZ], .36, .2, .65);
        line([ca * (outerX - 4), floor, sa * (outerZ - 4)], [ca * (outerX - 4), floor + 1.25, sa * (outerZ - 4)], .46, .2, .4);
      }
    }
    // A single ramp winds upward, referencing accessible multi-level walkways.
    for (const offset of [0, 3.2]) curve(t => {
      const a = t * Math.PI * 3.5 + .4;
      return [Math.cos(a) * (31 + offset), 1.5 + 24 * t, Math.sin(a) * (23 + offset)];
    }, 760, .59, .23);
    curve(t => { const a = t * Math.PI * 3.5 + .4; return [Math.cos(a) * 31, 2.65 + 24 * t, Math.sin(a) * 23]; }, 760, .55, .21);

    // Quiet rock island: broken contour traces and sparse surface points.
    for (let level = 0; level <= 9; level++) {
      const radius = 17.5 - level * 1.08;
      curve(t => {
        const a = t * Math.PI * 2, wobble = 1 + .085 * Math.sin(a * 5 + level * .5) + .04 * Math.cos(a * 9);
        return [Math.cos(a) * radius * wobble, level * .73, Math.sin(a) * radius * wobble * .8];
      }, 220, .25 + level * .007, .23);
    }
    for (let n = 0; n < 1700; n++) {
      const a = rand() * Math.PI * 2, radius = Math.sqrt(rand()) * 17;
      const height = 7 * Math.pow(1 - radius / 19, .7) + .7 * Math.sin(a * 5);
      pt(Math.cos(a) * radius, Math.max(.5, height), Math.sin(a) * radius * .8, .25, .22);
    }
    // Central trunk, visible forks, restrained leaf clusters.
    for (let rib = 0; rib < 14; rib++) curve(t => {
      const a = rib / 14 * Math.PI * 2 + Math.sin(t * 2) * .22, r = 2.65 * (1 - t * .58);
      return [Math.cos(a) * r + Math.sin(t * 2.6), 6 + t * 29, Math.sin(a) * r];
    }, 110, .67, .27);
    for (let branch = 0; branch < 13; branch++) {
      const a = branch * 2.4, start = 17 + (branch % 4) * 3.7;
      const length = 9 + (branch % 3) * 2;
      const x = Math.cos(a) * length, z = Math.sin(a) * length * .85, y = start + 9;
      curve(t => [Math.cos(a) * length * Math.pow(t, .85), start + t * 9, Math.sin(a) * length * Math.pow(t, .85) * .85], 75, .54, .25);
      shrub(x, y, z, 7.8, 3.9, 6.5, 340, .31);
    }
    shrub(0, 39.5, 0, 12, 5, 10, 820, .3);
    // Visitor / research ring around tree, visually separate from circulation.
    ring(13, 11, 25.5, .78, .29);
    ring(13, 11, 27.2, .66, .24);
    for (let n = 0; n < 32; n++) {
      const a = n / 32 * Math.PI * 2;
      line([Math.cos(a) * 13, 25.5, Math.sin(a) * 11], [Math.cos(a) * 13, 27.2, Math.sin(a) * 11], .44, .2);
    }
    for (const [cx, cz, width] of [[10, -5, 3.2], [-7, 7, 2.4], [4, 12, 2]]) {
      for (let k = 0; k < 13; k++) curve(t => [cx + (k / 12 - .5) * width + Math.sin(t * 5) * .25, 9 - t * 7, cz + t * 2.8], 43, .4, .2);
    }
    ring(23, 18, .9, .49, .22);
    ring(22.5, 17.5, .92, .26, .19);
    // Recessed entrance opening, no opaque display board.
    frame(0, -40.2, 13, 6.2, .75);
    line([-8, 6.2, -40.4], [8, 6.2, -40.4], .71, .29);
  } else {
    // Two genuinely connected street fronts with breathing spaces, side lanes,
    // rear courts and a staggered roof line, rather than a repeated hut grid.
    const blocks = [
      {x:-18.5,z:-43,w:22,d:19,h:12.7,roof:2.7},
      {x:-18.5,z:-20.5,w:22,d:21,h:15.3,roof:2.5},
      {x:-20,z:4.8,w:25,d:22,h:14.1,roof:2.8},
      {x:-18,z:34,w:21,d:28,h:16.5,roof:2.8},
      {x:18,z:-43,w:21,d:20,h:15.2,roof:2.7},
      {x:18,z:-19.8,w:21,d:20,h:12.9,roof:2.4},
      {x:21,z:5,w:27,d:22,h:16.2,roof:2.9},
      {x:18,z:33.7,w:21,d:28,h:14.2,roof:2.6}
    ];
    const wall = (fixed, lo, hi, h, axis) => {
      for (let u = lo; u <= hi; u += 1.13) for (let y = .5; y < h; y += 1.04) {
        const strength = .17 + rand() * .12;
        if (axis === 'x') pt(fixed, y, u, strength, .21);
        else pt(u, y, fixed, strength, .21);
      }
    };
    for (const b of blocks) {
      const xmin = b.x - b.w/2, xmax = b.x + b.w/2, zmin = b.z - b.d/2, zmax = b.z + b.d/2;
      for (const z of [zmin,zmax]) {
        frame(b.x,z,b.w,b.h,.58);
        line([xmin,b.h,z],[b.x,b.h+b.roof,z],.8,.3);
        line([b.x,b.h+b.roof,z],[xmax,b.h,z],.8,.3);
        wall(z,xmin,xmax,b.h,'z');
      }
      for(const x of [xmin,xmax]) {
        line([x,.4,zmin],[x,.4,zmax],.58,.25);
        line([x,b.h,zmin],[x,b.h,zmax],.79,.29);
        wall(x,zmin,zmax,b.h,'x');
      }
      line([b.x,b.h+b.roof,zmin],[b.x,b.h+b.roof,zmax],.85,.31);
      for(let z=zmin;z<=zmax;z+=2.05) {
        line([xmin,b.h,z],[b.x,b.h+b.roof,z],.26,.2,.75);
        line([b.x,b.h+b.roof,z],[xmax,b.h,z],.26,.2,.75);
      }
      // Two fine cornices, not uniformly bright facade filling.
      for(const y of [4.7,9.2]) {
        for(const x of [xmin,xmax]) line([x,y,zmin],[x,y,zmax],.42,.22,.6);
      }
      const front = b.x < 0 ? xmax : xmin;
      for(let z=zmin+3;z<zmax-2.5;z+=5.1) {
        for(let y=6;y<b.h-1;y+=4.6) {
          const ww=1.35,hh=2.3;
          line([front,y,z-ww],[front,y,z+ww],.65,.25);
          line([front,y+hh,z-ww],[front,y+hh,z+ww],.62,.24);
          for(const dz of [-ww,ww]) line([front,y,z+dz],[front,y+hh,z+dz],.62,.24);
        }
        // Ground-level shopfront with an actual open middle.
        for(const dz of [-1.9,1.9]) line([front,.35,z+dz],[front,3.7,z+dz],.65,.25);
        line([front,3.7,z-1.9],[front,3.7,z+1.9],.69,.25);
        const overhang = b.x < 0 ? 1.7 : -1.7;
        line([front+overhang,3.25,z-2.2],[front+overhang,3.25,z+2.2],.56,.24);
        for(const dz of [-2.2,2.2]) line([front,3.8,z+dz],[front+overhang,3.25,z+dz],.5,.22);
      }
    }
    // Stone-gateway silhouette at the near entrance. A wide opening stays clear.
    for(const x of [-7.8,7.8]) {
      line([x,0,-54.5],[x,6.9,-54.5],.82,.32);
      line([x+Math.sign(x)*1.3,0,-54.5],[x+Math.sign(x)*1.3,7.6,-54.5],.64,.25);
    }
    line([-9.1,7.6,-54.5],[9.1,7.6,-54.5],.84,.33);
    line([-7.8,6.9,-54.5],[7.8,6.9,-54.5],.7,.27);
    // Two small spans from the reference, different heights and widths.
    for(const [z,y,w] of [[-10,8.1,3.6],[26,10.2,3.1]]) {
      for(const dz of [-w/2,w/2]) {
        line([-7.5,y,z+dz],[7.5,y,z+dz],.75,.28);
        line([-7.5,y+1.1,z+dz],[7.5,y+1.1,z+dz],.62,.24);
        for(let x=-7.5;x<=7.5;x+=1.5) line([x,y,z+dz],[x,y+1.1,z+dz],.42,.2);
      }
      for(let x=-7.5;x<=7.5;x+=1.2) line([x,y,z-w/2],[x,y,z+w/2],.34,.2);
    }
    // Setbacks and balconies support signs of inhabited, renewed brick fabric.
    for(const [x,z,y,w,d] of [[-8.2,-32,9.3,2.2,7],[8,-4,9.2,2.2,7],[-9.2,22,14.1,3,8],[8,42,9.1,2.2,8]]) {
      for(const dz of [-d/2,d/2]) line([x-w/2,y,z+dz],[x+w/2,y,z+dz],.57,.24);
      for(const dx of [-w/2,w/2]) {
        line([x+dx,y,z-d/2],[x+dx,y,z+d/2],.57,.24);
        line([x+dx,y+1,z-d/2],[x+dx,y+1,z+d/2],.43,.2);
      }
      shrub(x,y+1,z,1.6,.65,d*.46,95,.26);
    }
    // Roof planting remains low contrast, so the building outline wins.
    for(const [x,z,y] of [[-20,-18,18],[23,7,19.2],[-18,36,19.6]]) shrub(x,y,z,5.5,1.1,7,190,.23);
    // Main paving edges and a few cross joints: no luminous rectangle base.
    for(const x of [-6.8,6.8]) line([x,.18,-53],[x,.18,52],.38,.2,.65);
    for(let z=-48;z<52;z+=5) line([-6.4,.12,z],[6.4,.12,z],.17,.19,.8);
    // Small benches/planters along the side alleys, no conspicuous cubes.
    for(const [x,z] of [[-13,-8],[14,18],[-13,19],[13,-31]]) {
      line([x-1.7,.6,z],[x+1.7,.6,z],.38,.22);
      shrub(x,.8,z+1,1.4,.65,.8,70,.22);
    }
  }

  const min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.length;i++) { const axis=i%3;min[axis]=Math.min(min[axis],positions[i]);max[axis]=Math.max(max[axis],positions[i]); }
  return {
    positions:new Float32Array(positions), sizes:new Float32Array(sizes), brightness:new Float32Array(brightness),
    bounds:[min,max], boundsM:[min,max], pointCount:brightness.length, spec
  };
}

/** A low, continuous lakefront roof with genuine openings and a spherical
 * pavilion. Dimensions and layout are an authored interpretation of the two
 * approved reference pictures. No lake outline or real waterside parcel is
 * fabricated at the artwork anchor. */
function buildLakefrontPublicBuilding(){
 const b=createParticleBuilder('dishui-lake-2050-public-building');
 const {point,stroke,line,polyline,surface,ring,random}=b;
 const rx=82,rz=39;
 const holes=[{x:-28,z:2,rx:23,rz:14},{x:27,z:5,rx:17,rz:10.8},{x:3,z:-25,rx:10,rz:6}];
 const roofY=(x,z)=>27.3+2.2*Math.cos(x/82*Math.PI*.8)+1.2*Math.sin(z/39*Math.PI*.65);
 const inRoof=(x,z)=>x*x/(rx*rx)+z*z/(rz*rz)<=1;
 const inHole=(x,z)=>holes.some(h=>(x-h.x)**2/h.rx**2+(z-h.z)**2/h.rz**2<1);

 // A quietly sampled surface retains the three cut-outs as true negative space.
 // The roof is not three overlapping discs and has no luminous solid floor.
 for(let iz=0;iz<=82;iz++)for(let ix=0;ix<=175;ix++){
  const x=(ix/175-.5)*rx*2,z=(iz/82-.5)*rz*2;
  if(!inRoof(x,z)||inHole(x,z)||random()<.07)continue;
  point(x,roofY(x,z),z,.22+random()*.06,.64);
 }
 for(const dy of [0,-2.25])stroke(t=>{const a=t*Math.PI*2,x=Math.cos(a)*rx,z=Math.sin(a)*rz;return [x,roofY(x,z)+dy,z];},700,dy===0?.87:.58,.89);
 for(let n=0;n<60;n++){
  const a=n/60*Math.PI*2,x=Math.cos(a)*rx,z=Math.sin(a)*rz;
  line([x,roofY(x,z),z],[x,roofY(x,z)-2.25,z],.46,.7,.6);
 }
 for(const h of holes){
  for(const dy of [0,-2.25])stroke(t=>{const a=t*Math.PI*2,x=h.x+Math.cos(a)*h.rx,z=h.z+Math.sin(a)*h.rz;return [x,roofY(x,z)+dy,z];},230,dy===0?.92:.57,.91);
  for(let n=0;n<26;n++){
   const a=n/26*Math.PI*2,x=h.x+Math.cos(a)*h.rx,z=h.z+Math.sin(a)*h.rz;
   line([x,roofY(x,z),z],[x,roofY(x,z)-2.25,z],.46,.7,.65);
  }
 }
 // Selected long roof ribs describe construction without filling the oculi.
 for(const z of [-29,-18,-7,15,27]){
  let previous=null;
  for(let n=0;n<=220;n++){
   const x=(n/220-.5)*rx*2;
   if(inRoof(x,z)&&!inHole(x,z)){
    const p=[x,roofY(x,z)+.025,z];if(previous)line(previous,p,.34,.69,.8);previous=p;
   }else previous=null;
  }
 }

 // Recessed glazed volume under the cantilever. Three entrances stay empty.
 const wallRX=68,wallRZ=28;
 for(let n=0;n<=110;n++){
  const a=n/110*Math.PI*2,x=Math.cos(a)*wallRX,z=Math.sin(a)*wallRZ;
  const doorway=z<0&&((x>-44&&x<-35)||(x>-7&&x<5)||(x>30&&x<40));
  if(!doorway)line([x,1.5,z],[x,roofY(x,z)-2.8,z],.36,.68,1.4);
 }
 for(const y of [1.5,9.2,17.4])ring(0,y,0,wallRX,wallRZ,y===1.5?.49:.29,.68,330);
 for(let n=0;n<1600;n++){
  const a=random()*Math.PI*2,x=Math.cos(a)*wallRX,z=Math.sin(a)*wallRZ,y=2+random()*21;
  if(z<0&&Math.abs(x)<7&&y<7)continue;
  point(x,y,z,.16,.6);
 }
 // Slender steel supports remain under the roof, set back from its edge.
 for(const a of [-2.7,-2.0,-1.1,-.45,.42,1.2,2.2,2.8]){
  const x=Math.cos(a)*62,z=Math.sin(a)*24;
  for(const dx of [-.6,.6])line([x+dx,1.4,z],[x+dx,roofY(x,z)-2.4,z],.57,.76,1);
 }

 // The front spherical pavilion visible in both supplied lakefront views.
 const cx=43,cz=-31,pr=13.2,py=2.1;
 surface((u,v)=>{const a=u*Math.PI*2,p=v*Math.PI/2;return[cx+Math.cos(a)*Math.cos(p)*pr,py+Math.sin(p)*pr,cz+Math.sin(a)*Math.cos(p)*pr];},66,28,.31,.72);
 ring(cx,py,cz,pr,pr,.77,.85,180);
 for(let n=0;n<18;n++)stroke(t=>{const a=n/18*Math.PI*2,p=t*Math.PI/2;return [cx+Math.cos(a)*Math.cos(p)*pr,py+Math.sin(p)*pr,cz+Math.sin(a)*Math.cos(p)*pr];},54,.44,.73);
 for(const p of [.34,.72,1.08])ring(cx,py+Math.sin(p)*pr,cz,Math.cos(p)*pr,Math.cos(p)*pr,.39,.69,120);

 // Two gently curving terrace edges connect the pavilion and public entrances.
 // They describe this concept only; no false circular lake shore is drawn.
 for(const [y,zOffset] of [[1.3,0],[.7,-5]])stroke(t=>{const x=-74+t*148;return [x,y,-40+zOffset+4*Math.sin(t*Math.PI)];},270,.43,.72);
 for(const x of [-49,-24,2,28,54]){
  line([x,.7,-44],[x,1.3,-38],.3,.66);
 }
 polyline([[-75,1.3,-40],[-81,1.3,-22],[-78,1.3,0]],.35,.68,1.1);
 // Low elliptical planting islands avoid a rigid square pedestal.
 for(const [x,z,ar,br] of [[-51,-32,12,3.5],[-5,-36,14,3.3],[67,-21,8,3]])ring(x,1.5,z,ar,br,.27,.61,100);
 return b.finish(FUTURE_FORM_SPECS['dishui-lake']);
}

export function buildFutureForm(id){
 const spec=FUTURE_FORM_SPECS[id];if(!spec)return null;
 if(id==='dishui-lake')return buildLakefrontPublicBuilding();
 const form=buildApprovedConcept(id);
 // The independent review used 0.2–0.35 pixel-size units. The artwork's
 // metre-based particle shader expects its existing 0.6–0.9 size convention.
 form.sizes=Float32Array.from(form.sizes,s=>s*2.3);
 form.brightness=Float32Array.from(form.brightness,p=>p*.88);
 form.spec=spec;
 return form;
}


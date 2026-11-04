/** Authored discharge silhouette, not a sampled strike or an infrastructure route.
 * A non-periodic stepped leader and weaker connected branches replace the former
 * sinusoidal stroke. Coordinates are local 2D display units, top=1 / bottom=0.
 */
export function buildLightningForm(seed,{trunkSegments=28,branchCount=4}={}){
 if(!Number.isInteger(seed)||seed<0)throw new TypeError('Lightning seed must be a nonnegative integer');
 if(!Number.isInteger(trunkSegments)||trunkSegments<8||trunkSegments>80||!Number.isInteger(branchCount)||branchCount<1||branchCount>8)throw new TypeError('Lightning detail is outside its display budget');
 let state=(Math.imul(seed+1,2654435761)^0x9e3779b9)>>>0;
 const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 const segments=[],trunk=[[0,1]],branches=[];
 const add=(a,b,power,kind)=>segments.push({a:[...a],b:[...b],power,kind});
 let x=0;
 const lean=(random()-.5)*.15;
 for(let j=1;j<=trunkSegments;j++){
  const t=j/trunkSegments,kink=(random()-.5)*(.055+(j%7===0?.065:0));
  x=Math.max(-.27,Math.min(.27,x+kink+lean/trunkSegments));
  const p=[x,1-t];add(trunk.at(-1),p,.89+.11*(1-t),'trunk');trunk.push(p);
 }
 for(let i=0;i<branchCount;i++){
  const at=Math.floor(trunkSegments*(.19+random()*.58)),origin=trunk[at],count=5+Math.floor(random()*7),direction=random()>.5?1:-1;
  const spanX=.10+random()*.18,spanY=.12+random()*.24,branch=[origin];
  for(let j=1;j<=count;j++){
   const t=j/count,p=[origin[0]+direction*spanX*t+(random()-.5)*.035,Math.max(.02,origin[1]-spanY*t)];
   add(branch.at(-1),p,(.60-.27*t)*(1-i*.055),'branch');branch.push(p);
  }
  branches.push({originIndex:at,points:branch});
 }
 return {seed,trunk,branches,segments,originX:.23+random()*.52,topY:.90+random()*.055,height:.28+random()*.105,
  evidence:'ART branching silhouette inside the independently documented weekend thunder episode; not a detected strike'};
}

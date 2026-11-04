export const LANDMARK_LABEL_PRIORITY={'oriental-pearl':100,'shanghai-tower':99,'bund':90,'people-square':85,'jing-an-temple':80};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=text=>{let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0)/4294967296;};
const overlap=(a,b,gap=0)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
const centre=r=>({x:r.x+r.width*.5,y:r.y+r.height*.5});
const nearEdge=(r,x,y)=>({x:clamp(x,r.x,r.x+r.width),y:clamp(y,r.y,r.y+r.height)});
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;}
function isBase(c){return c.layer==='base'||c.type==='base'||c.label?.layer==='base';}
function priority(c){return (c.priority??LANDMARK_LABEL_PRIORITY[c.id]??50)+(isBase(c)?120:0);}

/**
 * Independent labels orbit their own real anchor. Candidate sectors and short
 * leaders replace the former single-column vertical-offset layout. The result
 * is deterministic so paused scenes and a seek back retain their composition.
 * `anchorSpacing` is retained as a soft preference, never a reason to discard
 * a visible named landmark. `obstacles` accepts UI rectangles in canvas pixels.
 */
export function layoutLandmarkLabels(candidates,width,height,{
 limit=10,overview=false,anchorSpacing=0,obstacles=[],marginTop=145,marginBottom=145,
}={}){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return [];
 const top=Math.min(marginTop,height*.28),bottom=Math.max(top+24,height-Math.min(marginBottom,height*.25));
 const pool=candidates.filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)&&Number.isFinite(c.z)&&c.z>-1&&c.z<1&&c.x>=16&&c.x<=width-16&&c.y>=top-45&&c.y<=bottom+50);
 const ranked=pool.map((c,index)=>({...c,_order:index,_priority:priority(c)}));
 const placed=[],blockers=obstacles.filter(o=>o&&[o.x,o.y,o.width,o.height].every(Number.isFinite));
 while(ranked.length&&placed.length<limit){
  // Preserve skyline priority, then give visible outlying places a modest
  // preference over another label on an already represented dense cluster.
  ranked.sort((a,b)=>{
   const rank=c=>c._priority>=219?c._priority:Math.min(218,c._priority+(overview&&placed.length?Math.min(16,Math.min(...placed.map(p=>Math.hypot(c.x-p.anchorX,c.y-p.anchorY)))*.09):0));
   return rank(b)-rank(a)||a._order-b._order;
  });
  const c=ranked.shift(),w=clamp(c.width??80,34,185),h=c.height??22;
  const seed=hash(c.id??c.name??c.label?.name??c._order),turn=(seed-.5)*.44;
  const angles=[-Math.PI*.5,0,Math.PI,-Math.PI*.25,-Math.PI*.75,Math.PI*.25,Math.PI*.75,Math.PI*.5];
  const rings=overview?[12,31,53,81,115,153]:[10,28,51,79,111,146];
  let best=null,bestScore=Infinity;
  for(let ri=0;ri<rings.length;ri++)for(let ai=0;ai<angles.length;ai++){
   const a=angles[(ai+Math.floor(seed*angles.length))%angles.length]+turn;
   const x=clamp(c.x+Math.cos(a)*(rings[ri]+w*.5+5)-w*.5,18,width-w-18);
   const y=c.y+Math.sin(a)*(rings[ri]+h*.5+4)-h*.5;
   const r={x,y,width:w,height:h};
   if(y<top||y+h>bottom||blockers.some(o=>overlap(r,o,5))||placed.some(o=>overlap(r,o,9)))continue;
   const edge=nearEdge(r,c.x,c.y),lineLength=Math.hypot(edge.x-c.x,edge.y-c.y),mid=centre(r);
   let score=lineLength+(Math.hypot(mid.x-c.x,mid.y-c.y)-lineLength)*.15;
   for(const other of placed){
    const m=centre(other);
    // Avoid a repeated row/column without imposing a grid or identical leaders.
    score+=Math.max(0,12-Math.abs(r.x-other.x))*2.5;
    score+=Math.max(0,9-Math.abs(mid.y-m.y))*2;
    if(intersects({x:c.x,y:c.y},edge,{x:other.anchorX,y:other.anchorY},{x:other.leaderX,y:other.leaderY}))score+=42;
    if(Math.hypot(c.x-other.anchorX,c.y-other.anchorY)<anchorSpacing)score+=6;
   }
   score+=ai*.32+ri*.25;
   if(score<bestScore){bestScore=score;best={...c,...r,anchorX:c.x,anchorY:c.y,leaderX:edge.x,leaderY:edge.y};}
  }
  if(best){delete best._order;delete best._priority;placed.push(best);}
 }
 return placed;
}

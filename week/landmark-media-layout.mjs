/** Local, screen-space placement for a single landmark's media card.
 * No modal, viewport dimming, camera changes, DOM reads or persistent state.
 * All inputs/outputs use CSS pixels. The caller projects its live 3D anchor.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const validRect=r=>r&&[r.x,r.y,r.width,r.height].every(finite)&&r.width>0&&r.height>0;
const intersection=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
const padded=(r,gap)=>({x:r.x-gap,y:r.y-gap,width:r.width+gap*2,height:r.height+gap*2});
const nearest=(r,p)=>({x:clamp(p.x,r.x,r.x+r.width),y:clamp(p.y,r.y,r.y+r.height)});

/** Size the inset independently of the city's canvas. A portrait phone never
 * inherits a desktop-sized player. Title and border take 30 CSS pixels. */
export function landmarkMediaSize({width=1280,height=720}={}){
 if(!finite(width)||!finite(height)||width<190||height<200)return null;
 const wanted=width<=700?200:280;
 const w=Math.min(wanted,width-24);
 return {width:w,height:Math.ceil(w*9/16)+30};
}

/**
 * Prefer the upper right/left of the selected building, then the sides and
 * lower sectors. UI rectangles and the model silhouette stay clear whenever
 * space permits. A small amount of UI-edge overlap is tolerated only when the
 * viewport has no completely free sector. The actual anchor is never covered.
 * previousSide gives modest hysteresis, so small camera movements do not flip
 * the player across the building. Anchors outside the viewport or clip volume
 * return null rather than docking a detached player to a screen corner.
 */
export function placeLandmarkMedia({anchor,viewport,size,obstacles=[],modelRect,previousSide}={}){
 if(!anchor||!finite(anchor.x)||!finite(anchor.y)||anchor.visible===false||!viewport)return null;
 const {width:vw,height:vh}=viewport;
 if(!finite(vw)||!finite(vh)||vw<=0||vh<=0||anchor.x<0||anchor.x>vw||anchor.y<0||anchor.y>vh)return null;
 if(finite(anchor.z)&&(anchor.z<=-1||anchor.z>=1))return null;
 const desired=size??landmarkMediaSize(viewport);
 if(!desired||!finite(desired.width)||!finite(desired.height)||desired.width<=0||desired.height<=0)return null;
 const margin=12,w=desired.width,h=desired.height;
 if(w>vw-margin*2||h>vh-margin*2)return null;
 const area=w*h,ui=obstacles.filter(validRect).map(r=>padded(r,5));
 const keepout={x:anchor.x-16,y:anchor.y-16,width:32,height:32};
 const building=validRect(modelRect)?padded(modelRect,8):{x:anchor.x-24,y:anchor.y-24,width:48,height:48};
 const sectors=['right-top','left-top','right','left','top','bottom','right-bottom','left-bottom'];
 const gaps=[22,42,70,104,146],candidates=[],seen=new Set();
 for(let ring=0;ring<gaps.length;ring++)for(let order=0;order<sectors.length;order++){
  const gap=gaps[ring],side=sectors[order];let x,y;
  if(side.startsWith('right'))x=building.x+building.width+gap;
  else if(side.startsWith('left'))x=building.x-gap-w;
  else x=anchor.x-w/2;
  if(side.endsWith('top')||side==='top')y=building.y-gap-h;
  else if(side.endsWith('bottom')||side==='bottom')y=building.y+building.height+gap;
  else y=anchor.y-h/2;
  const wantedX=x,wantedY=y;
  x=clamp(x,margin,vw-w-margin);y=clamp(y,margin,vh-h-margin);
  const key=x.toFixed(2)+','+y.toFixed(2);if(seen.has(key))continue;seen.add(key);
  const rect={x,y,width:w,height:h};if(intersection(rect,keepout)>0)continue;
  const uiOverlap=ui.reduce((sum,r)=>sum+intersection(rect,r),0)/area;
  // Hiding in a fully occupied composition is preferable to covering controls.
  if(uiOverlap>.12)continue;
  const modelOverlap=intersection(rect,building)/area,edge=nearest(rect,anchor);
  const length=Math.hypot(edge.x-anchor.x,edge.y-anchor.y);
  const moved=Math.hypot(x-wantedX,y-wantedY);
  const clean=uiOverlap===0&&modelOverlap===0;
  const score=uiOverlap*5000+modelOverlap*2200+length*.14+order*6+ring*3+moved*.24;
  candidates.push({...rect,side,score,clean,overlapRatio:uiOverlap,modelOverlapRatio:modelOverlap,leader:{x1:anchor.x,y1:anchor.y,x2:edge.x,y2:edge.y}});
 }
 if(!candidates.length)return null;
 const clean=candidates.filter(c=>c.clean),pool=clean.length?clean:candidates;
 pool.sort((a,b)=>a.score-b.score);
 let best=pool[0];
 const previous=pool.filter(c=>c.side===previousSide).sort((a,b)=>a.score-b.score)[0];
 if(previous&&previous.score<=best.score+18)best=previous;
 const {score,...result}=best;return result;
}

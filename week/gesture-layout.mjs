// Dock beside sound in every view; retain the standalone layout when no site toolbar exists.
// This module only measures and positions existing elements; it never changes interaction mode.
export function createGestureLayout({panel,onLayout=()=>{}}){
 if(!panel||!panel.style)throw new TypeError('An interaction panel is required');
 const body=document.body,ownedPanel=['left','right','top','width','max-height','box-sizing'],ownedBody=['--gesture-data-top','--gesture-data-max-height'];
 const originalPanel=new Map(ownedPanel.map(name=>[name,{value:panel.style.getPropertyValue(name),priority:panel.style.getPropertyPriority(name)}]));
 const originalBody=new Map(ownedBody.map(name=>[name,{value:body.style.getPropertyValue(name),priority:body.style.getPropertyPriority(name)}]));
 const originalCompact=panel.getAttribute('data-compact'),originalDock=panel.getAttribute('data-dock'),originalParent=panel.parentNode,originalNext=panel.nextSibling,writtenPanel=new Map(),writtenBody=new Map(),observed=new Set();
 let disposed=false,pendingFrame=0,lastSignature='',lastView=body.dataset.view;
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
 const px=value=>`${Math.round(value*1000)/1000}px`;
 const round=value=>Math.round(value*1000)/1000;
 function observe(element){if(element&&!observed.has(element)){observed.add(element);observer?.observe(element);}}
 function visible(element){
  if(!element||!element.isConnected||element.hidden)return false;
  const style=getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0;
 }
 function setPanel(name,value){if(panel.style.getPropertyValue(name)!==value)panel.style.setProperty(name,value);writtenPanel.set(name,value);}
 function setBody(name,value){if(body.style.getPropertyValue(name)!==value)body.style.setProperty(name,value);writtenBody.set(name,value);}
 function layout(){
  pendingFrame=0;if(disposed||!panel.isConnected)return;
  if(lastView!==body.dataset.view){panel.querySelector('details')?.removeAttribute('open');lastView=body.dataset.view;}
  const toolbar=document.querySelector('.site-tools'),sound=toolbar?.querySelector(':scope > [data-sound-toggle]');
  if(toolbar&&sound){
   if(panel.parentNode!==toolbar){panel.querySelector('details')?.removeAttribute('open');toolbar.insertBefore(panel,sound);}
   panel.dataset.dock='header';panel.removeAttribute('data-compact');
   for(const name of ownedPanel)setPanel(name,'');
   for(const name of ownedBody)setBody(name,originalBody.get(name).value);
   return;
  }
  if(!['artwork','art'].includes(body.dataset.view)){
   const narrow=innerWidth<=700;setPanel('left','auto');setPanel('right',narrow?'14px':'28px');setPanel('top','78px');setPanel('width',narrow?'125px':'174px');setPanel('max-height',`${Math.max(80,Math.min(240,innerHeight-100))}px`);
   if(narrow)panel.setAttribute('data-compact','narrow');else panel.removeAttribute('data-compact');return;
  }
  if(panel.dataset.dock==='header'){
   panel.querySelector('details')?.removeAttribute('open');delete panel.dataset.dock;body.append(panel);
  }
  const about=document.getElementById('about-button'),picker=document.getElementById('place-select'),data=document.getElementById('data-panel');
  const blockers=[document.querySelector('#experience .chart-area'),document.getElementById('week-legend'),document.querySelector('#experience > footer')];
  for(const element of [panel,about,picker,data,...blockers])observe(element);
  if(!visible(about)||!visible(panel))return;
  const anchor=about.getBoundingClientRect();if(anchor.width<=0||anchor.height<=0)return;
  const viewportHeight=document.documentElement.clientHeight||innerHeight,viewportWidth=document.documentElement.clientWidth||innerWidth;
  let top=anchor.bottom+6;
  if(visible(picker)){
   const rect=picker.getBoundingClientRect();
   if(rect.width>0&&rect.height>0&&rect.left<anchor.right&&rect.right>anchor.left)top=Math.max(top,rect.bottom+6);
  }
  const dataRect=data?.getBoundingClientRect(),column=dataRect&&dataRect.width>0?dataRect:anchor;
  let bottomLimit=viewportHeight-12;
  for(const blocker of blockers){
   if(!visible(blocker))continue;
   const rect=blocker.getBoundingClientRect();
   if(rect.width>0&&rect.height>0&&rect.left<column.right&&rect.right>column.left)bottomLimit=Math.min(bottomLimit,rect.top-12);
  }
  bottomLimit=Math.max(0,bottomLimit);
  const minimumStory=viewportHeight<700?96:160;
  const panelMaxHeight=Math.max(0,bottomLimit-top-12-minimumStory);
  const compact=anchor.width<100?'tiny':anchor.width<150?'narrow':null;
  if(compact!==panel.getAttribute('data-compact')){if(compact)panel.setAttribute('data-compact',compact);else panel.removeAttribute('data-compact');}
  setPanel('box-sizing','border-box');setPanel('left',px(anchor.left));setPanel('right','auto');setPanel('top',px(top));setPanel('width',px(anchor.width));setPanel('max-height',px(panelMaxHeight));
  // Measure after the width/height constraint has taken effect. ResizeObserver schedules one
  // additional pass if wrapping changes; identical dimensions never emit another onLayout.
  const actual=panel.getBoundingClientRect();
  // week.css is loaded after site.css: its mobile 23% overrides the older site's 650px 28%.
  // Compute this baseline from the viewport, never from the top that our own variable overrides.
  const baseline=viewportHeight*(viewportWidth<=700?.23:.27),dataTop=Math.max(baseline,actual.bottom+12),dataMaxHeight=Math.max(0,bottomLimit-dataTop);
  setBody('--gesture-data-top',px(dataTop));setBody('--gesture-data-max-height',px(dataMaxHeight));
  const result={left:round(actual.left),top:round(actual.top),width:round(actual.width),height:round(actual.height),maxHeight:round(panelMaxHeight),dataTop:round(dataTop),dataMaxHeight:round(dataMaxHeight),bottomLimit:round(bottomLimit),compact};
  const signature=JSON.stringify(result);if(signature!==lastSignature){lastSignature=signature;onLayout(result);}
 }
 function schedule(){if(!disposed&&!pendingFrame)pendingFrame=requestAnimationFrame(layout);}
 window.addEventListener('resize',schedule);window.addEventListener('sh2050:navigation',schedule);window.addEventListener('sh2050:language',schedule);panel.addEventListener('toggle',schedule,true);
 observe(panel);schedule();
 return {dispose(){
  if(disposed)return;disposed=true;cancelAnimationFrame(pendingFrame);observer?.disconnect();
  window.removeEventListener('resize',schedule);window.removeEventListener('sh2050:navigation',schedule);window.removeEventListener('sh2050:language',schedule);panel.removeEventListener('toggle',schedule,true);
  for(const [name,written] of writtenPanel){if(panel.style.getPropertyValue(name)!==written)continue;const original=originalPanel.get(name);if(original.value)panel.style.setProperty(name,original.value,original.priority);else panel.style.removeProperty(name);}
  for(const [name,written] of writtenBody){if(body.style.getPropertyValue(name)!==written)continue;const original=originalBody.get(name);if(original.value)body.style.setProperty(name,original.value,original.priority);else body.style.removeProperty(name);}
  if(originalCompact===null)panel.removeAttribute('data-compact');else panel.setAttribute('data-compact',originalCompact);
  if(originalDock===null)panel.removeAttribute('data-dock');else panel.setAttribute('data-dock',originalDock);
  if(originalParent?.isConnected&&panel.parentNode!==originalParent)originalParent.insertBefore(panel,originalNext?.parentNode===originalParent?originalNext:null);
 }};
}

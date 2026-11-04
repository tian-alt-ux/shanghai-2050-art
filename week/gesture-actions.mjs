// Process every camera packet, rather than animation frames, so a one-packet
// release cannot disappear on a slow-rendering city scene.
export function createGestureActions({web,onZoom=()=>{},onStop=()=>{},size=()=>({width:innerWidth,height:innerHeight})}){
 let phase='idle',point=null,anchor=null,pressStart=null,zoomAnchor=null,zoomAllowed=false;
 const pixels=p=>{const s=size();return {x:p.x*s.width,y:p.y*s.height};};
 function cancel(){web.cancel();onStop();phase='idle';point=anchor=pressStart=zoomAnchor=null;zoomAllowed=false;}
 return {
  accept(frame){
   if(!frame||!frame.tracked||frame.cancel||frame.mode==='idle'){cancel();return null;}
   const raw=pixels(frame.pointer);
   if(frame.mode==='pointer'){
    if(phase==='press'){
     if(frame.release)web.end({release:true});else web.cancel();
    }
    if(phase==='zoom')onStop();
    phase='pointer';point=raw;web.hover(point.x,point.y);return point;
   }
   if(frame.mode==='press'){
    if(phase==='pointer'){
     // Keep the last open-hand target; making a fist shifts the palm centre.
     anchor={...point};pressStart=raw;phase='press';web.begin(anchor.x,anchor.y);
    }
    if(phase!=='press')return null; // Re-arm with an open hand after interruption.
    point={x:anchor.x+raw.x-pressStart.x,y:anchor.y+raw.y-pressStart.y};
    web.move(point.x,point.y);return point;
   }
   if(frame.mode==='zoom'){
    if(phase==='pointer'){
     zoomAnchor={...point};zoomAllowed=web.zoomTarget(point.x,point.y);
     web.cancel();onStop();phase='zoom';return point;
    }
    if(phase!=='zoom'){cancel();return null;}
    if(zoomAllowed){const s=size();onZoom(frame.delta.zoom,{x:zoomAnchor.x/s.width,y:zoomAnchor.y/s.height});}
    return zoomAnchor;
   }
   cancel();return null;
  },cancel,
  get state(){return {phase,point,zoomAllowed};}
 };
}

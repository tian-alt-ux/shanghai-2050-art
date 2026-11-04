import * as THREE from '../vendor/three.module.js';

export const CITY_VIEW=Object.freeze({minDistance:28,maxDistance:2200,zoomResponse:.0022,smoothSeconds:.16,centre:[0,1,0],overviewDirection:[.12,.77,.63]});
export const nextZoomDistance=(current,delta)=>THREE.MathUtils.clamp(current*Math.exp(THREE.MathUtils.clamp(delta*CITY_VIEW.zoomResponse,-.65,.65)),CITY_VIEW.minDistance,CITY_VIEW.maxDistance);

/** Wheel easing plus cursor anchoring. Overview always settles on the city centre.
 * OrbitControls continues to handle orbit, pan and touch; only wheel is intercepted.
 */
export function createCameraNavigation(camera,controls,canvas,{isActive=()=>true,onChange=()=>{}}={}){
 const centre=new THREE.Vector3(...CITY_VIEW.centre),overviewDirection=new THREE.Vector3(...CITY_VIEW.overviewDirection).normalize();
 const ray=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-1),pointer=new THREE.Vector2(),offset=new THREE.Vector3(),before=new THREE.Vector3(),after=new THREE.Vector3(),shift=new THREE.Vector3();
 let requested=controls.getDistance(),moving=false,outward=false,overview=false,flight=null,gestureMode=null;
 controls.minDistance=CITY_VIEW.minDistance;controls.maxDistance=CITY_VIEW.maxDistance;
 function sync(){requested=controls.getDistance();moving=overview=false;flight=null;gestureMode=null;}
 function hit(out){camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);return ray.ray.intersectPlane(ground,out)&&out.distanceTo(controls.target)<7000;}
 function wheel(e){if(!isActive())return;e.preventDefault();e.stopImmediatePropagation();flight=null;gestureMode=null;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?rect.height:1);if(!moving)requested=controls.getDistance();requested=nextZoomDistance(requested,delta);outward=delta>0;overview=false;moving=true;onChange();}
 canvas.addEventListener('wheel',wheel,{passive:false,capture:true});
 // A manual drag cancels pending easing so the camera cannot fight the hand.
 canvas.addEventListener('pointerdown',sync);
 return {sync,goTo(target,offset,{duration=1.05}={}){sync();flight={from:camera.position.clone(),fromTarget:controls.target.clone(),to:target.clone().add(offset),target:target.clone(),elapsed:0,duration};onChange();},goOverview(){gestureMode=null;flight=null;requested=CITY_VIEW.maxDistance;moving=outward=overview=true;onChange();},
  gestureOrbit(dx,dy){
   if(!isActive()||!Number.isFinite(dx)||!Number.isFinite(dy))return false;
   if(gestureMode!=='orbit'){sync();gestureMode='orbit';}
   const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
   spherical.theta-=THREE.MathUtils.clamp(dx,-.08,.08)*Math.PI*1.6;
   spherical.phi=THREE.MathUtils.clamp(spherical.phi-THREE.MathUtils.clamp(dy,-.08,.08)*Math.PI*.8,Math.max(.01,controls.minPolarAngle??0),Math.min(Math.PI-.01,controls.maxPolarAngle??Math.PI*.47));
   camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));camera.lookAt(controls.target);camera.updateMatrixWorld();requested=controls.getDistance();onChange();return true;
  },
  gesturePan(dx,dy){
   if(!isActive()||!Number.isFinite(dx)||!Number.isFinite(dy))return false;
   if(gestureMode!=='pan'){sync();gestureMode='pan';}
   // Drag the ground with the hand. Distance stays constant and the target
   // remains at the same elevation, including after a landmark flight.
   camera.updateMatrixWorld();
   const distance=controls.getDistance(),height=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
   const elements=camera.matrixWorld.elements,right=new THREE.Vector3(elements[0],0,elements[2]).normalize();
   const forward=new THREE.Vector3(-elements[8],0,-elements[10]).normalize();
   const elevation=Math.max(.15,Math.abs(camera.position.y-controls.target.y)/Math.max(.001,distance));
   shift.copy(right).multiplyScalar(-THREE.MathUtils.clamp(dx,-.08,.08)*height*camera.aspect)
    .addScaledVector(forward,THREE.MathUtils.clamp(dy,-.08,.08)*height/elevation);
   camera.position.add(shift);controls.target.add(shift);camera.lookAt(controls.target);camera.updateMatrixWorld();
   requested=controls.getDistance();onChange();return true;
  },
  gestureZoom(logSpread,point={x:.5,y:.5}){
   if(!isActive()||!Number.isFinite(logSpread)||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;
   if(gestureMode!=='zoom'){sync();gestureMode='zoom';}
   pointer.set(THREE.MathUtils.clamp(point.x,0,1)*2-1,1-THREE.MathUtils.clamp(point.y,0,1)*2);
   requested=THREE.MathUtils.clamp(requested*Math.exp(-THREE.MathUtils.clamp(logSpread,-.14,.14)*1.4),CITY_VIEW.minDistance,CITY_VIEW.maxDistance);
   outward=logSpread<0;overview=false;moving=true;onChange();return true;
  },
  stopGesture(){if(!gestureMode)return;gestureMode=null;requested=controls.getDistance();moving=overview=false;onChange();},
  update(dt){
   if(flight){const f=flight;f.elapsed+=Math.min(.1,Math.max(0,dt));const t=Math.min(1,f.elapsed/f.duration),ease=t*t*t*(t*(t*6-15)+10);camera.position.lerpVectors(f.from,f.to,ease);controls.target.lerpVectors(f.fromTarget,f.target,ease);camera.lookAt(controls.target);camera.updateMatrixWorld();if(t===1){requested=controls.getDistance();flight=null;}onChange();return true;}
   let distance=controls.getDistance();
   if(!moving&&(distance<CITY_VIEW.maxDistance-.2||controls.target.distanceTo(centre)<.03))return false;
   const alpha=1-Math.exp(-Math.min(.1,Math.max(1/240,dt))/CITY_VIEW.smoothSeconds);
   const desired=moving?requested:CITY_VIEW.maxDistance;
   let next=distance+(desired-distance)*alpha;
   if(Math.abs(desired-next)<.08)next=desired;
   const anchor=!overview&&moving&&(!outward||distance<CITY_VIEW.maxDistance*.68)&&hit(before);
   offset.copy(camera.position).sub(controls.target).normalize();
   const alignOverview=overview||(outward&&next>CITY_VIEW.maxDistance*.85);
   if(alignOverview)offset.lerp(overviewDirection,alpha*2).normalize();
   camera.position.copy(controls.target).addScaledVector(offset,next);camera.lookAt(controls.target);camera.updateMatrixWorld();
   if(anchor&&hit(after)){shift.copy(before).sub(after);shift.y=0;camera.position.add(shift);controls.target.add(shift);}
   if((outward||overview||!moving)&&next>CITY_VIEW.maxDistance*.68){
    const u=THREE.MathUtils.smoothstep(next,CITY_VIEW.maxDistance*.68,CITY_VIEW.maxDistance*.99);
    shift.copy(centre).sub(controls.target).multiplyScalar(Math.min(1,alpha*(1+u*5))*u);camera.position.add(shift);controls.target.add(shift);
    if(next===CITY_VIEW.maxDistance&&controls.target.distanceTo(centre)<.03){shift.copy(centre).sub(controls.target);camera.position.add(shift);controls.target.copy(centre);}
   }
   camera.lookAt(controls.target);camera.updateMatrixWorld();
   const settled=next===desired&&(!alignOverview||offset.distanceTo(overviewDirection)<.001)&&(!(outward||overview)||next<CITY_VIEW.maxDistance*.99||controls.target.distanceTo(centre)<.03);
   if(settled){moving=false;overview=false;}
   onChange();return true;
  },get state(){return {requested,moving:moving||!!flight,flying:!!flight,gestureMode,maxDistance:CITY_VIEW.maxDistance,target:controls.target.toArray(),distance:controls.getDistance()};},dispose(){canvas.removeEventListener('wheel',wheel,true);canvas.removeEventListener('pointerdown',sync);}};
}

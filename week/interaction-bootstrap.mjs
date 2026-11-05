import {createGestureInput} from './gesture-input.mjs';

// The same tested hand controller mounts before the large city assets download.
// A completed city supplies callbacks once; before then only home-page actions run.
const city=()=>window.SH2050_GESTURE_CITY;
const call=(name,...args)=>city()?.[name]?.(...args);
if(!window.SH2050_GESTURE){
 window.SH2050_GESTURE=createGestureInput({
  isActive:()=>!!call('isActive'),isFlying:()=>!!call('isFlying'),
  onOrbit:(...args)=>call('onOrbit',...args),onPan:(...args)=>call('onPan',...args),
  onCanvasClick:(...args)=>call('onCanvasClick',...args),onZoom:(...args)=>call('onZoom',...args),
  onStop:()=>call('onStop'),onLayout:()=>call('onLayout'),
  onHomeOrbit:(dx,dy)=>window.SH2050_GLOBE?.gestureOrbit?.(dx,dy),
  onHomeClick:()=>window.SH2050_GLOBE?.gestureClick?.(),
  getLanguage:()=>window.SH2050?.getLanguage?.()??(document.documentElement.lang.startsWith('zh')?'zh':'en'),
 });
}

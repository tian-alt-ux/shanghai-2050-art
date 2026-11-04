/** Fixed ART rain legibility policy. Source millimetres/hour are never rewritten. */
export const RAIN_DISPLAY=Object.freeze({maxDrops:6400,referenceMm:6,minStrokePx:5.5,maxStrokePx:20.5,source:'ERA5 reference; stroke positions and projected scale are ART'});
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
export function rainDisplayState(rainMm,viewScale=1,{cityRoofTop=16}={}){
 if(!Number.isFinite(rainMm)||rainMm<0)throw new TypeError('Rain amount must be a finite, nonnegative source value');
 if(!Number.isFinite(viewScale)||viewScale<=0)throw new TypeError('View scale must be finite and positive');
 if(!Number.isFinite(cityRoofTop)||cityRoofTop<0)throw new TypeError('Visible roof height must be finite and nonnegative');
 const intensity=clamp(Math.log1p(rainMm)/Math.log1p(RAIN_DISPLAY.referenceMm)),scale=clamp(viewScale,1,18);
 // Height is a display volume above the tallest visible rendered roof, not an
 // inferred cloud base. A soft, varied lower end avoids a luminous floor line.
 const height=64*Math.pow(scale,.60),top=cityRoofTop+height,bottom=-Math.max(4,height*.09);
 return {rainMm,intensity,count:rainMm===0?0:Math.max(1,Math.floor(RAIN_DISPLAY.maxDrops*Math.sqrt(intensity))),opacity:rainMm===0?0:.30+.40*intensity,span:90*scale,height,top,bottom,cityRoofTop};
}
export function makeRainSeeds(count=RAIN_DISPLAY.maxDrops){
 if(!Number.isInteger(count)||count<0||count>RAIN_DISPLAY.maxDrops)throw new TypeError('Rain seed count is outside the display budget');
 const data=new Float32Array(count*4);let state=20261101;
 for(let i=0;i<data.length;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;data[i]=state/4294967296;}
 return data;
}

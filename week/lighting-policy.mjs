/** Preserve a subpixel particle's light energy when a GPU enforces a minimum point size. */
export const POINT_ENERGY_GLSL=`float pointEnergy(float projectedSize,float renderedSize){return min(1.,pow(projectedSize/max(renderedSize,.001),2.));}`;
export function pointEnergy(projectedSize,renderedSize){
 if(!Number.isFinite(projectedSize)||!Number.isFinite(renderedSize)||projectedSize<0||renderedSize<=0)throw new TypeError('Point sizes must be finite and nonnegative, with a positive rendered size');
 return Math.min(1,(projectedSize/renderedSize)**2);
}

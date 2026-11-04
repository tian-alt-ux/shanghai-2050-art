/**
 * One display envelope for the complete city, expressed in rendered world units.
 * The supplied context mesh spans approximately [-150, 150] in X/Z.
 * This is an ART visibility field, not an administrative or hydrological boundary.
 * Apply the result to fragment alpha; reducing point size alone cannot fade 1px points.
 */
export const HORIZON_FIELD=Object.freeze({
  scaleX:103,scaleZ:117,falloffPower:3,falloffStrength:1.25,
  angularAmplitude3:.10,angularAmplitude5:.06,
  edgeSafetyStart:128,edgeSafetyEnd:149.5,
  sourceExtent:150,evidenceKind:'ART',
});

/** Smooth, directionally varied long tail. Only actual asset edges reach zero. */
export const CITY_FADE_GLSL=`
uniform vec2 cityFocus;
uniform float cityScale;
uniform float cityDetail;
float cityFade(vec2 worldPoint){
  vec2 p=(worldPoint-cityFocus)/max(cityScale,0.2);
  float angle=atan(p.y,p.x+0.00001);
  float spread=1.0+0.10*sin(angle*3.0+0.4)+0.06*cos(angle*5.0-1.1);
  float distanceFromCity=length(p/vec2(103.0,117.0))*spread;
  float atmosphere=exp(-1.25*pow(distanceFromCity,3.0));
  // The tail is already faint before this guard hides the real clipped asset edges.
  vec2 guard=vec2(1.0)-smoothstep(vec2(128.0),vec2(149.5),abs(p));
  return atmosphere*guard.x*guard.y;
}
`;

// Shared shader uniforms follow the current area of exploration, revealing real regional LOD.
export const CITY_FADE_UNIFORMS={cityFocus:{value:{x:0,y:0}},cityScale:{value:1},cityDetail:{value:1}};

const smoothstep=(a,b,x)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};

/** CPU equivalent used for validation, labels, or non-shader display elements. */
export function cityFadeAt(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError('City fade coordinates must be finite');
  const angle=Math.atan2(z,x+.00001);
  const spread=1+.10*Math.sin(angle*3+.4)+.06*Math.cos(angle*5-1.1);
  const distance=Math.hypot(x/103,z/117)*spread;
  const atmosphere=Math.exp(-1.25*distance**3);
  const guardX=1-smoothstep(128,149.5,Math.abs(x));
  const guardZ=1-smoothstep(128,149.5,Math.abs(z));
  return atmosphere*guardX*guardZ;
}

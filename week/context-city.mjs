import * as THREE from 'three';
import {CITY_FADE_GLSL,CITY_FADE_UNIFORMS} from './horizon-field.mjs';
import {POINT_ENERGY_GLSL} from './lighting-policy.mjs';
import {projectGeo} from './regional-city.mjs';
import {buildLandmarkForm,landmarkDisplayMaximum,landmarkDisplayLocalMaximum,landmarkDisplayNear,landmarkDisplayScale,LANDMARK_DISPLAY,LANDMARK_PLACE_DISPLAY} from './landmark-forms.mjs';
import {placeLandmarkForm} from './landmark-placement.mjs';

// The base-city landmarks remain visible when all three observation layers are off.
// Local surface particles replace the previous candidate wire cage and scanning circles.
export async function loadContext(scene,permanentParent,landmarks){
 const group=new THREE.Group();group.name='permanent-landmark-particles';(permanentParent??scene).add(group);
 const positions=[],brightness=[],sizes=[],phases=[],anchors=[],displayNear=[],displayMaximum=[],overviewMaximum=[],skyline=[],forms=[],footprints=[];
 const byId=new Map();
 for(const place of landmarks){
  const form=placeLandmarkForm(place.id,buildLandmarkForm(place.id));if(!form)continue;
  const geographicAnchor=projectGeo(place.lon,place.lat),shift=form.anchorOffsetM??[0,0,0];
  const anchor=[geographicAnchor[0]+shift[0]*.02,geographicAnchor[1]+shift[1]*.02,geographicAnchor[2]+shift[2]*.02],offset=positions.length/3;
  for(let i=0;i<form.pointCount;i++){
   positions.push(anchor[0]+form.positions[i*3]*.02,.035+form.positions[i*3+1]*.02,anchor[2]+form.positions[i*3+2]*.02);
   anchors.push(anchor[0],.035,anchor[2]);displayNear.push(landmarkDisplayNear(place.id));displayMaximum.push(landmarkDisplayLocalMaximum(place.id));overviewMaximum.push(landmarkDisplayMaximum(place.id));skyline.push(place.id==='shanghai-tower'||place.id==='oriental-pearl'?1:0);
   // Dense new facades stay transparent; recognisable high-power edges remain bright.
   // Preserve the accepted Pearl's original light response as well as its geometry.
   const sparkle=i%173===0,power=place.id==='oriental-pearl'?form.brightness[i]:Math.pow(form.brightness[i],1.35);
   brightness.push(power*(sparkle?1.6:1));sizes.push(form.sizes[i]*(sparkle?1.7:1));phases.push((i*2.3999632297)%6.2831853);
  }
  place.labelHeight=Math.max(1.2,form.boundsM[1][1]*.02+.4);place.displayLabelHeight=place.labelHeight;place.displayScale=1;place.modelSamples=0;place.artworkParticleCount=form.pointCount;
  place.formEvidence=form.spec.evidence;
  const future=form.spec.status==='authored-2050-concept';
  place.noteZh+=(future?' 银白形态依据用户确认的2050概念场景制作，外观与布局为创作设想。':' 银白形态为参考建筑特征的参数化粒子意象，不是测绘网格或照片三维重建。');
  place.noteEn+=(future?' The silver form follows the user-approved 2050 concept; its architecture and layout are authored proposals.':' The silver silhouette is an authored parametric particle interpretation, not a surveyed mesh or photogrammetric reconstruction.');
  if(LANDMARK_PLACE_DISPLAY.ranges[place.id]){
   place.noteZh+=' 为便于观看，白色场所意象采用近景至总览的有限展示放大；真实经纬度和源米制形体不变，不代表建筑实际高度或占地变大。';
   place.noteEn+=' The low-rise place motif has a bounded display exaggeration for legibility, retaining its geographic anchor and source metre geometry; its displayed size is not a physical measurement.';
  }
  if(place.id==='shanghai-tower'||place.id==='oriental-pearl'){
   place.artworkFootprint={radiusX:place.id==='shanghai-tower'?1.22:.79,radiusZ:place.id==='shanghai-tower'?1.22:.79,rotation:0};
   footprints.push({id:place.id,x:anchor[0],z:anchor[2],...place.artworkFootprint});
  }
  const record={id:place.id,offset,count:form.pointCount,anchorWorld:anchor,geographicAnchorWorld:geographicAnchor,boundsM:form.boundsM,viewDirection:form.viewDirection,evidence:form.spec.evidence,reference:form.spec.reference,sources:form.spec.sources,place};
  forms.push(record);byId.set(place.id,record);
 }
 const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)).setAttribute('brightness',new THREE.Float32BufferAttribute(brightness,1)).setAttribute('size',new THREE.Float32BufferAttribute(sizes,1)).setAttribute('phase',new THREE.Float32BufferAttribute(phases,1)).setAttribute('anchor',new THREE.Float32BufferAttribute(anchors,3)).setAttribute('displayNear',new THREE.Float32BufferAttribute(displayNear,1)).setAttribute('displayMaximum',new THREE.Float32BufferAttribute(displayMaximum,1)).setAttribute('overviewMaximum',new THREE.Float32BufferAttribute(overviewMaximum,1)).setAttribute('skyline',new THREE.Float32BufferAttribute(skyline,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{...CITY_FADE_UNIFORMS,time:{value:0},gain:{value:.72}},vertexShader:`${CITY_FADE_GLSL} ${POINT_ENERGY_GLSL}
 attribute float brightness,size,phase,displayNear,displayMaximum,overviewMaximum,skyline;attribute vec3 anchor;uniform float time,gain;varying float alpha;
 void main(){float eyeDistance=length(cameraPosition-anchor);
 float overview=smoothstep(${LANDMARK_DISPLAY.farWorld.toFixed(1)},${LANDMARK_DISPLAY.overviewWorld.toFixed(1)},eyeDistance);
 float towerBoost=1.+(displayMaximum-1.)*smoothstep(${LANDMARK_DISPLAY.nearWorld.toFixed(1)},${LANDMARK_DISPLAY.farWorld.toFixed(1)},eyeDistance)+(overviewMaximum-displayMaximum)*overview;
 float placeBoost=mix(displayNear,displayMaximum,smoothstep(${LANDMARK_PLACE_DISPLAY.nearWorld.toFixed(1)},${LANDMARK_PLACE_DISPLAY.farWorld.toFixed(1)},eyeDistance));
 float distanceBoost=mix(placeBoost,towerBoost,skyline);
 vec3 displayed=anchor+(position-anchor)*distanceBoost;
 vec4 world=modelMatrix*vec4(displayed,1.);vec4 view=viewMatrix*world;gl_Position=projectionMatrix*view;
 float rawSize=size*210.*projectionMatrix[1][1]*.45*distanceBoost/max(12.,-view.z);gl_PointSize=clamp(rawSize,1.,4.2);
 float skylineReadability=1.+.45*overview*skyline;
 alpha=brightness*gain*skylineReadability*(.83+.17*sin(time*.7+phase))*cityFade(world.xz)*pointEnergy(rawSize,gl_PointSize);}
 `,fragmentShader:'varying float alpha;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.84,.92,1.,alpha*exp(-r*r*5.));}'});
 const points=new THREE.Points(geometry,material);points.name='silver-landmark-surfaces';points.renderOrder=4;points.frustumCulled=false;group.add(points);
 function displayScaleAt(id,cameraPosition){
  const form=byId.get(id);if(!form||!cameraPosition)return 1;
  const p=cameraPosition.position??cameraPosition;
  const x=p.x??p[0],y=p.y??p[1],z=p.z??p[2];
  return landmarkDisplayScale(id,Math.hypot(x-form.anchorWorld[0],y-.035,z-form.anchorWorld[2]));
 }
 function displayTopAt(id,cameraPosition){
  const form=byId.get(id);if(!form)return 1.2;
  return Math.max(1.2,.035+form.boundsM[1][1]*.02*displayScaleAt(id,cameraPosition)+.4);
 }
 return {group,points,forms,footprints,displayScaleAt,displayTopAt,update(hour,view){
  material.uniforms.time.value=hour*.65;
  const camera=view?.camera??view;if(camera)for(const form of forms){form.place.displayScale=displayScaleAt(form.id,camera);form.place.displayLabelHeight=displayTopAt(form.id,camera);}
 }};
}

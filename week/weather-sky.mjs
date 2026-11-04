import * as THREE from 'three';
import {CITY_FADE_UNIFORMS} from './horizon-field.mjs';
import {RAIN_DISPLAY,rainDisplayState,makeRainSeeds} from './rain-display.mjs';
import {buildLightningForm} from './lightning-form.mjs';

/**
 * Reference rain, with no cloud/fog/solar backdrop. The data sample still carries
 * cloud/radiation metadata for the sidebar. Visible drop spacing, length and
 * slow-motion speed are ART display choices, not neighbourhood rain measurements.
 */
export function makeWeatherSky(parent,reference){
 if(typeof reference?.at!=='function')throw new TypeError('makeWeatherSky requires createSkyReference(...)');
 const group=new THREE.Group();group.name='TIDE / reference rain without haze';parent.add(group);
 // Retain the public property for older callers, but never render a sky blanket.
 const backdrop=new THREE.Group();backdrop.name='Cloud and fog backdrop removed';backdrop.visible=false;group.add(backdrop);

 const seeds=makeRainSeeds(RAIN_DISPLAY.maxDrops),corners=[[-1,0],[1,0],[-1,1],[-1,1],[1,0],[1,1]],vertices=[],attributes=[];
 for(let i=0;i<RAIN_DISPLAY.maxDrops;i++)for(const corner of corners){vertices.push(...corner,0);attributes.push(...seeds.subarray(i*4,i*4+4));}
 const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)).setAttribute('dropSeed',new THREE.Float32BufferAttribute(attributes,4));
 const uniforms={hour:{value:0},rain:{value:0},opacity:{value:0},span:{value:90},height:{value:64},rainTop:{value:80},rainBottom:{value:-5.76},focus:{value:new THREE.Vector2()},wind:{value:new THREE.Vector2()},resolution:{value:new THREE.Vector2(1280,720)}};
 const rainMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms,
  vertexShader:`
   attribute vec4 dropSeed;uniform float hour,rain,opacity,span,height,rainTop,rainBottom;
   uniform vec2 focus,wind,resolution;varying float across,along,alpha;
   void main(){
    float layer=floor(dropSeed.w*3.);float nearWeight=layer/2.;
    float radius=sqrt(dropSeed.x)*span*1.18,angle=dropSeed.y*6.2831853;
    vec2 drift=wind*hour*.07;
    // A round, soft display footprint follows the map focus. Wind is ERA5's
    // vector; the phase and drop positions are deterministic authored samples.
    vec2 ground=focus+vec2(cos(angle),sin(angle))*radius+sin(drift*.035+dropSeed.z*7.)*span*.025;
    float fall=fract(dropSeed.z-hour*(.47+dropSeed.w*.30));
    float top=rainTop+height*(dropSeed.w-.5)*.12;
    float bottom=rainBottom-height*dropSeed.x*.08;
    float y=mix(bottom,top,fall);
    vec3 world=vec3(ground.x,y,ground.y);
    vec4 clip=projectionMatrix*viewMatrix*vec4(world,1.);
    vec3 delta=vec3(wind.x*.075,-1.,wind.y*.075)*max(1.,height*.07);
    vec4 below=projectionMatrix*viewMatrix*vec4(world+delta,1.);
    vec2 flow=(below.xy/below.w-clip.xy/clip.w)*resolution;
    float flowLength=length(flow);vec2 direction=flowLength>.001?flow/flowLength:normalize(vec2(wind.x*.035,-1.));
    vec2 normal=vec2(-direction.y,direction.x);
    // Projected, bounded stroke sizes prevent subpixel rain disappearing when
    // zoomed out. This changes legibility, never the physical source rain value.
    float lengthPx=mix(5.5,15.5,dropSeed.w)+rain*5.;
    float halfWidth=mix(.32,.66,nearWeight);
    clip.xy+=(direction*position.y*lengthPx+normal*position.x*halfWidth)*2./resolution*clip.w;
    gl_Position=clip;
    across=position.x;along=position.y;
    float edge=exp(-pow(radius/(span*.90),4.));
    // Rain is a tall, populated volume above roofs. Its non-planar soft lower
    // tail disappears through the city instead of ending on one bright horizon.
    float vertical=smoothstep(bottom,bottom+height*.14,y)*(1.-smoothstep(top-height*.10,top,y));
    alpha=opacity*edge*vertical*mix(.58,1.,nearWeight);
    if(clip.w<=.1){gl_Position=vec4(2.,2.,2.,1.);alpha=0.;}
   }`,
  fragmentShader:`varying float across,along,alpha;void main(){
   float stroke=pow(max(0.,1.-abs(across)),.6);
   float ends=smoothstep(0.,.10,along)*(1.-smoothstep(.62,1.,along));
   float a=alpha*stroke*ends;if(a<.003)discard;
   gl_FragColor=vec4(.36,.70,1.,a);
  }`
 });
 const curtain=new THREE.Mesh(geometry,rainMaterial);curtain.name='Readable wind-driven reference rain';curtain.frustumCulled=false;curtain.renderOrder=8;curtain.visible=false;geometry.setDrawRange(0,0);group.add(curtain);

 // Connected stepped leaders, fine branches and a bright narrow return stroke.
 // The small ribbon glow stays around the discharge: no cloud/fog backdrop.
 const flashUniforms={flash:{value:0},aspect:{value:1},gain:{value:1},resolution:{value:new THREE.Vector2(1280,720)},origin:{value:new THREE.Vector2(.5,.94)},height:{value:.34}};
 const flashGeometry=new THREE.BufferGeometry();
 const flashMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:flashUniforms,
  vertexShader:`attribute vec2 tangent;attribute float edge,power;uniform float aspect,height;uniform vec2 origin,resolution;varying float across,strength;
   vec2 screen(vec2 p){return vec2(origin.x+p.x*.44/aspect,origin.y-(1.-p.y)*height)*2.-1.;}
   void main(){vec2 p=screen(position.xy),q=screen(position.xy+tangent);vec2 d=(q-p)*resolution;vec2 normal=normalize(vec2(-d.y,d.x)+vec2(.000001));
    float width=power>.8?4.6:2.7;p+=normal*edge*width*2./resolution;gl_Position=vec4(p,0.,1.);across=edge;strength=power;}`,
  fragmentShader:`varying float across,strength;uniform float flash,gain;
   void main(){float core=exp(-abs(across)*9.),glow=exp(-across*across*3.8)*.16;
    float a=(core*3.+glow)*strength*flash*gain;if(a<.002)discard;
    vec3 color=mix(vec3(.39,.65,1.),vec3(.97,.985,1.),core);gl_FragColor=vec4(color,a);
   }`
 });
 const lightning=new THREE.Mesh(flashGeometry,flashMaterial);lightning.frustumCulled=false;lightning.renderOrder=9;lightning.visible=false;lightning.name='ART branching discharge without cloud blanket';group.add(lightning);
 let formSeed=-1,form;
 function rebuildLightning(seed){
  form=buildLightningForm(seed);formSeed=seed;
  const p=[],tangent=[],edge=[],power=[],index=[];
  for(const segment of form.segments){const start=p.length/3,dx=segment.b[0]-segment.a[0],dy=segment.b[1]-segment.a[1];
   for(const endpoint of [segment.a,segment.a,segment.b,segment.b])p.push(...endpoint,0);
   for(let i=0;i<4;i++){tangent.push(dx,dy);edge.push(i%2?-1:1);power.push(segment.power);}
   index.push(start,start+1,start+2,start+1,start+3,start+2);
  }
  flashGeometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3)).setAttribute('tangent',new THREE.Float32BufferAttribute(tangent,2)).setAttribute('edge',new THREE.Float32BufferAttribute(edge,1)).setAttribute('power',new THREE.Float32BufferAttribute(power,1));flashGeometry.setIndex(index);
  flashUniforms.origin.value.set(form.originX,form.topY);flashUniforms.height.value=form.height;
 }

 let latest;
 function update(hour,weather={},view={}){
  const sample=reference.at(hour,weather),display=rainDisplayState(sample.rainMm,CITY_FADE_UNIFORMS.cityScale.value,{cityRoofTop:Math.max(0,view.cityRoofTop??16)});
  latest={...sample,cloudBackdrop:false,rainVisualCount:display.count,rainVolumeTop:display.top,rainVolumeBottom:display.bottom,cityRoofTop:display.cityRoofTop};
  const focus=view.focus??CITY_FADE_UNIFORMS.cityFocus.value,gain=view.gain??1;
  uniforms.hour.value=hour;uniforms.rain.value=display.intensity;uniforms.opacity.value=display.opacity*gain;
  uniforms.span.value=display.span;uniforms.height.value=display.height;
  uniforms.rainTop.value=display.top;uniforms.rainBottom.value=display.bottom;
  uniforms.focus.value.set(focus.x??0,focus.z??focus.y??0);
  uniforms.wind.value.set(weather.windEastMps??0,-(weather.windNorthMps??0));
  const width=view.width??(typeof innerWidth==='number'?innerWidth:1280),height=view.height??(typeof innerHeight==='number'?innerHeight:720);
  uniforms.resolution.value.set(Math.max(1,width),Math.max(1,height));
  geometry.setDrawRange(0,display.count*6);curtain.visible=display.count>0;
  const flash=view.reducedMotion?0:sample.lightning;
  if(sample.lightningSeed>0&&sample.lightningSeed!==formSeed)rebuildLightning(sample.lightningSeed);
  flashUniforms.flash.value=flash;flashUniforms.gain.value=gain;flashUniforms.resolution.value.set(width,height);
  flashUniforms.aspect.value=view.camera?.aspect??width/height;lightning.visible=flash>.005;
  return latest;
 }
 return {group,backdrop,curtain,lightning,update,get sample(){return latest;},dispose(){geometry.dispose();rainMaterial.dispose();lightning.geometry.dispose();flashMaterial.dispose();group.removeFromParent();}};
}


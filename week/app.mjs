import {loadRegional,projectGeo} from './regional-city.mjs?v=20261105-stability';
import {createRegionalTraffic} from './regional-traffic.mjs';
import {CITY_FADE_UNIFORMS,cityFadeAt} from './horizon-field.mjs';
import {placeNarrative,facilityNarrative} from './place-narratives.mjs';
import {applyProjectAboutDialog} from './project-copy.mjs';
import {createCameraNavigation} from './camera-navigation.mjs';
import {createResourceLoader} from './resource-loader.mjs?v=20261105-stability';
import {createWeatherReference} from './weather-reference.mjs';
import {loadContext} from './context-city.mjs';
import {landmarkDisplayNear} from './landmark-forms.mjs';
import {createLandmarkMedia} from './landmark-media.mjs?v=20261105-stability';
import {makeSignals} from './signal-visuals.mjs';
import {dataArtCopy,trafficCaption} from './week-copy.mjs';
import {makePulseCityField} from './pulse-city-field.mjs';
import {layoutLandmarkLabels,LANDMARK_LABEL_PRIORITY} from './landmark-label-layout.mjs';
import {createSkyReference} from './weather-sky-reference.mjs';
import {makeWeatherSky} from './weather-sky.mjs';
import {createSignalNetwork} from './signal-topology.mjs';
import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {createTrafficSimulation} from './traffic-engine.mjs';
import {signalState} from './projects-signal.mjs';
import {weekTime,storyAt,clampHour,advanceWeek} from './week-state.mjs';
import {unit,world,particles,makeTide,makeWaterMask,makeHeat,makeRoads,makeBloom} from './visuals.mjs';

const $=id=>document.getElementById(id),query=new URLSearchParams(location.search),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys=['nature','culture','cloud'];
const state={hour:65.5,playing:true,speed:4,layers:{nature:true,culture:true,cloud:true},lang:document.documentElement.lang.startsWith('zh')?'zh':'en',ready:false,focusPlace:null};
if(query.has('hour'))state.hour=clampHour(Number(query.get('hour')));
if(['tide','pulse','signal'].includes(query.get('scene'))){const key={tide:'nature',pulse:'culture',signal:'cloud'}[query.get('scene')];keys.forEach(k=>state.layers[k]=k===key);}
const groups=Object.fromEntries(keys.map(k=>[k,new THREE.Group()]));
const landmarkBase=new THREE.Group();
let contextCity,weather,skyReference,sky,pulseField,regionalCity,regionalTraffic,regionalHeat,regionalRoads,landmarkMedia,landmarks=[];
let renderer,scene,camera,controls,cameraNav,bloom,model,buildings,tide,heat,roads,signals,activity;
let network,catalog,signalNetwork,week,triangleMap,traffic,sig,env;
let lastTick=0,lastUi=-1,lastSample='',lastHeatSample='',dirty=true,labels=[],charts=[];
const active=()=>!document.hidden&&document.body.dataset.view==='artwork'&&!document.querySelector('dialog[open]');
const zh=()=>state.lang==='zh';
const say=(a,b)=>zh()?a:b;
const resources=createResourceLoader({onProgress:value=>window.SH2050_BOOT?.progress(value)});
const fetchJSON=name=>resources.json(`${name}.json`);
function conditionAt(h){const f=week.frames[Math.min(672,Math.floor(Math.max(0,h)*4))];return {rainIndex:weather.weatherAt(h).rainIndex,trafficPressure:f.totals.meanPressure??Math.min(1,f.totals.queue/400)};}
function addLabel(name,en,position,layer,detail,id){const b=document.createElement('button'),leader=document.createElement('i');b.className='landmark';if(id==='oriental-pearl'||id==='shanghai-tower')b.classList.add('skyline-label');leader.className='landmark-leader';b.type='button';b.onclick=()=>id?focusPlace(id):inspect(name,en,detail);$('landmarks').append(leader,b);labels.push({b,leader,name,en,position,layer,id});}
function inspect(title,en,description){$('place-name').textContent=say(title,en);$('place-coord').textContent='SHANGHAI / 2050 · PLACE & RHYTHM';$('place-description').textContent=typeof description==='string'?description:say(...description);$('place-dialog').querySelector('.credit').textContent=say('城市记忆 · 日常连接','CITY MEMORY · EVERYDAY CONNECTIONS');$('place-dialog').showModal();}
function clearPlace(){landmarkMedia?.close();state.focusPlace=null;document.body.classList.remove('place-focused');if(state.ready)refreshUI();}
function focusedNarrative(){if(!state.focusPlace)return null;if(state.focusPlace==='district')return {title:say('一处日常街区','AN EVERYDAY NEIGHBOURHOOD'),lead:say('没有被命名的建筑，也承载着一座城市的日常。','Buildings without famous names also carry a city’s everyday life.'),body:say('往返、停留与服务在街区交织。潮让天气变化被看见，脉呈现街道压力与活动的聚散，讯把这一片生活与更远处联系起来。晴雨之间，回家、购物与邻里相遇仍在继续，普通街区也有自己的城市节律。','Journeys, pauses and services meet in this neighbourhood. TIDE reveals weather, PULSE shows changing street pressure and activity, and SIGNAL connects everyday needs to other parts of the city. Through sun and rain, homeward journeys, shopping and encounters between neighbours continue, giving ordinary streets their own urban rhythm.')};const place=landmarks.find(l=>l.id===state.focusPlace);if(place)return placeNarrative(place.id,state.lang,state.hour,weather.weatherAt(state.hour));const n=signalNetwork.nodes.find(n=>'signal:'+n.id===state.focusPlace);return n?facilityNarrative(n,state.lang,state.hour,weather.weatherAt(state.hour)):null;}
function renderFocusedPlace(){const info=focusedNarrative();$('place-clear').hidden=!info;document.body.classList.toggle('place-focused',!!info);if(!info)return;$('news-date').textContent='2050';$('news-title').textContent=say('地点与城市的节律','PLACE / CITY RHYTHMS');const h=document.createElement('h3'),lead=document.createElement('p'),body=document.createElement('p'),rhythm=document.createElement('small');h.textContent=info.title;lead.textContent=info.lead;body.textContent=info.body;rhythm.className='rhythm-caption';rhythm.textContent=info.rhythm??info.theme??'';$('words').replaceChildren(h,lead,body,rhythm);}
function focusPlace(id){
 if(id==='all'){clearPlace();$('week-extent').click();return;}
 if(id==='central'||!id){clearPlace();reset();return;}
 const place=landmarks.find(l=>l.id===id);let position,offset;
 if(place){
  const skyline=['shanghai-tower','oriental-pearl'].includes(id),form=contextCity.forms.find(f=>f.id===id);
  position=new THREE.Vector3(...projectGeo(place.lon,place.lat));
  if(skyline){position.y=4;offset=new THREE.Vector3(18,26,45);}
  else if(form){
   const near=landmarkDisplayNear(id),span=Math.max(form.boundsM[1][0]-form.boundsM[0][0],form.boundsM[1][2]-form.boundsM[0][2])*.02*near;
   position.y=.035+form.boundsM[1][1]*.02*near*.4;
   offset=new THREE.Vector3(...(form.viewDirection??[24,34,58])).normalize().multiplyScalar(THREE.MathUtils.clamp(span*3.6,36,66));
  }else{position.y=1;offset=new THREE.Vector3(24,34,58);}
 }else{
  const i=signalNetwork.nodes.findIndex(n=>'signal:'+n.id===id);if(i<0)return;
  position=signals.positions[i].clone();position.y=Math.min(4,position.y*.4);offset=new THREE.Vector3(26,37,62);
 }
 state.focusPlace=id;$('place-select').value=place?id:'';
 if(place)landmarkMedia?.open({...place,labelEn:placeNarrative(id,'en')?.title??place.labelEn},state.hour,state.lang);else landmarkMedia?.close();
 cameraNav.goTo(position,offset);dirty=true;refreshUI();
}

function reset(){landmarkMedia?.close();camera.position.set(36,52,86);controls.target.set(0,1,0);controls.update();cameraNav?.sync();dirty=true;}
function makeActivity(){const p=[],c=[],sizes=[];const nodes=signalNetwork.nodes.filter(n=>n.isLandmark&&n.type==='culture');for(let i=0;i<2500;i++){const n=nodes[i%nodes.length],r=.4+(i*1.618%1)*2.5,angle=i*2.399;p.push(n.x*unit+Math.cos(angle)*r,.35+(i%7)*.08,-n.y*unit+Math.sin(angle)*r);c.push(1,.37,.09);sizes.push(.8+(i%11)*.08);}activity=particles(p,c,sizes,groups.culture);}
function setupUI(){
 document.body.dataset.week='true';document.querySelector('.edition').classList.add('week-edition');document.querySelector('.edition').setAttribute('aria-label','SHANGHAI 2050');document.body.dataset.mode='culture';$('data-panel').removeAttribute('aria-hidden');
 document.querySelector('.layers').setAttribute('aria-label','Independent TIDE PULSE SIGNAL layers');
 const strip=document.createElement('div');strip.id='week-strip';strip.innerHTML='<div id="week-days"></div><div class="week-track"></div>';
 const transport=document.querySelector('.transport');transport.insertBefore(strip,$('reset'));strip.append($('timeline'));
 $('timeline').min=0;$('timeline').max=168;$('timeline').step=.05;$('timeline').value=state.hour;
 const speed=document.createElement('button');speed.id='week-speed';speed.textContent='4 h/s';speed.title='Playback speed';transport.insertBefore(speed,$('reset'));const extent=document.createElement('button');extent.id='week-extent';extent.textContent='↔';extent.title='回到市中心总览 / Centred city overview';extent.onclick=()=>{clearPlace();cameraNav.goOverview();};transport.insertBefore(extent,$('reset'));
 speed.onclick=()=>{state.speed=state.speed===4?8:state.speed===8?1:4;speed.textContent=`${state.speed} h/s`;};
 const legend=document.createElement('div');legend.id='week-legend';document.querySelector('#experience').append(legend);
 const notes=document.createElement('button');notes.id='week-notes';notes.onclick=()=>$('week-data').showModal();document.querySelector('.status').append(notes);
 const d=document.createElement('dialog');d.id='week-data';d.innerHTML='<button class="dialog-close" type="button">×</button><p class="eyebrow">SHANGHAI / 2050 · DATA & ART</p><h1></h1><div id="week-data-copy"></div>';document.body.append(d);d.querySelector('button').onclick=()=>d.close();
 $('words').replaceChildren();document.querySelector('.word-window').className='week-story';const placeBack=document.createElement('button');placeBack.id='place-clear';placeBack.type='button';placeBack.hidden=true;placeBack.onclick=clearPlace;$('words').before(placeBack);
 document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>toggle(b.dataset.layer));
 $('timeline').oninput=e=>{state.hour=clampHour(+e.target.value);dirty=true;refreshUI();};
 $('play').onclick=()=>{if(state.hour>=168)state.hour=0;state.playing=!state.playing;dirty=true;refreshUI();};$('reset').onclick=()=>{clearPlace();reset();};
 for(const id of ['metric-a','metric-b']){$(id).disabled=true;$(id).removeAttribute('aria-label');}
 $('about-button').onclick=()=>$('about-dialog').showModal();document.querySelectorAll('.dialog-close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').title=say('当前浏览器不支持全屏','Fullscreen unavailable');}};
 addEventListener('keydown',e=>{if(!active()||e.target.closest('input,textarea,select,button,[contenteditable]'))return;if(['1','2','3'].includes(e.key))toggle(keys[+e.key-1]);if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.key==='Home')reset();});
 controls.listenToKeyEvents($('world'));$('zoom-layers').checked=false;$('zoom-layers').disabled=true;
 const picker=document.createElement('select');picker.id='place-select';picker.setAttribute('aria-label','地标定位 / Landmark navigation');picker.onchange=()=>focusPlace(picker.value);document.querySelector('#experience > header').insertBefore(picker,$('about-button'));
 landmarkMedia=createLandmarkMedia($('experience'));refreshLanguage();
}
function toggle(key){state.layers[key]=!state.layers[key];dirty=true;refreshUI();}
function refreshLanguage(){
 if(!$('week-days'))return;
 landmarkMedia?.setLanguage(state.lang);
 $('week-days').replaceChildren(...(zh()?['周一','周二','周三','周四','周五','周六','周日']:['MON','TUE','WED','THU','FRI','SAT','SUN']).map((s,i)=>{const b=document.createElement('button');b.textContent=s;b.onclick=()=>{state.hour=i*24+12;dirty=true;refreshUI();};return b;}));
 const select=$('place-select');if(select){const previous=select.value;select.replaceChildren();for(const [id,label] of [['',say('地标定位…','GO TO A LANDMARK…')],['central',say('中心城区','CENTRAL SHANGHAI')],['all',say('市中心总览','CENTRED CITY OVERVIEW')],...landmarks.map(l=>[l.id,say(l.labelZh,l.labelEn)])]){const o=document.createElement('option');o.value=id;o.textContent=label;select.append(o);}select.value=previous;}
 $('week-notes').textContent=say('数据与映射 ↗','DATA / ART ↗');
 $('week-data').querySelector('h1').textContent=say('可感知的变化，有明确的边界。','Visible changes, traceable origins.');
 $('week-data-copy').innerHTML=dataArtCopy(state.lang,{nodeCount:signalNetwork.nodes.length,linkCount:signalNetwork.links.length});

 // The original site's language system is retained; update only obsolete day/layer explanations.
 const sections=$('about-dialog').querySelectorAll('.about-grid > div');sections[0].querySelector('p').textContent=say('潮：风与湿润驱动的艺术线海。脉：公共活动与逐路段变化的道路压力热力。讯：城域业务点云、发送接收与信息接力。底图白色地标常驻。三个开关独立叠加，共用上海底图。','TIDE: wind and wetness interpreted as an artistic line sea. PULSE: public life and changing road pressure. SIGNAL: citywide service particles, reception and relays. White landmarks remain part of the base. Independent layers share one city.');
 sections[1].querySelector('p').textContent=say('拖动旋转、滚轮围绕鼠标指向位置缩放。按1/2/3独立开关三层。底部拖动一周时间轴；整周循环播放，暂停定格动态；缩到最远自动回到市中心，复位只改变镜头。','Drag to orbit, scroll to zoom toward the pointer. Press 1/2/3 to toggle independent layers. Scrub the week below; the week loops and pause freezes motion. Zoom out returns to the city centre. Reset changes only the camera.');
 sections[1].querySelectorAll('p')[1].textContent=say('底部温湿曲线采用2025年ERA5历史参考。地标粒子始终显示，点击名称可查看形态与定位说明。触屏支持单指旋转、双指缩放。','The temperature and RH charts replay 2025 ERA5 reference data. Landmark particles remain visible; select a name for form and placement notes. Touch supports orbit and pinch zoom.');
 $('zoom-description').textContent=say('镜头与图层独立：缩放不再自动更换三层。','Camera and layers are independent; zoom never changes layers.');
 $('about-dialog').querySelector('.interaction-setting label span').textContent=say('已采用独立图层控制','INDEPENDENT LAYER CONTROLS');
 const credits=$('about-dialog').querySelectorAll(':scope > .credit');credits[0].textContent=say('模型基准2026。2050一周为作者合成情景；ERA5仅作历史参考。没有实测水文、交通或通信周数据。详细定义见“数据与映射”。','2026 geometry, an authored 2050 week and historical ERA5 reference. No measured weekly hydrology, traffic or communications feeds. See DATA / ART.');credits[1].innerHTML='<a href="#" id="about-week-link">'+say('打开本版数据与映射 ↗','OPEN THIS VERSION’S DATA / ART ↗')+'</a>';$('about-week-link').onclick=e=>{e.preventDefault();$('about-dialog').close();$('week-data').showModal();};
 $('zoom-hint').textContent=say('指向地点 · 滚轮缩放','POINT TO A PLACE · SCROLL TO ZOOM');$('timeline').setAttribute('aria-label',say('2050合成情景周，0至168小时','2050 scenario week, 0 to 168 hours'));$('world').setAttribute('aria-label',say('三维上海，拖动旋转，1、2、3独立切换图层','3D Shanghai. Drag to orbit; 1, 2, 3 toggle independent layers.'));
 applyProjectAboutDialog(state.lang);$('place-clear').textContent=say('← 返回一周叙事','← BACK TO THE WEEK');refreshUI();dirty=true;
}
function refreshUI(){if(!state.ready)return;const e=weather.weatherAt(state.hour),skyState=skyReference.at(state.hour,e);
 $('clock').textContent=weekTime(state.hour,zh());$('scenario-status').textContent=say('2050 情景周 · 上海','2050 SCENARIO WEEK · SHANGHAI');
 $('play').textContent=state.playing?'Ⅱ':'▷';$('play').setAttribute('aria-label',state.playing?say('暂停一周时间','Pause week'):say('循环播放一周','Play looping week'));$('play').title=$('play').getAttribute('aria-label');$('timeline').value=state.hour;
 document.querySelectorAll('[data-layer]').forEach(b=>{const on=state.layers[b.dataset.layer];b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));b.querySelector('small').textContent={nature:'潮',culture:'脉',cloud:'讯'}[b.dataset.layer];});
 [...$('week-days').children].forEach((b,i)=>b.classList.toggle('current',i===Math.min(6,Math.floor(state.hour/24))));
 $('stat-heading').textContent=say('一周的城市代谢','A WEEK OF URBAN METABOLISM');
 $('stat-copy').innerHTML=`<span>${weekTime(state.hour,zh())}</span><div class="weather-numbers"><strong>${say('温度','TEMP')}<b>${e.temperatureC.toFixed(1)}<i>°C</i></b></strong><strong>${say('相对湿度','HUMIDITY')}<b>${Math.round(e.humidityPct)}<i>%</i></b></strong></div><small>${say(skyState.labelZh,skyState.labelEn)} · ${say('小时降水','HOURLY RAIN')} ${e.rainMm.toFixed(1)} mm<br>${say('2025.06.02—08 · ERA5气象参考','2–8 JUN 2025 · ERA5 REFERENCE')}</small>`;
 $('news-date').textContent='2050';$('news-title').textContent=say('当天的节律','DAILY RHYTHM');const story=storyAt(state.hour,e)[state.lang];$('words').innerHTML='';const title=document.createElement('h3'),p=document.createElement('p');title.textContent=story[0];p.textContent=story[1];if(state.layers.cloud&&!state.layers.culture&&!state.layers.nature){title.textContent=say('服务与公众内容，分时交换','SERVICES AND PUBLIC CONTENT');p.textContent=say('冰紫蓝是机器、算力与服务交换，橙金是公众内容和交互。请求批次与有限队列共同改变活跃线路、包量及速度；雨天影响业务需求，光迹采用艺术慢放。','ICE BLUE is machine, compute and service exchange; ORANGE is public content and interaction. Request batches and finite queues change active routes, packet counts and speed. Rain changes scenario demand; packets are artistically slowed.');}$('words').append(title,p);if(state.layers.cloud&&sig){const n=document.createElement('small');n.className='rhythm-caption';n.textContent=say(`讯 · 当前活跃 ${sig.meta.activeLinks} 条情景关系 · ${e.rainMm>.1?'雨天业务响应':'日常业务节律'}`,`SIGNAL · ${sig.meta.activeLinks} ACTIVE SCENARIO RELATIONS · ${e.rainMm>.1?'RAIN RESPONSE':'DAILY SERVICES'}`);$('words').append(n);}if(state.layers.culture){const caption=document.createElement('small');caption.className='rhythm-caption';caption.textContent=trafficCaption(state.hour,state.lang);$('words').append(caption);}
 $('week-legend').innerHTML=`${state.layers.nature?'<span class="tide-key">'+say('潮 · 风迹 / 湿润 · ART线海','TIDE · WIND / WETNESS · ART WAVES')+'</span>':''}${state.layers.culture?'<span class="heat-key">'+say('脉 · 道路压力 0 → 1 · 参考约束推演','PULSE · PRESSURE 0 → 1 · CONSTRAINED SCENARIO')+'</span>':''}${state.layers.cloud?'<span class="signal-key">'+say('讯 · 冰紫蓝：服务 / 橙：公众内容 · 情景负载','SIGNAL · ICE BLUE SERVICE / ORANGE CONTENT · SCENARIO LOAD')+'</span>':''}`;
 if(!Object.values(state.layers).some(Boolean))$('week-legend').textContent=say('上海底图 · 银白地标常驻 · 三层均已关闭','SHANGHAI BASE · PERMANENT SILVER LANDMARKS · THREE LAYERS OFF');
 for(const l of labels)l.b.textContent=say(l.name,l.en);renderFocusedPlace();drawCharts();
}
function drawCharts(){
 if(!charts.length)return;
 const current=weather.weatherAt(state.hour);
 for(let i=0;i<2;i++){
  const series=charts[i],letter=i?'b':'a',canvas=$('bars-'+letter),r=canvas.getBoundingClientRect();if(!r.width)continue;
  canvas.width=Math.round(r.width*2);canvas.height=Math.round(r.height*2);const ctx=canvas.getContext('2d');ctx.scale(2,2);const w=r.width,h=r.height,left=31,right=w-5,top=7,bottom=h-5;
  ctx.font='9px Consolas,monospace';ctx.fillStyle='#88a8ba';ctx.fillText(series.max+series.unit,2,top+4);ctx.fillText(series.min+series.unit,2,bottom);
  ctx.strokeStyle='#8aa8bd22';ctx.lineWidth=.5;for(let d=0;d<=7;d++){const x=left+(right-left)*d/7;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();}
  ctx.strokeStyle=series.color;ctx.lineWidth=1.4;ctx.beginPath();series.values.forEach((v,j)=>{const x=left+(right-left)*j/168,y=bottom-(v-series.min)/(series.max-series.min)*(bottom-top);j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.lineTo(right,bottom);ctx.lineTo(left,bottom);ctx.closePath();ctx.globalAlpha=.12;ctx.fillStyle=series.color;ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#d6f5ff';ctx.fillRect(left+state.hour/168*(right-left),top,1,bottom-top);
  $('metric-'+letter).textContent=series.names[state.lang];$('summary-'+letter).textContent=(i?Math.round(current.humidityPct):current.temperatureC.toFixed(1))+series.unit+' · '+say('历史参考','HISTORICAL');
  canvas.setAttribute('aria-label',series.names[state.lang]+say('，2025年6月2至8日ERA5参考',' ERA5 reference, 2–8 June 2025'));
  const ticks=canvas.nextElementSibling;ticks.children[0].textContent=say('周一','MON');ticks.children[1].textContent=say('周四','THU');ticks.children[2].textContent=say('周日','SUN');
 }
}
function initCharts(){charts=[{names:{zh:'温度',en:'TEMPERATURE'},values:weather.hours.map(h=>h.temperatureC),min:16,max:34,unit:'°C',color:'#ffb785'},{names:{zh:'相对湿度',en:'HUMIDITY'},values:weather.hours.map(h=>h.humidityPct),min:20,max:100,unit:'%',color:'#68d2f1'}];}

function resize(){if(!renderer)return;const px=Math.min(devicePixelRatio,innerWidth<700?1:1.5);renderer.setPixelRatio(px);renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=Math.min(85,Math.atan(Math.tan(47*Math.PI/360)*Math.max(1,1.65/camera.aspect))*360/Math.PI);camera.updateProjectionMatrix();bloom.resize(Math.floor(innerWidth*px),Math.floor(innerHeight*px));dirty=true;drawCharts();}
function update(){env=weather.weatherAt(state.hour);CITY_FADE_UNIFORMS.cityFocus.value.x=controls.target.x;CITY_FADE_UNIFORMS.cityFocus.value.y=controls.target.z;CITY_FADE_UNIFORMS.cityScale.value=Math.max(1,Math.min(12,controls.getDistance()/160));CITY_FADE_UNIFORMS.cityDetail.value=1-THREE.MathUtils.smoothstep(controls.getDistance(),270,700);const key=`${Math.floor(state.hour*4)}`;if(key!==lastSample){traffic=week.sample(state.hour);lastSample=key;}if(state.layers.culture&&key!==lastHeatSample){heat.update(traffic);regionalHeat.update(regionalTraffic.sample(state.hour));lastHeatSample=key;}
 const count=Object.values(state.layers).filter(Boolean).length;for(const k of keys)groups[k].visible=state.layers[k];
 // Each layer remains recognisable; concurrent layers lower only their own visual gain.
 contextCity.update(state.hour,camera);regionalCity.update(state.hour,state.layers.culture,env.activityIndex);
 if(state.layers.nature){tide.update(env,state.hour,count>1?.6:1);sky.update(state.hour,env,{camera,focus:controls.target,cityRoofTop:visibleRoofTop(),gain:count>1?.85:1,reducedMotion:reduced});}if(state.layers.culture){heat.plane.material.uniforms.gain.value=count>1?.9:1;roads.update(traffic,state.hour,env);regionalRoads.update(regionalTraffic.sample(state.hour),state.hour,env);activity.material.uniforms.time.value=state.hour*6;activity.material.uniforms.gain.value=env.activityIndex*(state.hour>=120?1.2:.55);activity.material.uniforms.activity.value=env.activityIndex;pulseField.update(state.hour,env.activityIndex,count>1?.78:1,innerHeight*renderer.getPixelRatio());}
 if(state.layers.cloud){sig=signalState(signalNetwork,state.hour,{conditionsAt:conditionAt});signals.update(sig,state.hour,count>1?.68:1);}
 window.SH2050_SOUND?.updateWeather?.({hour:state.hour,rainMm:env.rainMm,flashStrength:sky.sample?.lightning??0,flashSeed:sky.sample?.lightningSeed??0,playing:state.playing,active:active(),layerOn:state.layers.nature});
 const rect=$('world').getBoundingClientRect(),candidates=[];
 for(const l of labels){l.b.hidden=l.leader.hidden=true;if(l.layer!=='base'&&!state.layers[l.layer])continue;const fade=CITY_FADE_UNIFORMS;if(cityFadeAt((l.position.x-fade.cityFocus.value.x)/fade.cityScale.value,(l.position.z-fade.cityFocus.value.y)/fade.cityScale.value)<.04)continue;if(l.layer==='base')l.position.y=contextCity.displayTopAt(l.id,camera.position);const v=l.position.clone().project(camera);candidates.push({label:l,x:(v.x*.5+.5)*rect.width,y:(-v.y*.5+.5)*rect.height,z:v.z,width:l.b.textContent.length*8+16,priority:LANDMARK_LABEL_PRIORITY[l.id]??(l.layer==='base'?75:35)});}
 for(const p of layoutLandmarkLabels(candidates,rect.width,rect.height,{limit:controls.getDistance()>600?17:10,overview:controls.getDistance()>600,obstacles:labelObstacles()})){const l=p.label;l.b.hidden=false;l.b.style.transform=`translate(${p.x}px,${p.y}px)`;const dx=(p.leaderX??p.x)-p.anchorX,dy=(p.leaderY??p.y+10)-p.anchorY,dist=Math.hypot(dx,dy);l.leader.hidden=dist<18;l.leader.style.cssText=`left:${p.anchorX}px;top:${p.anchorY}px;width:${dist}px;transform:rotate(${Math.atan2(dy,dx)}rad)`;}
 updateLandmarkMedia(rect);

}
function updateLandmarkMedia(rect){
 if(!landmarkMedia?.placeId)return;
 // Let the camera arrive before revealing moving media controls.
 if(cameraNav.state.flying){landmarkMedia.update();return;}
 const form=contextCity.forms.find(f=>f.id===landmarkMedia.placeId);if(!form)return;
 const scale=contextCity.displayScaleAt(form.id,camera.position),[lo,hi]=form.boundsM,anchorWorld=new THREE.Vector3(...form.anchorWorld);
 const project=(x,y,z)=>new THREE.Vector3(anchorWorld.x+x*.02*scale,.035+y*.02*scale,anchorWorld.z+z*.02*scale).project(camera);
 const v=project((lo[0]+hi[0])*.5,(lo[1]+hi[1])*.5,(lo[2]+hi[2])*.5);
 const anchor={x:rect.left+(v.x*.5+.5)*rect.width,y:rect.top+(-v.y*.5+.5)*rect.height,z:v.z};
 const corners=[];for(const x of [lo[0],hi[0]])for(const y of [lo[1],hi[1]])for(const z of [lo[2],hi[2]]){const p=project(x,y,z);if(p.z>=-1&&p.z<=1)corners.push({x:rect.left+(p.x*.5+.5)*rect.width,y:rect.top+(-p.y*.5+.5)*rect.height});}
 let modelRect;if(corners.length){const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);modelRect={x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};}
 const selectors=['#experience > header','.site-shell','.layers','.data-panel','.chart-area','#experience > footer','#week-legend','#gesture-control'];
 const obstacles=selectors.map(s=>document.querySelector(s)).filter(el=>el&&getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};});
 const selected=labels.find(l=>l.id===form.id)?.b;if(selected&&!selected.hidden){const r=selected.getBoundingClientRect();obstacles.push({x:r.x,y:r.y,width:r.width,height:r.height});}
 landmarkMedia.update({anchor,modelRect,viewport:{width:innerWidth,height:innerHeight},obstacles});
}
function visibleRoofTop(){let top=16;const scale=CITY_FADE_UNIFORMS.cityScale.value;for(const l of landmarks){const p=projectGeo(l.lon,l.lat);if(Math.hypot(p[0]-controls.target.x,p[2]-controls.target.z)<130*scale)top=Math.max(top,contextCity.displayTopAt(l.id,camera.position));}return top;}
function labelObstacles(){const ids=['#experience > header','.layers','.data-panel','.chart-area','footer','#gesture-control'];return ids.map(id=>document.querySelector(id)).filter(Boolean).map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});}
function navigationChanged(){dirty=true;if(cameraNav&&!cameraNav.state.moving&&controls.getDistance()>=controls.maxDistance-.1&&Math.hypot(controls.target.x,controls.target.y-1,controls.target.z)<.05&&$('place-select'))$('place-select').value='all';}
function tick(now){requestAnimationFrame(tick);const dt=lastTick?Math.min(.1,(now-lastTick)/1000):0;lastTick=now;const isActive=active();controls.enabled=isActive;landmarkMedia?.setActive(isActive);if(!isActive){window.SH2050_SOUND?.updateWeather?.({active:false});return;}if(state.playing){state.hour=advanceWeek(state.hour,dt,state.speed);dirty=true;}controls.update();cameraNav.update(dt);if(dirty){update();bloom.render();dirty=false;}if(now-lastUi>150){refreshUI();lastUi=now;}}
async function init(){try{
 renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.setClearColor('#01040c');scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(47,innerWidth/innerHeight,.1,12000);controls=new OrbitControls(camera,$('world'));controls.zoomToCursor=true;controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.47;controls.minDistance=28;controls.maxDistance=2200;controls.rotateSpeed=.4;controls.addEventListener('change',()=>dirty=true);cameraNav=createCameraNavigation(camera,controls,$('world'),{isActive:active,onChange:navigationChanged});Object.values(groups).forEach(g=>scene.add(g));scene.add(landmarkBase);scene.add(new THREE.AmbientLight('#699bd2',2));
 await resources.preload();window.SH2050_BOOT?.phase('preparing');
 [network,catalog,signalNetwork]=await Promise.all(['road-network','building-catalog','signal-network'].map(fetchJSON));
 weather=createWeatherReference(await fetchJSON('historical-era5-reference'));
 skyReference=createSkyReference(await fetchJSON('historical-era5-sky-reference'));sky=makeWeatherSky(groups.nature,skyReference);
 landmarks=(await fetchJSON('artwork-landmarks')).landmarks;
 const simulation=createTrafficSimulation(network,{rainAt:h=>weather.weatherAt(h).rainIndex});week=simulation.generateWeek({construction:false});signalNetwork=createSignalNetwork(signalNetwork,catalog,{landmarks});
 const gltf=await new GLTFLoader().parseAsync(await resources.binary('shanghai-sample.glb'),new URL('./data/',import.meta.url).href);model=gltf.scene;model.scale.setScalar(unit);scene.add(model);
 model.visible=false;model.traverse(o=>{if(o.name==='Buildings')buildings=o;});
 // The original core is retained for identity picking only, never rendered.
 const mask=makeWaterMask(await fetchJSON('source-water-mask'));tide=makeTide(groups.nature,mask);tide.rain.visible=false;heat=makeHeat(network,mask,groups.culture);roads=makeRoads(network,groups.culture);makeActivity();

 triangleMap=new Uint32Array(await resources.binary('building-triangle-features.bin'));
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;const canvas=$('world');
 function selectBuilding(x,y){
  if(!active()||!Number.isFinite(x)||!Number.isFinite(y))return false;
  const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height||x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return false;
  mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);camera.updateMatrixWorld();ray.setFromCamera(mouse,camera);
  const hit=ray.intersectObject(buildings,false)[0];if(!hit)return false;
  landmarkMedia?.close();state.focusPlace='district';const position=hit.point.clone();position.y=Math.min(4,position.y);cameraNav.goTo(position,new THREE.Vector3(24,34,58));dirty=true;refreshUI();return true;
 }
 canvas.addEventListener('pointerdown',e=>{if(active()&&e.button===0)down={x:e.clientX,y:e.clientY,id:e.pointerId};});
 canvas.addEventListener('pointerup',e=>{const start=down;down=null;if(!start||e.pointerId!==start.id||Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)return;selectBuilding(e.clientX,e.clientY);});
 for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{down=null;});
 window.addEventListener('sh2050:navigation',()=>{down=null;});
 contextCity=await loadContext(scene,landmarkBase,landmarks);
 regionalCity=await loadRegional(scene,groups.culture,landmarks,{loadBinary:name=>resources.binary(name)});
 pulseField=makePulseCityField(groups.culture,regionalCity.rawBuildingPositions);
 signals=makeSignals(signalNetwork,catalog,groups.cloud,{buildingPositions:regionalCity.rawBuildingPositions});
 regionalTraffic=createRegionalTraffic(regionalCity.rawRoadPositions,{rainAt:h=>weather.weatherAt(h).rainIndex});
 const regionalMask=makeWaterMask(new Float32Array(await resources.binary('regional-water-triangles.bin')),regionalTraffic.network.meta.boundsXY);
 regionalHeat=makeHeat(regionalTraffic.network,regionalMask,groups.culture,{regional:true});regionalRoads=makeRoads(regionalTraffic.network,groups.culture,{regional:true});
 landmarks.forEach(place=>{const position=new THREE.Vector3(...projectGeo(place.lon,place.lat));position.y=place.labelHeight;addLabel(place.labelZh,place.labelEn,position,'base',[place.noteZh,place.noteEn],place.id);});
 signalNetwork.nodes.forEach((n,i)=>{if(!n.isFacility||n.labelZh.startsWith('东方明珠'))return;const anchor=signals.positions[i].clone();anchor.y+=.7;addLabel(n.labelZh,n.labelEn,anchor,'cloud',[n.roleZh+' 地址：'+n.address+'。'+(n.coordinateAccuracyM?'地图锚点约 '+n.coordinateAccuracyM+' 米精度；':'')+'连线、发送率和光包时序为作者情景。',n.roleEn+' Address: '+n.address+'. Approximate map anchor; links, rates and optical packets are authored.'],'signal:'+n.id);});
 model.visible=false;
 bloom=makeBloom(renderer,scene,camera);reset();initCharts();state.ready=true;setupUI();resize();addEventListener('resize',resize);addEventListener('sh2050:navigation',()=>dirty=true);addEventListener('visibilitychange',()=>{lastTick=0;dirty=true;});
 const requestedPlace=query.get('place');if(landmarks.some(place=>place.id===requestedPlace))focusPlace(requestedPlace);
 window.SH2050_GESTURE_CITY={isActive:()=>state.ready&&active(),isFlying:()=>cameraNav.state.flying,onOrbit:(dx,dy)=>cameraNav.gestureOrbit(dx,dy),onPan:(dx,dy)=>cameraNav.gesturePan(dx,dy),onCanvasClick:selectBuilding,onZoom:(spread,point)=>cameraNav.gestureZoom(spread,point),onStop:()=>cameraNav.stopGesture(),onLayout:()=>{dirty=true;}};
 $('loading').classList.add('loaded');setTimeout(()=>$('loading')?.remove(),1000);Object.assign(window.SH2050,{ready:true,version:'week-20261102-bund-shore',getState:()=>({hour:state.hour,playing:state.playing,layers:{...state.layers},camera:camera.position.toArray(),navigation:cameraNav.state,loop:true,focusedPlace:state.focusPlace,temperatureC:env?.temperatureC,humidityPct:env?.humidityPct,queue:traffic?.totals.queue,drawCalls:renderer.info.render.calls,landmarksAlwaysVisible:landmarkBase.visible,signalNodes:signalNetwork.nodes.length,signalLinks:signalNetwork.links.length,signalFieldStats:signals.fieldStats,signalActivity:sig?.meta?.activeLinks,sky:sky.sample,zoomToCursor:controls.zoomToCursor,pulseSamples:pulseField.count,trafficDay:traffic?.meta?.referenceDay,trafficMean:traffic?.totals.meanPressure}),setLanguage:lang=>{state.lang=lang==='zh'?'zh':'en';refreshLanguage();}});refreshUI();requestAnimationFrame(tick);window.dispatchEvent(new CustomEvent('sh2050:ready'));
 }catch(e){console.error(e);window.SH2050.error=e.message;$('loading')?.remove();$('error').hidden=false;$('error').querySelector('p').textContent=e.message;window.dispatchEvent(new CustomEvent('sh2050:error',{detail:{message:e.message}}));}}
window.SH2050={ready:false,getLanguage:()=>state.lang};window.addEventListener('sh2050:language',e=>{state.lang=e.detail?.lang==='zh'?'zh':'en';refreshLanguage();});init();




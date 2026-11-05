import {selectLandmarkMedia} from './landmark-media-catalog.mjs?v=20261105-stability';
import {placeLandmarkMedia,landmarkMediaSize} from './landmark-media-layout.mjs';

/** One lazy screen-space window attached to a world-space landmark.
 * Its poster remains visible until playback starts. Media stays outside WebGL.
 */
export function createLandmarkMedia(parent){
 const root=document.createElement('section');root.id='landmark-media';root.className='landmark-media';root.hidden=true;root.setAttribute('role','region');root.setAttribute('aria-label','地标影像 / Landmark film');
 const head=document.createElement('div');head.className='landmark-media-head';
 const title=document.createElement('strong');title.id='landmark-media-title';root.setAttribute('aria-labelledby',title.id);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='landmark-media-toggle';
 const close=document.createElement('button');close.type='button';close.className='landmark-media-close';close.textContent='×';
 head.append(title,toggle,close);
 const stage=document.createElement('div');stage.className='landmark-media-stage';
 const video=document.createElement('video');video.muted=false;video.defaultMuted=false;video.playsInline=true;video.preload='metadata';video.disablePictureInPicture=true;video.disableRemotePlayback=true;video.setAttribute('playsinline','');video.setAttribute('controlslist','nofullscreen nodownload noremoteplayback');video.tabIndex=-1;
 const image=document.createElement('img');image.decoding='async';image.draggable=false;
 const replay=document.createElement('button');replay.type='button';replay.className='landmark-media-replay';replay.hidden=true;
 const status=document.createElement('p');status.className='landmark-media-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 stage.append(video,image,replay,status);root.append(head,stage);parent.append(root);
 const ns='http://www.w3.org/2000/svg',connector=document.createElementNS(ns,'svg'),line=document.createElementNS(ns,'line');connector.id='landmark-media-connector';connector.setAttribute('aria-hidden','true');connector.setAttribute('hidden','');connector.append(line);parent.append(connector);
 let current=null,language='zh',active=true,wantsPlayback=true,layout=null,sourceToken=0,playAttempt=0,lastTransform='',audioFocused=false,phase='ready',loadTimer=null,posterFailed=false;
 const say=(zh,en)=>language==='en'?en:zh;
 const visible=()=>!!current&&active&&!root.hidden;
 function videoAudioFocus(value){if(audioFocused===value)return;audioFocused=value;window.SH2050_SOUND?.setMediaFocus?.(value);}
 function clearLoadTimer(){if(loadTimer!==null)clearTimeout(loadTimer);loadTimer=null;}
 function labels(){
  if(current)title.textContent=language==='en'?current.place.labelEn:current.place.labelZh;
  close.setAttribute('aria-label',say('关闭地标影像','Close landmark media'));close.title=close.getAttribute('aria-label');
  const ended=phase==='ended',retry=phase==='error'||phase==='slow',pausing=wantsPlayback&&!ended&&phase!=='blocked'&&phase!=='error';
  toggle.textContent=ended?'↻':pausing?'Ⅱ':'▶';toggle.setAttribute('aria-label',ended?say('重播视频','Replay video'):pausing?say('暂停视频','Pause video'):say('播放视频','Play video'));toggle.title=toggle.getAttribute('aria-label');
  replay.textContent=retry?say('↻ 重试','↻ RETRY'):ended?say('↻ 重播','↻ REPLAY'):say('▶ 播放','▶ PLAY');
  replay.setAttribute('aria-label',retry?say('重新加载地标影像','Retry landmark media'):ended?say('重播地标视频','Replay landmark video'):say('播放地标视频','Play landmark video'));
  video.setAttribute('aria-label',say('地标短片：','Landmark film: ')+(title.textContent??''));image.alt=say('地标图像：','Landmark image: ')+(title.textContent??'');
  const text=phase==='loading'?say('正在加载影像…','Loading media…'):phase==='slow'?say('加载较慢，可点击重试','Loading slowly. You can retry.'):phase==='blocked'?say('点击播放视频','Select play to start the film'):phase==='error'?say('影像暂时无法播放，请重试','Media could not load. Please retry.') :'';
  if(status.textContent!==text)status.textContent=text;status.hidden=!text;
  if(!current)return;
  root.dataset.state=phase;
  if(current.media.kind==='video'){
   const hasFrame=video.readyState>=2;
   // A separate image keeps a failed or pending video from covering its poster.
   image.hidden=posterFailed||phase==='playing'||((phase==='paused'||phase==='ended')&&hasFrame);
   replay.hidden=!['ready','paused','ended','blocked','error','slow'].includes(phase);
  }else{image.hidden=posterFailed;replay.hidden=!['error','slow'].includes(phase);}
 }
 function setPhase(value){phase=value;labels();}
 function armLoadTimer(){
  clearLoadTimer();const token=sourceToken,attempt=playAttempt;
  loadTimer=setTimeout(()=>{loadTimer=null;if(token===sourceToken&&attempt===playAttempt&&visible()&&wantsPlayback&&phase==='loading')setPhase('slow');},15000);
 }
 function playbackStarted(){
  if(!visible()||!wantsPlayback){video.pause();return;}
  clearLoadTimer();videoAudioFocus(true);setPhase('playing');
 }
 function play(reload=false){
  if(!visible()||current?.media.kind!=='video'||!wantsPlayback)return;
  const token=sourceToken,attempt=++playAttempt;
  if(reload){video.pause();video.src=current.media.src;video.load();}
  if(video.ended)video.currentTime=0;
  setPhase('loading');armLoadTimer();
  // Keep play() in the actual button handler's call stack for browser activation.
  let request;try{request=video.play();}catch(error){request=Promise.reject(error);}
  Promise.resolve(request).then(()=>{
   if(token!==sourceToken||attempt!==playAttempt)return;
   if(!visible()||!wantsPlayback){video.pause();return;}
   if(!video.paused&&video.readyState>=2)playbackStarted();
  }).catch(error=>{
   if(token!==sourceToken||attempt!==playAttempt||!visible())return;
   clearLoadTimer();videoAudioFocus(false);wantsPlayback=false;
   setPhase(error.name==='NotAllowedError'?'blocked':'error');
  });
 }
 function hide(){
  root.hidden=true;connector.setAttribute('hidden','');playAttempt++;clearLoadTimer();videoAudioFocus(false);video.pause();
  if(current?.media.kind==='video'&&wantsPlayback)setPhase('ready');
 }
 function release(){
  clearLoadTimer();playAttempt++;videoAudioFocus(false);
  for(const name of ['onplaying','onpause','onended','onloadeddata','onwaiting','onstalled','onerror'])video[name]=null;
  image.onload=image.onerror=null;video.pause();video.removeAttribute('src');video.removeAttribute('poster');video.load();image.removeAttribute('src');
 }
 function bindEvents(token){
  const selected=()=>token===sourceToken&&current?.media.kind==='video'&&(!video.currentSrc||video.currentSrc===current.media.src);
  video.onplaying=()=>{if(selected())playbackStarted();};
  video.onpause=()=>{if(!selected())return;videoAudioFocus(false);if(visible()&&phase==='playing'&&!video.ended){wantsPlayback=false;clearLoadTimer();setPhase('paused');}};
  video.onended=()=>{if(!selected())return;wantsPlayback=false;clearLoadTimer();videoAudioFocus(false);setPhase('ended');};
  video.onloadeddata=()=>{if(selected())root.classList.add('is-ready');};
  const waiting=()=>{if(!selected()||!visible()||!wantsPlayback)return;videoAudioFocus(false);setPhase('loading');armLoadTimer();};
  video.onwaiting=video.onstalled=waiting;
  video.onerror=()=>{if(!selected())return;clearLoadTimer();videoAudioFocus(false);wantsPlayback=false;setPhase('error');};
  image.onload=()=>{if(token!==sourceToken||!current)return;posterFailed=false;root.classList.add('is-ready');if(current.media.kind==='image'){clearLoadTimer();setPhase('ready');}else labels();};
  image.onerror=()=>{if(token!==sourceToken||!current)return;posterFailed=true;if(current.media.kind==='image'){clearLoadTimer();setPhase('error');}else labels();};
 }
 function open(place,hour,lang='zh'){
  const media=selectLandmarkMedia(place.id,hour);if(!media){closeMedia();return false;}
  sourceToken++;root.hidden=true;release();language=lang;current={place,media};wantsPlayback=true;posterFailed=false;layout=null;
  root.dataset.place=place.id;root.dataset.variant=media.variant;root.dataset.kind=media.kind;root.classList.remove('is-ready');connector.setAttribute('hidden','');toggle.hidden=media.kind!=='video';bindEvents(sourceToken);
  if(media.kind==='video'){video.hidden=false;image.src=media.poster??'';video.poster=media.poster??'';video.src=media.src;video.load();setPhase('loading');}
  else{video.hidden=true;image.src=media.src;setPhase('loading');}
  return true;
 }
 function closeMedia(){sourceToken++;hide();release();current=null;layout=null;delete root.dataset.place;}
 function userPlay(){
  if(!visible()||!current)return;
  if(current.media.kind==='image'){posterFailed=false;setPhase('loading');image.src=current.media.src;armLoadTimer();return;}
  const reload=phase==='error'||phase==='slow';wantsPlayback=true;play(reload);
 }
 close.onclick=closeMedia;
 toggle.onclick=()=>{
  if(phase==='playing'||((phase==='loading'||phase==='slow')&&wantsPlayback)){wantsPlayback=false;playAttempt++;clearLoadTimer();video.pause();videoAudioFocus(false);setPhase('paused');}
  else userPlay();
 };
 replay.onclick=userPlay;
 const escape=e=>{if(e.key==='Escape'&&visible()){e.stopPropagation();closeMedia();}};document.addEventListener('keydown',escape);
 return {
  open,close:closeMedia,
  setLanguage(lang){language=lang;labels();},
  setActive(value){const next=!!value;if(next===active)return;active=next;if(!active)hide();},
  update({anchor,modelRect,viewport,obstacles=[]}={}){
   if(!current||!active||!anchor||anchor.z< -1||anchor.z>1){hide();return null;}
   const size=landmarkMediaSize(viewport),next=placeLandmarkMedia({anchor,modelRect,viewport,size,obstacles,previousSide:layout?.side});
   if(!next){hide();return null;}
   layout=next;root.style.width=next.width+'px';root.style.height=next.height+'px';
   const transform=`translate3d(${Math.round(next.x)}px,${Math.round(next.y)}px,0)`;if(transform!==lastTransform){root.style.transform=transform;lastTransform=transform;}
   const wasHidden=root.hidden;root.hidden=false;connector.removeAttribute('hidden');
   for(const [key,value] of Object.entries(next.leader))line.setAttribute(key,String(value));
   connector.setAttribute('viewBox',`0 0 ${viewport.width} ${viewport.height}`);
   if(wasHidden&&wantsPlayback){if(current.media.kind==='image'&&phase==='loading')armLoadTimer();else play();}return next;
  },
  getRect(){return visible()&&layout?{x:layout.x,y:layout.y,width:layout.width,height:layout.height}:null;},
  get placeId(){return current?.place.id??null;},
  dispose(){closeMedia();document.removeEventListener('keydown',escape);root.remove();connector.remove();}
 };
}

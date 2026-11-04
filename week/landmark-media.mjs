import {selectLandmarkMedia} from './landmark-media-catalog.mjs';
import {placeLandmarkMedia,landmarkMediaSize} from './landmark-media-layout.mjs';

/** One lazy screen-space window attached to a world-space landmark.
 * Media never enters the WebGL/bloom pipeline or changes the city/timeline.
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
 stage.append(video,image,replay);root.append(head,stage);parent.append(root);
 const ns='http://www.w3.org/2000/svg',connector=document.createElementNS(ns,'svg'),line=document.createElementNS(ns,'line');connector.id='landmark-media-connector';connector.setAttribute('aria-hidden','true');connector.setAttribute('hidden','');connector.append(line);parent.append(connector);
 let current=null,language='zh',active=true,wantsPlayback=true,layout=null,sourceToken=0,lastTransform='',audioFocused=false;
 const say=(zh,en)=>language==='en'?en:zh;
 const visible=()=>!!current&&active&&!root.hidden;
 function videoAudioFocus(value){if(audioFocused===value)return;audioFocused=value;window.SH2050_SOUND?.setMediaFocus?.(value);}
 function labels(){
  if(current)title.textContent=language==='en'?current.place.labelEn:current.place.labelZh;
  close.setAttribute('aria-label',say('关闭地标影像','Close landmark media'));close.title=close.getAttribute('aria-label');
  const ended=video.ended;
  toggle.textContent=ended?'↻':wantsPlayback?'Ⅱ':'▶';toggle.setAttribute('aria-label',ended?say('重播视频','Replay video'):wantsPlayback?say('暂停视频','Pause video'):say('播放视频','Play video'));
  toggle.title=toggle.getAttribute('aria-label');
  replay.textContent=say('▶ 播放','▶ PLAY');replay.setAttribute('aria-label',say('播放地标视频','Play landmark video'));
  video.setAttribute('aria-label',say('地标短片：','Landmark film: ')+(title.textContent??''));image.alt=say('地标图像：','Landmark image: ')+(title.textContent??'');
 }
 function play(){
  if(!visible()||current?.media.kind!=='video'||!wantsPlayback||video.ended)return;
  const token=sourceToken;
  videoAudioFocus(true);
  Promise.resolve(video.play()).then(()=>{if(token===sourceToken)replay.hidden=true;}).catch(e=>{if(token!==sourceToken)return;videoAudioFocus(false);if(e.name==='AbortError'||root.hidden)return;wantsPlayback=false;replay.hidden=false;labels();});
 }
 function hide(){root.hidden=true;connector.setAttribute('hidden','');videoAudioFocus(false);video.pause();}
 function release(){videoAudioFocus(false);video.pause();video.removeAttribute('src');video.removeAttribute('poster');video.load();image.removeAttribute('src');}
 function showImage(src){videoAudioFocus(false);video.pause();video.hidden=true;toggle.hidden=true;replay.hidden=true;image.hidden=false;image.src=src;root.dataset.kind='image';labels();}
 function open(place,hour,lang='zh'){
  const media=selectLandmarkMedia(place.id,hour);if(!media){closeMedia();return false;}
  sourceToken++;release();language=lang;current={place,media};wantsPlayback=true;layout=null;root.dataset.place=place.id;root.dataset.variant=media.variant;root.dataset.kind=media.kind;root.classList.remove('is-ready');replay.hidden=true;
  // Stay hidden until the selected building has a safe, visible anchor.
  root.hidden=true;connector.setAttribute('hidden','');toggle.hidden=media.kind!=='video';
  if(media.kind==='video'){image.hidden=true;video.hidden=false;video.poster=media.poster??'';video.src=media.src;video.load();}
  else showImage(media.src);
  labels();return true;
 }
 function closeMedia(){sourceToken++;hide();release();current=null;layout=null;delete root.dataset.place;}
 close.onclick=closeMedia;
 toggle.onclick=()=>{if(video.ended){video.currentTime=0;wantsPlayback=true;}else wantsPlayback=!wantsPlayback;if(wantsPlayback)play();else video.pause();labels();};
 replay.onclick=()=>{if(video.ended)video.currentTime=0;wantsPlayback=true;play();labels();};
 video.onplaying=()=>{if(visible())videoAudioFocus(true);labels();};
 video.onpause=()=>{if(video.paused||video.ended)videoAudioFocus(false);labels();};
 video.onended=()=>{videoAudioFocus(false);labels();};video.onloadeddata=()=>root.classList.add('is-ready');
 video.onerror=()=>{if(current?.media.kind==='video'&&current.media.poster){const src=current.media.poster;current.media={...current.media,kind:'image',src};showImage(src);}};
 image.onload=()=>root.classList.add('is-ready');image.onerror=()=>{if(current)closeMedia();};
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
   if(wasHidden)play();return next;
  },
  getRect(){return visible()&&layout?{x:layout.x,y:layout.y,width:layout.width,height:layout.height}:null;},
  get placeId(){return current?.place.id??null;},
  dispose(){closeMedia();document.removeEventListener('keydown',escape);root.remove();connector.remove();}
 };
}

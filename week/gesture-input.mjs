import {decodeGestureMessage,decodeInteractionState,createModeRequestQueue,createFrameGate} from './gesture-core.mjs';
import {createGestureLayout} from './gesture-layout.mjs';
import {createGestureActions} from './gesture-actions.mjs';
import {createGestureWeb} from './gesture-web.mjs';

const ENDPOINT='ws://127.0.0.1:8766',INTERACTION='/api/interaction';
export function createGestureInput({isActive=()=>false,isFlying=()=>false,onOrbit=()=>{},onPan=()=>{},onCanvasClick=()=>{},onHomeOrbit=()=>{},onHomeClick=()=>{},onZoom=()=>{},onStop=()=>{},onLayout=()=>{},getLanguage=()=> 'zh'}={}){
 const localCameraAvailable=['http://127.0.0.1:8765','http://localhost:8765'].includes(location.origin);
 const publicCameraAvailable=location.origin==='https://tian-alt-ux.github.io'&&location.pathname.startsWith('/shanghai-2050-art/');
 const cameraAvailable=localCameraAvailable||publicCameraAvailable;
 const interactionEndpoint=publicCameraAvailable?'http://127.0.0.1:8765/api/interaction':INTERACTION;
 let publicConnectionRequested=false;
 const mayUseService=()=>cameraAvailable&&(localCameraAvailable||publicConnectionRequested);
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./gesture-input.css',import.meta.url).href;document.head.append(style);
 const panel=document.createElement('section');panel.id='gesture-control';panel.setAttribute('aria-label','交互方式 / Interaction mode');
 const head=document.createElement('div');head.className='gesture-head';head.setAttribute('role','group');
 const mouseButton=document.createElement('button');mouseButton.id='interaction-mouse';mouseButton.type='button';
 const gestureButton=document.createElement('button');gestureButton.id='interaction-gesture';gestureButton.type='button';head.append(mouseButton,gestureButton);
 const status=document.createElement('p');status.id='gesture-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const copy=document.createElement('div');copy.className='gesture-copy';
 const details=document.createElement('details'),summary=document.createElement('summary'),instructions=document.createElement('div'),dockStatus=document.createElement('p'),help=document.createElement('p'),detail=document.createElement('p');instructions.className='gesture-instructions';dockStatus.className='gesture-dock-status';dockStatus.setAttribute('aria-hidden','true');help.id='gesture-help';detail.id='gesture-detail';instructions.append(dockStatus,help,detail);details.append(summary,instructions);copy.append(status,details);panel.append(head,copy);document.body.append(panel);
 const cursor=document.createElement('div');cursor.id='gesture-cursor';cursor.hidden=true;cursor.setAttribute('aria-hidden','true');cursor.innerHTML='<svg viewBox="0 0 40 40"><circle class="gesture-ring-track" cx="20" cy="20" r="17"/><circle class="gesture-ring-progress" cx="20" cy="20" r="17"/></svg>';document.body.append(cursor);
 // A top-layer cursor is independent of the transform/overflow on animated dialogs.
 const topLayerCursor=typeof cursor.showPopover==='function';if(topLayerCursor)cursor.setAttribute('popover','manual');
 const progressRing=cursor.querySelector('.gesture-ring-progress'),gate=createFrameGate();
 const layout=createGestureLayout({panel,onLayout});
 let mode='mouse',serviceState='checking',socket=null,pollTimer=null,raf=0,connection='off',bridgeStatus='starting',bridgeWarning='',bridgeMessage='',serviceMessage='',device='',target=null,lastMode='idle',lastSeq=-1,disposed=false,statusKey='checking',apiIssue='',lastDetail='',lastStaticLabel='',lastStatusText='',readGeneration=0,reading=false,unconfirmedStop=false,visualPoint=null,webHint='',webHintUntil=0,trackingReason='';
 const navigationMode='orbit';
 const zh=()=>getLanguage()==='zh',say=(a,b)=>zh()?a:b;
 const web=createGestureWeb({onOrbit,onPan,onCanvasClick,onHomeOrbit,onHomeClick,isArtworkActive:isActive,isFlying,getNavigationMode:()=>navigationMode,getLanguage,onStatus:(value,message)=>{if(message){webHint=message;webHintUntil=Date.now()+3000;}}});
 const actions=createGestureActions({web,onZoom:(spread,point)=>{if(isActive())onZoom(spread,point);},onStop});
 const canConnect=()=>mayUseService()&&mode==='gesture'&&serviceState==='ready'&&!requests.busy&&!document.hidden&&!disposed;
 function setTarget(next){if(next===target)return;target?.classList.remove('gesture-target');target=next;target?.classList.add('gesture-target');}
 function clearVisual(){actions.cancel();web.cancel({closePopup:true});visualPoint=null;if(topLayerCursor&&cursor.matches(':popover-open'))cursor.hidePopover();cursor.hidden=true;setTarget(null);lastMode='idle';progressRing.style.strokeDashoffset='107';}
 function label(){
  const staticLabel=`${getLanguage()}:${mode}:${serviceState}`;
  if(staticLabel!==lastStaticLabel){lastStaticLabel=staticLabel;
   head.setAttribute('aria-label',say('选择交互方式','Choose interaction mode'));
   mouseButton.textContent=say('鼠标 / 键盘','MOUSE / KEYBOARD');gestureButton.textContent=say('手势交互','GESTURES');
   mouseButton.dataset.shortLabel=say('鼠标','MOUSE');gestureButton.dataset.shortLabel=say('手势','GESTURES');
   mouseButton.setAttribute('aria-label',mouseButton.textContent);gestureButton.setAttribute('aria-label',gestureButton.textContent);
   mouseButton.setAttribute('aria-pressed',String(mode==='mouse'));gestureButton.setAttribute('aria-pressed',String(mode==='gesture'));
   mouseButton.classList.toggle('selected',mode==='mouse');gestureButton.classList.toggle('selected',mode==='gesture');
   gestureButton.title=!cameraAvailable?say('查看相机手势使用条件','View camera gesture requirements'):serviceState==='error'?say('重试连接本机相机','Retry local camera connection'):say('连接本机相机并启动手势','Connect local camera and start gestures');
   summary.textContent=say('操作提示 ⓘ','HOW TO CONTROL ⓘ');
   help.textContent=say('张掌移动光标。\n握拳再张掌：点击；握拳移动：拖动。\n城市画面上握拳拖动：旋转视角。\n三指缩放：拇、食、中指伸出，另两指收起。停稳后张大放大、合拢缩小；整掌退出。\n正文拖动滚动；滑块拖动调时间。\n放下手取消；重新张掌恢复。\n鼠标优先。文字用键盘；声音解锁、全屏用鼠标。','Relaxed open hand: move pointer.\nClose then open: click. Move a fist: drag; open to release.\nDrag the city with a fist to orbit.\nZoom: show thumb, index and middle; fold the other two. Hold this pose to enter, then spread / close to zoom. Open the whole hand to exit.\nDrag text vertically to scroll, or drag the slider to change time.\nLower the hand / leave frame: cancel without clicking.\nMouse takes priority; open the hand to resume. Use keyboard for text and real clicks for audio unlock / fullscreen.');
   if(publicCameraAvailable)help.textContent=say('在接好 Femto Bolt 的电脑上运行本机相机助手，再点击“手势交互”。若浏览器提示访问本机网络，请选择允许。\n相机画面留在本机，网页只接收动作和光标信息。\n\n','Run the local camera helper on the computer connected to Femto Bolt, then click GESTURES. If the browser requests access to this computer / local network, choose Allow.\nCamera images stay on this computer; only gesture and pointer data reaches the page.\n\n')+help.textContent;
   if(!cameraAvailable)help.textContent=say('此网址未配置相机连接。请从正式作品网址或本机入口使用手势。','Camera connection is not configured for this address. Use the published artwork or the local artwork.');
  }
  const detailText=lastDetail||bridgeMessage||serviceMessage||say('鼠标和键盘随时可用。','Mouse and keyboard are always available.');if(detail.textContent!==detailText)detail.textContent=detailText;
  panel.dataset.mode=mode;panel.dataset.enabled=String(mode==='gesture');panel.dataset.connection=connection;panel.dataset.service=serviceState;
  const text={checking:say('正在确认交互方式…','CHECKING INTERACTION MODE…'),off:say('鼠标 / 键盘已启用','MOUSE / KEYBOARD ACTIVE'),starting:say('正在启动相机，可随时切回鼠标','STARTING CAMERA · MOUSE REMAINS AVAILABLE'),stopping:say('正在关闭相机，鼠标已可用','STOPPING CAMERA · MOUSE IS ACTIVE'),connecting:say('相机就绪，正在连接…','CAMERA READY · CONNECTING…'),ready:say('相机就绪，抬起一只手开始','CAMERA READY · RAISE ONE HAND'),offline:say('连接中断，点击“手势交互”重试','DISCONNECTED · CLICK GESTURES TO RETRY'),error:say('相机未连接，点击“手势交互”重试','CAMERA UNAVAILABLE · CLICK GESTURES TO RETRY'),release_error:say('鼠标已启用，再点“鼠标 / 键盘”关闭相机','MOUSE ACTIVE · CLICK MOUSE / KEYBOARD TO CLOSE CAMERA'),local:say('请从本机入口开启手势交互','OPEN THE LOCAL ARTWORK TO USE GESTURES'),depth_invalid:say('掌心朝相机，移到画面中央','PALM FACING CAMERA · MOVE TO CENTRE'),out_of_range:say('调整手部距离，建议0.6–1.5米','ADJUST HAND DISTANCE · TRY 0.6–1.5 m'),depth_alignment:say('深度对齐异常，请重启','DEPTH ALIGNMENT ERROR · RESTART'),stale_inference:say('画面延迟，暂已停止','VIDEO DELAY · CONTROL STOPPED'),manual:say('鼠标优先，稍后恢复手势','MOUSE HAS PRIORITY'),hidden:say('手势已暂停，返回后自动连接','GESTURES PAUSED WHILE AWAY'),stale:say('画面暂未更新，已停止手势','WAITING FOR A FRESH FRAME'),pointer:say('张掌 · 移动光标','PALM · MOVE POINTER')}[statusKey]||say('等待相机画面','WAITING FOR CAMERA');
  const actionLabel={pointer:say('张掌 · 握拳松开点击','PALM · CLOSE / OPEN TO CLICK'),press:say('握拳 · 松开点击 / 移动拖动','FIST · RELEASE TO CLICK / MOVE TO DRAG'),zoom:say('三指 · 张大放大 / 合拢缩小','THREE FINGERS · SPREAD / CLOSE TO ZOOM'),rearm:say('请重新张掌，再开始操作','OPEN HAND TO RESUME'),drag:say('拖动中 · 张掌结束','DRAGGING · OPEN HAND TO RELEASE'),orbit:say('握拳拖动 · 旋转','FIST DRAG · ORBIT'),pan:say('握拳拖动 · 平移','FIST DRAG · PAN'),scroll:say('握拳拖动 · 滚动','FIST DRAG · SCROLL'),range:say('握拳拖动 · 调整滑块','FIST DRAG · ADJUST SLIDER')};
  const shown=!cameraAvailable?say('此网址未配置相机连接','CAMERA CONNECTION NOT CONFIGURED'):statusKey==='helper'?say('未连上本机助手：请启动助手、允许本机网络访问，再点手势重试','LOCAL HELPER NOT CONNECTED · START HELPER, ALLOW LOCAL ACCESS, RETRY GESTURES'):Date.now()<webHintUntil?webHint:statusKey==='pose_unknown'?say('手形暂未确认，先放松张掌','POSE UNCLEAR · RELAX AND OPEN HAND'):actionLabel[statusKey]||text;
  if(shown!==lastStatusText){status.textContent=shown;dockStatus.textContent=shown;summary.title=shown;lastStatusText=shown;}
 }
 function closeSocket(){const old=socket;socket=null;if(old){old.onclose=null;old.onerror=null;old.onmessage=null;old.close();}lastSeq=-1;gate.clear({sequence:true});clearVisual();}
 function connect(){
  if(!canConnect()||socket)return;
  closeSocket();connection='connecting';statusKey='connecting';bridgeStatus='starting';label();
  let current;try{current=new WebSocket(ENDPOINT);}catch{connection='error';statusKey='offline';label();schedulePoll(500);return;}socket=current;
  current.onopen=()=>{if(socket!==current)return;connection='connected';statusKey='ready';gate.clear({sequence:true});label();};
  current.onmessage=event=>{
   if(socket!==current||!canConnect()||typeof event.data!=='string'||event.data.length>8192)return;
   const message=decodeGestureMessage(event.data);if(!message)return;
   if(message.type==='status'){
    bridgeMessage=message.message;bridgeStatus=message.status;bridgeWarning=message.warning;lastDetail=bridgeMessage;device=message.device||device;connection=message.status==='error'?'error':'connected';statusKey=message.status==='ready'&&bridgeWarning?bridgeWarning:message.status;
    if(message.status!=='ready'||bridgeWarning){gate.clear();clearVisual();}label();return;
   }
   if(!gate.accept(message)){if(gate.current().reason==='stale')clearVisual();return;}
   trackingReason=message.trackingReason;
   bridgeStatus='ready';connection='connected';if(message.tracked&&message.mode!=='idle')bridgeWarning='';
   const live=gate.current(Date.now(),!document.hidden).frame;
   if(!live){clearVisual();return;}
   if(live.seq===lastSeq)return;lastSeq=live.seq;
   visualPoint=actions.accept(live);lastMode=actions.state.phase;
  };
  current.onclose=()=>{if(socket!==current)return;socket=null;connection='error';statusKey='offline';gate.clear({sequence:true});clearVisual();lastDetail='';label();schedulePoll(500);};
  current.onerror=()=>{if(socket===current){connection='error';statusKey='offline';label();}};
 }
 async function requestState(method='GET',requestedMode){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const options={method,cache:'no-store',signal:controller.signal,headers:{'X-Shanghai-Interaction':'1'},...(publicCameraAvailable?{mode:'cors',credentials:'omit',targetAddressSpace:'loopback'}:{})};
   if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify({mode:requestedMode});}
   const response=await fetch(interactionEndpoint,options);
   if(response.status===404||response.status===405){const error=new Error('local');error.kind='local';throw error;}
   const raw=await response.json(),state=decodeInteractionState(raw);
   if(!state||(!response.ok&&state.state!=='error'))throw new Error('unavailable');return state;
  }finally{clearTimeout(timeout);}
 }
 function applyState(next){
  if(disposed)return;
  if(unconfirmedStop&&next.mode!=='mouse'){mode='mouse';serviceState='error';closeSocket();connection='off';statusKey='release_error';label();schedulePoll(1200);return;}
  if(next.mode==='mouse'&&next.state!=='error')unconfirmedStop=false;
  mode=next.mode;serviceState=next.state;serviceMessage=next.message;device=next.device||device;apiIssue='';
  // Warning snapshots from polling must not overwrite fresher per-frame camera status.
  if(!socket){bridgeWarning=next.warning;bridgeMessage='';lastDetail='';}
  if(mode==='mouse'||serviceState!=='ready'){closeSocket();connection='off';statusKey=serviceState==='error'?(mode==='mouse'?'release_error':'error'):serviceState==='starting'?'starting':serviceState==='stopping'?'stopping':'off';}
  else if(!document.hidden&&!requests.busy)connect();
  label();schedulePoll(serviceState==='starting'||serviceState==='stopping'?450:1200);
 }
 function failed(error){
  if(disposed)return;if(publicCameraAvailable)publicConnectionRequested=false;apiIssue=publicCameraAvailable?'helper':error.kind==='local'?'local':'error';serviceState='error';closeSocket();connection='error';bridgeWarning='';bridgeMessage='';lastDetail='';serviceMessage='';statusKey=apiIssue==='local'?'local':unconfirmedStop?'release_error':apiIssue;label();schedulePoll(1600);
 }
 const requests=createModeRequestQueue({send:nextMode=>requestState('POST',nextMode),onIntent:nextMode=>{
  ++readGeneration;unconfirmedStop=nextMode==='mouse';mode=nextMode;serviceState=nextMode==='mouse'?'stopping':'starting';apiIssue='';bridgeWarning='';bridgeMessage='';lastDetail='';closeSocket();connection='off';statusKey=serviceState;label();
 },onResult:applyState,onError:failed});
 async function refresh(){
  if(!mayUseService()||disposed||document.hidden||requests.busy||reading)return false;
  const revision=requests.revision,generation=++readGeneration;reading=true;
  try{const state=await requestState();if(disposed||generation!==readGeneration||requests.busy||revision!==requests.revision)return false;applyState(state);return true;}
  catch(error){if(!disposed&&generation===readGeneration&&!requests.busy&&revision===requests.revision)failed(error);return false;}
  finally{reading=false;}
 }
 function schedulePoll(delay=1200){clearTimeout(pollTimer);if(mayUseService()&&!disposed&&!document.hidden)pollTimer=setTimeout(async()=>{await refresh();schedulePoll(serviceState==='starting'||serviceState==='stopping'?450:1200);},delay);}
 async function setEnabled(value){
  if(disposed)return null;
  if(!cameraAvailable){details.open=Boolean(value);statusKey='local';clearVisual();label();return null;}
  if(publicCameraAvailable){
   if(!value&&!publicConnectionRequested){mode='mouse';statusKey='off';details.open=false;label();return null;}
   publicConnectionRequested=true;details.open=Boolean(value);
  }
  const result=await requests.select(value?'gesture':'mouse');
  if(!disposed){if(canConnect())connect();schedulePoll(350);}return result;
 }
 mouseButton.onclick=()=>{void setEnabled(false);};gestureButton.onclick=()=>{void setEnabled(true);};
 function manual(event){if(!event.isTrusted)return;if(event.type==='pointermove'&&event.pointerType!=='mouse')return;gate.noteManual();clearVisual();}
 for(const name of ['pointerdown','pointermove','wheel','keydown'])document.addEventListener(name,manual,{capture:true,passive:true});
 function visibility(){
  ++readGeneration;
  if(document.hidden){clearTimeout(pollTimer);closeSocket();statusKey=mode==='gesture'?'hidden':'off';label();}
  else{void refresh().finally(()=>schedulePoll(350));}
 }
 function navigation(){clearVisual();web.cancel({closePopup:true});}
 document.addEventListener('visibilitychange',visibility);window.addEventListener('sh2050:language',label);window.addEventListener('sh2050:navigation',navigation);window.addEventListener('resize',navigation);
 const modalObserver=new MutationObserver(records=>{if(records.some(r=>r.target.matches?.('dialog')&&r.attributeName==='open'))navigation();});modalObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 function update(now){
  if(disposed)return;raf=requestAnimationFrame(update);
  if(mode!=='gesture'||serviceState!=='ready'||requests.busy){clearVisual();return;}
  const {frame,reason}=gate.current(Date.now(),!document.hidden);
  const activeDialog=web.activeDialog;
  const cursorParent=activeDialog||document.body;if(cursor.parentNode!==cursorParent)cursorParent.append(cursor);
  if(!frame){clearVisual();lastDetail=bridgeMessage||serviceMessage;statusKey=document.hidden?'hidden':reason==='manual'?'manual':apiIssue|| (bridgeStatus==='error'?'error':connection==='error'?'offline':connection==='connecting'?'connecting':bridgeWarning||(reason==='stale'?'stale':trackingReason.startsWith('geometry_')?'pose_unknown':'ready'));label();return;}
  if(!visualPoint){if(topLayerCursor&&cursor.matches(':popover-open'))cursor.hidePopover();cursor.hidden=true;statusKey='rearm';label();return;}
  const {x,y}=visualPoint;cursor.hidden=false;
  if(topLayerCursor&&!cursor.matches(':popover-open'))cursor.showPopover();
  if(!topLayerCursor&&activeDialog&&getComputedStyle(activeDialog).transform!=='none'){
   const rect=activeDialog.getBoundingClientRect(),sx=rect.width/activeDialog.offsetWidth||1,sy=rect.height/activeDialog.offsetHeight||1;
   cursor.style.position='absolute';cursor.style.transform=`translate(${(x-rect.left)/sx+activeDialog.scrollLeft-activeDialog.clientLeft-20}px,${(y-rect.top)/sy+activeDialog.scrollTop-activeDialog.clientTop-20}px)`;
  }else{cursor.style.position='fixed';cursor.style.transform=`translate(${x-20}px,${y-20}px)`;}
  cursor.dataset.mode=lastMode;
  setTarget(web.target);progressRing.style.strokeDashoffset=lastMode==='press'?'0':'107';statusKey=lastMode==='press'&&web.dragging?(web.status||'drag'):lastMode;
  lastDetail=[device,`${frame.hands} ${say('只手','HAND(S)')}`,frame.depthMm===null?'':`${(frame.depthMm/1000).toFixed(2)} m`].filter(Boolean).join(' · ');label();
 }
 label();raf=requestAnimationFrame(update);
 const api={setEnabled,getState:()=>({enabled:mode==='gesture',mode,serviceState,connection,status:statusKey,warning:bridgeWarning,gestureMode:lastMode,navigationMode,device,target:target?.id||target?.className||null,endpoint:ENDPOINT,localCameraAvailable,publicCameraAvailable,interactionEndpoint,lastSeq:gate.state.lastSeq,pending:requests.busy}),dispose(){disposed=true;closeSocket();web.dispose();modalObserver.disconnect();layout.dispose();clearTimeout(pollTimer);cancelAnimationFrame(raf);for(const name of ['pointerdown','pointermove','wheel','keydown'])document.removeEventListener(name,manual,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('sh2050:language',label);window.removeEventListener('sh2050:navigation',navigation);window.removeEventListener('resize',navigation);panel.remove();cursor.remove();style.remove();}};
 // Consume the old launcher's explicit request so later reloads cannot override another tab.
 const url=new URL(location.href),explicitStart=url.searchParams.get('gesture')==='1';if(explicitStart){url.searchParams.delete('gesture');history.replaceState(history.state,'',url);}
 if(localCameraAvailable)void refresh().then(ok=>{if(ok&&explicitStart&&!requests.busy&&!(mode==='gesture'&&['starting','ready'].includes(serviceState)))return setEnabled(true);}).finally(()=>schedulePoll(500));
 else{serviceState='off';statusKey=cameraAvailable?'off':'local';label();}
 return api;
}

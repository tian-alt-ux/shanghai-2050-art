// Page controls have explicit adapters. A cancelled or interrupted press never clicks.
const ACTIONS='button,a[href],summary,input:not([type="hidden"]),textarea,select,[role="button"]';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function rangeValueAt({min=0,max=100,step=1,left=0,width=1,x=0,rtl=false}){
 min=Number(min);max=Number(max);if(!Number.isFinite(min))min=0;if(!Number.isFinite(max))max=100;if(max<=min)return min;
 let fraction=clamp((x-left)/Math.max(1,width),0,1);if(rtl)fraction=1-fraction;
 const value=min+fraction*(max-min),increment=Number(step);
 return clamp(Number((Number.isFinite(increment)&&increment>0?min+Math.round((value-min)/increment)*increment:value).toFixed(8)),min,max);
}

export function createGestureWeb({
 onOrbit=()=>{},onPan=()=>{},onCanvasClick=()=>{},onHomeOrbit=()=>{},onHomeClick=()=>{},
 isArtworkActive=()=>document.body.dataset.view==='artwork',isFlying=()=>false,
 getNavigationMode=()=> 'orbit',getLanguage=()=> 'zh',onStatus=()=>{},dragThreshold=12
}={}){
 let press=null,currentTarget=null,status='pointer',message='',popup=null,disposed=false;
 let dialogs=[...document.querySelectorAll('dialog[open]')];
 const say=(zh,en)=>getLanguage()==='zh'?zh:en;
 function state(next,text=''){status=next;message=text;onStatus(next,text);}
 function topDialog(){dialogs=dialogs.filter(node=>node.matches('dialog')&&node.isConnected&&node.open);for(const node of document.querySelectorAll('dialog[open]'))if(!dialogs.includes(node))dialogs.push(node);return dialogs.at(-1)||null;}
 const view=()=>document.body.dataset.view||'';
 function available(node){
  if(!node?.isConnected||node.disabled||node.matches(':disabled')||node.hidden||node.getAttribute('aria-disabled')==='true'||node.closest('[inert],[hidden]'))return false;
  const modal=topDialog();if(modal&&!modal.contains(node))return false;
  const box=node.getBoundingClientRect(),style=getComputedStyle(node);
  return box.width>0&&box.height>0&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0;
 }
 function scrollParent(node){
  const boundary=topDialog();
  for(let el=node;el&&el!==document.documentElement;el=el.parentElement){
   const css=getComputedStyle(el),vertical=/auto|scroll|overlay/.test(css.overflowY)&&el.scrollHeight>el.clientHeight+1,horizontal=/auto|scroll|overlay/.test(css.overflowX)&&el.scrollWidth>el.clientWidth+1;
   if(vertical||horizontal)return {node:el,vertical,horizontal};
   if(el===boundary)break;
  }
  return null;
 }
 function hitAt(x,y){
  if(disposed||!Number.isFinite(x)||!Number.isFinite(y)||document.hidden||view()==='entering')return {kind:'none',target:null};
  const hit=document.elementFromPoint(x,y),modal=topDialog();
  if(!hit||hit.closest('[inert],[hidden]')||(modal&&!modal.contains(hit)))return {kind:'none',target:null};
  if(popup&&!popup.node.contains(hit))return {kind:'dismiss',target:null,node:popup.node};
  const action=hit.closest(ACTIONS),scroll=scrollParent(hit);
  const gallery=hit.closest('#echo-gallery-host');
  if(gallery&&available(gallery)&&gallery.dataset.renderer!=='fallback'&&window.SH2050_ECHO_GESTURE)return {kind:'gallery',node:gallery,target:action&&available(action)?action:null};
  if(action&&available(action)){
   if(action.matches('input[type="range"]'))return {kind:'range',node:action,target:action};
   if(action.matches('select'))return {kind:'select',node:action,target:action,scroll};
   if(action.matches('textarea,input:not([type]),input[type="text"],input[type="search"],input[type="email"],input[type="tel"],input[type="url"],input[type="number"],input[type="password"]'))return {kind:'text',node:action,target:action,scroll};
   return {kind:'action',node:action,target:action,scroll};
  }
  if(hit.id==='world'&&!modal&&isArtworkActive())return {kind:'city',node:hit,target:null};
  if(hit.id==='globe-canvas'&&!modal&&view()==='landing')return {kind:'globe',node:hit,target:null};
  if(scroll)return {kind:'scroll',node:scroll.node,target:null,scroll};
  return {kind:'none',target:null};
 }
 function contextMatches(session){
  return !disposed&&!document.hidden&&session.view===view()&&session.modal===topDialog()&&session.node?.isConnected&&available(session.node);
 }
 function closePopup(){popup?.node.remove();popup=null;}
 function showSelect(select){
  closePopup();
  const node=document.createElement('div');node.className='gesture-select-list';node.setAttribute('role','listbox');node.setAttribute('aria-label',select.getAttribute('aria-label')||say('选择地点','Select a place'));
  Object.assign(node.style,{position:'fixed',zIndex:'2147482000',boxSizing:'border-box',padding:'5px',overflowY:'auto',overscrollBehavior:'contain',background:'#061723',border:'1px solid #6eabb0',borderRadius:'4px',boxShadow:'0 4px 18px #0009',font:'12px/1.4 Consolas,"Microsoft YaHei",sans-serif',color:'#d7edf1',pointerEvents:'auto'});
  for(const [index,option] of [...select.options].entries()){
   if(option.hidden)continue;
   const button=document.createElement('button');button.type='button';button.textContent=option.label||option.textContent;button.disabled=option.disabled||option.parentElement?.matches('optgroup[disabled]');button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===select.selectedIndex));
   Object.assign(button.style,{display:'block',boxSizing:'border-box',width:'100%',minHeight:'32px',padding:'6px 8px',border:0,borderRadius:'2px',textAlign:'left',font:'inherit',color:button.disabled?'#6a7f87':'#d7edf1',background:index===select.selectedIndex?'#234b55':'transparent',cursor:'pointer'});
   button.onclick=()=>{if(!available(select)||button.disabled)return;select.selectedIndex=index;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));closePopup();};node.append(button);
  }
  (topDialog()||document.body).append(node);popup={node,select,modal:topDialog(),view:view()};
  const rect=select.getBoundingClientRect(),width=Math.min(Math.max(180,rect.width),innerWidth-16),height=Math.min(260,innerHeight-24);
  Object.assign(node.style,{width:`${width}px`,maxHeight:`${height}px`,left:`${clamp(rect.right-width,8,Math.max(8,innerWidth-width-8))}px`});
  const below=innerHeight-rect.bottom-8;node.style.top=`${below>=Math.min(height,node.scrollHeight)?rect.bottom+4:Math.max(8,rect.top-Math.min(height,node.scrollHeight)-4)}px`;
  node.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});
 }
 function updateRange(session,x){
  const node=session.node,rect=node.getBoundingClientRect(),before=node.value;
  node.value=String(rangeValueAt({min:node.min||0,max:node.max||100,step:node.step||1,left:rect.left,width:rect.width,x,rtl:getComputedStyle(node).direction==='rtl'}));
  if(node.value!==before){session.changed=true;node.dispatchEvent(new Event('input',{bubbles:true}));}
 }
 function activate(session){
  const node=session.node;
  if(session.kind==='city'){if(!isFlying())onCanvasClick(session.x,session.y);return;}
  if(session.kind==='globe'){onHomeClick(session.x,session.y);return;}
  if(session.kind==='gallery'){
   const api=window.SH2050_ECHO_GESTURE;if(api?.begin(session.x,session.y))api.end({release:true});return;
  }
  if(session.kind==='dismiss'){closePopup();return;}
  if(session.kind==='select'){showSelect(node);return;}
  if(session.kind==='range'){updateRange(session,session.x);if(session.changed)node.dispatchEvent(new Event('change',{bubbles:true}));return;}
  if(session.kind==='text'){node.focus({preventScroll:true});state('text',say('请用键盘输入文字。','Use the keyboard to enter text.'));return;}
  if(session.kind!=='action')return;
  if(node.id==='fullscreen'||node.matches('input[type="file"]')||node.matches('a[href]')&&(node.target==='_blank'||!node.href.startsWith(location.origin))){state('activation',say('此操作请使用鼠标：浏览器需要真实点击。','Use a real mouse click for this browser action.'));return;}
  if(node.matches('[data-sound-toggle],#sound')){
   if(!window.SH2050_SOUND?.getState().unlocked){state('activation',say('请先用鼠标开启一次声音。','Enable sound once with a real mouse click.'));return;}
   window.SH2050_SOUND.toggle();return;
  }
  node.focus?.({preventScroll:true});node.click();
 }
 function hover(x,y){
  if(press&&!contextMatches(press))cancel();
  if(popup&&(!available(popup.select)||popup.modal!==topDialog()||popup.view!==view()))closePopup();
  if(press)return {target:currentTarget,kind:press.kind,status};
  const hit=hitAt(x,y);currentTarget=hit.target;
  if(hit.kind==='gallery')window.SH2050_ECHO_GESTURE?.hover(x,y);
  else window.SH2050_ECHO_GESTURE?.hover(-1000,-1000);
  state('pointer');return {target:currentTarget,kind:hit.kind,status};
 }
 function begin(x,y){
  cancel();const hit=hitAt(x,y);if(hit.kind==='none')return false;
  press={...hit,x,y,lastX:x,lastY:y,view:view(),modal:topDialog(),navigation:getNavigationMode(),dragged:false,changed:false,galleryStarted:false};currentTarget=hit.target;state('press');return true;
 }
 function move(x,y){
  const session=press;if(!session)return false;if(!contextMatches(session)){cancel();return false;}
  if(!Number.isFinite(x)||!Number.isFinite(y)){cancel();return false;}
  if(!session.dragged&&Math.hypot(x-session.x,y-session.y)<dragThreshold)return true;
  session.dragged=true;
  const dx=x-session.lastX,dy=y-session.lastY;
  if(session.kind==='city'){
   state(session.navigation==='pan'?'pan':'orbit');(session.navigation==='pan'?onPan:onOrbit)(dx/innerWidth,dy/innerHeight);
  }else if(session.kind==='globe'){state('orbit');onHomeOrbit(dx/innerWidth,dy/innerHeight);}
  else if(session.kind==='gallery'){
   const api=window.SH2050_ECHO_GESTURE;if(!session.galleryStarted)session.galleryStarted=!!api?.begin(session.x,session.y);if(session.galleryStarted)api.move(x,y);state('drag');
  }else if(session.kind==='range'){updateRange(session,x);state('drag');}
  else if(session.scroll){const scroll=session.scroll;if(scroll.vertical)scroll.node.scrollTop-=dy;if(scroll.horizontal)scroll.node.scrollLeft-=dx;state('scroll');}
  else state('drag');
  session.lastX=x;session.lastY=y;return true;
 }
 function end({release=false}={}){
  const session=press;if(!session)return false;const valid=release&&contextMatches(session);press=null;currentTarget=null;state('pointer');
  if(session.galleryStarted){window.SH2050_ECHO_GESTURE?.end({release:!!valid});return !!valid;}
  if(!valid)return false;
  if(session.dragged){if(session.kind==='range'&&session.changed)session.node.dispatchEvent(new Event('change',{bubbles:true}));return true;}
  activate(session);return true;
 }
 function cancel({closePopup:close=false}={}){
  if(press?.galleryStarted)window.SH2050_ECHO_GESTURE?.cancel();press=null;currentTarget=null;state('pointer');if(close)closePopup();
 }
 function zoomTarget(x,y){const hit=hitAt(x,y);return !press&&!isFlying()&&Boolean(hit.kind==='city'||hit.target?.closest('#landmarks')&&!topDialog()&&isArtworkActive());}
 const observer=new MutationObserver(records=>{
  const previous=dialogs.at(-1)||null;for(const record of records)if(record.attributeName==='open'&&record.target.matches('dialog')){
   const node=record.target;dialogs=dialogs.filter(item=>item!==node);if(node.open)dialogs.push(node);
  }
  if(press&&(previous!==topDialog()||!contextMatches(press)))cancel();
  if(popup&&(popup.modal!==topDialog()||popup.view!==view()||!popup.select.isConnected))closePopup();
 });
 observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','data-view','inert']});
 function resize(){cancel({closePopup:true});}
 function outside(event){if(event.isTrusted&&popup&&!popup.node.contains(event.target)&&event.target!==popup.select)closePopup();}
 addEventListener('resize',resize);document.addEventListener('pointerdown',outside,true);
 return {hover,begin,move,end,cancel,zoomTarget,get activeDialog(){return topDialog();},get target(){return currentTarget;},get status(){return status;},get message(){return message;},get pressed(){return !!press;},get dragging(){return !!press?.dragged;},dispose(){if(disposed)return;cancel({closePopup:true});disposed=true;observer.disconnect();removeEventListener('resize',resize);document.removeEventListener('pointerdown',outside,true);}};
}

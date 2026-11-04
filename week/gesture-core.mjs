// Browser-independent protocol and lifecycle state. Coordinates are mirrored by the bridge.
const MODES=new Set(['pointer','press','zoom','idle']);
const WARNINGS=new Set(['depth_invalid','out_of_range','depth_alignment','stale_inference']);
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function decodeInteractionState(value){
 if(!value||!['mouse','gesture'].includes(value.mode)||!['off','starting','ready','stopping','error'].includes(value.state)||typeof value.message!=='string')return null;
 return {mode:value.mode,state:value.state,message:value.message.slice(0,500),device:typeof value.device==='string'?value.device.slice(0,100):'',warning:WARNINGS.has(value.warning)?value.warning:''};
}

// Never let a slow start request arrive after a newer stop request. Pending choices are coalesced,
// while the current request is allowed to finish before the next one is sent.
export function createModeRequestQueue({send,onIntent=()=>{},onResult=()=>{},onError=()=>{}}){
 let revision=0,pending=null,busy=false,lastResult=null,waiters=[];
 async function drain(){
  busy=true;
  while(pending){
   const current=pending;pending=null;
   try{const result=await send(current.mode);if(current.revision===revision){lastResult=result;onResult(result);}}
   catch(error){if(current.revision===revision){lastResult=null;onError(error);}}
  }
  busy=false;for(const resolve of waiters.splice(0))resolve(lastResult);
 }
 return {
  select(mode){
   if(!['mouse','gesture'].includes(mode))return Promise.reject(new TypeError('Unknown interaction mode'));
   pending={mode,revision:++revision};onIntent(mode);
   const result=new Promise(resolve=>waiters.push(resolve));if(!busy)void drain();return result;
  },
  get busy(){return busy;},get revision(){return revision;}
 };
}

export function decodeGestureMessage(raw){
 let value;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{return null;}
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 if(value.type==='status'){
  if(!['starting','ready','error'].includes(value.status)||typeof value.message!=='string')return null;
  return {type:'status',status:value.status,message:value.message.slice(0,300),device:typeof value.device==='string'?value.device.slice(0,100):'',warning:WARNINGS.has(value.warning)?value.warning:''};
 }
 if(value.type!=='tracking'||!Number.isSafeInteger(value.seq)||value.seq<0||!finite(value.timestamp)||value.timestamp<=0||typeof value.tracked!=='boolean'||!MODES.has(value.mode))return null;
 if(!Number.isInteger(value.hands)||value.hands<0||value.hands>2)return null;
 const p=value.pointer,d=value.delta;
 if(!p||!finite(p.x)||!finite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)return null;
 if(!d||!finite(d.x)||!finite(d.y)||!finite(d.zoom))return null;
 if(value.depthMm!==null&&(!finite(value.depthMm)||value.depthMm<0))return null;
 if(value.tracked&&value.hands===0)return null;
 // A release must be explicit: a missing packet/unknown pose can never click.
 if(typeof value.release!=='boolean'||typeof value.cancel!=='boolean')return null;
 if(value.release&&(!value.tracked||value.mode!=='pointer'||value.cancel))return null;
 const trackingReason=typeof value.diagnostic?.reason==='string'?value.diagnostic.reason.slice(0,60):'';
 return {type:'tracking',seq:value.seq,timestamp:value.timestamp,tracked:value.tracked,mode:value.tracked?value.mode:'idle',release:value.release,cancel:value.cancel,trackingReason,pointer:{x:p.x,y:p.y},delta:{x:clamp(d.x,-.08,.08),y:clamp(d.y,-.08,.08),zoom:clamp(d.zoom,-.14,.14)},hands:value.hands,depthMm:value.depthMm};
}

export function createFrameGate({maxAgeMs=500,futureToleranceMs=1000,manualHoldMs=1500}={}){
 let lastSeq=-1,lastTimestamp=0,frame=null,receivedAt=0,manualUntil=0,reason='waiting';
 return {
  accept(next,now=Date.now()){
   if(!next||next.type!=='tracking')return false;
   if(next.seq<=lastSeq||next.timestamp<lastTimestamp){reason='out-of-order';return false;}
   lastSeq=next.seq;lastTimestamp=next.timestamp;
   if(now-next.timestamp>maxAgeMs||next.timestamp-now>futureToleranceMs){frame=null;reason='stale';return false;}
   frame=next;receivedAt=now;reason=next.tracked?'tracking':'no-hands';return true;
  },
  current(now=Date.now(),visible=true){
   if(!visible)return {frame:null,reason:'hidden'};
   if(now<manualUntil)return {frame:null,reason:'manual'};
   if(!frame)return {frame:null,reason};
   if(now-receivedAt>maxAgeMs||now-frame.timestamp>maxAgeMs)return {frame:null,reason:'stale'};
   if(!frame.tracked||frame.mode==='idle')return {frame:null,reason:'no-hands'};
   return {frame,reason:'tracking'};
  },
  noteManual(now=Date.now()){manualUntil=now+manualHoldMs;frame=null;reason='manual';},
  clear({sequence=false}={}){frame=null;receivedAt=0;reason='waiting';if(sequence){lastSeq=-1;lastTimestamp=0;}},
  get state(){return {lastSeq,lastTimestamp,manualUntil,reason};}
 };
}


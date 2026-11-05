// The public artwork uses a fixed service origin. URL parameters never select a service.
export const ECHOES_CLOUD_API='https://tian-shanghai2050-echoes.active-horse-9863.chatgpt.site/api/echoes';
const TOKEN_KEY='sh2050-echo-visitor-v1:'+new URL(ECHOES_CLOUD_API).origin;
const usableToken=value=>typeof value==='string'&&value.length>=20&&value.length<=4096&&/^[A-Za-z0-9._-]+$/.test(value);
const browserStorage=()=>{try{return globalThis.localStorage;}catch{return null;}};
const SERVER_CODES=new Set(['visitor_authorization_required','origin_not_allowed','origin_required','preflight_not_allowed','storage_unavailable','rate_limited','invalid_input','invalid_json','body_too_large','request_timeout','collection_full']);
const elapsed=start=>Math.max(0,Math.round(Date.now()-start));
const connectionError=(kind,code,{status,durationMs=0}={})=>Object.assign(Error(code),{
 name:'EchoConnectionError',kind,code,...(Number.isInteger(status)?{status}:{}),durationMs,retryable:kind==='network'||kind==='timeout',
});
const responseKind=status=>status===429?'rate_limit':status===401||status===403?'authorization':status>=500?'backend':status>=400&&status<500?'validation':'response';

export function echoesEndpoint(location=globalThis.location){
 let url;try{url=new URL(typeof location==='string'?location:location.href);}catch{return {url:'./api/echoes',cloud:false};}
 const cloud=url.protocol==='https:'&&url.hostname==='tian-alt-ux.github.io'&&(url.pathname==='/shanghai-2050-art'||url.pathname.startsWith('/shanghai-2050-art/'));
 return {url:cloud?ECHOES_CLOUD_API:'./api/echoes',cloud};
}

export function createEchoConnection({location=globalThis.location,fetchImpl=globalThis.fetch,storage=browserStorage(),timeoutMs=25000,retryDelayMs=350,onDiagnostic=()=>{}}={}){
 const endpoint=echoesEndpoint(location);
 let token='',pendingGet=null;
 if(endpoint.cloud){try{const saved=storage?.getItem(TOKEN_KEY);if(usableToken(saved))token=saved;}catch{}}
 function remember(value){
  if(!endpoint.cloud||!usableToken(value))return;
  token=value;try{storage?.setItem(TOKEN_KEY,value);}catch{/* Keep the visitor token in memory when browser storage is unavailable. */}
 }
 function diagnostic(event,method,error,attempt){
  // Never include a visitor capability, request body, response body or arbitrary exception text.
  try{onDiagnostic({event,method:['GET','POST'].includes(method)?method:'OTHER',name:error.name,kind:error.kind,code:error.code,...(Number.isInteger(error.status)?{status:error.status}:{}),durationMs:error.durationMs,attempt});}catch{}
 }
 async function send(options={},budget={remaining:1}){
  const method=(options.method||'GET').toUpperCase(),headers=new Headers(options.headers);
  // Pin the capability and body for ambiguous transport retries. A committed write
  // can then be returned by the service's existing visitor/text deduplication.
  if(endpoint.cloud&&token)headers.set('X-Echo-Visitor',token);
  for(let attempt=1;;attempt++){
   const controller=new AbortController(),start=Date.now();let timer,timedOut=false;
   try{
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;controller.abort();reject(connectionError('timeout','request_timeout',{durationMs:elapsed(start)}));},timeoutMs);});
    const operation=(async()=>{
     const response=await fetchImpl(endpoint.url,{...options,headers:new Headers(headers),cache:'no-store',credentials:endpoint.cloud?'omit':'same-origin',...(endpoint.cloud?{mode:'cors'}:{}),signal:controller.signal});
     let data;
     try{data=await response.json();}catch{
      if(controller.signal.aborted)throw connectionError('timeout','request_timeout',{durationMs:elapsed(start)});
      throw connectionError(responseKind(response.status),'invalid_response',{status:response.status,durationMs:elapsed(start)});
     }
     if(!response.ok)throw connectionError(responseKind(response.status),SERVER_CODES.has(data?.error)?data.error:'request_failed',{status:response.status,durationMs:elapsed(start)});
     if(!data||typeof data!=='object'||Array.isArray(data))throw connectionError('response','invalid_response',{status:response.status,durationMs:elapsed(start)});
     return data;
    })();
    const data=await Promise.race([operation,deadline]);remember(data.visitorToken);return data;
   }catch(cause){
    const error=cause?.name==='EchoConnectionError'?cause:connectionError(timedOut||cause?.name==='AbortError'?'timeout':'network',timedOut||cause?.name==='AbortError'?'request_timeout':'network_error',{durationMs:elapsed(start)});
    if(error.retryable&&['GET','POST'].includes(method)&&budget.remaining>0){
     budget.remaining--;diagnostic('retry',method,error,attempt);
     if(retryDelayMs>0)await new Promise(resolve=>setTimeout(resolve,retryDelayMs));
     continue;
    }
    diagnostic('failure',method,error,attempt);throw error;
   }finally{clearTimeout(timer);}
  }
 }
 function get(){
  if(!pendingGet)pendingGet=send({method:'GET'}).finally(()=>{pendingGet=null;});
  return pendingGet;
 }
 async function requireVisitor(){
  if(token)return;
  await get();
  if(!token)throw connectionError('authorization','visitor_session_unavailable');
 }
 async function request(options={}){
  if((options.method||'GET').toUpperCase()==='GET')return get();
  const budget={remaining:1};
  if(!endpoint.cloud)return send(options,budget);
  await requireVisitor();
  try{return await send(options,budget);}catch(error){
   // Only refresh visitor authorization, never retry origin, validation, or rate errors.
   if(error.status!==401&&!(error.status===403&&error.code==='visitor_authorization_required'))throw error;
   token='';try{storage?.removeItem(TOKEN_KEY);}catch{}
   await requireVisitor();return send(options,budget);
  }
 }
 return {request,endpoint:endpoint.url,cloud:endpoint.cloud};
}

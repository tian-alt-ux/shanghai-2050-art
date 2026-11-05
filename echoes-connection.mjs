// The public artwork uses a fixed service origin. URL parameters never select a service.
export const ECHOES_CLOUD_API='https://tian-shanghai2050-echoes.active-horse-9863.chatgpt.site/api/echoes';
const TOKEN_KEY='sh2050-echo-visitor-v1:'+new URL(ECHOES_CLOUD_API).origin;
const usableToken=value=>typeof value==='string'&&value.length>=20&&value.length<=4096&&/^[A-Za-z0-9._-]+$/.test(value);
const browserStorage=()=>{try{return globalThis.localStorage;}catch{return null;}};

export function echoesEndpoint(location=globalThis.location){
 let url;try{url=new URL(typeof location==='string'?location:location.href);}catch{return {url:'./api/echoes',cloud:false};}
 const cloud=url.protocol==='https:'&&url.hostname==='tian-alt-ux.github.io'&&(url.pathname==='/shanghai-2050-art'||url.pathname.startsWith('/shanghai-2050-art/'));
 return {url:cloud?ECHOES_CLOUD_API:'./api/echoes',cloud};
}

export function createEchoConnection({location=globalThis.location,fetchImpl=globalThis.fetch,storage=browserStorage(),timeoutMs=8000}={}){
 const endpoint=echoesEndpoint(location);
 let token='',pendingGet=null;
 if(endpoint.cloud){try{const saved=storage?.getItem(TOKEN_KEY);if(usableToken(saved))token=saved;}catch{}}
 function remember(value){
  if(!endpoint.cloud||!usableToken(value))return;
  token=value;try{storage?.setItem(TOKEN_KEY,value);}catch{/* Keep the visitor token in memory when browser storage is unavailable. */}
 }
 async function send(options={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const headers=new Headers(options.headers);
   if(endpoint.cloud&&token)headers.set('X-Echo-Visitor',token);
   const response=await fetchImpl(endpoint.url,{...options,headers,cache:'no-store',credentials:endpoint.cloud?'omit':'same-origin',...(endpoint.cloud?{mode:'cors'}:{}),signal:controller.signal});
   let data;try{data=await response.json();}catch{const error=Error('invalid_response');error.status=response.status;throw error;}
   if(!response.ok){const error=Error(data?.error||'request_failed');error.status=response.status;error.code=data?.error;throw error;}
   if(!data||typeof data!=='object')throw Error('invalid_response');
   remember(data.visitorToken);return data;
  }finally{clearTimeout(timer);}
 }
 function get(){
  if(!pendingGet)pendingGet=send({method:'GET'}).finally(()=>{pendingGet=null;});
  return pendingGet;
 }
 async function requireVisitor(){
  if(token)return;
  await get();
  if(!token)throw Error('visitor_session_unavailable');
 }
 async function request(options={}){
  if((options.method||'GET').toUpperCase()==='GET')return get();
  if(!endpoint.cloud)return send(options);
  await requireVisitor();
  try{return await send(options);}catch(error){
   // Only refresh visitor authorization, never retry origin, validation, or rate errors.
   if(error.status!==401&&!(error.status===403&&error.code==='visitor_authorization_required'))throw error;
   token='';try{storage?.removeItem(TOKEN_KEY);}catch{}
   await requireVisitor();return send(options);
  }
 }
 return {request,endpoint:endpoint.url,cloud:endpoint.cloud};
}

/** Lossless city assets. Requests are bounded, validated and shared by all consumers. */
export const CITY_ASSETS=Object.freeze({
 'road-network.json':846488,'building-catalog.json':1555353,'signal-network.json':6211,
 'historical-era5-reference.json':7318,'historical-era5-sky-reference.json':7946,
 'artwork-landmarks.json':23336,'shanghai-sample.glb':6745964,'source-water-mask.json':79420,
 'building-triangle-features.bin':432676,'regional-buildings.bin':13761408,
 'regional-roads.bin':5487672,'regional-water.bin':7305816,
 'regional-building-edges.bin':20642112,'regional-roof-volumes.bin':21025536,
 'regional-water-triangles.bin':14235072,
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function failure(name,message,{retryable=true,cause}={}){
 const error=new Error(`${name}: ${message}`,{cause});error.name='CityResourceError';
 error.resource=name;error.retryable=retryable;return error;
}

export function createResourceLoader({baseURL=new URL('./data/',import.meta.url),fetchImpl=globalThis.fetch,
 assets=CITY_ASSETS,onProgress=()=>{},onRetry=()=>{},attempts=3,maxConcurrent=4,
 headerTimeoutMs=30000,idleTimeoutMs=30000,totalTimeoutMs=180000,retryDelayMs=650,
 DecompressionStreamImpl=globalThis.DecompressionStream}={}){
 const cache=new Map(),received=new Map(),completed=new Set(),queue=[],activeControllers=new Set();
 let fatalError=null;
 let running=0;
 const names=Object.keys(assets),totalBytes=Object.values(assets).reduce((a,b)=>a+b,0);
 function progress(name,bytes){
  received.set(name,Math.min(bytes,assets[name]));
  onProgress({resource:name,receivedBytes:[...received.values()].reduce((a,b)=>a+b,0),totalBytes,
   completed:completed.size,total:names.length});
 }
 function schedule(task){return new Promise((resolve,reject)=>{queue.push({task,resolve,reject});pump();});}
 function pump(){
  while(running<maxConcurrent&&queue.length){const job=queue.shift();running++;
   Promise.resolve().then(job.task).then(job.resolve,job.reject).finally(()=>{running--;pump();});}
 }
 async function read(name){
  for(let attempt=1;attempt<=attempts;attempt++){
   if(fatalError)throw fatalError;
   const compressed=attempt===1&&typeof DecompressionStreamImpl==='function'&&/\.(?:bin|glb)$/.test(name);
   const controller=new AbortController();let idleTimer,deadline,timedOut=false,reader;
   activeControllers.add(controller);
   const abort=()=>{timedOut=true;controller.abort();};
   const idle=ms=>{clearTimeout(idleTimer);idleTimer=setTimeout(abort,ms);};
   received.set(name,0);
   try{
    idle(headerTimeoutMs);deadline=setTimeout(abort,totalTimeoutMs);
    // Retry bypasses a potentially stale/incomplete intermediary cache; first visits can reuse valid assets.
    const response=await fetchImpl(new URL(name+(compressed?'.gz':''),baseURL),{signal:controller.signal,cache:attempt===1?'default':'reload',credentials:'same-origin'});
    if(!response.ok||response.status!==200)throw failure(name,`HTTP ${response.status}`,{retryable:response.status===206||response.status===408||response.status===429||response.status>=500});
    if(/(?:text\/html|application\/xhtml)/i.test(response.headers?.get('content-type')??''))throw failure(name,'unexpected HTML response');
    idle(idleTimeoutMs);
    let buffer;
    if(response.body?.getReader){
     reader=response.body.getReader();const chunks=[];let size=0;
     while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
      if(size>assets[name]+(compressed?65536:0))throw failure(name,'asset length exceeds the published size');
      chunks.push(value);progress(name,size);idle(idleTimeoutMs);
     }
     const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}buffer=result.buffer;
    }else{buffer=await response.arrayBuffer();progress(name,buffer.byteLength);}
    if(compressed){
     const bytes=new Uint8Array(buffer);
     if(bytes[0]===0x1f&&bytes[1]===0x8b){
      reader=new Blob([buffer]).stream().pipeThrough(new DecompressionStreamImpl('gzip')).getReader();
      const chunks=[];let size=0;
      while(true){if(controller.signal.aborted)throw failure(name,'network timeout');const part=await reader.read();if(part.done)break;
       size+=part.value.byteLength;if(size>assets[name])throw failure(name,'invalid expanded asset length');chunks.push(part.value);}
      const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}buffer=result.buffer;
     }
     // Some hosts already apply Content-Encoding:gzip. Their decoded body is checked identically.
    }
    if(buffer.byteLength!==assets[name])throw failure(name,`incomplete asset (${buffer.byteLength}/${assets[name]} bytes)`);
    if(name.endsWith('.glb')){
     const view=new DataView(buffer);
     if(buffer.byteLength<12||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw failure(name,'invalid GLB header');
    }
    let result=buffer;
    if(name.endsWith('.json')){
     try{result=JSON.parse(new TextDecoder().decode(buffer));}catch(cause){throw failure(name,'invalid JSON',{cause});}
     if(!result||typeof result!=='object')throw failure(name,'invalid JSON data');
    }
    completed.add(name);progress(name,buffer.byteLength);return result;
   }catch(cause){
    controller.abort();
    if(reader)try{await reader.cancel();}catch{}
    if(fatalError)throw fatalError;
    const error=cause.name==='CityResourceError'?cause:failure(name,timedOut?'network timeout':'network request failed',{cause});
    if((!compressed&&!error.retryable)||attempt===attempts)throw error;
    onRetry({resource:name,attempt:attempt+1,attempts,plainFallback:compressed});
   }finally{activeControllers.delete(controller);clearTimeout(idleTimer);clearTimeout(deadline);}
   if(!compressed)await sleep(retryDelayMs*attempt);
  }
 }
 function load(name){
  if(!Object.hasOwn(assets,name))return Promise.reject(failure(name,'unknown city asset',{retryable:false}));
  if(!cache.has(name))cache.set(name,schedule(()=>read(name)));
  return cache.get(name);
 }
 function cancel(error){fatalError=error;for(const controller of activeControllers)controller.abort();for(const job of queue.splice(0))job.reject(error);}
 return {json:load,binary:load,preload:()=>Promise.all(names.map(load)).catch(error=>{cancel(error);throw error;})};
}

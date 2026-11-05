/* A dependency-free loading/error surface also survives a failed module graph. */
(()=>{
 const label=document.getElementById('landing-load'),retry=document.getElementById('landing-retry');
 let stage='loading',detail=null,ready=false,failed=false,slow=false,slowTimer=null,progressTimer=null;
 let entryOwnerReady=false,earlyEntry=false;
 const zh=()=>document.documentElement.lang.startsWith('zh');
 const say=(a,b)=>zh()?a:b;
 function render(){
  if(!label)return;
  if(ready){label.hidden=true;if(retry)retry.hidden=true;return;}
  label.hidden=false;
  if(failed){
   label.textContent=say('城市暂时未能加载完成，请检查网络后重试。','THE CITY COULD NOT FINISH LOADING. CHECK YOUR CONNECTION AND RETRY.');
   if(retry){retry.hidden=false;retry.textContent=say('重新加载作品','RETRY LOADING');}
   return;
  }
  if(retry){retry.hidden=!slow;if(slow)retry.textContent=say('加载较慢？重新尝试','LOADING SLOWLY? RETRY');}
  if(stage==='preparing')label.textContent=say('城市数据已就绪，正在绘制上海…','CITY DATA READY · DRAWING SHANGHAI…');
  else if(detail?.totalBytes){
   const mb=n=>(n/1000000).toFixed(1);
   label.textContent=say(`正在加载城市 · ${mb(detail.receivedBytes)} / ${mb(detail.totalBytes)} MB · ${detail.completed}/${detail.total}`,`LOADING THE CITY · ${mb(detail.receivedBytes)} / ${mb(detail.totalBytes)} MB · ${detail.completed}/${detail.total}`);
  }else label.textContent=say('正在准备城市体验…','PREPARING THE CITY EXPERIENCE…');
 }
 function fail(error){
  if(ready||failed)return;failed=true;clearTimeout(slowTimer);clearTimeout(progressTimer);
  console.error('Shanghai 2050 could not start:',error?.message??error);
  document.getElementById('explore-button')?.removeAttribute('aria-busy');
  document.getElementById('globe-marker')?.removeAttribute('aria-busy');
  render();
  window.dispatchEvent(new CustomEvent('sh2050:load-failed',{detail:{message:error?.message??String(error)}}));
 }
 window.SH2050_BOOT={
  progress(value){if(failed||ready)return;detail=value;if(!progressTimer)progressTimer=setTimeout(()=>{progressTimer=null;render();},100);},
  phase(value){if(failed||ready)return;stage=value;render();},
  fail,
  ready(){ready=true;clearTimeout(slowTimer);clearTimeout(progressTimer);render();},
  consumeEntryIntent(){entryOwnerReady=true;const requested=earlyEntry&&!failed;earlyEntry=false;return requested;},
  get failed(){return failed;},
 };
 // Preserve a click made while the navigation module is still downloading.
 // Once site.js owns the buttons, their ordinary handlers remain the sole entry path.
 window.addEventListener('click',event=>{
  if(entryOwnerReady||failed||!event.target?.closest?.('#explore-button,#globe-marker'))return;
  earlyEntry=true;
  document.getElementById('explore-button')?.setAttribute('aria-busy','true');
  document.getElementById('globe-marker')?.setAttribute('aria-busy','true');
 },true);
 // Module script errors include failed imports, before app.mjs can enter its try/catch.
 window.addEventListener('error',event=>{
  const target=event.target;
  if(target?.tagName==='SCRIPT'&&target.hasAttribute('data-city-critical'))fail(new Error('A required artwork module could not load.'));
 },true);
 window.addEventListener('sh2050:error',event=>fail(event.detail??new Error('City initialization failed.')));
 window.addEventListener('sh2050:ready',()=>window.SH2050_BOOT.ready());
 window.addEventListener('sh2050:language',render);
 // If even the first module request stalls, the visitor has an explicit exit from waiting.
 slowTimer=setTimeout(()=>{if(!ready&&!failed){slow=true;render();}},45000);
 render();
})();

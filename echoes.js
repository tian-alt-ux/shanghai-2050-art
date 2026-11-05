import {createEnglishLabels} from './echoes-language.mjs';
import {createEchoCards,echoCardsCopy} from './echoes-cards.mjs';
import {submissionKeywords} from './echoes-card-content.mjs';
import {createEchoConnection} from './echoes-connection.mjs?v=20261106-echoes-submission';

const $=id=>document.getElementById(id);
const dialog=$('echo-dialog'),form=$('echo-form'),textarea=$('echo-text'),keywordInput=$('echo-keyword-input'),submit=$('echo-submit');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const connection=createEchoConnection({onDiagnostic:detail=>console.warn('Future Echoes connection:',detail)});
const copy={
 en:{previewCaption:'A COLLECTION OF POSSIBLE FUTURES',entry:'EXPLORE FUTURE ECHOES',entrySmall:'READ A VISION · LEAVE YOUR OWN',close:'CLOSE',inputLabel:'YOUR VISION / SHANGHAI 2050',placeholder:'In Shanghai 2050, I hope…',submit:'REVEAL MY CARD',sending:'REVEALING…',help:'Chinese & English welcome. Your complete vision becomes a card.',success:'Your vision has joined the collection.',duplicate:'This vision is already in the collection.',empty:'Write your vision first.',badContent:'Please use text without links or markup.',tooLong:'Please keep your vision within 300 characters.',network:'The collection is unavailable. Your draft is saved here; please try again.',rate:'Please wait a moment before submitting again.',closeLabel:'Close Future Echoes',previewLabel:'Preview the vision cards'},
 zh:{previewCaption:'共同收藏的未来想象',entry:'进入未来回声',entrySmall:'浏览一段想象 · 留下你的愿望',close:'关闭',inputLabel:'你的上海2050想象',placeholder:'在2050年的上海，我希望……',submit:'让我的卡片显影',sending:'正在显影…',help:'支持中文与英文。每段完整想象将成为一张卡片。',success:'你的想象已加入共同卡片库。',duplicate:'这段想象已经在卡片库里。',empty:'先写下你的未来想象。',badContent:'请使用文字，去掉链接或代码标记。',tooLong:'请将想象控制在300个字符以内。',network:'暂时无法连接卡片库，草稿已保留，请稍后重试。',rate:'请稍候片刻再提交。',closeLabel:'关闭未来回声',previewLabel:'预览未来想象卡片'}
};
Object.assign(copy.en,{timeout:'The connection is taking too long. Your draft is saved; please try again.',backend:'The card service is temporarily unavailable. Your draft is saved; please try again later.',savedDisplay:'Your card has been saved, but could not be displayed yet. Select SHOW SAVED CARD to try again.',showSaved:'SHOW SAVED CARD',display:'The card could not be displayed. Your draft is saved; please reopen the collection and try again.'});
Object.assign(copy.zh,{timeout:'连接等待时间较长，草稿已保留，请重新尝试。',backend:'卡片服务暂时不可用，草稿已保留，请稍后重试。',savedDisplay:'卡片已保存，暂时未能显示。可点击“查看已保存卡片”重新打开。',showSaved:'查看已保存卡片',display:'卡片暂时无法显示，草稿已保留，请重新打开卡片库后重试。'});
for(const language of ['en','zh'])Object.assign(copy[language],Object.fromEntries(Object.entries(echoCardsCopy[language]).filter(([,value])=>typeof value==='string')));
let lang=document.documentElement.lang.startsWith('zh')?'zh':'en',busy=false,refreshTimer,lastOpener,requestGeneration=0,cardsUI,savedSubmission=null;
const entry=document.createElement('button');entry.type='button';entry.className='echo-entry';entry.dataset.echoOpen='';
entry.setAttribute('aria-haspopup','dialog');entry.setAttribute('aria-controls','echo-dialog');entry.append(document.createElement('span'),document.createElement('small'));
$('explore-button').after(entry);
const c=()=>copy[lang];
const hasSavedDraft=()=>savedSubmission?.text===textarea.value.trim();
const submitLabel=()=>busy?c().sending:hasSavedDraft()?c().showSaved:c().submit;
const englishLabels=createEnglishLabels({onChange:()=>cardsUI?.refresh()});
cardsUI=createEchoCards({dialog,form,englishLabels,getLanguage:()=>lang,onDeckChange:renderPreview});
window.SH2050_ECHO_GESTURE=cardsUI.gesture;

function renderPreview(deck) {
 const host=$('echo-preview-cards');
 const cards=['seed-river-restored','seed-lane-life','seed-still-connected'].map(id=>deck.find(card=>card.id===id)).filter(Boolean);
 host.replaceChildren(...cards.map(card=>{
  const button=document.createElement('button');button.type='button';button.className='echo-mini-card';
  button.style.setProperty('--mini-base',card.visual.base);button.style.setProperty('--mini-accent',card.visual.accent);button.style.setProperty('--mini-ink',card.visual.text);
  button.setAttribute('aria-label',card.title);const title=document.createElement('span'),excerpt=document.createElement('small');title.textContent=card.title;excerpt.textContent=card.description;button.append(title,excerpt);
  button.addEventListener('click',()=>{open(button);cardsUI.focus(card.id);});return button;
 }));
}
function setStatus(key='',state='') {
 const node=$('echo-status');node.dataset.messageKey=key;node.dataset.state=state;node.textContent=key?c()[key]:'';
}
function translate() {
 lang=document.documentElement.lang.startsWith('zh')?'zh':'en';
 document.querySelectorAll('[data-echo-copy]').forEach(node=>{const value=c()[node.dataset.echoCopy];if(typeof value==='string')node.textContent=value;});
 entry.children[0].textContent=c().entry+' ↗';entry.children[1].textContent=c().entrySmall;
 textarea.placeholder=c().placeholder;$('echo-close').setAttribute('aria-label',c().closeLabel);document.querySelector('.echo-preview').setAttribute('aria-label',c().previewLabel);
 $('echo-title').textContent=lang==='zh'?'未来回声 · 上海2050':'Future Echoes · Shanghai 2050';
 submit.querySelector('span').textContent=submitLabel();
 const status=$('echo-status');if(status.dataset.messageKey)status.textContent=c()[status.dataset.messageKey];cardsUI.setLanguage(lang);
}
function adopt(data) {
 if(!data||!Array.isArray(data.words)||!Array.isArray(data.cards))throw Error('Invalid collection');
 englishLabels.registerSeeds(data.words);if(lang==='en')void englishLabels.prepare(data.words);cardsUI.adopt(data);
}
const request=options=>connection.request(options);
async function refresh() {
 const generation=++requestGeneration;
 try{const data=await request();if(generation===requestGeneration&&!busy)adopt(data);}catch{/* The curated library and draft remain available. */}
}
function saveDraft(){try{sessionStorage.setItem('sh2050-echo-draft',JSON.stringify({text:textarea.value}));}catch{}}
function updateInput() {
 const text=textarea.value.trim();keywordInput.value=submissionKeywords(text).join(', ');
 $('echo-length').textContent=`${Array.from(textarea.value).length} / 300`;setStatus();submit.querySelector('span').textContent=submitLabel();saveDraft();
}
function open(opener) {
 lastOpener=opener||entry;if(!dialog.open)dialog.showModal();dialog.classList.remove('is-closing');cardsUI.setActive(true);$('echo-close').focus({preventScroll:true});
 void refresh();clearInterval(refreshTimer);refreshTimer=setInterval(()=>{if(!document.hidden&&!busy)void refresh();},15000);
}
async function close() {
 if(!dialog.open)return;clearInterval(refreshTimer);saveDraft();cardsUI.setActive(false);dialog.classList.add('is-closing');
 if(!reduced)await new Promise(resolve=>setTimeout(resolve,220));
 dialog.close();dialog.classList.remove('is-closing');(lastOpener?.isConnected?lastOpener:entry).focus({preventScroll:true});
}
document.querySelectorAll('[data-echo-open]').forEach(node=>node.addEventListener('click',()=>open(node)));
$('echo-close').addEventListener('click',()=>void close());
dialog.addEventListener('cancel',event=>{event.preventDefault();void close();});
dialog.addEventListener('keydown',event=>{if(event.key!=='Escape')event.stopPropagation();});
dialog.addEventListener('close',()=>{clearInterval(refreshTimer);cardsUI.setActive(false);});
textarea.addEventListener('input',updateInput);
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 const text=textarea.value.trim();if(!text){setStatus('empty','error');textarea.focus();return;}
 if(Array.from(text).length>300){setStatus('tooLong','error');return;}
 if(/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)||/https?:\/\/|www\./i.test(text)){setStatus('badContent','error');return;}
 const keywords=submissionKeywords(text);
 const saved=hasSavedDraft()?savedSubmission:null;
 busy=true;++requestGeneration;submit.disabled=true;form.setAttribute('aria-busy','true');submit.querySelector('span').textContent=c().sending;setStatus();
 try{
  let data;
  try{
   if(saved){
    // Acknowledged writes are never submitted again just because rendering failed.
    data={...await request(),submittedId:saved.id,duplicate:saved.data.duplicate,highlightedIds:saved.data.highlightedIds};
    const card=saved.data.cards?.find(item=>item.id===saved.id);
    if(card&&Array.isArray(data.cards)&&!data.cards.some(item=>item.id===saved.id))data.cards=[card,...data.cards];
   }else{
    data=await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,keywords})});
    if(typeof data.submittedId==='string'&&data.submittedId)savedSubmission={text,id:data.submittedId,data};
   }
  }catch(error){
   const key=error.kind==='timeout'||error.name==='AbortError'?'timeout':error.status===429?'rate':[400,413,422].includes(error.status)?'badContent':error.kind==='backend'||error.status>=500?'backend':'network';
   setStatus(saved?'savedDisplay':key,saved?'success':'error');return;
  }
  try{
   adopt(data);cardsUI.afterSubmit(data);savedSubmission=null;setStatus(data.duplicate?'duplicate':'success','success');
  }catch{
   const acknowledged=hasSavedDraft();
   console.warn('Future Echoes display:',{name:'EchoDisplayError',code:'card_display_failed',acknowledged});
   setStatus(acknowledged?'savedDisplay':'display',acknowledged?'success':'error');
   if(acknowledged){
    const compose=$('echo-compose-dialog');if(!compose.open)try{compose.showModal();}catch{}
    try{cardsUI.focus?.(savedSubmission.id);}catch{}
   }
  }
 }finally{busy=false;submit.disabled=false;form.removeAttribute('aria-busy');submit.querySelector('span').textContent=submitLabel();saveDraft();}
});
window.addEventListener('sh2050:language',translate);window.addEventListener('pagehide',saveDraft);
try{const draft=JSON.parse(sessionStorage.getItem('sh2050-echo-draft')||'null');if(draft)textarea.value=Array.from(String(draft.text||'')).slice(0,300).join('');}catch{}
updateInput();translate();void refresh();
if(new URLSearchParams(location.search).get('echoes')==='open')open(entry);

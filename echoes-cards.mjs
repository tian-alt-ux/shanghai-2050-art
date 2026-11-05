import {createEchoGallery} from './echoes-gallery.mjs';
import {createEnglishLabels} from './echoes-language.mjs';
import {narrativeChunks,interleaveVisions} from './echoes-card-content.mjs';
import {cardVisualStyle} from './echoes-card-style.mjs';

const $=id=>document.getElementById(id);
const HAN=/\p{Script=Han}/u;
const strings={
  en:{cardsLoading:'GATHERING FUTURE ECHOES…',dragCards:'DRAG TO EXPLORE · SELECT A VISION',writeVision:'WRITE YOUR VISION',composeTitle:'What would you like to see?',composeIntro:'One thought, one future. Your words will become a card in our shared collection.',writeYours:'ADD YOUR OWN VISION',curated:'CURATED VISION · SHANGHAI / 2050',audience:'AUDIENCE VISION · SHANGHAI / 2050',waiting:'This vision is being translated into English.',genericTitle:'A future imagined',genericDescription:'A word for tomorrow.',count:n=>`${n} VISIONS`,unavailable:'The card library could not load. Please refresh to try again.'},
  zh:{cardsLoading:'正在汇聚未来回声…',dragCards:'拖动浏览 · 点击一段想象',writeVision:'写下你的想象',composeTitle:'2050年，你希望看见什么？',composeIntro:'一个念头，一种未来。你的文字将成为共同卡片库中的一段想象。',writeYours:'写下我的想象',curated:'创作示例 · 上海 / 2050',audience:'观众想象 · 上海 / 2050',waiting:'正在将这段想象译为英文。',genericTitle:'一种未来的想象',genericDescription:'留给明天的一个词。',count:n=>`${n} 段想象`,unavailable:'卡片库暂未加载，请刷新后重试。'}
};
export const echoCardsCopy=strings;

export function createEchoCards({dialog,form,englishLabels,getLanguage=()=> 'en',onDeckChange=()=>{}}) {
  const compose=$('echo-compose-dialog'),detail=$('echo-vision-dialog');
  let language=getLanguage(),active=false,selected=null,gallery=null;
  let curated=[],audience=[],words=[],deck=[],freshId=null;
  let revealTimer,toastTimer;
  let refreshGeneration=0;
  const c=()=>strings[language];
  const narrativeEnglish=createEnglishLabels({maxSourceLength:140,maxTranslationLength:1000,storageKey:'sh2050-echo-narratives-en-v1',onChange:()=>{updateDeck();}});
  const original=card=>String(card.text||'');
  const wordLabels=card=>(card.wordIds||[]).map(id=>words.find(word=>word.id===id)).filter(Boolean).map(word=>englishLabels.label(word,language)).filter(Boolean);
  const translatedNarrative=card=>{
    if(!HAN.test(original(card)))return original(card);
    const labels=narrativeChunks(original(card)).map(text=>narrativeEnglish.label({text},'en'));
    return labels.length&&labels.every(Boolean)?labels.join(' '):null;
  };
  function display(card) {
    const visual=cardVisualStyle(card);
    if(card.seed)return {...card,visual,title:language==='zh'?card.titleZh:card.titleEn,description:language==='zh'?card.textZh:card.textEn,textOnly:true,openLabel:language==='zh'?'阅读想象':'READ VISION'};
    const labels=wordLabels(card);
    const text=language==='en'?(translatedNarrative(card)||original(card)):original(card);
    const isShort=Array.from(original(card)).length<=24;
    const title=(isShort&&text?text:labels[0])||c().genericTitle;
    return {...card,visual,title,description:isShort?c().genericDescription:text||c().genericDescription,textOnly:true,openLabel:language==='zh'?'阅读想象':'READ VISION',isNew:card.id===freshId};
  }
  function updateDeck() {
    deck=interleaveVisions(curated,audience).map(display);
    if(gallery)gallery.setCards(deck);
    onDeckChange(deck);
    $('echo-card-count').textContent=c().count(curated.length+audience.length);
    if(selected)selected=deck.find(card=>card.id===selected.id)||selected;
    if(detail.open)renderDetail();
  }
  function syncActive(){gallery?.setActive(active&&!compose.open&&!detail.open&&!document.hidden);}
  function composeOpen() {
    if(!compose.open)compose.showModal();
    syncActive();
    requestAnimationFrame(()=>$('echo-text').focus({preventScroll:true}));
  }
  function composeClose() {
    if(compose.open)compose.close();
    syncActive();
  }
  function renderDetail() {
    if(!selected)return;
    const card=display(selected);selected=card;
    $('echo-vision-title').textContent=card.title;
    $('echo-vision-kind').textContent=card.seed?c().curated:c().audience;
    const body=card.seed?card.description:(language==='en'?(translatedNarrative(card)||original(card)):original(card));
    $('echo-vision-text').textContent=body||c().waiting;
    for(const [key,value] of Object.entries({base:card.visual.base,accent:card.visual.accent,ink:card.visual.text}))detail.style.setProperty(`--detail-${key}`,value);
    detail.dataset.family=card.visual.family;
  }
  function showCard(card) {
    selected=card;renderDetail();
    if(!detail.open)detail.showModal();
    syncActive();
    if(!card.seed&&language==='en'&&HAN.test(original(card)))void narrativeEnglish.prepare(narrativeChunks(original(card)).map(text=>({text})));
  }
  function closeDetail(){if(detail.open)detail.close();syncActive();}
  function setLanguage(next) {
    language=String(next).startsWith('zh')?'zh':'en';
    for(const node of dialog.querySelectorAll('[data-echo-copy]')){
      const value=c()[node.dataset.echoCopy];if(typeof value==='string')node.textContent=value;
    }
    $('echo-compose-close').setAttribute('aria-label',language==='zh'?'关闭填写面板':'Close writing panel');
    $('echo-vision-close').setAttribute('aria-label',language==='zh'?'关闭卡片':'Close vision');
    updateDeck();
    prepareNarratives();
    if(selected&&!selected.seed&&language==='en'&&detail.open)void narrativeEnglish.prepare(narrativeChunks(original(selected)).map(text=>({text})));
  }
  function adopt(data) {
    words=data.words||[];
    audience=(data.cards||[]).map(card=>({...card,seed:false}));
    updateDeck();
    prepareNarratives();
  }
  function prepareNarratives() {
    if(language!=='en')return;
    const pending=audience.slice(0,30).filter(card=>HAN.test(original(card))).flatMap(card=>narrativeChunks(original(card)).map(text=>({text})));
    void narrativeEnglish.prepare(pending);
  }
  function afterSubmit(data) {
    freshId=data.submittedId||null;
    updateDeck();
    {
      composeClose();
      if(freshId)gallery?.focusCard(freshId);
      const toast=$('echo-card-toast');toast.textContent=language==='zh'?(data.duplicate?'这段想象已经在卡片库里。':'你的想象已加入共同卡片库。'):(data.duplicate?'This vision is already in the collection.':'Your vision has joined the collection.');toast.hidden=false;
      clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},5000);
    }
    clearTimeout(revealTimer);revealTimer=setTimeout(()=>{freshId=null;updateDeck();},7000);
  }
  $('echo-write-vision').addEventListener('click',composeOpen);
  $('echo-compose-close').addEventListener('click',composeClose);
  compose.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();composeClose();});
  compose.addEventListener('close',syncActive);
  $('echo-vision-close').addEventListener('click',closeDetail);
  detail.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();closeDetail();});
  detail.addEventListener('close',syncActive);
  $('echo-vision-reply').addEventListener('click',()=>{closeDetail();composeOpen();});
  for(const panel of [compose,detail]){
    panel.addEventListener('keydown',event=>event.stopPropagation());
    panel.addEventListener('click',event=>{if(event.target===panel){const box=panel.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)panel.close();}});
  }
  document.addEventListener('visibilitychange',syncActive);
  setLanguage(language);
  void (async()=>{
    const generation=++refreshGeneration;
    try {
      const response=await fetch('./data/echoes-visions.json');if(!response.ok)throw new Error('Vision library missing');
      const data=await response.json();if(generation!==refreshGeneration)return;
      if(!Array.isArray(data.cards)||!data.cards.length)throw new Error('Invalid vision library');
      curated=data.cards.map(card=>({...card,seed:true}));
      gallery=createEchoGallery({host:$('echo-gallery-host'),atlasUrl:null,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,onSelect:showCard,onError:()=>{$('echo-gallery-loading').textContent=c().unavailable;}});
      updateDeck();$('echo-gallery-loading').hidden=true;syncActive();
    } catch {$('echo-gallery-loading').textContent=c().unavailable;}
  })();
  const gesture={
    hover:(x,y)=>gallery?.gesture.hover(x,y)??false,
    begin:(x,y)=>gallery?.gesture.begin(x,y)??false,
    move:(x,y)=>gallery?.gesture.move(x,y)??false,
    end:options=>gallery?.gesture.end(options)??false,
    cancel:()=>gallery?.gesture.cancel()
  };
  return {adopt,setLanguage,refresh:updateDeck,focus(id){gallery?.focusCard(id);},setActive(value){active=Boolean(value);if(!active){composeClose();closeDetail();}syncActive();},afterSubmit,gesture};
}

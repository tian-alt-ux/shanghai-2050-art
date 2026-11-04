// A small, deterministic visual vocabulary for the audience's text cards.
// This describes the words supplied by a visitor; it does not invent new text.
const FAMILY = Object.freeze({
  water:     {pattern:0,bases:['#004554','#082730'],accent:'#44A6B5',secondary:'#7BBECD'},
  ecology:   {pattern:1,bases:['#082730','#004554'],accent:'#2D9AAB',secondary:'#B2D5E2'},
  connection:{pattern:2,bases:['#09141A','#265C6B'],accent:'#7BBECD',secondary:'#44A6B5'},
  memory:    {pattern:3,bases:['#3B464B','#09141A'],accent:'#D3D0C8',secondary:'#B2D5E2'},
  community: {pattern:4,bases:['#265C6B','#082730'],accent:'#B2D5E2',secondary:'#44A6B5'},
  horizon:   {pattern:5,bases:['#082730','#09141A'],accent:'#7BBECD',secondary:'#E9F1F6'},
});

const TOPICS=Object.freeze({water:'water',climate:'water',nature:'ecology',ecology:'ecology',digital:'connection',technology:'connection',memory:'memory',heritage:'memory',community:'community',accessibility:'community',love:'community',knowledge:'memory',mobility:'connection',slowness:'horizon',sky:'horizon'});
const canonical=value=>String(value||'').normalize('NFKC').trim().toLocaleLowerCase('en');
function hash(value) {
  let result=2166136261;
  for(const letter of value){result^=letter.codePointAt(0);result=Math.imul(result,16777619);}
  return result>>>0;
}
function originalText(card) {
  // Display titles/descriptions may be translated; never use those for styling.
  return canonical(card?.text || card?.textZh || card?.textEn || card?.topic || '');
}
function familyOf(text,topic) {
  // The direction of a wish matters more than an isolated technology noun.
  const quietWish=/(?:减少|远离|摆脱|没有|更少).{0,14}(?:信息|噪音|屏幕|打扰)|(?:少一些|少点).{0,5}(?:打扰|噪音)|(?:less|without|reduce|escape|quieter).{0,22}(?:information|noise|screens?|interruption)|(?:技术|科技).{0,18}(?:安静|身后)|(?:quiet|calm).{0,18}(?:technology|signal)/u;
  if(quietWish.test(text))return 'horizon';
  if(TOPICS[topic])return TOPICS[topic];
  const groups=[
    ['water', /(?:黄浦江|苏州河|江岸|江水|河流|水质|潮汐|潮水|雨水|暴雨|海洋|水位)|\b(?:huangpu|suzhou|river|rivers|waterfront|tides?|ocean|rain|rainwater|floods?)\b/u],
    ['ecology',/(?:生态|自然|湿地|森林|花园|树荫|芦苇|鸟群|苔藓|蕨|生物多样性|共生|可持续)|\b(?:ecology|ecological|nature|natural|wetlands?|forest|gardens?|trees|birds|biodiversity|sustainability|sustainable|coexistence)\b/u],
    ['memory',/(?:记忆|文化|弄堂|里弄|老街|旧墙|旧建筑|历史|图书|阅读|书房)|\b(?:memories|memory|culture|cultural|heritage|lilong|lanes?|historic|history|library|libraries|books|reading|reuse|industrial)\b/u],
    ['community',/(?:爱情|浪漫|恋爱|爱人|邻里|社区|包容|无障碍|轮椅|善意|陪伴|朋友|相处|同桌)|\b(?:romance|romantic|love|neighbou?rhood|neighbou?rs|community|communities|inclusion|inclusive|accessible|accessibility|wheelchair|kindness|friends|friendship|together)\b/u],
    ['connection',/(?:科技|数字|网络|数据|连接|人工智能|赛博|交通|通勤|地铁|电车)|\b(?:technology|digital|network|networks|data|connection|connections|cyberpunk|transport|transit|commute|commuting|metro|tram|mobility)\b/u],
    ['horizon',/(?:宁静|安静|慢|天空|星空|蓝天|呼吸|空气|自由|想象|梦想)|\b(?:quiet|calm|slower|slow|sky|skies|stars|starry|air|breathe|freedom|dreams|imagination)\b/u],
  ];
  for(const [family,rule] of groups)if(rule.test(text))return family;
  return 'horizon';
}
function isRomantic(text,topic) {
  return topic==='love'||/^(?:love|爱情|恋爱|浪漫)$/u.test(text)||/(?:爱情|恋爱|爱人|相爱|浪漫)|\b(?:romance|romantic|falling in love|fall in love|someone (?:we|you|i) love|love (?:my|your|our) partner)\b/u.test(text);
}
function layoutOf(text) {
  const chars=Array.from(text.replace(/[\p{P}\p{Z}\p{C}]/gu,''));
  const hasHan=/\p{Script=Han}/u.test(text);
  const words=text.match(/[\p{L}\p{N}]+/gu)||[];
  if((hasHan&&chars.length<=8)||(!hasHan&&words.length<=3&&chars.length<=24))return 'word';
  const sentences=(text.match(/[。！？!?]|\.(?:\s|$)/gu)||[]).length;
  if((hasHan&&chars.length<=54)||(!hasHan&&text.length<=130&&sentences<=1))return 'quote';
  return 'story';
}

export function cardVisualStyle(card={}) {
  const text=originalText(card),topic=canonical(card.topic);
  const fingerprint=hash(String(card.id||text||'future-echo'));
  const family=familyOf(text,topic),spec=FAMILY[family];
  const romantic=isRomantic(text,topic);
  // A stable minority of lighter, frosted cards creates breathing room in the wall.
  // The serial is a decorative identifier, never a visitor or submission count.
  const frost=!romantic&&Math.floor(fingerprint/64)%6===0;
  const paleVariant=Math.floor(fingerprint/384)%3;
  const paleBase=paleVariant===0?'#B2D5E2':paleVariant===1?'#D3D0C8':'#7BBECD';
  return {
    family,
    pattern:spec.pattern,
    layout:layoutOf(text),
    base:frost?paleBase:spec.bases[(fingerprint>>>12)%spec.bases.length],
    accent:romantic?'#B98D9E':frost?'#265C6B':spec.accent,
    secondary:romantic?'#B2D5E2':frost?'#004554':spec.secondary,
    text:frost?'#09141A':'#E9F1F6',
    serial:String(fingerprint%999+1).padStart(3,'0'),
    seed:fingerprint/4294967295,
  };
}

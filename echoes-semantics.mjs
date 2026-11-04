// A local bilingual colour vocabulary. No audience text leaves the website.
// These are artistic associations, not sentiment labels or personal inferences.
// Reference anchors supplied by the artist. The darkest colours stay in the
// atmosphere; text uses readable grey-blue, light blue and moonstone tones.
export const referencePalette = Object.freeze({
  ink:'#09141A', deep:'#082730', slate:'#3B464B', petrol:'#265C6B',
  moonstone:'#44A6B5', lake:'#2D9AAB', light:'#7BBECD', ice:'#B2D5E2', mist:'#E9F1F6',
});
export const colourFamilies = {
  affection:{hue:201}, ecology:{hue:190}, water:{hue:187}, technology:{hue:205},
  culture:{hue:211}, community:{hue:197}, horizon:{hue:213}, open:{hue:195},
};

const vocabulary = {
  affection: '爱情|恋爱|恋人|爱人|相爱|浪漫|拥抱|陪伴|温柔|关爱|关怀|友爱|亲情|友情|友谊|幸福|善意|善良|共情|彼此|温暖|想念|思念|相思|love|loving|lover|lovers|romance|romantic|affection|tenderness|companionship|compassion|kindness|empathy|friendship|happiness|caring|care|warmth|hug|hugs|belonging|yearning|missing you',
  ecology: '生态|自然|森林|树林|树木|花园|绿地|绿色|公园|植物|湿地|动物|鸟类|生物多样性|环保|低碳|零碳|碳中和|可持续|循环|共生|清洁空气|蓝绿共生|人与自然|earth|ecology|ecological|ecosystem|nature|natural|forest|forests|tree|trees|garden|gardens|green|park|parks|plant|plants|wetland|wetlands|wildlife|biodiversity|sustainable|sustainability|recycling|recycle|coexistence|clean air|carbon neutral|zero carbon|low carbon|solar energy|renewable energy',
  water: '水系|滨水|江水|江河|黄浦江|苏州河|海洋|河流|湖泊|潮汐|潮水|海岸|水岸|雨水|降雨|水汽|涟漪|风|云|water|waterfront|river|rivers|ocean|sea|seas|lake|lakes|tide|tides|tidal|coast|coastal|rain|rainfall|humidity|breeze|wind|waterways|waves',
  technology: '科技|技术|数字|人工智能|智能|算法|计算|数据|信息|网络|机器人|创新|互联|虚拟|通信|自动驾驶|量子|科技创新|赛博朋克|元宇宙|数字孪生|technology|technological|tech|digital|artificial intelligence|ai|smart|intelligence|algorithm|algorithms|computing|computer|data|information|network|networks|robot|robots|robotics|innovation|innovative|virtual|quantum|automation|internet|connectivity|cyberpunk|metaverse|digital twin',
  culture: '文化|记忆|历史|传统|遗产|艺术|创作|创意|音乐|戏剧|电影|文学|诗歌|书籍|阅读|博物馆|海派|弄堂|老街|故事|乡愁|数字记忆|文化记忆|culture|cultural|memory|memories|history|historic|historical|heritage|tradition|traditional|art|arts|artist|creative|creativity|music|theatre|theater|cinema|literature|poetry|poem|books|reading|museum|museums|stories|story|nostalgia|digital memories|cultural memory',
  community: '社区|邻里|街坊|市民|居民|人文|生活|公共|共享|包容|开放|多元|平等|公平|无障碍|适老|教育|学校|学习|孩子|儿童|家庭|城市温度|人与人的连接|步行|慢行|城市韧性|韧性|community|communities|neighbourhood|neighborhood|neighbours|neighbors|people|human|humanity|public|shared|sharing|inclusive|inclusion|diversity|equality|equity|accessible|accessibility|education|school|learning|children|family|families|urban warmth|connection|walkable|walking|resilience',
  horizon: '梦想|理想|愿景|希望|可能|自由|安静|宁静|平静|慢生活|更慢的生活|星空|星辰|宇宙|想象|dream|dreams|dreaming|vision|visions|hope|hopeful|possibility|possibilities|freedom|peace|peaceful|quiet|calm|slower pace|imagination|imagine|stars|cosmos',
};

const seedFamilies = {
  coexistence:'ecology', 'waterfront-living':'water', 'cultural-memory':'culture',
  'walkable-city':'community', 'open-communities':'community', 'clean-air':'ecology',
  'blue-green-harmony':'ecology', 'public-space':'community', resilience:'water',
  'digital-memories':'culture', neighbourhood:'community', inclusion:'community',
  'green-mobility':'ecology', 'urban-warmth':'affection', 'slower-pace':'horizon',
  connection:'affection', innovation:'technology', 'future-education':'community',
  'people-and-nature':'ecology', sustainability:'ecology',
};

const canonical = value => String(value || '').normalize('NFKC').toLocaleLowerCase('en').trim().replace(/[\s‐‑–—-]+/gu,' ');
// Broad ideas such as kindness, community and imagination stay blue. Only
// unmistakable romance or an explicit chromatic image can request an accent.
const accentVocabulary = [
  {accent:'rose',hue:335,terms:'爱情|恋爱|恋人|相爱|热恋|爱恋|浪漫爱情|相思|romance|romantic love|falling in love|lover|lovers|love',exactOnly:'love'},
  {accent:'rose',hue:337,terms:'粉色|粉红|玫瑰色|樱花|玫瑰|pink|rose pink|cherry blossom|roses'},
  {accent:'amber',hue:29,terms:'橙色|橘色|琥珀|落日|夕阳|火焰|orange|amber|sunset|flame|flames'},
  {accent:'coral',hue:15,terms:'红色|赤红|绯红|朱红|red|crimson|scarlet'},
  {accent:'violet',hue:232,terms:'蓝紫|紫色|紫罗兰|薰衣草|purple|violet|lavender|indigo'},
  {accent:'sea',hue:173,terms:'翡翠|碧绿|翠绿|emerald|jade'},
];
function termMatch(text,term) {
  if(/\p{Script=Han}/u.test(term))return text.includes(term);
  return new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=$|[^\\p{L}\\p{N}])`,'u').test(text);
}
function findAccent(text,family) {
  for(const group of accentVocabulary)for(const term of group.terms.split('|')) {
    if(group.exactOnly===term && text!==term)continue;
    if(!termMatch(text,term))continue;
    // A coloured modifier in an ordinary city concept is not a colour statement.
    if(text!==term && !['affection','open','horizon'].includes(family))continue;
    return {accent:group.accent,accentHue:group.hue,accentPriority:text===term?3:2};
  }
  return {accent:null,accentPriority:0};
}
const modifiers=new Set(['love','loving','caring','care','smart','digital','关爱','关怀','数字','智能']);
const lexicon = Object.entries(vocabulary).map(([family, words]) => ({family, terms:words.split('|').map(term => {
  const han=/\p{Script=Han}/u.test(term);
  const pattern=han ? null : new RegExp(`(^|[^\\p{L}\\p{N}])(${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})(?=$|[^\\p{L}\\p{N}])`,'u');
  return {term,han,pattern,weight:han ? Math.min(6,2+Array.from(term).length*.65) : 3.3+(term.includes(' ')?1.3:0)};
})}));
const cache=new Map();

export function semanticColour(word = {}) {
  const text=canonical(word.text || word.labelZh || word.labelEn || '');
  const key=word.seed && seedFamilies[word.id] ? `seed:${word.id}` : text;
  if(cache.has(key))return cache.get(key);
  let family=word.seed ? seedFamilies[word.id] : null;
  if(!family) {
    let strongest=0, earliest=Infinity;
    family='open';
    for(const group of lexicon) {
      let best=0, hits=0, first=Infinity;
      for(const item of group.terms) {
        const match=item.han ? null : item.pattern.exec(text);
        const at=item.han ? text.indexOf(item.term) : match ? match.index+match[1].length : -1;
        if(at<0)continue;
        hits++;first=Math.min(first,at);
        const weight=modifiers.has(item.term)?2.1:item.weight;
        best=Math.max(best,weight+(text===item.term?8:0));
      }
      // Exact expressions outweigh broad cues; ties follow the phrase's reading order.
      const score=best+(hits?Math.min(1,(hits-1)*.2):0);
      if(score>strongest || (score===strongest && first<earliest)) {
        family=group.family;strongest=score;earliest=first;
      }
    }
  }
  // A word keeps its hue when ordering, counts or interface language changes.
  let hash=2166136261;
  for(const char of key)hash=Math.imul(hash^char.codePointAt(0),16777619)>>>0;
  const palette=colourFamilies[family];
  const accent=word.seed ? {accent:null,accentPriority:0} : findAccent(text,family);
  const result=Object.freeze({family,...palette,hue:palette.hue+(hash%9)-4,variation:(hash%7)-3,...accent});
  if(cache.size>=6000)cache.clear();
  cache.set(key,result);
  return result;
}

export function accentWordIds(words) {
  const limit=Math.min(3,Math.max(1,Math.floor(words.length*.1)));
  const candidates=words.map(word=>({word,colour:semanticColour(word)}))
    .filter(item=>item.colour.accent)
    .sort((a,b)=>b.colour.accentPriority-a.colour.accentPriority || (b.word.count||0)-(a.word.count||0) || String(a.word.id).localeCompare(String(b.word.id),'en'));
  const chosen=new Set();let used=0;
  for(const {word} of candidates){
    const cost=Math.log2(1+Math.max(0,word.count||0))>=5?2:1;
    if(used+cost>limit && chosen.size)continue;
    chosen.add(word.id);used+=cost;
    if(used>=limit)break;
  }
  return chosen;
}

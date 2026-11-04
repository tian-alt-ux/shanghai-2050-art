// Display translations only: source text, word identity and audience counts stay intact.
const HAN = /\p{Script=Han}/u;
const STORAGE_KEY = 'sh2050-echo-english-v1';
const RETRY_MS = 5 * 60 * 1000;
const MAX_CACHE = 1000;
const canonical = value => String(value || '').normalize('NFKC').trim().replace(/\s+/gu, ' ');
const sourceOf = word => canonical(word?.text || word?.labelZh || '');

// Whole expressions avoid the false fluency of word-by-word concatenation.
const localLabels = new Map(Object.entries({
  '想象':'Imagination', '爱情':'Love', '赛博朋克':'Cyberpunk', '黄浦江':'Huangpu River',
  '想念':'Longing', '情感':'Emotion', '上海':'Shanghai', '苏州河':'Suzhou Creek',
  '外滩':'The Bund', '陆家嘴':'Lujiazui', '上海中心':'Shanghai Tower', '东方明珠':'Oriental Pearl Tower',
  '人民广场':"People's Square", '崇明':'Chongming', '长江':'Yangtze River', '东海':'East China Sea',
  '梦想':'Dreams', '希望':'Hope', '未来':'The future', '自由':'Freedom', '和平':'Peace',
  '幸福':'Happiness', '温柔':'Tenderness', '陪伴':'Companionship', '友谊':'Friendship',
  '亲情':'Family bonds', '友情':'Friendship', '思念':'Longing', '相思':'Yearning',
  '浪漫':'Romance', '关怀':'Care', '关爱':'Compassion', '善意':'Kindness', '温暖':'Warmth',
  '生态':'Ecology', '自然':'Nature', '森林':'Forests', '花园':'Gardens', '公园':'Parks',
  '湿地':'Wetlands', '海洋':'Ocean', '河流':'Rivers', '湖泊':'Lakes', '潮汐':'Tides',
  '雨水':'Rainwater', '蓝天':'Blue skies', '清洁能源':'Clean energy', '低碳':'Low carbon',
  '碳中和':'Carbon neutrality', '零碳城市':'A zero-carbon city', '生物多样性':'Biodiversity',
  '智慧城市':'A smart city', '人工智能':'Artificial intelligence', '数字孪生':'Digital twins',
  '元宇宙':'Metaverse', '机器人':'Robots', '科技':'Technology', '数据':'Data', '算法':'Algorithms',
  '信息':'Information', '网络':'Networks', '交通':'Transport', '地铁':'Metro', '慢行':'Slow mobility',
  '无人驾驶':'Autonomous driving', '公共交通':'Public transport', '城市记忆':'Urban memory',
  '文化':'Culture', '记忆':'Memory', '历史':'History', '艺术':'Art', '音乐':'Music',
  '阅读':'Reading', '博物馆':'Museums', '海派文化':'Shanghai culture', '弄堂':'Shanghai lanes',
  '社区':'Community', '生活':'Life', '教育':'Education', '孩子':'Children', '平等':'Equality',
  '多元':'Diversity', '共享':'Sharing', '无障碍':'Accessibility', '城市':'City',
  '人与人':'Human connection', '人与自然共生':'People and nature in harmony',
  '粉色':'Pink', '粉红':'Pink', '红色':'Red', '蓝色':'Blue', '蓝紫':'Blue-violet',
  '紫色':'Purple', '橙色':'Orange', '夕阳':'Sunset', '落日':'Sunset', '玫瑰':'Roses',
  '樱花':'Cherry blossoms', '星空':'A starry sky', '宇宙':'Cosmos', '宁静':'Tranquility',
  '共生':'Coexistence', '滨水生活':'Waterfront living', '文化记忆':'Cultural memory',
  '步行城市':'Walkable city', '开放社区':'Open communities', '清洁空气':'Clean air',
  '蓝绿共生':'Blue-green harmony', '公共空间':'Public space', '韧性城市':'Resilience',
  '数字记忆':'Digital memories', '邻里':'Neighbourhood', '包容':'Inclusion',
  '绿色出行':'Green mobility', '城市温度':'Urban warmth', '更慢的生活':'A slower pace',
  '人与人的连接':'Connection', '创新':'Innovation', '未来教育':'Future education',
  '人与自然':'People and nature', '可持续发展':'Sustainable development',
}));

function decodeEntities(value) {
  const entities = {amp:'&', quot:'"', apos:"'", lt:'<', gt:'>', nbsp:' '};
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/giu, (_, code) => {
    if (code[0] !== '#') return entities[code.toLowerCase()];
    const number = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2),16) : parseInt(code.slice(1),10);
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
  });
}

function englishLabel(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const text = canonical(decodeEntities(value));
  if (!text || [...text].length > maxLength || !/[a-z]/iu.test(text) || HAN.test(text)) return null;
  if (!/^[\p{Script=Latin}\p{N}\p{P}\p{Zs}\p{M}]+$/u.test(text)) return null;
  if (/[<>\u0000-\u001f\u007f]/u.test(text) || /https?:\/\/|www\.|javascript\s*:|data\s*:/iu.test(text)) return null;
  if (/mymemory\s+warning|quota\s+(?:exceeded|exhausted|reached)|limit exceeded|too many requests|invalid language|no query specified|invalid ip|translation unavailable/iu.test(text)) return null;
  return text.replace(/^\p{Ll}/u, letter => letter.toLocaleUpperCase('en'));
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

function canTranslate(text, maxLength = 24) {
  return HAN.test(text) && [...text].length <= maxLength && !/[<>\u0000-\u001f\u007f]/u.test(text) && !/https?:\/\/|www\./iu.test(text);
}

export function createEnglishLabels({fetchImpl=globalThis.fetch, storage=browserStorage(), onChange=()=>{}, now=Date.now, maxSourceLength=24, maxTranslationLength=160, storageKey=STORAGE_KEY}={}) {
  const aliases = new Map();
  const cache = new Map();
  const requests = new Map();
  const retryAfter = new Map();
  const queue = [];
  let active = 0;

  try {
    const saved = JSON.parse(storage?.getItem(storageKey) || 'null');
    if (saved?.version === 1 && Array.isArray(saved.entries)) {
      for (const entry of saved.entries.slice(-MAX_CACHE)) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const source = canonical(entry[0]), translated = englishLabel(entry[1],maxTranslationLength);
        if (canTranslate(source,maxSourceLength) && translated) cache.set(source,translated);
      }
    }
  } catch { /* A browser storage restriction must not stop the artwork. */ }

  function persist() {
    while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
    try { storage?.setItem(storageKey,JSON.stringify({version:1,entries:[...cache]})); } catch {}
  }

  function registerSeeds(words) {
    for (const word of Array.isArray(words) ? words : []) {
      const translated = englishLabel(word?.labelEn,maxTranslationLength);
      const source = canonical(word?.labelZh);
      if (source && translated) aliases.set(source,translated);
    }
  }

  function label(word,lang='en') {
    if (String(lang).startsWith('zh')) return word?.seed ? (word.labelZh || word.text || '') : (word?.text || word?.labelZh || '');
    const supplied = englishLabel(word?.labelEn,maxTranslationLength);
    if (supplied) return supplied;
    const source = sourceOf(word);
    if (!HAN.test(source)) return source || null;
    return aliases.get(source) || localLabels.get(source) || cache.get(source) || null;
  }

  function pendingCount(words) {
    return new Set((Array.isArray(words) ? words : []).filter(word => HAN.test(sourceOf(word)) && !label(word,'en')).map(sourceOf)).size;
  }

  function pump() {
    while (active < 2 && queue.length) {
      const job = queue.shift();
      active++;
      void run(job).finally(() => {
        active--;
        requests.delete(job.source);
        job.resolve();
        pump();
      });
    }
  }

  async function run(job) {
    const controller = new AbortController();
    let timer;
    try {
      if (typeof fetchImpl !== 'function') throw new Error('No translation connection');
      const url = new URL('https://api.mymemory.translated.net/get');
      url.searchParams.set('q',job.source);
      url.searchParams.set('langpair','zh-CN|en');
      const timeout = new Promise((_,reject) => {
        timer = setTimeout(() => {controller.abort();reject(new Error('Translation timeout'));},8000);
      });
      const data = await Promise.race([
        (async () => {
          const response = await fetchImpl(url.toString(), {method:'GET', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', headers:{Accept:'application/json'},signal:controller.signal});
          if (!response.ok) throw new Error('Translation request failed');
          return response.json();
        })(), timeout,
      ]);
      if (Number(data?.responseStatus) !== 200) throw new Error('Translation unavailable');
      const translated = englishLabel(data?.responseData?.translatedText,maxTranslationLength);
      if (!translated) throw new Error('Invalid translation');
      cache.set(job.source,translated);
      retryAfter.delete(job.source);
      persist();
      try { onChange(); } catch { /* Rendering callbacks cannot poison the translation queue. */ }
    } catch {
      retryAfter.set(job.source,now()+RETRY_MS);
    } finally { clearTimeout(timer); }
  }

  function prepare(words) {
    const waiting=[];
    for (const word of Array.isArray(words) ? words : []) {
      if (label(word,'en')) continue;
      const source = sourceOf(word);
      if (!canTranslate(source,maxSourceLength) || (retryAfter.get(source)||0) > now()) continue;
      if (!requests.has(source)) {
        let resolve;
        const promise = new Promise(done => {resolve=done;});
        requests.set(source,promise);
        queue.push({source,resolve});
      }
      waiting.push(requests.get(source));
    }
    pump();
    return Promise.all(waiting).then(()=>{});
  }

  return {label,prepare,registerSeeds,pendingCount};
}

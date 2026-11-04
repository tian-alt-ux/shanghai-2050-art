// Pure layout and text helpers for the independent Future Echoes panel.
import {semanticColour} from './echoes-semantics.mjs';
export const normalize = value => String(value).normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
const stop = new Set('我 我们 希望 想 要 让 有 更多 一个 一些 可以 能够 成为 未来 上海 城市 年 的 地 得 了 是 在 和 与 及 对 于 会 很 更 也 都 不 到 你 您 它 他们 这里 那里 这样 什么 感觉 觉得 以及 生活着 a an the of and or to in on for with is be i we my our hope wish want more will would could should that this it as by have has see shanghai city future where can 2050 2026'.split(' '));

function meaningfulWords(value) {
  const segments = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('zh', {granularity:'word'}).segment(value)].filter(s => s.isWordLike).map(s => s.segment)
    : value.match(/[\p{L}]{2,}/gu) || [];
  return segments.filter(s => !stop.has(normalize(s)) && Array.from(s).length >= 2 && Array.from(s).length <= 24 && !/^\d+$/u.test(s));
}

export function parseKeywords(value) {
  return [...new Map(String(value).split(/[,，;；\n]+/u).map(s => s.trim()).filter(Boolean).map(s => [normalize(s), s])).values()];
}

export function suggestKeywords(text, seeds = []) {
  const clean = text.normalize('NFKC').trim();
  if (!clean) return [];
  const normal = normalize(clean);
  const hits = [];
  for (const seed of seeds) {
    const labels = [seed.labelZh, seed.labelEn, seed.text].filter(Boolean).sort((a,b) => b.length-a.length);
    const found = labels.find(label => {
      const key = normalize(label);
      return /[\p{Script=Han}]/u.test(key) ? normal.includes(key) : new RegExp(`(^|[^a-z])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`, 'i').test(normal);
    });
    if (found) hits.push({text:found, at:normal.indexOf(normalize(found)), size:found.length});
  }
  hits.sort((a,b) => b.size-a.size);
  const chosen = hits.filter((hit,index) => !hits.slice(0,index).some(other => other.text.includes(hit.text)));
  chosen.sort((a,b) => a.at-b.at);
  if (chosen.length) return chosen.slice(0,3).map(hit => hit.text);
  const phrases = parseKeywords(clean).filter(s => Array.from(s).length <= 24 && !/[。！？.!?]/u.test(s) && meaningfulWords(s).length);
  if (phrases.length && phrases.length <= 3) return phrases;
  return [...new Set(meaningfulWords(clean))].slice(0,3);
}

export function cloudWordLimit(contributions,width,height) {
  const mobile=width<650;
  const progress=Math.min(1,Math.log2(1+Math.max(0,contributions))/8);
  const areaLimit=Math.max(6,Math.floor(width*height/(mobile?6500:10000)));
  const ceiling=Math.min(mobile?20:32,areaLimit);
  const quiet=Math.min(mobile?14:20,Math.max(4,Math.floor(ceiling*.68)));
  return Math.round(quiet+(ceiling-quiet)*progress);
}

export function emphasisWordIds(words) {
  const eligible=words.filter(word=>!semanticColour(word).accent);
  const mentioned=eligible.filter(word=>word.count>0);
  const candidates=mentioned.length?mentioned:eligible.filter(word=>word.seed);
  return new Set([...candidates].sort((a,b)=>(b.count||0)-(a.count||0) || Number(b.seed)-Number(a.seed) || String(a.id).localeCompare(String(b.id),'en'))
    .slice(0,mentioned.length?3:2).map(word=>word.id));
}

export function wordAppearance(word, index, contributions = 0, fresh = false, allowAccent = true, emphasis = false) {
  // Seed weights are compositional only. Audience counts always remain real.
  const seedWeight = [1.8,.9,1.3,.7,1,.65,.75,.8,.65,.6][index % 10];
  const frequency = Math.log2(1 + Math.max(0,word.count || 0));
  const weight = word.seed ? seedWeight + frequency*.5 : .65 + frequency*.62;
  const palette=semanticColour(word);
  const activity=1-Math.exp(-Math.log2(1+Math.max(0,contributions))/5);
  const resonance=1-Math.exp(-Math.max(0,word.count||0)/4.5);
  const accent=allowAccent ? palette.accent : null;
  const hue=accent?palette.accentHue:palette.hue;
  const saturation=accent ? Math.min(51,31+resonance*16+activity*3) : Math.min(86,24+resonance*57+activity*5+palette.variation*.5+(emphasis?14:0));
  const lightness=accent ? Math.min(75,65+resonance*6+activity*2) : Math.min(82,62+resonance*10+activity*2.7+palette.variation*.35+(emphasis?6:0));
  const highlightSaturation=Math.min(accent?57:84,saturation+11);
  const highlightLightness=Math.min(82,lightness+8);
  const highlight=`hsl(${hue} ${highlightSaturation.toFixed(1)}% ${highlightLightness.toFixed(1)}%)`;
  const reveal='hsl(188 88% 84%)';
  return {
    weight:Math.min(3.4,weight),family:palette.family,hue,accent,saturation,lightness,reveal,emphasis,
    color:fresh?reveal:`hsl(${hue} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`,
    highlight:fresh?reveal:highlight,
    glow:fresh?'hsl(188 88% 76% / .5)':`hsl(${hue} ${highlightSaturation.toFixed(1)}% 72% / .35)`,
    softGlow:`hsl(${hue} ${saturation.toFixed(1)}% 72% / .12)`,
    aura:emphasis&&!accent?`hsl(${hue} ${saturation.toFixed(1)}% 70% / .14)`:'transparent',
  };
}

export function packWords(items, width, height, gap = 10, maxCoverage = 1) {
  const placed = [];
  let occupied=0;
  const margin = Math.min(12, width*.02);
  const overlaps = box => placed.some(p => box.x < p.x+p.width+gap && box.x+box.width+gap > p.x && box.y < p.y+p.height+gap && box.y+box.height+gap > p.y);
  for (const [index,item] of items.entries()) {
    if (item.width > width-margin*2 || item.height > height-margin*2) continue;
    if(occupied+item.width*item.height>width*height*maxCoverage)continue;
    const targetX = .16 + ((index*.381966 + .3)%1)*.68;
    const targetY = .14 + ((index*.618034 + .2)%1)*.72;
    let best = null, bestScore = Infinity;
    for (let n=0;n<420;n++) {
      const nx = (n*.618034 + index*.137)%1;
      const ny = (n*.414214 + index*.273)%1;
      const x = margin + nx * Math.max(0,width-item.width-margin*2);
      const y = margin + ny * Math.max(0,height-item.height-margin*2);
      const box = {...item,x,y};
      if (overlaps(box)) continue;
      const score = Math.pow((x+item.width/2)/width-targetX,2) + Math.pow((y+item.height/2)/height-targetY,2);
      if (score < bestScore) {best=box;bestScore=score;}
    }
    if (best) {placed.push(best);occupied+=item.width*item.height;}
  }
  return placed;
}

// Content choices stay separate from the TIDE / PULSE / SIGNAL artwork.
export function narrativeChunks(text, limit=140) {
  const chars=Array.from(String(text||'').normalize('NFKC').trim());
  const chunks=[];
  while(chars.length){
    let end=Math.min(limit,chars.length);
    if(end<chars.length){
      for(let i=end-1;i>Math.floor(limit*.5);i--)if(/[。！？；.!?;\s]/u.test(chars[i])){end=i+1;break;}
    }
    const chunk=chars.splice(0,end).join('').trim();
    if(chunk)chunks.push(chunk);
  }
  return chunks;
}

// Semantic themes for text-card colour and suggested keywords.
// Negation and the complete narrative take precedence over the keyword list.
export function visionTile(text, keywords=[]) {
  const source=String(text||'').toLowerCase();
  const all=source+' '+keywords.join(' ').toLowerCase();
  const rules=[
    [/(?:减少|远离|摆脱|没有|更少|less|without|escape|reduce).{0,12}(?:信息|噪音|屏幕|noise|screen|information)/u,20],
    [/(?:星空|星星|夜空|stars|starry|night sky)/u,13],
    [/(?:无障碍|轮椅|老去|老年|accessible|accessibility|wheelchair|grow old|older)/u,14],
    [/(?:爱情|恋爱|爱人|浪漫|romance|romantic|\blove\b|together forever)/u,11],
    [/(?:弄堂|里弄|老街|lilong|lane life|old lanes)/u,1],
    [/(?:苏州河|suzhou)/u,8],
    [/(?:湿地|鸟|崇明|wetland|birds|estuary|chongming)/u,9],
    [/(?:雨水|下雨|暴雨|雨后|rain|storm|flood|resilien)/u,2],
    [/(?:江水|黄浦江|水质|清澈|waterfront|river|huangpu|water quality|clean water)/u,0],
    [/(?:空气|蓝天|呼吸|clean air|blue sk|breathe|pollution)/u,3],
    [/(?:轮渡|渡船|ferry|way home)/u,4],
    [/(?:图书|阅读|教育|学校|library|reading|education|school|books)/u,12],
    [/(?:屋顶|种菜|花园|roof|garden|growing|vegetable)/u,15],
    [/(?:地铁|公交|电车|通勤|metro|tram|bus|commut|transport|mobility)/u,16],
    [/(?:旧建筑|旧墙|工业|记忆|文化|heritage|reuse|industrial|memory|culture)/u,17],
    [/(?:邻里|社区|吃饭|餐桌|community|neighbou?r|shared table|meal)/u,10],
    [/(?:树荫|炎热|降温|凉爽|shade|cooler|heat|trees)/u,5],
    [/(?:慢|安静|宁静|slower|quiet|calm|hurry)/u,7],
    [/(?:自然|生态|共生|可持续|nature|ecolog|coexist|sustainab)/u,18],
    [/(?:夕阳|晚霞|sunset|dusk|evening)/u,21],
    [/(?:科技|数字|数据|连接|cyber|digital|signal|technology|innovation)/u,6],
    [/(?:步行|散步|walk|pedestrian)/u,22],
    [/(?:包容|平等|所有人|inclusion|equal|everyone|all people)/u,23],
  ];
  for(const [pattern,tile] of rules)if(pattern.test(source))return tile;
  for(const [pattern,tile] of rules)if(pattern.test(all))return tile;
  return 20;
}

export function interleaveVisions(seeds, audience) {
  const deck=[];
  let a=0;
  for(let i=0;i<seeds.length;i++){
    deck.push(seeds[i]);
    if(i%2===1&&a<audience.length)deck.push(audience[a++]);
  }
  return deck.concat(audience.slice(a));
}

export function visionKeywords(text) {
  const zh=/\p{Script=Han}/u.test(String(text));
  const groups={
    0:[['滨水生活','公共空间'],['Waterfront living','Public space']],
    1:[['文化记忆','邻里'],['Cultural memory','Neighbourhood']],
    2:[['韧性城市','蓝绿共生'],['Resilience','Blue-green harmony']],
    3:[['清洁空气'],['Clean air']],4:[['绿色出行','滨水生活'],['Green mobility','Waterfront living']],
    5:[['公共空间','人与自然'],['Public space','People and nature']],
    6:[['创新','人与人的连接'],['Innovation','Connection']],7:[['更慢的生活','步行城市'],['A slower pace','Walkable city']],
    8:[['滨水生活','步行城市'],['Waterfront living','Walkable city']],9:[['人与自然','共生'],['People and nature','Coexistence']],
    10:[['邻里','城市温度'],['Neighbourhood','Urban warmth']],11:[['爱情'],['Love']],
    12:[['未来教育','开放社区'],['Future education','Open communities']],13:[['星空','清洁空气'],['A starry sky','Clean air']],
    14:[['无障碍','包容'],['Accessibility','Inclusion']],15:[['蓝绿共生','邻里'],['Blue-green harmony','Neighbourhood']],
    16:[['绿色出行','更慢的生活'],['Green mobility','A slower pace']],17:[['文化记忆'],['Cultural memory']],
    18:[['人与自然','可持续发展'],['People and nature','Sustainable development']],
    20:[['宁静','人与人的连接'],['Tranquility','Connection']],21:[['更慢的生活'],['A slower pace']],
    22:[['步行城市'],['Walkable city']],23:[['包容','公共空间'],['Inclusion','Public space']]
  };
  const tile=visionTile(text);
  if(tile===20&&!/(?:安静|宁静|噪音|信息|quiet|calm|noise|information)/iu.test(text))return [zh?'未来想象':'Future vision'];
  return (groups[tile]||groups[23])[zh?0:1];
}

export function submissionKeywords(text) {
  const clean=String(text||'').normalize('NFKC').trim().replace(/\s+/gu,' ');
  if(!clean)return [];
  return Array.from(clean).length<=24?[clean]:visionKeywords(clean);
}

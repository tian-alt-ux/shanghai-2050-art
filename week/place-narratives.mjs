/**
 * Place-facing editorial copy for SHANGHAI 2050.
 * Existing place character comes from the project's cached landmark references.
 * Every future use and weekly response is an authored scenario, never a measured
 * occupancy, construction promise or declaration that a cultural site is a mast.
 * Survey / model / source limitations stay in DATA / ART rather than this story.
 */
const stories=Object.freeze({
 'bund':{
  profile:'waterfront',
  zh:['外滩','城市记忆 / 滨水公共生活','江水穿过城市，沿岸的人让时间变得可见。','外滩把上海的城市记忆与两岸日常连接在一起。滨江是一条人人可以停留的公共岸线：潮描绘风雨掠过水面，脉记录散步、相遇与往返，讯承载沿江分享的片段。旧建筑的银白轮廓留在流动之中，提醒我们未来也需要保有记忆。'],
  en:['The Bund','URBAN MEMORY / PUBLIC WATERFRONT','The river crosses the city; people on its banks make time visible.','The Bund joins Shanghai’s urban memory to everyday life on both sides of the river. In 2050, the waterfront remains open for people to pause, walk and meet. TIDE traces weather over water, PULSE follows visits and movement, and SIGNAL carries shared moments. Silver façades hold memory within a changing city.']
 },
 'jing-an-temple':{
  profile:'heritage',
  zh:['静安寺','文化延续 / 快慢之间','繁忙街区里，也容得下一段缓慢的时间。','静安寺让文化记忆与周围的城市日常相遇。快节奏的街区里，院落为驻足与安静保留空间。银白屋顶成为稳定的时间坐标；周围的脉随出行改变，讯连接抵达、导览与公共服务，让历史场所继续参与当代生活。'],
  en:['Jing’an Temple','CULTURAL CONTINUITY / DIFFERENT PACES','A busy neighbourhood can still make room for slower time.','Jing’an Temple brings cultural memory into contact with everyday urban life. Renewal in 2050 makes room for faster movement and time to pause. Silver roofs remain a steady reference while PULSE shifts with surrounding journeys and SIGNAL supports arrival, interpretation and public services.']
 },
 'lane-renewal':{
  profile:'community',
  zh:['弄堂改造','邻里共生 / 日常的更新','未来的生活，先从家门口的一次相遇开始。','连排街墙围出一条可以慢慢行走的弄堂，店面、露台与轻步桥把新旧生活接在一起。邻里的更新保留相识的尺度，也容纳共享空间与公共服务。脉表现买菜、回家、照护与交谈的细小往返；讯连接社区请求，潮经过屋檐与街巷，让雨天的每一段步行也被照顾。'],
  en:['Laneway Renewal','NEIGHBOURHOOD LIFE / EVERYDAY RENEWAL','A future city begins with an encounter close to home.','Continuous street fronts frame a walkable lane, while shops, terraces and light footbridges connect old and new ways of living. Neighbourhood renewal preserves familiar scale and makes room for shared spaces and public services. PULSE follows shopping, care and homeward journeys; SIGNAL connects community requests, and TIDE asks how a rainy city can care for every walk.']
 },
 'grand-opera':{
  profile:'culture',
  zh:['上海大歌剧院','文化共享 / 从聚集到散场','一场演出的城市节律，始于抵达，也延续到散场之后。','歌剧院既是文化目的地，也是一次公共相聚的起点。滨江散步、公共交通与远程共享，把一场演出连接到更远的生活。脉在到场和离场时聚散，讯让内容与出行提示继续传递；银白形体把这些短暂的相遇留在同一片城市里。'],
  en:['Shanghai Grand Opera House','SHARED CULTURE / ARRIVAL AND DEPARTURE','A performance’s urban rhythm begins with arrival and continues after it ends.','Here the opera house is both a cultural destination and the beginning of a public gathering. Cultural life connects riverside walks, public transport and remote sharing. PULSE gathers and disperses around visits, while SIGNAL carries content and travel notices beyond the venue.']
 },
 'thousand-trees':{
  profile:'leisure',
  zh:['天安千树','绿色日常 / 立体街区','建筑与绿意之间，城市还有许多可以停留的高度。','天安千树让建筑、植物与街区生活在层叠的露台间交织。休憩与相遇融入日常路径。潮让天气经过层叠轮廓，脉表现不同时间的到访，讯连接生活服务与公众分享；变化的亮点围绕一处可停留的城市场所展开。'],
  en:['Tian An 1000 Trees','GREEN EVERYDAY LIFE / A LAYERED NEIGHBOURHOOD','Between buildings and greenery, the city offers many levels at which to pause.','1000 Trees brings a layered image of architecture, planting and neighbourhood life. Rest and encounter become part of ordinary journeys. TIDE moves through the stepped outline, PULSE follows visits through the day, and SIGNAL connects services and shared experiences.']
 },
 'west-bund-dream-center':{
  profile:'culture',
  zh:['西岸梦中心','工业记忆 / 新的公共生活','旧空间并未消失，而是承接了新的城市相聚。','西岸梦中心让工业空间与滨水生活产生联系。旧筒仓与工业长厅保留场所性格，也容纳文化、休闲与邻里使用。脉让午后和夜间的相聚各有节奏，讯承载内容与服务交换，潮则提醒沿江公共空间始终与天气相伴。'],
  en:['West Bund Dream Center','INDUSTRIAL MEMORY / NEW PUBLIC LIFE','Old spaces can hold new ways of gathering.','West Bund Dream Center connects industrial space with waterfront life. Renewal keeps the place’s character while welcoming culture, leisure and neighbourhood use. PULSE gives afternoon and evening gatherings different rhythms, SIGNAL carries content and services, and TIDE keeps weather present along the river.']
 },
 'indoor-botanic':{
  profile:'ecology',
  zh:['室内植物园','生态中庭 / 自然与照护','把一片可感知的自然，带进城市的日常。','透明中庭包裹中央生态树与水景，环廊和缓坡让人从不同高度接近自然。这座植物园把生态体验、休憩与公共学习放在同一空间。潮连接室外风雨与室内环境的细微变化，脉表现居民到访，讯呈现环境服务与公众内容的交换，思考技术如何帮助人们重新接近自然。'],
  en:['Indoor Botanic Garden','ECOLOGICAL ATRIUM / NATURE AND CARE','Bringing a tangible encounter with nature into everyday urban life.','A transparent atrium surrounds an ecological tree and water garden. Ring walks and ramps offer different levels from which to approach nature. The garden brings ecological experience, rest and shared learning together. TIDE links outdoor weather with a sheltered environment, PULSE follows visits, and SIGNAL asks how services and public content might help people reconnect with nature.']
 },
 'people-square':{
  profile:'civic',
  zh:['人民广场','公共相遇 / 城市共同的客厅','无数不同的目的地，在这里短暂交汇。','人民广场是一处共同的城市客厅：有人经过，有人抵达，也有人只是停留。不同年龄与生活节奏在这里相遇。脉呈现通勤和公共活动的交替，讯连接导览、出行与文化内容，潮让这片公共空间显露晴雨之间的不同表情。'],
  en:['People’s Square','PUBLIC ENCOUNTER / A SHARED CITY ROOM','Many different destinations briefly meet here.','People’s Square becomes a shared city room: some pass through, some arrive, and some simply stay. This public centre brings together different ages and ways of living. PULSE alternates between journeys and public activity, SIGNAL connects travel, interpretation and culture, and TIDE gives the square different expressions in sun and rain.']
 },
 'suzhou-creek':{
  profile:'waterfront',
  zh:['苏州河','水岸连接 / 日常的连续性','水岸连接的不只是地段，也是一段段日常。','苏州河是一条穿过街区的生活线索。水岸连接步行、文化与社区，让城市更新沿着日常发生。潮沿水系展开，脉让桥边与岸边的活动在不同时段显现，讯连接沿线的公众分享与服务，呈现一条持续被使用的城市岸线。'],
  en:['Suzhou Creek','WATERFRONT CONNECTION / EVERYDAY CONTINUITY','A waterfront links daily lives as well as places.','Suzhou Creek is a thread of everyday life running through neighbourhoods. The waterfront connects walking, culture and community. TIDE unfolds along the water, PULSE brings activity on banks and bridges into view at different hours, and SIGNAL carries public sharing and local services along a continuously lived shoreline.']
 },
 'shanghai-tower':{
  profile:'business',
  zh:['上海中心','垂直城市 / 服务与人的相遇','一座高楼，也是许多日常同时发生的空间。','上海中心代表高密度城市的垂直日常。工作、游览与公共服务在垂直空间里相遇。脉呈现抵达和离开的节奏，讯连接楼宇使用与城市服务；冰紫蓝光迹表现机器与服务交换，橙色亮点提醒我们，网络最终仍回应人的活动。'],
  en:['Shanghai Tower','VERTICAL CITY / PEOPLE AND SERVICES','A tower is also a place where many daily lives happen together.','Shanghai Tower represents the vertical everyday life of a dense city. Work, visits and public services share the tower’s vertical spaces. PULSE follows arrival and departure; SIGNAL connects building use to city services. Ice-violet paths express machine and service exchanges, while orange lights keep human activity in view.']
 },
 'yuyuan':{
  profile:'heritage',
  zh:['豫园','文化记忆 / 慢行的尺度','未来的速度之外，仍需要可以慢慢观看的地方。','豫园为城市保留一种细致、缓慢的观看方式。曲桥与庭园让传统空间与当代生活相互靠近。脉表现游览、停留与周边街巷的往返，讯连接文化内容和公共服务；潮经过屋顶与庭园，提醒观者感受一天之内细微的环境变化。'],
  en:['Yuyuan Garden','CULTURAL MEMORY / THE PACE OF WALKING','A faster future still needs places that reward a slower gaze.','Yuyuan preserves a close, unhurried way of looking. Traditional space and contemporary life meet along paths, bridges and gardens. PULSE follows visits, pauses and surrounding streets; SIGNAL connects cultural content and services. TIDE crossing roofs and gardens invites attention to small environmental changes through the day.']
 },
 'wukang-road':{
  profile:'street',
  zh:['武康路','步行街区 / 被看见的日常','一座城市的性格，也藏在一段步行的距离里。','武康路保留街道尺度的城市体验。街巷中的慢行不仅服务游览，也照顾居民回家、邻里交流与日常停留。脉沿街巷分散而非只在地标聚集，讯承载生活服务和公众分享；潮让树影与屋檐之间的天气变化成为步行体验的一部分。'],
  en:['Wukang Road','WALKABLE NEIGHBOURHOOD / EVERYDAY LIFE','A city’s character can live within the distance of a walk.','Wukang Road holds the experience of the city at street scale. Walking routes serve residents, neighbours and visitors alike. PULSE spreads through streets rather than gathering only at landmarks, SIGNAL carries daily services and public sharing, and TIDE makes weather part of the experience between trees and roofs.']
 },
 'yangpu-riverside':{
  profile:'waterfront',
  zh:['杨浦滨江','工业记忆 / 开放的岸线','城市曾经生产的地方，也可以成为一起生活的地方。','杨浦滨江把工业记忆与开放水岸放进同一幅城市图景。保留下来的工业遗存仍能被阅读，也让更多人获得沿江活动的机会。脉呈现步行、运动与停留，讯连接社区与文化分享，潮沿江面和岸线起伏，使环境、记忆与公共生活保持联系。'],
  en:['Yangpu Riverside','INDUSTRIAL MEMORY / AN OPEN SHORE','Places once shaped by production can also become places for shared life.','Yangpu Riverside brings industrial memory and an open waterfront into one urban scene. Renewal keeps old spaces readable while welcoming more people to the river. PULSE follows walking, exercise and rest, SIGNAL connects community and cultural sharing, and TIDE links environment, memory and public life.']
 },
 'hongqiao-station':{
  profile:'transport',
  zh:['虹桥站','城市门户 / 抵达与离开','每一次抵达，都在重新组织一座城市的节奏。','虹桥站是一处连接城市内外的交通门户。换乘、出行提示与城市服务在这里交织。脉表现抵达和离开带来的道路压力，讯传递旅程相关的请求与通知；遇到降雨时，两层以不同方式响应，让庞大的往返仍能被感知和理解。'],
  en:['Hongqiao Railway Station','CITY GATEWAY / ARRIVAL AND DEPARTURE','Every arrival rearranges the rhythm of a city.','Hongqiao is a gateway between Shanghai and journeys beyond it. Transfers, travel notices and city services work together across the gateway. PULSE follows the road pressure around arrivals and departures; SIGNAL carries journey-related requests and notifications. In rain, the layers respond differently, making large-scale movement perceptible.']
 },
 'dishui-lake':{
  profile:'ecology',
  zh:['滴水湖 · 滨湖公共建筑','水岸共享 / 公共生活','把视线移向远处，城市的节律并未在中心结束。','低展屋盖向湖面打开，椭圆采光口、球冠与公共平台组成一处2050滨湖空间。廊下的停留与湖边的漫步，让水岸成为日常相聚的地方。潮让水岸的天气变化被感知，脉呈现到访、散步与休憩，讯连接公共活动和区域服务，让中心之外的生活同样成为城市的主角。'],
  en:['Dishui Lake · Lakeside Public Building','SHARED WATERFRONT / PUBLIC LIFE','The city’s rhythm does not end at its centre.','A low, open roof, oval skylights, a spherical pavilion and public terraces open onto a shared lakeside place. Sheltered walks and open terraces bring daily gatherings to the water. TIDE reveals weather by the water, PULSE follows visits, walks and rest, and SIGNAL links public activities with regional services, giving life beyond the centre a visible role in the city.']
 },
 'cpc-first-congress':{
  profile:'heritage',
  zh:['中共一大旧址','城市记忆 / 代际之间','面向未来的城市，也需要知道自己从何处走来。','中共一大旧址保留一处可被重新走近的历史坐标。现场参观与公共学习相互补充。银白形体留住场所的轮廓，脉表现参观与周边日常的交织，讯连接代际分享的内容，使城市记忆在不断变化的生活中继续被理解。'],
  en:['CPC First Congress Site','CITY MEMORY / ACROSS GENERATIONS','A city looking forward also needs to remember where it has come from.','The historic site remains a place of memory that can be approached again. Visits and shared learning connect generations. A silver outline holds the place, PULSE follows visitors alongside surrounding daily life, and SIGNAL connects stories shared across generations as the city continues to change.']
 },
 'oriental-pearl':{
  profile:'broadcast',
  zh:['东方明珠','公共传播 / 城市的共同声波','一座塔让广播可见，也让共同的城市经验被分享。','东方明珠以广播电视塔的身份成为城市中的公共传播地标。文化内容与城市信息在更广阔的上海被接收与回应。讯让发送、汇聚和服务交换显现，脉保留塔下到访与沿江活动的节奏；传播的亮光与日常的人群，共同组成城市的声音。'],
  en:['Oriental Pearl Tower','PUBLIC COMMUNICATION / A SHARED CITY VOICE','A broadcasting tower gives a visible form to shared urban experience.','The Oriental Pearl anchors public communication through its broadcasting role. Cultural content and city information travel across Shanghai and invite responses. SIGNAL reveals sending and exchange, while PULSE holds the rhythm of visits and waterfront life beneath the tower.']
 }
});

export const PLACE_NARRATIVE_IDS=Object.freeze(Object.keys(stories));
const rhythmPairs={
 waterfront:{rain:['雨天里，沿岸活动更分散，出行与服务提示仍在交换。','In the rain, waterfront activity spreads out while travel and service notices continue.'],night:['入夜后，沿江到访渐少，水岸与城市服务仍保持联系。','At night, waterfront visits ease while the shore remains connected to city services.'],rest:['假日与周末把更多停留放在午后和沿江空间。','Holidays and weekends give more time to afternoon visits and the waterfront.'],day:['白天，经过、停留与沿江往返交替显现。','Daytime alternates between passing through, resting and travelling along the river.']},
 heritage:{rain:['雨天让室内停留与文化内容的交换更突出。','In the rain, sheltered visits and cultural sharing become more prominent.'],night:['夜间保留场所轮廓，让周围日常逐渐放慢。','Nighttime keeps the place visible as surrounding daily life slows.'],rest:['假日与周末把到访、停留和公共学习交织在一起。','Holidays and weekends bring visits, pauses and shared learning together.'],day:['白天在到访与周边街区日常之间切换重心。','Daytime shifts between visitors and the daily life of neighbouring streets.']},
 transport:{rain:['雨天增加出行相关的请求与提示，道路压力和信息回应各自变化。','In the rain, travel requests and notices rise while road pressure and information respond separately.'],night:['夜间降低通勤活动，仍保留枢纽往返与旅程服务。','Nighttime eases commuting while keeping gateway journeys and travel services present.'],rest:['假日与周末把往返重心转向到访、换乘与返程。','Holidays and weekends shift journeys towards visits, transfers and returning home.'],day:['工作日里，早晚往返与日间换乘形成不同的活动重心。','On weekdays, morning and evening journeys differ from daytime transfers.']},
 business:{rain:['雨天里，服务请求仍在交换，抵达与离开呈现不同压力。','In the rain, services continue to exchange as arrival and departure create different pressures.'],night:['入夜后，公共到访减弱，机器与服务交换仍在继续。','At night, public visits ease while machine and service exchanges continue.'],rest:['假日与周末改变工作与到访的比例，让城市呈现另一种节奏。','Holidays and weekends alter the balance between work and visits.'],day:['工作日让商务使用、公共到访与通勤交替增强。','On weekdays, the city alternates between business use, public visits and commuting.']},
 ecology:{rain:['雨天让环境线场增强，活动与服务在室内外之间重新分配。','In the rain, the environmental field strengthens while activity and services shift between indoors and outdoors.'],night:['入夜后，公众到访渐少，环境与区域服务的联系仍在继续。','At night, public visits ease while environmental and regional services remain connected.'],rest:['假日与周末让休憩、到访与自然体验更突出。','Holidays and weekends give more prominence to rest, visits and encounters with nature.'],day:['白天把自然体验与城市的生活、服务节奏放在一起观看。','Daytime brings encounters with nature into the rhythm of urban life and services.']},
 default:{rain:['雨天把更多活动引向可停留的空间，服务与公众内容继续交换。','In the rain, more activity moves towards sheltered places while services and public content continue to exchange.'],night:['夜间让活动渐缓，也保留仍在发生的内容与服务交换。','Nighttime slows public activity while keeping ongoing content and service exchanges visible.'],rest:['假日与周末把公共活动的重心更多放在午后与夜间。','Holidays and weekends shift more public activity towards afternoon and evening.'],day:['白天让到访、日常使用与周边往返形成不同节奏。','Daytime gives visits, daily use and neighbouring journeys different rhythms.']}
};

function weeklyRhythm(profile,lang,hour,weather){
 const h=Number.isFinite(hour)?Math.min(168,Math.max(0,hour)):0,day=Math.min(6,Math.floor(h/24)),clock=h===168?24:h%24;
 const state=(weather?.rainMm??0)>0?'rain':clock<6||clock>=22?'night':day===0||day>=5?'rest':'day';
 return (rhythmPairs[profile]??rhythmPairs.default)[state][lang==='en'?1:0];
}

/** Plain text, ready for textContent. Unknown names stay with the caller's fallback. */
export function placeNarrative(id,lang='zh',hour=0,weather={}){
 const item=stories[id];if(!item)return null;
 const en=lang==='en',[title,theme,lead,body]=item[en?'en':'zh'];
 return {id,title,theme,eyebrow:en?'SHANGHAI 2050 · PLACE & RHYTHM':'SHANGHAI 2050 · 地点与节律',lead,body,rhythm:weeklyRhythm(item.profile,en?'en':'zh',hour,weather)};
}

/** Immersive public descriptions; evidence remains in DATA / ART. */
export function facilityNarrative(node,lang='zh',hour=0,weather={}){
 if(!node||typeof node!=='object')return null;
 const en=lang==='en',kind=node.facilityKind??'';
 const copy=kind==='broadcast'?[
  '公共传播 / 让城市信息被听见','广播连接共同观看、文化内容与日常城市信息。','公共传播让不同地区的人分享同一段城市经验。橙金光迹承载公众内容，冰紫蓝光迹连接支撑它的机器与服务；发送、汇聚与回应，在一周中留下不同的节律。',
  'PUBLIC COMMUNICATION / A SHARED VOICE','Broadcasting connects shared viewing, cultural content and everyday city information.','Public communication lets people in different districts share a city experience. Orange carries public content, while ice-violet blue connects the supporting machines and services. Sending, gathering and responding leave different rhythms across the week.'
 ]:kind==='media-content'?[
  '内容生产 / 从一个地点走向城市','媒体内容让分散在城市各处的人分享共同的片段。','一段影像、一场演出、一条城市消息，从制作地点走向不同街区。讯连接内容制作、公共服务和各地的回应；入夜或雨天，观看与分享的重心随生活节奏流动。',
  'CONTENT PRODUCTION / FROM A PLACE TO THE CITY','Media content lets people across the city share common moments.','An image, a performance or a city update travels from its place of creation into different neighbourhoods. SIGNAL connects production, public services and responses across Shanghai. Watching and sharing shift with everyday rhythms, from evening gatherings to rainy days indoors.'
 ]:kind==='internet-exchange'?[
  '城域交换 / 城市连接的接力处','分散的服务在此汇聚，再走向城市的不同方向。','城市的连接由多个节点接力。冰紫蓝光迹呈现请求、汇聚与交换，橙金光迹保留公众内容的去向。不同地区和时段带来不同的需求，让网络在一周中持续重新组织。',
  'METROPOLITAN EXCHANGE / RELAYING CONNECTIONS','Services gather here before continuing towards different parts of the city.','Connections pass through many nodes. Ice-violet blue traces requests, gathering and exchange, while orange keeps public content in view. Demand changes between districts and hours, continually rearranging the network across the week.'
 ]:kind==='compute'||kind==='data-center'?[
  '算力与服务 / 支撑看得见的日常','看不见的处理，支撑着看得见的城市生活。','一次查询、一段影像、一次出行请求，在地区、服务与计算节点之间往返。冰紫蓝光迹连接处理与交换，橙金光迹指向公众使用。白天的工作、夜间的分享与雨天的需求，让算力的节奏始终贴近生活。',
  'COMPUTE AND SERVICES / SUPPORTING DAILY LIFE','Unseen processing supports the city’s visible everyday life.','A search, a video or a travel request moves between districts, services and compute nodes. Ice-violet blue connects processing and exchange; orange points towards public use. Daytime work, evening sharing and rainy-day demand keep computation close to everyday life.'
 ]:kind==='international-region'?[
  '区域联系 / 上海与更远处','上海的城市交换，也与更广阔的网络相连。','沿海的光迹把本地生活与远方服务联系起来。跨区域的请求、文化内容与服务回应，在城市边缘交汇，再进入不同街区；上海的日常，也在更广阔的连接中延续。',
  'REGIONAL CONNECTION / SHANGHAI AND BEYOND','Shanghai’s exchanges also connect to networks beyond the city.','Light paths along the coast link local life with more distant services. Requests, cultural content and responses meet at the city’s edge before reaching different neighbourhoods. Everyday Shanghai continues through these wider connections.'
 ]:[
  '地区服务 / 连接中心之外的日常','城市的每一片生活，都值得在网络中被看见。','社区、出行和公共服务在多个地区之间持续回应。冰紫蓝与橙金亮点分别连接服务交换与公众内容，让外围街区同样参与整周的变化。每一次请求与回应，都把远近不同的生活接在一起。',
  'REGIONAL SERVICES / EVERYDAY LIFE BEYOND THE CENTRE','Every part of urban life deserves to be visible within the network.','Community, travel and public services respond across different districts. Ice-violet blue and orange connect service exchange with public content, bringing neighbourhoods beyond the centre into the changing week. Every request and response brings daily lives near and far together.'
 ];
 const offset=en?3:0;
 return {id:node.id??null,title:en?(node.labelEn??node.labelZh??'City services'):(node.labelZh??node.labelEn??'城市服务'),theme:copy[offset],eyebrow:en?'SHANGHAI 2050 · NETWORK & LIFE':'SHANGHAI 2050 · 网络与生活',lead:copy[offset+1],body:copy[offset+2],rhythm:weeklyRhythm(node.serviceProfile==='logistics'?'transport':node.serviceProfile,en?'en':'zh',hour,weather)};
}

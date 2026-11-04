import {referenceDayAt} from './traffic-spatial-reference.mjs';

export function trafficCaption(hour,lang='zh'){
 const {kind}=referenceDayAt(hour),t=hour===168?24:hour%24;
 const pair=t<6?['夜间：干道与枢纽保留低水平需求','NIGHT · LOWER CORRIDOR / HUB DEMAND']:
 kind==='holiday-return'?['假期末日：游览、枢纽与返程需求交替','HOLIDAY END · LEISURE, HUBS AND RETURN TRIPS']:
 kind==='weekend'?['周末：生活圈、文旅与滨水活动改变热区','WEEKEND · LOCAL, CULTURAL AND WATERFRONT DEMAND']:
 t<10.5?['早间：通勤压力偏向就业中心与枢纽','MORNING · JOB CENTRES AND TRANSIT HUBS']:
 t<15.5?['日间：商务、配送与公共活动分区运行','DAYTIME · BUSINESS, LOGISTICS AND PUBLIC LIFE']:
 t<20.5?['晚间：通勤返向，生活与文化需求上升','EVENING · RETURN COMMUTES AND PUBLIC LIFE']:
 ['夜生活：通勤退散，公共活动与枢纽仍活跃','LATE · LEISURE AND HUBS OUTLAST COMMUTING'];
 return pair[lang==='zh'?0:1];
}

export function dataArtCopy(lang,{nodeCount,linkCount}){
 const weather='<a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener">ERA5 / Open-Meteo</a>',
 ixp='<a href="https://www.shixp.cn/shixp/knowUs/nodeEstablish" target="_blank" rel="noopener">SHIXP</a>',
 dc='<a href="https://www.sheitc.sh.gov.cn/cyfz/20230516/498b75de6a9d4b7a9dc2bd09783b429b.html" target="_blank" rel="noopener">上海市经信委数据中心项目名单</a>',
 holiday='<a href="https://www.shanghai.gov.cn/nw31406/20250603/397deabe9cad45daa865dfb96a0d453d.html" target="_blank" rel="noopener">上海文旅端午周报</a>';
 return lang==='zh'?
 `<p><b>参考周与未来周：</b>气象读取2025年6月2—8日上海附近${weather}逐小时历史缓存。2050为艺术情景周，不是未来实测或预测。温度、RH保留参考值；潮的风向、湿润响应有参考，空间波峰、波长与水位形态为艺术映射，未接入潮位或街区水文场。天空云幕、雾和暖晕已取消。雨丝数量与亮度按同周ERA5逐时降水参考变化，倾斜取参考风向；雨丝间距、屏幕长度与局部位置是ART显示，并非街区雨量观测。无雨小时不画雨。7—8日雷雨过程有公开气象报告依据，具体闪光时间、位置和频率是ART示意，不是闪电探测回放。雨声与雷声为本地合成的声音设计，随播放、图层和统一声音开关联动，不是历史声音录制。</p>
 <p><b>交通的空间变化：</b>采用这周真实日历与天气，并参照${holiday}和上海交通公开报告。6月2日是端午末日，周二至五为工作日，6月7—8日为周末/高考周末。就业、生活、文旅、机场与枢纽角色按时段产生不同的相对需求，逐段等待、消散，热点随位置与时段变化；不使用热力整体呼吸动画。未取得该周逐路段完整观测、OD或真实车速，因此显示的是受公开资料约束的2050推演，非真实交通周回放。颜色阈值整周固定，匿名施工场景及彩色立方体已移除。</p>
 <p><b>讯的含义：</b>${nodeCount}个设施/地区/服务端节点，${linkCount}条作者业务关系。设施角色和地址参照${ixp}、${dc}等公开资料；批准建设不等于当前投运，地址锚点不等于精确楼栋。冰紫蓝色表示机器请求、算力与交换服务；橙色表示公众内容、社区与出行交互。点云密度、光束宽度、亮度与光包慢放速度对应相对业务负载、容量情景与角色。每条关系按15分钟相对业务请求、有限服务容量与队列预计算一周；活跃线路集合、光包数量、密度和速度随时间变化，倒拖同一时间可重现。雨仅影响室内内容、交通通知等业务需求，不模拟雨对光纤的衰减。它们不是每楼流量实测、真实光纤路由或电磁传播速度；2050逐楼业务量不可从全市总量唯一反推。</p>
 <p><b>建筑与照片：</b>全域蓝色底座来自原始上海模型的点、边和显示简化体，统一渐暗。白色地标作为底图常驻，以照片/概念图和公开建筑形态为参考制作参数化粒子形体；没有把未来概念照片当成实拍测量或声称精确重建。地点故事围绕城市生活与2050设想展开，形态及定位限制在本说明中集中列出。低层地标按自身跨度分别进行有限展示放大，近景约1.5—2.2倍，远景约2.8—10倍；主塔保留既有显示比例。源米制几何和地理锚点不改变，不能读作真实建筑高度。蓝橙城市活动粒子是作者相对活动意象，不是实测人数。原始blend保留。</p>`:
 `<p><b>REFERENCE / FUTURE:</b> Hourly weather replays 2–8 June 2025 ${weather}. The 2050 week is authored, not measured or forecast. Temperature/RH retain historical values. Wind and moisture inform TIDE, while spatial waves are artistic, not measured tides or street-scale hydrology. Cloud/fog and warm haze backdrops are removed. Rain strokes follow historical hourly rainfall and wind; screen-space stroke sizes and positions are ART. Dry reference hours show no rain. Public reports document 7–8 June rain/thunder; exact flash times and positions are authored, not strike detections. Rain and thunder are locally synthesized sound design, controlled by playback, layer visibility and the shared mute, not historical field recordings.</p>
 <p><b>TRAFFIC:</b> The real reference calendar and weather, Shanghai transport reports and ${holiday} constrain the scenario. Monday is the holiday-return day; Tuesday–Friday commute and weekend public-life patterns differ by place and direction. Independent road queues build and dissipate, moving the hot areas. No synchronized heat breathing is used. Complete historical per-road observations and OD were not obtained: this is a constrained 2050 scenario, not a factual weekly traffic replay. Fixed colour thresholds; anonymous work zones and coloured cubes removed.</p>
 <p><b>SIGNAL:</b> ${nodeCount} facility/district/service nodes and ${linkCount} authored directed relations, informed by ${ixp} and ${dc}. Approval does not certify current operation; address anchors do not certify exact building positions. ICE BLUE: machine requests, compute and exchange. ORANGE: public content, community and travel interaction. Density, width, brightness and slowed packet cycles encode relative scenario load and capacity, not measured per-building traffic, optical routes or electromagnetic speed. A 15-minute finite business-queue history changes active links, packet counts and visual clocks; rain affects authored demand, never fibre attenuation. City totals cannot uniquely reconstruct future building loads.</p>
 <p><b>LANDMARKS:</b> The blue base uses the original source geometry with a common visibility envelope. Permanent white landmarks are approximate parametric particle forms informed by supplied photos/concept images and public architectural forms, not precise photogrammetry. Low-rise landmarks receive bounded, footprint-aware display exaggeration, leaving metric vertices and geographic anchors intact. Blue/orange PULSE glints are authored activity, not measured people. The original blend remains preserved.</p>`;
}


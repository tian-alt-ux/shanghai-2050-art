export const clampHour=h=>Math.min(168,Math.max(0,Number.isFinite(h)?h:0));
export function advanceWeek(hour,seconds,speed=4){return ((clampHour(hour)+Math.max(0,seconds)*speed)%168+168)%168;}
export function weekTime(hour,zh=true){const h=clampHour(hour);if(h===168)return zh?'周日 / 24:00':'SUN / 24:00';const days=zh?['周一','周二','周三','周四','周五','周六','周日']:['MON','TUE','WED','THU','FRI','SAT','SUN'];const m=Math.floor((h%24)*60+1e-6);return `${days[Math.floor(h/24)]} / ${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
export function storyAt(h,weather={}){
 if(weather.rainMm>.1)return {zh:['雨中，连接仍在继续','参考周的降雨增强环境线场；道路压力与出行提示按情景规则响应。'],en:['RAIN / CONNECTIONS CONTINUE','Reference-week rain brightens the environmental field. Authored road pressure and notices respond.']};
 if(weather.humidityPct>=85)return {zh:['水汽聚集，城市呈现冷光','高湿参考让蓝色线海与凝露增强，建筑、活动光流和信息仍保持各自节律。'],en:['MOIST AIR / COOL LIGHT','High reference humidity strengthens the blue field. Buildings, public life and information keep their own rhythms.']};
 if(weather.temperatureC>=28)return {zh:['午后升温，水汽退散','温暖、较干的参考时段让线海变轻、光点略暖；画面颜色变化采用固定艺术比例。'],en:['WARM AIR / A LIGHTER FIELD','Warm, drier reference hours lighten the line sea and warm its tint through a fixed artistic mapping.']};
 if(h>=120)return {zh:['周末，沿江活动继续','合成公共活动转向午后与滨水节点，背景温湿度按历史参考周继续变化。'],en:['WEEKEND / RIVERSIDE LIFE','Authored public life shifts towards afternoon and riverside nodes while reference weather continues.']};
 const day=Math.min(4,Math.floor(h/24));return {zh:[['一周，从往返开始','周二，街区持续交换','周三，晴暖的间隙','周四，空气与城市','周五，走向夜晚'][day],'温度、湿度与风读取同一历史参考周；街道和信息使用可复算的作者情景。'],en:[['MONDAY / DEPARTURES','TUESDAY / EXCHANGES','WEDNESDAY / A CLEAR INTERVAL','THURSDAY / AIR AND CITY','FRIDAY / INTO THE EVENING'][day],'Temperature, humidity and wind share one historical reference week. Streets and information follow authored rules.']};
}

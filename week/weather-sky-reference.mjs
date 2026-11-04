/**
 * Additional ERA5 sky fields for exactly the existing 2–8 June 2025 reference.
 * Cloud geometry and discharge times are an ART interpretation, not observations.
 * The source weather_code cannot diagnose thunder: Open-Meteo explicitly says so.
 */
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const SKY_SOURCES=Object.freeze({
  api:'https://archive-api.open-meteo.com/v1/archive?latitude=31.25&longitude=121.5&start_date=2025-06-02&end_date=2025-06-08&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,weather_code,direct_radiation,shortwave_radiation,is_day&models=era5&timezone=Asia%2FShanghai&wind_speed_unit=ms',
  definitions:'https://open-meteo.com/en/docs/historical-weather-api',
  meiYuReport:'https://sh.weather.com.cn/gdtp/06/4210372.shtml',
  saturdayReport:'https://www.weather.com.cn/shanghai/gdtp/06/4210608.shtml',
  sundayReport:'https://sh.weather.com.cn/gdtp/06/4211826.shtml',
  thunderWarningCleared:'https://m.thepaper.cn/newsDetail_forward_30951422'
});
const expected={cloud_cover:['%',0,100],cloud_cover_low:['%',0,100],cloud_cover_mid:['%',0,100],cloud_cover_high:['%',0,100],weather_code:['wmo code',0,99],direct_radiation:['W/m²',0,1600],shortwave_radiation:['W/m²',0,1600],is_day:['',0,1]};
export function createSkyReference(reference){
  if(reference?.timezone!=='Asia/Shanghai'||reference.utc_offset_seconds!==28800)throw new TypeError('Sky reference must use Asia/Shanghai UTC+08');
  const data=structuredClone(reference),s=data.hourly;
  if(s?.time?.length!==168||s.time[0]!=='2025-06-02T00:00'||s.time[167]!=='2025-06-08T23:00')throw new TypeError('Sky reference must match the existing 168-hour week');
  if(data.latitude!==31.25||data.longitude!==121.5)throw new TypeError('Sky reference grid must match the existing ERA5 grid');
  for(let i=0;i<168;i++)if(!Number.isFinite(Date.parse(s.time[i]+'+08:00'))||(i&&Date.parse(s.time[i]+'+08:00')-Date.parse(s.time[i-1]+'+08:00')!==3600000))throw new TypeError('Sky timestamps must be consecutive');
  for(const [name,[unit,min,max]] of Object.entries(expected))if(data.hourly_units?.[name]!==unit||s[name]?.length!==168||s[name].some(v=>!Number.isFinite(v)||v<min||v>max))throw new TypeError('Invalid sky field: '+name);
  function at(hour,weather={}){
    if(!Number.isFinite(hour))throw new TypeError('Sky hour must be finite');
    const h=clamp(hour,0,168),q=Math.min(h,167),lo=Math.floor(q),hi=Math.min(lo+1,167),f=q-lo;
    const value=k=>mix(s[k][lo],s[k][hi],f),cloudCoverPct=value('cloud_cover'),lowCloudPct=value('cloud_cover_low'),midCloudPct=value('cloud_cover_mid'),highCloudPct=value('cloud_cover_high');
    const directWm2=value('direct_radiation'),solarWm2=value('shortwave_radiation');
    // Solar elevation is an approximate analytic display, not a new weather reading.
    const localHour=h===168?24:h%24,dayIndex=Math.min(6,Math.floor(h/24));
    const latitude=data.latitude*Math.PI/180,declination=23.44*Math.PI/180*Math.sin(2*Math.PI*(153+dayIndex-80)/365);
    const hourAngle=(localHour-12+(data.longitude-120)/15)*Math.PI/12;
    const solarElevation=Math.asin(Math.sin(latitude)*Math.sin(declination)+Math.cos(latitude)*Math.cos(declination)*Math.cos(hourAngle));
    const daylight=smooth(-.08,.20,solarElevation),sunshine=clamp(directWm2/800),rainMm=Math.max(0,weather.rainMm??0),rainDisplay=clamp(Math.log1p(rainMm)/Math.log(7));
    const stormWindow=h>=120&&h<158+20/60;
    // Evidence only constrains a rainy weekend episode. The exact flashes, branches
    // and directions are authored and deliberately cannot be mistaken for detections.
    const flashCenters=[132.35,136.65,140.25,146.45,150.75,154.55,157.15];
    let lightning=0,lightningSeed=0;
    if(stormWindow&&rainMm>=.5)for(let i=0;i<flashCenters.length;i++){
      const d=h-flashCenters[i],strength=Math.exp(-Math.pow(d/.105,2))+.40*Math.exp(-Math.pow((d-.21)/.065,2));
      if(strength>lightning){lightning=strength;lightningSeed=i+1;}
    }
    lightning=lightning>.005?clamp(lightning):0;
    const labelZh=rainMm>.1?(stormWindow?'阵雨 / 雷雨过程':'降雨'):cloudCoverPct>80?'阴天':cloudCoverPct>25?'多云':'晴朗';
    const labelEn=rainMm>.1?(stormWindow?'RAIN / THUNDER EPISODE':'RAIN'):cloudCoverPct>80?'OVERCAST':cloudCoverPct>25?'PARTLY CLOUDY':'CLEAR';
    return {hour:h,sourceHour:lo,sourceTime:s.time[lo],endpointHeld:h>167,cloudCoverPct,lowCloudPct,midCloudPct,highCloudPct,
      directWm2,solarWm2,isDay:s.is_day[lo]===1,weatherCode:s.weather_code[lo],solarElevation,daylight,sunshine,rainMm,rainDisplay,
      cloudDensity:clamp(cloudCoverPct/100),stormWindow,lightning,lightningSeed,labelZh,labelEn,
      lightningEvidence:'ART flash timing/position inside the documented 7–8 June rain/thunder episode; no measured strike feed'};
  }
  return {at,meta:{schemaVersion:'weather-sky-reference-1',source:'ERA5 via Open-Meteo',grid:[121.5,31.25],sampleCount:168,timezone:data.timezone,sources:SKY_SOURCES,
    cloud:'Single 0.25° grid-cell cloud fraction; no observed neighbourhood cloud geometry.',
    solar:'Radiation is preceding-hour mean. Sky colour is an artistic mapping; approximate solar elevation is analytic.',
    thunder:'ERA5-derived weather_code does not estimate thunderstorms. The public 7–8 June reports justify an event-window interpretation only; discharge locations, times and frequency are authored.',
    endpoint:'167–168 h holds the final reference; no extra source hour.'}};
}

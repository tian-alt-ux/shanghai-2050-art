import {buildSyntheticEnvironment} from './environment.mjs';

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const fields={
  temperature_2m:{unit:'°C',min:-90,max:60},
  relative_humidity_2m:{unit:'%',min:0,max:100},
  precipitation:{unit:'mm',min:0,max:500},
  wind_speed_10m:{unit:'m/s',min:0,max:150},
  wind_direction_10m:{unit:'°',min:0,max:360}
};

/** Fixed ART display scales. They never change the source numbers or physical units. */
export const WEATHER_DISPLAY_SCALES=Object.freeze({
  temperatureC:Object.freeze([18,34]),
  humidityPct:Object.freeze([25,100]),
  rainMmPerHour:6,
  windMps:8,
  temperatureChartC:Object.freeze([16,34]),
  humidityChartPct:Object.freeze([20,100])
});

function validate(reference){
  if(reference?.timezone!=='Asia/Shanghai'||reference.utc_offset_seconds!==28800)throw new TypeError('Weather reference must use Asia/Shanghai UTC+08:00');
  const time=reference.hourly?.time;
  if(!Array.isArray(time)||time.length!==168)throw new TypeError('Weather reference requires exactly 168 hourly timestamps');
  for(let i=0;i<time.length;i++){
    const ms=Date.parse(time[i]+'+08:00');
    if(!Number.isFinite(ms)||(i&&ms-Date.parse(time[i-1]+'+08:00')!==3600000))throw new TypeError('Weather reference timestamps must be finite and consecutive');
  }
  for(const [key,{unit,min,max}] of Object.entries(fields)){
    if(reference.hourly_units?.[key]!==unit)throw new TypeError(`Unexpected weather unit for ${key}`);
    const values=reference.hourly[key];
    if(!Array.isArray(values)||values.length!==168||values.some(v=>!Number.isFinite(v)||v<min||v>max))throw new TypeError(`Missing or invalid hourly weather values: ${key}`);
  }
  if(!Number.isFinite(reference.latitude)||!Number.isFinite(reference.longitude))throw new TypeError('Weather reference requires its returned grid coordinate');
}

/**
 * Historical reference playback for an artistic 2050 setting.
 * Temperature and RH retain the cached physical values. Precipitation is the
 * reported preceding-hour total, held between sample times, not instantaneous rain.
 * No future weather, hydrology or street-scale spatial precision is inferred.
 */
export function createWeatherReference(reference){
  validate(reference);
  // Copy the cache so a later caller mutation cannot rewrite the playback.
  const data=structuredClone(reference),source=data.hourly;
  const activity=buildSyntheticEnvironment().hours;
  const windAtIndex=i=>{
    const angle=source.wind_direction_10m[i]*Math.PI/180,speed=source.wind_speed_10m[i];
    return {east:-speed*Math.sin(angle),north:-speed*Math.cos(angle)};
  };
  function weatherAt(hour){
    if(!Number.isFinite(hour))throw new TypeError('Weather hour must be finite');
    const h=clamp(hour,0,168),at=Math.min(h,167),lo=Math.floor(at),hi=Math.min(167,lo+1),t=at-lo;
    const temperatureC=mix(source.temperature_2m[lo],source.temperature_2m[hi],t);
    const humidityPct=mix(source.relative_humidity_2m[lo],source.relative_humidity_2m[hi],t);
    const a=windAtIndex(lo),b=windAtIndex(hi),windEastMps=mix(a.east,b.east,t),windNorthMps=mix(a.north,b.north,t);
    const windSpeedMps=Math.hypot(windEastMps,windNorthMps);
    // Weather direction is FROM. Preserve vector interpolation across 359° / 1°.
    const windDirectionDeg=t===0?source.wind_direction_10m[lo]:(Math.atan2(-windEastMps,-windNorthMps)*180/Math.PI+360)%360;
    const rainMm=source.precipitation[lo];
    return {hour:h,sourceHour:lo,sourceTime:source.time[lo],endpointHeld:h>167,
      temperatureC,humidityPct,rainMm,windSpeedMps,windDirectionDeg,windEastMps,windNorthMps,
      temperatureIndex:clamp((temperatureC-18)/16),moistureIndex:clamp((humidityPct-25)/75),
      rainIndex:clamp(rainMm/WEATHER_DISPLAY_SCALES.rainMmPerHour),
      windX:windEastMps/WEATHER_DISPLAY_SCALES.windMps,windY:windNorthMps/WEATHER_DISPLAY_SCALES.windMps,
      activityIndex:mix(activity[Math.floor(h)].activityIndex,activity[Math.min(168,Math.floor(h)+1)].activityIndex,h%1),
      day:Math.min(6,Math.floor(h/24)),hourOfDay:h===168?24:h%24};
  }
  const hours=Array.from({length:169},(_,h)=>weatherAt(h));
  const series={
    temperatureC:source.temperature_2m.slice(),humidityPct:source.relative_humidity_2m.slice(),
    rainMm:source.precipitation.slice(),windSpeedMps:source.wind_speed_10m.slice(),windDirectionDeg:source.wind_direction_10m.slice(),
    time:source.time.slice()
  };
  return {weatherAt,hours,series,meta:{
    schemaVersion:'weather-reference-playback-1',evidenceKind:'REANALYSIS-REFERENCE',
    sourceName:'ERA5 / Copernicus via Open-Meteo',sourceUrl:'https://open-meteo.com/en/docs/historical-weather-api',
    start:source.time[0],end:source.time.at(-1),timezone:data.timezone,grid:[data.longitude,data.latitude],
    sourceSampleCount:168,displayEndpointCount:169,sourceResolution:'ERA5 0.25° (approximately 25 km)',
    units:{temperatureC:'°C',humidityPct:'%',rainMm:'mm in the preceding hour',windSpeedMps:'m/s',windDirectionDeg:'degrees FROM'},
    use:'Historical weather values replayed as reference within a 2050 artistic setting; not a measured or forecast 2050 week.',
    displayScales:WEATHER_DISPLAY_SCALES,
    interpolation:'Temperature and RH use linear visual interpolation; wind interpolates east/north vectors. Hourly precipitation totals are held, not interpolated into observations.',
    endpoint:'167–168 h holds the last 2025-06-08 23:00 reference. The 168 h endpoint adds no source observation or precipitation sample.',
    activity:'Independent authored weekday/weekend activity from buildSyntheticEnvironment; not observed human activity.',
    moisture:'A fixed display transform of air RH, not surface wetness, water depth, tide or flood extent.',
    licence:'CC BY 4.0; credit Open-Meteo and Copernicus/ECMWF ERA5',
    limitations:['Single returned grid cell; no neighbourhood weather field.','No artificial noise, peak amplification or future-year relabelling applied to physical numbers.']
  }};
}

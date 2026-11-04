/** Reproducible relative environment for an authored 2050 week.
 * Historical ERA5 values and climate projections remain separate from the synthetic state.
 */
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const round=x=>Math.round(x*1e6)/1e6;
const mix=(a,b,t)=>a+(b-a)*t;
const bell=(x,centre,width)=>Math.exp(-.5*((x-centre)/width)**2);
export const ENVIRONMENT_PARAMETERS=Object.freeze({
  seed:205026, durationHours:168, sampleHours:1, integrationHours:.25,
  rainStartHour:64, rainEndHour:70, rainPeakIndex:.88,
  wettingResponseHours:1.25, dryingResponseHours:8.5, maximumRainWetness:.54,
  historicalWindSmoothingHours:7,
  historicalMoistureSmoothingHours:5,moistureBaselineMinimum:.22,moistureBaselineRange:.12,
  historicalRhNormalisationRange:[25,100],
  note:'Author parameters for a synthetic relative-index week; not fitted hourly Shanghai weather.'
});

export function rainPulse(hour){
  const {rainStartHour:a,rainEndHour:b,rainPeakIndex:m}=ENVIRONMENT_PARAMETERS;
  if(hour<=a||hour>=b)return 0;
  return m*Math.sin(Math.PI*(hour-a)/(b-a))**2;
}

function historicalAt(reference,key,hour){
  const values=reference?.hourly?.[key];
  if(!Array.isArray(values)||values.length!==168||values.some(v=>!Number.isFinite(v)))return null;
  const h=clamp(hour,0,167),lo=Math.floor(h),hi=Math.min(167,lo+1);
  return mix(values[lo],values[hi],h-lo);
}

function referenceWind(reference,hour){
  if(!reference)return null;
  const speeds=reference.hourly?.wind_speed_10m;
  if(!Array.isArray(speeds)||speeds.length!==168)return null;
  const scale=Math.max(...speeds);
  if(!(scale>0))return null;
  let east=0,north=0,n=0;
  for(let k=-3;k<=3;k++){
    const speed=historicalAt(reference,'wind_speed_10m',hour+k);
    const direction=historicalAt(reference,'wind_direction_10m',hour+k);
    if(speed==null||direction==null)return null;
    // Meteorological direction is where wind comes FROM. Convert to travel direction.
    east-=speed*Math.sin(direction*Math.PI/180)/scale;
    north-=speed*Math.cos(direction*Math.PI/180)/scale;
    n++;
  }
  return {x:east/n,y:north/n};
}

function baselineMoisture(reference,hour,phase){
  let rh=0,n=0;
  for(let k=-2;k<=2;k++){
    const value=historicalAt(reference,'relative_humidity_2m',hour+k);
    if(value!=null){rh+=value;n++;}
  }
  // This transform is an authored display baseline, NOT a future RH percentage.
  if(n)return ENVIRONMENT_PARAMETERS.moistureBaselineMinimum+ENVIRONMENT_PARAMETERS.moistureBaselineRange*clamp((rh/n-25)/75);
  return .27+.035*Math.cos((hour-4)*Math.PI/12)+.018*Math.sin(hour*.025+phase);
}

function activityAt(hour){
  const day=Math.min(6,Math.floor(hour/24)),hod=hour===168?24:hour%24;
  const weekday=.14+.49*bell(hod,8.1,1.6)+.55*bell(hod,18.2,2)+.17*bell(hod,12.5,2.3);
  const weekend=.12+.47*bell(hod,14,3.8)+.22*bell(hod,20,2.7);
  return clamp(day>=5?weekend:weekday);
}

export function buildSyntheticEnvironment({seed=ENVIRONMENT_PARAMETERS.seed,climateBackground=null,historicalReference=null}={}){
  if(!Number.isFinite(seed))throw new TypeError('Environment seed must be finite');
  const phase=(Math.abs(Math.trunc(seed))%997)/997*Math.PI*2;
  const hours=[];
  let wetness=0;
  for(let tick=0;tick<=168*4;tick++){
    const hour=tick/4,rain=rainPulse(hour);
    if(tick){
      const previousHour=hour-.25,midRain=rainPulse(previousHour+.125);
      const target=ENVIRONMENT_PARAMETERS.maximumRainWetness*midRain;
      const tau=target>wetness?ENVIRONMENT_PARAMETERS.wettingResponseHours:ENVIRONMENT_PARAMETERS.dryingResponseHours;
      wetness+=(target-wetness)*(1-Math.exp(-.25/tau));
    }
    if(tick%4)continue;
    const reference=referenceWind(historicalReference,hour);
    const angle=phase*.15+.45*Math.sin(hour*.071)+hour*.023;
    const magnitude=.32+.1*Math.sin(hour*.031+phase);
    hours.push({hour,day:Math.min(6,Math.floor(hour/24)),hourOfDay:hour===168?24:hour%24,
      rainIndex:round(rain),moistureIndex:round(clamp(baselineMoisture(historicalReference,hour,phase)+wetness)),
      windX:round(reference?.x??Math.cos(angle)*magnitude),windY:round(reference?.y??Math.sin(angle)*magnitude),
      activityIndex:round(activityAt(hour))});
  }
  return {meta:{schemaVersion:'metabolism-environment-1',seed,durationHours:168,endpointCount:169,
      authoredYear:2050,season:'early-summer',calendar:'Monday through Sunday; no claimed future date',
      evidenceKinds:{hourlyStates:'ASSUMP',historicalReference:historicalReference?'REANALYSIS-reference-only':'not-acquired',climateBackground:'PROJ-background-only',visualMapping:'ART'},
      units:{rainIndex:'relative-index 0..1',moistureIndex:'relative wetness display index 0..1; not RH%',windX:'relative eastward vector -1..1; not m/s',windY:'relative northward vector -1..1; not m/s',activityIndex:'relative authored activity 0..1'},
      sourceIds:['ASSUMP-WEEK-2050','ART-MOISTURE-MAPPING',...(historicalReference?['REF-ERA5-2025-06']:[]),...(climateBackground?['PROJ-CHC-SH']:[])],
      parameters:{...ENVIRONMENT_PARAMETERS,seed},climateBackground,
      historicalReference:historicalReference?{dataStart:historicalReference.hourly.time[0],dataEnd:historicalReference.hourly.time.at(-1),model:'ERA5 via Open-Meteo',kind:'reanalysis, not station observation',pixel:[historicalReference.longitude,historicalReference.latitude],timezone:historicalReference.timezone,licence:'CC BY 4.0; credit Open-Meteo and Copernicus/ECMWF ERA5',use:'7-hour-smoothed normalised wind vectors; 5-hour-smoothed RH transformed only into a display baseline. Historical rain and temperature do not schedule the future event.'}:null,
      limitations:['The rain event and activity profile are authored; this is not weather prediction or an observed 2050 week.',
        'Historical reference shape reuse is not a dynamically consistent weather generator or downscaling.',
        'CHC climate-window deltas are displayed separately and never set hourly rain, physical RH or river level.',
        'No terrain, hydrodynamics, street-scale flood depth, future measured wind speed or station calibration.',
        'Endpoint 168 is the end of Sunday; history at 168 holds the last historical reference hour, not a fabricated extra observation.']},hours};
}

export function environmentAt(hoursOrData,hour){
  if(!Number.isFinite(hour))throw new TypeError('Simulation hour must be finite');
  const hours=Array.isArray(hoursOrData)?hoursOrData:hoursOrData?.hours;
  if(!Array.isArray(hours)||hours.length<2)throw new TypeError('Environment needs hourly samples');
  const h=clamp(hour,hours[0].hour,hours.at(-1).hour);
  let lo=0,hi=hours.length-1;
  while(lo+1<hi){const mid=(lo+hi)>>1;if(hours[mid].hour<=h)lo=mid;else hi=mid;}
  if(h===hours.at(-1).hour)return {...hours.at(-1)};
  const a=hours[lo],b=hours[hi],t=(h-a.hour)/(b.hour-a.hour);
  return {hour:h,day:Math.min(6,Math.floor(h/24)),hourOfDay:h===168?24:h%24,
    rainIndex:mix(a.rainIndex,b.rainIndex,t),moistureIndex:mix(a.moistureIndex,b.moistureIndex,t),
    windX:mix(a.windX,b.windX,t),windY:mix(a.windY,b.windY,t),activityIndex:mix(a.activityIndex,b.activityIndex,t)};
}

export const createRainAt=data=>hour=>environmentAt(data,hour).rainIndex;

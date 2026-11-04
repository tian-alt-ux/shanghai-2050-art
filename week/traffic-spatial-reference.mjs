// Public sources constrain calendar and spatial roles. All weights, radii, rates and
// 2050 continuity below are authored hypotheses, never a recovered road-flow feed.
const R=6378137,origin=[13524761.533928772,3663957.0930902106];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const g=(t,m,s)=>Math.exp(-.5*((t-m)/s)**2);
const project=(lon,lat)=>[R*lon*Math.PI/180-origin[0],R*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))-origin[1]];

export const TRAFFIC_REFERENCE_WEEK=Object.freeze({
 dates:['2025-06-02','2025-06-03','2025-06-04','2025-06-05','2025-06-06','2025-06-07','2025-06-08'],
 dayKinds:['holiday-return','workday','workday','workday','friday','weekend','weekend'],
 evidence:'Historical weather/calendar and public aggregate/spatial evidence; no observed hourly road counts or OD. Replayed as an authored 2050 scenario, not a 2050 calendar forecast.',
 sources:[
  {id:'holiday',url:'https://www.forestry.gov.cn/c/www/szxx/594663.jhtml',fact:'State Council: 31 May–2 June 2025 was the Dragon Boat holiday. June 2 must not be an ordinary Monday commute.'},
  {id:'holiday-tourism',url:'https://www.shanghai.gov.cn/nw31406/20250603/397deabe9cad45daa865dfb96a0d453d.html',fact:'Shanghai Culture and Tourism Bureau reported 6.4808 million holiday visitor visits and diverse cultural activity. This supports a leisure/return day, not road-specific demand.'},
  {id:'annual-road',url:'https://jtw.sh.gov.cn/xwfb2/20250912/304328c870354296add7f82b7f1a768a.html',fact:'2024 annual road aggregates show weekday morning/evening peaks, PM slightly stronger, peripheral growth. Annual city indices are not fitted to individual roads.'},
  {id:'exam-calendar',url:'https://www.shanghai.gov.cn/nw17239/20250606/c383f7f6512143a7932a43a76175c38a.html',fact:'June 7–8 included college entrance exams. No invented school catchments or observed exam traffic are generated.'},
  {id:'rain-context',url:'https://gaj.sh.gov.cn/shga/wzXxfbGj/detail?pa=f41aa3d5accbfad14fcbf784730c1c7f3246599c78cf0fe43ea374ce0b9497eb587aef6d9fc37b24457a0432771cd8fff89cd8d0bb43e938',fact:'Shanghai police described short-duration heavy rain on the second exam day; June 8 is inferred from the official June 7 first-day calendar. Road losses still use authored coefficients and cached historical rain.'},
  {id:'weather-mechanism',url:'https://ops.fhwa.dot.gov/weather/roadimpact.htm',fact:'General research supports weather-sensitive service and discretionary demand. Coefficients here are not measured Shanghai values.'}
 ]
});

// [id,lon,lat,influence projected metres,jobs,retail,leisure,hub,freight]
// Named locations are geographic anchors; influence areas and mixes are ASSUMP.
const definitions=[
 ['lujiazui',121.505,31.237,1500,1,.38,.24,.08,.02],
 ['people-square',121.471,31.2318,1500,.66,.85,.36,.20,.01],
 ['nanjing-road',121.477,31.235,1050,.42,1,.68,.14,.01],
 ['bund',121.48763,31.23534,850,.35,.44,1,.12,.01],
 ['yuyuan',121.48798,31.22893,1000,.20,.82,.95,.12,.02],
 ['north-central',121.487,31.259,1900,.25,.30,.12,.12,.08],
 ['xujiahui',121.437,31.193,2700,.75,.85,.40,.20,.02],
 ['west-bund',121.46159,31.16234,2400,.42,.4,.95,.10,.02],
 ['yangpu',121.5331,31.2554,4200,.78,.45,.63,.12,.08],
 ['hongqiao',121.31611,31.19612,6200,.72,.68,.35,1,.25],
 ['zhangjiang',121.59,31.20,6500,1,.32,.20,.15,.33],
 ['lingang',121.90,30.91,8500,.66,.40,.47,.25,1],
 ['songjiang',121.23,31.03,7600,.60,.60,.47,.36,.38],
 ['qingpu',121.11,31.15,7000,.56,.40,.66,.38,.50],
 ['jiading',121.25,31.38,7000,.73,.45,.36,.30,.72],
 ['pudong-airport',121.80,31.15,6200,.45,.26,.15,1,.64],
 ['chongming',121.40,31.62,8500,.18,.24,.88,.22,.18]
];
export const TRAFFIC_SPATIAL_ANCHORS=definitions.map(([id,lon,lat,radius,jobs,retail,leisure,hub,freight])=>({id,lon,lat,radius,point:project(lon,lat),jobs,retail,leisure,hub,freight,evidenceKind:'geographic anchor + ASSUMP influence'}));

export function trafficRoleAt(x,y){
 let best=-1,jobScore=-1,nearest=TRAFFIC_SPATIAL_ANCHORS[0],jobAnchor=nearest;const fields={jobs:0,retail:0,leisure:0,hub:0,freight:0};
 for(const a of TRAFFIC_SPATIAL_ANCHORS){const weight=Math.exp(-.5*((x-a.point[0])**2+(y-a.point[1])**2)/a.radius**2);if(weight>best){best=weight;nearest=a;}if(weight*a.jobs>jobScore){jobScore=weight*a.jobs;jobAnchor=a;}for(const key of Object.keys(fields))fields[key]=Math.max(fields[key],weight*a[key]);}
 const home=clamp(.45+.45*(1-fields.jobs)+.2*(nearest.id==='north-central'?best:0));
 // Travel-like peak offsets are display demand assumptions, not routed travel times.
 const coreDistance=Math.hypot(x,y),outer=clamp(coreDistance/25000);
 return {...fields,home,activity:clamp(best),district:nearest.id,jobPoint:jobAnchor.point,outer,
  amTime:8.35-.9*outer,pmTime:17.65+.95*outer};
}

export function referenceDayAt(hour){const day=Math.min(6,Math.max(0,Math.floor(hour/24)));return {day,date:TRAFFIC_REFERENCE_WEEK.dates[day],kind:TRAFFIC_REFERENCE_WEEK.dayKinds[day]};}

export function spatialDemandRate(hour,role,rainValue=0){
 const {day,kind}=referenceDayAt(hour),t=((hour%24)+24)%24,shift=role.peakShift||0,d=role.direction||0;
 const am=g(t,role.amTime+shift,1.05),pm=g(t,role.pmTime+shift,1.4);
 let profile;
 if(kind==='workday'||kind==='friday'){
  const dayFactor=[1,1.035,.995,1.015,1.045][day];
  const commute=(.22+.84*role.jobs)*(1+.52*d)*am+(.25+.95*role.home)*(1-.52*d)*pm;
  const midday=(.12+.37*role.retail)*g(t,12.6+shift*.5,1.7);
  const evening=(.05+(kind==='friday'?1.07:.83)*role.leisure)*g(t,20.3+shift,1.35);
  const hub=(.09+.38*role.hub)*(g(t,7.3,1.15)+.85*g(t,15.1,1.5)+.7*g(t,21,1.4));
  const freight=.33*role.freight*(g(t,5.4,1.4)+g(t,13.8,1.8)+.8*g(t,22.2,1.2));
  profile=(.13+commute+midday+evening+hub+freight)*dayFactor;
 }else if(kind==='holiday-return'){
  const leisure=(.13+.88*role.leisure)*g(t,11.6+shift,1.7)+(.16+.55*role.retail)*g(t,15.2+shift,1.9);
  const returnFlow=(.22+.75*role.hub+.25*role.home)*g(t,18.1+shift,2.0);
  const night=(.08+.90*role.leisure)*g(t,20.2+shift,1.35);
  profile=.13+leisure+returnFlow+night+.16*role.freight*g(t,13,3);
 }else{
  const outing=(.23+.75*role.leisure+.20*role.retail)*g(t,11.9+shift,1.8);
  const shopping=(.25+.70*role.retail)*g(t,16+shift,2.0);
  const night=(.08+(day===5?1.04:.88)*role.leisure)*g(t,20.3+shift,1.5);
  const returnFlow=(.08+.37*role.hub+.13*role.home)*g(t,18.2,2.2);
  profile=.13+outing+shopping+night+returnFlow+.12*role.freight*g(t,13.5,3);
 }
 const discretionary=kind==='workday'||kind==='friday'?.055*(1-.45*role.jobs):.12;
 return profile*(1-discretionary*clamp(rainValue));
}

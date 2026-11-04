/** Public facility identities / addresses; positioning evidence is explicit. */
export const SIGNAL_SOURCE_URLS=Object.freeze({
 pearl:'https://www.shda.gov.cn/dawh/csjy/202509/t20250919_75918.html',
 smg:'https://www.smg.cn/review/mobile/ann/content/202412/0003336.html',
 shixp:'https://www.shixp.cn/shixp/knowUs/nodeEstablish',
 compute:'https://www.ssc.net.cn/about.html',
 computeAddress:'https://rsj.sh.gov.cn/tzpgg_17408/20240717/t0035_1426098.html',
 weihaiMap:'https://www.amap.com/place/B001559AUS',
 hongqiaoMap:'https://www.amap.com/place/B0015436A9'
});
const PI=Math.PI,a=6378245,ee=.006693421622965943;
function transformLat(x,y){let n=-100+2*x+3*y+.2*y*y+.1*x*y+.2*Math.sqrt(Math.abs(x));n+=(20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3;n+=(20*Math.sin(y*PI)+40*Math.sin(y/3*PI))*2/3;return n+(160*Math.sin(y/12*PI)+320*Math.sin(y*PI/30))*2/3;}
function transformLon(x,y){let n=300+x+2*y+.1*x*x+.1*x*y+.1*Math.sqrt(Math.abs(x));n+=(20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3;n+=(20*Math.sin(x*PI)+40*Math.sin(x/3*PI))*2/3;return n+(150*Math.sin(x/12*PI)+300*Math.sin(x/30*PI))*2/3;}
function wgsToGcj(lon,lat){const rad=lat/180*PI,s=Math.sin(rad),magic=1-ee*s*s,sqrt=Math.sqrt(magic);return [lon+transformLon(lon-105,lat-35)*180/(a/sqrt*Math.cos(rad)*PI),lat+transformLat(lon-105,lat-35)*180/((a*(1-ee))/(magic*sqrt)*PI)];}
/** Iterative approximate inverse, not a surveyed conversion. */
export function gcj02ToWgs84(lon,lat){let x=lon,y=lat;for(let i=0;i<6;i++){const [u,v]=wgsToGcj(x,y);x-=u-lon;y-=v-lat;}return {lon:x,lat:y};}
const weihai=gcj02ToWgs84(121.465412,31.227952),radio=gcj02ToWgs84(121.407510,31.196612);
export const SIGNAL_FACILITIES=Object.freeze([
 {id:'smg',labelZh:'SMG · 上视内容制作',labelEn:'SMG · CONTENT',type:'culture',facilityKind:'media-content',roleZh:'媒体内容制作与发布场所；不是新建的射频发射塔。',roleEn:'Media content production and publication, not a new radio tower.',address:'上海市静安区威海路298号',...weihai,positionKind:'amap-GCJ02-to-WGS84-approximation',sourceCoordinate:[121.465412,31.227952],sourceCoordinateSystem:'GCJ-02',coordinateAccuracyM:150,sourceUrls:[SIGNAL_SOURCE_URLS.smg,SIGNAL_SOURCE_URLS.weihaiMap]},
 {id:'smg-radio',labelZh:'SMG · 广播大厦',labelEn:'SMG · RADIO HOUSE',type:'culture',facilityKind:'media-content',roleZh:'广播内容制作与运营场所；图中分发关系为情景。',roleEn:'Radio production and operation premises; distribution links are authored.',address:'上海市长宁区虹桥路1376号',...radio,positionKind:'amap-GCJ02-to-WGS84-approximation',sourceCoordinate:[121.407510,31.196612],sourceCoordinateSystem:'GCJ-02',coordinateAccuracyM:150,sourceUrls:[SIGNAL_SOURCE_URLS.smg,SIGNAL_SOURCE_URLS.hongqiaoMap]},
 {id:'shixp',labelZh:'SHIXP · 管局交换节点',labelEn:'SHIXP · HUANGPU',type:'community',facilityKind:'internet-exchange',roleZh:'官方列示的互联网交换核心节点；与临港核心互为备份。',roleEn:'Publicly listed exchange core, paired with the Lingang core.',address:'上海市黄浦区中山南路508号',lon:121.496,lat:31.214,positionKind:'address-area-estimate',coordinateAccuracyM:1000,sourceUrls:[SIGNAL_SOURCE_URLS.shixp]},
 {id:'compute',labelZh:'上海超算 · 张江',labelEn:'SHANGHAI HPC',type:'community',facilityKind:'compute',roleZh:'公共高性能计算与人工智能算力服务；不是向全城直接发射无线电的天线。',roleEn:'Public HPC and AI services, not a citywide radio antenna.',address:'上海市浦东新区郭守敬路585号',lon:121.594,lat:31.210,positionKind:'address-area-estimate',coordinateAccuracyM:1200,sourceUrls:[SIGNAL_SOURCE_URLS.compute,SIGNAL_SOURCE_URLS.computeAddress]},
 {id:'shixp-waigaoqiao',labelZh:'SHIXP · 外高桥华京',labelEn:'SHIXP · WAIGAOQIAO',type:'community',facilityKind:'internet-exchange',roleZh:'官方列示的浦东华京交换节点。',roleEn:'Publicly listed Pudong Huajing exchange node.',address:'上海市浦东新区外高桥华京路6号',lon:121.606,lat:31.335,positionKind:'address-area-estimate',coordinateAccuracyM:1500,sourceUrls:[SIGNAL_SOURCE_URLS.shixp]},
 {id:'shixp-lingang',labelZh:'SHIXP · 临港核心',labelEn:'SHIXP · LINGANG',type:'community',facilityKind:'internet-exchange',roleZh:'官方列示的临港核心交换节点，与管局核心互为备份。',roleEn:'Publicly listed Lingang core paired with the Huangpu core.',address:'上海市浦东新区临港新片区丽正路1512号',lon:121.862,lat:30.973,positionKind:'address-area-estimate',coordinateAccuracyM:1800,sourceUrls:[SIGNAL_SOURCE_URLS.shixp]}
]);

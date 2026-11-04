/** Public roles/addresses are factual; geographic anchors, future rates and routes are not surveyed feeds. */
export const SIGNAL_REFERENCES=Object.freeze({
 exchanges:'https://www.shixp.cn/shixp/knowUs/nodeEstablish',
 approvedCenters:'https://www.sheitc.sh.gov.cn/cyfz/20230516/498b75de6a9d4b7a9dc2bd09783b429b.html',
 infrastructure:'https://www.shanghai.gov.cn/gwk/search/content/8050cb446990454fb932136c0b20ba4d',
 layout:'https://www.shanghai.gov.cn/swyysj/20250610/29fc53f21dff4c92800e6405d522dcdb.html',
 telecom2025:'https://shca.miit.gov.cn/zwgk/xyfz/xytj/art/2026/art_64402c1ad3794c4a92d2cfc524dfd5af.html',
 chongmingCable:'https://www.shcm.gov.cn/xwzx/002003/20250803/9237ecb4-3d51-4895-a338-574614132f43.html',
 fengxianIDC:'https://www.sheitc.sh.gov.cn/cmsres/55/55d60bd0dd2c46a794fd68e97a4c022d/87847a1a34caf63df14c40f7ee61bd5c.pdf'
});
export const SIGNAL_BASELINE=Object.freeze({year:2025,mobileDataBillionGB:7.84,fiveGShare:.719,iotTerminalsMillion:175.825,fiveGBaseStations:116000,sourceUrl:SIGNAL_REFERENCES.telecom2025,scope:'City totals only; not district/hour/building observations.'});
export const SIGNAL_2050_SCENARIO=Object.freeze({mobileDataMultiplier:2.8,machineServiceMultiplier:4.2,capacityMultiplier:5,kind:'ASSUMP',policy:'Bounded authored scenario, not 25-year compounding of a recent growth rate or a forecast. Visual units are relative service load, not Gb/s.'});

// WGS84 address-area estimates, deliberately labelled at kilometre scale. No exact equipment/building positions.
const exchanges=[
 ['baoshan-chuanji','宝山川纪','BAOSHAN CHUANJI','上海市宝山区川纪路500号',121.365,31.340,'industrial',2500],
 ['minhang-pujiang','闵行浦江','MINHANG PUJIANG','上海市闵行区浦江镇浦星路699号',121.508,31.099,'residential',2500],
 ['qingpu-x463','青浦X463区域','QINGPU X463 AREA','上海市青浦区X463（原表未给门牌，位置仅作地区锚点）',121.13,31.15,'industrial',12000],
 ['songjiang-shuhai','松江书海','SONGJIANG SHUHAI','上海市松江区书海路349号',121.327,31.057,'industrial',2500],
 ['baoshan-jiyun','宝山纪蕴','BAOSHAN JIYUN','上海市宝山区纪蕴路588号',121.399,31.363,'industrial',2500],
 ['jing-an-jiangchang','静安江场','JINGAN JIANGCHANG','上海市静安区江场西路387号',121.440,31.295,'business',1800],
 ['jing-an-wanrong','静安万荣','JINGAN WANRONG','上海市静安区万荣路1268号',121.445,31.292,'business',1800],
 ['pudong-ningqiao','浦东宁桥','PUDONG NINGQIAO','上海市浦东新区宁桥路999号',121.616,31.252,'industrial',2200],
 ['xuhui-xietu','徐汇斜土','XUHUI XIETU','上海市徐汇区斜土路2567号',121.438,31.181,'business',1800],
 ['xuhui-yishan','徐汇宜山','XUHUI YISHAN','上海市徐汇区宜山路888号',121.407,31.173,'business',1800],
 ['xuhui-hongcao','徐汇虹漕','XUHUI HONGCAO','上海市徐汇区虹漕路421号',121.408,31.175,'business',1800],
 ['pudong-lianggang','浦东两港','PUDONG LIANGGANG','上海市浦东新区两港大道999号',121.828,30.950,'logistics',5000],
 ['pudong-haiyang','浦东海洋','PUDONG HAIYANG','上海市浦东新区海洋二路88弄',121.90,30.895,'industrial',5000],
 ['pudong-xinling','浦东新灵','PUDONG XINLING','上海市浦东新区新灵路898号',121.58,31.338,'industrial',3500],
 ['pudong-qinqiao','浦东秦桥','PUDONG QINQIAO','上海市浦东新区秦桥路368号',121.613,31.265,'industrial',2500],
 ['minhang-jiangyue','闵行江月','MINHANG JIANGYUE','上海市闵行区江月路999号',121.52,31.076,'residential',2200]
];
const approved=[
 ['jiading-anxiao','嘉定安晓云','JIADING ANXIAO CLOUD','嘉定区安亭镇安晓路128号',121.212,31.295,'industrial',5000,3000],
 ['jinshan-aliyun','阿里飞天云 · 金山','ALIYUN JINSHAN','金山区金山工业区广业路736号',121.317,30.868,'industrial',4000,5000],
 ['songjiang-tencent','腾讯智算 · 松江','TENCENT SONGJIANG','松江区文翔路3999弄（D1-D4）',121.196,31.055,'industrial',3500,6000],
 ['fengxian-yueke','悦科数据 · 奉贤','YUEKE FENGXIAN','奉贤区沪杭公路3111号',121.44,30.91,'industrial',4500,3000],
 ['chongming-cloud','崇明云计算项目','CHONGMING CLOUD PROJECT','崇明区嵊山路699号',121.565,31.672,'ecology',6500,3000]
];
export const SIGNAL_ADDITIONAL_FACILITIES=Object.freeze([
 ...exchanges.map(([id,zh,en,address,lon,lat,serviceProfile,coordinateAccuracyM])=>({id:'shixp-'+id,labelZh:'SHIXP · '+zh,labelEn:'SHIXP · '+en,type:'community',facilityKind:'internet-exchange',address,lon,lat,serviceProfile,coordinateAccuracyM,positionKind:'address-area-estimate',status:'publicly-listed-role-2050-continuation-assumed',roleZh:'SHIXP公开节点表中的交换角色；位置为粗区域锚点，2050运营及连线/流量为情景。',roleEn:'Public SHIXP exchange role; an approximate area anchor, with authored 2050 persistence, links and load.',sourceUrls:[SIGNAL_REFERENCES.exchanges]})),
 ...approved.map(([id,labelZh,labelEn,address,lon,lat,serviceProfile,coordinateAccuracyM,approvedRacks])=>({id,labelZh,labelEn,type:'community',facilityKind:'data-center',address,lon,lat,serviceProfile,coordinateAccuracyM,approvedRacks,positionKind:'address-area-estimate',status:'approved-2023-project-not-current-operating-certification',roleZh:'2023年市经信委批准名单项目；批准规模不等于当前投运规模，2050运行及流量均为情景。',roleEn:'A project in the 2023 municipal approval list, not a certification of present operation. Future operation and traffic are authored.',sourceUrls:[SIGNAL_REFERENCES.approvedCenters]})),
 {id:'fengxian-mobile',labelZh:'上海移动 · 奉贤局房',labelEn:'CMCC · FENGXIAN',type:'community',facilityKind:'data-center',address:'奉贤区南奉公路7258号8楼',lon:121.487,lat:30.922,serviceProfile:'residential',coordinateAccuracyM:2500,positionKind:'address-area-estimate',status:'public-2021-list-2050-continuation-assumed',roleZh:'公开数据中心名单中的奉贤局房；非实际无线发射天线定位。',roleEn:'Publicly listed Fengxian IDC premises, not a surveyed antenna.',sourceUrls:[SIGNAL_REFERENCES.fengxianIDC]},
 {id:'chongming-cable-area',labelZh:'崇明 · 海缆联系区域',labelEn:'CHONGMING · CABLE REGION',type:'community',facilityKind:'international-region',address:'崇明陈家镇近海通信海缆联系区域；不是登陆站精确位置',lon:121.82,lat:31.54,serviceProfile:'ecology',coordinateAccuracyM:12000,positionKind:'public-role-region-estimate',status:'public-cable-role-no-station-geocoding',roleZh:'官方资料证实崇明多条通信海缆与国际联系；此处为海岸区域符号，不代表登陆站设备位置或真实海缆路径。',roleEn:'An offshore regional symbol supported by public cable-role evidence, not an exact landing station or cable route.',sourceUrls:[SIGNAL_REFERENCES.chongmingCable]}
]);

// Geographic display catchments, not administrative polygons or measured district traffic.
export const SIGNAL_SERVICE_REGIONS=Object.freeze([
 ['huangpu','黄浦','HUANGPU',121.48,31.225,'business',1.1],['xuhui','徐汇','XUHUI',121.43,31.17,'business',1],
 ['changning','长宁','CHANGNING',121.38,31.215,'business',.8],['jing-an','静安','JINGAN',121.45,31.27,'business',1.1],
 ['putuo','普陀','PUTUO',121.39,31.26,'residential',.9],['hongkou','虹口','HONGKOU',121.49,31.29,'residential',.7],
 ['yangpu','杨浦','YANGPU',121.54,31.30,'business',1],['minhang','闵行','MINHANG',121.38,31.10,'residential',1.3],
 ['baoshan','宝山','BAOSHAN',121.42,31.40,'industrial',1.2],['jiading','嘉定','JIADING',121.25,31.38,'industrial',1.1],
 ['qingpu','青浦','QINGPU',121.12,31.15,'industrial',1.1],['songjiang','松江','SONGJIANG',121.22,31.04,'industrial',1.2],
 ['jinshan','金山','JINSHAN',121.25,30.83,'industrial',.8],['fengxian','奉贤','FENGXIAN',121.48,30.92,'residential',.85],
 ['pudong','浦东','PUDONG',121.67,31.18,'business',1.7],['lingang','临港','LINGANG',121.87,30.94,'logistics',1.2],
 ['chongming','崇明','CHONGMING',121.57,31.66,'ecology',.55]
].map(([id,labelZh,labelEn,lon,lat,serviceProfile,displayWeight])=>({id,labelZh,labelEn,lon,lat,serviceProfile,displayWeight,sourceUrl:SIGNAL_REFERENCES.infrastructure,positionKind:'authored-service-catchment-centre-not-a-facility'})));

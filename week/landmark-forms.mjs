/** User-approved recognisable metre-space particle landmarks, 2026-11-02.
 * Existing silhouettes are authored simplifications; three future concepts are
 * reference-image designs, not certified real projects. Blue city geometry is retained.
 */
import {HERITAGE_FORM_SPECS,buildHeritageForm} from './landmark-heritage-forms.mjs';
import {MODERN_FORM_SPECS,buildModernForm,revisedTowerSection} from './landmark-modern-forms.mjs';
import {FUTURE_FORM_SPECS,buildFutureForm} from './landmark-future-forms.mjs';
import {buildOrientalPearlForm} from './landmark-oriental-pearl.mjs';
export const LANDMARK_FORM_SPECS=Object.freeze({
 ...HERITAGE_FORM_SPECS,...MODERN_FORM_SPECS,...FUTURE_FORM_SPECS,
 'oriental-pearl':{heightM:468,kind:'three-spheres-and-tripod',evidence:'published-height / authored-component-proportions',reference:'外滩.png',sources:['https://www.opg.cn/cn/index.html','https://english.shanghai.gov.cn/en-ScenicSpots/20231205/19a5f5184eca45728fd57a4d4c8efc61.html']}
});
export const towerSection=revisedTowerSection;
export const LANDMARK_DISPLAY=Object.freeze({nearWorld:180,farWorld:1550,overviewWorld:4500,skylineMid:2.7,skylineMax:10});
// Low-rise motifs need a readable footprint at the bounded city overview, rather
// than the same distance curve as 468/632 m towers. These are display ratios,
// chosen by source-form span. The broad station/opera never become white slabs.
export const LANDMARK_PLACE_DISPLAY=Object.freeze({
 nearWorld:70,farWorld:1150,
 ranges:Object.freeze({
  'grand-opera':[1.65,4.8], 'thousand-trees':[1.8,6.6],
  'jing-an-temple':[2.1,8.8], 'west-bund-dream-center':[1.9,7.8],
  'indoor-botanic':[2.,8.2], 'hongqiao-station':[1.5,2.8],
  'bund':[1.8,5.2], 'people-square':[2.,7.],
  'suzhou-creek':[2.1,8.2], 'yuyuan':[2.2,10.],
  'wukang-road':[2.,8.8], 'yangpu-riverside':[1.9,7.8],
  'dishui-lake':[2.1,6.6], 'cpc-first-congress':[2.2,10.],
  'lane-renewal':[2.2,10.]
 })
});
export function landmarkDisplayNear(id){return LANDMARK_PLACE_DISPLAY.ranges[id]?.[0]??1;}
export function landmarkDisplayMaximum(id){
 if(!LANDMARK_FORM_SPECS[id])return 1;
 if(id==='shanghai-tower'||id==='oriental-pearl')return LANDMARK_DISPLAY.skylineMax;
 return LANDMARK_PLACE_DISPLAY.ranges[id]?.[1]??1;
}
export function landmarkDisplayLocalMaximum(id){return id==='shanghai-tower'||id==='oriental-pearl'?LANDMARK_DISPLAY.skylineMid:landmarkDisplayMaximum(id);}
export function landmarkDisplayScale(id,distanceWorld){
 if(!Number.isFinite(distanceWorld)||distanceWorld<0)throw new TypeError('Landmark display distance must be finite and nonnegative');
 const smooth=(a,b)=>{const t=Math.min(1,Math.max(0,(distanceWorld-a)/(b-a)));return t*t*(3-2*t);};
 const place=LANDMARK_PLACE_DISPLAY.ranges[id];
 if(place){if(distanceWorld<=LANDMARK_PLACE_DISPLAY.nearWorld)return place[0];if(distanceWorld>=LANDMARK_PLACE_DISPLAY.farWorld)return place[1];return place[0]+(place[1]-place[0])*smooth(LANDMARK_PLACE_DISPLAY.nearWorld,LANDMARK_PLACE_DISPLAY.farWorld);}
 const local=landmarkDisplayLocalMaximum(id),overview=landmarkDisplayMaximum(id);
 return 1+(local-1)*smooth(LANDMARK_DISPLAY.nearWorld,LANDMARK_DISPLAY.farWorld)+(overview-local)*smooth(LANDMARK_DISPLAY.farWorld,LANDMARK_DISPLAY.overviewWorld);
}

export function buildLandmarkForm(id){
 if(!LANDMARK_FORM_SPECS[id])return null;
 if(id==='oriental-pearl')return buildOrientalPearlForm(LANDMARK_FORM_SPECS[id]);
 return buildHeritageForm(id)??buildModernForm(id)??buildFutureForm(id);
}

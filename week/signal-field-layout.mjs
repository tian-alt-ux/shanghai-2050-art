import {signalHash} from './signal-demand.mjs';
/** Display samples on actual source vertices, stratified across authored service catchments. */
export function buildSignalField(positions,regions,{maxPoints=110000}={}){
 if(!(positions instanceof Float32Array)||positions.length%3)throw new TypeError('source positions must be float32 xyz');
 if(!regions.length)return {positions:new Float32Array(),classes:new Uint8Array(),anchors:new Uint16Array(),sizes:new Float32Array(),counts:[],meta:{samples:0}};
 const buckets=regions.map(()=>[]),centres=regions.map(r=>[r.x*.02,-r.y*.02]);
 // Source vertices were already sampled uniformly; inspect each third vertex to bound startup cost.
 for(let i=0;i<positions.length;i+=9){const x=positions[i],z=positions[i+2];let nearest=0,best=Infinity;for(let j=0;j<centres.length;j++){const c=centres[j],d=(x-c[0])**2+(z-c[1])**2;if(d<best){best=d;nearest=j;}}buckets[nearest].push(i);}
 const budgetWeight=regions.reduce((sum,r)=>sum+Math.sqrt(r.displayWeight??1),0),points=[],classes=[],anchors=[],sizes=[],counts=[];
 for(let r=0;r<regions.length;r++){
  const bucket=buckets[r],target=Math.min(bucket.length,Math.floor(maxPoints*Math.sqrt(regions[r].displayWeight??1)/budgetWeight)),profile=regions[r].serviceProfile,publicShare=profile==='industrial'?.28:profile==='business'?.37:profile==='logistics'?.32:profile==='ecology'?.40:.56;
  for(let j=0;j<target;j++){const i=bucket[Math.floor(j*bucket.length/target)],key=regions[r].id+':'+i,publicClass=signalHash(key)<publicShare;points.push(positions[i],positions[i+1]+.10,positions[i+2]);classes.push(publicClass?1:0);anchors.push(r);sizes.push(.72+signalHash(key+':size')*1.65);}
  counts.push({id:regions[r].id,sourceCandidates:bucket.length,displaySamples:target});
 }
 return {positions:Float32Array.from(points),classes:Uint8Array.from(classes),anchors:Uint16Array.from(anchors),sizes:Float32Array.from(sizes),counts,meta:{method:'stratified actual source-vertex samples assigned to nearest authored service catchment; not measured device locations or administrative traffic',samples:anchors.length}};
}

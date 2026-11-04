/** Map placement is separate from each recognisable architectural silhouette.
 * The Bund frontage follows the cached west bank rather than crossing the river.
 * Its river-facing apron is the display pivot: readability scaling grows inland.
 */
export const BUND_PLACEMENT=Object.freeze({
 rotationY:Math.PI*2/3,
 sourcePivotM:Object.freeze([0,0,30])
});

export function placeLandmarkForm(id,form){
 if(!form||id!=='bund')return form;
 const {rotationY,sourcePivotM:[px,py,pz]}=BUND_PLACEMENT,c=Math.cos(rotationY),s=Math.sin(rotationY);
 const anchorOffsetM=[c*px+s*pz,py,-s*px+c*pz];
 const positions=new Float32Array(form.positions.length),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<form.positions.length;i+=3){
  const x=form.positions[i]-px,y=form.positions[i+1]-py,z=form.positions[i+2]-pz;
  const p=[c*x+s*z,y,-s*x+c*z];
  for(let k=0;k<3;k++){positions[i+k]=p[k];lo[k]=Math.min(lo[k],positions[i+k]);hi[k]=Math.max(hi[k],positions[i+k]);}
 }
 // Arrive from the river-facing side, rather than looking along the thin row.
 const viewDirection=[s+c*.28,.65,c-s*.28];
 return {...form,positions,boundsM:[lo,hi],anchorOffsetM,viewDirection};
}

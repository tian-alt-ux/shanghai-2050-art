/** Seeded metre-space particles shared by the approved landmark interpretations.
 * All dimensions are authored approximations; bright edges, quiet surfaces and
 * open courtyards preserve recognition without filling the city with white light.
 */
export function createParticleBuilder(id){
 let seed=2166136261;for(const ch of id)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
 const positions=[],brightness=[],sizes=[];
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 function point(x,y,z,b=.34,s=.75){if(![x,y,z,b,s].every(Number.isFinite)||s<=0)throw new TypeError('Invalid landmark particle');positions.push(x,y,z);brightness.push(b*(.88+random()*.18));sizes.push(s*(.9+random()*.2));}
 function stroke(fn,n=60,b=.8,s=.88){for(let i=0;i<=n;i++)point(...fn(i/n),b,s);}
 function line(a,b,strength=.8,size=.86,spacing=.9){stroke(t=>a.map((v,k)=>v+(b[k]-v)*t),Math.max(2,Math.ceil(Math.hypot(...a.map((v,k)=>b[k]-v))/spacing)),strength,size);}
 function polyline(vertices,b=.78,s=.86,spacing=.9,closed=false){for(let i=1;i<vertices.length;i++)line(vertices[i-1],vertices[i],b,s,spacing);if(closed)line(vertices.at(-1),vertices[0],b,s,spacing);}
 function surface(fn,nu=36,nv=18,b=.24,s=.65){for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){if(random()<.04)continue;point(...fn((i+(j%2)*.3)/nu,j/nv),b,s);}}
 function ring(x,y,z,rx,rz,b=.78,s=.84,n=120){stroke(t=>{const a=t*Math.PI*2;return [x+Math.cos(a)*rx,y,z+Math.sin(a)*rz];},n,b,s);}
 function box(x,z,w,d,h,y=0,b=.2){
  for(const sign of [-1,1]){surface((u,v)=>[x+(u-.5)*w,y+v*h,z+sign*d/2],Math.max(8,Math.ceil(w/2.2)),Math.max(4,Math.ceil(h/2.2)),b);surface((u,v)=>[x+sign*w/2,y+v*h,z+(u-.5)*d],Math.max(8,Math.ceil(d/2.2)),Math.max(4,Math.ceil(h/2.2)),b);}
  const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];
  for(const level of [y,y+h])polyline(corners.map(([a,c])=>[x+a,level,z+c]),.64,.8,1,true);
  for(const [a,c] of corners)line([x+a,y,z+c],[x+a,y+h,z+c],.65,.8);
 }
 function cylinder(x,z,r,h,y=0,b=.24,segments=36){surface((u,v)=>[x+Math.cos(u*Math.PI*2)*r,y+v*h,z+Math.sin(u*Math.PI*2)*r],segments,Math.max(5,Math.ceil(h/1.8)),b);ring(x,y,z,r,r,.62);ring(x,y+h,z,r,r,.76);}
 function sphere(x,y,z,r,b=.28,nu=30,nv=18){surface((u,v)=>{const a=u*Math.PI*2,p=v*Math.PI;return [x+Math.cos(a)*Math.sin(p)*r,y+Math.cos(p)*r,z+Math.sin(a)*Math.sin(p)*r];},nu,nv,b);}
 function roof(x,z,w,d,y,rise=7,b=.34){
  const fn=(u,v)=>{const xx=(u-.5)*w,zz=(v-.5)*d,q=Math.max(Math.abs(xx)/(w/2),Math.abs(zz)/(d/2));return [x+xx,y+rise*(1-q)+rise*.2*Math.pow(Math.abs(xx*zz)/(w*d/4),4),z+zz];};
  surface(fn,Math.max(20,Math.ceil(w/1.5)),Math.max(14,Math.ceil(d/1.5)),b,.69);
  for(const v of [0,1])stroke(t=>fn(t,v),Math.ceil(w/.8),.8,.9);
  for(const u of [0,1])stroke(t=>fn(u,t),Math.ceil(d/.8),.8,.9);
  line([x-w*.22,y+rise,z],[x+w*.22,y+rise,z],.78,.88);
 }
 function finish(spec){
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<positions.length;i++){const k=i%3;lo[k]=Math.min(lo[k],positions[i]);hi[k]=Math.max(hi[k],positions[i]);}
  return {positions:new Float32Array(positions),brightness:new Float32Array(brightness),sizes:new Float32Array(sizes),pointCount:brightness.length,boundsM:[lo,hi],spec};
 }
 return {random,point,stroke,line,polyline,surface,ring,box,cylinder,sphere,roof,finish};
}

// Existing Oriental Pearl form retained byte-for-byte in its sampling and geometry.
export function buildOrientalPearlForm(spec){
 const id='oriental-pearl';
 let seed=2166136261;for(const ch of id)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),p=[],power=[],sizes=[];
 function point(x,y,z,brightness=.5,size=.8){if(!Number.isFinite(x+y+z))throw Error('Invalid landmark point');p.push(x,y,z);power.push(brightness*(.83+rnd()*.24));sizes.push(size*(.8+rnd()*.35));}
 function surface(fn,nu,nv,b=.5,size=.8){for(let j=0;j<=nv;j++)for(let i=0;i<nu;i++){if(rnd()<.025)continue;const v=fn((i+(j%2)*.35)/nu,j/nv);point(...v,b,size);}}
 function stroke(fn,n=80,b=.95,size=1.05){for(let i=0;i<=n;i++)point(...fn(i/n),b,size);}
 function cylinder(x,z,r,h,y=0,segments=28){surface((u,v)=>[x+Math.cos(u*Math.PI*2)*r,y+v*h,z+Math.sin(u*Math.PI*2)*r],segments,Math.max(5,Math.ceil(h/2)),.43);}
 function sphere(x,y,z,r,nu=42,nv=26,b=.55){surface((u,v)=>{const a=u*Math.PI*2,t=v*Math.PI;return[x+Math.cos(a)*Math.sin(t)*r,y+Math.cos(t)*r,z+Math.sin(a)*Math.sin(t)*r];},nu,nv,b);}
 function facade(x,z,w,d,h,y=0,b=.43){const nu=Math.max(12,Math.ceil((w+d)/3)),nv=Math.max(4,Math.ceil(h/2));surface((u,v)=>{let xx,zz;if(u<.25){xx=(u*4-.5)*w;zz=-d/2;}else if(u<.5){xx=w/2;zz=((u-.25)*4-.5)*d;}else if(u<.75){xx=(.5-(u-.5)*4)*w;zz=d/2;}else{xx=-w/2;zz=(.5-(u-.75)*4)*d;}return[x+xx,y+v*h,z+zz];},nu,nv,b);}
 function pitched(x,z,w,d,h,rise=7,baseY=0){facade(x,z,w*.84,d*.84,Math.max(1,h-baseY),baseY);surface((u,v)=>{const xx=(u-.5)*w,zz=(v-.5)*d,q=Math.max(Math.abs(xx)/(w*.5),Math.abs(zz)/(d*.5));return[x+xx,h+rise*(1-q)+rise*.16*Math.pow(Math.abs(xx*zz)/(w*d*.25),5),z+zz];},Math.max(20,Math.ceil(w/1.4)),Math.max(12,Math.ceil(d/1.4)),.64);}
 function crane(x,z,h=38){for(const sign of [-1,1])stroke(t=>[x+sign*(15-8*t),h*t,z],60,.6,.9);stroke(t=>[x-30+60*t,h,z],90,.85,1);stroke(t=>[x+27,h-25*t,z],40,.65,.8);stroke(t=>[x-15+30*t,h*.65,z],45,.65,.8);}
 function shed(x,z,w,d,h){pitched(x,z,w,d,h,5);for(let j=-1;j<=1;j++)stroke(t=>[x+(t-.5)*w,h*.7,z+j*d/3],Math.ceil(w/2),.65,.85);}

 switch(id){
  case 'oriental-pearl':
   for(let k=0;k<3;k++){const a=k*Math.PI*2/3;cylinder(Math.cos(a)*7,Math.sin(a)*7,3.8,298,22,18);surface((u,v)=>{const r=28*(1-v)+8*v,a2=a+u*Math.PI*2;return[Math.cos(a)*r+Math.cos(a2)*4,85*v,Math.sin(a)*r+Math.sin(a2)*4];},18,45,.48,.82);}
   sphere(0,100,0,25,56,35,.50);sphere(0,276,0,22.5,56,34,.58);sphere(0,350,0,8,36,22,.7);cylinder(0,0,2.2,118,350,18);break;

 }
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<p.length;i++) {const axis=i%3;lo[axis]=Math.min(lo[axis],p[i]);hi[axis]=Math.max(hi[axis],p[i]);}
 return {positions:new Float32Array(p),brightness:new Float32Array(power),sizes:new Float32Array(sizes),boundsM:[lo,hi],spec,pointCount:power.length};
}

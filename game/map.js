// EMBERLINE relay station, metres. North is -Z. Three lanes and two cross-streets.
export const SITES=[{id:'A',name:'TIDAL ARRAY',x:-17,z:-15,r:4.2},{id:'B',name:'UPLINK YARD',x:17,z:-15,r:4.2}];
export const BOXES=[
 {x:-8,z:10,w:10,d:17,h:6.6,kind:'plaster'},
 {x:8,z:10,w:10,d:17,h:5.4,kind:'blue'},
 {x:-8,z:-10,w:10,d:13,h:7.4,kind:'blue'},
 {x:8,z:-10,w:10,d:13,h:6.4,kind:'plaster'},
 {x:0,z:-25,w:11,d:4,h:4.5,kind:'station'},
 {x:-20,z:3,w:3.4,d:3.4,h:1.4,kind:'crate'},
 {x:20,z:7,w:3.2,d:4,h:2.2,kind:'crate'},
 {x:-14.5,z:-9,w:2.5,d:2.5,h:1.2,kind:'crate'},
 {x:20,z:-19,w:3,d:3,h:2.4,kind:'crate'},
 {x:-20.5,z:-20,w:3,d:2,h:1.2,kind:'crate'},
 {x:1,z:0,w:2,d:3,h:1.25,kind:'crate'},
 {x:-17,z:16,w:3,d:1.7,h:1.25,kind:'crate'},
 {x:17,z:18,w:2.8,d:2,h:1.25,kind:'crate'},
 {x:-25,z:0,w:2,d:62,h:1.15,kind:'wall'},
 {x:25,z:0,w:2,d:62,h:3.2,kind:'wall'},
 {x:0,z:31,w:52,d:2,h:3.2,kind:'wall'},
 {x:0,z:-31,w:52,d:2,h:3.2,kind:'wall'}
];
export function blocked(x,z,r=.36,y=0){
 for(const b of BOXES)if(y<b.h&&Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)return true;
 return false;
}
// Slab intersection, shared by hitscan, sight and blast cover.
export function rayBox(ox,oy,oz,dx,dy,dz,b,max=200){
 let lo=0,hi=max;
 for(let axis=0;axis<3;axis++){
  const o=axis===0?ox:axis===1?oy:oz,d=axis===0?dx:axis===1?dy:dz;
  const c=axis===0?b.x:axis===1?b.h/2:b.z,e=axis===0?b.w/2:axis===1?b.h/2:b.d/2;
  if(Math.abs(d)<1e-8){if(o<c-e||o>c+e)return Infinity;continue;}
  let a=(c-e-o)/d,v=(c+e-o)/d;if(a>v){const t=a;a=v;v=t;}lo=Math.max(lo,a);hi=Math.min(hi,v);if(hi<lo)return Infinity;
 }return lo;
}
export function wallDistance(ox,oy,oz,dx,dy,dz,max=200){let near=max;for(const b of BOXES)near=Math.min(near,rayBox(ox,oy,oz,dx,dy,dz,b,near));return near;}
export function visible(a,b){const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);return wallDistance(a.x,1.45,a.z,dx/d,0,dz/d,d)>=d-.05;}
// Deterministic navigation grid: 2m cells, clearance expanded by actor radius.
const STEP=2,W=25,H=31,N=W*H,free=new Uint8Array(N);
for(let z=0;z<H;z++)for(let x=0;x<W;x++)free[z*W+x]=!blocked(x*STEP-24,z*STEP-30,.53);
const cell=(x,z)=>Math.max(0,Math.min(H-1,Math.round((z+30)/STEP)))*W+Math.max(0,Math.min(W-1,Math.round((x+24)/STEP)));
export function route(sx,sz,tx,tz){
 const start=cell(sx,sz),target=cell(tx,tz),prev=new Int16Array(N).fill(-1),queue=new Int16Array(N);let head=0,tail=1;queue[0]=start;prev[start]=start;
 while(head<tail){const i=queue[head++];if(i===target)break;for(const o of [-1,1,-W,W]){const j=i+o;if(j<0||j>=N||!free[j]||prev[j]>=0||(Math.abs(o)===1&&Math.floor(j/W)!==Math.floor(i/W)))continue;prev[j]=i;queue[tail++]=j;}}
 if(prev[target]<0)return[];const path=[];for(let i=target;i!==start;i=prev[i])path.push({x:(i%W)*STEP-24,z:Math.floor(i/W)*STEP-30});return path.reverse();
}

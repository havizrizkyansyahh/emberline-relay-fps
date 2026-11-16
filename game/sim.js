// Pure, fixed-step authoritative simulation. No DOM, renderer or network.
import {blocked,wallDistance,SITES} from './map.js';
import {WEAPONS,ITEMS,eye} from './constants.js';
import {updateBot} from './bots.js';
export class Simulation {
 constructor(seed=731,difficulty='standard',options={}) {
  this.options=options;this.contacts={attack:null,defend:null};
  this.seed=seed>>>0;this.difficulty=difficulty;this.score={attack:0,defend:0};this.round=0;
  this.time=0;this.events=[];this.killfeed=[];this.actors=[];this.grenades=[];this.tracers=[];
  this.player={id:0,name:'YOU',team:'attack',money:2400};this.actors.push(this.player);
  this.newRound();
 }
 newRound(){
  this.round++;this.phase='buy';this.timer=12;this.reason='';this.winner=null;
  this.rng=(this.seed+this.round*1009)>>>0;
  Object.assign(this.player,{x:0,z:25,y:0,vx:0,vz:0,vy:0,yaw:0,pitch:0,hp:100,armor:0,alive:true,crouch:false,interact:0});
  this.equipRound(this.player);
  if(this.options.bots!==false){
   const names=['','MICA','SOL','BRASS','ROOK','FLINT'];
   this.actors.length=1;
   for(let id=1;id<=5;id++){
    const attack=id<3,site=id===1||id===3?0:1;
    const a={id,name:names[id],team:attack?'attack':'defend',money:2400,x:attack?(id===1?-17:17):(id===4?0:SITES[site].x),z:attack?25:(id===4?-21:-24),y:0,vx:0,vz:0,vy:0,yaw:attack?0:Math.PI,pitch:0,hp:100,armor:attack?45:65,alive:true,crouch:false,interact:0,site,think:.15+id*.025,repath:0,reaction:.6,trigger:0,lastSeen:-100,target:null,path:[],task:'DEPLOY',steering:{forward:0,walk:true},goal:{x:0,z:0}};
    this.equipRound(a);a.weapon='rifle';a.inventory.rifle={ammo:30,reserve:90};this.actors.push(a);
   }
  }
  this.contacts.attack=null;this.contacts.defend=null;
  this.bomb={state:'carried',carrier:0,x:0,z:25,timer:35,progress:0,site:null};
  this.grenades.length=0;this.tracers.length=0;
 }
 random(){let t=this.rng+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
 emit(type,data={}){this.events.push({type,time:this.time,...data});if(this.events.length>160)this.events.shift();}
 endRound(team,reason){
  if(this.phase==='debrief'||this.phase==='finished')return;
  this.score[team]++;this.winner=team;this.reason=reason;this.phase=this.score[team]>=3?'finished':'debrief';this.timer=6;
  for(const a of this.actors)a.money=Math.min(9000,(a.money||0)+(a.team===team?2700:1900));
  this.emit('round',{team,reason});
 }
 buy(id){
  const a=this.player,item=ITEMS.find(i=>i.id===id);
  if(this.phase!=='buy'||!item||a.money<item.price||a.inventory[id]||(id==='armor'&&a.armor>=100)||(id==='frag'&&a.frags>=2))return false;
  a.money-=item.price;
  if(id==='armor')a.armor=100;else if(id==='frag')a.frags++;else{const w=WEAPONS[id];a.inventory[id]={ammo:w.mag,reserve:w.reserve};a.weapon=id;a.reloadLeft=0;}
  this.emit('buy',{id});return true;
 }
 switchWeapon(id){const a=this.player;if(!a.inventory[id]||a.reloadLeft>0)return false;a.weapon=id;a.cooldown=.15;return true;}
 equipRound(a){
  a.inventory={pistol:{ammo:12,reserve:36}};a.weapon='pistol';a.cooldown=0;a.reloadLeft=0;a.recoil=0;a.frags=1;
 }
 cast(shooter,ox,oy,oz,dx,dy,dz){
  let dist=wallDistance(ox,oy,oz,dx,dy,dz,110),actor=null,part='wall';
  for(const a of this.actors){
   if(!a.alive||a===shooter||a.team===shooter.team)continue;
   const head=a.y+(a.crouch?1.04:1.59),body=a.y+(a.crouch?.54:.86);
   for(let i=0;i<2;i++){
    const cy=i?head:body,rx=i?.235:.34,ry=i?.235:(a.crouch?.39:.55);
    const x=(ox-a.x)/rx,y=(oy-cy)/ry,z=(oz-a.z)/rx;
    const u=dx/rx,v=dy/ry,w=dz/rx,A=u*u+v*v+w*w,B=2*(x*u+y*v+z*w),C=x*x+y*y+z*z-1,D=B*B-4*A*C;
    if(D<0)continue;const t=(-B-Math.sqrt(D))/(2*A);
    if(t>0&&t<dist){dist=t;actor=a;part=i?'head':'body';}
   }
  }return {actor,part,dist,x:ox+dx*dist,y:oy+dy*dist,z:oz+dz*dist};
 }
 hit(a,damage,source,part='body'){
  if(!a.alive)return;
  let dmg=damage*(part==='head'?3.7:1);
  if(a.armor>0&&part!=='head'){const absorb=Math.min(a.armor,dmg*.55);a.armor-=absorb;dmg-=absorb;}
  a.hp=Math.max(0,a.hp-dmg);this.emit('hit',{target:a.id,source:source?.id,part,damage:dmg,x:a.x,z:a.z});
  if(a.hp<=0){
   a.alive=false;a.deathTime=this.time;a.interact=0;if(this.bomb.user===a.id){this.bomb.progress=0;this.bomb.user=null;}if(source&&source.team!==a.team)source.money=Math.min(9000,(source.money||0)+300);
   this.killfeed.unshift({source:source?.name||'FRAG',target:a.name,head:part==='head',time:this.time});this.killfeed.length=Math.min(5,this.killfeed.length);
   this.emit('kill',{target:a.id,source:source?.id,part});
   if(this.bomb.carrier===a.id&&this.bomb.state==='carried'){this.bomb.state='dropped';this.bomb.x=a.x;this.bomb.z=a.z;this.bomb.carrier=null;}
  }
 }
 fire(a){
  if(this.phase!=='live'||!a.alive||a.cooldown>0||a.reloadLeft>0)return false;
  const w=WEAPONS[a.weapon],inv=a.inventory[a.weapon];if(!inv||inv.ammo<=0)return false;
  inv.ammo--;a.cooldown=w.rate;
  const motion=Math.hypot(a.vx,a.vz),spread=w.spread*(a.crouch?.55:1)+motion*.007+a.recoil*.3+(a.y>0?.09:0);
  const yaw=a.yaw+(this.random()-.5)*spread*2,pitch=a.pitch+a.recoil*.45+(this.random()-.5)*spread*2;
  const dx=-Math.sin(yaw)*Math.cos(pitch),dy=Math.sin(pitch),dz=-Math.cos(yaw)*Math.cos(pitch);
  const hit=this.cast(a,a.x,eye(a),a.z,dx,dy,dz);
  if(hit.actor)this.hit(hit.actor,w.damage,a,hit.part);
  a.recoil=Math.min(.13,a.recoil+w.recoil);
  this.tracers.push({ox:a.x,oy:eye(a),oz:a.z,x:hit.x,y:hit.y,z:hit.z,life:.13,team:a.team,shooter:a.id,part:hit.part});
  const enemyTeam=a.team==='attack'?'defend':'attack';
  if(this.actors.some(e=>e.alive&&e.team===enemyTeam&&Math.hypot(e.x-a.x,e.z-a.z)<42))this.contacts[enemyTeam]={x:a.x,z:a.z,time:this.time,heard:true};
  this.emit('shot',{actor:a.id,weapon:a.weapon,x:a.x,z:a.z,hit:hit.actor?.id,ex:hit.x,ey:hit.y,ez:hit.z,part:hit.part});return true;
 }
 reload(a=this.player){
  const inv=a.inventory[a.weapon],w=WEAPONS[a.weapon];
  if(!a.alive||a.reloadLeft>0||inv.ammo===w.mag||inv.reserve<=0)return false;
  a.reloadLeft=w.reload;this.emit('reload',{actor:a.id});return true;
 }
 weaponsTick(a,dt){
  a.cooldown=Math.max(0,(a.cooldown||0)-dt);a.recoil=Math.max(0,(a.recoil||0)-dt*.12);
  if(a.reloadLeft>0){a.reloadLeft-=dt;if(a.reloadLeft<=0){const inv=a.inventory[a.weapon],w=WEAPONS[a.weapon],n=Math.min(w.mag-inv.ammo,inv.reserve);inv.ammo+=n;inv.reserve-=n;this.emit('loaded',{actor:a.id});}}
 }
 interact(a,dt,held){
  const b=this.bomb;
  if(!a.alive||this.phase!=='live')return;
  if(b.state==='dropped'&&a.team==='attack'&&Math.hypot(a.x-b.x,a.z-b.z)<1.5){b.state='carried';b.carrier=a.id;this.emit('pickup',{actor:a.id});}
  const site=SITES.find(s=>Math.hypot(a.x-s.x,a.z-s.z)<s.r);
  const plant=b.state==='carried'&&b.carrier===a.id&&site;
  const defuse=b.state==='planted'&&a.team==='defend'&&Math.hypot(a.x-b.x,a.z-b.z)<2;
  if(held&&(plant||defuse)&&Math.hypot(a.vx||0,a.vz||0)<.8){
   a.interact=(a.interact||0)+dt;b.progress=a.interact/(plant?3.2:5);b.user=a.id;
   if(b.progress>=1){
    if(plant){Object.assign(b,{state:'planted',carrier:null,x:site.x,z:site.z,site:site.id,timer:35,progress:0,user:null});a.money=Math.min(9000,a.money+300);this.emit('plant',{site:site.id});}
    else{b.state='defused';this.emit('defuse');this.endRound('defend','Relay isolated');}
    a.interact=0;
   }
  }else{a.interact=0;if(b.user===a.id){b.progress=0;b.user=null;}}
 }
 resolveElimination(){
  if(this.phase!=='live'||!this.actors.some(a=>a.team==='defend'))return;
  if(!this.actors.some(a=>a.team==='defend'&&a.alive))this.endRound('attack','Defense eliminated');
  else if(!this.actors.some(a=>a.team==='attack'&&a.alive)&&this.bomb.state!=='planted')this.endRound('defend','Attack eliminated');
 }
 throwGrenade(a=this.player){
  if(!a.alive||this.phase!=='live'||a.frags<=0)return false;
  a.frags--;const yaw=a.yaw,pitch=a.pitch+.18;
  this.grenades.push({x:a.x,y:eye(a),z:a.z,vx:-Math.sin(yaw)*Math.cos(pitch)*11,vy:Math.sin(pitch)*11+3.5,vz:-Math.cos(yaw)*Math.cos(pitch)*11,fuse:2.4,owner:a.id});this.emit('throw',{actor:a.id});return true;
 }
 explode(g){
  const source=this.actors.find(a=>a.id===g.owner);
  for(const a of this.actors){if(!a.alive)continue;const dx=a.x-g.x,dy=a.y+.9-g.y,dz=a.z-g.z,d=Math.hypot(dx,dy,dz);if(d>8)continue;
   const cover=wallDistance(g.x,g.y,g.z,dx/d,dy/d,dz/d,d)<d-.1;
   this.hit(a,Math.max(0,120*(1-d/8))*(cover?.13:1),source,'blast');
  }this.emit('blast',{x:g.x,y:g.y,z:g.z});
 }
 grenadesTick(dt){
  for(let i=this.grenades.length-1;i>=0;i--){const g=this.grenades[i];g.vy-=12*dt;
   const nx=g.x+g.vx*dt,nz=g.z+g.vz*dt;
   if(blocked(nx,g.z,.12,g.y)){g.vx*=-.45;}else g.x=nx;
   if(blocked(g.x,nz,.12,g.y)){g.vz*=-.45;}else g.z=nz;
   g.y+=g.vy*dt;if(g.y<.12){g.y=.12;g.vy=Math.abs(g.vy)*.38;g.vx*=.79;g.vz*=.79;}
   if((g.fuse-=dt)<=0){this.explode(g);this.grenades.splice(i,1);}
  }
 }
 move(a,dt,input){
  a.crouch=!!input.crouch;
  const f=input.forward||0,r=input.right||0,len=Math.max(1,Math.hypot(f,r));
  const speed=a.crouch?2.15:input.walk?2.7:5.25;
  const tx=(r*Math.cos(a.yaw)-f*Math.sin(a.yaw))*speed/len;
  const tz=(-r*Math.sin(a.yaw)-f*Math.cos(a.yaw))*speed/len;
  const blend=Math.min(1,dt*(f||r?12:16));a.vx+=(tx-a.vx)*blend;a.vz+=(tz-a.vz)*blend;
  if(input.jump&&a.y===0)a.vy=5.6;
  a.vy-=16*dt;a.y=Math.max(0,a.y+a.vy*dt);if(a.y===0)a.vy=0;
  const nx=a.x+a.vx*dt,nz=a.z+a.vz*dt;
  if(!blocked(nx,a.z,.36,a.y))a.x=nx;else a.vx=0;
  if(!blocked(a.x,nz,.36,a.y))a.z=nz;else a.vz=0;
 }
 step(dt,input={}){
  this.time+=dt;
  if(this.phase==='live'){
   for(const a of this.actors)if(a.alive&&a.inventory)this.weaponsTick(a,dt);
   if(this.player.alive){this.move(this.player,dt,input);if(input.fire)this.fire(this.player);if(input.reload)this.reload(this.player);this.interact(this.player,dt,input.interact);}
   for(const a of this.actors)if(a.id!==0&&a.alive&&a.inventory)updateBot(this,a,dt);
   this.grenadesTick(dt);
   if(this.bomb.state==='planted'){this.bomb.timer-=dt;if(this.bomb.timer<=0){this.bomb.state='detonated';this.emit('transmit');this.endRound('attack','Relay transmitted');}}
   this.resolveElimination();
   for(let i=this.tracers.length-1;i>=0;i--)if((this.tracers[i].life-=dt)<=0)this.tracers.splice(i,1);
  }
  if(this.phase==='finished')return;
  this.timer-=dt;
  if(this.phase==='buy'&&this.timer<=0){this.phase='live';this.timer=90;this.emit('live');}
  else if(this.phase==='debrief'&&this.timer<=0)this.newRound();
  else if(this.phase==='live'&&this.timer<=0&&this.bomb.state!=='planted')this.endRound('defend','Time expired');
 }
}

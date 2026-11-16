import {route,visible,SITES} from './map.js';
import {eye} from './constants.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Each bot has a local memory; shared team contacts expire in four seconds.
// No position is read through a wall to aim or shoot. Noise reveals only a last-known location.
export function updateBot(s,a,dt){
 const steering=a.steering;steering.forward=0;
 a.think-=dt;a.repath-=dt;a.reaction=Math.max(0,a.reaction-dt);a.trigger=Math.max(0,a.trigger-dt);
 if(a.think<=0){
  a.think=.18+s.random()*.15;let nearest=Infinity,seen=null;
  const sight=s.difficulty==='casual'?28:32;
  for(const e of s.actors){if(!e.alive||e.team===a.team)continue;const d=Math.hypot(a.x-e.x,a.z-e.z);
   if(d<sight&&d<nearest&&visible(a,e)){seen=e;nearest=d;}
  }
  if(seen){if(a.target!==seen.id)a.reaction=(s.difficulty==='casual'?.68:.36)+s.random()*.24;
   a.target=seen.id;a.lastSeen=s.time;s.contacts[a.team]={x:seen.x,z:seen.z,time:s.time};
  }else if(s.time-a.lastSeen>1.1)a.target=null;
 }
 const enemy=s.actors.find(e=>e.id===a.target&&e.alive);
 let fighting=false;
 if(enemy&&visible(a,enemy)&&Math.hypot(a.x-enemy.x,a.z-enemy.z)<37){
  fighting=true;a.task='CONTACT';const dx=enemy.x-a.x,dz=enemy.z-a.z,dist=Math.hypot(dx,dz);
  a.yaw=Math.atan2(-dx,-dz);
  a.pitch=Math.atan2((eye(enemy)-.37)-eye(a),dist);
  a.vx*=Math.max(0,1-dt*15);a.vz*=Math.max(0,1-dt*15);
  if(a.reaction<=0&&a.trigger<=0){
   const err=(s.difficulty==='casual'?.085:.045);a.yaw+=(s.random()-.5)*err*2;a.pitch+=(s.random()-.5)*err;
   if(s.fire(a))a.trigger=.12+s.random()*.18;
  }
 }
 if(a.inventory[a.weapon].ammo===0)s.reload(a);
 const bomb=s.bomb;
 let goal=SITES[a.site],mustInteract=false;
 if(a.team==='attack'){
  if(bomb.state==='dropped'){goal=bomb;a.task='RECOVER';}
  else if(bomb.state==='carried'&&bomb.carrier===a.id){goal=SITES[a.site];a.task='DELIVER';mustInteract=Math.hypot(a.x-goal.x,a.z-goal.z)<3.4;}
  else if(bomb.state==='planted'){goal=a.goal;goal.x=bomb.x+(a.id===1?3:-3);goal.z=bomb.z+5;a.task='HOLD RELAY';}
  else a.task=fighting?'CONTACT':'TAKE SITE';
 }else{
  if(bomb.state==='planted'){goal=bomb;a.task='ISOLATE';mustInteract=Math.hypot(a.x-bomb.x,a.z-bomb.z)<1.85;}
  else{
   const contact=s.contacts.defend;
   if(contact&&s.time-contact.time<4&&a.id===4){goal=contact;a.task='ROTATE';}
   else{goal=a.goal;goal.x=SITES[a.site].x+(a.id%2?1:-1)*1.8;goal.z=SITES[a.site].z+Math.sin(s.time*.12+a.id)*3;a.task='GUARD';}
  }
 }
 if(mustInteract){s.move(a,dt,steering);s.interact(a,dt,true);return;}
 s.interact(a,dt,false);
 if(fighting)return;
 if(a.repath<=0||!a.path){a.path=route(a.x,a.z,goal.x,goal.z);a.repath=1.2+s.random()*.6;}
 let waypoint=a.path?.[0]||goal;
 if(Math.hypot(a.x-waypoint.x,a.z-waypoint.z)<.45){a.path.shift();waypoint=a.path[0]||goal;}
 const dx=waypoint.x-a.x,dz=waypoint.z-a.z,d=Math.hypot(dx,dz);
 if(d>.35){a.yaw=Math.atan2(-dx,-dz);a.pitch=0;steering.forward=1;}s.move(a,dt,steering);
 // A bot that loses a path because it was pushed against cover requests a fresh route.
 if(Math.hypot(a.vx,a.vz)<.1&&d>1)a.repath=0;
 a.pitch=clamp(a.pitch,-1.3,1.3);
}

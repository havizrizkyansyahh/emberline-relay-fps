import test from 'node:test';import assert from 'node:assert/strict';import {Simulation} from '../game/sim.js';import {blocked,route} from '../game/map.js';
test('every spawn is collision-free and has a route to each relay',()=>{
 const s=new Simulation();for(const a of s.actors){assert.equal(blocked(a.x,a.z),false,`${a.name} spawn is solid`);for(const x of [-17,17])assert.ok(route(a.x,a.z,x,-15).length>0);}
});
test('nearby hostile shots produce expiring last-known team contact without wall vision',()=>{
 const s=new Simulation();s.phase='live';const p=s.player;p.x=-17;p.z=15;
 const d=s.actors[3];d.x=-17;d.z=-22;p.yaw=0;s.fire(p);
 assert.ok(s.contacts.defend);assert.equal(s.contacts.defend.z,15);assert.equal(d.target,null);
});

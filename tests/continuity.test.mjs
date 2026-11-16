import test from 'node:test';import assert from 'node:assert/strict';import {Simulation} from '../game/sim.js';
const run=(s,n)=>{for(let i=0;i<n;i++)s.step(1/60,{});};
test('surviving ally recovers the player relay and actually arms it',()=>{
 const s=new Simulation(73);s.phase='live';const a=s.actors[1];s.player.alive=false;s.actors=[s.player,a];a.x=-17;a.z=-15;a.vx=a.vz=0;s.bomb={state:'dropped',carrier:null,x:-17,z:-15,timer:35,progress:0,site:null};
 run(s,240);assert.equal(s.bomb.state,'planted');assert.equal(s.bomb.site,'A');assert.ok(s.events.some(e=>e.type==='pickup'));
});
test('defender bot isolates an armed relay through a five-second interaction',()=>{
 const s=new Simulation(74);s.phase='live';const d=s.actors[5];s.actors=[d];d.x=17;d.z=-15;d.vx=d.vz=0;s.bomb={state:'planted',carrier:null,x:17,z:-15,timer:35,progress:0,site:'B'};
 run(s,330);assert.equal(s.winner,'defend');assert.equal(s.reason,'Relay isolated');
});
test('frag self-kills do not create a cash reward',()=>{
 const s=new Simulation(73,'standard',{bots:false});s.phase='live';const p=s.player,money=p.money;s.hit(p,500,p,'blast');assert.equal(p.alive,false);assert.equal(p.money,money);
});

import test from 'node:test';import assert from 'node:assert/strict';import {Simulation} from '../game/sim.js';
const advance=(s,n,input={})=>{for(let i=0;i<Math.ceil(n*60);i++)s.step(1/60,input);};
test('held plant cancels on release then arms relay and wins at detonation',()=>{
 const s=new Simulation(731,'standard',{bots:false});s.phase='live';const p=s.player;p.x=-17;p.z=-15;
 advance(s,1.2,{interact:true});assert.ok(s.bomb.progress>0);advance(s,.1);assert.equal(s.bomb.progress,0);
 advance(s,3.3,{interact:true});assert.equal(s.bomb.state,'planted');assert.equal(s.bomb.site,'A');
 advance(s,35.2);assert.equal(s.winner,'attack');assert.equal(s.reason,'Relay transmitted');
});
test('death cancels a held objective interaction and drops the relay',()=>{
 const s=new Simulation(7,'standard',{bots:false});s.phase='live';s.player.x=-17;s.player.z=-15;advance(s,1,{interact:true});assert.ok(s.bomb.progress>0);s.hit(s.player,500,null,'body');assert.equal(s.bomb.state,'dropped');assert.equal(s.bomb.progress,0);assert.equal(s.bomb.user,null);assert.equal(s.player.interact,0);
});
test('defender must hold defuse and planted relay survives attacker elimination',()=>{
 const s=new Simulation(731,'standard',{bots:false});s.phase='live';s.bomb={state:'planted',carrier:null,x:17,z:-15,timer:35,progress:0,site:'B'};
 s.player.alive=false;s.resolveElimination();assert.equal(s.phase,'live');
 const d={id:7,name:'Defuser',team:'defend',alive:true,x:17,z:-15,vx:0,vz:0,interact:0};s.actors.push(d);
 for(let i=0;i<310;i++)s.interact(d,1/60,true);
 assert.equal(s.winner,'defend');assert.equal(s.reason,'Relay isolated');
});
test('frag follows an arc, detonates after fuse, and solid cover reduces damage',()=>{
 const s=new Simulation(731,'standard',{bots:false});s.phase='live';s.player.x=0;s.player.z=25;
 assert.equal(s.throwGrenade(s.player),true);assert.equal(s.player.frags,0);assert.equal(s.grenades.length,1);
 advance(s,.3);assert.ok(s.grenades[0].y>1.65);advance(s,2.4);assert.equal(s.grenades.length,0);assert.ok(s.events.some(e=>e.type==='blast'));
 const open={id:7,team:'defend',alive:true,hp:100,armor:0,x:-17,z:10,y:0},covered={id:8,team:'defend',alive:true,hp:100,armor:0,x:-8,z:10,y:0};
 s.actors.push(open,covered);s.explode({x:-14,y:1,z:10,owner:0});assert.ok(open.hp<100);assert.ok(covered.hp>open.hp);
});

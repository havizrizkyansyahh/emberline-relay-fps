import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../game/sim.js';
const target=(s,x=0,z=15)=>{const a={id:9,name:'TEST',team:'defend',x,z,y:0,hp:100,armor:0,alive:true,crouch:false};s.actors.push(a);return a;};
test('body hit, stronger headshot and wall occlusion use actual ray geometry',()=>{
 const s=new Simulation(731,'standard',{bots:false});s.phase='live';const p=s.player,a=target(s);
 assert.equal(s.cast(p,0,1.05,25,0,0,-1).part,'body');
 s.hit(a,25,p,'body');assert.equal(a.hp,75);
 a.hp=100;s.hit(a,25,p,'head');assert.ok(a.hp<=10);
 p.x=-8;const b=target(s,-8,-20);
 assert.equal(s.cast(p,-8,1.6,25,0,0,-1).actor,null);assert.equal(b.hp,100);
});
test('counter-recoil aim and visible camera pitch agree with the hitscan ray',()=>{
 const s=new Simulation(9,'standard',{bots:false});s.phase='live';const a=target(s);s.player.pitch=-.045;s.player.recoil=.1;s.random=()=>.5;s.fire(s.player);assert.equal(a.alive,false);assert.equal(s.killfeed[0].head,true);
});
test('weapon consumes ammunition, cannot fire empty, reload transfers finite reserves',()=>{
 const s=new Simulation(731,'standard',{bots:false});s.phase='live';const p=s.player;p.yaw=Math.PI/2;
 assert.ok(s.fire(p));assert.equal(p.inventory.pistol.ammo,11);
 p.cooldown=0;p.inventory.pistol.ammo=0;assert.equal(s.fire(p),false);
 assert.ok(s.reload(p));assert.equal(s.fire(p),false);
 for(let i=0;i<120;i++)s.step(1/60,{});
 assert.equal(p.inventory.pistol.ammo,12);assert.equal(p.inventory.pistol.reserve,24);
 p.inventory.pistol.reserve=0;p.inventory.pistol.ammo=0;assert.equal(s.reload(p),false);
});

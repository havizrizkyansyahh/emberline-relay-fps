import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../game/sim.js';
const tick=(s,n,input)=>{for(let i=0;i<n;i++)s.step(1/60,input);};
test('movement accelerates, stops, crouches, jumps and cannot cross solid building',()=>{
 const s=new Simulation(731,'standard',{bots:false});s.phase='live';const p=s.player;
 tick(s,1,{forward:1});assert.ok(p.vz<0);assert.ok(p.vz>-5);
 tick(s,60,{forward:1});assert.ok(p.z<21);
 tick(s,45,{});assert.ok(Math.abs(p.vz)<.01);
 p.x=-8;p.z=21;tick(s,180,{forward:1});assert.ok(p.z>=18.8);
 p.x=0;p.z=25;tick(s,40,{forward:1,crouch:true});assert.ok(Math.abs(p.vz)<2.6);assert.equal(p.crouch,true);
 tick(s,1,{jump:true});assert.ok(p.y>0);tick(s,100,{});assert.equal(p.y,0);
});

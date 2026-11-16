import test from 'node:test';import assert from 'node:assert/strict';import {Simulation} from '../game/sim.js';
test('casual defenders do not snipe across the entire station before the encounter range',()=>{
 const s=new Simulation(91,'casual');s.phase='live';const d=s.actors[3];s.actors=[s.player,d];s.player.x=-17;s.player.z=18;d.x=-17;d.z=-16;d.yaw=Math.PI;
 for(let i=0;i<30;i++)s.step(1/60,{});assert.equal(d.target,null);
 s.player.z=8;for(let i=0;i<25;i++)s.step(1/60,{});assert.equal(d.target,0);
});

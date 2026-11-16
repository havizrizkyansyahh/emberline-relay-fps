import test from 'node:test';import assert from 'node:assert/strict';import {Simulation} from '../game/sim.js';import {BOXES} from '../game/map.js';
test('sea-facing perimeter is low enough to see the coast but still contains jumping players',()=>{
 assert.ok(BOXES.find(b=>b.x===-25).h<1.3);
 const s=new Simulation(7,'casual',{bots:false});s.phase='live';s.player.x=-23;s.player.z=25;
 for(let i=0;i<180;i++)s.step(1/60,{right:-1,jump:true});assert.ok(s.player.x>=-23.65);
});

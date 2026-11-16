import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../game/sim.js';
const advance=(s,n)=>{for(let i=0;i<Math.ceil(n*60);i++)s.step(1/60,{});};
test('buy phase leads to ninety-second round, debrief rewards, next round and match end',()=>{
 const s=new Simulation(12,'standard',{bots:false}); assert.equal(s.phase,'buy');
 advance(s,12.1); assert.equal(s.phase,'live'); assert.ok(s.timer>89);
 s.endRound('attack','test'); assert.equal(s.phase,'debrief'); assert.equal(s.score.attack,1);
 assert.ok(s.player.money>2200); advance(s,6.1); assert.equal(s.phase,'buy'); assert.equal(s.round,2);
 s.endRound('attack','test'); advance(s,6.1);s.endRound('attack','test');
 assert.equal(s.phase,'finished'); assert.equal(s.score.attack,3);
});

import test from 'node:test';import assert from 'node:assert/strict';import {Simulation} from '../game/sim.js';
const run=(s,n)=>{for(let i=0;i<n;i++)s.step(1/60,{});};
test('six actors include route-following bots that move and fire after reaction delay',()=>{
 const s=new Simulation(44);assert.equal(s.actors.length,6);s.phase='live';
 const d=s.actors[3],a=s.actors[1];a.x=-17;a.z=7;d.x=-17;d.z=-5;const start=d.z;
 run(s,8);assert.equal(s.events.filter(e=>e.type==='shot').length,0);
 run(s,360);assert.ok(s.events.some(e=>e.type==='shot'));assert.notEqual(d.z,start);assert.ok(s.actors.some(v=>v.hp<100));
});
test('seeded bot simulation has byte-identical state for same input stream',()=>{
 const a=new Simulation(170),b=new Simulation(170);run(a,4200);run(b,4200);
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 const c=new Simulation(171);run(c,4200);assert.notEqual(JSON.stringify(a.actors),JSON.stringify(c.actors));
});

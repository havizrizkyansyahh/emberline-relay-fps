import test from 'node:test';import assert from 'node:assert/strict';import {Simulation} from '../game/sim.js';import {observer} from '../game/constants.js';
test('spectator fallback stays on a living actor even when only defenders remain',()=>{
 const s=new Simulation();assert.equal(observer(s,2),s.player);s.player.alive=false;assert.equal(observer(s,2).id,2);s.actors[1].alive=false;s.actors[2].alive=false;assert.equal(observer(s,2).team,'defend');
});

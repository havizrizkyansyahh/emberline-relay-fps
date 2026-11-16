import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../game/sim.js';
test('real purchases deduct funds once, reject unaffordable/duplicate and live-round buys',()=>{
 const s=new Simulation(731,'standard',{bots:false}),p=s.player;
 assert.equal(s.buy('heavy'),false);assert.equal(p.money,2400);
 assert.equal(s.buy('rifle'),true);assert.equal(p.money,600);assert.equal(p.weapon,'rifle');
 assert.equal(s.buy('rifle'),false);assert.equal(p.money,600);
 assert.equal(s.buy('armor'),false);p.money=700;assert.equal(s.buy('armor'),true);assert.equal(p.money,50);assert.equal(p.armor,100);
 s.phase='live';p.money=9000;assert.equal(s.buy('heavy'),false);
 assert.equal(s.switchWeapon('pistol'),true);assert.equal(p.weapon,'pistol');assert.equal(s.switchWeapon('heavy'),false);
});

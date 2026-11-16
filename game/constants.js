export const WEAPONS={
 pistol:{name:'KITE / 12',label:'Precision sidearm',price:0,mag:12,reserve:36,damage:29,rate:.23,reload:1.15,spread:.006,recoil:.026,auto:false,color:0x76c6c1},
 rifle:{name:'TIDE / 30',label:'Balanced automatic',price:1800,mag:30,reserve:90,damage:27,rate:.105,reload:1.8,spread:.008,recoil:.018,auto:true,color:0xf6a95f},
 heavy:{name:'CINDER / 20',label:'Heavy marksman rifle',price:2600,mag:20,reserve:60,damage:42,rate:.24,reload:2.1,spread:.003,recoil:.04,auto:false,color:0xe2b67d}
};
export const ITEMS=[...Object.keys(WEAPONS).filter(k=>k!=='pistol').map(id=>({id,...WEAPONS[id]})),{id:'armor',name:'CERAMIC VEST',label:'100 armor · absorbs body damage',price:650},{id:'frag',name:'PULSE FRAG',label:'Additional frag · max 2 · cover matters',price:300}];
export const DT=1/60;
export const eye=a=>a.y+(a.crouch?1.08:1.65);
export const observer=(s,id)=>s.player.alive?s.player:s.actors.find(a=>a.id===id&&a.alive)||s.actors.find(a=>a.team==='attack'&&a.alive)||s.actors.find(a=>a.alive)||s.player;

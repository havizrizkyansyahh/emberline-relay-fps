// No sound files: short filtered noise, oscillators and envelopes, generated on demand.
export class Sound {
 constructor(){this.context=null;this.muted=false;this.lastShot=0;}
 unlock(){if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.gain.value=.24;this.master.connect(this.context.destination);this.noise=this.context.createBuffer(1,this.context.sampleRate*.5,this.context.sampleRate);const d=this.noise.getChannelData(0);let seed=71;for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=seed/2147483648-1;}}if(this.context.state==='suspended')this.context.resume();}
 toggle(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.24;return this.muted;}
 tone(freq,duration=.1,type='sine',gain=.3,slide=0){if(!this.context||this.muted)return;const c=this.context,t=c.currentTime,o=c.createOscillator(),e=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),t+duration);e.gain.setValueAtTime(gain,t);e.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(e);e.connect(this.master);o.start(t);o.stop(t+duration);}
 noiseBurst(duration,gain,cutoff){if(!this.context||this.muted)return;const c=this.context,t=c.currentTime,n=c.createBufferSource(),filter=c.createBiquadFilter(),e=c.createGain();n.buffer=this.noise;filter.type='lowpass';filter.frequency.value=cutoff;e.gain.setValueAtTime(gain,t);e.gain.exponentialRampToValueAtTime(.001,t+duration);n.connect(filter);filter.connect(e);e.connect(this.master);n.start(t);n.stop(t+duration);}
 event(e,p){
  if(!this.context||this.muted)return;
  if(e.type==='shot'){
   const dist=Math.hypot(e.x-p.x,e.z-p.z),v=e.actor===0?1:Math.max(.04,1-dist/55)*.47;
   this.noiseBurst(.09,v,e.weapon==='heavy'?1900:3300);this.tone(e.weapon==='heavy'?85:135,.12,'triangle',v*.6,-60);
  }else if(e.type==='hit'&&e.source===0){this.tone(e.part==='head'?1120:740,.08,'sine',.2,230);}
  else if(e.type==='hit'&&e.target===0){this.noiseBurst(.14,.6,600);this.tone(80,.15,'triangle',.35,-35);}
  else if(e.type==='kill'&&e.source===0){this.tone(620,.18,'sine',.25,400);}
  else if(e.type==='blast'){this.noiseBurst(.48,1.8,500);this.tone(68,.5,'sine',.8,-40);}
  else if(e.type==='reload'&&e.actor===0){this.noiseBurst(.08,.2,3500);this.tone(250,.06,'square',.03);}
  else if(e.type==='loaded'&&e.actor===0){this.noiseBurst(.07,.35,4500);}
  else if(['buy','pickup'].includes(e.type))this.tone(680,.08,'sine',.16,260);
  else if(e.type==='plant'){this.tone(440,.4,'sine',.35,500);}
  else if(e.type==='live')this.tone(520,.25,'triangle',.25,200);
  else if(e.type==='round'){this.tone(e.team==='attack'?440:220,.6,'sine',.4,e.team==='attack'?440:-80);}
 }
}

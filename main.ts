import {readdirSync,lstatSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDossier} from './vendor/makefun-threejs.ts';

// Deliberately dependency-free: Node 22.18+ executes this file directly.
const source=dirname(fileURLToPath(import.meta.url));
const output=resolve(process.env.MAKEFUN_OUTPUT_DIR||'/output');
if(output===source||['game','screenshots','vendor'].some(p=>output===join(source,p)||output.startsWith(join(source,p)+'/')))throw new Error('Output must not overwrite source files');
function copyTree(from:string,to:string){
 mkdirSync(to,{recursive:true});
 for(const entry of readdirSync(from).sort()){
  const src=join(from,entry),dst=join(to,entry),stat=lstatSync(src);
  if(stat.isSymbolicLink())throw new Error(`Refusing symlink: ${relative(source,src)}`);
  if(stat.isDirectory())copyTree(src,dst);else if(stat.isFile())copyFileSync(src,dst);else throw new Error(`Not a regular file: ${src}`);
 }
}
mkdirSync(output,{recursive:true});
for(const name of ['game','screenshots']){rmSync(join(output,name),{recursive:true,force:true});copyTree(join(source,name),join(output,name));}
const dossier=buildDossier(output,{text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},game_max_files:993,game_max_bytes:50331648,game_path_max_bytes:1000});
writeFileSync(join(output,'dossier.json'),dossier);
console.log(`EMBERLINE // RELAY packaged in ${output}; dossier ${dossier.byteLength} bytes.`);

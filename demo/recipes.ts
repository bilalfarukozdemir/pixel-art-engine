import { mkdirSync, writeFileSync } from 'node:fs';
import { Painter, stoneCourses, archedDoor, lancetWindow, contactShadow, outline, mulberry32 } from '../src/index.js';
import { encodePng, upscale } from '../src/output/png.js';

function tower(refined: boolean): Painter {
  const p=new Painter(80,96);
  p.rect(20,25,40,65,'#a5a396');
  for(let x=20;x<60;x+=10) p.rect(x,18,6,10,'#d1cbb6');
  if(refined){
    stoneCourses(p,20,28,40,62);
    p.rect(20,28,3,62,'#d1cbb6'); p.rect(55,28,5,62,'#666d76');
    archedDoor(p,29,61,23,29,undefined,true);
    lancetWindow(p,34,36,11,18);
  } else { p.rect(30,63,20,27,'#805337'); p.rect(34,38,12,14,'#edc47d'); }
  outline(p,'#29303e'); return p;
}
function panel(refined: boolean): Painter {
  const p=new Painter(160,144);
  if(refined) p.vgrad(0,0,160,85,[{t:0,color:'#5797bd'},{t:.65,color:'#add5dc'},{t:1,color:'#f3e5ba'}],{smooth:true});
  else { p.rect(0,0,160,42,'#5797bd');p.rect(0,42,160,43,'#add5dc'); }
  p.rect(0,85,160,59,'#b8a06b');
  const rng=mulberry32(731);
  for(let x=0;x<160;x++) {
    const edge=refined?Math.round(91+Math.sin(x/21)*5):91;
    p.vline(x,85,edge-85,'#879052');
  }
  for(let i=0;i<150;i++) {
    const x=Math.floor(rng()*160),y=94+Math.floor(rng()*50);
    p.hline(x,y,refined?2:1,refined?'#d0b88055':'#795b31');
  }
  if(refined)contactShadow(p,80,127,65,10);
  p.blit(tower(refined),40,37); return p;
}
const comparison=new Painter(328,144);
comparison.blit(panel(false),0,0); comparison.blit(panel(true),168,0);
mkdirSync('reports',{recursive:true});
writeFileSync('reports/recipe-comparison-native.png',encodePng(comparison));
const enlarged=new Painter(comparison.w*3,comparison.h*3);
enlarged.data.set(upscale(comparison,3));
writeFileSync('reports/recipe-comparison.png',encodePng(enlarged));
console.log('Left: flat baseline. Right: depth, arches, contact shadow and soft sky.');

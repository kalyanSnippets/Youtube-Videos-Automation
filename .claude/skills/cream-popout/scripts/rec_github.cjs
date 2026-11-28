// node rec.js name y0 y1 hold secs [play]
// usage: node rec_github.js <name> <y0> <y1> <holdSec> <totalSec> [play]   (set REPO_URL env)
const { chromium } = require('playwright'); const fs=require('fs');
(async () => { const [name,y0,y1,hold,secs,play]=process.argv.slice(2); const out=`clip_${name}`; fs.mkdirSync(out,{recursive:true});
 const br = await chromium.launch(); const ctx=await br.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1.5}); const pg = await ctx.newPage();
 await pg.goto(process.env.REPO_URL,{waitUntil:'load',timeout:90000}); await pg.waitForTimeout(3000);
 for (let y=0;y<9000;y+=500){await pg.evaluate(y=>scrollTo(0,y),y);await pg.waitForTimeout(200);}
 await pg.evaluate(y=>scrollTo(0,y),+y0); await pg.waitForTimeout(1500);
 if(play) console.log('play', await pg.evaluate(async()=>{const v=document.querySelector('article video'); if(!v) return 'none'; v.muted=true; v.currentTime=0; try{await v.play(); await new Promise(r=>setTimeout(r,800)); return 'ok '+v.currentTime+' '+v.videoWidth}catch(e){return 'err '+e.message}}));
 const cdp=await ctx.newCDPSession(pg); const frames=[]; let i=0;
 cdp.on('Page.screencastFrame',async f=>{const n=`f${String(i++).padStart(5,'0')}.jpg`;fs.writeFileSync(`${out}/${n}`,Buffer.from(f.data,'base64'));frames.push([n,f.metadata.timestamp]);cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1920,maxHeight:1200,everyNthFrame:1});
 await pg.waitForTimeout(hold*1000);
 await pg.evaluate(([a,b,ms])=>new Promise(res=>{const t0=performance.now();const st=t=>{const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;scrollTo(0,a+(b-a)*e);k<1?requestAnimationFrame(st):res();};requestAnimationFrame(st);}),[+y0,+y1,(secs-hold)*1000]);
 await pg.waitForTimeout(400); await cdp.send('Page.stopScreencast'); await br.close();
 let s='ffconcat version 1.0\n'; frames.forEach(([n,t],k)=>{s+=`file '${n}'\nduration ${Math.max(0.005,((frames[k+1]||[0,t+0.033])[1]-t)).toFixed(4)}\n`;}); fs.writeFileSync(`${out}/list.txt`,s);
 console.log(name,'frames',frames.length);
})();

const CACHE='raspisanie-v7';
const APP=['./','./index.html','./manifest.webmanifest','./icon.svg'];
const FIX=`<script>
(()=>{
function fixFirstLessons(){
  if(typeof data==='undefined'||typeof parseCSV==='undefined'||typeof renderAll==='undefined')return;
  const original=data;
  if(!Array.isArray(original))return;
  const url='https://docs.google.com/spreadsheets/d/1tGzeVcjc4gKja-uegpOFkvOW61I50SP3zPipSCfTxqY/gviz/tq?tqx=out:csv&sheet=%D0%9B%D0%B8%D1%81%D1%821&t='+Date.now();
  fetch(url,{cache:'no-store'}).then(r=>r.text()).then(text=>{
    const rows=parseCSV(text),out=[];
    const dayRe=/^\\s*(понедельник|вторник|среда|четверг|пятница|суббота)\\s*$/i;
    const classRe=/^\\s*\\d{1,2}\\s*[А-Яа-яЁё]\\s*$/;
    const lessonRe=/^\\s*(?:урок\\s*)?(\\d{1,2})(?:\\s*(?:[-–—.]?\\s*(?:й|ый|ой|урок))?)?\\s*$/i;
    const validCell=v=>{const n=norm(v);return n&&n!=='-'&&n!=='—'&&n!=='нет'&&n!=='нет урока'&&n!=='выходной'&&n!=='каникулы'};
    for(const row of rows){
      const ri=row.findIndex(x=>dayRe.test(String(x||''))); if(ri<0)continue;
      const di=DAYS.findIndex(x=>norm(x)===norm(row[ri])); if(di<0)continue;
      const headers=[]; for(let i=ri+1;i<row.length;i++)if(classRe.test(String(row[i]||'')))headers.push(i);
      for(let h=0;h<headers.length;h++){
        const ci=headers[h],className=String(row[ci]).trim(),end=headers[h+1]||row.length;
        for(let p=ci+1;p<end;p++){
          const m=String(row[p]||'').match(lessonRe); if(!m)continue;
          const lesson=+m[1]; if(lesson<1||lesson>8)continue;
          const subject=String(row[p+1]||'').trim(); if(!validCell(subject))continue;
          out.push({day:di,lesson,subject,room:String(row[p+2]||'').trim(),teacher:String(row[p+3]||'').trim(),time:BELL[lesson-1]||['',''],className});
        }
      }
    }
    if(out.length){
      const key=new Set(out.map(x=>[x.className,x.day,x.lesson,x.subject].join('|')));
      const merged=[...out,...original.filter(x=>!key.has([x.className,x.day,x.lesson,x.subject].join('|')))];
      data=merged;
      classes=[...new Set(data.map(x=>x.className))].sort((a,b)=>a.localeCompare(b,'ru'));
      localStorage.setItem(KEY,JSON.stringify(data));localStorage.setItem('classes',JSON.stringify(classes));
      renderAll();
    }
  }).catch(()=>{});
}
window.addEventListener('load',()=>setTimeout(fixFirstLessons,500));
})();
</script>`;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin===location.origin&&e.request.method==='GET'){e.respondWith(fetch(e.request).then(async r=>{if(u.pathname.endsWith('/index.html')||u.pathname==='/'||u.pathname.endsWith('/Raspisanie')){const text=await r.text();const injected=text.replace('</body>',FIX+'</body>');const out=new Response(injected,{status:r.status,statusText:r.statusText,headers:r.headers});const copy=out.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return out}const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)))}});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
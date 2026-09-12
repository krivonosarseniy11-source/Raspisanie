const CACHE='raspisanie-v12';
const APP=['./','./index.html','./manifest.webmanifest','./icon.svg'];
const FIX=`<script>
(()=>{
  const nativeFetch=window.fetch.bind(window);
  const isSheet=u=>u.includes('docs.google.com/spreadsheets/d/1tGzeVcjc4gKja-uegpOFkvOW61I50SP3zPipSCfTxqY/gviz/tq');
  const jsonp=src=>new Promise((resolve,reject)=>{
    const cb='__scheduleJsonp_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();reject(new Error('Google Sheets timeout'))},15000);
    const cleanup=()=>{clearTimeout(timer);delete window[cb];s.remove()};
    window[cb]=o=>{cleanup();resolve(o)};
    s.onerror=()=>{cleanup();reject(new Error('Google Sheets request failed'))};
    s.src=src+'&tqx=out:json;responseHandler:'+cb+'&_='+Date.now();
    document.head.appendChild(s);
  });
  const esc=v=>{v=String(v??'');return /[",\\n\\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const tableToCsv=o=>{const t=o&&o.table;if(!t||!Array.isArray(t.cols)||!Array.isArray(t.rows))throw Error('Invalid Google Sheets data');return t.rows.map(r=>t.cols.map((c,i)=>{const x=r.c&&r.c[i];return x&&x.v!=null?esc(x.f??x.v):''}).join(',')).join('\\r\\n')};
  window.fetch=async function(input,init){const url=typeof input==='string'?input:(input&&input.url)||'';if(!isSheet(url))return nativeFetch(input,init);try{const u=new URL(url),sheet=u.searchParams.get('sheet')||'Лист1',base='https://docs.google.com/spreadsheets/d/1tGzeVcjc4gKja-uegpOFkvOW61I50SP3zPipSCfTxqY/gviz/tq?sheet='+encodeURIComponent(sheet),o=await jsonp(base);return new Response(tableToCsv(o),{status:200,headers:{'Content-Type':'text/csv;charset=utf-8'}})}catch(e){return nativeFetch(input,init)}};
})();
</script>`;
const PARSER=`<script>
(()=>{
const norm=s=>String(s??'').toLowerCase().replace(/ё/g,'е').replace(/[^\\p{L}\\p{N}]+/gu,' ').replace(/\\s+/g,' ').trim();
const DAYS=['понедельник','вторник','среда','четверг','пятница','суббота'];
const BELL=[['08:00','08:45'],['08:55','09:40'],['09:50','10:35'],['10:45','11:30'],['11:45','12:30'],['12:40','13:25'],['13:35','14:20'],['14:30','15:15']];
const isDay=v=>DAYS.includes(norm(v));
const isClass=v=>/^\\d{1,2}\\s*[а-яёa-z]$/i.test(String(v||'').trim());
const num=v=>{const m=String(v??'').trim().match(/^\\d{1,2}$/);return m?+m[0]:0};
const valid=v=>{const n=norm(v);return !!n&&!['-','нет','нет урока','выходной','каникулы','пусто','nan','null','undefined'].includes(n)};
window.build=function(rows){
 const out=[];
 for(const row of rows){
  const dp=row.findIndex(isDay); if(dp<0) continue;
  const day=DAYS.indexOf(norm(row[dp]));
  const classes=[]; row.forEach((v,i)=>{if(isClass(v)) classes.push(i)});
  for(let ci=0;ci<classes.length;ci++){
   const cp=classes[ci], end=classes[ci+1]??row.length, cn=String(row[cp]).trim();
   for(let p=cp+1;p<end;p++){
    const lesson=num(row[p]); if(!lesson||lesson>8) continue;
    let sp=p+1; while(sp<end&&!String(row[sp]??'').trim()) sp++;
    if(sp>=end||!valid(row[sp])||isDay(row[sp])||isClass(row[sp])) continue;
    const subject=String(row[sp]).trim();
    let rp=sp+1; while(rp<end&&!String(row[rp]??'').trim()) rp++;
    let tp=rp+1; while(tp<end&&!String(row[tp]??'').trim()) tp++;
    out.push({className:cn,day,lesson,subject,room:rp<end?String(row[rp]).trim():'',teacher:tp<end?String(row[tp]).trim():'',time:BELL[lesson-1]});
   }
  }
 }
 const seen=new Set();
 return out.filter(x=>{const k=[norm(x.className),x.day,x.lesson,norm(x.subject)].join('|');if(seen.has(k)||!valid(x.subject))return false;seen.add(k);return true});
};
try{if(typeof load==='function'){setTimeout(()=>{try{load()}catch(e){console.error(e)}},0)}}catch(e){}
})();
</script>`;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin===location.origin&&e.request.method==='GET'){e.respondWith(fetch(e.request).then(async r=>{if(u.pathname.endsWith('/index.html')||u.pathname==='/'||u.pathname.endsWith('/Raspisanie')){let text=await r.text();if(!text.includes('__scheduleJsonp_')){text=text.replace('</body>',FIX+PARSER+'</body>')}const out=new Response(text,{status:r.status,statusText:r.statusText,headers:r.headers});caches.open(CACHE).then(c=>c.put(e.request,out.clone()));return out}const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)))}});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
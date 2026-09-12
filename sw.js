const CACHE='raspisanie-v10';
const APP=['./','./index.html','./manifest.webmanifest','./icon.svg'];
const FIX=`<script>
(()=>{
  const nativeFetch=window.fetch.bind(window);
  const isSheet=u=>u.includes('docs.google.com/spreadsheets/d/1tGzeVcjc4gKja-uegpOFkvOW61I50SP3zPipSCfTxqY/gviz/tq');
  const jsonp=src=>new Promise((resolve,reject)=>{
    const cb='__scheduleJsonp_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();reject(new Error('Google Sheets timeout'))},15000);
    const cleanup=()=>{clearTimeout(timer);delete window[cb];s.remove()};
    window[cb]=obj=>{cleanup();resolve(obj)};
    s.onerror=()=>{cleanup();reject(new Error('Google Sheets request failed'))};
    s.src=src+'&tqx=out:json;responseHandler:'+cb+'&_='+Date.now();
    document.head.appendChild(s);
  });
  const esc=v=>{v=String(v??'');return /[",\\n\\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const tableToCsv=obj=>{
    const t=obj&&obj.table;if(!t||!Array.isArray(t.cols)||!Array.isArray(t.rows))throw new Error('Invalid Google Sheets data');
    const rows=t.rows.map(r=>t.cols.map((c,i)=>{const cell=r.c&&r.c[i];return cell&&cell.v!=null?esc(cell.f??cell.v):''}));
    return rows.map(r=>r.join(',')).join('\\r\\n');
  };
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!isSheet(url))return nativeFetch(input,init);
    try{
      const u=new URL(url);
      const sheet=u.searchParams.get('sheet')||'Лист1';
      const base='https://docs.google.com/spreadsheets/d/1tGzeVcjc4gKja-uegpOFkvOW61I50SP3zPipSCfTxqY/gviz/tq?sheet='+encodeURIComponent(sheet);
      const obj=await jsonp(base);
      return new Response(tableToCsv(obj),{status:200,headers:{'Content-Type':'text/csv;charset=utf-8'}});
    }catch(err){
      return nativeFetch(input,init);
    }
  };
})();
</script>`;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin===location.origin&&e.request.method==='GET'){e.respondWith(fetch(e.request).then(async r=>{if(u.pathname.endsWith('/index.html')||u.pathname==='/'||u.pathname.endsWith('/Raspisanie')){const text=await r.text();const injected=text.includes('__scheduleJsonp_')?text:text.replace('</body>',FIX+'</body>');const out=new Response(injected,{status:r.status,statusText:r.statusText,headers:r.headers});caches.open(CACHE).then(c=>c.put(e.request,out.clone()));return out}const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)))}});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
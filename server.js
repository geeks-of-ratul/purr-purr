const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ACCESS_KEY = process.env.BIRTHDAY_ACCESS_KEY || 'Ratul';
const ADMIN_KEY = process.env.BIRTHDAY_ADMIN_KEY || 'change-this-admin-key';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ devices: {}, pendingDevices: {}, notes: [] }, null, 2));

function load() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function save(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function json(res, status, body) { const s = JSON.stringify(body); res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(s); }
function body(req) { return new Promise((resolve,reject)=>{ let d=''; req.on('data',c=>{d+=c; if(d.length>200000){req.destroy();reject(new Error('Request too large'))}}); req.on('end',()=>{try{resolve(d?JSON.parse(d):{})}catch(e){reject(e)}}); req.on('error',reject); }); }
function safePath(urlPath){
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const abs = path.normalize(path.join(ROOT, rel));
  if(!abs.startsWith(ROOT)) return null;
  return abs;
}
function mime(file){
  const ext=path.extname(file).toLowerCase();
  return {'html':'text/html; charset=utf-8','css':'text/css; charset=utf-8','js':'application/javascript; charset=utf-8','json':'application/json; charset=utf-8','wav':'audio/wav','mp3':'audio/mpeg','jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','gif':'image/gif','svg':'image/svg+xml','txt':'text/plain; charset=utf-8'}[ext.slice(1)]||'application/octet-stream';
}
function deviceToken(){return crypto.createHash('sha256').update(String(Date.now())+Math.random()).digest('hex').slice(0,20)}

const server=http.createServer(async (req,res)=>{
  try{
    const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);

    if(u.pathname==='/api/health'){return json(res,200,{ok:true,time:new Date().toISOString()});}

    if(u.pathname==='/api/activate' && req.method==='POST'){
      const b=await body(req); const deviceId=String(b.deviceId||'').trim(); const key=String(b.keyCode||'').trim();
      if(!deviceId) return json(res,400,{message:'Missing device id.'});
      if(key!==ACCESS_KEY) return json(res,401,{message:'That access key is not correct.'});
      const db=load();
      if(db.devices[deviceId]) return json(res,200,{ok:true,registered:true,message:'This device is already registered.'});
      const active=Object.values(db.devices).filter(d=>d.status==='active');
      if(active.length>=1 && process.env.ALLOW_NEW_DEVICES !== 'true') { db.pendingDevices ||= {}; db.pendingDevices[deviceId]={requestedAt:new Date().toISOString(),userAgent:String(b.userAgent||'').slice(0,300)}; save(db); return json(res,403,{message:'This device is not activated yet. Send this device code to the owner: '+deviceId,deviceId}); }
      db.devices[deviceId]={id:deviceToken(),status:'active',registeredAt:new Date().toISOString(),userAgent:String(b.userAgent||'').slice(0,300)};
      save(db); return json(res,200,{ok:true,registered:true,message:'Device registered.'});
    }

    if(u.pathname==='/api/note' && req.method==='POST'){
      const b=await body(req); const deviceId=String(b.deviceId||'').trim(); const text=String(b.text||'').trim();
      if(!deviceId||!text) return json(res,400,{message:'Device id and note are required.'});
      if(text.length>280) return json(res,400,{message:'Note is too long.'});
      const db=load(); if(!db.devices[deviceId]) return json(res,403,{message:'Device is not registered.'});
      if(db.notes.some(n=>n.deviceId===deviceId)) return json(res,409,{message:'This device has already used its one-time note.'});
      db.notes.push({deviceId,text,createdAt:new Date().toISOString()}); save(db); return json(res,200,{ok:true});
    }

    if(u.pathname==='/api/admin/add-device' && req.method==='POST'){
      const b=await body(req); if(String(b.adminKey||'')!==ADMIN_KEY) return json(res,401,{message:'Invalid admin key.'});
      const deviceId=String(b.deviceId||'').trim(); if(!deviceId) return json(res,400,{message:'Missing deviceId.'});
      const db=load(); db.devices[deviceId]={id:deviceToken(),status:'active',registeredAt:new Date().toISOString(),manual:true}; if(db.pendingDevices) delete db.pendingDevices[deviceId]; save(db); return json(res,200,{ok:true,message:'Device activated.',deviceId});
    }

    if(u.pathname==='/api/admin/list' && req.method==='GET'){
      if(u.searchParams.get('key')!==ADMIN_KEY) return json(res,401,{message:'Invalid admin key.'});
      const db=load(); return json(res,200,{devices:db.devices,pendingDevices:db.pendingDevices||{},notes:db.notes});
    }

    if(req.method==='GET'){
      const file=safePath(u.pathname); if(!file) return json(res,400,{message:'Bad path.'});
      if(!fs.existsSync(file)||!fs.statSync(file).isFile()) return json(res,404,{message:'Not found.'});
      res.writeHead(200,{'Content-Type':mime(file),'Cache-Control':'no-store'}); fs.createReadStream(file).pipe(res); return;
    }
    json(res,404,{message:'Not found.'});
  }catch(e){console.error(e);json(res,500,{message:'Server error.'});}
});
server.listen(PORT,()=>console.log(`Birthday site running at http://localhost:${PORT}`));

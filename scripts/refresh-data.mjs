import {writeFile,mkdir} from 'node:fs/promises';
import {REGIONS} from '../dist/regions.js';
const dir=new URL('../dist/data/',import.meta.url);await mkdir(dir,{recursive:true});
const now=new Date(),end=new Date(now.getTime()-86400000),start=new Date(now.getTime()-15*86400000);
const fmt=d=>d.toISOString().slice(0,10).replaceAll('-','');
const manifest={fetchedAt:now.toISOString(),regions:{}};
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`${r.status} from ${new URL(url).host}`);return r.json();}
for(const region of REGIONS){
 const [lat,lon]=region.center;
 const nasa=`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&format=JSON&time-standard=UTC`;
 const weather=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,soil_moisture_0_to_1cm&forecast_days=3&past_days=1&timezone=UTC&timeformat=unixtime`;
 const record={};
 for(const [type,url] of [['nasa',nasa],['weather',weather]]){try{const raw=await get(url);await writeFile(new URL(`${region.id}-${type}.json`,dir),JSON.stringify(raw));record[type]={url,file:`data/${region.id}-${type}.json`,fetchedAt:new Date().toISOString()};console.log(region.id,type,'OK');}catch(e){record[type]={url,error:e.message};console.log(region.id,type,e.message);}}
 manifest.regions[region.id]=record;
}
await writeFile(new URL('manifest.json',dir),JSON.stringify(manifest,null,2));
for(const r of REGIONS.filter(r=>r.local)){
 const [lat,lon]=r.center;
 const query=`[out:json][timeout:25];(nwr["amenity"~"^(school|hospital)$"]["name"](around:3500,${lat},${lon}););out center tags;`;
 const url='https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query);
 try{const raw=await get(url);await writeFile(new URL(`${r.id}-places.json`,dir),JSON.stringify({fetchedAt:new Date().toISOString(),url,...raw}));console.log(r.id,'OSM facilities',raw.elements.length);}catch(e){console.log(r.id,'OSM unavailable',e.message);}
}

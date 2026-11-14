export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
export const levelFor=score=>score==null?-1:score<20?0:score<50?1:score<75?2:3;
// Transparent classroom heuristic. These thresholds are NOT fitted to Vietnam floods.
export function scoreRisk(inputs){
 const specs=[['future',.35,v=>clamp(v/150)],['past',.25,v=>clamp(v/300)],['soil',.20,v=>clamp((v-.15)/.35)],['elevation',.10,v=>clamp(1-v/50)],['riverRise',.10,v=>clamp(v/.3)]];
 const factors=specs.map(([key,weight,normalize])=>({key,weight,raw:inputs[key],normalized:valid(inputs[key])?normalize(inputs[key]):null}));
 const coverage=factors.reduce((s,f)=>s+(f.normalized===null?0:f.weight),0);
 const base=factors.reduce((s,f)=>s+(f.normalized===null?0:f.normalized*f.weight*100),0);
 // Unknown water level is not treated as zero, and weights are not silently redistributed.
 return {factors,coverage,lower:Math.round(base),upper:Math.min(100,Math.round(base+(1-coverage)*100)),score:coverage>.999?Math.round(base):null};
}
export function parseNASA(raw){
 const all=Object.entries(raw?.properties?.parameter?.PRECTOTCORR||{}).sort(([a],[b])=>a.localeCompare(b));
 const rows=all.filter(([,v])=>valid(v)&&v!==raw?.header?.fill_value);
 if(!rows.length)return {past:null,rows:[],end:null,start:null};
 const tail=rows.slice(-3);const date=s=>new Date(s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8)+'T00:00:00Z');
 const contiguous=tail.length===3&&date(tail[2][0])-date(tail[0][0])===2*86400000;
 return {past:contiguous?tail.reduce((s,[,v])=>s+v,0):null,rows,end:rows.at(-1)[0],start:tail[0][0],sources:raw.header.sources,timeStandard:raw.header.time_standard};
}
export function parseWeather(raw,at=Date.now()){
 const h=raw?.hourly;if(!h?.time)return {future:null,soil:null,elevation:null,hours:[]};
 const ts=h.time.map(t=>typeof t==='number'?t*1000:Date.parse(t+'Z'));
 const current=ts.findIndex(t=>t>=at);const idx=current<0?-1:current;
 // Hourly precipitation describes the preceding hour; sum the next 24 complete intervals.
 const indexes=idx<0?[]:Array.from({length:24},(_,i)=>idx+1+i).filter(i=>i<ts.length);
 const vals=indexes.map(i=>h.precipitation[i]);
 return {future:vals.length===24&&vals.every(valid)?vals.reduce((a,b)=>a+b,0):null,soil:idx>=0&&valid(h.soil_moisture_0_to_1cm?.[idx])?h.soil_moisture_0_to_1cm[idx]:null,elevation:valid(raw.elevation)?raw.elevation:null,hours:indexes.map(i=>({time:ts[i],rain:h.precipitation[i]})),start:idx>=0?ts[idx]:null,end:indexes.length?ts[indexes.at(-1)]:null};
}
export function distanceMeters(a,b){const rad=Math.PI/180,p1=a[0]*rad,p2=b[0]*rad,dp=(b[0]-a[0])*rad,dl=(b[1]-a[1])*rad;return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2)));}
export function routeExposure(coords,zones){let total=0,weighted=0;for(let i=1;i<coords.length;i++){const a=[coords[i-1][1],coords[i-1][0]],b=[coords[i][1],coords[i][0]],len=distanceMeters(a,b);const n=Math.max(1,Math.ceil(len/20));for(let j=0;j<n;j++){const t=(j+.5)/n,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];const inside=zones.filter(z=>distanceMeters(p,[z.lat,z.lng])<=z.radius);const risk=inside.length?Math.max(...inside.map(z=>z.level+1))/4:0;weighted+=len/n*risk;}total+=len;}return {fraction:total?weighted/total:0,total};}

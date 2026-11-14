// Detailed vector streets are independent of the flood screening overlays.
export function installBasemaps(map,{select,notify}){
 const attribution='<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
 map.createPane('outlinePane');map.getPane('outlinePane').style.zIndex=250;
 const outline=L.layerGroup();let streets=null,loaded=false,timeout=null,mode='streets';
 fetch('data/world.geojson').then(r=>r.json()).then(geo=>{
  L.geoJSON(geo,{pane:'outlinePane',style:f=>({color:'#9aafb2',weight:f.id==='VNM'?1.5:.8,fillColor:f.id==='VNM'?'#f8fbfa':'#e6eeed',fillOpacity:1}),interactive:false}).addTo(outline);
  for(const [name,lat,lng] of [['Thailand',16.5,100.5],['Laos',19,103],['Cambodia',12.7,104.5],['China',24.2,106.5],['South China Sea',14.2,111.7]])L.marker([lat,lng],{pane:'outlinePane',interactive:false,keyboard:false,icon:L.divIcon({className:'country-label',html:name,iconSize:[120,20],iconAnchor:[60,10]})}).addTo(outline);
 }).catch(()=>notify('Outline data unavailable. You can still use the region controls.'));
 function fallback(){if(mode!=='streets')return;select.value='outline';mode='outline';if(streets&&map.hasLayer(streets))map.removeLayer(streets);outline.addTo(map);notify('Detailed map unavailable on this connection. Select City streets to retry.');}
 function use(value){
  clearTimeout(timeout);mode=value;
  if(value==='outline'){if(streets&&map.hasLayer(streets))map.removeLayer(streets);outline.addTo(map);return;}
  if(map.hasLayer(outline))map.removeLayer(outline);
  try{
   if(!streets){
    if(!window.maplibregl||!L.maplibreGL)throw Error('Map renderer unavailable');
    streets=L.maplibreGL({style:'https://tiles.openfreemap.org/styles/liberty',attribution,interactive:false,padding:.1}).addTo(map);
    const gl=streets.getMaplibreMap();
    gl.on('load',()=>{loaded=true;clearTimeout(timeout);});
   }else streets.addTo(map);
   if(!loaded)timeout=setTimeout(fallback,18000);
  }catch{fallback();}
 }
 select.onchange=e=>use(e.target.value);select.value='streets';use('streets');
 L.control.scale({position:'bottomleft',imperial:false,maxWidth:110}).addTo(map);
}

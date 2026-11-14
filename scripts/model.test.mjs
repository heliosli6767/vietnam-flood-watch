import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scoreRisk,parseNASA,parseWeather,routeExposure,levelFor} from '../dist/model.js';

test('missing inputs produce a bounded interval, never a precise probability',()=>{
 const missing=scoreRisk({});assert.equal(missing.lower,0);assert.equal(missing.upper,100);assert.equal(missing.score,null);
 const input={future:150,past:300,soil:.5,elevation:0,riverRise:null};
 const partial=scoreRisk(input);assert.equal(partial.lower,90);assert.equal(partial.upper,100);assert.equal(partial.score,null);
 assert.equal(scoreRisk({...input,riverRise:.3}).score,100);
 assert.equal(scoreRisk({...input,future:NaN}).coverage,.55);
 assert.deepEqual([19,20,49,50,74,75].map(levelFor),[0,1,1,2,2,3]);
});
test('NASA fill values and gaps are not counted as zero-rain days',()=>{
 const raw={header:{fill_value:-999,sources:['GEOSIT']},properties:{parameter:{PRECTOTCORR:{20261110:26.5,20261111:18.91,20261112:31.82,20261113:-999}}}};
 const parsed=parseNASA(raw);assert.ok(Math.abs(parsed.past-77.23)<1e-8);assert.equal(parsed.end,'20261112');
 delete raw.properties.parameter.PRECTOTCORR[20261111];assert.equal(parseNASA(raw).past,null);
});
test('weather forecast uses 24 complete future intervals and preserves missing values',()=>{
 const start=Date.parse('2026-11-14T00:00:00Z');
 const raw={elevation:7,hourly:{time:Array.from({length:50},(_,i)=>(start+i*3600000)/1000),precipitation:Array(50).fill(1),soil_moisture_0_to_1cm:Array(50).fill(.3)}};
 const parsed=parseWeather(raw,start+30*60000);assert.equal(parsed.future,24);assert.equal(parsed.hours[0].time,start+2*3600000);
 raw.hourly.precipitation[3]=null;assert.equal(parseWeather(raw,start).future,null);
 assert.equal(parseWeather(raw,start+60*3600000).future,null);
});
test('road exposure measures distance against scenario zones without double counting',()=>{
 const road=[[107,16],[107.002,16]];const zone={lat:16,lng:107.001,radius:500,level:3};
 assert.equal(routeExposure(road,[]).fraction,0);
 assert.equal(routeExposure(road,[zone,zone]).fraction,1);
 assert.equal(routeExposure(road,[{...zone,level:1}]).fraction,.5);
});
test('all bundled regions have usable provenance and source inputs',async()=>{
 const base=new URL('../dist/',import.meta.url);const manifest=JSON.parse(await readFile(new URL('data/manifest.json',base)));
 for(const sources of Object.values(manifest.regions)){
  const nasa=parseNASA(JSON.parse(await readFile(new URL(sources.nasa.file,base))));
  const weather=parseWeather(JSON.parse(await readFile(new URL(sources.weather.file,base))),Date.parse(sources.weather.fetchedAt));
  assert.notEqual(nasa.past,null);assert.notEqual(weather.future,null);assert.ok(sources.nasa.url.startsWith('https://power.larc.nasa.gov/'));
 }
});

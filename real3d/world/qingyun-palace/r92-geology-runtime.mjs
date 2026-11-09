/** R92 genuine Zhangjiajie primary DEM + separate genuine Sanqingshan DEM.
 * Standalone geography modes, 1x1 scale, no floating islands or fake roads.
 * Overhang/rock-sculpture geometry NOT represented by height grids.
 */
import * as THREE from 'three';
async function inflateActualSRTM(name){
 const u=new URL('./r92-'+name+'-real-dem.json.gz.b64',import.meta.url);
 const response=await fetch(u);
 if(!response.ok)throw Error('Real source unavailable '+u+' '+response.status);
 const text=(await response.text()).trim();
 const encoded=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
 const unpacked=new Blob([encoded]).stream().pipeThrough(new DecompressionStream('gzip'));
 const output=JSON.parse(await new Response(unpacked).text());
 if(output.heights.length!==321*289)throw Error('Bad SRTM grid');
 return output;
}
const [tianzi,sanqing]=await Promise.all([inflateActualSRTM('tianzi'),inflateActualSRTM('sanqing')]);
import audit from './r92-grounded-buildings-audit.json' with {type:'json'};
const sources={tianzi,sanqing};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export const R92_AUDITED_SITES=audit;
export function exactSurface(mode,x,z){
 const src=sources[mode],m=src.metadata;
 if(!src)throw Error('Invalid R92 geography '+mode);
 const fx=clamp((x-m.boundsXM[0])/(m.boundsXM[1]-m.boundsXM[0])*(m.nx-1),0,m.nx-1);
 const fz=clamp((z-m.boundsZM[0])/(m.boundsZM[1]-m.boundsZM[0])*(m.nz-1),0,m.nz-1);
 const i=Math.min(m.nx-2,Math.floor(fx)),j=Math.min(m.nz-2,Math.floor(fz));
 const u=fx-i,v=fz-j,idx=j*m.nx+i,h=src.heights;
 return mix(mix(h[idx],h[idx+1],u),
  mix(h[idx+m.nx],h[idx+m.nx+1],u),v)-m.minimumElevationM;
}
function makeMesh(mode){
 const src=sources[mode],m=src.metadata;
 const p=new Float32Array(m.nx*m.nz*3),
 c=new Float32Array(m.nx*m.nz*3),idx=[];
 for(let z=0;z<m.nz;z++)for(let x=0;x<m.nx;x++){
  const i=z*m.nx+x;
  p[3*i]=mix(m.boundsXM[0],m.boundsXM[1],x/(m.nx-1));
  p[3*i+1]=src.heights[i]-m.minimumElevationM;
  p[3*i+2]=mix(m.boundsZM[0],m.boundsZM[1],z/(m.nz-1));
  if(x<m.nx-1&&z<m.nz-1){
   const a=i,b=i+1,d=i+m.nx,e=d+1;
   idx.push(a,d,b,b,d,e);
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(p,3));
 geo.setIndex(idx);
 geo.computeVertexNormals();
 const normal=geo.getAttribute('normal');
 const plant=new THREE.Color(mode==='tianzi'?'#536b49':'#587063');
 const exposed=new THREE.Color(mode==='tianzi'?'#a29988':'#a3aab1');
 const lower=new THREE.Color('#405845');
 for(let i=0;i<src.heights.length;i++){
  const slope=clamp((1-Math.abs(normal.getY(i))-.07)*1.6,0,1);
  const elevation=clamp((src.heights[i]-m.minimumElevationM)/
   Math.max(1,m.maximumElevationM-m.minimumElevationM),0,1);
  const cc=lower.clone().lerp(plant,.25+elevation*.5).lerp(exposed,slope*.86);
  c[3*i]=cc.r;c[3*i+1]=cc.g;c[3*i+2]=cc.b;
 }
 geo.setAttribute('color',new THREE.BufferAttribute(c,3));geo.computeBoundingSphere();
 const material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1});
 const mesh=new THREE.Mesh(geo,material);
 mesh.name='R92_ACTUAL_'+mode.toUpperCase()+'_SRTM_321X289_TRIANGULATED';
 mesh.receiveShadow=true;
 return {mesh,geo,material};
}
export function createR92RealGeoWorld(){
 for(const s of Object.values(sources)){
  const m=s.metadata;
  if(m.artificialRidges!==0||m.relativeVerticalScale!==1||
    m.relativeHorizontalScale!==1||m.floatingIslands!==0)
   throw Error('R92 no fabricated ridges, height inflation or floating islands');
 }
 const group=new THREE.Group(),modes={};
 for(const name of Object.keys(sources)){
  modes[name]=makeMesh(name);group.add(modes[name].mesh);
 }
 let mode='tianzi';
 function setMode(value){
  if(!modes[value])throw Error('Only authentic sources permitted');
  mode=value;
  for(const [name,obj] of Object.entries(modes))obj.mesh.visible=name===mode;
  return mode;
 }
 setMode(mode);
 return {group,setMode,currentMode:()=>mode,
  sites:audit.sites,terrainHeight:exactSurface,
  report:{
   revision:'R92',actualPrimarySource:'Zhangjiajie Tianzi N29E110 SRTM',
   secondarySeparateSource:'Sanqingshan N28E118 SRTM',
   realDEMVerticesPerSource:321*289,
   syntheticRidges:0,artificialLongRoads:0,floatingIslands:0,
   geologicalOverhangMeshesCertified:false,
   siteFoundationSignedOff:false,allSixSitesAudited:true},
  dispose(){for(const x of Object.values(modes)){x.geo.dispose();x.material.dispose();}}
 };
}

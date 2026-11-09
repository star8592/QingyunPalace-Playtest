/** R91: the actual Wudang SRTM georeferenced mainland mesh.
 * No artificial Gaussian hills, synthetic ridges, roads or generated
 * detail fragments. Three detached fantasy masses use DEM sampled crowns.
 * The underside of floating masses is explicitly fictional.
 */
import * as THREE from 'three';
import dem from './r91-wudang-exact-grid.json' with {type:'json'};
import layout from './r91-six-region-geo-layout.json' with {type:'json'};
const m=dem.metadata;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,u)=>a+(b-a)*u;
export const R91_LAYOUT=layout;
export const R91_GEO_METADATA=m;
export function realHeight(x,z){
 const fx=clamp((x-m.xBounds[0])/(m.xBounds[1]-m.xBounds[0])*(m.gridNx-1),0,m.gridNx-1);
 const fz=clamp((z-m.zBounds[0])/(m.zBounds[1]-m.zBounds[0])*(m.gridNz-1),0,m.gridNz-1);
 const i=Math.min(m.gridNx-2,Math.floor(fx)),j=Math.min(m.gridNz-2,Math.floor(fz));
 const u=fx-i,v=fz-j,idx=j*m.gridNx+i,a=dem.elevationsMeters;
 return lerp(lerp(a[idx],a[idx+1],u),lerp(a[idx+m.gridNx],a[idx+m.gridNx+1],u),v)+m.renderHeightOffsetMeters;
}
const material=()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});
function constructMainland(){
 const nx=m.gridNx,nz=m.gridNz,count=nx*nz;
 const P=new Float32Array(count*3),C=new Float32Array(count*3),I=[];
 let k=0;
 for(let j=0;j<nz;j++)
  for(let i=0;i<nx;i++){
   P[k++]=lerp(m.xBounds[0],m.xBounds[1],i/(nx-1));
   P[k++]=dem.elevationsMeters[j*nx+i]+m.renderHeightOffsetMeters;
   P[k++]=lerp(m.zBounds[0],m.zBounds[1],j/(nz-1));
   if(i<nx-1&&j<nz-1){
    const n=j*nx+i;I.push(n,n+1,n+nx,n+1,n+nx+1,n+nx);
   }
  }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(I);
 g.computeVertexNormals();
 const normals=g.getAttribute('normal'),pos=g.getAttribute('position');
 const pine=new THREE.Color('#3a5338'),meadow=new THREE.Color('#6b8060');
 const exposed=new THREE.Color('#98a19b');
 for(let i=0;i<count;i++){
  const elevation=pos.getY(i)-m.renderHeightOffsetMeters;
  const high=clamp((elevation-600)/1000,0,1);
  const slope=clamp((1-Math.abs(normals.getY(i))-.08)*1.28,0,1);
  const color=pine.clone().lerp(meadow,.2+high*.48).lerp(exposed,slope*.83);
  C[i*3]=color.r;C[i*3+1]=color.g;C[i*3+2]=color.b;
 }
 g.setAttribute('color',new THREE.BufferAttribute(C,3));
 g.computeBoundingBox();g.computeBoundingSphere();
 const mesh=new THREE.Mesh(g,material());
 mesh.name='R91_UNMODIFIED_WUDANG_SRTM_VISIBLE_MAINLAND_NO_OLD_R58_DOMES';
 mesh.receiveShadow=true;
 return {mesh,geometry:g};
}
function constructFloatingIsland(site,number){
 const n=96,topRings=14,sideRings=13,radius=number===2?300:245;
 const P=[],C=[],I=[];
 const light=new THREE.Color('#768b7c'),dark=new THREE.Color('#43555b');
 function add(x,y,z,t){
  P.push(x,y,z);
  const c=light.clone().lerp(dark,clamp(t,0,1));
  C.push(c.r,c.g,c.b);
 }
 const height=site.aboveRealTerrainGapM;
 // Unwarped DEM sampling for the real landscape crown, with purely
 // fictional, closed, continuous walls on the floating rock's underside.
 for(let r=0;r<=topRings;r++){
  const rad=radius*r/topRings;
  for(let j=0;j<n;j++){
   const theta=j*2*Math.PI/n;
   const x=site.x+rad*Math.cos(theta),z=site.z+rad*Math.sin(theta);
   add(x,realHeight(x,z)+height,z,.12+.2*r/topRings);
  }
 }
 for(let r=0;r<topRings;r++)for(let j=0;j<n;j++){
  const a=r*n+j,b=r*n+(j+1)%n,c=(r+1)*n+j,d=(r+1)*n+(j+1)%n;
  I.push(a,c,b,b,c,d);
 }
 const start=P.length/3,centerTop=realHeight(site.x,site.z)+height;
 for(let r=0;r<=sideRings;r++)for(let j=0;j<n;j++){
  const t=r/sideRings,theta=j*2*Math.PI/n;
  const width=radius*(1-.66*t*t),rimX=site.x+radius*Math.cos(theta),
   rimZ=site.z+radius*Math.sin(theta);
  const x=site.x+width*Math.cos(theta),z=site.z+width*Math.sin(theta);
  const y=lerp(realHeight(rimX,rimZ)+height,centerTop-220,t);
  add(x,y,z,.30+.60*t);
 }
 for(let j=0;j<n;j++){
  const a=topRings*n+j,b=topRings*n+(j+1)%n,c=start+j,d=start+(j+1)%n;
  I.push(a,c,b,b,c,d);
 }
 for(let r=0;r<sideRings;r++)for(let j=0;j<n;j++){
  const a=start+r*n+j,b=start+r*n+(j+1)%n,c=start+(r+1)*n+j,d=start+(r+1)*n+(j+1)%n;
  I.push(a,c,b,b,c,d);
 }
 const cap=P.length/3;
 add(site.x,centerTop-222,site.z,1);
 for(let j=0;j<n;j++)I.push(cap,start+sideRings*n+(j+1)%n,start+sideRings*n+j);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
 geo.setIndex(I);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,material());
 mesh.name='R91_FLOATING_'+site.id+'_SINGLE_REAL_DEM_CROWN_FANTASY_UNDERSIDE';
 mesh.receiveShadow=true;
 return {mesh,geo,report:{id:site.id,meshCount:1,separateRockDebris:0,
  topHeightData:'real-Wudang-DEM',underside:'fictional',gapM:height,
  triangles:I.length/3}};
}
export function createR91ExactWudangWorld(){
 if(m.rotationDegrees!==0||m.horizontalScale!==1||
  m.verticalExaggeration!==1||!m.noSyntheticPeaks||
  dem.elevationsMeters.length!==m.gridNx*m.gridNz)
  throw Error('R91 forbids procedural mountain synthesis');
 const group=new THREE.Group();
 const land=constructMainland();group.add(land.mesh);
 const floats=new THREE.Group(),islands=[],reports=[];
 layout.fictionalDetachedSummits.forEach((site,i)=>{
  const v=constructFloatingIsland(site,i);
  islands.push(v);reports.push(v.report);floats.add(v.mesh);
 });
 group.add(floats);
 const report={revision:'R91-real-georeferenced',
  actualSRTMSourceTiles:m.sourceTiles.length,realDEMVertices:m.gridNx*m.gridNz,
  realDEMMainlandTriangles:land.geometry.index.count/3,
  exactGoldenHallLatitudeLongitude:[m.goldenHallReferenceLat,m.goldenHallReferenceLon],
  scaleHorizontal:1,scaleVertical:1,rotatedDegrees:0,
  syntheticMountainRidges:0,legacyR58HillsShown:0,
  realRoadRoutesImported:0,falseMainlandRoadMeshes:0,
  siteGrounded:3,siteFloating:3,floatingPeaks:3,floatingRockDebris:0,detachedRockDebrisMeshes:0,
  originalBuildingAssetsUsed:false,
  userArtApproved:false,navmeshReady:false};
 return {group,land:land.mesh,floats,report,
  setFloat(on){floats.visible=!!on;return floats.visible;},
  dispose(){land.geometry.dispose();land.mesh.material.dispose();
   for(const x of islands){x.geo.dispose();x.mesh.material.dispose();}}};
}

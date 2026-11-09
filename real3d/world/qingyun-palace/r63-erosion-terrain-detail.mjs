/**
 * R63 local micro-erosion DETAIL MESH, not a second authoritative world.
 *
 * Derive a denser visual mesh from the R58 real triangle elevation sampler.
 * Peak coordinates, plateau heights, map bounds, river waypoints and the
 * original 23345 vertices remain frozen; the R58 mesh is never mutated.
 *
 * No square overlays, no independent floating islands, no local generative
 * image models. See R63 report for topology and gameplay caveats.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
  from './r58-world-blockout.mjs';

const FRAME=QY_BLUEPRINT.coordinateFrame;
const NX=320,NZ=288;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fade=t=>t*t*t*(t*(t*6-15)+10);
const hash=(x,z)=>{
 let a=Math.imul(x|0,374761393)+Math.imul(z|0,668265263);
 a=Math.imul(a^(a>>>13),1274126177);
 return ((a^(a>>>16))>>>0)/4294967295;
};
function noise(x,z){
 const i=Math.floor(x),j=Math.floor(z),u=fade(x-i),v=fade(z-j);
 const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);
 return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
}
function ridged(x,z){
 let total=0,weight=0;
 const scales=[195,94,46,24],powers=[.42,.31,.18,.09];
 for(let i=0;i<scales.length;i++){
  const v=noise(x/scales[i]+i*41.21,z/scales[i]-i*18.4);
  total+=powers[i]*(1-Math.abs(2*v-1));
  weight+=powers[i];
 }
 return total/weight;
}
function segmentDistance(x,z,a,b){
 const dx=b[0]-a[0],dz=b[2]-a[2];
 const len2=dx*dx+dz*dz;
 const t=len2===0?0:clamp(((x-a[0])*dx+(z-a[2])*dz)/len2,0,1);
 return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);
}
function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function plateauMask(x,z){
 let mask=1;
 for(const area of QY_BLUEPRINT.regions){
  const dist=Math.hypot(x-area.place[0],z-area.place[2]);
  const start=area.platformRadiusM*1.12;
  const end=area.platformRadiusM*2.05;
  mask=Math.min(mask,smooth((dist-start)/(end-start)));
 }
 return mask;
}
function pathMask(x,z){
 let nearest=Infinity;
 for(const r of QY_BLUEPRINT.connectivity.requiredRoutes){
  for(let i=0;i<r.regions.length-1;i++){
   const a=QY_BLUEPRINT.regions.find(q=>q.id===r.regions[i]);
   const b=QY_BLUEPRINT.regions.find(q=>q.id===r.regions[i+1]);
   nearest=Math.min(nearest,segmentDistance(x,z,a.place,b.place));
  }
 }
 return smooth((nearest-28)/85);
}
function waterMask(x,z){
 let nearest=Infinity;
 for(const branch of QY_BLUEPRINT.hydrology.branches){
  for(let i=0;i<branch.waypointsXYZ.length-1;i++)
   nearest=Math.min(nearest,segmentDistance(
    x,z,branch.waypointsXYZ[i],branch.waypointsXYZ[i+1]));
 }
 return smooth((nearest-25)/105);
}
export function R63ErosionDetailHeight(baseTerrain,x,z){
 const old=surfaceHeightFromActualTriangle(baseTerrain,x,z);
 const dx=surfaceHeightFromActualTriangle(baseTerrain,x+23,z)-
   surfaceHeightFromActualTriangle(baseTerrain,x-23,z);
 const dz=surfaceHeightFromActualTriangle(baseTerrain,x,z+23)-
   surfaceHeightFromActualTriangle(baseTerrain,x,z-23);
 const slope=Math.hypot(dx,dz)/46;
 // Terrain perturbation respects every real building foundation, route and
 // water corridor. This is visual microrelief only, not collision altitude.
 const mask=plateauMask(x,z)*pathMask(x,z)*waterMask(x,z);
 const cliffWeight=smooth((slope-.12)/.72);
 const base=(ridged(x,z)-.50)*2;
 const broad=(noise(x/600+7,z/600-3)-.5)*2;
 const angle=Math.sin(x*.014+z*.023);
 const striation=Math.sin((x*.13-z*.077)+8*noise(x/105,z/105))*.3;
 const dy=mask===0?0:mask*(6+26*cliffWeight)*
  (.64*base+.18*broad+.18*angle+striation*.18);
 return {
  sourceHeight:old,detailHeight:old+dy,delta:dy,slope,mask,
  lockedAtPlateau:mask===0
 };
}
function slopeColor(height,slope,delta){
 const low=new THREE.Color('#78968b'),rock=new THREE.Color('#6b7f84'),
  grey=new THREE.Color('#90a0a1'),dusk=new THREE.Color('#50666d');
 const k=clamp((height-160)/1310,0,1);
 const c=low.clone().lerp(rock,smooth(k)*.78);
 const cliff=smooth((slope-.19)/.72);
 c.lerp(grey,cliff*.68);
 c.lerp(dusk,clamp((height-1100)/900,0,1)*.32);
 c.multiplyScalar(clamp(1+delta*.009,.72,1.15));
 return c;
}
export function createR63ErodedTerrainDetail(authoritativeTerrain){
 if(!authoritativeTerrain?.geometry?.index)
  throw new Error('R63 requires the true frozen R58 indexed terrain');
 const g=new THREE.BufferGeometry();
 const pos=new Float32Array((NX+1)*(NZ+1)*3);
 const colors=new Float32Array(pos.length);
 const uv=new Float32Array((NX+1)*(NZ+1)*2);
 const tris=new Uint32Array(NX*NZ*6);
 let minDelta=Infinity,maxDelta=-Infinity,maskedVertices=0;
 let maxSlope=0;
 for(let j=0;j<=NZ;j++){
  const z=FRAME.zBounds[0]+j/NZ*FRAME.southNorthExtentM;
  for(let i=0;i<=NX;i++){
   const x=FRAME.xBounds[0]+i/NX*FRAME.eastWestExtentM;
   const q=R63ErosionDetailHeight(authoritativeTerrain,x,z);
   const k=j*(NX+1)+i;
   pos[3*k]=x;pos[3*k+1]=q.detailHeight;pos[3*k+2]=z;
   const c=slopeColor(q.detailHeight,q.slope,q.delta);
   colors[3*k]=c.r;colors[3*k+1]=c.g;colors[3*k+2]=c.b;
   uv[2*k]=i/NX;uv[2*k+1]=j/NZ;
   minDelta=Math.min(minDelta,q.delta);maxDelta=Math.max(maxDelta,q.delta);
   maxSlope=Math.max(maxSlope,q.slope);
   if(q.mask===0)maskedVertices++;
  }
 }
 let idx=0;
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){
  const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;
  tris[idx++]=a;tris[idx++]=c;tris[idx++]=b;
  tris[idx++]=b;tris[idx++]=c;tris[idx++]=d;
 }
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.BufferAttribute(colors,3));
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 g.setIndex(new THREE.BufferAttribute(tris,1));
 g.computeVertexNormals();
 g.computeBoundingSphere();
 const mat=new THREE.MeshStandardMaterial({
  name:'R63_LAYERED_GRANITE_SLOPE_DETAIL_PBR_COLOR',
  vertexColors:true,roughness:.97,metalness:0,
  side:THREE.DoubleSide
 });
 const mesh=new THREE.Mesh(g,mat);
 mesh.name='R63_REFINABLE_EROSION_DETAIL_OVER_R58_SINGLE_CONTINUOUS_TERRAIN';
 mesh.castShadow=false;mesh.receiveShadow=true;
 mesh.userData={
  worldId:QY_BLUEPRINT.freezePolicy.stableMapId,
  independentlyRemovable:true,
  displacementIsVisualOnly:true,
  originalTerrainVerticesUnmodified:true,
  navigationCollisionAuthority:'R58',
  notOfficialSourcePainting:true
 };
 const report={
  revision:'R63',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  visualDetailVertices:pos.length/3,
  visualDetailTriangles:tris.length/3,
  sourceAuthorityVertices:23345,sourceAuthorityTriangles:46080,
  originalAuthorityGeometryChanged:false,
  physicalMountainCount:1,
  maxPositiveReliefM:+maxDelta.toFixed(3),
  maxNegativeReliefM:+minDelta.toFixed(3),
  maxSlopeSample:+maxSlope.toFixed(3),
  zeroReliefProtectiveVertices:maskedVertices,
  artworkApproved:false,
  navigationCollisionCertified:false,
  sourcePaintingImported:false,
  noSquareGrassOrRockOverlay:true
 };
 return {mesh,report,dispose(){g.dispose();mat.dispose();}};
}

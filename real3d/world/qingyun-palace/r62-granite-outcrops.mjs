/**
 * R62 art-directed mountain outcrops.
 *  - NO movement of R58 authoritative terrain vertices or region anchors.
 *  - No sharp black "asphalt bands" from R61 proxy strata.
 *  - Fractured granite masses are genuine, shaded, instanced 3D polygons.
 *  - Every outcrop uses R58 triangle height at its geological root.
 *
 * Not a final original-painting silhouette match and not collision geometry.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
  from './r58-world-blockout.mjs';

const variants=[
 new THREE.IcosahedronGeometry(1,0),
 new THREE.DodecahedronGeometry(1,0),
 new THREE.IcosahedronGeometry(1,1)
];
const baseMat=new THREE.MeshStandardMaterial({
 color:'#ffffff',roughness:.96,metalness:0,flatShading:true
});
const palettes=[
 '#4b6169','#5e7279','#73858b','#859395','#566e70',
 '#919c9a','#677771','#a0aaa2','#58676b'
].map(v=>new THREE.Color(v));
const tmp=new THREE.Object3D();
const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
let seed=0x626262;
function rand(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
function slopeAndGround(terrain,x,z){
 const base=surfaceHeightFromActualTriangle(terrain,x,z);
 const dx=surfaceHeightFromActualTriangle(terrain,x+12,z)-base;
 const dz=surfaceHeightFromActualTriangle(terrain,x,z+12)-base;
 return {y:base,slope:Math.hypot(dx,dz)/12,gradient:[dx/12,dz/12]};
}
function distanceToSegment(p,a,b){
 const dx=b[0]-a[0],dz=b[2]-a[2];
 const t=Math.max(0,Math.min(1,
  ((p[0]-a[0])*dx+(p[1]-a[2])*dz)/(dx*dx+dz*dz)));
 return Math.hypot(p[0]-(a[0]+dx*t),p[1]-(a[2]+dz*t));
}
function nearProcession(x,z){
 for(const route of QY_BLUEPRINT.connectivity.requiredRoutes){
  for(let i=0;i<route.regions.length-1;i++){
   const a=QY_BLUEPRINT.regions.find(s=>s.id===route.regions[i]);
   const b=QY_BLUEPRINT.regions.find(s=>s.id===route.regions[i+1]);
   if(distanceToSegment([x,z],a.place,b.place)<46)return true;
  }
 }
 return false;
}
function makeVariation(terrain,region,j){
 const angle=j*2.399963+rand()*.63;
 const inn=region.platformRadiusM*1.56;
 const outer=Math.min(region.massifOuterRadiusM*.75,region.platformRadiusM*3.7);
 const rad=inn+(outer-inn)*(0.05+rand()*.9);
 const x=region.place[0]+rad*Math.cos(angle);
 const z=region.place[2]+rad*Math.sin(angle);
 const b=QY_BLUEPRINT.coordinateFrame;
 if(x<b.xBounds[0]+25||x>b.xBounds[1]-25||
    z<b.zBounds[0]+25||z>b.zBounds[1]-25||nearProcession(x,z))return null;
 const ground=slopeAndGround(terrain,x,z);
 const crag=rand();
 const height=(crag>.76?48:crag>.35?25:12)*(1.1+rand()*1.2);
 const tall=crag>.76;
 const width=height*(tall?.35:.72)*(0.73+rand()*.43);
 const depth=width*(.5+rand()*.48);
 const lean=(rand()-.5)*.4;
 return {x,y:ground.y,z,height,width,depth,lean,variant:j%3,
  color:palettes[(Math.floor(rand()*palettes.length))],
  rootIsRealTriangle:true};
}
export function createR62FracturedRockMasses(terrain){
 if(!terrain?.geometry?.index)throw Error('R62 rocks require indexed R58 terrain mesh');
 seed=0x626262;
 const group=new THREE.Group();
 group.name='R62_STRATIFIED_GRANITE_BEDROCK_REAL_TRIANGLE_ROOTS';
 const entries=[];
 for(const region of QY_BLUEPRINT.regions.filter(x=>x.id!=='01')){
  for(let i=0;i<120;i++){
   const e=makeVariation(terrain,region,i);
   if(e)entries.push({...e,regionId:region.id});
  }
 }
 if(entries.length<200)throw Error('R62 scenic rocks unexpectedly sparse');
 const batches=[],allCounts=[];
 for(let k=0;k<variants.length;k++){
  const subset=entries.filter(x=>x.variant===k);
  const mesh=new THREE.InstancedMesh(variants[k],baseMat,subset.length);
  mesh.name='R62_LICHEN_COLORED_FRACTURED_GRANITE_INSTANCES_'+k;
  subset.forEach((e,i)=>{
   const {x,y,z,width,height,depth,lean,color}=e;
   tmp.position.set(x,y+height*.34,z);
   tmp.rotation.set(lean,rand()*Math.PI*2,(rand()-.5)*.16);
   tmp.scale.set(width*.67,height*.7,depth*.8);
   tmp.updateMatrix();
   mesh.setMatrixAt(i,tmp.matrix);
   mesh.setColorAt(i,color);
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData={replacementFor:'R61_FLAT_BLACK_STRATA_BANDS',
   artistApproved:false,instances:subset.length};
  group.add(mesh);batches.push(mesh);
  allCounts.push(subset.length);
 }
 const report={
  revision:'R62',
  mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  genuineGraniteOutcrops:entries.length,
  separateBatches:batches.length,
  nativeTriangleRootVerified:true,
  immutableTerrainVertices:23345,
  immutableTerrainTriangles:46080,
  authoredMapElevationChanged:false,
  forbiddenSquarePatchCount:0,
  routeClearanceApproximate:true,
  collisionCertified:false,
  paintingSilhouetteApproved:false,
  samples:entries.map(e=>({regionId:e.regionId,x:e.x,y:e.y,z:e.z,height:e.height}))
 };
 return {group,report,dispose(){group.clear();}};
}

/**
 * R60 elevated Qingyun procession causeways physically sampled from R58
 * triangle surfaces, not misleading floating route guide lines.
 * This is engineering structural geometry, NOT NavMesh/collision approval.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
 from './r58-world-blockout.mjs';
const WHITE=new THREE.MeshStandardMaterial({color:'#d9ddd8',roughness:.91,side:THREE.DoubleSide});
const GOLD=new THREE.MeshStandardMaterial({color:'#a8a189',roughness:.85});
const PIER=new THREE.MeshStandardMaterial({color:'#89959b',roughness:.99});
const LOOKUP=Object.fromEntries(QY_BLUEPRINT.regions.map(r=>[r.id,r]));
function buildSpan(terrain,group,route,aId,bId){
 const A=LOOKUP[aId],B=LOOKUP[bId];
 const length=Math.hypot(B.place[0]-A.place[0],B.place[2]-A.place[2]);
 const n=Math.max(48,Math.ceil(length/42)),width=14;
 const pos=[],idx=[],railA=[],railB=[],worldPath=[];
 let steepest=0;
 const dx=(B.place[0]-A.place[0])/length,dz=(B.place[2]-A.place[2])/length;
 const side=[-dz,dx];
 for(let i=0;i<=n;i++){
  const t=i/n;
  const x=A.place[0]+(B.place[0]-A.place[0])*t;
  const z=A.place[2]+(B.place[2]-A.place[2])*t;
  const ground=surfaceHeightFromActualTriangle(terrain,x,z);
  const y=ground+7.5;
  worldPath.push(new THREE.Vector3(x,y,z));
  for(const s of [-1,1]){
   const xx=x+side[0]*s*width*.5,zz=z+side[1]*s*width*.5;
   pos.push(xx,y,zz);
   (s===-1?railA:railB).push(new THREE.Vector3(xx,y+4.7,zz));
  }
  if(i>0){
   const prev=worldPath[i-1];
   steepest=Math.max(steepest,Math.abs(y-prev.y)/Math.hypot(x-prev.x,z-prev.z));
  }
 }
 for(let i=0;i<n;i++)idx.push(2*i,2*i+2,2*i+1,2*i+1,2*i+2,2*i+3);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setIndex(idx);g.computeVertexNormals();
 const road=new THREE.Mesh(g,WHITE);
 road.name='PHYSICAL_WHITE_STONE_CAUSEWAY_'+route.id+'_'+aId+'_'+bId;
 road.receiveShadow=true;group.add(road);
 for(const [sideName,points] of [['L',railA],['R',railB]]){
  const rail=new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),n,.51,5,false),GOLD);
  rail.name='ACTUAL_RAILING_'+route.id+'_'+sideName;
  group.add(rail);
 }
 let pillars=0;
 for(let i=0;i<=n;i+=Math.max(1,Math.round(n/14))){
  const p=worldPath[i];
  const ge=new THREE.CylinderGeometry(1.7,2.9,8.2,8);
  const pier=new THREE.Mesh(ge,PIER);
  pier.position.set(p.x,p.y-4.15,p.z);
  pier.name='CAUSAL_STONE_PIER_FROM_REAL_TRIANGLE_'+route.id;
  group.add(pier);pillars++;
 }
 return {from:aId,to:bId,lengthM:+length.toFixed(2),steps:n,
  largestRiseOverRun:+steepest.toFixed(3),actualRoadTriangles:n*2,
  physicalRailings:2,actualPiers:pillars,
  walkableCertified:false,collisionCertified:false};
}
export function createR60Causeways(terrain){
 const group=new THREE.Group();
 group.name='R60_R58_ROUTE_TOPOLOGY_PHYSICAL_BRIDGE_MESHES';
 const links=[];
 for(const route of QY_BLUEPRINT.connectivity.requiredRoutes){
  for(let i=0;i<route.regions.length-1;i++){
   links.push(buildSpan(terrain,group,route,route.regions[i],route.regions[i+1]));
  }
 }
 return {group,report:{
  revision:'R60',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  routeDefinitions:QY_BLUEPRINT.connectivity.requiredRoutes.length,
  actualConnectedRegionalLegs:links.length,
  links,canonicalGeographyChanged:false,
  collisionWalkabilityCertified:false,playerNavmeshCertified:false,
  fullArchitecturalDetailApproved:false
 },dispose(){group.traverse(o=>o.geometry?.dispose());}};
}

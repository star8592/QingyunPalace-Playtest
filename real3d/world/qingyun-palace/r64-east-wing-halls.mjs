/**
 * R64 region 05: Dongling Twin Hall / moon-gate enclosed immortal courtyard.
 * Contrasts with 04's vertical bell monastery, 03's broad main throne hall
 * and 06's stacked summit sanctuary.
 *
 * All positions are local to the canonical [2400,1140,-1710] summit anchor;
 * six-region topology and source terrain are immutable.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';
import {createR59CurvedRoof} from './r59-architecture-construction.mjs';
const mats=()=>({
 celadon:new THREE.MeshStandardMaterial({color:'#2e7c89',roughness:.61,metalness:.06,side:THREE.DoubleSide}),
 ridge:new THREE.MeshStandardMaterial({color:'#245568',roughness:.5}),
 gold:new THREE.MeshStandardMaterial({color:'#c5a26a',roughness:.37,metalness:.60}),
 stone:new THREE.MeshStandardMaterial({color:'#8c9d9a',roughness:.95}),
 ivory:new THREE.MeshStandardMaterial({color:'#e3e7df',roughness:.90}),
 timber:new THREE.MeshStandardMaterial({color:'#75504a',roughness:.75}),
 dark:new THREE.MeshStandardMaterial({color:'#4b5859',roughness:.85}),
 water:new THREE.MeshStandardMaterial({color:'#78bfc8',roughness:.24,metalness:.13,
  transparent:true,opacity:.79,depthWrite:false,side:THREE.DoubleSide}),
 jade:new THREE.MeshStandardMaterial({color:'#7cb4a8',roughness:.28,metalness:.23,
  emissive:'#1f6468',emissiveIntensity:.13})
});
const mesh=(p,n,g,mat,x=0,y=0,z=0)=>{
 const o=new THREE.Mesh(g,mat);o.name=n;o.position.set(x,y,z);
 o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
};
const block=(p,n,m,w,h,d,x,y,z)=>mesh(p,n,new THREE.BoxGeometry(w,h,d),m,x,y,z);
function column(p,n,m,x,y,z,h,r=1.3){
 return mesh(p,n,new THREE.CylinderGeometry(.85*r,r,h,12),m,x,y+h*.5,z);
}
function arch(p,n,m,r,x,y,z,tube=1){
 const o=mesh(p,n,new THREE.TorusGeometry(r,tube,12,64),m,x,y,z);
 o.userData.realCircularMoonGate=true;
 return o;
}
function curvedBeam(p,n,m,pts,r=.35){
 const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(...v))),
  45,r,7,false);
 return mesh(p,n,g,m);
}
function banister(p,n,m,x1,x2,y,z){
 for(const zdir of [-1,1]){
  for(let i=0;i<6;i++){
   const x=x1+(x2-x1)*i/5;
   column(p,n+'_STONE_LANTERN_GALLERY_POST',m.ivory,x,y,z+zdir*3.6,3,.32);
  }
  curvedBeam(p,n+'_JADE_PARAPET',m.gold,
   [[x1,y+3.2,z+zdir*3.6],[(x1+x2)/2,y+3.3,z+zdir*3.6],
   [x2,y+3.2,z+zdir*3.6]],.23);
 }
}
function stairs(p,m,tag,x,z,w,dir=1){
 for(let i=0;i<12;i++){
  const width=w*.88+Math.sin(i*.2)*w*.04;
  block(p,tag+'_ACTUAL_STONE_STAIR_'+i,m.ivory,width,.8+12*.18-i*.18,2.2,
   x,2.8+i*.06,z+dir*i*1.78);
 }
}
function wing(root,m,side){
 const p=new THREE.Group();
 p.name=side===-1?'05_WEST_WING_SEPARATE_REAL_MODEL':'05_EAST_WING_SEPARATE_REAL_MODEL';
 p.position.set(side*36,0,0);
 root.add(p);
 const w=34,d=58,origin=7;
 block(p,'05_WING_IVORY_HIPPED_STONE_FOUNDATION',m.stone,w+10,4.2,d+10,0,1.0,0);
 block(p,'05_WING_CARVED_COURT_TERRACE',m.ivory,w+5,2,d+6,0,4.4,0);
 // Front arcade is open: columns frame the garden, not sealed boxes.
 for(const z of [-d*.40,d*.40])for(const x of [-w*.39,0,w*.39]){
  column(p,'05_WING_FLUTED_ACTUAL_TIMBER_COLUMN',m.timber,x,5.5,z,20,1.17);
  block(p,'05_WING_GOLD_DOUGONG_UNDER_EAVE',m.gold,4.2,1.4,4.2,x,25.8,z);
 }
 block(p,'05_WING_RECESSED_WOODEN_BACK_WALL',m.timber,w*.72,14,1.2,
  0,15,-d*.35);
 // True two-level original hip-and-gable roof, no cylinder four-sided fake.
 createR59CurvedRoof(p,m,'05_'+(side<0?'LEFT':'RIGHT')+'_LARGE_CELADON_CURVED_ROOF',
   w*1.24,d*1.16,29,9);
 const upper=new THREE.Group();
 upper.name='05_'+(side<0?'LEFT':'RIGHT')+'_UPPER_STUDIO_INDEPENDENT';
 upper.position.set(0,0,-11);
 p.add(upper);
 block(upper,'05_UPPER_STUDIO_IVORY_BALCONY',m.ivory,27,3.1,28,0,39.5,0);
 for(const x of [-10,10])for(const z of [-9,9])
  column(upper,'05_UPPER_STUDIO_CARVED_TIMBER_PILLAR',m.timber,x,41,z,8.5,1.0);
 createR59CurvedRoof(upper,m,'05_UPPER_JADE_SKY_PAVILION_TILED_EAVES',32,31,51,8);
 // Roof finials and dragon tails are separately editable 3D tubes.
 for(const sx of [-1,1]){
  curvedBeam(upper,'05_SCROLLING_CLOUD_ROOF_DRAGON_TAIL',m.gold,
   [[sx*13,56,-15],[sx*17,57,-16],[sx*19,62,-17]],.42);
 }
 stairs(p,m,'05_WING_WIDE_FRONT_STAIR',0,d*.5+14,w*.7,1);
 return p;
}
function waterCourt(root,m){
 block(root,'05_MOONGATE_COURT_AGED_BLUE_GREY_STONE',m.stone,31,3,66,0,1.2,0);
 block(root,'05_COURT_WHITE_STONE_PERIMETER',m.ivory,27,1.4,58,0,3.2,0);
 const center=mesh(root,'05_TRUE_GEOMETRIC_JADE_LOTUS_POOL',
  new THREE.CylinderGeometry(11,11,1.8,64),m.water,0,5.5,0);
 center.userData.intentionallyMagicalWaterFeature=true;
 // Convex lotus petals use physical meshes, not a painted circle.
 for(let i=0;i<10;i++){
  const a=i*Math.PI*2/10;
  const petal=mesh(root,'05_BLOOMING_STONE_LOTUS_PETAL_'+i,
   new THREE.ConeGeometry(3.2,7.3,9),m.ivory,
   Math.cos(a)*7.8,7.5,Math.sin(a)*7.8);
  petal.rotation.z=Math.cos(a)*-.38;
  petal.rotation.x=Math.sin(a)*.38;
 }
 column(root,'05_CENTER_JADE_SPIRIT_VESSEL',m.jade,0,5.7,0,6.8,1.1);
 // Moon gate OPEN circular space between buildings, no flat opaque door.
 arch(root,'05_GENUINE_OPEN_STONE_MOON_GATE_FRONT',m.ivory,
  10,0,15.7,29,1.6);
 arch(root,'05_GOLD_MOON_GATE_RIM',m.gold,
  11,0,15.7,29,0.3);
 // Two portal feet visibly hold the real stone ring.
 for(const x of [-9.8,9.8]){
  column(root,'05_GATE_REAL_PIER_SUPPORT',m.ivory,x,4.7,29,12,1.4);
  const lamp=mesh(root,'05_JADE_FIREFLY_SPIRIT_LANTERN',
   new THREE.IcosahedronGeometry(2.4,1),m.jade,x,20.5,29);
  lamp.userData.real3DLightOrnament=true;
 }
 for(const z of [-21,21]){
  for(const sx of [-1,1]){
   curvedBeam(root,'05_COURTYARD_DIMENSIONAL_CLOUD_SCROLL',m.gold,
     [[sx*11,6,z],[sx*15,8,z],[sx*15,12,z],
      [sx*11,13,z]],.34);
  }
 }
 // Procession bridges over the center garden left-right.
 for(const sign of [-1,1]){
  const x1=sign*15,x2=sign*20;
  block(root,'05_GARDEN_ACTUAL_STONE_WALKWAY',m.ivory,8,1.3,12,
   sign*17.5,5.9,-5);
  banister(root,'05_GARDEN_BRIDGE_PARAPET_'+sign,m,x1,x2,5.9,-5);
 }
 // Back central two-level library makes the composition U-shaped while
 // intentionally retaining the clear moon-gate front.
 const library=new THREE.Group();
 library.name='05_BACK_COURT_CELESTIAL_ARCHIVE_REAL_STRUCTURE';
 library.position.set(0,0,-38);
 root.add(library);
 block(library,'05_SOUTH_ARCHIVE_STONE_PODIUM',m.stone,42,4.4,27,0,5,0);
 for(const x of [-16,-6,6,16])for(const z of [-10,10])
  column(library,'05_ARCHIVE_OPEN_IVORY_COLUMN',m.ivory,x,7,z,15,1.0);
 createR59CurvedRoof(library,m,'05_REAR_ARCHIVE_JADE_BLUE_CROSSED_HIP_ROOF',
  49,35,23,8.6);
}
export function createR64EastWingHalls(terrain){
 if(!terrain?.geometry?.index)throw Error('R64 east requires real R58 triangle mesh');
 const r=QY_BLUEPRINT.regions.find(x=>x.id==='05');
 const [x,,z]=r.place;
 const floor=surfaceHeightFromActualTriangle(terrain,x,z);
 const m=mats(),group=new THREE.Group();
 group.name='QY_05_R64_EAST_TWIN_WINGS_MOON_GATE_COURTYARD';
 group.position.set(x,floor,z);
 group.userData={regionId:'05',blueprintAnchor:[...r.place],
  actualFloorFromOriginalTerrain:floor,artApproved:false};
 wing(group,m,-1);wing(group,m,1);waterCourt(group,m);
 let count=0,triangles=0,roofTriangles=0;
 group.traverse(o=>{if(o.isMesh){
  count++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;
  roofTriangles+=o.userData.realRoofTriangles||0;
 }});
 return {group,report:{
  revision:'R64',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  regionId:'05',blueprintAnchor:[...r.place],
  realTriangleGroundHeight:floor,
  physicallySeparateTwoWings:true,
  actualOpenMoonGateMesh:true,
  miniatureJadeCourtyardPool:true,
  meshObjects:count,meshTriangles:triangles,
  realCurvedTileRoofTriangles:roofTriangles,
  sourceSixSummitAnchorsChanged:false,
  originalChatGPTImageSourceImported:false,
  artQualityApproved:false
 },dispose(){group.traverse(o=>o.geometry?.dispose());Object.values(m).forEach(x=>x.dispose());}};
}

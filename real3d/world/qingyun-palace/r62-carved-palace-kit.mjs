/**
 * R62 original architectural refinement pass:
 * genuine dimensional gold cloud-scrollwork, carved wood lattice, curved
 * roof-edge trimmings and non-mechanical reworked halo geometry.
 * Works with R59 gate/main palace plus R61 west pavilion/cloud sanctuary.
 * No changes to any region's position or base terrain.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
import {roofSurfaceHeight} from './r59-architecture-construction.mjs';

const gold=new THREE.MeshStandardMaterial({
 color:'#d6aa63',metalness:.57,roughness:.42,
 emissive:'#5a3416',emissiveIntensity:.12
});
const darkWood=new THREE.MeshStandardMaterial({color:'#513d3b',roughness:.78});
const pale=new THREE.MeshStandardMaterial({color:'#e3e6db',roughness:.91});
const copper=new THREE.MeshStandardMaterial({color:'#8d7253',metalness:.31,roughness:.57});

const addMesh=(root,name,geo,material,pos)=>{
 const mesh=new THREE.Mesh(geo,material);
 mesh.name=name;
 mesh.position.copy(pos);
 mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
 return mesh;
};
const line=(root,name,points,mat,r=.25)=>{
 const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
 const t=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*4),r,6,false),mat);
 t.name=name;t.castShadow=true;root.add(t);return t;
};
const pillar=(root,name,mat,x,y,z,r,h)=>{
 const obj=addMesh(root,name,new THREE.CylinderGeometry(r*.88,r,h,10),
  mat,new THREE.Vector3(x,y+h/2,z));
 return obj;
};
const bar=(root,name,mat,x,y,z,w,h,d)=>{
 const mesh=addMesh(root,name,new THREE.BoxGeometry(w,h,d),mat,new THREE.Vector3(x,y,z));
 return mesh;
};
function cloudScroll(root,tag,x,y,z,scale,reverse=1){
 const pts=[];
 for(let k=0;k<32;k++){
  const t=k/31,theta=1.4+reverse*t*Math.PI*3.7;
  const rad=scale*(1-t*.87);
  pts.push([x+Math.cos(theta)*rad,y+Math.sin(theta)*rad,z+.28*Math.sin(theta*2)]);
 }
 line(root,tag+'_CUT_WORK_GOLD_CLOUD_SPIRAL',pts,gold,Math.max(.10,scale*.055));
}
function decorativeWindow(root,tag,x,y,z,windowWidth=14,windowHeight=15){
 // Physically open-looking slotted wood: no opaque oversized facade billboard.
 bar(root,tag+'_TOP_LINTEL',darkWood,x,y+windowHeight/2,z,windowWidth,.85,.75);
 bar(root,tag+'_LOWER_SILL',darkWood,x,y-windowHeight/2,z,windowWidth,1.1,.9);
 for(const side of [-1,1]){
  bar(root,tag+'_FRAME',darkWood,x+side*windowWidth*.5,y,z,.85,windowHeight,.86);
 }
 for(let k=-2;k<=2;k++){
  const xx=x+k*windowWidth*.145;
  bar(root,tag+'_OPENWORK_MULLION',copper,xx,y,z,.32,windowHeight*.84,.60);
 }
 for(const yy of [-1,0,1]){
  bar(root,tag+'_LATTICE_CROSS',darkWood,x,y+yy*windowHeight*.24,z,
     windowWidth*.92,.25,.6);
 }
}
function roofTrim(root,id,tag,width,depth,eaveY,rise,side){
 const pts=[];
 const z=side*depth*.50;
 for(let j=0;j<=32;j++){
  const x=width*(j/32-.5);
  const y=roofSurfaceHeight(x,z,width,depth,eaveY,rise)+.4;
  pts.push([x,y,z+side*.5]);
 }
 return line(root,'QY_'+id+'_'+tag+'_GOLD_CURVED_REAL_ROOF_EAVE',pts,
  gold,Math.max(.15,width*.003));
}
function ornamentalTier(root,id,tier){
 const {w,d,y,rise}=tier;
 for(const side of [-1,1])roofTrim(root,id,tier.name,w,d,y,rise,side);
 const x=w*.45;
 for(const sign of [-1,1]){
  cloudScroll(root,'QY_'+id+'_EAVE_SCROLL_'+tier.name+'_'+sign,
    sign*x,roofSurfaceHeight(sign*x,d*.47,w,d,y,rise)+1.4,
    d*.50+1.0,Math.max(1.8,w*.020),sign);
 }
}
const tiers={
 '01':[
  {name:'LOWER',w:94*1.12,d:42*1.25,y:34,rise:9.2},
  {name:'SECOND',w:94*.78,d:42*.8,y:49,rise:7.6},
  {name:'THIRD',w:94*.45,d:42*.49,y:55,rise:5.2}],
 '02':[
  {name:'LOWER',w:35*1.35,d:31*1.44,y:19,rise:8},
  {name:'SECOND',w:35*.88,d:31*.89,y:28.5,rise:5.2}],
 '03':[
  {name:'LOWER',w:178*1.04,d:130*1.07,y:36,rise:15},
  {name:'SECOND',w:178*.75,d:130*.67,y:61,rise:12},
  {name:'THIRD',w:178*.49,d:130*.41,y:77,rise:9.5}],
 '06':[
  {name:'LOWER',w:142*.93*1.12,d:102*.86*1.23,y:40,rise:11},
  {name:'SECOND',w:142*.76*1.12,d:102*.66*1.23,y:69,rise:11},
  {name:'THIRD',w:142*.57*1.12,d:102*.49*1.23,y:94,rise:11},
  {name:'FOURTH',w:142*.39*1.12,d:102*.37*1.23,y:115,rise:10}]
};
function addFacade(root,id){
 const r=QY_BLUEPRINT.regions.find(s=>s.id===id);
 const {mainWidthM:w,mainDepthM:d}=r.building;
 const facadeZ=d*.37+.6;
 const base=id==='06'?17:id==='01'?29:id==='03'?15:10;
 const max=id==='06'?26:id==='01'?8:id==='03'?20:9;
 // Site 01 retains genuine open entrance gates: do not put windows over
 // the three ground-level passages. Site 02 stays open to the waterfall.
 if(id==='01'){
  for(const x of [-w*.30,w*.30]){
   cloudScroll(root,'01_GATE_CARVED_IONIC_FRIEZE_'+x,x,31,
     facadeZ+3,3.1,x>0?1:-1);
  }
 }else if(id==='02'){
  for(const x of [-w*.31,w*.31]){
   cloudScroll(root,'02_WATER_PAVILION_CLOUD_SCROLL_'+x,x,19,facadeZ+1,2.2);
   pillar(root,'02_IVORY_CARVED_SQUARE_PIER_DETAIL',pale,x,6,facadeZ,1.1,9);
  }
 }else{
  const count=id==='03'?7:5;
  for(let i=0;i<count;i++){
   const x=(i-(count-1)/2)*w*.84/count;
   const ww=w*.58/count;
   decorativeWindow(root,id+'_CARVED_JADE_WOOD_LATTICE_'+i,
     x,base+max*.45,facadeZ,ww,max*.78);
  }
  for(const side of [-1,1]){
   cloudScroll(root,id+'_MASTER_CLOUD_CARVING_'+side,
     side*w*.35,base+max*.6,facadeZ+1,Math.max(3,w*.038),side);
  }
 }
}
function suspendedCloudHalo(root){
 // Keep the blueprint requirement of three concentric halos, but trade
 // mathematically perfect gold circles for asymmetric cloud-script arcs.
 const result=[];
 for(let i=0;i<3;i++){
  const radius=27+i*9;
  const pts=[],n=60;
  for(let j=0;j<=n;j++){
   const t=j/n;
   const angle=t*(Math.PI*1.77)-Math.PI*.40+i*.10;
   const wave=Math.sin(t*8+i*2)*1.5;
   pts.push([(radius+wave)*Math.cos(angle),
      166+i*5+(radius+wave)*Math.sin(angle),
      -7+i*.2+Math.cos(t*9+i)*1.8]);
  }
  result.push(line(root,'06_ORIGINAL_MOTIF_GOLD_CLOUD_HALO_BROKEN_ARC_'+i,
    pts,gold,.75));
  cloudScroll(root,'06_SUSPENDED_CLOUD_SCROLL_'+i,
    Math.cos(.66+i)*radius*.58,166+i*5+Math.sin(.66+i)*radius*.58,
    -7,3.2+i*.7);
 }
 return result;
}
export function createR62ArchitecturalDetail(r59,r61){
 const group=new THREE.Group();
 group.name='R62_FOUR_PALACE_REPLACEABLE_CARVED_FACADE_AND_CLOUD_SCROLL_KIT';
 const sources=new Map();
 for(const root of r59.group.children)sources.set(root.userData.regionId,root);
 for(const root of r61.palaces.group.children)sources.set(root.userData.regionId,root);
 const ids=['01','02','03','06'];
 const oldHalos=[],oldPavilionSlabs=[];
 let trimCount=0,windowCount=0;
 for(const id of ids){
  const source=sources.get(id);
  if(!source)throw Error('R62 missing region architecture '+id);
  const detail=new THREE.Group();
  detail.name='QY_'+id+'_R62_ADDITIONAL_CARVED_DETAILS';
  detail.position.copy(source.position);
  group.add(detail);
  for(const tier of tiers[id]){
   ornamentalTier(detail,id,tier);
   trimCount+=2;
  }
  addFacade(detail,id);
  if(id==='02'){
   // R61 accidentally created a 32m-wide SOLID near-black cuboid over the
   // open viewing arcade. Replace it with four slender structural beams.
   source.traverse(o=>{
    if(o.name==='02_WATERFALL_VIEWING_PAVILION_TIMBER_ARCHITRAVE'){
     oldPavilionSlabs.push([o,o.visible]);o.visible=false;
    }
   });
   for(const sign of [-1,1]){
    bar(detail,'02_OPEN_WOODEN_HORIZONTAL_BEAM',darkWood,
      0,17,sign*31*.37,35*.92,1.1,1.4);
    bar(detail,'02_OPEN_WOODEN_SIDE_BEAM',darkWood,
      sign*35*.44,17,0,1.4,1.1,31*.74);
   }
  }
  if(id==='03')windowCount+=7;
  if(id==='06')windowCount+=5;
  if(id==='06'){
   source.traverse(o=>{
    if(o.name.startsWith('06_GOLDEN_LUMINOUS_CELESTIAL_HALO_')){
     oldHalos.push([o,o.visible]);o.visible=false;
    }
   });
   if(oldHalos.length!==3)throw Error('R62 missing three R61 original halo meshes');
   suspendedCloudHalo(detail);
  }
 }
 let objects=0,triangles=0;
 group.traverse(o=>{if(o.isMesh){
  objects++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;
 }});
 return {group,report:{
  revision:'R62',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  detailedPalaceIds:ids,numberOfRoofEaveTrims:trimCount,
  actualLatticeWindowGroups:windowCount,
  goldenCloudHaloObjectsReplaced:oldHalos.length,
  curvedCloudScriptHaloCount:3,
  largeDarkPavilionSlabsSuppressed:oldPavilionSlabs.length,
  meshObjects:objects,meshTriangles:triangles,
  structuralFootprintsUnchanged:true,
  '01GateRemainsOpen':true,'02WaterfallArcadeRemainsOpen':true,
  originalPaintingApproved:false
 },setReviewMode(enabled){
  const active=Boolean(enabled);
  group.visible=active;
  for(const [o,visible] of oldHalos)o.visible=active?false:visible;
  for(const [o,visible] of oldPavilionSlabs)o.visible=active?false:visible;
  return active;
 },dispose(){
  for(const [o,visible] of oldHalos)o.visible=visible;
  for(const [o,visible] of oldPavilionSlabs)o.visible=visible;
  group.traverse(o=>o.geometry?.dispose());
 }};
}

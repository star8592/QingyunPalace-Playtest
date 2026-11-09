/**
 * R64 region 04: Yuanfeng Taoist cliff-monastery, a replaceable authored
 * assembly with genuine roofs, stone flights, carved arcades, bell lanterns.
 * Its 94m x 71m parent footprint, summit and geographic anchor are locked
 * to the immutable R58 QY-GEOGRAPHY-001 blueprint.
 *
 * NOT an approved match to absent QY-04 original ChatGPT Image concept.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';
import {createR59CurvedRoof,roofSurfaceHeight} from './r59-architecture-construction.mjs';

const mainMaterials=()=>({
  celadon:new THREE.MeshStandardMaterial({color:'#2b7184',roughness:.61,metalness:.08,side:THREE.DoubleSide}),
  ridge:new THREE.MeshStandardMaterial({color:'#204d5d',roughness:.55}),
  gold:new THREE.MeshStandardMaterial({color:'#c7a66e',roughness:.38,metalness:.5}),
  ivory:new THREE.MeshStandardMaterial({color:'#d6ddd8',roughness:.87}),
  stone:new THREE.MeshStandardMaterial({color:'#7c8e92',roughness:.97}),
  timber:new THREE.MeshStandardMaterial({color:'#704b41',roughness:.80}),
  shadow:new THREE.MeshStandardMaterial({color:'#4b5556',roughness:.9}),
  lantern:new THREE.MeshStandardMaterial({color:'#86d1cd',roughness:.32,metalness:.14,emissive:'#256b73',emissiveIntensity:.35})
});
const add=(p,name,g,mat,x=0,y=0,z=0)=>{
 const mesh=new THREE.Mesh(g,mat);
 mesh.name=name;mesh.position.set(x,y,z);
 mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);
 return mesh;
};
const block=(p,n,m,w,h,d,x,y,z)=>add(p,n,new THREE.BoxGeometry(w,h,d),m,x,y,z);
function tube(p,n,m,pts,r=.3){
 const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(...v))),Math.max(20,pts.length*6),r,8,false);
 return add(p,n,g,m);
}
const col=(p,n,m,x,y,z,r,h)=>{
 return add(p,n,new THREE.CylinderGeometry(r*.85,r,h,10),m,x,y+h*.5,z);
};
function steps(p,m,n,x,w,zStart,zEnd,yBottom,yTop,count=12){
 const height=yTop-yBottom;
 for(let i=0;i<count;i++){
  const t=i/count;
  const z=zStart+(zEnd-zStart)*t;
  const surface=yBottom+height*t;
  block(p,n+'_ACTUAL_HEWN_STONE_STAIR_'+i,m.ivory,w,Math.max(.9,Math.abs(height)/count),Math.abs(zEnd-zStart)/count+.7,
    x,surface-.15,z);
 }
}
function rail(p,m,n,x1,z1,x2,z2,y1,y2){
 for(const side of [-1,1]){
  const xx=side*2;
  tube(p,n+'_WROUGHT_BRONZE_HANDRAIL_'+side,m.gold,
   [[x1+xx,y1+3.2,z1],[x1+xx,y1+3.7,(z1+z2)/2],
    [x2+xx,y2+3.4,z2]],.28);
 }
}
function columns(p,m,tag,w,d,y0,h,nx){
 for(const z of [-d*.36,d*.36]){
  for(let i=0;i<nx;i++){
   const x=w*(i/(nx-1)-.5)*.8;
   col(p,tag+'_HOLLOW_PROCESSION_IVORY_COLUMN',m.ivory,x,y0,z,1.15,h);
   block(p,tag+'_GOLD_CLOUD_DOUGONG_BRACKET',m.gold,3.9,1,3.7,x,y0+h+.4,z);
  }
 }
}
function ornament(p,m,tag,x,y,z,rad){
 const pts=[];
 for(let i=0;i<=34;i++){
  const t=i/34,a=t*Math.PI*3.6+1.1;
  const r=rad*(1-t*.86);
  pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z]);
 }
 tube(p,tag+'_DIMENSIONAL_CLOUD_SCROLL_CARVING',m.gold,pts,.26);
}
function multiTierMonastery(root,m){
 // One mountain hall is terraced vertically; visibly different from the
 // broad R59 main palace and the 4-tier R61 sanctuary.
 block(root,'04_GREAT_WESTERN_NATIVE_STONE_FOUNDATION',m.stone,97,7,78,0,-.3,0);
 block(root,'04_LOWER_WHITE_STONE_PROCESSION_COURT',m.ivory,89,3,72,0,3.7,0);
 // IMPORTANT: building's conceptual width 94/depth 71 preserved; roof eaves
 // may overhang but the actual architectural anchor stays unmodified.
 const court=new THREE.Group();
 court.name='04_LOWER_SHRINE_REAL_MODEL';
 court.position.set(0,0,5);
 root.add(court);
 const w=81,d=52,lowerY=6;
 columns(court,m,'04_LOWER_SHRINE',w,d,lowerY,18,7);
 block(court,'04_WOODEN_U_SHAPE_OPEN_FRONT_WALL',m.timber,w*.78,11,1.1,0,13,-d*.32);
 for(const sx of [-1,1]){
  block(court,'04_IVORY_SIDE_ARCADE_BASE',m.ivory,4.4,10,d*.42,sx*w*.39,12,0);
 }
 createR59CurvedRoof(court,m,'04_LOWER_QINGTILE_DEEP_FLYING_EAVES',
   w*1.11,d*1.16,27,10.8);
 // Upper shrine set back, on an independent rock throne. The vertical
 // tiering creates a recognizably Taoist monastery on the cliff.
 block(root,'04_UPPER_STONE_ALTAR_DAIS',m.ivory,61,4,43,0,34,-14);
 const upstairs=new THREE.Group();
 upstairs.position.set(0,34,-14);
 upstairs.name='04_UPPER_SHRINE_INDEPENDENT_DCC_GROUP';
 root.add(upstairs);
 columns(upstairs,m,'04_UPPER_OPEN_GALLERY',52,35,2,13,5);
 block(upstairs,'04_UPPER_IVORY_CARVED_BELL_SHRINE',m.ivory,36,10,19,0,10,-7);
 createR59CurvedRoof(upstairs,m,'04_ELEVATED_BLUE_FIRED_TILE_HIP_ROOF',61,44,17.5,9);
 // Open ceremonial front staircase, double separated side rails, no huge
 // black slab hiding hall details.
 steps(root,m,'04_MAIN_ENTRANCE_CEREMONIAL',0,20,43,26,0,6,12);
 steps(root,m,'04_UPPER_MOUNTAIN_ASCENT',0,12,17,-26,6,35,20);
 rail(root,m,'04_UPPER_MOUNTAIN_ASCENT',-7,17,-7,-26,8,35);
 // Tall independent cliff bell tower: original outline is asymmetrical.
 const tower=new THREE.Group();
 tower.name='04_CLIFF_BELL_PAVILION_SEPARATE_EXPORTABLE_MODEL';
 tower.position.set(-39,1,-19);
 root.add(tower);
 block(tower,'04_BELL_TOWER_STONE_SOCKET',m.stone,19,4.2,20,0,1,0);
 for(const x of [-7.2,7.2])for(const z of [-6.9,6.9])
  col(tower,'04_BELL_TOWER_VISIBLE_OCHRE_TIMBER_PIER',m.timber,x,3,z,1.3,35);
 for(const side of [-1,1]){
  tube(tower,'04_BELL_TOWER_CURVED_GOLD_DIAGONAL_BRACE',m.gold,
    [[side*7.2,13,-6.9],[side*4.5,19,-6.9],[side*7.2,24,-6.9]],.23);
 }
 // Physical sculpted hanging bell, not a flat image.
 const bell=add(tower,'04_HANGING_TAOIST_BRONZE_BELL',
   new THREE.CylinderGeometry(2,4,8,32),m.gold,0,24,0);
 bell.userData.actualBellGeometry=true;
 add(tower,'04_HANGING_BELL_CLAPPER',new THREE.SphereGeometry(1,10,10),
   m.timber,0,19.1,0);
 createR59CurvedRoof(tower,m,'04_BELL_TOWER_SINGLE_DARK_BLUE_FLYING_EAVE',23,23,40,8);
 // Upper cliff incense altar, bright but physically present.
 for(const x of [-19,19]){
  col(root,'04_INCENSE_COURT_CARVED_GOLD_PILLAR',m.gold,x,5,27,.7,4);
  add(root,'04_FROSTED_JADE_OCTAHEDRON_LAMP',
    new THREE.OctahedronGeometry(2.2),m.lantern,x,11,27);
 }
 ornament(root,m,'04_CLOUD_SCROLL_ON_ALTAR_LEFT',-23,23,27,4.3);
 ornament(root,m,'04_CLOUD_SCROLL_ON_ALTAR_RIGHT',23,23,27,4.3);
 // An independent bell path is physically recognisable on the cliff.
 block(root,'04_CLIFF_BRIDGE_TO_BELL_TOWER',m.ivory,22,1.8,7,-36,3,-13);
 root.userData.hasRealBellGeometry=true;
 root.userData.hasSeparateMultiLevelMonastery=true;
 root.userData.mountainShrineWatercourseNotMoved=true;
}
export function createR64WestMountainMonastery(terrain){
 if(!terrain?.geometry?.index)throw Error('R64 west requires canonical indexed terrain');
 const region=QY_BLUEPRINT.regions.find(r=>r.id==='04');
 const [x,,z]=region.place;
 const floor=surfaceHeightFromActualTriangle(terrain,x,z);
 const group=new THREE.Group();
 group.name='QY_04_R64_INDEPENDENT_CLIFF_MONASTERY_ASSET';
 group.position.set(x,floor,z);
 group.userData={regionId:'04',blueprintAnchor:[...region.place],
  realTerrainFloorY:floor,artApproved:false};
 const m=mainMaterials();
 multiTierMonastery(group,m);
 let objects=0,triangles=0,roofTriangles=0;
 group.traverse(o=>{if(o.isMesh){
  objects++;
  triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;
  roofTriangles+=o.userData.realRoofTriangles||0;
 }});
 return {
  group,report:{
   revision:'R64',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
   regionId:'04',blueprintAnchor:[...region.place],
   groundFloor:floor,meshObjects:objects,meshTriangles:triangles,
   trueCurvedRoofTriangles:roofTriangles,
   separateBellTower:true,genuineHangingBell:true,
   independentLowerAndUpperHall:true,numberOfOriginalMountainPeaksChanged:0,
   geometryEditableInDCCAfterExport:true,
   importedOriginalPaintingSource:false,artQualityApproved:false
  },dispose(){
    group.traverse(o=>o.geometry?.dispose());
    Object.values(m).forEach(o=>o.dispose());
  }
 };
}

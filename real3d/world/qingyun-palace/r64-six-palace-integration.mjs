/**
 * Qingyun R64: six physical architecture clusters on ONE immutable geography.
 * 01/03 from R59, 02/06 from R61, and new 04/05 from dedicated R64 sources.
 *
 * Reversible source-preserving comparison with old R58 04/05 white blockouts.
 * Reuses the EIGHT verified R20 PBR maps held by R63; not separate rasters.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT} from './r58-world-blockout.mjs';
import {createR64WestMountainMonastery} from './r64-west-mountain-monastery.mjs';
import {createR64EastWingHalls} from './r64-east-wing-halls.mjs';

function materialKind(o){
 if(!o.isMesh)return null;
 const s=o.name.toUpperCase();
 if(s.includes('LANTERN')||s.includes('JADE')||s.includes('LOTUS_PETAL')||
  s.includes('WATER')||s.includes('POOL')||s.includes('GOLD')||
  s.includes('CLOUD_SCROLL')||s.includes('BELL')||s.includes('BRONZE'))return null;
 if(s.includes('ROOF')||s.includes('EAVE')||s.includes('TILE')||
    s.includes('RIDGE'))return 'roof';
 if(s.includes('TIMBER')||s.includes('WOOD')||s.includes('BEAM')||
    s.includes('LATTICE')||s.includes('ARCHITRAVE'))return 'wood';
 if(s.includes('STONE')||s.includes('PILLAR')||s.includes('COLUMN')||
    s.includes('TERRACE')||s.includes('SHRINE')||
    s.includes('ALTAR')||s.includes('FOUNDATION')||
    s.includes('DAIS')||s.includes('STAIR')||
    s.includes('IVORY')||s.includes('PIER'))return 'stone';
 return null;
}
export function createR64CompleteSixPalaceArchitecture({world,r59,r61,r63}){
 if(!world?.terrain?.mesh||!r59?.group||!r61?.palaces?.group||
   !r63?.materials?.materials)throw Error('R64 requires R58 terrain, R59 and R61 buildings, R63 real PBR');
 const west=createR64WestMountainMonastery(world.terrain.mesh);
 const east=createR64EastWingHalls(world.terrain.mesh);
 const group=new THREE.Group();
 group.name='QINGYUN_R64_ALL_SIX_REGIONS_ACTUAL_REPLACEABLE_PALACE_ARCHITECTURE';
 group.add(west.group,east.group);
 const oldBlockouts=world.architecture.group.children
  .filter(x=>['04','05'].includes(x.userData.regionId));
 if(oldBlockouts.length!==2)throw Error('R64 found missing or duplicated 04/05 original blockouts');
 const oldStates=oldBlockouts.map(o=>[o,o.visible]);
 const skins=[];
 const counts={roof:0,stone:0,wood:0};
 for(const root of group.children)root.traverse(o=>{
  const kind=materialKind(o);
  if(!kind)return;
  skins.push({mesh:o,original:o.material,kind});
  counts[kind]++;
 });
 if(counts.roof<10||counts.stone<20||counts.wood<5)
  throw Error('R64 PBR binding incomplete '+JSON.stringify(counts));
 let enabled=false,usePBR=true;
 function setPBR(on){
  usePBR=!!on;
  for(const entry of skins){
   entry.mesh.material=usePBR?r63.materials.materials[entry.kind]:entry.original;
  }
  return usePBR;
 }
 function setReviewMode(active){
  enabled=!!active;
  group.visible=enabled;
  for(const [o,old] of oldStates)o.visible=enabled?false:old;
  return enabled;
 }
 setPBR(true);setReviewMode(true);
 let allTriangles=0,allObjects=0;
 group.traverse(o=>{if(o.isMesh){
  allObjects++;
  allTriangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;
 }});
 const report={
  revision:'R64',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  allSixRegionIdsModelled:['01','02','03','04','05','06'],
  originalGeometryFromR59:['01','03'],
  originalGeometryFromR61:['02','06'],
  newlyAuthored:['04','05'],
  original04And05WhiteBlockoutsReversible:true,
  threeDimensionalWest:west.report,
  threeDimensionalEast:east.report,
  actualNewMeshObjectCount:allObjects,
  actualNewMeshTriangles:allTriangles,
  actualReusedR63PBRMapCount:r63.materials.report.textureMapCount,
  newPBRBoundMaterialAssignments:counts,
  newBitmapAssetsGenerated:0,
  oneOriginalWorldMapIdOnly:true,
  sixAnchorCoordinatesAltered:false,
  originalChatGPTImageConceptComparisonComplete:false,
  allSixArtQualityCertified:false,
  allSixPlayerNavigationCertified:false,
  BlenderNativeImportVerified:false,
  releasedToPublic:false
 };
 return {group,west,east,report,setReviewMode,setPBR,dispose(){
   setPBR(false);
   for(const [o,old] of oldStates)o.visible=old;
   west.dispose();east.dispose();
 }};
}

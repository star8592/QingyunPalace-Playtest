/** R81 production-candidate integration: 790 authentic R72 cut tiles, 12 static
 * merged PBR meshes, original R59/R76/R78 roof and 6,328 tile slots retained.
 *
 * The legacy 790 overlapping instance slots are masked ONLY after every
 * GLB mesh, material, original index and geometric position has passed checks.
 * No live deployment or automatic art approval.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createR74CentralHallDrainageAlignedRoof}
 from './r74-hip-roof-true-tile-laying.mjs';

const URLS={
 B:new URL('../../art/r81-native-hip-tiles/export/R81-03-B-SIX-MERGED-TRUE-HIP-TILE-GLB.glb',import.meta.url).href,
 C:new URL('../../art/r81-native-hip-tiles/export/R81-03-C-SIX-MERGED-TRUE-HIP-TILE-GLB.glb',import.meta.url).href
};
const MANIFEST_URL=new URL(
 '../../art/r81-native-hip-tiles/export/R81-03-TRUE-HIP-TILES-ASSET-MANIFEST.json',
 import.meta.url).href;
const must=(x,s)=>{if(!x)throw Error('R81 '+s)};
const tierNames=['lower','middle','upper'];
const cutKinds=['barrel','pan'];
export async function createR81MergedTrueHipTiles({
 world,upgrade,baseLoader=new GLTFLoader(),bakedLoader=new GLTFLoader(),
 bakedUrls=URLS,manifest=null,manifestUrl=MANIFEST_URL
}={}){
 let original=null;
 const prepared=[];
 const changes=[];
 let mergedObjects=[];
 try{
  original=await createR74CentralHallDrainageAlignedRoof({
   world,upgrade,loader:baseLoader
  });
  if(!manifest){
   const response=await fetch(manifestUrl);
   must(response.ok,'native GLB asset manifest HTTP '+response.status);
   manifest=await response.json();
  }
  must(manifest?.revision==='R81'&&
   manifest.canonicalMap==='QY-GEOGRAPHY-001'&&
   manifest.totalClosedTrimmedTiles===790&&
   manifest.totalGLBMeshes===12,
   'authentic R81 batch manifest not certified');
  must(manifest.variants.B?.actualTrimmedTiles===398&&
   manifest.variants.C?.actualTrimmedTiles===392,
   'native B/C crossing counts changed');
  const loaded=Object.fromEntries(await Promise.all(
   ['B','C'].map(async mode=>[mode,await bakedLoader.loadAsync(bakedUrls[mode])])
  ));
  const root=upgrade.group.children.find(o=>o.userData?.regionId==='03');
  must(root,'R59 original central 03 hall missing');
  for(const mode of ['B','C']){
   const scene=loaded[mode].scene;
   scene.updateMatrixWorld(true);
   const spec=manifest.variants[mode];
   must(spec.meshNodeCount===6&&spec.parts?.length===6,
    'all six native Blender B/C merged meshes required');
   let modeTotal=0;
   const seen=new Set();
   for(const tier of tierNames)for(const kind of cutKinds){
    const part=spec.parts.find(p=>p.tier===tier&&p.kind===kind);
    must(part&&part.closedAfterJoin&&part.uvLayers>=1,
     'R81 Blender watertight/UV certificate missing '+mode+tier+kind);
    const nodeName='R81_'+mode+'_'+tier+'_'+kind+'_SEALED_HIP_TILES';
    must(part.meshNode===nodeName,'unexpected generated Blender mesh name');
    const matches=[];
    scene.traverse(o=>{if(o.isMesh&&o.name===nodeName)matches.push(o)});
    must(matches.length===1,'missing unique R81 native GLB mesh '+nodeName);
    const native=matches[0];
    const mat=Array.isArray(native.material)?native.material[0]:native.material;
    must(native.geometry?.getAttribute('position')?.count>100 &&
     native.geometry.getAttribute('uv')?.count>100,
     'merged native Blender geometric/UV data invalid '+nodeName);
    must(mat?.map&&mat?.roughnessMap&&mat?.normalMap,
     'real photographic PBR material lost '+nodeName);
    const group=root.children.find(o=>o.name===
     'R74_03_MAIN_HALL_FOUR_FACE_REAL_DRAINAGE_TILES_'+tier+'_'+mode);
    must(group,'R78 original tile group missing '+nodeName);
    const inst=group.children.find(o=>o.isInstancedMesh&&
     o.name.includes('_'+kind.toUpperCase()+'_DRAINAGE_ALIGNED_CLOSED_TILES'));
    must(inst,'original unchanged tile instanced mesh missing '+nodeName);
    const indices=part.originalInstanceIndices;
    must(Array.isArray(indices)&&indices.length===part.tileCount&&
     new Set(indices).size===indices.length,
     'original tile instance-index list missing/duplicate');
    for(const index of indices){
     must(Number.isInteger(index)&&index>=0&&index<inst.count,
      'instance index outside original '+nodeName);
     const identity=mode+'/'+tier+'/'+kind+'/'+index;
     must(!seen.has(identity),'R81 double masked source index');
     seen.add(identity);
    }
    // GLB nodes may have export-space transforms. Bake the FULL imported
    // matrix into geometry so old and new tiles use the identical root-local
    // coordinate frame before any original InstancedMesh is masked.
    const geo=native.geometry.clone();
    geo.applyMatrix4(native.matrixWorld);
    geo.computeBoundingBox();
    const box=geo.boundingBox;
    const testMatrix=new THREE.Matrix4(),pos=new THREE.Vector3();
    for(const index of indices){
     inst.getMatrixAt(index,testMatrix);
     pos.setFromMatrixPosition(testMatrix);
     const margin=6;
     must(pos.x>=box.min.x-margin&&pos.x<=box.max.x+margin&&
      pos.y>=box.min.y-margin&&pos.y<=box.max.y+margin&&
      pos.z>=box.min.z-margin&&pos.z<=box.max.z+margin,
      'native baked tile coordinate frame does not match original instanced roof '+nodeName);
    }
    const mesh=new THREE.Mesh(geo,mat);
    mesh.name=nodeName+'_R81_ROOT_LOCAL';
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
    mesh.userData={nativeR72PhotographicPBR:true,hipCutSealed:true,
     fromMergedBlenderGLB:true,tileCount:indices.length,
     preservedOriginalInstancedMesh:true};
    prepared.push({inst,group,indices,mesh,mode,tier,kind});
    modeTotal+=indices.length;
   }
   must(modeTotal===spec.actualTrimmedTiles,'B/C native GLB actual tile totals wrong');
  }
  // Only after all the imported mesh/node/material/index/placement evidence
  // passes may we suppress the old crossed-boundary instances.
  const zero=new THREE.Matrix4().makeScale(0,0,0);
  for(const item of prepared){
   for(const index of item.indices){
    const oldMatrix=new THREE.Matrix4();
    item.inst.getMatrixAt(index,oldMatrix);
    changes.push({inst:item.inst,index,matrix:oldMatrix});
    item.inst.setMatrixAt(index,zero);
   }
   item.inst.instanceMatrix.needsUpdate=true;
   item.group.add(item.mesh);
   mergedObjects.push(item);
  }
  const restoration=()=>{for(const {inst,index,matrix} of changes){
   inst.setMatrixAt(index,matrix);inst.instanceMatrix.needsUpdate=true;
  }};
  const cleanup=()=>{
   restoration();
   for(const {group,mesh} of mergedObjects){
    group.remove(mesh);mesh.geometry.dispose();
   }
   mergedObjects=[];
  };
  const report={...original.report,
   revision:'R81',nativeRealBlenderHipTileTrimmed:true,
   actualRemovedOldCrossSlopeInstances:790,
   bakedClosedTrueHipTileCount:790,
   compiledMergedNativePBRMeshes:12,
   B:{trimmed:398,remainingOriginalPhysicalInstances:5930},
   C:{trimmed:392,remainingOriginalPhysicalInstances:5936},
   nativeR72OriginalGLBMeshesUntouched:true,
   originalSourceR59RoofRestorable:true,
   exactGLBChromeArtworkCertified:false,
   sourceArtApproved:false,
   WebGLHardwareFPSCertified:false,releasedToPlayers:false
  };
  return {...original,report,dispose(){
   cleanup();original.dispose();
   const mats=new Set();
   for(const item of prepared)mats.add(item.mesh.material);
   for(const mat of mats){
    for(const key of ['map','normalMap','roughnessMap','aoMap'])
     mat[key]?.dispose?.();
    mat.dispose?.();
   }
  }};
 }catch(error){
  for(const {inst,index,matrix} of changes){
   inst.setMatrixAt(index,matrix);inst.instanceMatrix.needsUpdate=true;
  }
  for(const item of mergedObjects){
   item.group.remove(item.mesh);
  }
  for(const item of prepared)item.mesh.geometry.dispose();
  original?.dispose();
  throw error;
 }
}

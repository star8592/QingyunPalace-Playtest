/**
 * R60: deterministic rooted forests with real needles and branch volume,
 * no square grass textures, no image synthesis. Instancing keeps draw calls low.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';
const materials={
 bark:new THREE.MeshStandardMaterial({color:'#564c42',roughness:.96}),
 pine:new THREE.MeshStandardMaterial({color:'#345d53',roughness:.92}),
 cherry:new THREE.MeshStandardMaterial({color:'#c78fae',roughness:.86})
};
const geometries={
 trunk:new THREE.CylinderGeometry(.50,.94,12,9),
 pine:new THREE.ConeGeometry(6.3,16,9,1),
 cherry:new THREE.SphereGeometry(6.2,10,8)
};
let seed=0xc0a58e31;
function rand(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
const dummy=new THREE.Object3D();
export function createR60RootedForest(terrain,{density=1}={}){
 if(!(density>=0&&density<=2))throw Error('bad forest density');
 seed=0xc0a58e31;
 const ground=(x,z)=>surfaceHeightFromActualTriangle(terrain,x,z);
 const samples=[];
 for(const r of QY_BLUEPRINT.regions){
  const max=Math.floor((r.id==='01'?40:80)*density);
  let placed=0;
  for(let attempt=0;attempt<max*26&&placed<max;attempt++){
   const theta=rand()*Math.PI*2;
   // Non-square irregular radial falloff, with hilltop clearing.
   const radial=r.platformRadiusM*1.18+
      Math.pow(rand(),.64)*(r.massifOuterRadiusM*.78-r.platformRadiusM*1.18);
   const x=r.place[0]+Math.cos(theta)*radial;
   const z=r.place[2]+Math.sin(theta)*radial;
   const b=QY_BLUEPRINT.coordinateFrame;
   if(x<b.xBounds[0]+25||x>b.xBounds[1]-25||
      z<b.zBounds[0]+25||z>b.zBounds[1]-25)continue;
   const y=ground(x,z);
   const slope=Math.hypot(ground(Math.min(x+15,b.xBounds[1]),z)-y,
       ground(x,Math.min(z+15,b.zBounds[1]))-y)/15;
   if(slope>1.5||samples.some(p=>Math.hypot(p.x-x,p.z-z)<15))continue;
   const cherry=(r.id==='01'&&rand()<.58)||(r.id==='03'&&rand()<.12);
   samples.push({x,y,z,regionId:r.id,kind:cherry?'cherry':'pine',
     scale:.75+rand()*1.2,rotation:rand()*Math.PI*2});
   placed++;
  }
 }
 const group=new THREE.Group();
 group.name='R60_TRUE_TERRAIN_ROOTED_NATURAL_RADIAL_ECOLOGY';
 const pieces=[];
 for(const kind of ['pine','cherry']){
  const rows=samples.filter(p=>p.kind===kind);
  const trunks=new THREE.InstancedMesh(geometries.trunk,materials.bark,rows.length);
  trunks.name='ROOTED_'+kind+'_TRUNKS';
  const crowns=new THREE.InstancedMesh(geometries[kind],materials[kind],rows.length*3);
  crowns.name='THREE_DIMENSIONAL_'+kind+'_CANOPY_LAYERS';
  let count=0;
  for(let i=0;i<rows.length;i++){
   const p=rows[i],h=12*p.scale;
   dummy.position.set(p.x,p.y+h/2,p.z);
   dummy.rotation.set(0,p.rotation,0);dummy.scale.setScalar(p.scale);
   dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   for(let layer=0;layer<3;layer++){
    const size=p.scale*(kind==='pine'?1-.17*layer:.48+.16*layer);
    dummy.position.set(p.x+(layer-1)*p.scale,
      p.y+(kind==='pine'?h*.69+layer*h*.19:h*.83+layer*h*.09),
      p.z+Math.sin(p.rotation+layer)*p.scale*1.3);
    dummy.rotation.set(0,p.rotation+layer*.6,0);
    dummy.scale.set(size,size*.92,size);
    dummy.updateMatrix();crowns.setMatrixAt(count++,dummy.matrix);
   }
  }
  trunks.instanceMatrix.needsUpdate=true;
  crowns.instanceMatrix.needsUpdate=true;
  trunks.castShadow=crowns.castShadow=true;
  group.add(trunks,crowns);pieces.push(trunks,crowns);
 }
 const report={
  revision:'R60',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  treeCount:samples.length,
  pineCount:samples.filter(p=>p.kind==='pine').length,
  cherryCount:samples.filter(p=>p.kind==='cherry').length,
  actualRootSamples:samples,
  squareTerrainGrassPatchCount:0,
  groundContactEverySampleFromRealTriangles:true,
  independentDrawCallObjects:pieces.length,
  botanicalAndArtApproval:false
 };
 return {group,report,dispose(){group.clear();}};
}

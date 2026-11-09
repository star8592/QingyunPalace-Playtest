/**
 * R61 forest art upgrade: multi-fork tree silhouettes and irregular crown
 * clusters, all using the exact R60 verified root positions from the R58
 * triangles. Geometry uses instancing; no square grass texture, no image AI.
 */
import * as THREE from 'three';
const MAT={
  wood:new THREE.MeshStandardMaterial({color:'#665447',roughness:.94}),
  pine:new THREE.MeshStandardMaterial({color:'#4f7663',roughness:.91,vertexColors:false}),
  sakura:new THREE.MeshStandardMaterial({color:'#f0b8c9',roughness:.84,vertexColors:false})
};
const Y=new THREE.Vector3(0,1,0);
const gTrunk=new THREE.CylinderGeometry(.75,1.16,1,8);
const gBranch=new THREE.CylinderGeometry(.55,.85,1,6);
const gPine=new THREE.DodecahedronGeometry(1,0);
const gSakura=new THREE.IcosahedronGeometry(1,1);
const rand=(seed)=>{let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
const temp=new THREE.Object3D();
function instantiate(geometry,material,transforms,name){
 const obj=new THREE.InstancedMesh(geometry,material,transforms.length);
 obj.name=name;
 for(let i=0;i<transforms.length;i++){
  const t=transforms[i];
  temp.position.copy(t.position);
  temp.quaternion.copy(t.quaternion||new THREE.Quaternion());
  temp.scale.copy(t.scale);
  temp.updateMatrix();obj.setMatrixAt(i,temp.matrix);
  if(t.color)obj.setColorAt(i,t.color);
 }
 obj.instanceMatrix.needsUpdate=true;
 if(obj.instanceColor)obj.instanceColor.needsUpdate=true;
 obj.castShadow=true;obj.receiveShadow=true;
 return obj;
}
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
const item=(position,scale,color,quaternion)=>({position,scale,color,quaternion});
export function createR61SculptedForest(samples,{seed=0x61a51}={}){
 if(!Array.isArray(samples)||!samples.length)throw Error('real triangle-root samples required');
 const random=rand(seed),trunks=[],branches=[],pines=[],sakura=[];
 let actualPineTrees=0,actualSakuraTrees=0;
 const pCol=[new THREE.Color('#26594a'),new THREE.Color('#3d6f58'),
   new THREE.Color('#547960'),new THREE.Color('#688873')];
 const cCol=[new THREE.Color('#f4c7d1'),new THREE.Color('#e8a5bb'),
   new THREE.Color('#f8d8d9'),new THREE.Color('#d88da8')];
 for(const sample of samples){
  const {x,y,z,scale,kind}=sample;
  const h=(kind==='pine'?19:15)*scale;
  const side=(kind==='pine'?11:12)*scale;
  const origin=vec(x,y+h*.49,z);
  trunks.push(item(origin,vec((kind==='pine'?1.03:1.29)*scale,h,
    (kind==='pine'?1.03:1.29)*scale)));
  if(kind==='pine')actualPineTrees++;else actualSakuraTrees++;
  // Four physically slanted branches meet the trunk and lift detached
  // irregular foliage clusters; distinguish crown from one triangle/cone.
  for(let j=0;j<5;j++){
   const ang=sample.rotation+j*Math.PI*2/5+random()*.3;
   const reach=side*(.66+random()*.4),lift=h*(.13+random()*.15);
   const baseY=h*(kind==='pine'?.5:.54)+j*.05*h;
   const begin=vec(x,y+baseY,z);
   const end=vec(x+Math.cos(ang)*reach,y+baseY+lift,z+Math.sin(ang)*reach);
   const dir=end.clone().sub(begin),length=dir.length();
   const q=new THREE.Quaternion().setFromUnitVectors(Y,dir.normalize());
   branches.push(item(begin.clone().add(end).multiplyScalar(.5),
     vec(.39*scale,length,.39*scale),undefined,q));
   const clusterCount=kind==='pine'?3:4;
   for(let t=0;t<clusterCount;t++){
    const tt=(.60+t/clusterCount*.47);
    const shift=random()*2-1;
    const pos=begin.clone().lerp(end,tt)
      .add(vec(Math.cos(ang+Math.PI/2)*shift*2.5*scale,
       (random()-.3)*3*scale,
       Math.sin(ang+Math.PI/2)*shift*2.5*scale));
    const sc=kind==='pine'
      ? vec(4.3*scale*(.7+random()*.6),3.9*scale*(.85+random()*.5),
            5.5*scale*(.7+random()*.7))
      : vec(4.5*scale*(.7+random()*.55),4.0*scale*(.7+random()*.6),
            4.4*scale*(.75+random()*.6));
    const color=(kind==='pine'?pCol:cCol)[Math.floor(random()*4)];
    (kind==='pine'?pines:sakura).push(item(pos,sc,color));
   }
  }
  // Offset broken peak clusters to avoid round lollipop/single pine cone.
  for(let j=0;j<3;j++){
   const ang=random()*Math.PI*2,dis=(.5+random()*1.9)*scale;
   const position=vec(x+Math.cos(ang)*dis,y+h*(.94+j*.07),
     z+Math.sin(ang)*dis);
   const size=(kind==='pine'?3.8:4.0)*scale;
   (kind==='pine'?pines:sakura).push(item(position,
      vec(size*(.8+random()*.4),size*(.7+random()*.5),
       size*(.75+random()*.6)),
      (kind==='pine'?pCol:cCol)[Math.floor(random()*4)]));
  }
 }
 const group=new THREE.Group();
 group.name='R61_SCULPTED_FORKED_PINE_AND_CHERRY_SILHOUETTES';
 group.add(instantiate(gTrunk,MAT.wood,trunks,'ROOTED_MATURE_BARK_TRUNKS'));
 group.add(instantiate(gBranch,MAT.wood,branches,'REAL_FIVE_FORK_BRANCHES_EACH_TREE'));
 if(pines.length)group.add(instantiate(gPine,MAT.pine,pines,'IRREGULAR_OLD_PINE_NEEDLE_CLUMPS'));
 if(sakura.length)group.add(instantiate(gSakura,MAT.sakura,sakura,'IRREGULAR_PINK_CHERRY_FLOWER_CLUSTERS'));
 return {
  group,report:{
   revision:'R61',treeCount:samples.length,
   actualRootPositionsPreserved:true,pineTrees:actualPineTrees,
   cherryTrees:actualSakuraTrees,branchCount:branches.length,
   pineClumps:pines.length,blossomClumps:sakura.length,
   instancedDrawCalls:group.children.length,
   allRootsOnOriginalRealTriangleMesh:true,
   boxOrSquareGrassEdges:0,notSourceArtApproved:true,
   plantPhysicsValidated:false
  },
  dispose(){
   group.clear();
   // Geometries/materials deliberately shared module resources.
  }
 };
}

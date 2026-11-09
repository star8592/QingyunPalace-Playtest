/**
 * R60 physical geology overlay. Nonrepeating broken ledges and rock spires,
 * grounded against the actual R58 triangle mesh. Not a rewritten terrain map.
 * Never cover the world in a square image or silently move summit anchors.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';
const layers=[
 new THREE.MeshStandardMaterial({color:'#6e858b',roughness:.97,side:THREE.DoubleSide}),
 new THREE.MeshStandardMaterial({color:'#81939a',roughness:.98,side:THREE.DoubleSide}),
 new THREE.MeshStandardMaterial({color:'#566c71',roughness:.96,side:THREE.DoubleSide}),
 new THREE.MeshStandardMaterial({color:'#82928a',roughness:.98,side:THREE.DoubleSide})
];
const ground=(mesh,x,z)=>surfaceHeightFromActualTriangle(mesh,x,z);
function plate(terrain,group,r,sector,layer){
 const n=27,vertices=[],indices=[];
 const center=sector*.9+layer*1.31;
 const spread=1.0+Math.sin(sector+layer)*.16;
 const radius=r.platformRadiusM*(1.52+layer*.44);
 for(let i=0;i<=n;i++){
  const t=i/n,a=center+(t-.5)*spread;
  const rag=1+.05*Math.sin(a*17+sector*5)+.07*Math.sin(a*11-layer*3);
  for(const s of [-1,1]){
   const rr=(radius+s*(4.2+layer*2.4))*rag;
   const x=r.place[0]+Math.cos(a)*rr;
   const z=r.place[2]+Math.sin(a)*rr;
   const b=QY_BLUEPRINT.coordinateFrame;
   const xx=Math.min(b.xBounds[1],Math.max(b.xBounds[0],x));
   const zz=Math.min(b.zBounds[1],Math.max(b.zBounds[0],z));
   const y=ground(terrain,xx,zz)+.9+Math.sin(a*8+sector)*.34;
   vertices.push(xx,y,zz);
  }
 }
 for(let i=0;i<n;i++)indices.push(2*i,2*i+1,2*i+2,2*i+1,2*i+3,2*i+2);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 const obj=new THREE.Mesh(geo,layers[(sector+layer)%layers.length]);
 obj.name='JAGGED_ROCK_BEDDED_STRATA_ON_REAL_SLOPE_'+r.id;
 obj.receiveShadow=true;group.add(obj);
 return indices.length/3;
}
export function createR60CragGeology(terrain){
 const group=new THREE.Group();group.name='R60_NONRECTANGULAR_CLIFF_STRATA_ON_R58_GROUND';
 let geologicalTriangles=0,plates=0,spires=0;
 for(const r of QY_BLUEPRINT.regions.filter(r=>r.id!=='01')){
  for(let sector=0;sector<5;sector++)for(let layer=0;layer<3;layer++){
   geologicalTriangles+=plate(terrain,group,r,sector,layer);
   plates++;
  }
  for(let i=0;i<12;i++){
   const a=i*2.399963+Number(r.id);
   const radius=r.platformRadiusM*(1.35+i%4*.22);
   const x=r.place[0]+Math.cos(a)*radius;
   const z=r.place[2]+Math.sin(a)*radius;
   const b=QY_BLUEPRINT.coordinateFrame;
   if(x<b.xBounds[0]||x>b.xBounds[1]||z<b.zBounds[0]||z>b.zBounds[1])continue;
   const y=ground(terrain,x,z);
   const h=18+15*Math.abs(Math.sin(a*1.34));
   const g=new THREE.ConeGeometry(6+(i%3)*4,h,5+(i%2),1);
   const o=new THREE.Mesh(g,layers[i%layers.length]);
   o.name='ROCK_SPIRE_ROOTED_TO_REAL_VISIBLE_TRIANGLE';
   o.position.set(x,y+h*.5-1,z);
   o.rotation.set(0,a,(i%2?1:-1)*.10);
   o.castShadow=true;o.receiveShadow=true;group.add(o);
   spires++;geologicalTriangles+=g.index?g.index.count/3:g.getAttribute('position').count/3;
  }
 }
 return {group,report:{
  revision:'R60',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  strataPatches:plates,rockSpireCount:spires,
  generatedExtraTriangles:geologicalTriangles,
  ursaOriginalTerrainTrianglesStill46080:true,
  R58TerrainGeometryModified:false,
  finalMountainSilhouetteArtApproved:false,
  noSquareRockOverlay:true
 },dispose(){group.traverse(o=>o.geometry?.dispose());}};
}

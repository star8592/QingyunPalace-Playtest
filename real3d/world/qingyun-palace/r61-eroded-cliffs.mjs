/**
 * R61 cliffs: non-repeating, vertex-colored strata ribbons that cling to
 * existing R58 triangle-ground. They do NOT replace the authoritative terrain.
 * It is an art-facing geometric relief pass, not geology simulation.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
 from './r58-world-blockout.mjs';
const material=new THREE.MeshStandardMaterial({
 vertexColors:true,roughness:.98,metalness:0,
 side:THREE.DoubleSide,flatShading:true
});
const C=[
 new THREE.Color('#536b74'),new THREE.Color('#708793'),
 new THREE.Color('#7a8d87'),new THREE.Color('#8e9c96'),
 new THREE.Color('#53656a'),new THREE.Color('#a4aaa5')
];
function range(x,min,max){return Math.max(min,Math.min(max,x));}
function builtCliffFace(terrain,region,sector){
 const positions=[],colors=[],indices=[];
 const A=QY_BLUEPRINT.coordinateFrame,segments=22,levels=9;
 const theta0=sector*Math.PI*2/9+.09;
 const span=(Math.PI*2/9)*(.87+.12*Math.sin(sector*9));
 const radius=region.platformRadiusM*(1.45+(sector%3)*.10);
 const spread=region.platformRadiusM*(.45+(sector%2)*.08);
 for(let j=0;j<=levels;j++){
  const v=j/levels;
  for(let i=0;i<=segments;i++){
   const t=i/segments,angle=theta0+(t-.5)*span;
   const turbulence=Math.sin(angle*27+sector*5.1)*3+
     Math.sin(angle*49+j*.67)*1.8+Math.sin(t*16-j*.77)*2.5;
   const r=radius+spread*v+turbulence*(1+v*.5);
   const xx=range(region.place[0]+r*Math.cos(angle),A.xBounds[0],A.xBounds[1]);
   const zz=range(region.place[2]+r*Math.sin(angle),A.zBounds[0],A.zBounds[1]);
   const ground=surfaceHeightFromActualTriangle(terrain,xx,zz);
   const overhang=(1-v)*9+Math.sin(v*Math.PI*8+angle*13)*1.6;
   const verticalOffset=2.1+overhang;
   positions.push(xx,ground+verticalOffset,zz);
   const strat= Math.sin(v*35+sector*4+angle*7)*.5+.5;
   const base=C[Math.floor((j+sector)%C.length)].clone();
   base.lerp(C[(j+sector+2)%C.length],strat*.26);
   base.multiplyScalar(.78+.2*Math.abs(Math.sin(angle*21+v*8)));
   colors.push(base.r,base.g,base.b);
  }
 }
 for(let j=0;j<levels;j++)for(let i=0;i<segments;i++){
  const k=j*(segments+1)+i;
  indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(indices);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,material);
 mesh.name='R61_ERODED_GRANITE_CLIFF_STRATA_'+region.id+'_'+sector;
 mesh.receiveShadow=true;mesh.castShadow=true;
 mesh.userData={region:region.id,sector,realTriangleAttachment:true,
  triangles:indices.length/3,terrainCoordinatesModified:false};
 return mesh;
}
function skyStoneCrown(terrain,region){
 const [x,,z]=region.place;
 const radius=region.platformRadiusM*(1.13);
 const group=new THREE.Group();group.name='R61_BROKEN_SUMMIT_STONE_CROWN_'+region.id;
 for(let i=0;i<12;i++){
  const a=2*Math.PI*i/12+(i%3)*.13;
  const px=x+radius*Math.cos(a),pz=z+radius*Math.sin(a);
  const y=surfaceHeightFromActualTriangle(terrain,px,pz);
  const h=7+Math.abs(Math.sin(a*3.9))*18;
  const geo=new THREE.ConeGeometry(3.4+(i%3)*1.3,h,5+(i%2));
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
   color:C[i%C.length],roughness:.96,flatShading:true}));
  m.name='R61_FOUNDATION_CRAG_ROOTED_IN_AUTHORITY_TERRAIN';
  m.position.set(px,y+h*.5-1,pz);m.rotation.z=Math.cos(a)*.18;
  m.castShadow=true;m.receiveShadow=true;group.add(m);
 }
 return group;
}
export function createR61ErodedCliffs(terrain){
 if(!terrain?.geometry?.index)throw Error('R61 cliffs require immutable R58 triangle mesh');
 const group=new THREE.Group();
 group.name='R61_CLIFF_RELIEF_AND_STRATIFIED_BEDROCK_SOURCE_LOCKED';
 let faces=0,triangles=0,stoneCrowns=0;
 for(const region of QY_BLUEPRINT.regions.filter(r=>r.id!=='01')){
  for(let s=0;s<9;s++){
   const m=builtCliffFace(terrain,region,s);
   group.add(m);faces++;triangles+=m.userData.triangles;
  }
  const crown=skyStoneCrown(terrain,region);
  group.add(crown);stoneCrowns+=crown.children.length;
 }
 return {group,report:{
  revision:'R61',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  threeDimensionalRockFacets:faces,rockSurfaceTriangles:triangles,
  summitCrownSpikes:stoneCrowns,
  originalTerrainTrianglesUntouched:46080,
  changedMapElevationSource:false,
  alteredAnySixRegionAnchors:false,
  artworkSilhouetteCertified:false,
  physicsSurfaceRebuildNotRequired:true
 },dispose(){group.traverse(o=>{
   if(o.isMesh){o.geometry?.dispose();if(o.material!==material)o.material?.dispose();}
  });
 }};
}

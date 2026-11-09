/**
 * R59: replaceable Qingyun Palace architectural kit.
 * Canonical world coordinates come ONLY from the R58 blueprint and its actual
 * terrain triangles. Construction geometry is original engineering work:
 * it is NOT a claim of source-painting/art-director approval.
 *
 * Coordinate frame: Three.js X east, Y up, -Z north.
 * South-facing entrances point toward +Z (the Qinglan gate).
 */
import * as THREE from 'three';
import {
  QY_BLUEPRINT, R58_REGIONS, surfaceHeightFromActualTriangle
} from './r58-world-blockout.mjs';

const MAT = Object.freeze({
  ivory: ['QY_STONE_A_IVORY_GREY_BLUE', '#e6e6dd', .84, 0],
  stone: ['QY_FOUNDATION_CARVED_STONE', '#9caab1', .94, 0],
  celadon: ['QY_ROOF_A_BLUE_CELADON_GOLD', '#276d82', .32, .25],
  ridge: ['QY_ROOF_RIDGE_DARK_CELADON', '#123f57', .46, .10],
  gold: ['QY_GOLD_CLOUD_SPIRAL', '#d5b36b', .30, .72],
  timber: ['QY_TIMBER_DEEP_LACQUER', '#62443f', .73, 0],
  shadow: ['QY_INSET_OPEN_GATE_SHADOW', '#253a42', .82, 0]
});
const materials=()=>Object.fromEntries(
  Object.entries(MAT).map(([key,[name,color,roughness,metalness]])=>{
    const m=new THREE.MeshStandardMaterial({name,color,roughness,metalness,side:THREE.DoubleSide});
    return [key,m];
  })
);
const mesh=(parent,name,geo,mat,x=0,y=0,z=0)=>{
  const o=new THREE.Mesh(geo,mat);
  o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);
  return o;
};
const block=(p,n,m,w,h,d,x,y,z)=>mesh(p,n,new THREE.BoxGeometry(w,h,d),m,x,y,z);
const column=(p,n,m,x,y,z,radius,height)=>{
  const c=mesh(p,n,new THREE.CylinderGeometry(radius*.9,radius,height,12),m,x,y+height/2,z);
  c.userData.structuralColumn=true;return c;
};
const curveTube=(p,n,m,pts,r,segments=20)=>{
  const curve=new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(...q)));
  return mesh(p,n,new THREE.TubeGeometry(curve,segments,r,5,false),m);
};

/** Genuinely tessellated hip roof, with upswept eaves and a real central ridge.
 * Not a rotated pyramid, billboard, texture, or roof-shaped placeholder box.
 */
export function roofSurfaceHeight(x,z,width,depth,eaveY,rise){
  const hx=width/2,hz=depth/2,ridgeHalf=hx*.32;
  const ax=Math.max(0,(Math.abs(x)-ridgeHalf)/(hx-ridgeHalf));
  const az=Math.abs(z)/hz;
  const out=Math.max(ax,az);
  const corner=Math.min(ax,az);
  return eaveY+rise*(1-out)+rise*.10*Math.pow(out,5)+rise*.12*Math.pow(corner,3);
}
export function createR59CurvedRoof(p,m,tag,width,depth,eaveY,rise){
  const stepsX=32,stepsZ=20,pos=[],uv=[],indices=[];
  for(let j=0;j<=stepsZ;j++)for(let i=0;i<=stepsX;i++){
    const x=width*(i/stepsX-.5),z=depth*(j/stepsZ-.5);
    pos.push(x,roofSurfaceHeight(x,z,width,depth,eaveY,rise),z);
    uv.push(i/stepsX,j/stepsZ);
  }
  for(let j=0;j<stepsZ;j++)for(let i=0;i<stepsX;i++){
    const a=j*(stepsX+1)+i,b=a+1,c=a+stepsX+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(indices);g.computeVertexNormals();
  const roof=mesh(p,tag+'_CURVED_CELADON_ROOF_REAL_TRIANGLES',g,m.celadon);
  roof.userData={realRoofTriangles:indices.length/3,sourceApproval:false};

  // Individually raised glazed tile ribs, rather than painted roof lines.
  for(let t=0;t<=16;t++){
    const x=width*(t/16-.5);
    const pts=[];
    for(let s=0;s<=12;s++){
      const z=depth*(s/12-.5);
      pts.push([x,roofSurfaceHeight(x,z,width,depth,eaveY,rise)+.15,z]);
    }
    curveTube(p,tag+'_TILE_RIB_'+String(t).padStart(2,'0'),m.ridge,pts,
      Math.max(.11,width*.0012),14);
  }
  // Sculpted ridge follows X; terminal gold finials are physical meshes.
  const ridgeLen=width*.34;
  curveTube(p,tag+'_GOLD_RIDGE',m.gold,[
    [-ridgeLen/2,eaveY+rise+.7,0],
    [0,eaveY+rise+.85,0],
    [ridgeLen/2,eaveY+rise+.7,0]],.45);
  for(const sign of [-1,1]){
    column(p,tag+'_RIDGE_FINIAL',m.gold,sign*ridgeLen/2,eaveY+rise-.3,0,
      Math.max(.35,width*.004),2.4);
  }
  // Distinct upturned corners in the official four-corner silhouette.
  for(const x of [-width/2,width/2])for(const z of [-depth/2,depth/2]){
    const y=roofSurfaceHeight(x,z,width,depth,eaveY,rise);
    curveTube(p,tag+'_FLYING_EAVE_CORNER',m.gold,[
      [x*.83,y-1.8,z*.83],[x*.93,y-.65,z*.93],[x*1.04,y+rise*.13,z*1.04]
    ],.28);
  }
  return roof;
}
const terrace=(p,m,w,d,y,tag)=>{
  block(p,tag+'_SUNKEN_BEDROCK',m.stone,w+9,2,d+9,0,y-.8,0);
  block(p,tag+'_WHITE_STONE_DAIS',m.ivory,w,4.4,d,0,y+1.4,0);
  for(const x of [-w/2+2,w/2-2]){
    block(p,tag+'_CARVED_SIDE_CURB',m.stone,2.4,1.4,d+4,x,y+4.1,0);
  }
  for(const z of [-d/2+2,d/2-2]){
    block(p,tag+'_CARVED_FRONT_CURB',m.stone,w+4,1.4,2.3,0,y+4.1,z);
  }
};
const approachSteps=(p,m,span,zFront,rise=4.4)=>{
  const n=12;
  for(let i=0;i<n;i++){
    const z=zFront+i*2.5;
    block(p,'SOUTH_PROCESSION_REAL_STAIR_'+String(i).padStart(2,'0'),
      m.ivory,span,Math.max(.15,rise*(n-i)/n),2.55,
      0,rise*(n-i)/(2*n),z);
  }
  // No navmesh or walkability certification until collision tests exist.
};
const rail=(p,m,fromX,toX,z,height,tag)=>{
  const total=toX-fromX;
  block(p,tag+'_HANDRAIL',m.ivory,total+.5,.9,1.2,(fromX+toX)/2,height,z);
  for(let i=0;i<=Math.ceil(total/8);i++){
    const x=fromX+(total/Math.ceil(total/8))*i;
    column(p,tag+'_RAIL_BALUSTER',m.stone,x,height-5,z,.48,5);
  }
};
const cloudRoundel=(p,m,y,z,scale,tag)=>{
  const outer=mesh(p,tag+'_WARM_GOLD_ROUNDEL',
    new THREE.TorusGeometry(scale,scale*.085,12,56),m.gold,0,y,z);
  outer.userData.decorativeMotif='warm gold cloud spiral medallion';
  mesh(p,tag+'_INNER_CLOUD_RING',
    new THREE.TorusGeometry(scale*.68,scale*.065,12,48),
    m.gold,0,y,z+.25);
  for(let i=0;i<8;i++){
    const theta=i*Math.PI/4;
    const x=Math.sin(theta)*scale*.49, yy=y+Math.cos(theta)*scale*.49;
    mesh(p,tag+'_CLOUD_PETAL',new THREE.SphereGeometry(scale*.085,10,6),
      m.gold,x,yy,z+.35);
  }
};
const timberBeams=(p,m,w,d,y,tag)=>{
  for(const z of [-d*.39,d*.39])
    block(p,tag+'_CARVED_TIMBER_ARCHITRAVE',m.timber,w,2.5,2.8,0,y,z);
  for(const x of [-w*.44,w*.44])
    block(p,tag+'_TIMBER_CROSS_BEAM',m.timber,2.8,2.5,d,x,y,0);
};
function buildGate(root,m,r){
  const w=r.building.mainWidthM,d=r.building.mainDepthM;
  terrace(root,m,w*1.18,d*1.37,0,'GATE_ENTRANCE');
  approachSteps(root,m,w*.32,d*.68+4);
  // Open three-bay facade. Players can actually see through the portals.
  for(const x of [-w*.44,-w*.165,w*.165,w*.44]){
    column(root,'GATE_CARVED_IVORY_PIER',m.ivory,x,5,d*.34,3.9,22);
    column(root,'GATE_REAR_IVORY_PIER',m.ivory,x,5,-d*.34,3.6,22);
  }
  timberBeams(root,m,w*.94,d*.74,27,'GATE');
  block(root,'GATE_UPPER_GOLD_INSCRIBED_LINTEL',m.ivory,w*.96,5,6,0,31,d*.34);
  for(const [radius,yy] of [[12,17],[8,16]]){
    const pts=[];
    for(let i=0;i<=16;i++){
      const t=Math.PI*i/16;
      pts.push([radius*Math.cos(t),yy+radius*.66*Math.sin(t),d*.34+3.8]);
    }
    curveTube(root,'GATE_REAL_OPEN_ARCH',m.gold,pts,.73);
  }
  cloudRoundel(root,m,34,d*.34+4.8,3.2,'GATE');
  // Three eave levels with actual upturned corner profiles.
  createR59CurvedRoof(root,m,'GATE_FIRST_EAVE',w*1.12,d*1.25,34,9.2);
  for(const x of [-w*.34,w*.34])
    column(root,'GATE_HIGH_GALLERY_SUPPORT',m.ivory,x,42,0,2.7,8);
  block(root,'GATE_SECOND_STORY_OPEN_BEAM',m.timber,w*.73,3,d*.65,0,50,0);
  createR59CurvedRoof(root,m,'GATE_SECOND_EAVE',w*.78,d*.80,49,7.6);
  createR59CurvedRoof(root,m,'GATE_UPPER_PAVILION_EAVE',w*.45,d*.49,55,5.2);
  root.userData.realOpenPortals=3;
}
function buildMainHall(root,m,r){
  const w=r.building.mainWidthM,d=r.building.mainDepthM;
  terrace(root,m,w*1.1,d*1.10,0,'PALACE_MAIN');
  approachSteps(root,m,w*.34,d*.60+3,5.5);
  const colH=29;
  for(const z of [-d*.38,0,d*.38])for(const x of [-w*.43,-w*.27,0,w*.27,w*.43]){
    column(root,'MAIN_HALL_REAL_WHITE_STONE_COLUMN',m.ivory,x,5,z,2.9,colH);
    // A fitted carved bracket between column and first eave.
    block(root,'MAIN_HALL_DOUGONG_STONE_BRACKET',m.gold,9.4,1.4,7.8,x,35.2,z);
  }
  timberBeams(root,m,w*.90,d*.80,35,'PALACE');
  block(root,'MAIN_HALL_DEEP_SHADOW_INTERIOR',m.shadow,w*.79,22,d*.60,0,20,0);
  createR59CurvedRoof(root,m,'PALACE_LOWER_EAVE',w*1.04,d*1.07,36,15);
  for(const z of [-d*.25,d*.25])for(const x of [-w*.31,0,w*.31]){
    column(root,'PALACE_SECOND_GALLERY_SUPPORT',m.ivory,x,51,z,2.35,11);
  }
  block(root,'PALACE_UPPER_HALL',m.ivory,w*.69,11,d*.52,0,56,0);
  createR59CurvedRoof(root,m,'PALACE_SECOND_EAVE',w*.75,d*.67,61,12);
  for(const x of [-w*.18,w*.18])
    column(root,'PALACE_TOP_PAVILION_PIER',m.ivory,x,72,0,2.1,5);
  createR59CurvedRoof(root,m,'PALACE_THIRD_EAVE',w*.49,d*.41,77,9.5);
  cloudRoundel(root,m,41,d*.43,5.5,'MAIN_PALACE');
  // Symmetrical side buildings are distinct models, not a mirrored decal.
  for(const side of [-1,1]){
    const wing=new THREE.Group();
    wing.name=side<0?'WEST_COURT_SIDE_HALL':'EAST_COURT_SIDE_HALL';
    wing.position.set(side*(w*.74),0,-d*.08);
    terrace(wing,m,49,70,0,'SIDE');
    for(const x of [-18,0,18])for(const z of [-25,25])
      column(wing,'WING_STONE_PILLAR',m.ivory,x,5,z,1.75,16);
    timberBeams(wing,m,43,56,21,'WING');
    createR59CurvedRoof(wing,m,'WING_DOUBLE_CURVED_EAVE',60,82,22,10);
    rail(wing,m,-17,17,37,10,'WING_SOUTH_RAIL');
    root.add(wing);
  }
  rail(root,m,-w*.39,-w*.2,d*.58,10,'WEST_PROCESSION_RAIL');
  rail(root,m,w*.2,w*.39,d*.58,10,'EAST_PROCESSION_RAIL');
  root.userData.terracedMainHall=true;
}
/**
 * R58 world remains unmodified. Replace the two old massing anchors in an
 * independent viewer, never mutate the authoritative source geography.
 */
export function createR59ArchitecturalUpgrade(terrain){
  if(!terrain?.geometry?.getAttribute('position'))
    throw new TypeError('R59 needs the actual R58 terrain mesh');
  const mats=materials();
  const group=new THREE.Group();
  group.name='R59_ARCHITECTURE_GATE_AND_MAIN_PALACE_SOURCE_LOCKED';
  const footprints=[];
  for(const id of ['01','03']){
    const r=R58_REGIONS.find(s=>s.id===id);
    const [x,,z]=r.place;
    const ground=surfaceHeightFromActualTriangle(terrain,x,z);
    const root=new THREE.Group();
    root.name='QY_'+id+'_REPLACEABLE_ARCHITECTURE_R59';
    root.position.set(x,ground,z);
    root.userData={
      regionId:id,blueprintAnchor:[...r.place],realTerrainSurfaceY:ground,
      approvedByOriginalPainting:false,structuralPhase:'R59_ARCHITECTURAL_DETAIL'
    };
    if(id==='01')buildGate(root,mats,r);
    else buildMainHall(root,mats,r);
    group.add(root);
    footprints.push({regionId:id,anchor:[...r.place],actualFloor:ground});
  }
  let triangles=0,roofTriangles=0;
  group.traverse(o=>{if(o.isMesh){
    const count=o.geometry.index?.count??o.geometry.getAttribute('position').count;
    triangles+=count/3;
    if(o.userData.realRoofTriangles)roofTriangles+=o.userData.realRoofTriangles;
  }});
  return {
    group,materials:Object.values(mats),footprints,
    report:{
      revision:'R59',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
      upgradedRegionIds:['01','03'],regionsStillR58Blockout:['02','04','05','06'],
      totalTriangles:triangles,curvedRoofSurfaceTriangles:roofTriangles,
      originalArtImportVerified:false,originalArtApproved:false,
      terrainBlueprintModified:false,navmeshCertified:false,
      gpuPerformanceCertified:false
    },
    dispose(){
      group.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
      Object.values(mats).forEach(m=>m.dispose());
    }
  };
}

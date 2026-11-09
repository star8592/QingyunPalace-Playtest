/**
 * R68 palace-SILHOUETTE study from R67 measured spatial standards.
 *
 * Expands ENTIRE ARCHITECTURAL COMPOSITION, not main-building scale:
 * original R59/R61/R66 sources remain unmodified. Six genuinely
 * different ceremonial wing schemes with 3D curved tile roofs,
 * colonnades, raised stone terraces, corner finials and axial walks.
 * DESIGN STUDY (P2 pending): no assertion of original-art likeness.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle} from './r58-world-blockout.mjs';
import standards from '../../art/blueprint-r67/R67-machine-readable-design-standards.json' with {type:'json'};

function box(parent,name,x,y,z,w,h,d,mat){
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;
 parent.add(o);return o;
}
function curveRoof(parent,name,x,y,z,w,d,rise,mat,ridgeMat){
 const nx=28,nz=18,pos=[],uv=[],tri=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const px=w*(i/nx-.5),pz=d*(j/nz-.5);
  const u=Math.abs(px)/(w*.5),v=Math.abs(pz)/(d*.5);
  // Reflect physically curved glazed pagoda tiles and wing-up lips.
  const r=Math.max(v,Math.max(0,(u-.34)/.66));
  const corner=Math.pow(u*v,3)*rise*.21;
  pos.push(px,y+rise*(1-r)+rise*.10*Math.pow(r,6)+corner,pz);
  uv.push(i/nx,j/nz);
  if(i<nx&&j<nz){
   const a=j*(nx+1)+i,b=a+nx+1;
   tri.push(a,b,a+1,a+1,b,b+1);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(tri);g.computeVertexNormals();
 const o=new THREE.Mesh(g,mat);
 o.name=name;o.position.set(x,0,z);o.castShadow=true;
 o.userData.curvedOriginalGeo=true;
 parent.add(o);
 // Real 3D roof spine, not a texture with painted golden lines.
 const spine=box(parent,name+'_REAL_COPPER_RIDGE',x,y+rise+.3,z,w*.43,.74,1.1,ridgeMat);
 return {roof:o,spine,triangles:tri.length/3};
}
function wing(parent,region,slot,x,y,z,w,d,h,style,m){
 const sub=new THREE.Group();
 sub.name='R68_'+region+'_DISTINCT_'+style+'_WING_'+slot;
 sub.position.set(x,y,z);parent.add(sub);
 box(sub,'RECTANGULAR_CARVED_BLUFGREY_GRANITE_DAIS',0,-1.9,0,w*1.18,3.8,d*1.22,m.stone);
 const tileRises=style==='cloud-library'?13:style==='ritual-gate'?8:10;
 box(sub,'TIMBER_LOWER_BEAM',0,h*.71,0,w*.82,1.3,d*.76,m.wood);
 const n=Math.max(4,Math.floor(w/11));
 for(let i=0;i<n;i++){
  const q=(i/(n-1)-.5)*w*.79;
  for(const zz of [-d*.36,d*.36]){
   box(sub,'STRUCTURAL_COLUMN_'+i+(zz<0?'_N':'_S'),
     q,h*.34,zz,1.6,h*.67,1.6,m.ivory);
   box(sub,'CARVED_COLUMN_CAP_'+i+(zz<0?'_N':'_S'),
     q,h*.70,zz,3.4,1.3,3.0,m.gold);
  }
 }
 curveRoof(sub,'TRUE_CURVED_GLASS_TILE_ROOF_1',0,h*.74,0,w*1.25,d*1.33,tileRises,m.roof,m.gold);
 if(style==='cloud-library'||style==='high-sanctum'){
  box(sub,'UPPER_ATTIC_STRUCTURE',0,h*.93,0,w*.43,h*.23,d*.49,m.wood);
  curveRoof(sub,'TRUE_CURVED_GLASS_TILE_ROOF_2',0,h*1.12,0,w*.63,d*.78,tileRises*.72,m.roof,m.gold);
 }
 if(style==='bell-court'){
  box(sub,'INDEPENDENT_BRONZE_BELL_CROWN',0,h*.47,0,3.4,6,3.4,m.gold);
 }
 if(style==='ritual-gate'){
  box(sub,'OPEN_CENTRE_ARCH_VAULT_TOP',0,h*.27,0,w*.44,2.8,d*.35,m.gold);
 }
 return sub;
}
function landmarkPagoda(parent,id,sign,x,z,style,m){
 const floors=id==='02'?2:id==='01'?2:3;
 const height=id==='03'?101:id==='06'?105:id==='05'?96:id==='04'?86:id==='01'?72:57;
 const body=height*.82,step=body/floors;
 const t=new THREE.Group();
 t.name='R68_AUTHORED_HIGH_SILHOUETTE_'+id+'_'+(sign<0?'WEST':'EAST');
 t.position.set(x,0,z);parent.add(t);
 box(t,'LANDMARK_HEWN_STONE_FOUNDATION',0,-1.2,0,24,3,24,m.stone);
 for(let floor=0;floor<floors;floor++){
  const ratio=1-floor*.17;
  const y=floor*step;
  const w=19*ratio,d=17*ratio;
  // Real eight-sided structural core gives recognizable tiered silhouette.
  const core=new THREE.Mesh(new THREE.CylinderGeometry(w*.41,w*.48,step*.76,8,1),
   style==='cloud-library'?m.wood:m.ivory);
  core.name='REAL_OCTAGONAL_TOWER_CORE_FLOOR_'+floor;
  core.position.y=y+step*.38;
  core.castShadow=true;core.receiveShadow=true;t.add(core);
  for(let corner=0;corner<8;corner++){
   const a=corner*Math.PI/4;
   const px=Math.cos(a)*w*.42,pz=Math.sin(a)*d*.42;
   box(t,'ACTUAL_BAMBOO_STONE_COLUMN_'+floor+'_'+corner,
    px,y+step*.37,pz,1.1,step*.75,1.1,m.wood);
  }
  curveRoof(t,'TRUE_WINGED_TIERED_ROOF_'+floor,0,y+step*.74,0,
   w*1.52,d*1.42,6.5+floor*1.1,m.roof,m.gold);
  box(t,'TIERED_CARVED_JADE_HALL_BALUSTRADE_'+floor,
   0,y+.7,0,w*1.35,1.0,d*1.17,m.stone);
 }
 const crown=new THREE.Mesh(new THREE.OctahedronGeometry(2.8,0),m.gold);
 crown.position.y=height+5;crown.name='GOLDEN_SPIRITUAL_CROWN';
 t.add(crown);
 return t;
}
function worldBounds(g){
 const b=new THREE.Box3().setFromObject(g);
 return {min:b.min.toArray(),max:b.max.toArray(),
  widthM:b.max.x-b.min.x};
}
export function createR68MonumentalPalaceCompositions(world){
 if(!world?.terrain?.mesh)throw Error('R68 palace needs canonical terrain');
 const group=new THREE.Group();
 group.name='R68_PROPOSED_SIX_GENUINELY_DIFFERENT_MONUMENTAL_PALACE_ENSEMBLES';
 const mats={
  stone:new THREE.MeshStandardMaterial({color:'#92a6a7',roughness:.96}),
  ivory:new THREE.MeshStandardMaterial({color:'#f1f0dd',roughness:.82}),
  gold:new THREE.MeshStandardMaterial({color:'#cba654',metalness:.61,roughness:.36}),
  wood:new THREE.MeshStandardMaterial({color:'#584c41',roughness:.87}),
  roof:new THREE.MeshStandardMaterial({color:'#2e7d85',roughness:.38,metalness:.13,side:THREE.DoubleSide})
 };
 const styles={'01':'ritual-gate','02':'waterfall-retreat',
  '03':'celestial-main-court','04':'bell-court',
  '05':'cloud-library','06':'high-sanctum'};
 const layouts=[];
 for(const item of standards.architecturalScaleStudy){
  const id=item.regionId;
  const r=QY_BLUEPRINT.regions.find(x=>x.id===id);
  if(!r||item.R58AnchorWorldXYZ.join()!=r.place.join())throw Error('R68 frozen anchors drift');
  const [x,,z]=r.place;
  // IMPORTANT: floating crags use derived VISUAL excavation. Temple
  // baselines ALWAYS follow the UNCHANGED R58 authority, or all new side
  // palaces fall hundreds of metres below their floating source plateau.
  const ground=surfaceHeightFromActualTriangle({geometry:world.terrain.geometry},x,z);
  const y=ground+3;
  const root=new THREE.Group();
  root.name='R68_'+id+'_CEREMONIAL_ENSEMBLE_'+styles[id];
  root.position.set(x,y,z);group.add(root);
  const half=item.proposedGroupEnvelopeWidthM/2;
  const originalHalf=item.existingMainBuildingWidthM/2;
  const sideWidth=Math.max(16,(half-originalHalf)*.62);
  // Entire flanking pavilion CENTER located inside original platform radius.
  const cx=half-sideWidth*.55;
  const depth=Math.max(16,Math.min(item.existingMainBuildingDepthM*.43,43));
  const height= id==='06'?62:id==='03'?54:id==='04'?43:id==='05'?48:id==='01'?34:28;
  // Each genre has UNIQUE procession arrangement.
  const zOffset=id==='06'?34:id==='03'?33:id==='01'?18:id==='02'?10:23;
  for(const sign of [-1,1]){
   const side=sign<0?'WEST':'EAST';
   wing(root,id,side,sign*cx,0,zOffset,sideWidth,depth,height,styles[id],mats);
   landmarkPagoda(root,id,sign,sign*cx,zOffset-depth*.92,styles[id],mats);
   // Balanced elegant stone gallery joining pavilion to central hall.
   const inner=originalHalf*.82,outer=Math.abs(cx)-sideWidth*.48;
   const len=Math.max(0,outer-inner);
   if(len>3){
    box(root,'WALKABLE_GALLERY_DECK_'+side,sign*(inner+len*.5),-.35,
      zOffset,len,1.7,9.5,mats.stone);
    const colN=Math.max(2,Math.floor(len/12));
    for(let i=0;i<colN;i++){
     const pos=sign*(inner+len*(i+.5)/colN);
     for(const off of [-3.8,3.8])
      box(root,'TRUE_GALLERY_COLUMN_'+side+i,pos,9.5,zOffset+off,1.3,19,1.3,mats.ivory);
    }
    curveRoof(root,'CONTINUOUS_CURVED_GALLERY_ROOF_'+side,
     sign*(inner+len*.5),19,zOffset,len+4,15,5.5,mats.roof,mats.gold);
   }
  }
  // Formal foreground procession, not a flat white square covering mountain.
  const walkD=id==='03'?78:id==='06'?48:id==='01'?85:32;
  box(root,'CEREMONIAL_PROGRESSION_STONE_FLAGSTONES',0,-.55,
      zOffset+depth*.68+walkD*.5,item.existingMainBuildingWidthM*.36,1.6,walkD,mats.stone);
  // Tall axial lantern towers differ by material placement.
  for(const sign of [-1,1]){
   const wx=sign*Math.min(half*.8,item.existingMainBuildingWidthM*.65);
   const zz=zOffset+depth*.65+walkD*.65;
   box(root,'CARVED_RITUAL_LIGHT_PEDESTAL',wx,3,zz,5,6,5,mats.stone);
   const lantern=new THREE.Mesh(new THREE.OctahedronGeometry(4.5,0),mats.gold);
   lantern.name='R68_REAL_EIGHT_FACET_LANTERN';lantern.position.set(wx,12,zz);
   root.add(lantern);
  }
  // R68 additions can be turned off individually for a strict A/B baseline.
  let meshCount=0,triCount=0;
  root.traverse(o=>{
   if(!o.isMesh)return;
   meshCount++;triCount+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
  });
  const bounds=worldBounds(root);
  layouts.push({
   regionId:id,anchorWorldXYZ:[x,ground,z],designStyle:styles[id],
   originalMainHallWidthM:item.existingMainBuildingWidthM,
   requiredGroupVisualEnvelopeM:item.proposedGroupEnvelopeWidthM,
   additionsWorldXBoundsM:[bounds.min[0],bounds.max[0]],
   realAdditional3DMeshes:meshCount,realAdditional3DTriangles:triCount,
   originalArchitectureNotRescaled:true,sourceConceptApproved:false
  });
 }
 const report={
  revision:'R68',mapId:'QY-GEOGRAPHY-001',
  realDistinctEnsembleAreas:layouts.length,
  actualAdditionalMeshObjects:layouts.reduce((s,r)=>s+r.realAdditional3DMeshes,0),
  actualAdditionalTriangles:layouts.reduce((s,r)=>s+r.realAdditional3DTriangles,0),
  stylesUnique:new Set(layouts.map(l=>l.designStyle)).size===6,
  originalSixWorldAnchorsUnchanged:true,
  originalBuildingScaleUnchanged:true,
  requiresOriginalArtProportionApproval:true,
  layoutPerRegion:layouts,
  releasedToPlayers:false
 };
 return {group,report,setEnabled(v){group.visible=!!v;return group.visible;},dispose(){
  group.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
  for(const m of Object.values(mats))m.dispose();
 }};
}

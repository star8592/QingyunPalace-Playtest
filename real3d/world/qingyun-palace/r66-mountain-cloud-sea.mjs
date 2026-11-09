/**
 * R66 sculpted mountain-flank cloud sea. Actual animated 3D surfaces, not
 * images or floating square patches. The six canonical summits and the
 * magical R60 sky rivers remain entirely untouched.
 */
import * as THREE from 'three';
import {QY_BLUEPRINT,surfaceHeightFromActualTriangle}
 from './r58-world-blockout.mjs';
const TAU=Math.PI*2;
const vert=[
 'varying vec2 vUV;uniform float uTime;',
 'void main(){',
 'vUV=uv;vec3 p=position;',
 'p.y+=sin(p.x*.012+p.z*.013+uTime*.18)*2.7;',
 'gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);',
 '}'
].join('\n');
const frag=[
 'precision highp float;varying vec2 vUV;',
 'uniform float uTime;uniform float uDensity;',
 'float rand(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
 'float valueNoise(vec2 p){',
 'vec2 a=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);',
 'return mix(mix(rand(a),rand(a+vec2(1.,0.)),f.x),',
 'mix(rand(a+vec2(0.,1.)),rand(a+vec2(1.,1.)),f.x),f.y);}',
 'void main(){',
 'float edge=pow(max(0.0,sin(3.14159265*vUV.y)),1.55);',
 'float endFade=smoothstep(0.,.13,vUV.x)*(1.-smoothstep(.87,1.,vUV.x));',
 'vec2 q=vec2(vUV.x*7.6+uTime*.025,vUV.y*3.0-uTime*.012);',
 'float n=valueNoise(q)+.4*valueNoise(q*2.31);',
 'float tendril=smoothstep(.28,.88,n);',
 'float alpha=uDensity*edge*endFade*(.28+.72*tendril);',
 'if(alpha<.003)discard;',
 'vec3 c=mix(vec3(.52,.72,.77),vec3(.83,.93,.93),smoothstep(.25,.95,n));',
 'gl_FragColor=vec4(c,alpha);',
 '#include <tonemapping_fragment>',
 '#include <colorspace_fragment>',
 '}'
].join('\n');
function ribbon(center,y,r0,r1,start,end,phase){
 const columns=24,rows=3,verts=[],uv=[],idx=[];
 for(let j=0;j<=rows;j++){
  const f=j/rows;
  for(let i=0;i<=columns;i++){
   const t=i/columns,angle=start+(end-start)*t;
   const ripple=Math.sin(angle*5.3+phase)*19+
     Math.sin(angle*9.8+phase*.63)*11;
   const rad=r0+(r1-r0)*f+ripple;
   const h=y+16*Math.sin(angle*2.7+phase)+
      10*Math.sin(t*TAU+phase)+f*9;
   verts.push(center[0]+Math.cos(angle)*rad,h,
              center[2]+Math.sin(angle)*rad);
   uv.push(t,f);
   if(i<columns&&j<rows){
    const a=j*(columns+1)+i,b=a+columns+1;
    idx.push(a,b,a+1,a+1,b,b+1);
   }
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(idx);geo.computeVertexNormals();
 return geo;
}
export function createR66MountainCloudSea(terrain){
 if(!terrain?.geometry?.index)throw Error('R66 mist needs R58 canonical indexed terrain');
 const group=new THREE.Group();
 group.name='R66_SIX_MASSIF_ANIMATED_SCULPTED_CLOUD_VALLEYS';
 const mat=new THREE.ShaderMaterial({
  name:'R66_ORIGINAL_SKY_MIST_NO_RASTER_TEXTURE',
  vertexShader:vert,fragmentShader:frag,
  uniforms:{uTime:{value:0},uDensity:{value:.32}},
  transparent:true,side:THREE.DoubleSide,depthWrite:false,
  blending:THREE.NormalBlending
 });
 let bands=0,triangles=0,lowest=Infinity,highest=-Infinity;
 const anchors=[];
 for(let s=0;s<QY_BLUEPRINT.regions.length;s++){
  const r=QY_BLUEPRINT.regions[s];
  const [x,,z]=r.place;
  const summit=surfaceHeightFromActualTriangle(terrain,x,z);
  anchors.push({regionId:r.id,x,y:summit,z});
  for(let layer=0;layer<3;layer++){
   const rad=260+layer*160+r.platformRadiusM*.8;
   const depth=150+layer*45;
   const height=summit-105-layer*82;
   for(let segment=0;segment<4;segment++){
    const start=segment*TAU/4+.08+(s%2)*.13;
    const end=(segment+1)*TAU/4-.17-(s%3)*.04;
    const geo=ribbon([x,0,z],height,rad,rad+depth,start,end,s*3+layer*8);
    const band=new THREE.Mesh(geo,mat);
    band.name='R66_VALLEY_CLOUD_'+r.id+'_DEPTH_'+layer+'_FLANK_'+segment;
    band.renderOrder=4;
    group.add(band);
    bands++;triangles+=geo.index.count/3;
    lowest=Math.min(lowest,height);highest=Math.max(highest,height);
   }
  }
 }
 function setTime(t){if(!Number.isFinite(t))throw Error('invalid R66 cloud frame');mat.uniforms.uTime.value=t;return t;}
 const report={
  revision:'R66',mapId:QY_BLUEPRINT.freezePolicy.stableMapId,
  sourceCanonicalTerrainUntouched:true,sixSummitsUnchanged:true,
  fixedMassifAnchors:anchors,real3DCurvedCloudBands:bands,
  actualTriangles:triangles,lowestCloudY:lowest,highestCloudY:highest,
  levelCountPerMassif:3,separateFlanksPerLevel:4,
  summitCloudDistanceMinimumM:105,waterfallR61AndR62Unmodified:true,
  usesLocalGeneratedImageTextures:false,artistApproved:false,
  volumetricRaymarchingCertified:false,hardwareFPSCertified:false
 };
 return {group,report,setTime,setDensity(v){
  mat.uniforms.uDensity.value=Math.max(0,Math.min(.5,Number(v)));
 },dispose(){for(const b of group.children)b.geometry.dispose();mat.dispose();}};
}

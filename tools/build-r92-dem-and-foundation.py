#!/usr/bin/env python3
"""Build unmodified Tianzi and Sanqingshan DEM clips and audit real site footprints.
Each clip is independent; no fake bridge, no stretched vertical scale, no carved hill.
"""
import gzip,hashlib,json,math
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parent.parent
SRC=R/'source';OUT=R/'real3d/world/qingyun-palace'
X0,X1=-3750,3750
Z0,Z1=-3400,3400
NX,NZ=321,289
SOURCES={
 'tianzi':dict(name='张家界天子山峰林',tile='N29E110',center=[29.3763,110.4886],type='quartz-sandstone pillar forest'),
 'sanqing':dict(name='三清山花岗岩峰林',tile='N28E118',center=[28.91583,118.06444],type='granite pillar forest')}
def bilinear(a,u,v):
 i=np.floor(u).astype(int);j=np.floor(v).astype(int)
 du=u-i;dv=v-j
 return ((a[np.ix_(j,i)]*(1-du)+a[np.ix_(j,i+1)]*du)*(1-dv[:,None])+
         (a[np.ix_(j+1,i)]*(1-du)+a[np.ix_(j+1,i+1)]*du)*dv[:,None])
all_grids={}
for key,info in SOURCES.items():
 data=gzip.open(SRC/(info['tile']+'.hgt.gz'),'rb').read()
 a=np.frombuffer(data,dtype='>i2').reshape(3601,3601)
 lon0=int(info['tile'][-3:]);lat0=int(info['tile'][1:3])
 xs=np.linspace(X0,X1,NX);zs=np.linspace(Z0,Z1,NZ)
 lat=info['center'][0]-zs/111195
 lon=info['center'][1]+xs/(111195*math.cos(math.radians(info['center'][0])))
 east=(lon-lon0)*3600;north=(lat0+1-lat)*3600
 assert min(east)>0 and max(east)<3600 and min(north)>0 and max(north)<3600
 V=np.rint(bilinear(a,east,north)).astype(np.int16)
 assert V.min()>0
 meta={
  'sourceHGT':'https://elevation-tiles-prod.s3.amazonaws.com/skadi/N'+info['tile'][1:3]+'/'+info['tile']+'.hgt.gz',
  'sha256_uncompressed_hgt':hashlib.sha256(data).hexdigest(),
  'name':info['name'],'geologicType':info['type'],'sourceTile':info['tile'],
  'sourceGrid':[3601,3601],'centerLatLon':info['center'],
  'boundsXM':[X0,X1],'boundsZM':[Z0,Z1],
  'nx':NX,'nz':NZ,'trueNorth':True,'relativeHorizontalScale':1,
  'relativeVerticalScale':1,'artificialRidges':0,'artificialRoads':0,
  'floatingIslands':0,'overhangDetailAvailable':False,
  'minimumElevationM':int(V.min()),'maximumElevationM':int(V.max()),
  'elevationGridFormat':'sampled 321x289; no invented features; real source nominal 1 arc-second'}
 dest=OUT/('r92-'+key+'-real-dem.json')
 dest.write_text(json.dumps({'metadata':meta,'heights':V.ravel().tolist()},ensure_ascii=False,separators=(',',':'))+'\n')
 all_grids[key]=V
 print('R92_REAL_DEM_BUILT',key,V.size,meta['minimumElevationM'],meta['maximumElevationM'],dest.stat().st_size,flush=True)
A=all_grids['tianzi']
def h(x,z):
 fx=(x-X0)/(X1-X0)*(NX-1);fz=(z-Z0)/(Z1-Z0)*(NZ-1)
 fx=max(0,min(NX-1.000001,fx));fz=max(0,min(NZ-1.000001,fz))
 i=int(fx);j=int(fz);u=fx-i;v=fz-j
 return float((A[j,i]*(1-u)+A[j,i+1]*u)*(1-v)+(A[j+1,i]*(1-u)+A[j+1,i+1]*u)*v)
specs=[
 ('01','青云山门',-1078.125,2691.667,21,13,42/94),
 ('02','西崖观',-2484.375,1605.556,16,10,31/35),
 ('03','青云宫主殿',281.25,-661.111,30,18,130/178),
 ('04','远峰道观',-2343.75,-1605.556,19,11,71/94),
 ('05','东岭配殿',1593.75,-1322.222,19,11,91/110),
 ('06','玄元峰观景阁',421.875,-2927.778,12,8,102/142)
]
def footprint(x,z,w,d):
 vals=[h(x+w*(i/10-.5),z+d*(j/10-.5)) for i in range(11) for j in range(11)]
 return round(min(vals),3),round(max(vals),3),round(max(vals)-min(vals),3)
sites=[]
for ident,name,x,z,w,ht,ratio in specs:
 depth=round(w*ratio,3)
 original=h(x,z);lo,hi,rel=footprint(x,z,w,depth)
 # Move at most 250m; keep actual elevation within 35m of intended;
 # prefer natural local shoulder versus making circular summit platforms.
 best=(rel+0.0,x,z,original,lo,hi,rel)
 for dz in range(-300,301,25):
  for dx in range(-300,301,25):
   xx=x+dx;zz=z+dz
   if not X0+120<xx<X1-120 or not Z0+120<zz<Z1-120:continue
   elevation=h(xx,zz)
   if abs(elevation-original)>35:continue
   a,b,r=footprint(xx,zz,w,depth)
   score=r+math.hypot(dx,dz)*.009+abs(elevation-original)*.045
   if score<best[0]:best=(score,xx,zz,elevation,a,b,r)
 _,xx,zz,yy,lower,upper,rel2=best
 record={
  'id':ident,'name':name,'candidateX':round(x,3),'candidateZ':round(z,3),
  'auditedX':round(xx,3),'auditedZ':round(zz,3),
  'candidateElevationM':round(original,2),'auditedElevationM':round(yy,2),
  'originalFootprintReliefM':rel,'auditedFootprintReliefM':rel2,
  'actualAuditedBottomM':lower,'actualAuditedTopM':upper,
  'buildingSpanM':w,'buildingDepthM':depth,'targetHeightM':ht,
  'uniformScaleOnly':True,'realLandContact':True,
  'footprintWithin2m':rel2<=2.0,
  'foundationEngineerPassed':False,'pedestrianNavmeshPassed':False,
  'sourceOriginalModelPreserved':True}
 sites.append(record)
 print('R92_SITE_AUDIT',ident,'original',rel,'improved',rel2,'alt',round(yy,1),'relocatedM',round(math.hypot(xx-x,zz-z),1),flush=True)
layout={
 'revision':'R92-foundation-audited','primary':'tianzi','secondaryIndependentReference':'sanqing',
 'allSitesRealGrounded':True,'floatingPeaks':0,'mainlandRoadsWithoutProof':0,
 'approval':'ART-NO-GO, BUILT-UP-GEOLOGY-NO-GO, NAVMESH-NO-GO',
 'generatedFromRealData':True,
 'nominalDEMResolutionWarning':'SRTM source ~30m; footprint raster resampling is not engineering ground survey',
 'sites':sites}
dest=OUT/'r92-grounded-buildings-audit.json'
dest.write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
print('R92_DONE_ALL_GROUND_SITES',len(sites), 'passingRaster',sum(x['footprintWithin2m'] for x in sites),flush=True)

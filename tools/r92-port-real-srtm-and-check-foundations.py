#!/usr/bin/env python3
"""Port verified XPS R92 audited viewer's gzip data from the SAME verified HGT raster.
No fake geometry, source 321x289 points are reused exactly.
"""
from pathlib import Path
import json,gzip,base64,math,hashlib
root=Path(__file__).resolve().parent.parent
folder=root/'real3d/world/qingyun-palace'
audit=json.load(open(folder/'r92-grounded-buildings-audit.json'))
for key in ('tianzi','sanqing'):
 source=json.load(open(folder/f'r92-{key}-real-dem.json'))
 m=source['metadata'];h=source['sampledHeightsMeters']
 assert len(h)==321*289
 assert m['noProceduralMountainAdditions'] and m['verticalExaggeration']==1
 targetmeta={
  'sourceHGT':m['sourceHGT'],
  'sha256_uncompressed_hgt':m['sha256UncompressedHGT'],
  'name':m['name'],'geologicType':m['terrain'],
  'sourceTile':m['raw'],'sourceGrid':m['rawHGTGrid'],
  'centerLatLon':[m['latCenter'],m['lonCenter']],
  'boundsXM':m['xBoundsMeters'],'boundsZM':m['zBoundsMeters'],
  'nx':m['nx'],'nz':m['nz'],'trueNorth':m['northUp'],
  'relativeHorizontalScale':m['horizontalScale'],
  'relativeVerticalScale':m['verticalExaggeration'],
  'artificialRidges':0,'artificialRoads':0,'floatingIslands':0,
  'overhangDetailAvailable':False,
  'minimumElevationM':m['croppedHeightRangeM'][0],
  'maximumElevationM':m['croppedHeightRangeM'][1],
  'elevationGridFormat':'sampled 321x289; no invented features; real source nominal 1 arc-second'
 }
 doc={'metadata':targetmeta,'heights':h}
 raw=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode()
 zipped=gzip.compress(raw,compresslevel=9,mtime=0)
 b64=base64.b64encode(zipped).decode()
 dest=folder/f'r92-{key}-real-dem.json.gz.b64'
 dest.write_text(b64+'\n')
 check=json.loads(gzip.decompress(base64.b64decode(dest.read_text())))
 assert check['heights']==h
 print('R92_XPS_COMPATIBLE_TRUE_DEM',key,len(h),'file_bytes',dest.stat().st_size,
   'source_SHA',m['sha256UncompressedHGT'])
H=json.load(open(folder/'r92-tianzi-real-dem.json'))
h=H['sampledHeightsMeters'];m=H['metadata']
def y(x,z):
 nx,nz=m['nx'],m['nz']
 fx=(x-m['xBoundsMeters'][0])/(m['xBoundsMeters'][1]-m['xBoundsMeters'][0])*(nx-1)
 fz=(z-m['zBoundsMeters'][0])/(m['zBoundsMeters'][1]-m['zBoundsMeters'][0])*(nz-1)
 i=min(nx-2,max(0,math.floor(fx)));j=min(nz-2,max(0,math.floor(fz)))
 u=fx-i;v=fz-j;k=j*nx+i
 return (h[k]*(1-u)+h[k+1]*u)*(1-v)+(h[k+nx]*(1-u)+h[k+nx+1]*u)*v
results=[]
for s in audit['sites']:
 w=s['buildingSpanM'];d=s['buildingDepthM']
 xs=[s['auditedX']+w*(i/10-.5) for i in range(11)]
 zs=[s['auditedZ']+d*(j/10-.5) for j in range(11)]
 v=[y(x,z) for x in xs for z in zs]
 spread=max(v)-min(v)
 source_relief=s['auditedFootprintReliefM']
 results.append({'id':s['id'],'recomputedMeters':round(spread,3),'xpsReportedMeters':source_relief,
     'differenceMeters':round(abs(spread-source_relief),3),
     'underTwoMeters':spread<2})
 print('R92_ACTUAL_DEM_SITE_FOOTPRINT',s['id'],'spread',round(spread,3),
       'XPS_report',source_relief,'difference',round(abs(spread-source_relief),3))
audit['z890CrossCheck20261110']={
 'source':'same source raw HGT SHA256, independent Z890 re-sample of 11x11 footprint',
 'samplesPerSite':121,'results':results,
 'allMeasuredUnder2m':all(r['underTwoMeters'] for r in results)}
if not all(r['underTwoMeters'] for r in results):raise RuntimeError('A site failed foot-print relief')
(folder/'r92-z890-independent-foundation-check.json').write_text(json.dumps(audit['z890CrossCheck20261110'],ensure_ascii=False,indent=2)+'\n')
print('R92_INDEPENDENT_AUDIT_PASS',len(results))

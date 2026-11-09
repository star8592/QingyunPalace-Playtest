#!/usr/bin/env python3
"""R91 unwarped, georeferenced Wudang SRTM crop. No subjective peaks or ridge height synthesis."""
import gzip, hashlib, json, math
from pathlib import Path
import numpy as np
base=Path('/home/master/projects/qingyun-real-dem-20261109')
dest=Path(__file__).resolve().parent.parent/'real3d/world/qingyun-palace/r91-wudang-exact-grid.json'
gold_lat,gold_lon=32.40116,111.00430  # official-like Golden Hall reference; site mapping documented
nx,nz=321,289
xmin,xmax=-3750,3750
zmin,zmax=-3400,3400
east_per_deg=111195*math.cos(math.radians(gold_lat))
north_per_deg=111195.
tiles={}
for lon_tile in (110,111):
 path=base/f'N32E{lon_tile}.hgt.gz'
 raw=gzip.open(path,'rb').read()
 arr=np.frombuffer(raw,dtype='>i2').reshape((3601,3601))
 tiles[lon_tile]=(arr,hashlib.sha256(raw).hexdigest())
def dem_meter(x,z):
 # Project in true north-up ENU coordinates. Reference physical gold peak
 # occurs at original Qingyun main-pavilion x=0,z=-550; x east+, z north-.
 lat=gold_lat-(z+550)/north_per_deg
 lon=gold_lon+x/east_per_deg
 lon_tile=math.floor(lon)
 tile=tiles[lon_tile][0]
 iy=(33-lat)*3600
 ix=(lon-lon_tile)*3600
 i=int(math.floor(iy));j=int(math.floor(ix))
 if i<0 or i>=3600 or j<0 or j>=3600:raise ValueError((x,z,lat,lon))
 dx=ix-j;dy=iy-i
 a=float(tile[i,j]);b=float(tile[i,j+1])
 c=float(tile[i+1,j]);d=float(tile[i+1,j+1])
 if min(a,b,c,d)<-1000:raise ValueError('SRTM void/invalid in crop')
 return a*(1-dx)*(1-dy)+b*dx*(1-dy)+c*(1-dx)*dy+d*dx*dy
source_sites={
 '01':(0,2880),'02':(-2180,980),'03':(0,-550),
 '04':(-2400,-1810),'05':(2400,-1710),'06':(100,-2990)
}
site_m={key:round(dem_meter(*xz),2) for key,xz in source_sites.items()}
gate=site_m['01']
samp=np.empty(nx*nz,dtype=np.int16)
for iz in range(nz):
 z=zmin+(zmax-zmin)*iz/(nz-1)
 for ix in range(nx):
  x=xmin+(xmax-xmin)*ix/(nx-1)
  samp[iz*nx+ix]=round(dem_meter(x,z))
doc={'version':'R91-exact-Wudang-DEM-1','metadata':{
 'geographicSource':'Mapzen Terrain Tiles Skadi 30m SRTM-derived two genuine source HGT tiles',
 'sourceAttribution':'SRTM terrain data courtesy of USGS; Terrain Tiles (Mapzen)',
 'officialSourceRegistry':'https://registry.opendata.aws/terrain-tiles/',
 'sourceTiles':[{'file':f'N32E{lon}.hgt.gz','uri':f'https://elevation-tiles-prod.s3.amazonaws.com/skadi/N32/N32E{lon}.hgt.gz','sha256_uncompressed_HGT':tiles[lon][1]} for lon in tiles],
 'goldenHallReferenceLat':gold_lat,'goldenHallReferenceLon':gold_lon,
 'northUp':True,'rotationDegrees':0,'horizontalScale':1,'verticalExaggeration':1,
 'noSyntheticPeaks':True,'noSyntheticRidgeConnections':True,'noArtificialTerrainSmoothing':True,
 'referenceOriginalGameAnchor':'03 x=0,z=-550 is true Wudang golden summit location; all other sites may migrate',
 'widthMeters':7500,'depthMeters':6800,'xBounds':[xmin,xmax],'zBounds':[zmin,zmax],
 'gridNx':nx,'gridNz':nz,'heightMetersAbsoluteDatum':'SRTM elevations, meters',
 'renderHeightOffsetMeters':-gate,'siteRawElevationsAtLegacyCoords':site_m,
 'measuredTerrainMin':int(samp.min()),'measuredTerrainMax':int(samp.max()),
 'routeGeometryAdded':False,'constructionArtApproved':False},
 'elevationsMeters':samp.tolist()}
dest.write_text(json.dumps(doc,separators=(',',':'))+'\n')
print('R91_REAL_GEOLOGIC_GRID',dest,len(samp),'minmax',int(samp.min()),int(samp.max()),'gate',gate,'referenceSummit',site_m['03'])
print('R91_SIX_LEGACY_SITES_TRUE_DEM_ALT',site_m)
print('R91_DEM_BYTES',dest.stat().st_size)

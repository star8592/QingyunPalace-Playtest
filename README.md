# 青云宫 R90 · 武当山真实高程参考：主体山脉实时三维试验

**公网实时试玩**：https://star8592.github.io/QingyunPalace-Playtest/

此仓库是开发者审美验收用的 **独立实时 3D 场景**。正式主站 PlayMoru 未改动。原 R89/R88 实景仍完整保留。

## 这一次改动的是整个主山脉，不是三座悬浮碎峰

R58 原本使用6个圆形高程山包，再用6条**250–340米宽**直线巨脊强行连接山峰；R60又将道路模型做成**14米宽的双侧栏杆大型道路**。这就是整体地貌和“连车都能开上去”的假象。

R90 不再用圆形等高山包+直线脊线为新地貌，而是从**武当山实测公开数字高程 SRTM/Mapzen 30m级高程**提取地形，以约321×289采样点映射到原有 7.5×6.8km 游戏地图；保留六区**项目坐标**、01山门/02西崖/03青云宫的既有建筑平台位置，④⑤⑥三座独立浮峰继续保持完整，不破坏建筑与原生瓦件的源模型。

为适配虚构世界的六区位置，采样选取了武当 N32E111 范围、中心 32.4N 111.074E、旋转 -70°，然后做游戏标高适配；**这不是与真实武当山一一对应的复原地图**。源模型和旧版保留，可以切换。

新地貌上的道路模型**只保留01山门至03主殿的一条2.4米窄步道视觉原型**，曲折贴着真实三角面爬坡，不再假装每个山头都能连一条大公路。部分陡坡段仍需要真正的台阶工程、落脚验证、导航网格与玩家角色碰撞，当前不可宣称已经可通行。04/05/06浮峰没有可通行的接驳路线。

### 真实浏览器证据

- [主山脉远近景：R89旧版 vs R90真实 DEM 版同机位对照](evidence/r90-real-wudang-mainland/R90-WUDANG-DEMO-FINAL-CHROME-AB.jpg)
- 同目录 4 张1774×887 Chrome WebGL真实场景截图、原始验收JSON、像素差异。
- 源网格完全非破坏性：R90只切换**可回退的 R58/R63派生三角面层**，权威R58原始顶点数组和六区蓝图不改。
- 无RTX长时间验收、无原画级签收，也没有完整的植被、水系、真实古神道路基/台阶与可导航认证。
- 入口支持鼠标左键旋转、滚轮缩放、右键平移，按钮“R90 主体山脉：新版/旧版”可实时比较，“整座主山脉 / 进山步道”切镜头。

### 公开数字地形资料与署名

- NASA / USGS Shuttle Radar Topography Mission，约30m级裸地高程数据：https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm
- Mapzen/Terrain Tiles Open Data via AWS：https://registry.opendata.aws/terrain-tiles/
- 具体可重复获取 HGT源：https://elevation-tiles-prod.s3.amazonaws.com/skadi/N32/N32E111.hgt.gz
- 独立裁切后缩采样地形：real3d/world/qingyun-palace/r90-wudang-dem-grid.json（带源、旋转、比例、位置与非精确复原标签）。
- 武当山地貌资料：https://www.thepaper.cn/newsDetail_forward_14062459
- 武当南岩古神道真实路径：https://wdsdjxh.com/detail.php?id=128

**美术结论**：主体山脉的真实谷地、横向支脉已经比以前更接近自然，但旧建筑平台、悬浮峰落地交通、植被和河流仍会显得不协调。R90是尚未签收的研究候选，PlayMoru正式服不发布。


## R90 山路实测修正（2026-11-09）
已用 A* 在实际 SRTM 派生地形寻找 01 山门至 03 主殿的窄路，路线约 6.48 km，宽度 2.4 m；不再使用 14 m 宽的车辆级道路。平缓路段坡度最高为 24%；126 个较陡路段改为 3,535 级有体积的石阶，石阶段总长约 1.80 km。道路与石阶按最终显示的 R58/R63 地表定位，避免被山体覆盖。**这属于三维美术与几何验证，尚未通过角色碰撞、石阶可行走性或 NavMesh 验收。** 参考 [真实浏览器截图和数据](evidence/r90-real-wudang-mainland/R90-WUDANG-DEMO-FINAL-CHROME-AB.jpg)。

## R91 严格真实武当DEM底盘（独立候选）
[实时打开 R91 真武当大山三维场景：默认隐藏待完善浮峰](real3d/art/blueprint-r91/viewer.html?focus=all&floats=0)

[八张真实Chrome验收与四视图合成](evidence/r91-real-wudang/R91-TRUE-WUDANG-FOUR-VIEWS-ACTUAL-CHROME.jpg)

地理源来自武当金顶两块真实SRTM瓦片，真北、1:1比例、无程序造峰；01/03/04/05接入原有3D建筑。浮峰下部与全部路径仍是待深化项目，不能宣称完成。详情参见R91-TRUE-WUDANG-ART-GATE.md。

## R92 张家界天子山+三清山独立参考场景（研发候选）
- [真实 WebGL 试玩](real3d/art/blueprint-r92/viewer.html?focus=all)
- [R92 实拍四视角拼图](evidence/r92-real-chrome/R92-Z890-ACTUAL-FOUR-VIEWS.jpg)
- [完整9张截图的原始验收报告](evidence/r92-real-chrome/R92-TRUE-GEOLOGY-REAL-CHROME-REPORT.json)
- [地貌与建筑实际不足](R92-TIANZI-SANQING-REAL-GEOLOGY-ART-REVIEW-20261110.md)

六区建筑高程足迹筛选通过，主体山脉SRTM真实，但缺张家界砂岩柱体真实3D侧壁、悬挑、植被与建筑高精度承托。ART NO-GO，保留旧版R91和正式PlayMoru。
## R94 单峰美术研究（可交互 3D）

- [R94 真人工摆放崖松的单峰 WebGL 模型](real3d/art/blueprint-r94/viewer.html?view=three)
- 母版为 2026-11-10 用户认可的原创仙山原画；真实图像转3D生成岩体、Blender调整并加入 CC0 三维崖松。模型仅供美术审阅，不代表正式游戏发布。
## R95 单峰两殿 · 青云宫建筑与岩体实景验证

- [R95 单峰主殿与半山亭阁 WebGL 真实可旋转预览](real3d/art/blueprint-r95/viewer.html?focus=all&view=three)（整峰、峰顶、半山、建筑显隐、原峰对照）。
- 在 R94 原图转 3D 峰体上复用现有 R71/R66 真三维建筑资产，并在真实 RTX 5070 Ti WebGL 中复核，测试为艺术设计候选而非美术最终验收。
## R96 一峰登山：崖壁石阶与宫殿实物几何（技术美术候选）

- [打开 R96 单峰两殿与崖壁石阶真实 WebGL 预览](real3d/art/blueprint-r96/viewer.html?focus=all&view=three)，提供原峰对照、宫殿显隐、石阶显隐和石阶近景。
- 不修改 R94 用户认可的图转3D自然山体；新增的是 R66 已有实物建筑台阶、石护栏、廊柱，以 Blender 人工设计路线并依照岩面采样调整位置。R95 保留独立可回退。
- 这仍是**美术和构图验收版，不是已验收可通行的玩法地图**；人物碰撞、导航、局部台阶衔接仍需后续逐项验证。

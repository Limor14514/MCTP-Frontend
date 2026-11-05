# 索引页 3D 模型制作教程（2026-11-05）

## 0. 现在的模型是怎么来的

索引页背后的方块小岛和像素齿轮**没有用任何模型文件**，是代码实时拼出来的：
`src/site/three/VoxelStage.js` 中，`buildIsland()` 用一个个 1×1×1 的立方体堆出小岛，`buildGear()` 用小立方体拼出齿轮。
它们只是占位，正式素材到位后会被自动替换：

| 放什么 | 放到哪里（文件名固定） | 替换掉 |
| --- | --- | --- |
| 3D 场景（服务器地图、建筑） | `public/models/scene.glb` | 方块小岛 |
| 驱动模型（齿轮、传动轴等） | `public/models/driver.glb` | 像素齿轮 |

把文件放进去、刷新页面就生效，不用改代码。文件不存在时继续用占位模型，页面不会报错。

## 1. 用什么格式：`.glb`

- **格式**：glTF 2.0 的二进制版本，后缀 **`.glb`**。网页 3D（three.js）原生支持它，一个文件里就包含模型、贴图和动画。
- **不能直接用的格式**：
  - `.bbmodel`（Blockbench 工程）
  - `.obj` / `.fbx`
  - `.schem` / `.nbt`（结构文件）
  - 存档文件夹

  这些都要先转成 `.glb`，方法见下文。
- **单位**：1 个方块 = 1 个单位长度。
- **体积**：场景压缩后尽量 **小于 8 MB**，驱动模型 **小于 1 MB**，否则手机加载会很慢。

## 2. 驱动模型（driver.glb）：用 Blockbench 做

适合齿轮、传动轴、传送带这类小模型，可以带转动动画。

### 2.1 获取 Blockbench
到 https://www.blockbench.net 下载 Windows 版并安装，免费。

### 2.2 两种做法，任选一种

**做法 A：自己建模**
1. 选择 File → New → **Generic Model**（通用模型）。
2. 用 Add Cube 添加方块，在右侧调尺寸。Blockbench 中 16 像素 = 1 个方块。
3. 在 Paint 标签里新建 16×16 的贴图并画像素。

**做法 B：直接用机械动力模组里的模型**
1. 到 Modrinth 或 CurseForge 下载机械动力（Create）模组的 `.jar` 文件。
2. 把 `.jar` 复制一份，后缀改成 `.zip` 后解压，模型和贴图在这两个文件夹：
   - 模型：`assets/create/models/block/`（例如以 `cogwheel` 开头的就是齿轮）
   - 贴图：`assets/create/textures/block/`
3. 在 Blockbench 里用 File → Open Model 打开对应的 `.json`。如果提示找不到贴图，手动指到上面的贴图文件夹。
4. 版权：Create 的源码仓库标注为 MIT 许可，但正式上线前请自己再核对一遍它的 LICENSE，并在网站上注明出处。

### 2.3 做转动动画（可选）
1. 切到右上角的 **Animate** 标签，在左侧新建动画，命名为 `spin`，Loop 选 **Loop**。
2. 选中整个模型（或齿轮所在的骨骼 group），在第 0 秒打旋转关键帧 0°，在第 1 秒打关键帧 360°。
3. 网页会自动循环播放模型里的所有动画。不做动画也可以：网页本身就会让驱动模型绕 Z 轴转动，转速跟着分段变化。

### 2.4 导出
1. 选择 File → Export → **Export glTF Model**。
2. 导出选项：
   - Encoding（编码）选 **Binary**，也就是 `.glb`。
   - 勾选嵌入贴图（Embed Textures）。
   - 做了动画就勾选导出动画（Animations）。
   - 缩放（Scale）保持默认的 16，即 16 像素 = 1 单位。
3. 保存为 `public/models/driver.glb`。

### 2.5 在网页里摆正
网页会让驱动模型**绕 Z 轴（正对镜头的方向）转动**。如果你的齿轮是平躺的（Create 的齿轮默认转轴是竖直的 Y 轴），打开 `src/site/three/VoxelStage.js`，在顶部的 `MODELS.driver` 里把它立起来：

```js
driver: { url: `${BASE}models/driver.glb`, scale: 3, position: [0, 0, 0], rotation: [90, 0, 0] },
```

- `scale`：占位齿轮直径大约 6 格。如果你的齿轮只有 1～2 格大，就设成 3 左右。
- `rotation`：单位是度，`[90, 0, 0]` 表示绕 X 轴转 90°，把平躺的齿轮立起来。

## 3. 场景模型（scene.glb）：从服务器存档导出

这条路线是：存档 → Mineways 导出 `.obj` → Blender 整理 → 导出 `.glb`。

### 3.1 拿到存档
- 服务器：从服务器根目录把 `world/` 文件夹完整下载下来。如果用了面板，就在面板的文件管理里打包下载。
- 单人存档：在 `%APPDATA%\.minecraft\saves\<存档名>\`。
- 下载前最好先关服或执行 `save-all`，保证存档是最新的。

### 3.2 用 Mineways 导出 `.obj`
1. 到 https://www.realtimerendering.com/erich/minecraft/public/mineways/ 下载 Mineways（Windows，免费、免安装）。
2. 选择 File → Open World → 选中存档文件夹里的 `level.dat`。
3. 在俯视图上用**鼠标右键拖拽**框出要导出的区域。范围别太大，几十×几十格就够一屏看了。用左边的 Depth / Height 设置最低和最高高度，把地底切掉。
4. 选择 File → **Export for Rendering**：
   - 文件类型选 `.obj`。
   - 勾选 "Export separate objects"（按方块类型拆成独立物体，方便在 Blender 里分图层）。
   - 贴图选 "Export full color texture patterns"（会导出一张贴图图集）。
   - **不要勾选** "Make Z the up direction"。保持默认的 Y 向上，Blender 导入 `.obj` 时会自动转换方向。
5. 导出后会得到 `.obj`、`.mtl` 和贴图 `.png`。三个文件要放在同一个文件夹里。

> **注意**：Mineways（以及同类工具 jmc2obj）**只认原版方块**，机械动力的机器会显示成未知方块或直接缺失。
> 建议这样做：原版地形和建筑用 Mineways 导出；机械动力的机器按第 2 节在 Blockbench 里打开模组模型，再分别导出成 `.glb` 或 `.obj`，最后在 Blender 里摆到场景中对应的位置。

### 3.3 用 Blender 整理
1. 到 https://www.blender.org 下载并安装 Blender（免费）。
2. 选择 File → Import → **Wavefront (.obj)**，导入刚才的文件。有机械动力机器的话，再用 File → Import → glTF 2.0 导入它们，摆好位置。
3. 必做：
   - **把场景中心挪到原点 (0,0,0)**：地面高度大约在 0。
   - **确认 1 方块 = 1 单位**：按 N 键看尺寸，一个方块应为 1 m。
   - **贴图保持像素清晰**：在 Shading 标签里把每个 Image Texture 节点的插值改成 **Closest**。网页端也会强制这样处理，这一步主要是为了在 Blender 里看得准。
4. 建议做：
   - 删掉看不见的部分（地底、背面）。
   - 按"地形 / 建筑 / 装饰 / 生物"分到不同的 Collection，以后想分图层加载时直接按 Collection 分开导出。

### 3.4 从 Blender 导出 `.glb`
1. 选择 File → Export → **glTF 2.0 (.glb/.gltf)**。
2. 设置：
   - Format：**glTF Binary (.glb)**
   - Include：勾选 Visible Objects（只导出可见的）
   - Transform：保持 **+Y Up** 勾选（默认就是）
   - Data → Mesh：勾选 Apply Modifiers
   - Data → Compression（Draco）：**不要勾选**。本站用的是下一步的 meshopt 压缩，网页没有加载 Draco 解码器。
   - Animation：场景里有会动的东西就勾选。
3. 保存为 `public/models/scene.glb`。

## 4. 压缩（强烈建议）

用 gltf-transform 命令行压缩，要求电脑上装有 Node.js。在 `Showcase` 目录下运行：

```bash
npx @gltf-transform/cli optimize public/models/scene.glb public/models/scene.glb --compress meshopt --simplify false --texture-compress false
```

- `--compress meshopt`：压缩网格。网页已经内置 meshopt 解码，不用额外配置。
- `--simplify false`：**不要减面**。方块模型减面后会出现破洞和歪斜。
- `--texture-compress false`：像素贴图本来就很小，有损压缩反而会让颜色发脏。

压缩前后都可以把文件拖到 https://gltf.report 或 https://gltf-viewer.donmccurdy.com 预览，确认模型和贴图都正常。

## 5. 在网页里调位置和镜头

- **模型位置**：在 `src/site/three/VoxelStage.js` 顶部的 `MODELS.scene` 里改 `scale`、`position`、`rotation`。
- **镜头机位**：在同一文件的 `SHOTS` 数组里改，每一项对应索引页的一段：
  - `pos`：相机位置
  - `look`：注视点
  - `gear`：驱动模型位置
  - `spin`：转速
- **找机位的技巧**：运行开发服务器打开索引页，按 F12 打开控制台，输入：
  ```js
  __voxelStage.camera.position.set(20, 10, 25)   // 试相机位置
  __voxelStage.look.set(0, 2, 0)                 // 试注视点
  ```
  觉得合适了，把数字抄回 `SHOTS` 即可。`__voxelStage` 只在开发环境存在，正式构建里没有。

## 6. 素材从哪里来

| 来源 | 用途 | 怎么获取 | 版权提醒 |
| --- | --- | --- | --- |
| 你们自己的服务器存档 | 场景（最贴切） | 见 3.1 | 自己的建筑可以放心用；其他玩家的建筑最好征得同意 |
| 机械动力模组 `.jar` | 机器模型、贴图 | 见 2.2 做法 B | MIT 许可，上线前请自行核对并注明出处 |
| 原版 Minecraft 贴图 | 方块、物品贴图（包括时钟） | 你自己的 `.minecraft/versions/<版本>/<版本>.jar` → `assets/minecraft/textures/` | 版权属于 Mojang，请遵守 Minecraft 使用准则（Usage Guidelines），不要用于商业用途 |
| Sketchfab | 现成的 Minecraft 风格模型 | 搜索时勾选 Downloadable，下载格式选 glTF | 逐个看许可，CC-BY 需要署名 |
| Planet Minecraft | 别人分享的地图、结构 | 下载存档后按第 3 节导出 | 必须看作者的授权说明 |
| Poly Haven | 天空盒（HDRI） | https://polyhaven.com/hdris | CC0，可以随意使用 |

## 7. 自检清单

- [ ] 文件名和位置正确：`public/models/scene.glb`、`public/models/driver.glb`
- [ ] 在 gltf.report 中预览正常，贴图没有丢失
- [ ] 1 方块 = 1 单位，场景中心在原点附近
- [ ] 压缩后场景小于 8 MB，驱动模型小于 1 MB
- [ ] 刷新索引页后，控制台没有出现 "[VoxelStage] 未加载 …" 的提示（出现这条说明没读到文件，页面仍在用占位模型）

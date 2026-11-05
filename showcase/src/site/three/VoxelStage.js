/**
 * 文件用途：索引页背后的 3D 舞台（three.js）
 * 作用：
 *  1. "驱动模型"：一个由方块拼成的像素齿轮（Create 模组的核心意象，占位模型），
 *     会随分段滑动做"散开 → 组装"、加速旋转等动画（参考 animejs 首页的立体相机模型）；
 *  2. "3D 场景"：一座方块小岛（草方块/泥土/石头），镜头在各分段之间飞行切换机位
 *     （参考 q-industrial 的场景镜头转换）。
 *  3. 每个分段对应一组镜头关键帧 SHOTS[i]；IndexPage 切段时调用 goTo(i)。
 * 素材替换（第三轮已接好，不用改代码）：
 *  - 把场景模型放到 public/models/scene.glb，驱动模型放到 public/models/driver.glb；
 *  - 页面会自动尝试加载：加载成功就隐藏对应的占位模型（方块小岛 / 像素齿轮），失败或不存在就继续用占位；
 *  - 模型的缩放、位置、旋转在下方 MODELS 里调；镜头机位在 SHOTS 里调；
 *  - 详细的建模、导出、压缩教程见 docs/3d-model-guide.md。
 */
import * as THREE from 'three'
import gsap from 'gsap'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

// 可选的正式模型（放在 public/models/ 下）。scale / position / rotation（度）用来把模型摆到占位模型的位置
const BASE = import.meta.env.BASE_URL
const MODELS = {
  scene: { url: `${BASE}models/scene.glb`, scale: 1, position: [0, -1, 0], rotation: [0, 0, 0] },
  driver: { url: `${BASE}models/driver.glb`, scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] },
}

// 镜头关键帧：pos 机位、look 注视点、gear 齿轮位置、spin 齿轮转速（弧度/秒）
const SHOTS = [
  { pos: [15, 7, 24], look: [1.5, 2.2, 0], gear: [4, 3.4, 0], spin: 0.35 },
  { pos: [-13, 11, 15], look: [0, 1, 0], gear: [0, 5, 0], spin: 0.9 },
  { pos: [0.5, 27, 3], look: [0, 0, 0], gear: [0, 5, 0], spin: 1.6 },
  { pos: [16, 3.5, -7], look: [0, 2, 0], gear: [-1.5, 3.4, -2], spin: 0.6 },
  { pos: [0, 9, 34], look: [0, 2, 0], gear: [0, 3.6, 0], spin: 0.25 },
]

export const SHOT_COUNT = SHOTS.length

export class VoxelStage {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x0b0c10, 28, 64)

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    this.look = new THREE.Vector3(...SHOTS[0].look)
    this.camera.position.set(...SHOTS[0].pos)

    this.scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x2a2018, 1.1))
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.2)
    sun.position.set(8, 14, 6)
    this.scene.add(sun)

    this.island = this.buildIsland()
    this.scene.add(this.island)
    this.gear = this.buildGear()
    this.gear.group.position.set(...SHOTS[0].gear)
    this.scene.add(this.gear.group)

    this.state = { spin: SHOTS[0].spin, assemble: 0 }
    this.mixers = []
    this.clock = new THREE.Clock()
    this.resize = this.resize.bind(this)
    this.loop = this.loop.bind(this)
    window.addEventListener('resize', this.resize)
    this.resize()
    this.renderer.setAnimationLoop(this.loop)
    this.loadModels()
    // 仅开发环境：暴露舞台，方便在控制台里调机位，例如 __voxelStage.camera.position
    if (import.meta.env.DEV) window.__voxelStage = this
  }

  /**
   * 作用：尝试加载 public/models/ 下的正式模型，成功则替换占位模型。
   * 原因：素材是可选的——没放文件时 GLTFLoader 会报错，这里吞掉错误继续用占位，页面不受影响。
   */
  async loadModels() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    const load = async (cfg) => {
      try {
        const gltf = await loader.loadAsync(cfg.url)
        if (this.disposed) return null
        const root = gltf.scene
        root.scale.setScalar(cfg.scale)
        root.position.set(...cfg.position)
        root.rotation.set(...cfg.rotation.map((d) => THREE.MathUtils.degToRad(d)))
        // 像素贴图保持锐利：关闭贴图平滑与多级纹理（不然方块贴图会糊成一片）
        root.traverse((o) => {
          const mats = o.material ? [].concat(o.material) : []
          for (const m of mats) {
            for (const tex of [m.map, m.emissiveMap]) {
              if (!tex) continue
              tex.magFilter = THREE.NearestFilter
              tex.minFilter = THREE.NearestFilter
              tex.generateMipmaps = false
              tex.needsUpdate = true
            }
            if (m.map) m.alphaTest = Math.max(m.alphaTest, 0.5) // 树叶、玻璃等镂空方块
          }
        })
        // 模型自带的动画（例如 Blockbench 里做的齿轮转动）全部循环播放
        if (gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(root)
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
          this.mixers.push(mixer)
        }
        return root
      } catch (err) {
        if (import.meta.env.DEV) console.info(`[VoxelStage] 未加载 ${cfg.url}，继续使用占位模型`, err?.message || err)
        return null
      }
    }
    const [scene, driver] = await Promise.all([load(MODELS.scene), load(MODELS.driver)])
    if (scene) {
      this.island.visible = false
      this.scene.add(scene)
    }
    if (driver) {
      // 放进齿轮的 group：继续跟随各分段的位置、转速与左右轻摆
      this.gear.mesh.visible = false
      this.gear.group.add(driver)
      this.driverModel = driver
      gsap.fromTo(driver.scale, { x: 0, y: 0, z: 0 }, { x: MODELS.driver.scale, y: MODELS.driver.scale, z: MODELS.driver.scale, duration: 1.2, ease: 'back.out(1.6)' })
    }
  }

  /** 方块小岛：12×12 的高度场，顶层草、下层泥土、最底石头 */
  buildIsland() {
    const group = new THREE.Group()
    const box = new THREE.BoxGeometry(1, 1, 1)
    const mats = {
      grass: new THREE.MeshLambertMaterial({ color: 0x5fa83a }),
      dirt: new THREE.MeshLambertMaterial({ color: 0x7a5232 }),
      stone: new THREE.MeshLambertMaterial({ color: 0x8b8b86 }),
    }
    const cells = { grass: [], dirt: [], stone: [] }
    const N = 12
    for (let x = 0; x < N; x++) {
      for (let z = 0; z < N; z++) {
        const dx = x - N / 2 + 0.5
        const dz = z - N / 2 + 0.5
        const r = Math.hypot(dx, dz)
        if (r > N / 2) continue
        const top = Math.round(1 + Math.sin(x * 0.9) * 0.6 + Math.cos(z * 0.7) * 0.6)
        const depth = Math.max(1, Math.round((N / 2 - r) * 0.9))
        for (let y = top - depth; y <= top; y++) {
          const kind = y === top ? 'grass' : y > top - 2 ? 'dirt' : 'stone'
          cells[kind].push([dx, y - 1, dz])
        }
      }
    }
    const m = new THREE.Matrix4()
    for (const kind of Object.keys(cells)) {
      const mesh = new THREE.InstancedMesh(box, mats[kind], cells[kind].length)
      cells[kind].forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(...p)))
      group.add(mesh)
    }
    return group
  }

  /** 像素齿轮：外圈 + 齿 + 轴心，全部用 0.5 尺寸的小方块；记录散开/组装两套位置 */
  buildGear() {
    const group = new THREE.Group()
    const S = 0.4
    const box = new THREE.BoxGeometry(S, S, S * 1.6)
    const mat = new THREE.MeshLambertMaterial({ color: 0xc9a24a })
    const targets = []
    for (let x = -8; x <= 8; x++) {
      for (let y = -8; y <= 8; y++) {
        const r = Math.hypot(x, y)
        const ang = Math.atan2(y, x)
        const tooth = Math.cos(ang * 8) > 0.35
        const ring = r >= 4 && r <= 6.2
        const teeth = tooth && r > 6.2 && r <= 7.8
        const hub = r <= 1.6
        const spoke = r < 4 && (Math.abs(x) < 0.6 || Math.abs(y) < 0.6)
        if (ring || teeth || hub || spoke) targets.push(new THREE.Vector3(x * S, y * S, 0))
      }
    }
    const scatter = targets.map(() =>
      new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.2) * 20, (Math.random() - 0.5) * 30),
    )
    const mesh = new THREE.InstancedMesh(box, mat, targets.length)
    group.add(mesh)
    return { group, mesh, targets, scatter }
  }

  /** 根据 state.assemble（0 散开 → 1 组装完成）写入每个方块的位置 */
  applyAssemble() {
    const { mesh, targets, scatter } = this.gear
    const t = this.state.assemble
    if (t === this.lastAssemble) return // 组装完成后不再每帧重写矩阵
    this.lastAssemble = t
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const v = new THREE.Vector3()
    const s = new THREE.Vector3(1, 1, 1)
    for (let i = 0; i < targets.length; i++) {
      // 每块错开一点时间（按索引），组装时有"依次归位"的层次
      const k = THREE.MathUtils.clamp(t * 1.6 - (i / targets.length) * 0.6, 0, 1)
      const e = 1 - Math.pow(1 - k, 3)
      v.lerpVectors(scatter[i], targets[i], e)
      mesh.setMatrixAt(i, m.compose(v, q, s))
    }
    mesh.instanceMatrix.needsUpdate = true
  }

  /** 首次进入索引页：齿轮从漫天方块中组装起来（一次性） */
  intro() {
    gsap.fromTo(this.state, { assemble: 0 }, { assemble: 1, duration: 2.2, ease: 'power2.out' })
  }

  /** 切换到第 i 段的镜头 */
  goTo(i, duration = 1.2) {
    const s = SHOTS[Math.max(0, Math.min(SHOTS.length - 1, i))]
    const ease = 'power3.inOut'
    gsap.to(this.camera.position, { x: s.pos[0], y: s.pos[1], z: s.pos[2], duration, ease })
    gsap.to(this.look, { x: s.look[0], y: s.look[1], z: s.look[2], duration, ease })
    gsap.to(this.gear.group.position, { x: s.gear[0], y: s.gear[1], z: s.gear[2], duration, ease })
    gsap.to(this.state, { spin: s.spin, duration, ease })
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // 竖屏手机视野更窄，适当拉大 FOV 保证模型完整入镜
    this.camera.fov = w / h < 0.8 ? 62 : 45
    this.camera.updateProjectionMatrix()
  }

  loop() {
    const dt = this.clock.getDelta()
    this.gear.group.rotation.z -= this.state.spin * dt
    this.gear.group.rotation.y = Math.sin(this.clock.elapsedTime * 0.4) * 0.35
    this.island.rotation.y += dt * 0.04
    this.applyAssemble()
    for (const m of this.mixers) m.update(dt)
    this.camera.lookAt(this.look)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.mixers.forEach((m) => m.stopAllAction())
    this.renderer.setAnimationLoop(null)
    window.removeEventListener('resize', this.resize)
    gsap.killTweensOf([this.camera.position, this.look, this.state, this.gear.group.position])
    this.scene.traverse((o) => {
      o.geometry?.dispose()
      o.material?.dispose?.()
    })
    this.renderer.dispose()
  }
}

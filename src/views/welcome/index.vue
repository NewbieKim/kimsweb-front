<template>
  <div class="login-container">
    <div id="login-three-container"></div>
    <div class="login-plane" @click="goWorkBench">
      <div class="login-plane-container">
         <img class="login-plane-human" src="@/assets/images/login_human.png" alt="" />
          <div class="login-plane-title">
            welcome to lt-bot
          </div>
      </div>
    </div>
    <div class="login-ground"></div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import sky_img from '@/assets/images/sky.png'
import earth_bg from '@/assets/images/earth_bg.png'
import cloud_img from '@/assets/images/cloud.png'
import starflake1 from '@/assets/images/starflake1.png'
import starflake2 from '@/assets/images/starflake2.png'

const router = useRouter()
const container = ref<HTMLElement | null>(null)

// Three.js相关变量
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let sphere: THREE.Mesh
let particles_first: THREE.Points[] = []
let particles_second: THREE.Points[] = []
let zprogress = 0
let zprogress_second = 0

onMounted(() => {
  if (!container.value) return
  
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  const depth = 1400
  
  // 初始化场景
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x000000, 0, 10000)
  
  // 初始化相机
  const fov = 15
  const distance = width / 2 / Math.tan(Math.PI / 12)
  const zAxisNumber = Math.floor(distance - depth / 2)
  camera = new THREE.PerspectiveCamera(fov, width / height, 1, 30000)
  camera.position.set(0, 0, zAxisNumber)
  camera.lookAt(0, 0, 0)
  
  // 初始化渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  container.value.appendChild(renderer.domElement)
  
  // 初始化星球和粒子效果
  initSceneElements(width, height, depth, zAxisNumber)
  
  // 动画循环
  animate()
})

const initSceneElements = (width: number, height: number, depth: number, zAxisNumber: number) => {
  // 背景
  new THREE.TextureLoader().load(sky_img, (texture) => {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
    scene.add(new THREE.Mesh(geometry, material))
  })
  
  // 星球
  const sphereGeometry = new THREE.SphereGeometry(50, 64, 32)
  const sphereMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(earth_bg),
    blendDstAlpha: 1
  })
  sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.position.set(-400, 200, -200)
  scene.add(sphere)
  
  // 星星粒子
  const particles_init_position = -zAxisNumber - depth / 2
  zprogress = particles_init_position
  zprogress_second = particles_init_position * 2
  particles_first = initSceneStar(particles_init_position, width, height, depth, zAxisNumber)
  particles_second = initSceneStar(zprogress_second, width, height, depth, zAxisNumber)
}

const initSceneStar = (initZposition: number, width: number, height: number, depth: number, zAxisNumber: number) => {
  const geometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  const pointsGeometry: THREE.Points[] = []
  
  // 初始化500个粒子节点
  for (let i = 0; i < 500; i++) {
    vertices.push(
      THREE.MathUtils.randFloatSpread(width),
      Math.random() * height / 2,
      Math.random() * (zAxisNumber + depth / 2) - depth / 2
    )
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  
  // 创建两种不同材质的粒子
  const sprite1 = new THREE.TextureLoader().load(starflake1)
  const sprite2 = new THREE.TextureLoader().load(starflake2)
  
  const materials = [
    new THREE.PointsMaterial({ size: 50, map: sprite1, blending: THREE.AdditiveBlending, transparent: true }),
    new THREE.PointsMaterial({ size: 20, map: sprite2, blending: THREE.AdditiveBlending, transparent: true })
  ]
  
  materials.forEach(material => {
    const particles = new THREE.Points(geometry, material)
    particles.rotation.set(
      Math.random() * 0.2 - 0.15,
      Math.random() * 0.2 - 0.15,
      Math.random() * 0.2 - 0.15
    )
    particles.position.setZ(initZposition)
    scene.add(particles)
    pointsGeometry.push(particles)
  })
  
  return pointsGeometry
}

const animate = () => {
  requestAnimationFrame(animate)
  
  // 星球自转
  if (sphere) {
    sphere.rotation.y += 0.001
  }
  
  // 粒子移动
  zprogress += 1
  zprogress_second += 1
  
  particles_first.forEach(item => item.position.setZ(zprogress))
  particles_second.forEach(item => item.position.setZ(zprogress_second))
  
  renderer.render(scene, camera)
}

const goWorkBench = () => {
  router.push({ path: '/workBench' })
}
</script>

<style lang="scss" scoped>
  .login-container {
    width: 100%;
    height: 100vh;
    position: relative;
    #login-three-container {
      width: 100%;
      height: 100%;
    }
    .login-plane {
      position: absolute;
      z-index: 9999;
      width: 600px;
      height: 100px;
      cursor: pointer;
      background-image: url('@/assets/images/login_border.png');
      background-repeat: no-repeat;
      background-size: 100% 100%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      .login-plane-container {
        width: 100%;
        height: 100%;
        border-radius: 18px;
        background-color: #007eff2e;
        position: relative;
        @keyframes humanMove {
          0% {
            top: -100px;
          }
          25% {
            top: -120px;
          }
          50% {
            top: -100px;
          }
          75% {
            top: -80px;
          }
          100% {
            background: -100px;
          }
        }
        .login-plane-human {
          position: absolute;
          width: 260px;
          right: -120px;
          top: -100px;
          animation: humanMove 8s linear 0s infinite normal;
        }
        .login-plane-title {
          width: 100%;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 35px;
          color: #fff;
          font-weight: 700;
          img {
            width: 50%;
          }
          .login-plane-title-line {
            width: 80%;
            position: absolute;
            bottom: 0;
          }
        }
        .login-plane-form {
          padding: 45px 55px;
          box-sizing: border-box;
          .login-code-container {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            .login-code {
              cursor: pointer;
              width: 45%;
              height: 40px;
              background-color: #c8c8c8;
              img {
                width: 100%;
                height: 100%;
              }
            }
          }
        }
      }
    }
    .login-ground {
      position: absolute;
      z-index: 9998;
      width: 100%;
      height: 400px;
      background-image: url('@/assets/images/ground.png');
      background-repeat: no-repeat;
      background-size: 100% 100%;
      bottom: 0;
      left: 0;
    }
  }
</style>
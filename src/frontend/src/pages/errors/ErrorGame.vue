<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {useI18n} from "vue-i18n";
const { t } = useI18n()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const score = ref(0)
const highscore = ref(0)
const gameRunning = ref(false)
const isGameOver = ref(false)
const selectedControl = ref<'classic' | 'cool'>('cool')

const controlInfoText = computed(() => {
  return selectedControl.value === 'classic'
      ? t("pages.error.game.controls.classic.description")
      : t("pages.error.game.controls.cool.description")
})

const playerImage = new Image()
playerImage.src = '/assets/zyneon/img/icons/0.png'

const enemyImageSources = [
  '/assets/zyneon/img/icons/1.png',
  '/assets/zyneon/img/icons/2.png',
  '/assets/zyneon/img/icons/3.png'
]
const loadedEnemyImages = enemyImageSources.map(src => {
  const img = new Image()
  img.src = src
  return img
})

const keys: Record<string, boolean> = {
  ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
  w: false, s: false, a: false, d: false,
  ' ': false
}

let mouseX = 0
let animationFrameId = 0
let lastTime = 0
let spawnInterval = 1.0
let enemyTimer = 0

class Player {
  width = 40
  height = 40
  x: number
  y: number
  speed = 600

  constructor() {
    const canvas = canvasRef.value!
    this.x = canvas.width / 2 - this.width / 2
    this.y = canvas.height - 80
  }

  update(dt: number) {
    const canvas = canvasRef.value!
    if (selectedControl.value === 'classic') {
      if (keys.ArrowLeft || keys.a) this.x -= this.speed * dt
      if (keys.ArrowRight || keys.d) this.x += this.speed * dt
    } else if (selectedControl.value === 'cool') {
      this.x = mouseX - this.width / 2
    }

    if (this.x < 0) this.x = 0
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width
  }

  draw() {
    if (!ctx) return
    if (playerImage.complete && playerImage.naturalWidth > 0) {
      ctx.drawImage(playerImage, this.x, this.y, this.width, this.height)
    } else {
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(this.x, this.y, this.width, this.height)
    }
  }
}

class Bullet {
  x: number
  y: number
  width = 4
  height = 15
  speed = 600
  color = '#ff0'

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  update(dt: number) {
    this.y -= this.speed * dt
  }

  draw() {
    if (ctx) {
      ctx.fillStyle = this.color
      ctx.fillRect(this.x, this.y, this.width, this.height)
    }
  }
}

class Enemy {
  x: number
  y: number
  width = 40
  height = 40
  speedY: number
  image: HTMLImageElement

  constructor(x: number) {
    this.x = x
    this.y = -40
    this.speedY = (Math.random() * 3 + 2) * 60
    this.image = loadedEnemyImages[Math.floor(Math.random() * loadedEnemyImages.length)]
  }

  update(dt: number) {
    this.y += this.speedY * dt
  }

  draw() {
    if (!ctx) return
    if (this.image.complete && this.image.naturalWidth > 0) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
    } else {
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(this.x, this.y, this.width, this.height)
    }
  }
}

let player: Player | null = null
let bullets: Bullet[] = []
let enemies: Enemy[] = []

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  if (player) {
    player.y = canvas.height - 80
    if (player.x + player.width > canvas.width) {
      player.x = canvas.width - player.width
    }
  }
}

function handleResizeGameOver() {
  resizeCanvas()
  if (gameRunning.value) gameOver()
}

function onKeyDown(e: KeyboardEvent) {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true
}

function onKeyUp(e: KeyboardEvent) {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = false
  if (e.key === ' ' && gameRunning.value && selectedControl.value === 'classic') shoot()
}

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX
}

function onMouseDown() {
  if (gameRunning.value) shoot()
}

function shoot() {
  if (player) {
    bullets.push(new Bullet(player.x + player.width / 2 - 2, player.y))
  }
}

function checkCollision(rect1: { x: number, y: number, width: number, height: number }, rect2: { x: number, y: number, width: number, height: number }) {
  return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
  )
}

function gameOver() {
  if (gameRunning.value) {
    gameRunning.value = false
    isGameOver.value = true
    cancelAnimationFrame(animationFrameId)

    if (score.value > highscore.value) {
      highscore.value = score.value
      localStorage.setItem('legacyDefenderHighscore', highscore.value.toString())
    }
  }
}

function init() {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')

  player = new Player()
  bullets = []
  enemies = []
  score.value = 0
  enemyTimer = 0
  spawnInterval = 1.0

  isGameOver.value = false
  gameRunning.value = true

  lastTime = performance.now()
  requestAnimationFrame(animate)
}

function animate(timestamp: number) {
  const canvas = canvasRef.value
  if (!gameRunning.value || !canvas || !ctx) return

  let dt = (timestamp - lastTime) / 1000
  if (dt > 0.1) dt = 0.1
  lastTime = timestamp

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (player) {
    player.update(dt)
    player.draw()
  }

  bullets.forEach((bullet, index) => {
    bullet.update(dt)
    bullet.draw()
    if (bullet.y + bullet.height < 0) {
      setTimeout(() => bullets.splice(index, 1), 0)
    }
  })

  enemyTimer += dt
  if (enemyTimer > spawnInterval) {
    const randomX = Math.random() * (canvas.width - 50)
    enemies.push(new Enemy(randomX))
    enemyTimer = 0

    if (spawnInterval > 0.33 && score.value > 0 && score.value % 10 === 0) {
      spawnInterval -= 0.033
    }
  }

  enemies.forEach((enemy) => {
    enemy.update(dt)
    enemy.draw()

    if (player && checkCollision(player, enemy)) {
      gameOver()
    }

    bullets.forEach((bullet) => {
      if (checkCollision(bullet, enemy)) {
        score.value += 10
        setTimeout(() => {
          if (enemies.includes(enemy)) enemies.splice(enemies.indexOf(enemy), 1)
          if (bullets.includes(bullet)) bullets.splice(bullets.indexOf(bullet), 1)
        }, 0)
      }
    })

    if (enemy.y + enemy.height > canvas.height) {
      setTimeout(() => {
        if (enemies.includes(enemy)) enemies.splice(enemies.indexOf(enemy), 1)
      }, 0)
    }
  })

  animationFrameId = requestAnimationFrame(animate)
}

function selectControl(type: 'classic' | 'cool') {
  selectedControl.value = type
  localStorage.setItem('legacyDefenderControl', type)
}

onMounted(() => {
  const savedHighscore = localStorage.getItem('legacyDefenderHighscore')
  if (savedHighscore) highscore.value = parseInt(savedHighscore, 10)

  const savedControl = localStorage.getItem('legacyDefenderControl')
  if (savedControl === 'classic' || savedControl === 'cool') {
    selectedControl.value = savedControl
  }

  window.addEventListener('resize', handleResizeGameOver)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  mouseX = window.innerWidth / 2
  resizeCanvas()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResizeGameOver)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="game-wrapper" @mousemove="onMouseMove" @mousedown="onMouseDown">
    <div id="gameContainer">
      <canvas ref="canvasRef" id="gameCanvas"></canvas>
      <div class="ui-layer">
        SCORE: <span>{{ score }}</span><br>
        HIGHSCORE: <span>{{ highscore }}</span>
      </div>
      <div v-if="!gameRunning" id="startScreen" class="center-message">
        <p class="text-sm opacity-50 text-red-200">{{ t("pages.error.game.resize") }}</p>
        <strong class="text-4xl" id="screenTitle" :style="{ color: isGameOver ? 'red' : '#5111b8', margin: '0' }">
          {{ isGameOver ? 'GAME OVER!!!' : 'LEGACY DEFENDER' }}
        </strong>
        <p class="text-sm opacity-50">0.2</p>
        <p v-if="isGameOver" style="margin: 0;">SCORE: <span>{{ score }}</span></p>
        <p style="margin: 5px 0;">{{t("pages.error.game.controls.select")}}:</p>
        <div class="control-options">
          <button class="control-btn" :class="{ active: selectedControl === 'classic' }" @click="selectControl('classic')">
            {{t("pages.error.game.controls.classic.title")}}
          </button>
          <button class="control-btn" :class="{ active: selectedControl === 'cool' }" @click="selectControl('cool')">
            {{t("pages.error.game.controls.cool.title")}}
          </button>
        </div>
        <p style="font-size: 16px; color: #aaa; margin: 0;">
          {{ controlInfoText }}
        </p>
        <button id="startBtn" @click="init">
          {{ isGameOver ? t("pages.error.game.restart") : t("pages.error.game.start") }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper {
  margin: 0;
  padding: 0;
  background-color: #1a1a1a;
  color: white;
  font-family: 'Courier New', Courier, monospace;
  overflow: hidden;
  width: 100%;
  height: 100% ;
  user-select: none;
  cursor: crosshair;
}

#gameContainer {
  position: relative;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  background: radial-gradient(#080b17, black);
  width: 100%;
  height: 100%;
}

.ui-layer {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 20px;
  pointer-events: none;
  text-shadow: 1px 1px 0 #000;
}

.center-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-size: 22px;
  background: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid white;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-options {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 5px 0;
}

.control-btn {
  background: #333;
  color: white;
  border: 2px solid #555;
  padding: 8px 15px;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  transition: 0.2s;
}

.control-btn.active {
  background: #5111b8;
  color: black;
  border-color: #5111b8;
  font-weight: bold;
}

#startBtn {
  background: #5111b8;
  color: black;
  border: none;
  padding: 12px 25px;
  cursor: pointer;
  font-family: inherit;
  font-size: 18px;
  font-weight: bold;
}
</style>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const score = ref(0)
const highscore = ref(0)
const gameRunning = ref(false)
const isGameOver = ref(false)
const selectedControl = ref<'classic' | 'cool'>('cool')

const controlInfoText = computed(() => {
  return selectedControl.value === 'classic'
      ? 'WASD / Arrow keys to move and click or space to shoot'
      : 'Mouse to move and click to shoot'
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
let spawnRate = 60
let enemyTimer = 0

class Player {
  width = 40
  height = 40
  x: number
  y: number
  speed = 7

  constructor() {
    const canvas = canvasRef.value!
    this.x = canvas.width / 2 - this.width / 2
    this.y = canvas.height - 80
  }

  update() {
    const canvas = canvasRef.value!
    if (selectedControl.value === 'classic') {
      if (keys.ArrowLeft || keys.a) this.x -= this.speed
      if (keys.ArrowRight || keys.d) this.x += this.speed
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
  speed = 10
  color = '#ff0'

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  update() {
    this.y -= this.speed
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
    this.speedY = Math.random() * 2 + 1
    this.image = loadedEnemyImages[Math.floor(Math.random() * loadedEnemyImages.length)]
  }

  update() {
    this.y += this.speedY
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
  spawnRate = 60

  isGameOver.value = false
  gameRunning.value = true
  animate()
}

function animate() {
  const canvas = canvasRef.value
  if (!gameRunning.value || !canvas || !ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (player) {
    player.update()
    player.draw()
  }

  bullets.forEach((bullet, index) => {
    bullet.update()
    bullet.draw()
    if (bullet.y + bullet.height < 0) {
      setTimeout(() => bullets.splice(index, 1), 0)
    }
  })

  enemyTimer++
  if (enemyTimer > spawnRate) {
    const randomX = Math.random() * (canvas.width - 50)
    enemies.push(new Enemy(randomX))
    enemyTimer = 0

    if (spawnRate > 20 && score.value > 0 && score.value % 10 === 0) spawnRate -= 2
  }

  enemies.forEach((enemy) => {
    enemy.update()
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
        <h1 id="screenTitle" :style="{ color: isGameOver ? 'red' : '#5111b8', margin: '0' }">
          {{ isGameOver ? 'GAME OVER!!!' : 'LEGACY DEFENDER' }}
        </h1>
        <p>Don't resize while the game is running!</p>
        <p v-if="isGameOver" style="margin: 0;">SCORE: <span>{{ score }}</span></p>
        <p style="margin: 5px 0;">SELECT INPUT METHOD:</p>
        <div class="control-options">
          <button class="control-btn" :class="{ active: selectedControl === 'classic' }" @click="selectControl('classic')">
            CLASSIC
          </button>
          <button class="control-btn" :class="{ active: selectedControl === 'cool' }" @click="selectControl('cool')">
            COOL (rec)
          </button>
        </div>
        <p style="font-size: 16px; color: #aaa; margin: 0;">
          {{ controlInfoText }}
        </p>
        <button id="startBtn" @click="init">
          {{ isGameOver ? 'TRY AGAIN' : 'STARTEN' }}
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
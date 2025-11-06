<template>
  <div class="spaceship-page">
    <div class="background-grid"></div>
    
    <div class="header">
      <h1>25 or 01</h1>
      <h2>How Many Spaceships are in a Spaceship?</h2>
      <p>This project explores the idea of creating multiple unique builds from a single LEGO set. My goal was to challenge myself to design several different micro spaceships using only the pieces from set no. 76832.</p>
    </div>

    <div class="info-card">
      <div class="card-content">
        <div class="left-section">
          <div class="card-title">XL - 15 SPACESHIP</div>
          <div class="divider-line"></div>
          <div class="set-info">
            <div class="set-number">SET NO.</div>
            <div class="number">76832</div>
          </div>
          <div class="divider-line"></div>
          <div class="color-section">
            <div class="color-bar"></div>
          </div>
        </div>
        <div class="vertical-divider"></div>
        <div class="right-section">
          <div class="spacecraft-container">
            <img src="/images/spacecraft.png" alt="XL-15 Spaceship" class="spacecraft-image" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid-container">
      <div class="content-wrapper">
        <div class="image-grid">
          <div 
            v-for="number in 25" 
            :key="number" 
            class="grid-cell" 
            :data-number="String(number).padStart(2, '0')"
            @click="openModal(number)"
          >
            <img 
              v-if="imageLoaded[number]" 
              :src="`/images/${number}.png`" 
              :alt="`Spaceship ${number}`"
              @error="handleImageError(number)"
            />
            <span v-else>{{ String(number).padStart(2, '0') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3D Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Transporter</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="model-viewer" ref="modelViewer">
            <!-- 3D model will be rendered here -->
          </div>
          
          <div class="modal-info">
            <div class="info-section">
              <div class="var-section">
                <span class="label">VAR NO.</span>
                <span class="value">{{ String(selectedModel).padStart(3, '0') }}</span>
                <div class="color-bar-modal"></div>
              </div>
              
              <div class="description-section">
                <span class="label">Description:</span>
                <div class="pieces-section">
                  <span class="label">Pieces:</span>
                  <span class="value">28</span>
                </div>
              </div>
              
              <div class="diagrams-section">
                <!-- Placeholder for diagrams -->
                <div class="diagram-placeholder"></div>
                <div class="diagram-placeholder"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-controls">
          <button @click="toggleRotation" class="play-pause-btn">
            {{ isRotating ? 'PAUSE' : 'PLAY' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { OBJLoader } from 'three-stdlib'

export default {
  name: 'SpaceshipGrid',
  setup() {
    const imageLoaded = ref({})
    const showModal = ref(false)
    const selectedModel = ref(1)
    const isRotating = ref(false)
    const modelViewer = ref(null)
    
    // Three.js variables
    let scene, camera, renderer, model, animationId

    const loadImages = () => {
      for (let i = 1; i <= 25; i++) {
        const img = new Image()
        img.src = `/images/${i}.png`
        
        img.onload = () => {
          imageLoaded.value[i] = true
        }
        
        img.onerror = () => {
          imageLoaded.value[i] = false
          console.log(`Image ${i}.png not found, keeping number`)
        }
      }
    }

    const handleImageError = (number) => {
      imageLoaded.value[number] = false
    }

    const openModal = (number) => {
      selectedModel.value = number
      showModal.value = true
      nextTick(() => {
        init3DViewer()
        load3DModel(number)
      })
    }

    const closeModal = () => {
      showModal.value = false
      isRotating.value = false
      cleanup3D()
    }

    const init3DViewer = () => {
      if (!modelViewer.value) return

      // Scene
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x6c7074)

      // Camera
      camera = new THREE.PerspectiveCamera(
        75,
        1, // Square aspect ratio
        0.1,
        1000
      )
      camera.position.set(0, 0, 5)

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(500, 500) // Fixed size for now
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      
      modelViewer.value.appendChild(renderer.domElement)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 5)
      directionalLight.castShadow = true
      scene.add(directionalLight)

      render()
    }

    const load3DModel = async (number) => {
      try {
        // Remove existing model
        if (model) {
          scene.remove(model)
        }

        if (number === 1) {
          // Load actual OBJ file for model #1
          const loader = new OBJLoader()
          
          loader.load(
            `/images/3D/${number}.obj`,
            (object) => {
              // Successfully loaded OBJ file
              model = object
              
              // Add materials to the loaded model
              model.traverse((child) => {
                if (child.isMesh) {
                  child.material = new THREE.MeshLambertMaterial({ 
                    color: 0xcccccc,
                    side: THREE.DoubleSide
                  })
                  child.castShadow = true
                  child.receiveShadow = true
                }
              })
              
              // Scale and position the model
              const box = new THREE.Box3().setFromObject(model)
              const size = box.getSize(new THREE.Vector3())
              const maxDim = Math.max(size.x, size.y, size.z)
              const scale = 2 / maxDim // Scale to fit in viewport
              model.scale.set(scale, scale, scale)
              
              // Center the model
              const center = box.getCenter(new THREE.Vector3())
              model.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
              
              scene.add(model)
              console.log(`Successfully loaded 3D model: /images/3D/${number}.obj`)
            },
            (progress) => {
              console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
            },
            (error) => {
              console.error('Error loading OBJ file:', error)
              // Fallback to cube if OBJ fails to load
              createFallbackCube(number)
            }
          )
        } else {
          // Use placeholder cube for other models
          createFallbackCube(number)
        }
        
      } catch (error) {
        console.error('Error loading 3D model:', error)
        createFallbackCube(number)
      }
    }

    const createFallbackCube = (number) => {
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.8
      })
      
      model = new THREE.Mesh(geometry, material)
      model.castShadow = true
      model.receiveShadow = true
      scene.add(model)
      
      console.log(`Using placeholder cube for model ${number}`)
    }

    const render = () => {
      if (!renderer || !scene || !camera) return
      
      if (isRotating.value && model) {
        model.rotation.y += 0.01
      }
      
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(render)
    }

    const toggleRotation = () => {
      isRotating.value = !isRotating.value
    }

    const cleanup3D = () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      
      if (renderer && modelViewer.value) {
        modelViewer.value.removeChild(renderer.domElement)
        renderer.dispose()
      }
      
      if (model) {
        scene.remove(model)
      }
      
      scene = null
      camera = null
      renderer = null
      model = null
    }

    onMounted(() => {
      loadImages()
    })

    onUnmounted(() => {
      cleanup3D()
    })

    return {
      imageLoaded,
      showModal,
      selectedModel,
      isRotating,
      modelViewer,
      handleImageError,
      openModal,
      closeModal,
      toggleRotation
    }
  }
}
</script>

<style scoped>
.spaceship-page {
  background: #05131D;
  overflow: auto;
  min-height: 100vh;
  position: relative;
  padding-bottom: min(270px, 36vw, 36vh);
}

/* Background grid - extends to edges, always square cells */
.background-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 200vh;
  background-size: 20vmin 20vmin;
  background-position: 
    calc(50vw - 50vmin) 
    calc(min(270px, 36vw, 36vh) + 50vh - 50vmin);
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
}

.grid-container {
  position: relative;
  top: min(270px, 36vw, 36vh);
  left: 0;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 0;
}

/* Content wrapper - centers the 5x5 grid */
.content-wrapper {
  position: relative;
  width: 100vmin;
  height: 100vmin;
  z-index: 10;
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 1);
}

/* Image grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
  width: 100%;
  height: 100%;
  gap: 0;
}

.grid-cell {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.grid-cell:hover {
  background: rgba(255, 255, 255, 0.15);
}

.grid-cell::before {
  content: attr(data-number);
  position: absolute;
  top: 8px;
  left: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: clamp(10px, 1.2vw, 14px);
  z-index: 1;
}

.grid-cell:nth-child(5n) {
  border-right: none;
}

.grid-cell:nth-child(n+21) {
  border-bottom: none;
}

.grid-cell img {
  max-width: 85%;
  max-height: 85%;
  object-fit: contain;
}

.grid-cell span {
  color: #666;
  font-size: clamp(8px, 1.5vw, 12px);
  font-family: 'Arial', sans-serif;
}

/* Header section */
.header {
  position: absolute;
  top: 50px;
  left: 50px;
  color: white;
  font-family: 'Arial', sans-serif;
  max-width: min(405px, 54vw, 54vh);
  z-index: 20;
  padding: 0;
}

.header h1 {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: bold;
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.header h2 {
  font-size: clamp(12px, 1.5vw, 18px);
  color: #6b7280;
  margin-bottom: 20px;
}

.header p {
  font-size: clamp(10px, 1.2vw, 14px);
  color: #9ca3af;
  line-height: 1.6;
}

/* Info card */
.info-card {
  position: absolute;
  top: 5%;
  right: 5%;
  background: #05131D;
  border: 1px solid rgba(255, 255, 255);
  color: white;
  font-family: 'Inter', sans-serif;
  width: 540px;
  height: 137px;
  z-index: 20;
  backdrop-filter: blur(10px);
  padding: 0;
}

.card-content {
  display: flex;
  height: 100%;
}

.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-right: 0;
}

.vertical-divider {
  width: 1px;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
}

.right-section {
  width: 270px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 26px;
  font-weight: bold;
  padding: 16px 20px 8px 20px;
  margin: 0;
}

.divider-line {
  width: calc(100% - 40px);
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 20px;
}

.set-info {
  padding: 8px 20px;
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.set-number {
  font-size: 11px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
}

.number {
  font-size: 10px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
}

.color-section {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 20px 16px 20px;
}

.color-bar {
  width: 184px;
  height: 11px;
  background: linear-gradient(to right, #A0A5A9, #6C6E68, #078BC9, #F5CD2F, #C91A09);
  border-radius: 0;
}

.spacecraft-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spacecraft-image {
  width: 198px;
  height: auto;
  object-fit: contain;
}

@media (max-width: 768px) {
  .header {
    max-width: 250px;
  }

  .info-card {
    width: 400px;
    height: 110px;
    transform: scale(0.75);
    transform-origin: top right;
  }
  
  .card-title {
    font-size: 20px;
    padding: 12px 16px 6px 16px;
  }
  
  .set-info {
    padding: 6px 16px;
  }
  
  .color-section {
    padding: 0 16px 12px 16px;
  }
  
  .divider-line {
    width: calc(100% - 32px);
    margin: 0 16px;
  }
  
  .right-section {
    width: 200px;
  }
  
  .spacecraft-container {
    padding: 15px;
  }
  
  .spacecraft-image {
    width: 150px;
  }
}

@media (max-width: 480px) {
  .header {
    font-size: 0.8em;
  }
  
  .info-card {
    width: 320px;
    height: 90px;
    transform: scale(0.6);
    transform-origin: top right;
  }
  
  .card-title {
    font-size: 18px;
    padding: 10px 14px 5px 14px;
  }
  
  .divider-line {
    width: calc(100% - 28px);
    margin: 0 14px;
  }
  
  .right-section {
    width: 160px;
  }
  
  .spacecraft-container {
    padding: 12px;
  }
  
  .spacecraft-image {
    width: 120px;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #6c7074;
  width: 80vh;
  height: 80vh;
  max-width: 880px;
  max-height: 880px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  letter-spacing: 2px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 30px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  opacity: 0.7;
}

.modal-body {
  flex: 1;
  display: flex;
  padding: 30px;
  gap: 30px;
}

.model-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.modal-info {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.var-section {
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.var-section .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 5px;
}

.var-section .value {
  font-size: 18px;
  font-weight: bold;
  display: block;
  margin-bottom: 10px;
}

.color-bar-modal {
  width: 120px;
  height: 8px;
  background: linear-gradient(to right, #A0A5A9, #6C6E68, #078BC9, #F5CD2F, #C91A09);
}

.description-section {
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.description-section .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 10px;
}

.pieces-section {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.pieces-section .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.pieces-section .value {
  font-size: 16px;
  font-weight: bold;
}

.diagrams-section {
  display: flex;
  gap: 15px;
}

.diagram-placeholder {
  width: 80px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.modal-controls {
  padding: 20px 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
}

.play-pause-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.play-pause-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .modal-content {
    width: 90vw;
    height: 90vh;
    max-width: none;
    max-height: none;
  }
  
  .modal-body {
    flex-direction: column;
    padding: 20px;
    gap: 20px;
  }
  
  .modal-info {
    width: 100%;
  }
}
</style>
<template>
  <div class="bmw-container">
    <!-- UI Controls -->
    <div class="ui-overlay">
      <div class="page-controls">
        <button
          v-for="(page, index) in pages"
          :key="index"
          :class="[
            'page-btn',
            currentPage === index ? 'page-btn--active' : 'page-btn--inactive'
          ]"
          @click="setPage(index)"
        >
          {{ index === 0 ? 'Cover' : `Page ${index}` }}
        </button>
        <button
          :class="[
            'page-btn',
            currentPage === pages.length ? 'page-btn--active' : 'page-btn--inactive'
          ]"
          @click="setPage(pages.length)"
        >
          Back Cover
        </button>
      </div>
      

      
      <!-- Back button -->
      <div class="back-button">
        <router-link to="/" class="back-link">← BACK TO HOME</router-link>
      </div>
    </div>
    
    <!-- Three.js Canvas -->
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as THREE from 'three';
import { Book, pages } from './Book.js';

// Reactive state
const canvasContainer = ref(null);
const currentPage = ref(0);
const router = useRouter();

// Three.js scene objects
let scene, camera, renderer, book, animationId;
let clock = new THREE.Clock();

// Mouse interaction
let mousePosition = { x: 0, y: 0 };
let hoveredPage = -1;

const initThreeJS = () => {
  // Scene setup
  scene = new THREE.Scene();
  
  // Camera setup
  const aspect = window.innerWidth / window.innerHeight;
  const isMobile = window.innerWidth <= 800;
  camera = new THREE.PerspectiveCamera(
    25, // Further reduced from 30 to zoom in more on the magazine
    aspect,
    0.1,
    1000
  );
  camera.position.set(0, isMobile ? 8 : 6, 0); // Position directly above for aerial view
  camera.lookAt(0, 0, 0); // Look straight down at the book

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Tone mapping and color settings to preserve background image quality
  renderer.toneMapping = THREE.LinearToneMapping; // Use linear tone mapping for natural colors
  renderer.toneMappingExposure = 0.6; // Reduce exposure to prevent washing out
  renderer.outputColorSpace = THREE.SRGBColorSpace; // Ensure proper color space
  
  // Load desk background image
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('/images/bmw/desk.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace; // Ensure proper color space
    texture.flipY = false; // Prevent any unwanted flipping
    scene.background = texture;
  }, undefined, (error) => {
    console.warn('Could not load desk.jpg, using fallback color');
    renderer.setClearColor(0x232323);
  });
  
  // Add canvas to DOM
  canvasContainer.value.appendChild(renderer.domElement);

  // Environment and lighting - Balanced for background visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Further reduced ambient light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Increased directional light to compensate
  directionalLight.position.set(0, 10, 3);
  directionalLight.castShadow = true; // Re-enable for ground shadow only
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 20;
  directionalLight.shadow.camera.left = -5;
  directionalLight.shadow.camera.right = 5;
  directionalLight.shadow.camera.top = 5;
  directionalLight.shadow.camera.bottom = -5;
  directionalLight.shadow.bias = -0.0001;
  directionalLight.shadow.normalBias = 0.02;
  scene.add(directionalLight);

  // Ground plane for shadow
  const groundGeometry = new THREE.PlaneGeometry(10, 10);
  const groundMaterial = new THREE.ShadowMaterial({ 
    transparent: true, 
    opacity: 0.3
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5; // Position closer to book for accurate shadow
  ground.receiveShadow = true;
  scene.add(ground);

  // Create book
  book = new Book();
  
  // Add floating animation to book
  const bookContainer = new THREE.Group();
  bookContainer.rotation.x = -Math.PI / 2; // Lay book completely flat
  bookContainer.add(book.group);
  scene.add(bookContainer);

  // Mouse interaction handlers
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(book.group.children, true);
    
    if (intersects.length > 0) {
      const intersectedPage = book.pages.findIndex(page => 
        page.group.children.includes(intersects[0].object)
      );
      
      if (intersectedPage !== hoveredPage) {
        if (hoveredPage >= 0) {
          book.onPageHover(hoveredPage, false);
        }
        hoveredPage = intersectedPage;
        if (hoveredPage >= 0) {
          book.onPageHover(hoveredPage, true);
          document.body.style.cursor = 'pointer';
        }
      }
    } else {
      if (hoveredPage >= 0) {
        book.onPageHover(hoveredPage, false);
        hoveredPage = -1;
        document.body.style.cursor = 'default';
      }
    }
  };

  const onClick = (event) => {
    if (hoveredPage >= 0) {
      book.onPageClick(hoveredPage);
      currentPage.value = book.currentPage;
    }
  };

  // Add event listeners
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);

  // Store cleanup function
  window.bmwCleanup = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('click', onClick);
    document.body.style.cursor = 'default';
  };
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  // Update book animation
  if (book) {
    book.update(delta);
    // Removed floating animation - book stays still
  }
  
  // Camera stays fixed for aerial view
  if (camera) {
    camera.lookAt(0, 0, 0); // Always look down at the center
  }

  renderer.render(scene, camera);
};

const onWindowResize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

const setPage = (pageNumber) => {
  currentPage.value = pageNumber;
  if (book) {
    book.setPage(pageNumber);
  }
  
  // Play page flip sound effect (optional)
  try {
    const audio = new Audio('/audios/page-flip.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Audio play failed, ignore silently
    });
  } catch (e) {
    // Audio not available, continue silently
  }
};

// Watchers
watch(currentPage, (newPage) => {
  if (book && book.currentPage !== newPage) {
    book.setPage(newPage);
  }
});

onMounted(() => {
  initThreeJS();
  animate();
  window.addEventListener('resize', onWindowResize);
  
  // Track mouse for camera movement
  const handleMouseMove = (event) => {
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };
  window.addEventListener('mousemove', handleMouseMove);
  
  window.bmwMouseCleanup = () => {
    window.removeEventListener('mousemove', handleMouseMove);
  };
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  if (renderer) {
    canvasContainer.value?.removeChild(renderer.domElement);
    renderer.dispose();
  }
  
  if (book) {
    book.dispose();
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // Cleanup mouse events
  if (window.bmwCleanup) {
    window.bmwCleanup();
    delete window.bmwCleanup;
  }
  
  if (window.bmwMouseCleanup) {
    window.bmwMouseCleanup();
    delete window.bmwMouseCleanup;
  }
});
</script>

<style scoped>
.bmw-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-image: url('/images/bmw/desk.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.page-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 2.5rem;
  pointer-events: auto;
  flex-wrap: wrap;
  max-width: 100%;
  overflow-x: auto;
}

.page-btn {
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  font-size: 1.125rem;
  text-transform: uppercase;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.page-btn:hover {
  border-color: white;
}

.page-btn--active {
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
}

.page-btn--inactive {
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
}

.title-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  transform: rotate(-2deg);
  user-select: none;
  pointer-events: none;
}

.scrolling-text {
  position: relative;
  width: 100%;
}

.text-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  white-space: nowrap;
  animation: scroll-horizontal 16s linear infinite;
  padding: 0 2rem;
}

.text-row--offset {
  position: absolute;
  top: 0;
  left: 0;
  animation: scroll-horizontal-offset 16s linear infinite;
}

.text-row h1 {
  font-size: clamp(4rem, 10vw, 10rem);
  font-weight: 900;
  color: white;
  margin: 0;
  flex-shrink: 0;
}

.text-row h2 {
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 300;
  color: white;
  margin: 0;
  flex-shrink: 0;
}

.text-row h2:nth-child(2) {
  font-style: italic;
  font-weight: 200;
}

.text-row h2:nth-child(3) {
  font-weight: 700;
}

.text-row h2:nth-child(4) {
  color: transparent;
  -webkit-text-stroke: 1px white;
  font-weight: 700;
  font-style: italic;
}

.text-row h2:nth-child(5) {
  font-weight: 200;
  font-style: italic;
}

.back-button {
  position: absolute;
  top: 2.5rem;
  left: 2.5rem;
  pointer-events: auto;
}

.back-link {
  color: white;
  text-decoration: none;
  font-size: 1.125rem;
  font-weight: 500;
  text-transform: uppercase;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-link:hover {
  color: #5a47ce;
  transform: translateX(-0.25rem);
}

@keyframes scroll-horizontal {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes scroll-horizontal-offset {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .page-controls {
    padding: 1.5rem 1rem;
    gap: 0.5rem;
  }
  
  .page-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .back-button {
    top: 1.5rem;
    left: 1.5rem;
  }
  
  .back-link {
    font-size: 1rem;
  }
  
  .text-row {
    gap: 1rem;
  }
}
</style>
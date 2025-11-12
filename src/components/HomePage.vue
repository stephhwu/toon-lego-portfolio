<template>
  <div class="homepage">
    <div class="background-grid"></div>
    
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="main-title">TOON HARTMAN</h1>
        <h2 class="subtitle">LEGO PORTFOLIO</h2>
        <p class="description">
          Exploring creative possibilities through modular design and engineering precision. 
          Each project challenges conventional building techniques while maintaining the playful spirit of LEGO.
        </p>
        
        <!-- Featured Project Cards -->
        <div class="featured-projects">
          <!-- Spaceship Project -->
          <div class="featured-project">
            <div class="project-preview">
              <img :src="spacecraftImageUrl" alt="Featured Project" class="project-image" />
            </div>
            <div class="project-info">
              <h3>25 or 01</h3>
              <p>How Many Spaceships are in a Spaceship?</p>
              <router-link to="/spaceships" class="explore-btn">
                EXPLORE PROJECT →
              </router-link>
            </div>
          </div>
          
          <!-- BMW Project -->
          <div class="featured-project">
            <div class="project-preview bmw-preview">
              <div class="book-icon">📖</div>
            </div>
            <div class="project-info">
              <h3>BMW</h3>
              <p>Interactive Design Portfolio Book</p>
              <router-link to="/bmw" class="explore-btn">
                OPEN BOOK →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- About Section -->
    <div class="about-section">
      <div class="about-content">
        <div class="about-text">
          <h3>About This Portfolio</h3>
          <p>
            This collection showcases experimental LEGO builds that explore the boundaries 
            between toy and tool, play and precision. Each project is documented with 
            detailed breakdowns, 3D models, and construction insights.
          </p>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">25+</div>
            <div class="stat-label">UNIQUE BUILDS</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">1</div>
            <div class="stat-label">BASE SET</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">∞</div>
            <div class="stat-label">POSSIBILITIES</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'HomePage',
  setup() {
    // Computed properties for image paths
    const baseUrl = computed(() => import.meta.env.BASE_URL)
    const spacecraftImageUrl = computed(() => `${baseUrl.value}images/spacecraft.png`)
    
    return {
      spacecraftImageUrl
    }
  }
}
</script>

<style scoped>
.homepage {
  background: #05131D;
  min-height: 100vh;
  overflow-x: hidden;
  font-family: 'Inter', sans-serif;
}

/* Background grid */
.background-grid {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-size: 40px 40px;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  pointer-events: none;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
  position: relative;
  z-index: 1;
}

.hero-content {
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.main-title {
  font-size: clamp(32px, 6vw, 72px);
  font-weight: bold;
  color: white;
  letter-spacing: 4px;
  margin-bottom: 8px;
  line-height: 1;
}

.subtitle {
  font-size: clamp(16px, 2.5vw, 24px);
  color: #6b7280;
  letter-spacing: 2px;
  margin-bottom: 24px;
  font-weight: 300;
}

.description {
  font-size: clamp(14px, 1.5vw, 18px);
  color: #9ca3af;
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 500px;
}

/* Featured Project Cards */
.featured-projects {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.featured-project {
  background: rgba(55, 66, 74, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 30px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.featured-project:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.4);
}

.project-preview {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.bmw-preview {
  background: linear-gradient(135deg, #5a47ce, #232323);
  position: relative;
  overflow: hidden;
}

.book-icon {
  font-size: 64px;
  opacity: 0.8;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.project-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.project-info h3 {
  font-size: 24px;
  color: white;
  margin-bottom: 8px;
  font-weight: bold;
}

.project-info p {
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 20px;
}

.explore-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid white;
  color: white;
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.explore-btn:hover {
  background: white;
  color: #05131D;
  transform: translateX(5px);
}

/* About Section */
.about-section {
  padding: 80px 50px;
  background: rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.about-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.about-text h3 {
  font-size: clamp(24px, 3vw, 36px);
  color: white;
  margin-bottom: 20px;
  font-weight: bold;
}

.about-text p {
  font-size: clamp(14px, 1.5vw, 18px);
  color: #9ca3af;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.stat-number {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  letter-spacing: 2px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content,
  .about-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .hero-section,
  .about-section {
    padding: 40px 20px;
  }
  
  .featured-projects {
    gap: 20px;
  }
  
  .featured-project {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  
  .description {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .featured-projects {
    gap: 15px;
  }
}
</style>
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
  TextureLoader,
  CanvasTexture,
  Group,
  DirectionalLight,
  PlaneGeometry,
  ShadowMaterial,
  Mesh
} from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';
import { easing } from 'maath';

// Configuration constants
const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

// Sample pages data - you can replace with your BMW content
const pictures = [
  "DSC00680",
  "DSC00933", 
  "DSC00966",
  "DSC00983",
  "DSC01011",
  "DSC01040",
  "DSC01064",
  "DSC01071",
  "DSC01103",
  "DSC01145",
  "DSC01420",
  "DSC01461",
  "DSC01489",
  "DSC02031",
  "DSC02064",
  "DSC02069",
];

export const pages = [
  {
    front: "bmw-cover", // Cover when book is closed
    back: "bmw-01", // First interior page
  },
  {
    front: "bmw-02", // Second interior page
    back: pictures[0], // Third page (fallback to DSC images)
  },
];

for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

pages.push({
  front: pictures[pictures.length - 1],
  back: "book-back",
});

// Create page geometry
const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  const x = vertex.x;

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color(1, 1, 1); // Pure white
const emissiveColor = new Color("orange");

const pageMaterials = [
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: "#111" }), // Keep dark for page edges
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: whiteColor }),
];

export class Page {
  constructor({ number, front, back, page, opened, bookClosed }) {
    this.number = number;
    this.front = front;
    this.back = back;
    this.page = page;
    this.opened = opened;
    this.bookClosed = bookClosed;
    this.highlighted = false;
    this.turnedAt = 0;
    this.lastOpened = opened;
    
    this.group = new Group();
    
    // Load textures first, then create mesh
    this.loadTextures().then(() => {
      this.createSkinnedMesh();
    });
  }

  async loadTextures() {
    const loader = new TextureLoader();
    
    try {
      // Load BMW images
      const frontPath = `/images/bmw/${this.front}.jpg`;
      const backPath = `/images/bmw/${this.back}.jpg`;
      
      console.log(`Loading textures for page ${this.number}:`, frontPath, backPath);
      
      // Load front texture
      let frontTexture;
      try {
        frontTexture = await new Promise((resolve, reject) => {
          loader.load(
            frontPath, 
            (texture) => {
              console.log(`Successfully loaded front texture for page ${this.number}:`, frontPath);
              resolve(texture);
            }, 
            undefined, 
            (error) => {
              console.error(`Failed to load front texture for page ${this.number}:`, frontPath, error);
              reject(error);
            }
          );
        });
        frontTexture.colorSpace = SRGBColorSpace;
        this.picture = frontTexture;
        console.log(`✅ Successfully set front texture for page ${this.number} (${this.front})`);
      } catch (error) {
        // Create fallback for front texture
        console.log(`❌ Creating fallback texture for front: ${this.front} - Error:`, error);
        frontTexture = this.createFallbackTexture(this.front, this.number, 'Front');
        this.picture = frontTexture;
      }
      
      // Load back texture
      let backTexture;
      try {
        backTexture = await new Promise((resolve, reject) => {
          loader.load(
            backPath, 
            (texture) => {
              console.log(`Successfully loaded back texture for page ${this.number}:`, backPath);
              resolve(texture);
            }, 
            undefined, 
            (error) => {
              console.error(`Failed to load back texture for page ${this.number}:`, backPath, error);
              reject(error);
            }
          );
        });
        backTexture.colorSpace = SRGBColorSpace;
        this.picture2 = backTexture;
      } catch (error) {
        // Create fallback for back texture
        console.log(`❌ Creating fallback texture for back: ${this.back} - Error:`, error);
        backTexture = this.createFallbackTexture(this.back, this.number, 'Back');
        this.picture2 = backTexture;
      }
      
      if (this.number === 0 || this.number === pages.length - 1) {
        // For covers, we can add a slight roughness
        this.pictureRoughness = null; // Will use default roughness
      }
      
    } catch (error) {
      console.error(`Unexpected error loading textures for page ${this.number}:`, error);
      
      // Fallback to canvas textures as last resort
      this.picture = this.createFallbackTexture(this.front, this.number, 'Front');
      this.picture2 = this.createFallbackTexture(this.back, this.number, 'Back');
    }
  }

  createFallbackTexture(imageName, pageNumber, side) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a pure white background
    ctx.fillStyle = '#FFFFFF'; // Pure white for all pages
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some very light texture only if not the cover
    if (pageNumber !== 0) {
      ctx.fillStyle = '#F8F8F8'; // Very light grey texture
      for (let i = 0; i < 30; i++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
      }
    }
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${pageNumber} ${side}`, 256, 200);
    ctx.font = '18px Arial';
    ctx.fillText(imageName, 256, 240);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('(Image not found)', 256, 280);
    
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  createSkinnedMesh() {
    const bones = [];
    
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }
    
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      // Front texture material - StandardMaterial optimized for both color and gloss
      new MeshStandardMaterial({
        map: this.picture,
        transparent: true,
        roughness: 0.2, // Slightly increased roughness to reduce reflective glare
        metalness: 0.0, // No metalness
        color: new Color(1, 1, 1), // Pure white multiplier
        // Reduced emissive properties to prevent washing out the background
        emissive: new Color(0.05, 0.05, 0.05), // Much more subtle self-illumination
        emissiveMap: this.picture, // Use the same texture as emissive
        emissiveIntensity: 0.1, // Significantly reduced brightness boost
      }),
      // Back texture material - Same approach
      new MeshStandardMaterial({
        map: this.picture2,
        transparent: true,
        roughness: 0.2, // Slightly increased roughness to reduce reflective glare
        metalness: 0.0, // No metalness
        color: new Color(1, 1, 1), // Pure white multiplier
        // Reduced emissive properties to prevent washing out the background
        emissive: new Color(0.05, 0.05, 0.05), // Much more subtle self-illumination
        emissiveMap: this.picture2, // Use the same texture as emissive
        emissiveIntensity: 0.1, // Significantly reduced brightness boost
      }),
    ];

    this.skinnedMesh = new SkinnedMesh(pageGeometry, materials);
    this.skinnedMesh.castShadow = false; // Disable shadow casting from pages
    this.skinnedMesh.receiveShadow = false; // Don't receive shadows on the pages
    this.skinnedMesh.frustumCulled = false;
    this.skinnedMesh.add(skeleton.bones[0]);
    this.skinnedMesh.bind(skeleton);
    this.skinnedMesh.position.z = -this.number * PAGE_DEPTH + this.page * PAGE_DEPTH;
    
    this.group.add(this.skinnedMesh);
  }

  update(delta, currentPage) {
    if (!this.skinnedMesh) return;

    this.page = currentPage;
    this.opened = currentPage > this.number;
    this.bookClosed = currentPage === 0 || currentPage === pages.length;

    const emissiveIntensity = this.highlighted ? 0.12 : 0; // Reduced highlight intensity
    if (this.skinnedMesh.material[4]) {
      this.skinnedMesh.material[4].emissiveIntensity = 
      this.skinnedMesh.material[5].emissiveIntensity = MathUtils.lerp(
        this.skinnedMesh.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );
    }

    if (this.lastOpened !== this.opened) {
      this.turnedAt = Date.now();
      this.lastOpened = this.opened;
    }

    let turningTime = Math.min(400, Date.now() - this.turnedAt) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = this.opened ? -Math.PI / 2 : Math.PI / 2;
    if (!this.bookClosed) {
      targetRotation += degToRad(this.number * 0.8);
    }

    const bones = this.skinnedMesh.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? this.group : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
      
      if (this.bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }

      easing.dampAngle(target.rotation, "y", rotationAngle, easingFactor, delta);

      const foldIntensity = i > 8 
        ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime 
        : 0;
      
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  }

  setHighlighted(highlighted) {
    this.highlighted = highlighted;
  }
}

export class Book {
  constructor() {
    this.group = new Group();
    this.group.rotation.y = -Math.PI / 2;
    this.currentPage = 0;
    this.delayedPage = 0;
    this.pages = [];
    
    this.createPages();
    // Removed setupLighting() - lighting handled in BMW.vue
  }

  createPages() {
    pages.forEach((pageData, index) => {
      const page = new Page({
        number: index,
        front: pageData.front,
        back: pageData.back,
        page: this.delayedPage,
        opened: this.delayedPage > index,
        bookClosed: this.delayedPage === 0 || this.delayedPage === pages.length,
      });
      
      this.pages.push(page);
      this.group.add(page.group);
    });
  }

  setupLighting() {
    const directionalLight = new DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(2, 5, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.0001;
    
    // Ground plane
    const groundGeometry = new PlaneGeometry(100, 100);
    const groundMaterial = new ShadowMaterial({ transparent: true, opacity: 0.2 });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    
    this.group.add(directionalLight);
    this.group.add(ground);
  }

  setPage(newPage) {
    this.currentPage = newPage;
    this.updateDelayedPage();
  }

  updateDelayedPage() {
    if (this.pageTimeout) {
      clearTimeout(this.pageTimeout);
    }

    const updatePage = () => {
      if (this.currentPage === this.delayedPage) {
        return;
      }

      this.pageTimeout = setTimeout(() => {
        updatePage();
      }, Math.abs(this.currentPage - this.delayedPage) > 2 ? 50 : 150);

      if (this.currentPage > this.delayedPage) {
        this.delayedPage += 1;
      } else if (this.currentPage < this.delayedPage) {
        this.delayedPage -= 1;
      }

      // Update all pages
      this.pages.forEach((page, index) => {
        page.page = this.delayedPage;
        page.opened = this.delayedPage > index;
        page.bookClosed = this.delayedPage === 0 || this.delayedPage === pages.length;
      });
    };

    updatePage();
  }

  update(delta) {
    this.pages.forEach(page => {
      page.update(delta, this.delayedPage);
    });
  }

  onPageClick(pageNumber) {
    const page = this.pages[pageNumber];
    if (page) {
      this.setPage(page.opened ? pageNumber : pageNumber + 1);
    }
  }

  onPageHover(pageNumber, hovered) {
    const page = this.pages[pageNumber];
    if (page) {
      page.setHighlighted(hovered);
    }
  }

  dispose() {
    if (this.pageTimeout) {
      clearTimeout(this.pageTimeout);
    }
    
    this.pages.forEach(page => {
      if (page.skinnedMesh) {
        page.skinnedMesh.removeFromParent();
      }
    });
  }
}
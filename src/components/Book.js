import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
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
    front: "book-cover",
    back: pictures[0],
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

const whiteColor = new Color("white");
const emissiveColor = new Color("orange");

const pageMaterials = [
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: "#111" }),
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
    this.loadTextures();
    this.createSkinnedMesh();
  }

  async loadTextures() {
    const loader = new TextureLoader();
    
    try {
      // Use BMW images if available, otherwise fallback to solid colors
      const frontPath = `/images/bmw/${this.front}.jpg`;
      const backPath = `/images/bmw/${this.back}.jpg`;
      
      // Create placeholder textures with solid colors
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      // Front texture
      ctx.fillStyle = this.number === 0 ? '#2D1B69' : '#f0f0f0';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#333';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Page ${this.number}`, 128, 128);
      ctx.fillText(this.front, 128, 160);
      
      const frontTexture = new CanvasTexture(canvas);
      frontTexture.colorSpace = SRGBColorSpace;
      this.picture = frontTexture;
      
      // Back texture
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#333';
      ctx.fillText(`Page ${this.number} Back`, 128, 128);
      ctx.fillText(this.back, 128, 160);
      
      const backTexture = new CanvasTexture(canvas);
      backTexture.colorSpace = SRGBColorSpace;
      this.picture2 = backTexture;
      
      if (this.number === 0 || this.number === pages.length - 1) {
        // Create roughness texture for cover
        ctx.fillStyle = '#888';
        ctx.fillRect(0, 0, 256, 256);
        this.pictureRoughness = new CanvasTexture(canvas);
      }
      
    } catch (error) {
      console.warn('Using fallback textures for book pages');
    }
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
      new MeshStandardMaterial({
        color: whiteColor,
        map: this.picture,
        ...(this.number === 0
          ? { roughnessMap: this.pictureRoughness }
          : { roughness: 0.1 }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: this.picture2,
        ...(this.number === pages.length - 1
          ? { roughnessMap: this.pictureRoughness }
          : { roughness: 0.1 }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];

    this.skinnedMesh = new SkinnedMesh(pageGeometry, materials);
    this.skinnedMesh.castShadow = true;
    this.skinnedMesh.receiveShadow = true;
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

    const emissiveIntensity = this.highlighted ? 0.22 : 0;
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
    this.setupLighting();
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
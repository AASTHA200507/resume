/* script.js - 3D Resume Interactivity & WebGL */

document.addEventListener('DOMContentLoaded', () => {
  // --- CUSTOM CURSOR ---
  const cursorRing = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Dot moves instantly
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });

  // Lerp the ring for smooth trailing effect
  function updateCursor() {
    const lerpFactor = 0.15;
    ringX += (mouseX - ringX) * lerpFactor;
    ringY += (mouseY - ringY) * lerpFactor;
    
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // Add hover effect states for clickable elements
  const hoverables = document.querySelectorAll('button, a, .gallery-item, .timeline-card, .feature-box, .skill-item, .achievement-card');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorRing.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.classList.remove('hover');
    });
  });


  // --- TAB NAVIGATION SYSTEM ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.content-panel');
  const cardWrapper = document.getElementById('card-wrapper');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active panel
      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `panel-${tabId}`) {
          panel.classList.add('active');
        }
      });

      // Interactive card jump impact effect on transition
      cardWrapper.style.transition = 'transform 0.15s ease-out';
      cardWrapper.style.transform = 'translateZ(-50px) scale(0.98)';
      
      setTimeout(() => {
        cardWrapper.style.transition = 'transform 0.5s ease-out';
        // Let the normal tilt handling resume control
      }, 150);
    });
  });


  // --- 3D INTERACTIVE TILT EFFECT ---
  const scene3D = document.querySelector('.scene-3d');
  const resumeCard = document.getElementById('resume-card');
  let isHoloMode = false;

  let currentRotateX = 0;
  let currentRotateY = 0;
  let targetRotateX = 0;
  let targetRotateY = 0;

  scene3D.addEventListener('mousemove', (e) => {
    const rect = scene3D.getBoundingClientRect();
    // Normalize coordinates around the center (-0.5 to 0.5)
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Set targets. In holo mode, increase intensity of the tilt
    const multiplier = isHoloMode ? 25 : 15;
    targetRotateY = normX * multiplier;
    targetRotateX = -normY * multiplier;
  });

  scene3D.addEventListener('mouseleave', () => {
    // Reset to center on leave
    targetRotateX = 0;
    targetRotateY = 0;
  });

  // Smooth lerp for tilting rotation
  function lerpTilt() {
    const tiltLerpFactor = 0.08;
    currentRotateX += (targetRotateX - currentRotateX) * tiltLerpFactor;
    currentRotateY += (targetRotateY - currentRotateY) * tiltLerpFactor;
    
    resumeCard.style.transform = `rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
    requestAnimationFrame(lerpTilt);
  }
  lerpTilt();


  // --- HOLOGRAM MODE TOGGLE ---
  const modeToggle = document.getElementById('mode-toggle');
  const toggleIcon = modeToggle.querySelector('i');
  const toggleText = modeToggle.querySelector('span');

  modeToggle.addEventListener('click', () => {
    isHoloMode = !isHoloMode;
    document.body.classList.toggle('holo-mode');
    
    if (isHoloMode) {
      toggleText.textContent = "Flat Mode";
      toggleIcon.setAttribute('data-lucide', 'square');
      // Glow orbs speed up and colors shift slightly
      document.querySelector('.orb-gold-1').style.animationDuration = '8s';
      document.querySelector('.orb-gold-2').style.animationDuration = '8s';
    } else {
      toggleText.textContent = "3D Hologram";
      toggleIcon.setAttribute('data-lucide', 'layers');
      document.querySelector('.orb-gold-1').style.animationDuration = '20s';
      document.querySelector('.orb-gold-2').style.animationDuration = '20s';
    }
    // Recreate Lucide icons for the changed attribute
    lucide.createIcons();
  });


  // --- THREE.JS WEBGL BOTANICAL BACKGROUND ---
  const canvas = document.getElementById('bg-canvas');
  const scene = new THREE.Scene();
  
  // Camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 15;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xd4af37, 1.2);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0x557788, 0.4);
  fillLight.position.set(-5, -5, -5);
  scene.add(fillLight);

  // Creating leaf geometry procedurally
  const leafShape = new THREE.Shape();
  // Draw leaf curves
  leafShape.moveTo(0, -1.5);
  leafShape.quadraticCurveTo(1.2, -0.4, 0, 1.5);
  leafShape.quadraticCurveTo(-1.2, -0.4, 0, -1.5);

  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3
  };

  const leafGeometry = new THREE.ExtrudeGeometry(leafShape, extrudeSettings);
  // Center geometry origin
  leafGeometry.center();

  // Botanical colors reflecting Aastha's major (gold, amber, olive, soft green)
  const leafColors = [
    0xd4af37, // Gold
    0xf3e5ab, // Straw Gold
    0x856404, // Dark Gold/Amber
    0x6e8a60, // Muted Green
    0x3d5c34  // Dark Olive Green
  ];

  // Leaf Group array
  const leaves = [];
  const leafCount = window.innerWidth < 768 ? 30 : 65;

  for (let i = 0; i < leafCount; i++) {
    // Select random color
    const color = leafColors[Math.floor(Math.random() * leafColors.length)];
    
    // Material with custom shininess and metallic attributes
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.25,
      side: THREE.DoubleSide
    });

    const leafMesh = new THREE.Mesh(leafGeometry, material);
    
    // Scale randomization
    const scale = 0.3 + Math.random() * 0.7;
    leafMesh.scale.set(scale, scale, scale);

    // Initial position randomization (widely dispersed in space)
    leafMesh.position.x = (Math.random() - 0.5) * 35;
    leafMesh.position.y = (Math.random() - 0.5) * 25;
    leafMesh.position.z = (Math.random() - 0.5) * 15 - 5;

    // Rotation randomization
    leafMesh.rotation.x = Math.random() * Math.PI;
    leafMesh.rotation.y = Math.random() * Math.PI;
    leafMesh.rotation.z = Math.random() * Math.PI;

    // Custom properties for drift motion
    leafMesh.userData = {
      speedY: 0.005 + Math.random() * 0.015,
      speedX: (Math.random() - 0.5) * 0.008,
      spinX: (Math.random() - 0.5) * 0.01,
      spinY: (Math.random() - 0.5) * 0.01,
      spinZ: (Math.random() - 0.5) * 0.01,
      amplitude: 0.2 + Math.random() * 0.6,
      frequency: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2
    };

    scene.add(leafMesh);
    leaves.push(leafMesh);
  }

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Track mouse coordinates normalized for WebGL interactions
  let targetCamX = 0;
  let targetCamY = 0;
  window.addEventListener('mousemove', (e) => {
    // Move camera slightly opposite to mouse to enhance depth
    targetCamX = ((e.clientX / window.innerWidth) - 0.5) * -1.5;
    targetCamY = ((e.clientY / window.innerHeight) - 0.5) * 1.5;
  });

  // Animation Loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();

    // Smooth camera inertia movement
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    // Animate individual leaves drifting
    leaves.forEach(leaf => {
      // Downward falling drift
      leaf.position.y -= leaf.userData.speedY;
      
      // Swaying horizontal wave motion
      leaf.position.x += Math.sin(elapsedTime * leaf.userData.frequency + leaf.userData.phase) * 0.003 + leaf.userData.speedX;
      
      // Auto rotations
      leaf.rotation.x += leaf.userData.spinX;
      leaf.rotation.y += leaf.userData.spinY;
      leaf.rotation.z += leaf.userData.spinZ;

      // Wrap-around logic when leaves drift off-screen
      if (leaf.position.y < -15) {
        leaf.position.y = 15;
        leaf.position.x = (Math.random() - 0.5) * 35;
      }
      if (leaf.position.x < -20) {
        leaf.position.x = 20;
      } else if (leaf.position.x > 20) {
        leaf.position.x = -20;
      }
      
      // Shimmer texture glow in hologram mode
      if (isHoloMode) {
        leaf.material.emissive.setHex(0xd4af37);
        leaf.material.emissiveIntensity = 0.15 + Math.sin(elapsedTime * 5 + leaf.position.y) * 0.1;
      } else {
        leaf.material.emissive.setHex(0x000000);
        leaf.material.emissiveIntensity = 0;
      }
    });

    renderer.render(scene, camera);
  }
  
  animate();
});

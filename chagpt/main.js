// Import the necessary Three.js modules
import * as THREE from 'three';


// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas') });
renderer.width = window.innerWidth;
renderer.height = window.innerHeight;
renderer.setSize( window.innerWidth, window.innerHeight );

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}
onWindowResize();
// Set the background color to black
renderer.setClearColor(0x000000);

// Create a sphere geometry for the stars
const starGeometry = new THREE.SphereGeometry(0.05, 8, 8);

// Create 150 randomly placed stars
for (let i = 0; i < 1500; i++) {
  // Generate a random position for the star within a cube centered at the origin
  const x = Math.random() * 80 - 35;
  const y = Math.random() * 80 - 30;
  const z = Math.random() * 80 - 30;

  // Create a material for the star with a bright yellow color
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffee });

  // Create a mesh for the star using the geometry and material
  const starMesh = new THREE.Mesh(starGeometry, starMaterial);

  // Set the position of the star mesh to the randomly generated position
  starMesh.position.set(x, y, z);

  // Add the star mesh to the scene
  scene.add(starMesh);
}


// Create a spaceship mesh
const spaceshipGeometry = new THREE.BoxGeometry(1, 1, 1);
const spaceshipMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);
scene.add(spaceship);



// Set up the camera position
camera.position.z = 5;
camera.position.y = 2;

// Set up keyboard input
const keyboard = {};
document.addEventListener('keydown', (event) => {
  keyboard[event.code] = true;
});
document.addEventListener('keyup', (event) => {
  keyboard[event.code] = false;
});

// Handle user input for spaceship movement
function handleSpaceshipMovement() {
  if (keyboard['KeyW']) {
    spaceship.position.z -= 0.1;
  }
  if (keyboard['KeyA']) {
    spaceship.position.x -= 0.1;
  }
  if (keyboard['KeyS']) {
    spaceship.position.z += 0.1;
  }
  if (keyboard['KeyD']) {
    spaceship.position.x += 0.1;
  }
  if (keyboard['KeyI']) {
    spaceship.position.y += 0.1;
    camera.position.y += 0.1;
  }
  if (keyboard['KeyJ']) {
    spaceship.position.y -= 0.1;
    camera.position.y -= 0.1;
  }

  // Move the camera to follow the spaceship
  const cameraOffset = new THREE.Vector3(0, 2, 5);
  const spaceshipGlobalPosition = spaceship.localToWorld(new THREE.Vector3(0, 0, 0));
  const cameraPosition = spaceshipGlobalPosition.clone().add(cameraOffset);
  camera.position.copy(cameraPosition);
  camera.lookAt(spaceshipGlobalPosition);
}

// Handle spaceship hovering
function handleSpaceshipHovering() {
  const time = Date.now() * 0.001; // Get the current time in seconds

  // Use a sine function to move the spaceship up and down
  const hoverAmplitude = 0.01;
  const hoverFrequency = 2;
  const hoverPositionOffset = new THREE.Vector3(
    0,
    hoverAmplitude * Math.sin(hoverFrequency * time),
    0
  );
  spaceship.position.add(hoverPositionOffset);
}

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  // Update the spaceship position based on user input
  handleSpaceshipMovement();
  handleSpaceshipHovering();
  // Render the scene
  renderer.render(scene, camera);
}
animate();
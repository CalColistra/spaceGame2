// spaceShipModule.js

import * as THREE from 'three';

// Create a spaceship mesh based on the provided type
export function createSpaceship(type) {
  const spaceshipGeometry = getSpaceshipGeometry(type);
  const spaceshipMaterial = new THREE.MeshBasicMaterial({ color: getSpaceshipColor(type) });
  const spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);

  

  return spaceship;
}



// Get the geometry based on spaceship type
function getSpaceshipGeometry(type) {
  switch (type) {
    case 1:
      return new THREE.BoxGeometry(5, 1, 1);
    case 2:
      return new THREE.BoxGeometry(1, 5, 1);
    case 3:
      return new THREE.BoxGeometry(1, 1, 5);
    default:
      return new THREE.BoxGeometry(5, 1, 1);
  }
}

// Get the color based on spaceship type
function getSpaceshipColor(type) {
  switch (type) {
    case 1:
      return 0xff0000; // Red
    case 2:
      return 0x00ff00; // Green
    case 3:
      return 0x0000ff; // Blue
    default:
      return 0xff0000; // Red
  }
}

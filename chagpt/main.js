//import firebase jawns and three js jawns:
import { app as firebase } from './javaScript/firebase-config'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, setDoc, doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where, arrayUnion, deleteDoc, orderBy, limit } from 'firebase/firestore'
import { async } from '@firebase/util';
// Import the necessary Three.js modules
import * as THREE from 'three';


//handle login/logout:
const auth = getAuth(firebase)
const googleAuthProvider = new GoogleAuthProvider()

//setup cloud Firestore db:
const db = getFirestore(firebase)

signOut(auth).then(() => {
  console.log('logged out');
})

//var signedIn if user not signed in with google then = false
var signedIn = false;
//const db = getFirestore(firebase)




const loginDiv = document.querySelector("#login");
var loginString = "<div id = 'loginHeader'>Please login with google to continue</div>";
loginString += "<div id='loginRow'><div></div><div id='loginBtn' class='loginOrContBtn'><a href='#'>LOGIN</a></div><div></div></div>";
loginDiv.innerHTML = loginString;

const loginHeader = document.querySelector("#loginHeader");
const loginRow  = document.querySelector("#loginRow");

setUpLoginListeners();
function setUpLoginListeners () {
  loginBtn.addEventListener('click',  e => {
    signInWithPopup(auth, googleAuthProvider)
                  .then(auth => console.log(auth))
  });
}

var currentUser;
onAuthStateChanged(auth, user => {
  if(user){
      checkAccount(user.email, user.displayName);
      signedIn = true;
  }
  else{
      currentUser = null;
      signedIn = false;
  }
});

//function that checks if it is a returning user or a first time log in
// if first time log in then create new doc in 'users' collection
// if returning user then grab their usrname from exsisting doc in users collection:
async function checkAccount(email, name){
  const userRef = doc(db, "users", email);
  const docSnap = await getDoc(userRef);
  var loggedInString;
  if (docSnap.exists()) {
    console.log("Returning User:", docSnap.data());
    currentUser = {
      userName: docSnap.data().userName,
      email: email
    }
    loggedInString = "You have successfully logged in as "+currentUser.userName;
    loginHeader.innerHTML = loggedInString;
    loginRow.innerHTML = "<div></div> <div id='continueBtn' class='loginOrContBtn'><a href='#'>CONTINUE</a></div> <div></div>";
    const continueBtn = document.querySelector("#continueBtn");
    continueBtn.addEventListener('click',  e => {
      loginDiv.style.display = "none";
    });
  } 
  else {
      // doc.data() will be undefined in this case
      console.log("New user!");
      currentUser = {
        userName: name,
        email: email
      }
      await setDoc(doc(db, "users", email), {
        userName: currentUser.userName,
        email: email,
        });
      }
}

//-------------------------------------------------------------------------------------------------------
//the following code is all threeJs set up:
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

// Create 1500 randomly placed stars
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
const spaceshipGeometry = new THREE.BoxGeometry(1, 5, 1);
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
//set up f for full screen:
document.addEventListener('keydown', event => {
  if (event.key === 'f' || event.key === 'F') {
    toggleFullscreen();
  }
});

function toggleFullscreen() {
  if (document.fullscreenElement) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
}

function enterFullscreen() {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
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
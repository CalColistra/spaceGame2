//import firebase jawns and three js jawns:
import { app as firebase } from './javaScript/firebase-config'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, setDoc, doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where, arrayUnion, deleteDoc, orderBy, limit,onSnapshot } from 'firebase/firestore'
import { getDatabase,ref, set ,onDisconnect, get, update,onValue,off } from "firebase/database";
import { async } from '@firebase/util';
// Import the necessary Three.js modules
import * as THREE from 'three';



//handle login/logout:
const auth = getAuth(firebase);
const googleAuthProvider = new GoogleAuthProvider();

//setup cloud Firestore db:
const db = getFirestore(firebase);

// Initialize Realtime Database and get a reference to the service:
const realTimeDb = getDatabase();

signOut(auth).then(() => {
  console.log('logged out');
})

//var signedIn if user not signed in with google then = false
var signedIn = false;
//const db = getFirestore(firebase)

const loginDiv = document.querySelector("#login");
var loginString = "<div id = 'loginHeader'>Please login with Google to continue</div>";
loginString += "</br><div id='loginRow'><div></div><div id='loginBtn' class='loginOrContBtn'><a href='#'>LOGIN</a></div><div></div></div></br>";
loginDiv.innerHTML = loginString;

const loginHeader = document.querySelector("#loginHeader");
const loginRow  = document.querySelector("#loginRow");
const join =  document.querySelector("#join");
var allPlayersRef;

setUpLoginListeners();
function setUpLoginListeners () {
  loginBtn.addEventListener('click',  e => {
    signInWithPopup(auth, googleAuthProvider)
                  .then(auth => console.log(auth))
  });
}

var currentUser;
var userId ='';
var playerRef = '';
var uid = '';
onAuthStateChanged(auth, user => {
  if(user){
    checkAccount(user.email, user.displayName);
    // Fetch the current user's ID from Firebase Authentication.
    uid = auth.currentUser.uid;
    // Create a reference to this user's specific status node.
    // This is where we will store data about being online/offline.
    playerRef = ref(realTimeDb,'/activeUsers/' + uid);
    var uniqueEmail = convertEmailToId(user.email);
    set(playerRef,{
      userName:user.displayName,
      email:user.email,
      playerId:uniqueEmail,
      x: 0,
      y: 0,
      z: 0,
      spaceShipId:1
    });
    onDisconnect(playerRef).remove(playerRef);
  }
  else{
      userId = null;
      currentUser = null;
      signedIn = false;
  }
});

function convertEmailToId(anEmail) {
  var uniqueEmail = anEmail.replace("@","AT");
  uniqueEmail = uniqueEmail.replace(".","DOT");
  return uniqueEmail;
}
//function that checks if it is a returning user or a first time log in
// if first time log in then create new doc in 'users' collection
// if returning user then grab their usrname from exsisting doc in users collection:
async function checkAccount(email, name){
  var uniqueEmail = convertEmailToId(email);
  const userRef = doc(db, "users", uniqueEmail);
  const docSnap = await getDoc(userRef);
  var loggedInString;
  if (docSnap.exists()) {
    signedIn = true;
    console.log("Returning User:", docSnap.data());
    currentUser = {
      userName: docSnap.data().userName,
      playerId: docSnap.data().playerId,
      email: email,
      x:0,
      y:0,
      z:0,
      listeningTo: docSnap.data().listeningTo
    }
    loggedInString = "You have successfully logged in as "+currentUser.userName;
    loginHeader.innerHTML = loggedInString;
    loginRow.innerHTML = "<div></div> <div id='continueBtn' class='loginOrContBtn'><a href='#'>CONTINUE</a></div> <div></div>";
    const continueBtn = document.querySelector("#continueBtn");
    continueBtn.addEventListener('click',  e => {
      loginDiv.style.display = "none";
      createInstance();
    });
  } 
  else {
      signedIn = true;
      // doc.data() will be undefined in this case
      console.log("New user!");
    var uniqueEmail = convertEmailToId(email);
      currentUser = {
        userName: name,
        email: email,
        playerId: uniqueEmail,
        x:0,
        y:0,
        z:0
      }
      await setDoc(doc(db, "users", uniqueEmail), {
        userName: currentUser.userName,
        email: email,
        playerId: uniqueEmail,
        listeningTo: []
      });
      loggedInString = "You have successfully logged in as "+currentUser.userName;
      loginHeader.innerHTML = loggedInString;
      loginRow.innerHTML = "<div></div> <div id='continueBtn' class='loginOrContBtn'><a href='#'>CONTINUE</a></div> <div></div>";
      const continueBtn = document.querySelector("#continueBtn");
      continueBtn.addEventListener('click',  e => {
        loginDiv.style.display = "none";
        createInstance();
      });
  }
  updateDoc(doc(db, "users", currentUser.playerId),{
    listeningTo:[]
  });
  const listenerToCloudFirestore = onSnapshot(doc(db, "users", currentUser.playerId), (doc) => {
    console.log(doc.data().listeningTo);
      for (let i = 0; i <doc.data().listeningTo.length;i++) {
        if (!(listeningToPlayers[doc.data().listeningTo[i]])) {
          console.log("someone joined your instance");
          startListening(doc.data().listeningTo[i]);
        }
      }
    
    
  });
}

async function startListening(uniqueId) {
  var playerRef = ref(realTimeDb,'/activeUsers/' + uniqueId);
  var playerQuery;
  await get(playerRef).then((snapshot) => {
    if (snapshot.exists()) {
      //console.log(snapshot.val());
      playerQuery = snapshot.val();
    }
  });
  console.log("db QUERY:");
  console.log(playerQuery);
  listeningToPlayers[uniqueId] = {
    spaceShip:  createSpaceship(playerQuery.spaceShipId),
    x:playerQuery.x,
    y:playerQuery.y,
    z:playerQuery.z,
    spaceShipId: playerQuery.spaceShipId
  }
  scene.add(listeningToPlayers[uniqueId].spaceShip);
  listeningToPlayers[uniqueId].spaceShip.position.x = playerQuery.x;
  listeningToPlayers[uniqueId].spaceShip.position.y = playerQuery.y;
  listeningToPlayers[uniqueId].spaceShip.position.z = playerQuery.z
  onValue(playerRef,(snapshot) => {
    //console.log(snapshot.exists());
    if (snapshot.exists() == true) {
      updateMultiplayer(uniqueId,snapshot.val());
    }
    else {
      scene.remove(listeningToPlayers[uniqueId].spaceShip);
      off(playerRef);
      delete listeningToPlayers.uniqueId;
      alert("host has left");
    }
  });
}

var menuState = false;
async function createInstance() {
  // Add event listener on keypress
  document.addEventListener('keypress', (event) => {
    var name = event.key;
    var code = event.code;
    if (code == "Backslash") {
      if (menuState == false) {
        showActivePlayers();
      }
      else if (menuState == true) {
        hideMenu();
      }
    }
  }, false);
}
async function hideMenu () {
  join.style.display = "none";
  menuState = false;
}
var allActivePlayers;
async function showActivePlayers () {
  join.style.display = "grid";
  allPlayersRef = ref(realTimeDb,"activeUsers");
  await get(allPlayersRef).then((snapshot) => {
    if (snapshot.exists()) {
      //console.log(snapshot.val());
      allActivePlayers = snapshot.val();
      console.log(allActivePlayers);
      var allIds = [];
      var joinActiveUsersTableString = "<div id='joinTableContainer'>";
      Object.keys(allActivePlayers).forEach(function(key){
        console.log(key);
        if (key != uid) {
          joinActiveUsersTableString += "<div id='player"+key+"'>"+allActivePlayers[key].userName+"</div>";
          joinActiveUsersTableString += "<div> </div>";
          joinActiveUsersTableString += "<a href='#' class='joinBtn' id='join"+key+"'>JOIN</a>";
          allIds.push("#join"+key);
        }
      });
      joinActiveUsersTableString += "</div>";
      join.innerHTML = joinActiveUsersTableString;
      menuState = true;
      setupJoinListener(allIds);
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  });
}

async function setupJoinListener(ids) {
  //console.log(ids);
  for (let i = 0; i <ids.length;i++) {
    console.log(ids[i].substring(5));
    var currentJoin = document.querySelector(ids[i]);
    currentJoin.addEventListener('click',  e => {
      joinInstance(ids[i].substring(5));
      //console.log("join");
    });
  }
}


var listeningToPlayers = [];

async function joinInstance(hostUserId) {
  var hostUser = ref(realTimeDb,'/activeUsers/' + hostUserId);
  var hostShipQuery;
  await get(hostUser).then((snapshot) => {
    if (snapshot.exists()) {
      hideMenu();
      //console.log(snapshot.val());
      hostShipQuery = snapshot.val();
    }
  });
  //var hostSpaceship = createSpaceship(hostShipQuery.spaceShipId);
  var playerObject = {
    userName: hostShipQuery.userName,
    x: hostShipQuery.x,
    y: hostShipQuery.y,
    z: hostShipQuery.z,
  };
  listeningToPlayers[hostUserId] = playerObject;
  listeningToPlayers[hostUserId].spaceShip = createSpaceship(hostShipQuery.spaceShipId);
  scene.add(listeningToPlayers[hostUserId].spaceShip); // Add the new spaceship mesh to the scene
  listeningToPlayers[hostUserId].spaceShip.position.y = allActivePlayers[hostUserId].y;
  listeningToPlayers[hostUserId].spaceShip.position.x = allActivePlayers[hostUserId].x;
  listeningToPlayers[hostUserId].spaceShip.position.z = allActivePlayers[hostUserId].z;

  var hostCloudRef = doc(db, "users", allActivePlayers[hostUserId].playerId);
  var hostDoc = await getDoc(hostCloudRef);
  var hostIsLisentingArray;
  if (hostDoc.exists()) {
    hostIsLisentingArray = hostDoc.data().listeningTo;
  } 
  else {
    console.log("No such document!");
  }
  console.log(hostIsLisentingArray);
  if (!(hostIsLisentingArray.includes(uid))) {
    hostIsLisentingArray.push(uid);
    updateDoc(doc(db, "users",allActivePlayers[hostUserId].playerId), {
      listeningTo: hostIsLisentingArray
    });
  }

  await onValue(hostUser,(snapshot) => {
    //console.log(snapshot.exists());
    if (snapshot.exists() == true) {
      var data = snapshot.val();
      console.log(data);
      console.log(hostUserId+"host is moving");
      updateMultiplayer(hostUserId,data);
    }
    else {
      updateDoc(doc(db, "users",allActivePlayers[hostUserId].playerId), {
        listeningTo: []
      });
      scene.remove(listeningToPlayers[hostUserId].spaceShip);
      updateDoc(doc(db, "users", currentUser.playerId),{
        listeningTo:[]
      });
      off(hostUser);
      delete listeningToPlayers.hostUserId;
      alert("Your lad left your session");
    }
  });
  
}
async function updateMultiplayer(player,data){
  /*
  console.log("db ARRay: ");
  console.log(data);
  console.log("local ARRay: ");
  console.log(listeningToPlayers);
  */
    if (data.spaceShipId != listeningToPlayers[player].spaceShipId) {
      console.log("chaning host spaceship");
      //console.log(listeningToPlayers[player].spaceShip);
      listeningToPlayers[player].spaceShipId = data.spaceShipId;
      scene.remove(listeningToPlayers[player].spaceShip); // Remove the existing spaceship
      listeningToPlayers[player].spaceShip = createSpaceship(listeningToPlayers[player].spaceShipId);
      scene.add(listeningToPlayers[player].spaceShip); // Add the new spaceship mesh to the scene
    }
    listeningToPlayers[player].x = data.x,
    listeningToPlayers[player].y = data.y,
    listeningToPlayers[player].z = data.z,
    listeningToPlayers[player].spaceShip.position.x = data.x;
    listeningToPlayers[player].spaceShip.position.y = data.y;
    listeningToPlayers[player].spaceShip.position.z = data.z;
}
//-------------------------------------------------------------------------------------------------------
var currentUserX = 0;
var currentUserY = 0;
var currentUserZ = 0;
var currentUserSpaceShipId = 1;
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


//-----------------------Messing with spaceship types---------------------------

import { createSpaceship } from './javascript/spaceShipModules';

let currentSpaceship = createSpaceship(1); // Initialize with spaceship type 1

// Add the starting spaceship mesh to the scene
scene.add(currentSpaceship);

// Event listener for keyboard key presses
document.addEventListener('keydown', (event) => {
  if (event.key === '1' ||event.key === '2' || event.key === '3') {
    console.log(currentSpaceship);
    scene.remove(currentSpaceship); // Remove the existing spaceship

    const spaceshipType = parseInt(event.key);
    currentUserSpaceShipId = spaceshipType;
    update(playerRef,{
      x: currentUserX,
      y: currentUserY,
      z: currentUserZ,
      spaceShipId: currentUserSpaceShipId
    });
    currentSpaceship = createSpaceship(spaceshipType);
    scene.add(currentSpaceship); // Add the new spaceship mesh to the scene
    currentSpaceship.position.y = currentUserY;
    currentSpaceship.position.x = currentUserX;
    currentSpaceship.position.z = currentUserZ;
  }
});

// Function to shoot a cube from the spaceship
function shootCube() {
  const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

  // Position the cube at the tip of the spaceship
  const spaceshipDirection = new THREE.Vector3();
  currentSpaceship.getWorldDirection(spaceshipDirection);
  const offset = spaceshipDirection.clone().multiplyScalar(-0.5); // Adjust the offset as needed
  const cubePosition = currentSpaceship.position.clone().add(offset);
  cubeMesh.position.copy(cubePosition);

  // Calculate and set the initial velocity
  const initialVelocity = spaceshipDirection.clone().multiplyScalar(-100); // Adjust the speed as needed
  cubeMesh.userData.velocity = initialVelocity;

  // Set a lifetime for the cube (laser) to be removed after 5 seconds
  cubeMesh.userData.lifetime = 5.0;

  // Add the cube to the scene and the array of active cubes
  scene.add(cubeMesh);
  activeCubes.push(cubeMesh);

  // Set a timeout to remove the cube after 5 seconds
  setTimeout(() => {
    scene.remove(cubeMesh);
    activeCubes.splice(activeCubes.indexOf(cubeMesh), 1);
  }, 5000);
}

// Event listener to shoot a cube when a key is pressed (e.g., spacebar)
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    shootCube();
  }
});

// Function to update the laser position and check for removal
function updateLasers(deltaTime) {
  for (let i = activeCubes.length - 1; i >= 0; i--) {
    const cubeMesh = activeCubes[i];
    
    // Update position based on velocity and time
    cubeMesh.position.add(cubeMesh.userData.velocity.clone().multiplyScalar(deltaTime));
    
    // Check if the laser has exceeded its lifetime
    cubeMesh.userData.lifetime -= deltaTime;
    if (cubeMesh.userData.lifetime <= 0) {
      scene.remove(cubeMesh);
      activeCubes.splice(i, 1);
    }
  }
}

// Function to create an asteroid
function createAsteroid() {
  const asteroidGeometry = new THREE.BoxGeometry(1, 1, 1);
  const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Brown color
  const asteroidMesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

  // Generate random offsets within the specified range
  const offsetX = Math.random() * 40 - 20; // Adjust the range as needed
  const offsetY = Math.random() * 40 - 20; // Adjust the range as needed
  const offsetZ = Math.random() * 40 - 20; // Adjust the range as needed

  // Apply the offsets to the ship's position
  asteroidMesh.position.copy(currentSpaceship.position).add(new THREE.Vector3(offsetX, offsetY, offsetZ));

  scene.add(asteroidMesh);
  return asteroidMesh;
}


// Function to handle collisions between lasers and asteroids
function handleCollisions() {
  for (let i = activeCubes.length - 1; i >= 0; i--) {
    const cubeMesh = activeCubes[i];

    // Check for collision with each asteroid
    for (let j = asteroids.length - 1; j >= 0; j--) {
      const asteroidMesh = asteroids[j];

      // Calculate the distance between the laser and asteroid centers
      const distance = cubeMesh.position.distanceTo(asteroidMesh.position);

      // Check if the distance is less than a threshold (collision occurred)
      if (distance < 1.5) { // Adjust the threshold as needed
        // Remove the laser and asteroid
        scene.remove(cubeMesh);
        activeCubes.splice(i, 1);
        scene.remove(asteroidMesh);
        asteroids.splice(j, 1);

        // Create a new asteroid to replace the one that was destroyed
        asteroids.push(createAsteroid());
      }
    }
  }
}



// Create a spaceship mesh
//const spaceshipGeometry = new THREE.BoxGeometry(1, 5, 1);
//const spaceshipMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
//const spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);
//scene.add(spaceship);

//end of changes

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
    // Move the spaceship forward based on its orientation
    const spaceshipDirection = new THREE.Vector3();
    currentSpaceship.getWorldDirection(spaceshipDirection);
  
    const velocity = spaceshipDirection.clone().multiplyScalar(-0.1); // Adjust the speed as needed
    currentSpaceship.position.add(velocity);
    
    // Update user position in the database
    updateUserPositionInDB();
  }
  if (keyboard['KeyA']) {
    // Rotate the spaceship and camera to the left around the Y-axis
    currentSpaceship.rotateY(0.01); // Adjust the rotation angle as needed
    camera.rotateY(0.01); // Adjust the rotation angle as needed
    // Update user position in the database
    updateUserPositionInDB();
  }
  if (keyboard['KeyS']) {
    // Move the spaceship forward based on its orientation
    const spaceshipDirection = new THREE.Vector3();
    currentSpaceship.getWorldDirection(spaceshipDirection);
  
    const velocity = spaceshipDirection.clone().multiplyScalar(0.1); // Adjust the speed as needed
    currentSpaceship.position.add(velocity);
  
    // Update user position in the database
    updateUserPositionInDB();
  }
  if (keyboard['KeyD']) {
    // Rotate the spaceship and camera to the right around the Y-axis
    currentSpaceship.rotateY(-0.01); // Adjust the rotation angle as needed
    camera.rotateY(-0.01); // Adjust the rotation angle as needed
    // Update user position in the database
    updateUserPositionInDB();
  }
  if (keyboard['KeyI']) {
    // Rotate the spaceship and camera upwards (around the X-axis)
    currentSpaceship.rotateX(0.01); // Adjust the rotation angle as needed
    camera.rotateX(0.01); // Adjust the rotation angle as needed
    // Update user position in the database
    updateUserPositionInDB();
  }
  if (keyboard['KeyJ']) {
    // Rotate the spaceship and camera downwards (around the X-axis)
    currentSpaceship.rotateX(-0.01); // Adjust the rotation angle as needed
    camera.rotateX(-0.01); // Adjust the rotation angle as needed
    // Update user position in the database
    updateUserPositionInDB();
  }

  // Move the camera to follow the spaceship
  const cameraOffset = new THREE.Vector3(0, 2, 5);
  const spaceshipGlobalPosition = currentSpaceship.localToWorld(new THREE.Vector3(0, 0, 0));
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
  currentSpaceship.position.add(hoverPositionOffset);
  Object.keys(listeningToPlayers).forEach(function(key){
    listeningToPlayers[key].spaceShip.position.add(hoverPositionOffset);
  });
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

function updateUserPositionInDB(){
  update(playerRef,{
    x: currentSpaceship.position.x,
    y: currentSpaceship.position.y,
    z: currentSpaceship.position.z,
    spaceShipId: currentUserSpaceShipId
  });
}

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  // Calculate the time elapsed since the last frame
  const currentTime = performance.now();
  const deltaTime = (currentTime - previousTime) * 0.001; // Convert to seconds

  // Update the spaceship position based on user input
  handleSpaceshipMovement();
  handleSpaceshipHovering();

  // Calculate the camera offset based on spaceship rotation
  const cameraOffset = new THREE.Vector3(0, 2, -5); // Adjust the camera offset as needed
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(currentSpaceship.rotation);

  // Apply a 180-degree rotation around the Y-axis (up axis)
  rotationMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI));

  const cameraOffsetRotated = cameraOffset.clone().applyMatrix4(rotationMatrix);

  // Set the camera position and orientation based on spaceship rotation
  camera.position.copy(currentSpaceship.position).add(cameraOffsetRotated);
  camera.lookAt(currentSpaceship.position);

  // Update laser positions and check for removal
  updateLasers(deltaTime);

  //Calls the handlecollisions that will cause the lasers to interact with objects
  handleCollisions();

  // Render the scene
  renderer.render(scene, camera);

  previousTime = currentTime;

  
}

// Initialize variables
const activeCubes = [];
const asteroids = []; // Array to store asteroid meshes
let previousTime = performance.now();

// Create initial asteroids and add to the array
for (let i = 0; i < 5; i++) {
  asteroids.push(createAsteroid());
}

animate();
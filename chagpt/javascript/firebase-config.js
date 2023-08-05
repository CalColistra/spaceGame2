// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCebrgrJNANRhUIh_2IPBgfoSHP3242srI",
  authDomain: "spacegame2.firebaseapp.com",
  projectId: "spacegame2",
  storageBucket: "spacegame2.appspot.com",
  messagingSenderId: "513671448778",
  appId: "1:513671448778:web:792628f6f526016a3acc33",
  databaseURL:"https://spacegame2-default-rtdb.firebaseio.com/" 
};

  // Initialize Firebase
  //const app = initializeApp(firebaseConfig);
  export const app = initializeApp(firebaseConfig);
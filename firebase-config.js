const firebaseConfig = {
  apiKey: "AIzaSyCoZFEiBmSqadpLledhj4sARGTIcpjWBhs",
  authDomain: "robokacija-fm.firebaseapp.com",
  projectId: "robokacija-fm",
  storageBucket: "robokacija-fm.firebasestorage.app",
  messagingSenderId: "19728548114",
  appId: "1:19728548114:web:0e678e742ccf87653573cb",
  measurementId: "G-N9NMG02VXR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

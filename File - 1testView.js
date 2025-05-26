// Load Firebase SDKs dynamically
const loadFirebase = () => {
  return new Promise((resolve) => {
    const script1 = document.createElement('script');
    script1.src = "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js";
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js";
      script2.onload = () => {
        const script3 = document.createElement('script');
        script3.src = "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js";
        script3.onload = resolve;
        document.head.appendChild(script3);
      };
      document.head.appendChild(script2);
    };
    document.head.appendChild(script1);
  });
};

// Initialize Firebase and handle login
loadFirebase().then(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyDIwoUIMJrJQeLBD9vijsfIUXG9BgaGSPs",
    authDomain: "miner-zyx.firebaseapp.com",
    projectId: "miner-zyx",
    storageBucket: "miner-zyx.firebasestorage.app",
    messagingSenderId: "430019680448",
    appId: "1:430019680448:web:d066b8aaf4355907e1b525",
    measurementId: "G-V6SDWYH6M2"
  };

  // Initialize Firebase App and Services
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Fetch the UID from Firestore
      const docRef = db.collection("users").doc(user.uid);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const userData = docSnap.data();
        // Store UID and email in localStorage
        localStorage.setItem("xyzUidAccess", userData.userID);  // UID from Firestore
        localStorage.setItem("xyzEmailAccess", email);          // Email
      }

      // Redirect to dashboard
      window.location.href = "xyzSentinel.html";

    } catch (error) {
      document.getElementById("error-message").textContent = error.message;
    }
  });
});

function redirectToSignUp() {
    window.location.href = "xyzSignUp.html";
  }
  
  // Check if both xyzEmailAccess and xyzUidAccess exist in localStorage
const email = localStorage.getItem("xyzEmailAccess");
const uid = localStorage.getItem("xyzUidAccess");

// If both exist, redirect to the desired URL
if (email && uid) {
  window.location.href = "xyzDashboard.html"; // Replace with your redirect link
}
 document.getElementById('pwTrigger').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('floatingContainer').style.display = 'block';
    });

    document.getElementById('closeBtn').addEventListener('click', function() {
        document.getElementById('floatingContainer').style.display = 'none';
    });
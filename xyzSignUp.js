    // Quantum background animation
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('quantumCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Quantum core
    const coreGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const quantumCore = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(quantumCore);
    
    // Qubits
    const qubits = [];
    const qubitCount = 80;
    const qubitGeometry = new THREE.SphereGeometry(0.03, 6, 6);
    const qubitMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    for (let i = 0; i < qubitCount; i++) {
      const qubit = new THREE.Mesh(qubitGeometry, qubitMaterial);
      const radius = 2 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      
      qubit.position.x = radius * Math.sin(theta);
      qubit.position.z = radius * Math.cos(theta);
      qubit.position.y = (Math.random() - 0.5) * 4;
      
      qubit.userData = {
        speed: 0.002 + Math.random() * 0.003,
        angle: Math.random() * Math.PI * 2,
        radius: radius
      };
      
      scene.add(qubit);
      qubits.push(qubit);
    }
    
    // Connection lines
    const lines = [];
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.1 });
    
    for (let i = 0; i < 15; i++) {
      const start = qubits[Math.floor(Math.random() * qubits.length)].position;
      const end = qubits[Math.floor(Math.random() * qubits.length)].position;
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      lines.push({ line, start, end });
    }
    
    camera.position.z = 8;
    
    function animate() {
      requestAnimationFrame(animate);
      
      quantumCore.rotation.x += 0.003;
      quantumCore.rotation.y += 0.005;
      
      qubits.forEach(qubit => {
        qubit.userData.angle += qubit.userData.speed;
        qubit.position.x = qubit.userData.radius * Math.sin(qubit.userData.angle);
        qubit.position.z = qubit.userData.radius * Math.cos(qubit.userData.angle);
        qubit.position.y = Math.sin(qubit.userData.angle * 3) * 2;
      });
      
      lines.forEach(conn => {
        conn.line.geometry.setFromPoints([conn.start, conn.end]);
      });
      
      renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Notification system
    function showNotification(message, type = 'success') {
      const notificationContainer = document.getElementById('notificationContainer');
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <div>${message}</div>
        <button class="notification-close">&times;</button>
      `;
      
      notificationContainer.appendChild(notification);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 5000);
      
      // Close button functionality
      notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          notification.remove();
        }, 300);
      });
    }

    // Firebase integration
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
    import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDIwoUIMJrJQeLBD9vijsfIUXG9BgaGSPs",
      authDomain: "miner-zyx.firebaseapp.com",
      projectId: "miner-zyx",
      storageBucket: "miner-zyx.firebasestorage.app",
      messagingSenderId: "430019680448",
      appId: "1:430019680448:web:d066b8aaf4355907e1b525",
      measurementId: "G-V6SDWYH6M2"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    function generateXyzAddress() {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const xyzLetters = ['x', 'y', 'z'];

      let address = '';
      address += xyzLetters[Math.floor(Math.random() * xyzLetters.length)]; // first

      for (let i = 1; i < 11; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
      }

      address += xyzLetters[Math.floor(Math.random() * xyzLetters.length)]; // middle

      for (let i = 12; i < 23; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
      }

      address += xyzLetters[Math.floor(Math.random() * xyzLetters.length)]; // last

      return address;
    }
   
    // Function to parse referral code from URL
    function getReferralCodeFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('ref') || '';
    }

    window.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById("signup-form");
      const loadingContainer = document.getElementById('loadingContainer');
      const submitBtn = document.getElementById('submitBtn');
      
      // Auto-fill referral code if present in URL
      const referralCodeInput = document.getElementById('referralCode');
      const refCode = getReferralCodeFromURL();
      
      if (refCode) {
        referralCodeInput.value = refCode;
      }
      
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Show loading state
        submitBtn.disabled = true;
        loadingContainer.style.display = 'flex';
        
        const fullName = document.getElementById("fullName").value.trim();
        const userName = document.getElementById("userName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        let referralCode = document.getElementById("referralCode").value.trim();
        
        // If referral code is empty, check URL again (in case user cleared it)
        if (!referralCode) {
          referralCode = getReferralCodeFromURL();
        }

        if (password !== confirmPassword) {
          showNotification("Encryption keys do not match.", "error");
          loadingContainer.style.display = 'none';
          submitBtn.disabled = false;
          return;
        }

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          const xyzAddress = generateXyzAddress();

          await setDoc(doc(db, "users", user.uid), {
            userID: user.uid,
            userName: userName,
            xyzAddress: xyzAddress,
            xyzReferrer: referralCode || "",
            xyzBalance: 0,
            solBalance: 0,
            xyzReferrals: [],
            xyzTransactions: [],
          });

          await user.getIdToken(true);

          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            localStorage.setItem("xyzUidAccess", userData.userID);
            localStorage.setItem("xyzEmailAccess", email);
          }

          await setDoc(doc(db, "documentXYZ", user.uid), {
            userID: user.uid,
            email: email,
            userName: userName,
            xyzAddress: xyzAddress,
            xyzReferrer: referralCode || "",
            xyzBalance: 0,
            solBalance: 0,
            xyzReferrals: [],
            xyzTransactions: "",
          });

          showNotification("Quantum account initialized successfully!", "success");
          setTimeout(() => {
            window.location.href = "xyzDashboard.html";
          }, 1500);
        } catch (error) {
          console.error("Sign-up error:", error);
          showNotification("Quantum initialization failed: " + error.message, "error");
          loadingContainer.style.display = 'none';
          submitBtn.disabled = false;
        }
      });
      
      // Password reset modal
      document.getElementById('pwTrigger').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('floatingContainer').style.display = 'block';
      });

    document.getElementById('closeBtn').addEventListener('click', function() {
        document.getElementById('floatingContainer').style.display = 'none';
      });
      
      // Check if both xyzEmailAccess and xyzUidAccess exist in localStorage
      const email = localStorage.getItem("xyzEmailAccess");
      const uid = localStorage.getItem("xyzUidAccess");

      // If both exist, redirect to the desired URL
      if (email && uid) {
        window.location.href = "xyzDashboard.html";
      }
    });
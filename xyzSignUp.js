// Enhanced Quantum background animation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('quantumCanvas'), 
  antialias: true,
  alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

// Enhanced Quantum core with glow
const coreGeometry = new THREE.IcosahedronGeometry(1.5, 3);
const coreMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x00ff00,
  wireframe: true,
  transparent: true,
  opacity: 0.3
});
const quantumCore = new THREE.Mesh(coreGeometry, coreMaterial);
scene.add(quantumCore);

// Enhanced Qubits with different colors
const qubits = [];
const qubitCount = 100;
const qubitColors = [0x00f7ff, 0xa777e3, 0xff00ff, 0x00ff9d];

for (let i = 0; i < qubitCount; i++) {
  const geometry = new THREE.OctahedronGeometry(0.05 + Math.random() * 0.02, 0);
  const color = qubitColors[Math.floor(Math.random() * qubitColors.length)];
  const material = new THREE.MeshBasicMaterial({ 
    color: color,
    transparent: true,
    opacity: 0.7
  });
  
  const qubit = new THREE.Mesh(geometry, material);
  
  // Spherical distribution
  const radius = 2 + Math.random() * 4;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  
  qubit.position.x = radius * Math.sin(phi) * Math.cos(theta);
  qubit.position.y = radius * Math.cos(phi);
  qubit.position.z = radius * Math.sin(phi) * Math.sin(theta);
  
  qubit.userData = {
    speed: 0.001 + Math.random() * 0.004,
    angle: Math.random() * Math.PI * 2,
    radius: radius,
    color: color,
    opacity: 0.7
  };
  
  scene.add(qubit);
  qubits.push(qubit);
}

// Enhanced connection lines with gradient
const lines = [];
for (let i = 0; i < 20; i++) {
  const start = qubits[Math.floor(Math.random() * qubits.length)].position;
  const end = qubits[Math.floor(Math.random() * qubits.length)].position;
  
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00f7ff,
    transparent: true,
    opacity: 0.15 + Math.random() * 0.1
  });
  
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);
  lines.push({ line, start, end, material: lineMaterial });
}

// Add light effects
const ambientLight = new THREE.AmbientLight(0x00f7ff, 0.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00f7ff, 1, 20);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

camera.position.z = 10;

let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.01;
  
  // Animate core
  quantumCore.rotation.x += 0.002;
  quantumCore.rotation.y += 0.003;
  quantumCore.rotation.z += 0.001;
  
  // Animate qubits with wave motion
  qubits.forEach((qubit, index) => {
    qubit.userData.angle += qubit.userData.speed;
    
    // Orbital motion
    qubit.position.x = qubit.userData.radius * Math.sin(qubit.userData.angle) * Math.cos(time * 0.5 + index * 0.01);
    qubit.position.z = qubit.userData.radius * Math.cos(qubit.userData.angle) * Math.sin(time * 0.5 + index * 0.01);
    qubit.position.y = Math.sin(qubit.userData.angle * 2 + index * 0.05) * 2;
    
    // Pulsing opacity
    qubit.material.opacity = 0.5 + 0.3 * Math.sin(time * 2 + index * 0.1);
  });
  
  // Animate lines
  lines.forEach((conn, index) => {
    conn.material.opacity = 0.1 + 0.1 * Math.sin(time * 3 + index * 0.2);
  });
  
  // Pulse the point light
  pointLight.intensity = 0.8 + 0.4 * Math.sin(time * 2);
  
  renderer.render(scene, camera);
}

animate();

// Enhanced window resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Enhanced Notification system
function showNotification(message, type = 'success', duration = 5000) {
  const notificationContainer = document.getElementById('notificationContainer');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      ${getNotificationIcon(type)} ${message}
    </div>
    <button class="notification-close" aria-label="Close notification">&times;</button>
  `;
  
  notificationContainer.appendChild(notification);
  
  // Auto remove after duration
  const autoRemove = setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, duration);
  
  // Close button functionality
  notification.querySelector('.notification-close').addEventListener('click', () => {
    clearTimeout(autoRemove);
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  });
}

function getNotificationIcon(type) {
  switch(type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
}

// Password strength checker
function checkPasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[#$@*]/.test(password)) strength += 25;
  
  return strength;
}

// Form validation functions
function validateFullName(name) {
  const parts = name.trim().split(' ');
  return parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0;
}

function validateUsername(username) {
  return username.length >= 8 && /^[a-zA-Z0-9]+$/.test(username);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[#$@*]/.test(password);
  return password.length >= 6 && hasUpper && hasNumber && hasSpecial;
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

// Generate XYZ address with enhanced pattern
function generateXyzAddress() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const xyzLetters = ['x', 'y', 'z'];
  
  let address = 'xyz_';
  
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) {
      address += xyzLetters[Math.floor(Math.random() * xyzLetters.length)];
    } else {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  address += '_xyz';
  return address;
}

// Function to parse referral code from URL
function getReferralCodeFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || '';
}

// Real-time form validation
function setupRealTimeValidation() {
  const inputs = ['fullName', 'userName', 'email', 'password', 'confirmPassword'];
  
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    const validationElement = document.getElementById(`${inputId}Validation`);
    
    if (input && validationElement) {
      input.addEventListener('input', () => {
        validateInput(inputId);
      });
      
      input.addEventListener('blur', () => {
        validateInput(inputId);
      });
    }
  });
}

function validateInput(inputId) {
  const input = document.getElementById(inputId);
  const value = input.value.trim();
  let isValid = false;
  let message = '';
  
  switch(inputId) {
    case 'fullName':
      isValid = validateFullName(value);
      message = isValid ? '✓ Name valid' : 'Please enter both first and last name';
      break;
    case 'userName':
      isValid = validateUsername(value);
      message = isValid ? '✓ Username valid' : 'Username must be 8+ alphanumeric characters';
      break;
    case 'email':
      isValid = validateEmail(value);
      message = isValid ? '✓ Email format valid' : 'Please enter a valid email address';
      break;
    case 'password':
      const strength = checkPasswordStrength(value);
      document.getElementById('strengthMeter').style.width = `${strength}%`;
      isValid = validatePassword(value);
      message = isValid ? '✓ Password strong' : 'Password must have 6+ chars with capital letter, number, and special character';
      break;
    case 'confirmPassword':
      const password = document.getElementById('password').value;
      isValid = value === password;
      message = isValid ? '✓ Passwords match' : 'Passwords do not match';
      break;
  }
  
  const validationElement = document.getElementById(`${inputId}Validation`);
  if (validationElement) {
    validationElement.textContent = message;
    validationElement.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
  }
  
  // Update input styling
  input.classList.remove('input-valid', 'input-invalid');
  input.classList.add(isValid ? 'input-valid' : 'input-invalid');
  
  return isValid;
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");
  const loadingContainer = document.getElementById('loadingContainer');
  const submitBtn = document.getElementById('submitBtn');
  
  // Setup real-time validation
  setupRealTimeValidation();
  
  // Auto-fill referral code if present in URL
  const referralCodeInput = document.getElementById('referralCode');
  const refCode = getReferralCodeFromURL();
  
  if (refCode) {
    referralCodeInput.value = refCode;
    showNotification(`Referral code applied: ${refCode}`, 'info', 3000);
  }
  
  // Password visibility toggle
  document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
  });
  
  document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
    const confirmInput = document.getElementById('confirmPassword');
    const type = confirmInput.type === 'password' ? 'text' : 'password';
    confirmInput.type = type;
    this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
  });
  
  // Form submission with enhanced validation
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Validate all inputs
    const inputs = ['fullName', 'userName', 'email', 'password', 'confirmPassword'];
    let allValid = true;
    
    for (const inputId of inputs) {
      if (!validateInput(inputId)) {
        allValid = false;
      }
    }
    
    if (!allValid) {
      showNotification("Please fix validation errors before submitting.", "error");
      submitBtn.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        submitBtn.style.animation = '';
      }, 500);
      return;
    }
    
    // Show loading state with enhanced animation
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⚡ PROCESSING...</span>';
    loadingContainer.style.display = 'flex';
    
    const fullName = document.getElementById("fullName").value.trim();
    const userName = document.getElementById("userName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    let referralCode = document.getElementById("referralCode").value.trim();
    
    // Final password confirmation check
    if (password !== confirmPassword) {
      showNotification("Encryption keys do not match.", "error");
      loadingContainer.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>⚡ INITIALIZE ACCOUNT</span>';
      return;
    }

    try {
      // Create user with enhanced error handling
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate unique XYZ address
      const xyzAddress = generateXyzAddress();
      
      showNotification("Generating quantum address...", "info", 2000);

      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        userID: user.uid,
        fullName: fullName,
        userName: userName,
        xyzAddress: xyzAddress,
        xyzReferrer: referralCode || "",
        xyzBalance: 0,
        solBalance: 0,
        xyzReferrals: [],
        xyzTransactions: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      // Get fresh token
      await user.getIdToken(true);

      // Store in localStorage
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        localStorage.setItem("xyzUidAccess", userData.userID);
        localStorage.setItem("xyzEmailAccess", email);
        localStorage.setItem("xyzUserName", userName);
        localStorage.setItem("xyzAddress", xyzAddress);
      }

      // Additional document creation
      await setDoc(doc(db, "documentXYZ", user.uid), {
        userID: user.uid,
        email: email,
        fullName: fullName,
        userName: userName,
        xyzAddress: xyzAddress,
        xyzReferrer: referralCode || "",
        xyzBalance: 0,
        solBalance: 0,
        xyzReferrals: [],
        xyzTransactions: "",
        created: new Date().toISOString()
      });

      // Success notification with delay
      showNotification("🎉 Quantum account initialized successfully! Redirecting...", "success");
      
      // Enhanced redirect with progress indication
      setTimeout(() => {
        loadingContainer.querySelector('.loading-text').textContent = "REDIRECTING TO DASHBOARD";
        setTimeout(() => {
          window.location.href = "xyzDashboard.html";
        }, 1000);
      }, 1500);
      
    } catch (error) {
      console.error("Sign-up error:", error);
      
      // Enhanced error messages
      let errorMessage = "Quantum initialization failed: ";
      switch(error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered. Please try logging in.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format. Please check your email.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please use a stronger password.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection.";
          break;
        default:
          errorMessage += error.message;
      }
      
      showNotification(errorMessage, "error");
      loadingContainer.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>⚡ INITIALIZE ACCOUNT</span>';
    }
  });
  
  // Password reset modal
  document.getElementById('pwTrigger').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('floatingContainer').style.display = 'block';
    showNotification("Opening password reset portal...", "info", 2000);
  });

  document.getElementById('closeBtn').addEventListener('click', function() {
    document.getElementById('floatingContainer').style.display = 'none';
  });
  
  // Close modal on outside click
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('floatingContainer');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Check if user is already logged in
  const email = localStorage.getItem("xyzEmailAccess");
  const uid = localStorage.getItem("xyzUidAccess");

  if (email && uid) {
    showNotification("Welcome back! Redirecting to dashboard...", "success");
    setTimeout(() => {
      window.location.href = "xyzDashboard.html";
    }, 1500);
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('submitBtn').click();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
      document.getElementById('floatingContainer').style.display = 'none';
    }
  });
  
  // Add shake animation for errors
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
});

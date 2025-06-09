 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
        import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updateEmail, updatePassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
        import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

        // Firebase config
        const firebaseConfig = {
            apiKey: "AIzaSyDIwoUIMJrJQeLBD9vijsfIUXG9BgaGSPs",
            authDomain: "miner-zyx.firebaseapp.com",
            projectId: "miner-zyx",
            storageBucket: "miner-zyx.appspot.com",
            messagingSenderId: "430019680448",
            appId: "1:430019680448:web:d066b8aaf4355907e1b525",
            measurementId: "G-V6SDWYH6M2"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // Get user data from local storage
        const userEmail = localStorage.getItem("xyzEmailAccess");
        const userUID = localStorage.getItem("xyzUidAccess");

        // DOM elements
        const userNameElement = document.getElementById('userName');
        const userIDElement = document.getElementById('userID');
        const emailElement = document.getElementById('email');
        const xyzAddressElement = document.getElementById('xyzAddress');
        const xyzReferralsElement = document.getElementById('xyzReferrals');
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const changePasswordSection = document.getElementById('changePasswordSection');
        const currentPasswordInput = document.getElementById('currentPasswordInput');
        const newPasswordInput = document.getElementById('newPasswordInput');
        const confirmPasswordInput = document.getElementById('confirmPasswordInput');
        const savePasswordBtn = document.getElementById('savePasswordBtn');
        const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
        const avatarElement = document.getElementById('avatar');
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const confirmLogout = document.getElementById('confirmLogout');
        const cancelLogout = document.getElementById('cancelLogout');

        // Fetch user data from Firestore
        async function fetchUserData() {
            if (!userUID) {
                console.error("No UID found in local storage");
                return;
            }

            try {
                const docRef = doc(db, "documentXYZ", userUID);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    
                    updateUI(userData);
                    updateAvatar(userData.userName);
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
            
        }
        

        // Update UI with user data
        function updateUI(userData) {
            userNameElement.textContent = userData.userName || "Anonymous";
            userIDElement.textContent = `ID: ${userData.userID || userUID}`;
            emailElement.textContent = userData.email || userEmail || "No email";
            xyzAddressElement.textContent = userData.xyzAddress || "Not set";
            xyzReferralsElement.textContent = userData.xyzReferrals || "0";
        }

        // Generate avatar based on user name
        function updateAvatar(userName) {
            if (!userName) return;
            
            const nameParts = userName.split(' ');
            let initials = '';
            
            if (nameParts.length > 0) {
                initials += nameParts[0].charAt(0).toUpperCase();
            }
            if (nameParts.length > 1) {
                initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
            }
            
            avatarElement.textContent = initials || '👤';
        }

        
        // Password change functionality
        changePasswordBtn.addEventListener('click', () => {
            changePasswordSection.classList.remove('hidden');
            editEmailSection.classList.add('hidden');
        });

        cancelPasswordBtn.addEventListener('click', () => {
            changePasswordSection.classList.add('hidden');
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        });

        savePasswordBtn.addEventListener('click', async () => {
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (!currentPassword) {
                alert("Please enter your current password");
                return;
            }
            
            if (!newPassword || newPassword.length < 6) {
                alert("New password must be at least 6 characters");
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert("New passwords don't match");
                return;
            }
            
            try {
                const user = auth.currentUser;
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                
                // Reauthenticate user
                await reauthenticateWithCredential(user, credential);
                
                // Update password
                await updatePassword(user, newPassword);
                
                // Clear and hide form
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                changePasswordSection.classList.add('hidden');
                
                alert("Password updated successfully!");
            } catch (error) {
                console.error("Error updating password:", error);
                alert(`Failed to update password: ${error.message}`);
            }
        });

        // Logout functionality
        logoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'flex';
        });

        cancelLogout.addEventListener('click', () => {
            logoutModal.style.display = 'none';
        });

        confirmLogout.addEventListener('click', async () => {
            try {
                // Sign out from Firebase
                await signOut(auth);
                
                // Remove local storage items
                localStorage.removeItem('xyzEmailAccess');
                 // Redirect to login page (change URL as needed)
                window.location.href = 'tryn.html';
            } catch (error) {
                console.error("Error during logout:", error);
                alert("Error during logout. Please try again.");
            }
            
        });

        // Simple email validation
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        // Initialize copy buttons
        function initCopyButtons() {
            // Add copy button to address
            const copyAddressBtn = document.createElement('button');
            copyAddressBtn.className = 'button copy-btn';
            copyAddressBtn.textContent = 'Copy';
            copyAddressBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(xyzAddressElement.textContent);
                copyAddressBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyAddressBtn.textContent = 'Copy';
                }, 2000);
            });
            xyzAddressElement.parentNode.appendChild(copyAddressBtn);
        }

        // Initialize real-time updates
        function initRealTimeUpdates() {
            const userRef = doc(db, "documentXYZ", userUID);
            
            onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                    updateUI(userData);
                }
            });
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', () => {
            fetchUserData();
            initCopyButtons();
            initRealTimeUpdates();
        });
        const email = localStorage.getItem("xyzEmailAccess");
const uid = localStorage.getItem("xyzUidAccess");

// Redirect to login if either email or UID is missing
if (!email || !uid) {
  window.location.href = "tryn.html"; // Replace with your login URL
}

 function createFuturisticNav() {
  // Navigation items with links to HTML files
  const navItems = [
    { 
      name: "Dashboard", 
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>`, 
      link: "xyzDashboard.html" 
    },
    { 
      name: "Mining", 
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 20H13.5V17H10.5V20ZM4 17H7V14H4V17ZM7 20H10V17H7V20ZM4 11H7V8H4V11ZM10 11H13V8H10V11ZM16 11H19V8H16V11ZM7 11H10V8H7V11ZM16 17H19V14H16V17ZM13 14H16V11H13V14ZM13 17H16V14H13V17Z" fill="currentColor"/>
            </svg>`, 
      link: "xyzMining.html" 
    },
    { 
      name: "Notifications", 
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
            </svg>`, 
      link: "xyzNotification.html" 
    },
    { 
      name: "P2P", 
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 17.5C7.17 17.5 6.5 16.83 6.5 16C6.5 15.17 7.17 14.5 8 14.5C8.83 14.5 9.5 15.17 9.5 16C9.5 16.83 8.83 17.5 8 17.5ZM9.5 12C9.5 11.17 8.83 10.5 8 10.5C7.17 10.5 6.5 11.17 6.5 12C6.5 12.83 7.17 13.5 8 13.5C8.83 13.5 9.5 12.83 9.5 12ZM12 18C10.93 18 10.07 17.15 10.02 16.1H13.98C13.93 17.15 13.07 18 12 18ZM15.5 13.5C14.67 13.5 14 12.83 14 12C14 11.17 14.67 10.5 15.5 10.5C16.33 10.5 17 11.17 17 12C17 12.83 16.33 13.5 15.5 13.5ZM16 17.5C15.17 17.5 14.5 16.83 14.5 16C14.5 15.17 15.17 14.5 16 14.5C16.83 14.5 17.5 15.17 17.5 16C17.5 16.83 16.83 17.5 16 17.5Z" fill="currentColor"/>
            </svg>`, 
      link: "xyzP2P.html" 
    },
    { 
      name: "Profile", 
      icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>`, 
      link: "xyzProfile.html" 
    }
  ];

  // Create container div
  const navContainer = document.createElement('div');
  navContainer.className = 'futuristic-nav';
  
  // Add styles (same as before)
  const style = document.createElement('style');
  style.textContent = `
    .futuristic-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(10px);
      padding: 12px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      position: fixed;
      bottom: 0;
      width: 100%;
      left:-1%;
      z-index: 1000;
      box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
    }
       .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      text-decoration: none;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .nav-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(56, 182, 255, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .nav-item:hover {
      color: #e2e8f0;
      transform: translateY(-3px);
    }
    
    .nav-item:hover::before {
      opacity: 1;
    }
    
    .nav-item.active {
      color: #38bdf8;
    }
    
    .nav-item.active svg {
      filter: drop-shadow(0 0 5px rgba(56, 182, 255, 0.7));
    }
    
    .nav-item svg {
      width: 22px;
      height: 22px;
      margin-bottom: 4px;
      transition: all 0.3s ease;
    }
    
    .nav-item:hover svg {
      transform: scale(1.1);
    }
    
    @media (max-width: 480px) {
      .futuristic-nav {
        padding: 10px 0;
      }
      .nav-item {
        padding: 6px 8px;
        font-size: 10px;
      }
      .nav-item svg {
        width: 18px;
        height: 18px;
      }
  `;
  document.head.appendChild(style);

  // Create each nav item
  navItems.forEach(item => {
    const navItem = document.createElement('a');
    navItem.className = 'nav-item';
    navItem.href = item.link;
    navItem.innerHTML = item.icon + `<span>${item.name}</span>`;
    
    // Add click event with redirection
    navItem.addEventListener('click', function(e) {
      // For smooth animation before redirect
      e.preventDefault();
      
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
      
      // Redirect after animation completes (300ms)
      setTimeout(() => {
        window.location.href = this.href;
      }, 300);
    });
    
    navContainer.appendChild(navItem);
  });

  // Add to body
  document.body.appendChild(navContainer);
  
  }

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', createFuturisticNav);


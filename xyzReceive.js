import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
        import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
        import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
        
        // Firebase config
        const firebaseConfig = {
            apiKey: "AIzaSyDIwoUIMJrJQeLBD9vijsfIUXG9BgaGSPs",
            authDomain: "miner-zyx.firebaseapp.com",
            projectId: "miner-zyx",
            storageBucket: "miner-zyx.firebasestorage.app",
            messagingSenderId: "430019680448",
            appId: "1:430019680448:web:d066b8aaf4355907e1b525",
            measurementId: "G-V6SDWYH6M2"
        };
        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        
        // DOM elements
        const xyzAddressEl = document.getElementById('xyzAddress');
        const solanaAddressEl = document.getElementById('solanaAddress');
        const copyXyzBtn = document.getElementById('copyXyz');
        const copySolanaBtn = document.getElementById('copySolana');
        const verifyBtn = document.getElementById('verifyBtn');
        const notificationEl = document.getElementById('notification');
        
        // Replace with your actual Solana address
        const SOLANA_ADDRESS = "99R4aBwwjXxeT9ukG2o1ppGE7GFEPqAWt94MvHhxoxgf";
        solanaAddressEl.textContent = SOLANA_ADDRESS;
        
        // Show notification
        function showNotification(message) {
            notificationEl.textContent = message;
            notificationEl.classList.add('show');
            
            setTimeout(() => {
                notificationEl.classList.remove('show');
            }, 3000);
        }
        
        // Copy to clipboard
        function copyToClipboard(text, message) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification(message);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy address');
            });
        }
        
        // Check local storage and fetch XYZ address
        async function fetchXyzAddress() {
            const email = localStorage.getItem('xyzEmailAccess');
            const uid = localStorage.getItem('xyzUidAccess');
            
            if (!email || !uid) {
                xyzAddressEl.textContent = "No XYZ address found";
                xyzAddressEl.style.color = "var(--error-red)";
                return;
            }
            
            try {
                const docRef = doc(db, "documentXYZ", uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // Verify email matches
                    if (data.email === email) {
                        xyzAddressEl.textContent = data.xyzAddress || "No XYZ address found";
                    } else {
                        xyzAddressEl.textContent = "Error: Email mismatch";
                        xyzAddressEl.style.color = "var(--error-red)";
                    }
                } else {
                    xyzAddressEl.textContent = "Error: No document found";
                    xyzAddressEl.style.color = "var(--error-red)";
                }
            } catch (error) {
                console.error("Error fetching document: ", error);
                xyzAddressEl.textContent = "Error loading address";
                xyzAddressEl.style.color = "var(--error-red)";
            }
        }
        
        // Event listeners
        copyXyzBtn.addEventListener('click', () => {
            const address = xyzAddressEl.textContent;
            if (address && !address.includes("Error") && !address.includes("Loading")) {
                copyToClipboard(address, "XYZ Deposit Address copied");
            }
        });
        
        copySolanaBtn.addEventListener('click', () => {
            copyToClipboard(SOLANA_ADDRESS, "Solana Deposit Address copied. After you made transaction don't forget to verify transaction below.");
        });
        
        verifyBtn.addEventListener('click', () => {
            // Redirect to verification page
            window.location.href = "xyzTransactionVerify.html"; // Update with your actual verification URL
        });
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            fetchXyzAddress();
        });
        const email = localStorage.getItem("xyzEmailAccess");
const uid = localStorage.getItem("xyzUidAccess");

// Redirect to login if either email or UID is missing
if (!email || !uid) {
  window.location.href = "tryn.html"; // Replace with your login URL
}
   
   // FAQ Toggle Functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        faqItem.classList.toggle('active');
        
        // Close other open FAQs
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
            }
        });
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const faqButton = document.getElementById("xyzFaqButton");
    const faqContainer = document.querySelector(".faq-container");

    if (faqButton && faqContainer) {
        faqButton.addEventListener("mouseenter", () => {
            faqContainer.scrollIntoView({ behavior: "smooth" });
        });
    }
});

function forceMobileView() {
  // Set mobile viewport settings
  const viewportMeta = document.querySelector('meta[name="viewport"]') || 
                      document.createElement('meta');
  viewportMeta.name = 'viewport';
  viewportMeta.content = 'width=device-width, initial-scale=1.0';
  document.head.appendChild(viewportMeta);

  // Only proceed if we're on desktop
  if (window.innerWidth > 768) {
    // Create mobile container if it doesn't exist
    let mobileContainer = document.getElementById('mobile-container');
    if (!mobileContainer) {
      mobileContainer = document.createElement('div');
      mobileContainer.id = 'mobile-container';
      document.body.appendChild(mobileContainer);
      
      // Move all non-fixed elements into container
      const bodyChildren = Array.from(document.body.children);
      for (const child of bodyChildren) {
        // Skip elements that should stay fixed (like FAQ button)
        if (child.id !== 'mobile-container' && 
            !child.classList.contains('floating-faq-button') &&
            child.id !== 'xyzFaqModal' &&
            child.id !== 'particles') {
          mobileContainer.appendChild(child);
        }
      }
    }

    // Style the mobile container
    mobileContainer.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 414px;
      margin: 0 auto;
      overflow-x: hidden;
      background-color: transparent;
    `;

    // Style body for desktop view
    document.body.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 20px;
      background: #f5f5f5;
    `;
  } else {
    // Remove mobile container if it exists and we're on mobile
    const mobileContainer = document.getElementById('mobile-container');
    if (mobileContainer) {
      while (mobileContainer.firstChild) {
        document.body.insertBefore(mobileContainer.firstChild, mobileContainer);
      }
      document.body.removeChild(mobileContainer);
      document.body.style.cssText = '';
    }
  }
}

// Initialize and update on resize
document.addEventListener('DOMContentLoaded', forceMobileView);
window.addEventListener('resize', forceMobileView);
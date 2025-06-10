import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
    import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

    // Create floating particles
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      const particleCount = 30;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random size between 1px and 3px
        const size = Math.random() * 2 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        
        // Random animation duration and delay
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
        
        particlesContainer.appendChild(particle);
      }
    }
    
    // Show status message
    function showStatus(message, type) {
      const statusElement = document.getElementById('statusMessage');
      statusElement.textContent = message;
      statusElement.className = `status ${type}`;
      
      // Auto-hide after 5 seconds
      if (type !== 'error') {
        setTimeout(() => {
          statusElement.className = 'status';
        }, 5000);
      }
    }
    
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyDIwoUIMJrJQeLBD9vijsfIUXG9BgaGSPs",
      authDomain: "miner-zyx.firebaseapp.com",
      projectId: "miner-zyx",
      storageBucket: "miner-zyx.appspot.com",
      messagingSenderId: "430019680448",
      appId: "1:430019680448:web:d066b8aaf4355907e1b525",
      measurementId: "G-V6SDWYH6M2"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=ffa4267c-d28d-4bce-baf4-6cca12c26952";
    const RECEIVER = "G3pqBoPrdS72ZYrD5umgsuMWx3sUhsCsmuC8PWgjxoLW";

    const uid = localStorage.getItem("xyzUidAccess");
    const email = localStorage.getItem("xyzEmailAccess");

    const registeredWalletSpan = document.getElementById("registeredWallet");
    const modal = document.getElementById("modal");
    const walletInput = document.getElementById("walletInput");
    const confirmWallet = document.getElementById("confirmWallet");
    const verifyButton = document.getElementById("verifyButton");
    const verifySpinner = document.getElementById("verifySpinner");
    const confirmSpinner = document.getElementById("confirmSpinner");

    // Create particles on load
    createParticles();
    
    // Initialize with fade-in animation
    document.body.style.opacity = 0;
    setTimeout(() => {
      document.body.style.transition = 'opacity 0.8s ease';
      document.body.style.opacity = 1;
    }, 100);

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          showStatus("Failed to initialize session. Please refresh.", "error");
          console.error("Authentication error:", error);
        }
        return;
      }

      const userRef = doc(db, "documentXYZ", uid);
      
      try {
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          showStatus("User account not found in database.", "error");
          return;
        }

        const data = userSnap.data();
        if (data.xyzSolAddress) {
          registeredWalletSpan.textContent = data.xyzSolAddress;
          showStatus("Wallet address loaded successfully.", "success");
        } else {
          // Show modal with animation
          modal.classList.add('show');
        }
      } catch (error) {
        showStatus("Error loading wallet information.", "error");
        console.error("Database error:", error);
      }
    });

    confirmWallet.addEventListener("click", async () => {
      const newAddress = walletInput.value.trim();
      if (!newAddress) {
        showStatus("Please enter a Solana wallet address.", "error");
        return;
      }

      // Basic validation for Solana address length
      if (newAddress.length < 32 || newAddress.length > 44) {
        showStatus("This doesn't look like a valid Solana address.", "error");
        return;
      }

      const confirm = window.confirm(`Please confirm this is your correct Solana wallet address:\n\n${newAddress}\n\nYou will NOT be able to change it after confirmation.`);
      if (!confirm) return;

      confirmSpinner.classList.add('active');
      confirmWallet.disabled = true;
      
      try {
        const userRef = doc(db, "documentXYZ", uid);
        await updateDoc(userRef, { xyzSolAddress: newAddress });
        
        registeredWalletSpan.textContent = newAddress;
        showStatus("Wallet address registered successfully!", "success");
        
        // Hide modal with animation
        modal.classList.remove('show');
        setTimeout(() => {
          modal.style.display = 'none';
        }, 300);
      } catch (error) {
        showStatus("Failed to save wallet address. Please try again.", "error");
        console.error("Update error:", error);
      } finally {
        confirmSpinner.classList.remove('active');
        confirmWallet.disabled = false;
      }
    });

    verifyButton.addEventListener("click", async () => {
      verifySpinner.classList.add('active');
      verifyButton.disabled = true;
      
      try {
        const userRef = doc(db, "documentXYZ", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          showStatus("User account not found.", "error");
          return;
        }
        
        const data = userSnap.data();
        const userWallet = data.xyzSolAddress;
        
        if (!userWallet) {
          showStatus("No wallet registered. Please register first.", "error");
          return;
        }

        showStatus("Scanning blockchain for transactions...", "warning");
        
        const txListRes = await fetch(HELIUS_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "tx-list",
            method: "getSignaturesForAddress",
            params: [userWallet, { limit: 10 }]
          })
        });

        const txList = await txListRes.json();
        const recentTxs = txList.result;
        
        if (!recentTxs || recentTxs.length === 0) {
          showStatus("No recent transactions found for this wallet.", "warning");
          return;
        }

        let foundNew = false;

        for (const tx of recentTxs) {
          const txHash = tx.signature;
          const existing = await getDoc(doc(db, "xyzSolDeposit", txHash));
          
          if (existing.exists()) continue;

          const txDetailRes = await fetch(HELIUS_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "tx-details",
              method: "getTransaction",
              params: [txHash, { encoding: "jsonParsed", commitment: "confirmed" }]
            })
          });

          const txDetails = await txDetailRes.json();
          const instructions = txDetails?.result?.transaction?.message?.instructions || [];

          for (const ix of instructions) {
            const parsed = ix.parsed;
            if (parsed?.type === "transfer" && parsed.info.destination === RECEIVER) {
              const amount = parseFloat(parsed.info.lamports) / 1e9;

              await setDoc(doc(db, "xyzSolDeposit", txHash), {
                amount,
                email,
                uid,
                timestamp: new Date()
              });

              const previous = data.solBalance || 0;
              await updateDoc(userRef, { solBalance: previous + amount });

              showStatus(`✅ Success! ${amount} SOL deposit verified and added to your account.`, "success");
              foundNew = true;
              break;
            }
          }
        }

        if (!foundNew) {
          showStatus("No new SOL deposits found in recent transactions.", "warning");
        }
      } catch (error) {
        showStatus("Error verifying transactions. Please try again.", "error");
        console.error("Verification error:", error);
      } finally {
        verifySpinner.classList.remove('active');
        verifyButton.disabled = false;
      }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => {
          modal.style.display = 'none';
        }, 300);
      }
    });
    
    
// Redirect to login if either email or UID is missing
if (!email || !uid) {
  window.location.href = "tryn.html"; // Replace with your login URL
}

// FAQ Modal Functionality
const faqModal = document.getElementById("xyzFaqModal");
const faqButton = document.getElementById("xyzFaqButton");
const faqCloseBtn = document.getElementById("xyzFaqClose");

function openFaqModal() {
    faqModal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeFaqModal() {
    faqModal.style.display = "none";
    document.body.style.overflow = "auto";
}

faqButton.onclick = openFaqModal;
faqCloseBtn.onclick = closeFaqModal;

window.onclick = function(event) {
    if (event.target == faqModal) {
        closeFaqModal();
    }
}

// FAQ Toggle Functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        faqItem.classList.toggle('active');
        
        // Close other open FAQs
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem && item.classList.contains('active')) {
                item.classList.remove('active');
            }
        });
    });
});

// Close modal when pressing Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeFaqModal();
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

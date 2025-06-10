import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";  
        import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";  
        import { 
            getFirestore, 
            doc, 
            setDoc, 
            getDoc, 
            serverTimestamp, 
            updateDoc, 
            increment,
            collection,
            addDoc
        } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";  
          
        // Firebase configuration  
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
          
        // Constants
        const XYZ_RATE_PER_24H = 0.1; // 0.1 XYZ per 24 hours
const XYZ_RATE_PER_SECOND = XYZ_RATE_PER_24H / (24 * 3600); // Calculate per second rate
const MINUTE_INTERVAL = 60000; // 60 seconds in milliseconds
const SECOND_INTERVAL = 1000; // Update every second  
        const DAILY_PAYOUT_HOUR = 23; // 11 PM  
        const DAILY_PAYOUT_MINUTE = 59; // 59 minutes  
        const GAS_FEE = 0.00005; // SOL gas fee for transfers
          
        // Miner variables  
        let miningInterval;  
        let minuteInterval;
        let secondsMined = 0;  
        let xyzEmailAccess = localStorage.getItem('xyzEmailAccess');  
        let xyzUidAccess = localStorage.getItem('xyzUidAccess');  
        let isUserOnline = navigator.onLine;  
        let pendingXYZ = 0; // Track XYZ earned but not yet saved to Firestore
        let lastFirestorePending = 0; // Last value saved to Firestore
          
        // DOM Elements  
        const xyzAddressEl = document.getElementById('xyzAddress');  
        const xyzBalanceEl = document.getElementById('xyzBalance');  
        const solBalanceEl = document.getElementById('solBalance');  
        const xyzMinedEl = document.getElementById('xyzMined');  
        const xyzMinePendingEl = document.getElementById('xyzMinePending');  
        const minedPerSecondEl = document.getElementById('minedPerSecond');  
        const nextPayoutTimeEl = document.getElementById('nextPayoutTime');  
        const connectionStatusEl = document.getElementById('connectionStatus');  
        const lastUpdatedEl = document.getElementById('lastUpdated');  
        const solNotificationEl = document.getElementById('solNotification');
          
        // Initialize miner  
        document.addEventListener('DOMContentLoaded', async () => {  
            if (!xyzEmailAccess || !xyzUidAccess) {  
                showError('User not authenticated. Please log in.');  
                return;  
            }  
              
            await initializeUserDocument();  
            updateConnectionStatus();  
            updateNextPayoutTime();  
              
                         
            if (isUserOnline) {  
                startMining();  
            }  
        });  
        
          
        async function initializeUserDocument() {  
            const userDocRef = doc(db, 'documentXYZ', xyzUidAccess);  
            const userDocSnap = await getDoc(userDocRef);  
              
            if (!userDocSnap.exists()) {  
                // Create new document with all required fields  
                await setDoc(userDocRef, {  
                    email: xyzEmailAccess,  
                    xyzAddress: '',  
                    xyzBalance: 0,  
                    solBalance: 0,  
                    xyzMined: 0,  
                    xyzMinePending: 0,  
                    lastPayoutTime: null,  
                    onlineActivityTime: serverTimestamp()  
                });  
            } else {  
                // Ensure all required fields exist  
                const userData = userDocSnap.data();  
                const updates = {};  
                  
                if (typeof userData.xyzMined !== 'number') updates.xyzMined = 0;  
                if (typeof userData.xyzMinePending !== 'number') updates.xyzMinePending = 0;  
                if (typeof userData.xyzBalance !== 'number') updates.xyzBalance = 0;  
                if (typeof userData.solBalance !== 'number') updates.solBalance = 0;  
                if (!userData.lastPayoutTime) updates.lastPayoutTime = null;  
                  
                if (Object.keys(updates).length > 0) {  
                    await updateDoc(userDocRef, updates);  
                }  
                  
                // Initialize pendingXYZ with current Firestore value
                pendingXYZ = userData.xyzMinePending || 0;
                lastFirestorePending = pendingXYZ;
                updatePendingDisplay();
                  
                // Check for pending payout  
                await checkAndProcessPendingXYZ(userData);  
                  
                updateDashboard(userData);  
            }  
        }  
          
        function handleConnectionChange() {  
            isUserOnline = navigator.onLine;  
            updateConnectionStatus();  
              
            if (isUserOnline) {  
                startMining();  
                // Sync pending balance when coming back online
                syncPendingXYZ(); 
            } else {  
                stopMining();  
            }  
        }  
          
        function startMining() {  
            if (miningInterval) clearInterval(miningInterval);  
            if (minuteInterval) clearInterval(minuteInterval);
              
            connectionStatusEl.textContent = 'Online - Mining active';  
            connectionStatusEl.className = 'connection-status online';  
              
            // Update mining every second
            miningInterval = setInterval(() => {  
                pendingXYZ += XYZ_RATE_PER_SECOND;
                updatePendingDisplay();
                updateLastUpdated();  
            }, SECOND_INTERVAL);  
            
            // Save to Firestore every minute
            minuteInterval = setInterval(async () => {
                await syncPendingXYZ();
            }, MINUTE_INTERVAL);
        }  
          
        async function syncPendingXYZ() {
            if (pendingXYZ <= lastFirestorePending) return;
            
            const xyzToAdd = pendingXYZ - lastFirestorePending;
            
            try {  
                const userDocRef = doc(db, 'documentXYZ', xyzUidAccess);  
                await updateDoc(userDocRef, {  
                    xyzMinePending: increment(xyzToAdd),  
                    onlineActivityTime: serverTimestamp()  
                });  
                  
                lastFirestorePending = pendingXYZ;
                const userDocSnap = await getDoc(userDocRef);  
                updateDashboard(userDocSnap.data());  
            } catch (error) {  
                console.error('Error updating pending XYZ:', error);  
            }  
        }
          
        function stopMining() {  
            if (miningInterval) {  
                clearInterval(miningInterval);  
                miningInterval = null;  
            }  
            if (minuteInterval) {
                clearInterval(minuteInterval);
                minuteInterval = null;
            }
              
            connectionStatusEl.textContent = 'Offline - Mining paused';  
            connectionStatusEl.className = 'connection-status offline';  
        }  
          
        function updatePendingDisplay() {
            xyzMinePendingEl.textContent = formatNumber(pendingXYZ);
            minedPerSecondEl.textContent = XYZ_RATE_PER_SECOND.toFixed(8);
        }
          
        async function checkAndProcessPendingXYZ(userData) {  
            const now = new Date();  
            const lastPayout = userData.lastPayoutTime?.toDate() || new Date(0);  
              
            if (shouldProcessPayout(lastPayout)) {  
                await processDailyPayout();  
            }  
        }  
        window.addEventListener('offline', () => {
    stopMining();
});

// Monitor connection changes
window.addEventListener('offline', () => {
    stopMining();
});

window.addEventListener('online', () => {
    // Refresh the page to resume everything cleanly
    location.reload(); 
});

// Check connection at startup
if (!navigator.onLine) {
    stopMining();
} else {
    startMining(); // only if you want to auto-start mining on page load
}
          
        async function processDailyPayout() {  
            const userDocRef = doc(db, 'documentXYZ', xyzUidAccess);  
            const userDocSnap = await getDoc(userDocRef);  
            const userData = userDocSnap.data();  
              
            if (userData.xyzMinePending > 0) {
                // Check if user has enough SOL for gas fee
                if (userData.solBalance < GAS_FEE) {
                    showSolNotification("Deposit Solana to transfer mined XYZ to your account");
                    return;
                }
                
                try {
                    // Create transaction record first
                    const txData = {
                        address: userData.xyzAddress || 'Not set',
                        amount: userData.xyzMinePending,
                        from: 'xyzMining-shA-xyzQuant.block',
                        gasFee: GAS_FEE,
                        receiverEmail: userData.email,
                        senderEmail: 'satoshi-shA-xyzQuant.block',
                        status: 'completed',
                        to: userData.xyzAddress || 'Not set',
                        transactionType: 'Transferred',
                        timestamp: serverTimestamp()
                    };
                    
                    // Add to Blockchain collection
                    await addDoc(collection(db, 'Blockchain'), txData);
                    
                    // Process the transfer with gas fee deduction
                    await updateDoc(userDocRef, {  
                        xyzMined: increment(userData.xyzMinePending),  
                        xyzBalance: increment(userData.xyzMinePending),  
                        xyzMinePending: 0,  
                        solBalance: increment(-GAS_FEE),
                        lastPayoutTime: serverTimestamp(),  
                        onlineActivityTime: serverTimestamp()  
                    });  
                      
                    // Reset local pending tracking
                    pendingXYZ = 0;
                    lastFirestorePending = 0;
                    updatePendingDisplay();
                      
                    const updatedDoc = await getDoc(userDocRef);  
                    updateDashboard(updatedDoc.data());
                    
                } catch (error) {
                    console.error('Transfer failed:', error);
                    // Record failed transaction
                    const txData = {
                        address: userData.xyzAddress || 'Not set',
                        amount: userData.xyzMinePending,
                        from: 'xyzMining-shA-xyzQuant.block',
                        gasFee: GAS_FEE,
                        receiverEmail: userData.email,
                        senderEmail: 'satoshi-shA-xyzQuant.block',
                        status: 'failed',
                        to: userData.xyzAddress || 'Not set',
                        transactionType: 'Transferred',
                        timestamp: serverTimestamp(),
                        error: error.message
                    };
                    await addDoc(collection(db, 'Blockchain'), txData);
                    
                    showSolNotification("Transfer failed. Please try again later.");
                }
                try {
  console.log('Attempting to add transaction to Blockchain:', txData);
  await addDoc(collection(db, 'Blockchain'), txData);
  console.log('Transaction added successfully.');
} catch (error) {
  console.error('Failed to add transaction:', error);
}
            }  
        }
        
        function showSolNotification(message) {
            solNotificationEl.textContent = message;
            solNotificationEl.style.display = 'block';
            setTimeout(() => {
                solNotificationEl.style.display = 'none';
            }, 5000);
        }
          
        function isPayoutTime() {  
            const now = new Date();  
            const pstTime = new Date(now.getTime() - 8 * 3600 * 1000); // Convert to PST  
            return pstTime.getHours() === DAILY_PAYOUT_HOUR &&   
                   pstTime.getMinutes() === DAILY_PAYOUT_MINUTE;  
        }  
          
        function shouldProcessPayout(lastPayout) {  
            const now = new Date();  
            const pstNow = new Date(now.getTime() - 8 * 3600 * 1000);  
            const pstLastPayout = new Date(lastPayout.getTime() - 8 * 3600 * 1000);  
              
            // Check if we've crossed the payout time (different calendar day in PST)  
            return pstNow.getDate() !== pstLastPayout.getDate() ||  
                   pstNow.getMonth() !== pstLastPayout.getMonth() ||  
                   pstNow.getFullYear() !== pstLastPayout.getFullYear();  
        }  
          
        function updateDashboard(userData) {  
            xyzAddressEl.textContent = userData.xyzAddress || '-';  
            xyzBalanceEl.textContent = formatNumber(userData.xyzBalance);  
            solBalanceEl.textContent = formatNumber(userData.solBalance);  
            xyzMinedEl.textContent = formatNumber(userData.xyzMined);  
            // xyzMinePending is updated separately via updatePendingDisplay()
        }  
          
        function updateConnectionStatus() {  
            if (isUserOnline) {  
                connectionStatusEl.textContent = 'Online - Mining active';  
                connectionStatusEl.className = 'connection-status online';  
            } else {  
                connectionStatusEl.textContent = 'Offline - Mining paused';  
                connectionStatusEl.className = 'connection-status offline';  
            }  
        }  
          
        function updateLastUpdated() {  
            lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;  
        }  
        
          
        function updateNextPayoutTime() {  
            const now = new Date();  
            const pstTime = new Date(now.getTime() - 8 * 3600 * 1000);  
              
            // Calculate next payout time (11:59 PM PST)  
            const nextPayout = new Date(pstTime);  
            nextPayout.setHours(DAILY_PAYOUT_HOUR, DAILY_PAYOUT_MINUTE, 0, 0);  
              
            if (pstTime >= nextPayout) {  
                nextPayout.setDate(nextPayout.getDate() + 1);  
            }  
              
            // Convert back to local time  
            const localPayout = new Date(nextPayout.getTime() + 8 * 3600 * 1000);  
              
            nextPayoutTimeEl.textContent = localPayout.toLocaleString([], {  
                month: 'short',  
                day: 'numeric',  
                hour: '2-digit',  
                minute: '2-digit',  
                hour12: true  
            });  
        }  
          
        function formatNumber(num) {  
            return parseFloat(num).toFixed(6).replace(/\.?0+$/, '');  
        }  
          
        function showError(message) {  
            connectionStatusEl.textContent = message;  
            connectionStatusEl.className = 'connection-status offline';  
        }  
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
      margin-top:20%;
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



async function checkWalletAndSolBalance() {
  const uid = localStorage.getItem("xyzUidAccess");
  if (!uid) return;

  const docRef = doc(db, "documentXYZ", uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  const data = docSnap.data();
  const solAddress = data.xyzSolAddress || "";
  const solBalance = data.solBalance || 0;

  if (!solAddress) {
    showModal({
      title: "🪙 No Solana Wallet Bound",
      message: "You don't have a wallet. Bind and deposit at least ≥$5 SOL to start mining and transactions. Make sure you don't lose your wallet because we will reflect and refund all your deposits to your registered Solana wallet address. We will also add something on TGE.",
      buttonText: "Go to Bind & Deposit",
      redirectUrl: "xyzTransactionsVerify.html" 
    });
  } else if (solBalance === 0) {
    showModal({
      title: "⚠️ No SOL Balance",
      message: "You have a registered Solana wallet but no SOL. Please deposit SOL to begin mining and sending.",
      buttonText: "Go to Deposit",
      redirectUrl: "xyzReceive.html" 
    });
  } else if (solBalance < 5) {
    showModal({
      title: "⚠️ Insufficient SOL",
      message: "You have less than $5 in SOL. Deposit more to start mining and transactions.",
      buttonText: "Deposit Now",
      redirectUrl: "xyzReceive.html" 
    });
  }
}

// Reusable modal function with redirection
function showModal({ title, message, buttonText, redirectUrl }) {
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:#0008; display:flex; align-items:center; justify-content:center; z-index:10000;">
      <div style="background:#fff; padding:20px; border-radius:12px; max-width:400px; text-align:center; position:relative;">
        <button id="closeModalBtn" style="position:absolute; top:10px; right:10px; background:#ccc; border:none; border-radius:50%; width:24px; height:24px; font-weight:bold;">×</button>
        <h3 style="color:black ; margin-bottom:10px;">${title}</h3>
        <p style="color:black; font-size:15px; margin-bottom:20px;">${message}</p>
        <button id="modalActionBtn" style="padding:10px 18px; border:none; background:#4f46e5; color:white; border-radius:6px;">${buttonText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("modalActionBtn").onclick = () => {
    modal.remove();
    if (redirectUrl) window.location.href = redirectUrl;
  };
  document.getElementById("closeModalBtn").onclick = () => {
    modal.remove();
  };
}

// 🔁 Call on page load
checkWalletAndSolBalance();

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

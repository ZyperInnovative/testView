import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
    import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
    import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
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

    const XYZ_PRICE = 5.00;

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth();

    // Fetch real-time Solana price from CoinGecko
    async function getSolanaPrice() {
        try {
            const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
            const data = await response.json();
            return data.solana.usd;
        } catch (error) {
            console.error("Failed to fetch Solana price:", error);
            return 0;
        }
    }
    
    // Fetch real-time Bitcoin price from CoinGecko
    async function getBitcoinPrice() {
        try {
            const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
            const data = await response.json();
            return data.bitcoin.usd;
        } catch (error) {
            console.error("Failed to fetch Bitcoin price:", error);
            return 0;
        }
    }
    
   
// Helper to format price (e.g. 100000 => 100K, 0.93820 => 0.93)
function formatPrice(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + "M";
    if (value >= 1000) return (value / 1000).toFixed(0) + "K";
    return value.toFixed(2);
}

// Update the dashboard with user and price data
async function updateDashboard() {
    const xyzEmail = localStorage.getItem("xyzEmailAccess");
    const xyzUid = localStorage.getItem("xyzUidAccess");

    if (xyzEmail && xyzUid) {
        try {
            const solPrice = await getSolanaPrice();
            document.getElementById("solana-price").innerText = `$${formatPrice(solPrice)}`;
            
            const btcPrice = await getBitcoinPrice();
            document.getElementById("bitcoin-price").innerText = `$${formatPrice(btcPrice)}`;
            
            const userDocRef = doc(db, "documentXYZ", xyzUid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                const xyzBalance = userData.xyzBalance || 0;
                const solBalance = userData.solBalance || 0;
                const btcBalance = userData.btcBalance || 0;
                
                const xyzValue = xyzBalance * XYZ_PRICE;
                const solValue = solBalance * solPrice;
                const btcValue = btcBalance * btcPrice;   
                const totalBalance = xyzValue + solValue;

                document.getElementById("dashboard-balance").innerText = `$${formatPrice(totalBalance)}`;
                document.getElementById("xyz-balance").innerText = formatPrice(xyzBalance);
                document.getElementById("xyz-value").innerText = `$${formatPrice(xyzValue)}`;
                document.getElementById("solana-balance").innerText = formatPrice(solBalance);
                document.getElementById("solana-value").innerText = `$${formatPrice(solValue)}`;

                if (userData.xyzTransactions && Array.isArray(userData.xyzTransactions)) {
                    let transactions = [...userData.xyzTransactions];

                    // Sort by oldest to newest
                    transactions.sort((a, b) => a.timestamp - b.timestamp);

                    // If more than 3, remove the oldest one
                    if (transactions.length > 3) {
                        transactions.shift();
                        await updateDoc(userDocRef, {
                            xyzTransactions: transactions
                        });
                    }

                    // Display the 3 most recent (latest first)
                    const latestThree = transactions
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 3);

                    displayRecentTransactions(latestThree); // No formatting for transactions
                }
            } else {
                console.log("No user data found!");
            }
        } catch (error) {
            console.error("Error updating dashboard:", error);
        }
    } else {
        window.location.href = "xyzLogIn.html";
    }
}
    // Call on load
    updateDashboard();

    // Optional: Auto-refresh every 10 seconds
    setInterval(updateDashboard, 10000);
    
    // Display stored email right after page loads
    const storedEmail = localStorage.getItem("xyzEmailAccess");
    if (storedEmail) {
        const emailDiv = document.getElementById("user-email");
        if (emailDiv) {
            emailDiv.innerText = "Email: " + storedEmail;
        }
    }
function maskEmail(email) {
    if (!email) return "";
    const [name, domain] = email.split("@");
    return name[0] + "****@" + domain;
}

// Make toggleDetails globally accessible
window.toggleDetails = function(index, expand) {
    document.getElementById(`compact-${index}`).style.display = expand ? 'none' : 'block';
    document.getElementById(`details-${index}`).style.display = expand ? 'block' : 'none';
};

function displayRecentTransactions(transactions) {
    const sortedTransactions = transactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);

    const container = document.getElementById("transaction-history");
    container.innerHTML = "";

    sortedTransactions.forEach((tx, index) => {
        const { sender, recipient, amount, gasFee, timestamp, status, type } = tx;
        const maskedSender = maskEmail(sender);
        const maskedRecipient = maskEmail(recipient);

        const transactionDiv = document.createElement("div");
        transactionDiv.style.cssText = "font-size:8px; color:black; border: 1px solid #eee; border-radius: 20px; padding: 20px; margin-top: 5px; margin-bottom: 10px; background-color: #f9f9f9;";
        
        transactionDiv.innerHTML = `
            <div id="compact-${index}">
                <p style="color:black; margin: 0 0 5px; font-weight: bold; color: black;">Transaction</p>
                <p><strong>Type:</strong> ${type}</p>
                <p><strong>Amount:</strong> ${amount} XYZ</p>
                <p><strong>Status:</strong> ${status}</p>
                <button onclick="toggleDetails(${index}, true)">Expand</button>
            </div>

            <div id="details-${index}" style="display: none;">
                <p style="margin: 0 0 5px; font-weight: bold; color: black;">Transaction Details</p>
                <p><strong>From (Email):</strong> ${maskedSender}</p>
                <p><strong>To (Email):</strong> ${maskedRecipient}</p>
                <p><strong>Amount:</strong> ${amount} XYZ</p>
                <p><strong>Fee:</strong> ${gasFee} SOL</p>
                <p><strong>Status:</strong> ${status}</p>
                <p><strong>Type:</strong> ${type}</p>
                <p style="font-size: 12px; color: black;">${new Date(timestamp).toLocaleString()}</p>
                <button onclick="toggleDetails(${index}, false)">Collapse</button>
            </div>
        `;

        container.appendChild(transactionDiv);
    });
}
document.addEventListener("DOMContentLoaded", function () {
  const redirectLinks = [
    "xyzSendTransaction.html",
    "xyzReceive.html",
    "xyzP2P.html"
  ];

  const buttons = document.querySelectorAll(".tab-button");

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      window.location.href = redirectLinks[index];
    });
  });
});



   // Add floating particles
    document.addEventListener('DOMContentLoaded', function() {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.width = Math.random() * 3 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        particle.style.animationDuration = Math.random() * 20 + 10 + 's';
        document.body.appendChild(particle);
      }
      
      // Simulate live price updates
      setInterval(() => {
        // Small price fluctuations for realism
        const xyzChange = (Math.random() * 0.12 - 0.03).toFixed(3);
        const newXyzPrice = (1.00 + parseFloat(xyzChange)).toFixed(2);
        document.querySelectorAll('.crypto-row div:nth-child(2)')[1].textContent = `$${newXyzPrice}`;
        
        // Update values based on new price
        const xyzBalance = parseFloat(document.getElementById('xyz-balance').textContent);
        document.getElementById('xyz-value').textContent = `$${(xyzBalance * newXyzPrice).toFixed(2)}`;
      }, 50000);

      // Initialize TradingView widgets
      initTradingViewCharts();
      
      // Set up click handlers for crypto rows
      document.getElementById('xyz-row').addEventListener('click', () => {
        document.getElementById('xyz-chart-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
      
      document.getElementById('sol-row').addEventListener('click', () => {
        document.getElementById('sol-chart-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
      
      document.getElementById('btc-row').addEventListener('click', () => {
        document.getElementById('btc-chart-modal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
      
      // Close modal handlers
      document.querySelectorAll('.close-chart').forEach(button => {
        button.addEventListener('click', function() {
          this.closest('.chart-modal').style.display = 'none';
          document.body.style.overflow = 'auto';
        });
      });
      
      // Close modal when clicking outside chart
      document.querySelectorAll('.chart-modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
          if (e.target === this) {
            this.style.display = 'none';
            document.body.style.overflow = 'auto';
          }
        });
      });
    });
    
    function initTradingViewCharts() {
      // XYZ Chart
      new TradingView.widget({
        "autosize": true,
        "symbol": "BINANCE:XYZUSDT",
        "interval": "15",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#0a0a14",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "xyz-tradingview-chart",
        "studies": ["RSI@tv-basicstudies"]
      });
      
      // SOL Chart
      new TradingView.widget({
        "autosize": true,
        "symbol": "BINANCE:SOLUSDT",
        "interval": "15",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#0a0a14",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "sol-tradingview-chart",
        "studies": ["RSI@tv-basicstudies"]
      });
      
      // BTC Chart
      new TradingView.widget({
        "autosize": true,
        "symbol": "BINANCE:BTCUSDT",
        "interval": "15",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#0a0a14",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "btc-tradingview-chart",
        "studies": ["RSI@tv-basicstudies"]
      });
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
    margin-top:20%;
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
      redirectUrl: "xyzTransactionVerify.html" 
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



import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

let notificationList = [];
let currentNotificationIndex = 0;

async function loadRecentNotifications() {
    const notifRef = collection(db, "XYZnotifications");
    const q = query(notifRef, orderBy("notificationNumber", "desc"), limit(3));
    const querySnapshot = await getDocs(q);

    notificationList = [];

    querySnapshot.forEach(doc => {
        const { title, photoLink } = doc.data();
        notificationList.push({ title, photoLink });
    });

    showNextNotification(); // show first immediately
    setInterval(showNextNotification, 5000); // every 5 seconds
}

function showNextNotification() {
    if (notificationList.length === 0) return;

    const { title, photoLink } = notificationList[currentNotificationIndex];
    const wrapper = document.getElementById("notification-wrapper");
    
    wrapper.innerHTML = `
        <div class="notification-card" onclick="window.location.href='xyzNotifications.html'">
            <img src="${photoLink || 'https://via.placeholder.com/36'}" alt="notification" />
            <div>${title}</div>
        </div>
    `;

    currentNotificationIndex = (currentNotificationIndex + 1) % notificationList.length;
}

// Load on page start
loadRecentNotifications();
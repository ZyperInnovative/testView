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
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const functions = firebase.functions();

    // Transaction data and pagination variables
    let allTransactions = [];
    let currentPage = 1;
    const transactionsPerPage = 20;

    // Function to mask email addresses
    function maskEmail(email) {
        if (!email || !email.includes('@')) return 'unknown@xyz.com';
        
        const [localPart, domain] = email.split('@');
        if (localPart.length <= 4) {
            return localPart.charAt(0) + '***@' + domain;
        }
        
        const firstPart = localPart.substring(0, 3);
        const lastPart = localPart.substring(localPart.length - 1);
        return `${firstPart}...${lastPart}@${domain}`;
    }
     

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const loading = document.getElementById('loading');
        const errorMessage = document.getElementById('error-message');
        const addressResult = document.getElementById('address-result');
        const transactionResult = document.getElementById('transaction-result');
        const allTransactionsContainer = document.getElementById('all-transactions');
        const paginationContainer = document.getElementById('pagination');

        if (!searchInput || !searchBtn) {
            console.error("Missing HTML elements (searchInput/searchBtn)");
            return;
        }

        searchBtn.addEventListener('click', searchBlockchain);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchBlockchain();
        });

        async function searchBlockchain() {
            const query = searchInput.value.trim();
            if (!query) return;

            loading.style.display = 'flex';
            errorMessage.style.display = 'none';
            addressResult.style.display = 'none';
            transactionResult.style.display = 'none';

            try {
                // If input is a hash, check direct match
                const txDoc = await db.collection("blockchain").doc(query).get();
                if (txDoc.exists) {
                    displayTransaction(txDoc);
                    loading.style.display = 'none';
                    return;
                }

                // Search transactions involving the address
                const txsFrom = await db.collection("blockchain")
                    .where("from", "==", query)
                    .get();
                const txsTo = await db.collection("blockchain")
                    .where("to", "==", query)
                    .get();

                const combinedDocs = [...txsFrom.docs, ...txsTo.docs];

                if (combinedDocs.length === 0) {
                    showError();
                    return;
                }

                // Show transaction hashes for results
                const listContainer = document.getElementById('address-result');
                listContainer.innerHTML = `<h3>Transactions for: ${query}</h3>`;
                combinedDocs.forEach(doc => {
                    const txId = doc.id;
                    const item = document.createElement('div');
                    item.textContent = `Transaction Hash: ${txId}`;
                    item.className = 'tx-hash-item';
                    item.style.cursor = 'pointer';
                    item.style.margin = '5px 0';
                    item.addEventListener('click', () => {
                        displayTransaction(doc);
                        const hashElement = document.querySelector('.transaction-hash');
                        if (hashElement) {
                            hashElement.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                    listContainer.appendChild(item);
                });

                listContainer.style.display = 'block';

            } catch (error) {
                console.error("Search error:", error);
                showError();
            } finally {
                loading.style.display = 'none';
            }
        }

        function displayTransaction(txDocSnap) {
            const tx = txDocSnap.data();
            document.getElementById('tx-hash-header').textContent = txDocSnap.id;
            document.getElementById('tx-status').textContent = tx.status || '--';
            document.getElementById('tx-timestamp').textContent = formatTimestamp(tx.timestamp);
            document.getElementById('tx-from').textContent = tx.from || '--';
            document.getElementById('tx-to').textContent = tx.to || '--';
            document.getElementById('tx-amount').textContent = tx.amount ? `${tx.amount} XYZ` : '--';
            document.getElementById('tx-gas').textContent = tx.gasFee ? `${tx.gasFee} SOL`: '--';
            document.getElementById('tx-type').textContent = tx.transactionType?.toUpperCase() || '--';
            
             // Display masked emails
            document.getElementById('tx-sender-email').textContent = tx.senderEmail ? maskEmail(tx.senderEmail) : '--';
            document.getElementById('tx-receiver-email').textContent = tx.receiverEmail ? maskEmail(tx.receiverEmail) : '--';
            
            transactionResult.style.display = 'block';
        }

        function displayAddress(address, userData) {
            document.getElementById('address-header').textContent = address;
            document.getElementById('xyz-balance').textContent = `${userData.xyzBalance || 0} XYZ`;
            document.getElementById('sol-balance').textContent = `${userData.solBalance || 0} SOL`;
            addressResult.style.display = 'block';
        }

        async function displayAddressTransactions(address) {
            const container = document.getElementById('address-transactions');
            container.innerHTML = '';
            const txs = await db.collection("blockchain")
                                .where("from", "==", address)
                                .orderBy("timestamp", "desc")
                                .get();
            
            if (txs.empty) {
                container.innerHTML = '<p>No transactions found for this address.</p>';
                return;
            }
            
            txs.forEach(doc => {
                const tx = doc.data();
                addTransactionToContainer(doc, container);
            });
        }

        async function loadAllTransactions() {
            try {
                const querySnapshot = await db.collection("blockchain")
                                             .orderBy("timestamp", "desc")
                                             .get();
                
                allTransactions = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                updateTransactionsDisplay();
                updatePagination();
            } catch (err) {
                console.error("Error loading transactions:", err);
                allTransactionsContainer.innerHTML = '<p>Error loading transactions. Please try again later.</p>';
            }
        }

        function updateTransactionsDisplay() {
            allTransactionsContainer.innerHTML = '';
            
            const startIndex = (currentPage - 1) * transactionsPerPage;
            const endIndex = startIndex + transactionsPerPage;
            const transactionsToShow = allTransactions.slice(startIndex, endIndex);
            
            if (transactionsToShow.length === 0) {
                allTransactionsContainer.innerHTML = '<p>No transactions found.</p>';
                return;
            }
            
            transactionsToShow.forEach(tx => {
                const div = document.createElement('div');
                div.className = 'transaction-item';
                
                const typeClass = tx.transactionType === 'sent' ? 'sent' : 'received';
                
                div.innerHTML = `
                    <div class="transaction-row">
                        <div class="transaction-data-item">
                            <span class="transaction-data-label">Status:</span>
                            <span class="transaction-data-value">${tx.status || '--'}</span>
                        </div>
                        <div class="transaction-data-item">
                            <span class="transaction-data-label">Time:</span>
                            <span class="transaction-data-value">${formatTimestamp(tx.timestamp)}</span>
                        </div>
                        <div class="transaction-data-item">
                            <span class="transaction-data-label">${tx.transactionType === 'sent' ? 'To:' : 'From:'}</span>
                            <span class="transaction-data-value">${tx.transactionType === 'sent' ? (tx.to || '--') : (tx.from || '--')}</span>
                        </div>
                        <div class="transaction-data-item">
                            <span class="transaction-data-label">Amount:</span>
                            <span class="transaction-data-value">${tx.amount || '--'} XYZ</span>
                        </div>
                        <div class="transaction-type ${typeClass}">${tx.transactionType?.toUpperCase() || '--'}</div>
                    </div>
                    <div class="transaction-hash-container">
                        <span class="transaction-hash-label">Hash:</span>
                        <span class="transaction-hash">${tx.id}</span>
                    </div>
                    ${tx.senderEmail || tx.receiverEmail ? `
                    <div class="transaction-data-item">
                                                ` : ''}
                `;
                
                div.addEventListener('click', async () => {
                    searchInput.value = tx.id;
                    await searchBlockchain(); // wait for transaction to load

                    const hashElement = document.querySelector('.transaction-hash');
                    if (hashElement) {
                        hashElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
                
                allTransactionsContainer.appendChild(div);
            });
        }

        function updatePagination() {
            paginationContainer.innerHTML = '';
            
            const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
            
            // Add Previous button
            if (currentPage > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'page-btn';
                prevBtn.textContent = 'Previous';
                prevBtn.addEventListener('click', () => {
                    currentPage--;
                    updateTransactionsDisplay();
                    updatePagination();
                    window.scrollTo({ top: allTransactionsContainer.offsetTop, behavior: 'smooth' });
                });
                paginationContainer.appendChild(prevBtn);
            }

            // Display page numbers
            let startPage = Math.max(1, currentPage - 1);
            let endPage = Math.min(totalPages, currentPage + 1);

            if (currentPage === 1) {
                endPage = Math.min(totalPages, 3);
            } else if (currentPage === totalPages) {
                startPage = Math.max(1, totalPages - 2);
            }

            for (let i = startPage; i <= endPage; i++) {
                addPageButton(i);
            }
            
            // Add Next button
            if (currentPage < totalPages) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'page-btn';
                nextBtn.textContent = 'Next';
                nextBtn.addEventListener('click', () => {
                    currentPage++;
                    updateTransactionsDisplay();
                    updatePagination();
                    window.scrollTo({ top: allTransactionsContainer.offsetTop, behavior: 'smooth' });
                });
                paginationContainer.appendChild(nextBtn);
            }
        }

        function addPageButton(pageNumber) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${pageNumber === currentPage ? 'active' : ''}`;
            pageBtn.textContent = pageNumber;
            pageBtn.addEventListener('click', () => {
                currentPage = pageNumber;
                updateTransactionsDisplay();
                updatePagination();
                window.scrollTo({ top: allTransactionsContainer.offsetTop, behavior: 'smooth' });
            });
            paginationContainer.appendChild(pageBtn);
        }
        async function loadNetworkStats() {
            try {
                const snapshot = await db.collection("blockchain").get();
                document.getElementById('total-tx').textContent = snapshot.size;
                const addressSet = new Set();
                let totalXYZ = 0;
                snapshot.forEach(doc => {
                    const d = doc.data();
                    ['from', 'to', 'address'].forEach(key => d[key] && addressSet.add(d[key]));
                    totalXYZ += parseFloat(d.amount || 0);
                });
                document.getElementById('active-addresses').textContent = addressSet.size;
                document.getElementById('xyz-circulation').textContent = `${totalXYZ.toLocaleString()} XYZ`;
            } catch (err) {
                console.error(err);
            }
        }

        function formatTimestamp(timestamp) {
            if (!timestamp) return '--';
            const date = new Date(timestamp);
            return date.toLocaleString();
        }

        function showError() {
            errorMessage.style.display = 'block';
        }

        // Load initial data
        loadAllTransactions();
        loadNetworkStats();
    });
    
    // Notification logic
    const walletNotificationContainer = document.getElementById('walletNotification');
    const showTime = 5000;
    let notificationQueue = [];
    let currentIndex = 0;
    let isShowing = false;

    function showNextNotification() {
        if (notificationQueue.length === 0) {
            isShowing = false;
            return;
        }

        const data = notificationQueue[currentIndex];
        walletNotificationContainer.innerHTML = `
            <img src="${data.photoLink || 'https://placehold.co/40x40/cccccc/000000?text=NF'}" class="wallet-photo" onerror="this.onerror=null;this.src='https://placehold.co/40x40/cccccc/000000?text=NF';">
            <span>${data.title || 'New Notification'}</span>
        `;

        walletNotificationContainer.onclick = () => {
            window.location.href = 'xyzNotification.html'; 
        };

        walletNotificationContainer.classList.add('show');

        setTimeout(() => {
            walletNotificationContainer.classList.remove('show');
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % notificationQueue.length;
                showNextNotification(); // 🔁 loop
            }, 300); // match CSS transition
        }, showTime);
    }

    function startNotificationLoop() {
        if (!isShowing && notificationQueue.length > 0) {
            isShowing = true;
            showNextNotification();
        }
    }

    function setupNotificationListener() {
        db.collection("XYZnotifications")
            .orderBy("notificationNumber", "desc")
            .limit(10)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        notificationQueue.push({
                            id: change.doc.id,
                            title: data.title,
                            photoLink: data.photoLink
                        });
                    }
                });
                startNotificationLoop();
            }, (error) => {
                console.error("Notification listener error:", error);
            });
    }

    document.addEventListener('DOMContentLoaded', setupNotificationListener);

    // Crypto Ticker Logic
    const cryptos = {
        "bitcoin": { symbol: "BTC", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/bitcoin-btc-logo28129278199549210072979.jpg" },
        "ethereum": { symbol: "ETH", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/ethereum-eth-logo6464784847528636048.png" },
        "litecoin": { symbol: "LTC", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/litecoin-ltc-logo8675545178060996964.png" },
        "solana": { symbol: "SOL", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/solana-sol-logo281298285079945615734995.jpg" },
        "dash": { symbol: "DASH", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/dash-dash-logo332793562558391043.png" },
        "dogecoin": { symbol: "DOGE", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/dogecoin-doge-logo2539560636730686420.png" },
        "binancecoin": { symbol: "BNB", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/bnb-bnb-logo259338065244576686.png" },
        "tether": { symbol: "USDT", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/tether-usdt-logo8137853041787771395.png" },
        "metis-token": { symbol: "METIS", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/metisdao-metis-logo271474949307854164.png" },
        "manta-network": { symbol: "MANTA", logo: "https://xyz1a1.wordpress.com/wp-content/uploads/2025/06/retouch_20250611201843848177814195853987194.png" }
    };
    
    let lastPrices = {};
    
    function fetchPrices() {  
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,solana,dash,dogecoin,binancecoin,tether,metis-token,manta-network&vs_currencies=usd&include_24hr_change=true')  
            .then(response => response.json())  
            .then(data => {  
                const ticker = document.getElementById('crypto-items');  
                const tickerClone = document.getElementById('crypto-items-clone');
                ticker.innerHTML = '';  
                tickerClone.innerHTML = ''; // Clear clone as well
                
                const fragment = document.createDocumentFragment(); // Use fragment for performance
                
                for (const [id, crypto] of Object.entries(cryptos)) {  
                    const price = data[id].usd;  
                    const change24h = data[id].usd_24h_change;
                    const lastPrice = lastPrices[crypto.symbol] || price;  
                    const priceClass = price > lastPrice ? 'price-up' : 'price-down';  
                    const changeClass = change24h >= 0 ? 'price-up' : 'price-down';
                    const arrow = change24h >= 0 ? '↑' : '↓';
                    
                    const cryptoElement = document.createElement('div');  
                    cryptoElement.className = 'crypto';  
                    cryptoElement.innerHTML = `
                        <div class="crypto-logo">
                            <img src="${crypto.logo}" alt="${crypto.symbol}" onerror="this.onerror=null;this.src='https://placehold.co/32x32/cccccc/000000?text=${crypto.symbol}';">
                        </div>
                        <div class="crypto-info">
                            <div class="crypto-symbol">${crypto.symbol}</div>
                            <div class="crypto-price ${priceClass}">$${price.toLocaleString()}</div>
                            <div class="price-change ${changeClass}">
                                <span class="arrow">${arrow}</span>
                                ${Math.abs(change24h).toFixed(2)}%
                            </div>
                        </div>
                    `;
                    fragment.appendChild(cryptoElement);  
                    lastPrices[crypto.symbol] = price;  
                }  
                ticker.appendChild(fragment.cloneNode(true)); // Append to original
                tickerClone.appendChild(fragment.cloneNode(true)); // Append to clone
            })  
            .catch(error => console.error('Error fetching prices:', error));  
    }  
    
    fetchPrices();  
    setInterval(fetchPrices, 120000); // Update every 120 seconds

    // Adjust ticker animation duration based on content width for seamless loop
    function adjustTickerAnimation() {
        const ticker = document.getElementById('crypto-items');
        const tickerClone = document.getElementById('crypto-items-clone');
        if (ticker && tickerClone) {
            // Clone the content to create a seamless loop
            tickerClone.innerHTML = ticker.innerHTML;

            const totalWidth = ticker.scrollWidth;
            const wrapperWidth = ticker.parentElement.clientWidth;

            // If content is wider than wrapper, enable animation
            if (totalWidth > wrapperWidth) {
                const duration = totalWidth / 50; // Adjust 50 for speed
                ticker.style.animationDuration = `${duration}s`;
                tickerClone.style.animationDuration = `${duration}s`;
                ticker.style.animationPlayState = 'running';
                tickerClone.style.animationPlayState = 'running';
            } else {
                // If content is not wide enough, stop animation and center
                ticker.style.animationPlayState = 'paused';
                tickerClone.style.animationPlayState = 'paused';
                ticker.style.transform = 'translateX(0)';
                tickerClone.style.transform = 'translateX(0)';
                ticker.style.justifyContent = 'center'; /* Center items if not scrolling */
            }
        }
    }

    // Call on load and resize
    window.addEventListener('load', adjustTickerAnimation);
    window.addEventListener('resize', adjustTickerAnimation);

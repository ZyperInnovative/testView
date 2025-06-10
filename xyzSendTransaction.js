 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
  import {
    getFirestore,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
  } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDIwoUIMJrJQeLBD9vijsfIUXG9BgaGSPs",
    authDomain: "miner-zyx.firebaseapp.com",
    projectId: "miner-zyx",
    storageBucket: "miner-zyx.appspot.com",
    messagingSenderId: "430019680448",
    appId: "1:430019680448:web:d066b8aaf4355907e1b525",
    measurementId: "G-V6SDWYH6M2",
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const xyzBalanceElement = document.getElementById("xyzBalance");
  const recipientAddressInput = document.getElementById("recipientAddress");
  const amountInput = document.getElementById("amount");
  const sendButton = document.getElementById("sendButton");
  const transactionModal = document.getElementById("transactionModal");
  const modalRecipient = document.getElementById("modalRecipient");
  const modalRecipientEmail = document.getElementById("modalRecipientEmail");
  const modalAmount = document.getElementById("modalAmount");
  const modalGasFee = document.getElementById("modalGasFee");
  const confirmButton = document.getElementById("confirmButton");
  const cancelButton = document.getElementById("cancelButton");
  const loadingElement = document.getElementById("loading");

  const userEmail = localStorage.getItem("xyzEmailAccess");
  const userUid = localStorage.getItem("xyzUidAccess");

  let userBalance = 0;
  let currentTransaction = null;
  let senderData = null;

  if (!userEmail || !userUid) {
    alert("Please login first");
    window.location.href = "tryn.html";
  }

  // Function to mask email (e.g., johndoe@gmail.com -> joh...oe@gmail.com)
  function maskEmail(email) {
    if (!email) return "unknown@xyz.com";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 4) {
      return localPart.charAt(0) + "***@" + domain;
    }
    const firstPart = localPart.substring(0, 3);
    const lastPart = localPart.substring(localPart.length - 2);
    return `${firstPart}...${lastPart}@${domain}`;
  }

  async function fetchUserData() {
    try {
      const userDocRef = doc(db, "documentXYZ", userUid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        senderData = userDoc.data();
        userBalance = senderData.xyzBalance || 0;
        xyzBalanceElement.textContent = Number(userBalance).toFixed(2) + " ";     } else {
        xyzBalanceElement.textContent = "Error loading balance";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      xyzBalanceElement.textContent = "Error loading balance";
    }
  }

 function calculateGasFee(amount) {
    return amount > 10 ? 0.0001 : 0.0008;

  }

  function formatTransactionDetails(sender, recipientEmail, amount, gasFee, timestamp) {
    return `
      <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 10px; background-color: #f9f9f9;">
        <p style="margin: 0 0 5px; font-weight: bold; color: #333;">Transaction</p>
        <p style="margin: 0 0 3px; font-size: 14px;"><strong>From (Email):</strong> ${sender}</p>
        <p style="margin: 0 0 3px; font-size: 14px;"><strong>To (Email):</strong> ${recipientEmail}</p>
        <p style="margin: 0 0 3px; font-size: 14px;"><strong>Amount:</strong> ${amount} XYZ</p>
        <p style="margin: 0 0 3px; font-size: 14px;"><strong>Fee:</strong> ${gasFee} SOL</p>
        <p style="margin: 0; font-size: 12px; color: #666;">${new Date(timestamp).toLocaleString()}</p>
      </div>
    `;
  }
async function processTransaction() {
  const { recipientAddress, amount, recipientUid } = currentTransaction;
  const gasFee = calculateGasFee(amount);

  try {
    loadingElement.style.display = "block";
    confirmButton.disabled = true;
    cancelButton.disabled = true;

    // Get references to both documents
    const senderDocRef = doc(db, "documentXYZ", userUid);
    const recipientDocRef = doc(db, "documentXYZ", recipientUid);

    // Fetch both documents
    const [senderDoc, recipientDoc] = await Promise.all([
      getDoc(senderDocRef),
      getDoc(recipientDocRef)
    ]);

    if (!senderDoc.exists() || !recipientDoc.exists()) {
      throw new Error("Transaction parties not found");
    }

    const senderData = senderDoc.data();
    const recipientData = recipientDoc.data();
    const recipientEmail = recipientData.email || "unknown@xyz.com";
    const timestamp = new Date();

    // Validate balances
    if (senderData.xyzBalance < amount) throw new Error("Insufficient XYZ balance");
    if (senderData.solBalance < gasFee) throw new Error("Insufficient SOL for gas fee");

    // Create transaction object
    const transaction = {
      type: "transfer",
      amount,
      recipient: recipientEmail,
      sender: userEmail,
      gasFee,
      timestamp: timestamp.toISOString(),
      status: "completed"
    };

    // Prepare updates
    const batch = writeBatch(db);
    
    // Update sender's balance & transactions
    batch.update(senderDocRef, {
      xyzBalance: senderData.xyzBalance - amount,
      solBalance: senderData.solBalance - gasFee,
      xyzTransactions: [
        ...(senderData.xyzTransactions || []),
        transaction
      ]
    });

    // Update recipient's balance & transactions
    batch.update(recipientDocRef, {
      xyzBalance: recipientData.xyzBalance + amount,
      xyzTransactions: [
        ...(recipientData.xyzTransactions || []),
        transaction
      ]
    });

    // Save to blockchain collection (Sender's "sent" transaction)
    const blockchainCollection = collection(db, "blockchain");
    const sentTxRef = doc(blockchainCollection);
    batch.set(sentTxRef, {
      address: senderData.xyzAddress || "unknown", // Sender's XYZ address
      transactionType: "sent", // "sent" from sender's side
      from: senderData.xyzAddress || "unknown", // Sender's XYZ address
      to: recipientData.xyzAddress || "unknown", // Recipient's XYZ address
      amount: amount,
      timestamp: timestamp.toISOString(),
      gasFee: gasFee,
      status: "completed",
      senderEmail: userEmail,
      receiverEmail: recipientEmail
    });

    // Save to blockchain collection (Receiver's "received" transaction)
    const receivedTxRef = doc(blockchainCollection);
    batch.set(receivedTxRef, {
      address: recipientData.xyzAddress || "unknown", // Receiver's XYZ address
      transactionType: "received", // "received" from receiver's side
      from: senderData.xyzAddress || "unknown", // Sender's XYZ address
      to: recipientData.xyzAddress || "unknown", // Recipient's XYZ address
      amount: amount,
      timestamp: timestamp.toISOString(),
      gasFee: gasFee,
      status: "completed",
      senderEmail: userEmail,
      receiverEmail: recipientEmail
    });

    await batch.commit();

    // Update UI
    userBalance = senderData.xyzBalance - amount;
    xyzBalanceElement.textContent = userBalance + " XYZ";
    transactionModal.style.display = "none";
    alert("Transaction successful!");
  } catch (error) {
    console.error("Transaction failed:", error);
    alert(`Transaction failed: ${error.message}`);
  } finally {
    loadingElement.style.display = "none";
    confirmButton.disabled = false;
    cancelButton.disabled = false;
  }
}


  
    sendButton.addEventListener("click", async () => {
    const recipientAddress = recipientAddressInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!recipientAddress) {
      alert("Please enter recipient address");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > userBalance) {
      alert("Insufficient balance");
      return;
    }

    try {
      const q = query(
        collection(db, "documentXYZ"),
        where("xyzAddress", "==", recipientAddress)
      );
      const recipientQuery = await getDocs(q);

      if (recipientQuery.empty) {
        alert("Recipient address not found");
        return;
      }

      const recipientDoc = recipientQuery.docs[0];
const recipientData = recipientDoc.data();
const recipientUid = recipientDoc.id;
const recipientEmail = recipientData.email || "unknown@xyz.com"; // Fixed field name

currentTransaction = {
  recipientAddress,
  amount,
  recipientEmail,
  recipientUid,
};

// Update modal with masked email
document.getElementById("modalRecipientEmail").textContent = maskEmail(recipientEmail);
      modalRecipient.textContent = recipientAddress;
      modalAmount.textContent = amount;
      modalGasFee.textContent = calculateGasFee(amount);
      document.getElementById("modalRecipientEmail").textContent = maskEmail(recipientEmail);
      document.getElementById("modalRecipientUid").textContent = recipientUid;

      transactionModal.style.display = "flex";
    } catch (error) {
      console.error("Error fetching recipient data:", error);
      alert("Error fetching recipient details");
    }
  });

  confirmButton.addEventListener("click", processTransaction);
  cancelButton.addEventListener("click", () => {
    transactionModal.style.display = "none";
  });

  transactionModal.addEventListener("click", (e) => {
    if (e.target === transactionModal) {
      transactionModal.style.display = "none";
    }
  });

  fetchUserData();
  
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
// Override the default alert function
        (function() {
            const originalAlert = window.alert;
            
            window.alert = function(message) {
                ds_createNotification_xyz(message, 'info');
            };
            
            // Create a beautiful notification
            function ds_createNotification_xyz(message, type = 'info') {
                const container = document.getElementById('ds_notif_container_xyz');
                
                // Create notification element
                const notification = document.createElement('div');
                notification.className = `ds_notif_item_xyz ds_notif_${type}_xyz`;
                
                // Determine icon based on type
                let icon;
                switch(type) {
                    case 'warning':
                        icon = '⚠️';
                        break;
                    case 'error':
                        icon = '❌';
                        break;
                    case 'success':
                        icon = '✅';
                        break;
                    default:
                        icon = 'ℹ️';
                }
                
                // Notification content
                notification.innerHTML = `
                    <span class="ds_notif_icon_xyz">${icon}</span>
                    <div class="ds_notif_content_xyz">
                        <div class="ds_notif_title_xyz">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div class="ds_notif_message_xyz">${message}</div>
                    </div>
                    <span class="ds_notif_close_xyz">&times;</span>
                `;
                
                // Add close functionality
                notification.querySelector('.ds_notif_close_xyz').addEventListener('click', () => {
                    notification.style.animation = 'ds_fadeOut_xyz 0.5s forwards';
                    setTimeout(() => notification.remove(), 500);
                });
                
                // Auto-remove after 5 seconds
                setTimeout(() => {
                    notification.style.animation = 'ds_fadeOut_xyz 0.5s forwards';
                    setTimeout(() => notification.remove(), 500);
                }, 5000);
                
                // Add to container
                container.appendChild(notification);
            }
            
            // Make the function available globally with unique name
            window.ds_createNotification_xyz = ds_createNotification_xyz;
            
                    })();

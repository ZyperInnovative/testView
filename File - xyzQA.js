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
    
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    } else {
      firebase.app(); // if already initialized, use that one
    }
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // App state
    let userAnswered = false;
    let currentUser = null;
    
    // DOM elements
    const authStatusEl = document.getElementById('authStatus');
    const questionContainerEl = document.getElementById('questionContainer');
    const resultsContainerEl = document.getElementById('resultsContainer');
    
    // Check authentication state on page load
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        // Get credentials from local storage
        const email = localStorage.getItem('xyzEmailAccess');
        const uid = localStorage.getItem('xyzUidAccess'); // Using UID instead of password
        
        if (!email || !uid) {
          throw new Error('No authentication credentials found in local storage');
        }
        
        // Try to sign in with custom token (alternative approach)
        // Or simply verify the UID matches the authenticated user
        await checkUserAuthentication(email, uid);
        
      } catch (error) {
        console.error('Authentication error:', error);
        authStatusEl.textContent = 'Authentication failed. Please login again.';
        authStatusEl.className = 'auth-status unauthenticated';
      }
    });
    
    async function checkUserAuthentication(email, uid) {
      try {
        // Check if there's a current user
        if (auth.currentUser) {
          // Verify the current user matches the local storage
          if (auth.currentUser.email === email && auth.currentUser.uid === uid) {
            currentUser = auth.currentUser;
            updateUIForAuthenticatedUser();
            return;
          }
          // If not matching, sign out first
          await auth.signOut();
        }
        
        // Try to sign in with email/password if needed
        // Note: This is just a placeholder - you should implement proper authentication
        // For security reasons, you shouldn't store passwords in localStorage
        // A better approach would be to use Firebase's auth persistence
        
        // For this example, we'll just check if the UID matches
        // In a real app, you would have a proper authentication flow
        currentUser = { email, uid }; // Simplified for example purposes
        updateUIForAuthenticatedUser();
        
      } catch (error) {
        console.error('Error checking user authentication:', error);
        throw error;
      }
    }
    
    function updateUIForAuthenticatedUser() {
      authStatusEl.textContent = `Authenticated as: ${currentUser.email}`;
      authStatusEl.className = 'auth-status authenticated';
      
      // Show the questionnaire
      questionContainerEl.style.display = 'block';
      resultsContainerEl.style.display = 'block';
      
      // Check if user has already answered
      checkIfUserAnswered();
      loadResults();
    }
    
    async function checkIfUserAnswered() {
      try {
        const docRef = db.collection('xyzQA').doc('referralQuestion');
        const doc = await docRef.get();
        
        if (doc.exists) {
          const answers = doc.data().answers || {};
          if (answers[currentUser.uid]) {
            userAnswered = true;
            disableOptions();
            
            // Highlight user's previous selection
            if (answers[currentUser.uid] === 'yes') {
              document.getElementById('yesOption').classList.add('selected');
            } else {
              document.getElementById('noOption').classList.add('selected');
            }
          }
        }
      } catch (error) {
        console.error('Error checking user answer:', error);
        showError("Couldn't check your previous answer. Please refresh the page.");
      }
    }
    
    async function loadResults() {
      try {
        const docRef = db.collection('xyzQA').doc('referralQuestion');
        const doc = await docRef.get();
        
        if (doc.exists) {
          const data = doc.data();
          const yesCount = data.yes || 0;
          const noCount = data.no || 0;
          const total = yesCount + noCount;
          
          let yesPercent = 50;
          let noPercent = 50;
          
          if (total > 0) {
            yesPercent = Math.round((yesCount / total) * 100);
            noPercent = 100 - yesPercent;
          }
          
          document.getElementById('resultsText').innerHTML = `
            <p>Yes: ${yesCount} (${yesPercent}%)</p>
            <p>No: ${noCount} (${noPercent}%)</p>
          `;
          
          document.getElementById('progressYes').style.width = `${yesPercent}%`;
          document.getElementById('progressNo').style.width = `${noPercent}%`;
        }
      } catch (error) {
        console.error('Error loading results:', error);
        showError("Couldn't load results. Please try again.");
      }
    }
    
    async function selectOption(choice) {
      if (userAnswered || !currentUser) return;
      
      try {
        // Highlight selected option immediately
        document.getElementById(choice + 'Option').classList.add('selected');
        
        const batch = db.batch();
        const qaRef = db.collection('xyzQA').doc('referralQuestion');
        const userRef = db.collection('documentXYZ').doc(currentUser.uid);
        
        // Get current data first
        const qaDoc = await qaRef.get();
        const currentYes = qaDoc.exists ? qaDoc.data().yes || 0 : 0;
        const currentNo = qaDoc.exists ? qaDoc.data().no || 0 : 0;
        
        // Prepare updates
        const qaUpdate = {
          yes: choice === 'yes' ? currentYes + 1 : currentYes,
          no: choice === 'no' ? currentNo + 1 : currentNo,
          [`answers.${currentUser.uid}`]: choice,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const userUpdate = {
          xyzBalance: firebase.firestore.FieldValue.increment(10),
          hasAnsweredSurvey: true,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Set the updates in the batch
        if (qaDoc.exists) {
          batch.update(qaRef, qaUpdate);
        } else {
          batch.set(qaRef, {
            question: "Do you prefer referral system or pure mining and activity reward participation?",
            ...qaUpdate
          });
        }
        
        batch.set(userRef, userUpdate, { merge: true });
        
        // Commit the batch
        await batch.commit();
        
        // Update UI
        userAnswered = true;
        disableOptions();
        
        // Show results and reward
        await loadResults();
        showGiftAnimation();
        
      } catch (error) {
        console.error('Error submitting answer:', error);
        document.getElementById(choice + 'Option').classList.remove('selected');
        showError("Failed to submit your answer. Please try again.");
      }
    }
    
    function disableOptions() {
      document.getElementById('yesOption').style.pointerEvents = 'none';
      document.getElementById('noOption').style.pointerEvents = 'none';
      document.getElementById('yesOption').style.opacity = '0.7';
      document.getElementById('noOption').style.opacity = '0.7';
    }
    
    function showGiftAnimation() {
      document.getElementById('giftAnimation').style.display = 'flex';
    }
    
    function closeGiftAnimation() {
      document.getElementById('giftAnimation').style.display = 'none';
    }
    
    function showError(message) {
      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.textContent = message;
      
      // Insert after auth status
      authStatusEl.insertAdjacentElement('afterend', errorEl);
      
      setTimeout(() => {
        errorEl.remove();
      }, 5000);
    }
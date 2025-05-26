  
  
  
    const phrases = [
      "TRUTH . NEVER . DIES",
      "CODE . BECOMES . LAW",
      "FOREVER . ETCHED . LEDGER",
      "TRUSTLESS . TIMELESS . TERRIFYING",
      "DECENTRALIZED . UNDENIABLE . ETERNAL",
      "IMMORTAL . DIGITAL . SOUL",
      "ENCRYPTED . ETERNAL . MEMORY",
      "NO . MASTER . EXISTS",
      "CHAINS . HOLD . TRUTH",
      "WHISPERS . IN . CODE"
    ];

    let index = 0;
    const element = document.getElementById("powerWords");

    setInterval(() => {
      index = (index + 1) % phrases.length;
      element.textContent = phrases[index];
    }, 3000);
    
    

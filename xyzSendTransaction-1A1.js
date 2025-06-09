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
    
    // Simulate balance loading
    setTimeout(() => {
      document.getElementById('xyzBalance').textContent = '00.00';
    }, 1000);
  });
  

// Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Quantum sphere
        const sphereGeometry = new THREE.SphereGeometry(3, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const quantumSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(quantumSphere);

        // Create orbiting green dots (quantum bits)
        const dots = [];
        const dotCount = 200;
        const dotGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        
        for (let i = 0; i < dotCount; i++) {
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            
            // Random position on a sphere slightly larger than our main sphere
            const radius = 3.5 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            dot.position.x = radius * Math.sin(phi) * Math.cos(theta);
            dot.position.y = radius * Math.sin(phi) * Math.sin(theta);
            dot.position.z = radius * Math.cos(phi);
            
            // Store original position for animation
            dot.userData = {
                originalPosition: dot.position.clone(),
                speed: 0.001 + Math.random() * 0.003,
                angle: Math.random() * Math.PI * 2
            };
            
            scene.add(dot);
            dots.push(dot);
        }

        // Add some connection lines between dots
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.2 });
        const lines = [];
        
        for (let i = 0; i < dotCount; i += 5) {
            for (let j = i + 1; j < Math.min(i + 10, dotCount); j++) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    dots[i].position,
                    dots[j].position
                ]);
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
                lines.push(line);
            }
        }

        // Camera position
        camera.position.z = 10;

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate the quantum sphere
           quantumSphere.rotation.x = 0;
quantumSphere.rotation.z = 0;
quantumSphere.rotation.y += 0.006;
            
            // Animate the orbiting dots
            dots.forEach(dot => {
                // Orbit around the sphere
                dot.userData.angle += dot.userData.speed;
                
                // Create a circular orbit path
                const orbitRadius = 4 + Math.sin(dot.userData.angle * 2) * 0.5;
                dot.position.x = orbitRadius * Math.sin(dot.userData.angle);
                dot.position.z = orbitRadius * Math.cos(dot.userData.angle);
                dot.position.y = Math.sin(dot.userData.angle * 3) * 2;
                
                // Pulsing effect
                dot.scale.setScalar(0.8 + Math.sin(Date.now() * 0.005) * 0.3);
            });
            
            // Update connection lines
            let lineIndex = 0;
            for (let i = 0; i < dotCount; i += 5) {
                for (let j = i + 1; j < Math.min(i + 10, dotCount); j++) {
                    lines[lineIndex].geometry.setFromPoints([dots[i].position, dots[j].position]);
                    lineIndex++;
                }
            }
            
            renderer.render(scene, camera);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        animate();
        
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

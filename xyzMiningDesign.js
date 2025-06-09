  // Initialize Three.js for the sphere visualization
        const sphereCanvas = document.getElementById('sphere-canvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            canvas: sphereCanvas,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Quantum sphere
        const sphereGeometry = new THREE.SphereGeometry(1.3, 24, 24);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: navigator.onLine ? 0x00f7ff : 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const quantumSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(quantumSphere);

        // Create orbiting dots (quantum bits)
        const dots = [];
        const dotCount = 60;
        const dotGeometry = new THREE.SphereGeometry(0.025, 6, 6);
        const dotMaterial = new THREE.MeshBasicMaterial({ 
            color: navigator.onLine ? 0x00f7ff : 0xff0000,
            transparent: true,
            opacity: 0.7
        });

        for (let i = 0; i < dotCount; i++) {
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            
            const radius = 1.6 + Math.random() * 0.3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            dot.position.x = radius * Math.sin(phi) * Math.cos(theta);
            dot.position.y = radius * Math.sin(phi) * Math.sin(theta);
            dot.position.z = radius * Math.cos(phi);
            
            dot.userData = {
                speed: 0.0008 + Math.random() * 0.0015,
                angle: Math.random() * Math.PI * 2,
                orbitRadius: 1.3 + Math.random() * 0.3
            };
            
            scene.add(dot);
            dots.push(dot);
        }

        // Camera position
        camera.position.z =4.5;

        // Internet connection detection
        function updateConnectionStatus() {
            const isOnline = navigator.onLine;
            const color = isOnline ? 0x00f7ff : 0xff0000;
            
            quantumSphere.material.color.setHex(color);
            dots.forEach(dot => dot.material.color.setHex(color));
            
            if (isOnline) {
                document.body.classList.remove('offline');
                document.getElementById('connectionStatus').textContent = "ONLINE";
            } else {
                document.body.classList.add('offline');
                document.getElementById('connectionStatus').textContent = "OFFLINE";
            }
        }

        updateConnectionStatus();
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            quantumSphere.rotation.y += 0.0035;
            
            dots.forEach(dot => {
                dot.userData.angle += dot.userData.speed;
                dot.position.x = dot.userData.orbitRadius * Math.sin(dot.userData.angle * 2);
                dot.position.z = dot.userData.orbitRadius * Math.cos(dot.userData.angle);
                dot.position.y = Math.sin(dot.userData.angle * 3) * 1.2;
                dot.scale.setScalar(0.7 + Math.sin(Date.now() * 0.004 + dot.userData.angle) * 0.3);
            });
            
            renderer.render(scene, camera);
        }

        function handleResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        window.addEventListener('resize', handleResize);
        handleResize();
        animate();
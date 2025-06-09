 // Advanced Configuration
        const config = {
            maxAttempts: 3,
            successRedirect: 'xyzDashboard.html',
            voiceWords: ['satoshi', 'blockchain', 'bitcoin', 'ethereum', 'crypto', 'decentralized'],
            imageCategories: {
                'vehicles': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑'],
                'animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
                'food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓']
            },
            methods: ['behavior', 'voice', 'math', 'image'], // Available CAPTCHA methods
            behaviorShapes: ['circle', 'square', 'triangle', 'star'],
            aiDetectionThreshold: 70, // Percentage threshold to trigger AI detection
            verificationDelay: 1500, // Delay before showing verification methods (ms)
            sessionTimeout: 300000 // 5 minutes session timeout (ms)
        };
        
        // Advanced State Management
        let state = {
            currentMethod: '',
            currentWord: '',
            mathProblem: { num1: 0, num2: 0, operator: '+', answer: 0 },
            imageTarget: '',
            correctImages: [],
            selectedImages: [],
            attempts: 0,
            usedMethods: [],
            aiDetectionScore: 0,
            detectionReasons: [],
            sessionStart: Date.now(),
            sessionId: generateSessionId(),
            behaviorPath: [],
            behaviorStartTime: 0,
            behaviorShape: '',
            mouseMovements: [],
            keyPresses: [],
            timingMetrics: {
                pageLoadTime: 0,
                methodSwitchTime: 0,
                interactionDelays: []
            },
            canvasContext: null,
            isDrawing: false,
            lastInteractionTime: Date.now()
        };
        
        // DOM elements
        const elements = {
            verificationContainer: document.getElementById('verification-container'),
            detectionIndicator: document.getElementById('detection-indicator'),
            aiDetectionContainer: document.getElementById('ai-detection-container'),
            aiDetectionMessage: document.getElementById('ai-detection-message'),
            aiDetectionReasons: document.getElementById('ai-detection-reasons'),
            voiceCaptcha: document.getElementById('voice-captcha'),
            mathCaptcha: document.getElementById('math-captcha'),
            imageCaptcha: document.getElementById('image-captcha'),
            behaviorCaptcha: document.getElementById('behavior-captcha'),
            behaviorCanvas: document.getElementById('behavior-canvas'),
            captchaWord: document.getElementById('captcha-word'),
            holdButton: document.getElementById('hold-button'),
            mathProblem: document.getElementById('math-problem'),
            mathAnswer: document.getElementById('math-answer'),
            imageTarget: document.getElementById('image-target'),
            imageOptions: document.getElementById('image-options'),
            message: document.getElementById('message'),
            methodTitle: document.getElementById('method-title'),
            loadingContainer: document.getElementById('loading-container'),
            loadingText: document.getElementById('loading-text'),
            attemptsWarning: document.getElementById('attempts-warning'),
            timestamp: document.getElementById('timestamp'),
            sessionId: document.getElementById('session-id')
        };
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Set timestamp and session ID
            elements.timestamp.textContent = new Date().toLocaleString();
            elements.sessionId.textContent = `Session: ${state.sessionId}`;
            
            // Record page load time
            state.timingMetrics.pageLoadTime = Date.now();
            
            // Initialize behavior canvas
            if (elements.behaviorCanvas) {
                state.canvasContext = elements.behaviorCanvas.getContext('2d');
                state.canvasContext.strokeStyle = '#4cc9f0';
                state.canvasContext.lineWidth = 2;
                state.canvasContext.lineCap = 'round';
                
                // Set up canvas event listeners
                setupCanvasEvents();
            }
            
            // Set up mouse movement tracking
            document.addEventListener('mousemove', trackMouseMovement);
            
            // Set up keyboard tracking
            document.addEventListener('keydown', trackKeyPress);
            
            // Set up interaction timeout
            setInterval(checkInactivity, 60000); // Check every minute
            
            // Initialize voice recognition if available
            if (!('webkitSpeechRecognition' in window)) {
                // Remove voice from available methods if not supported
                config.methods = config.methods.filter(method => method !== 'voice');
            }
            
            // Start with initial delay to analyze behavior first
            setTimeout(() => {
                selectRandomMethod();
            }, config.verificationDelay);
        });
        
        // Generate a unique session ID
        function generateSessionId() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        
        // Track mouse movements for behavior analysis
        function trackMouseMovement(e) {
            state.mouseMovements.push({
                x: e.clientX,
                y: e.clientY,
                time: Date.now(),
                velocity: calculateMouseVelocity(e)
            });
            
            // Keep only the last 100 movements
            if (state.mouseMovements.length > 100) {
                state.mouseMovements.shift();
            }
            
            state.lastInteractionTime = Date.now();
        }
        
        // Calculate mouse velocity
        function calculateMouseVelocity(e) {
            if (state.mouseMovements.length === 0) return 0;
            
            const lastMove = state.mouseMovements[state.mouseMovements.length - 1];
            const timeDiff = Date.now() - lastMove.time;
            if (timeDiff === 0) return 0;
            
            const distance = Math.sqrt(
                Math.pow(e.clientX - lastMove.x, 2) + 
                Math.pow(e.clientY - lastMove.y, 2)
            );
            
            return distance / timeDiff;
        }
        
        // Track key presses
        function trackKeyPress(e) {
            state.keyPresses.push({
                key: e.key,
                code: e.code,
                time: Date.now(),
                duration: 0 // Will be updated on keyup
            });
            
            // Keep only the last 50 key presses
            if (state.keyPresses.length > 50) {
                state.keyPresses.shift();
            }
            
            state.lastInteractionTime = Date.now();
        }
        
        // Check for inactivity
        function checkInactivity() {
            const inactiveTime = Date.now() - state.lastInteractionTime;
            if (inactiveTime > 300000) { // 5 minutes
                increaseAiDetectionScore(10, 'Long periods of inactivity');
            }
        }
        
        // Setup canvas events for behavior CAPTCHA
        function setupCanvasEvents() {
            const canvas = elements.behaviorCanvas;
            
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('touchstart', startDrawing);
            
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('touchmove', draw);
            
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('touchend', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
        }
        
        function startDrawing(e) {
            e.preventDefault();
            state.isDrawing = true;
            state.behaviorPath = [];
            
            const pos = getCanvasPosition(e);
            state.canvasContext.beginPath();
            state.canvasContext.moveTo(pos.x, pos.y);
            
            state.behaviorPath.push({
                x: pos.x,
                y: pos.y,
                time: Date.now(),
                pressure: e.pressure || 0.5
            });
            
            state.behaviorStartTime = Date.now();
        }
        
        function draw(e) {
            if (!state.isDrawing) return;
            e.preventDefault();
            
            const pos = getCanvasPosition(e);
            state.canvasContext.lineTo(pos.x, pos.y);
            state.canvasContext.stroke();
            
            state.behaviorPath.push({
                x: pos.x,
                y: pos.y,
                time: Date.now(),
                pressure: e.pressure || 0.5
            });
        }
        
        function stopDrawing() {
            state.isDrawing = false;
        }
        
        function getCanvasPosition(e) {
            const canvas = elements.behaviorCanvas;
            const rect = canvas.getBoundingClientRect();
            
            let clientX, clientY;
            
            if (e.type.includes('touch')) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }
        
          // Method selection with AI detection
        function selectRandomMethod() {
            // First check AI detection score
            if (state.aiDetectionScore >= config.aiDetectionThreshold) {
                showAiDetectionWarning();
                return;
            }
            
            // Filter out methods that have already been used
            const availableMethods = config.methods.filter(method => !state.usedMethods.includes(method));
            
            // If all methods have been tried, reset the used methods
            if (availableMethods.length === 0) {
                state.usedMethods = [];
                availableMethods.push(...config.methods);
            }
            
            // Select a random method from available ones
            state.currentMethod = availableMethods[Math.floor(Math.random() * availableMethods.length)];
            state.usedMethods.push(state.currentMethod);
            
            // Record method switch time
            state.timingMetrics.methodSwitchTime = Date.now();
            
            // Hide all methods first
            elements.voiceCaptcha.style.display = 'none';
            elements.mathCaptcha.style.display = 'none';
            elements.imageCaptcha.style.display = 'none';
            elements.behaviorCaptcha.style.display = 'none';
            
            // Initialize the selected method
            switch(state.currentMethod) {
                case 'voice':
                    initVoiceCaptcha();
                    break;
                case 'math':
                    initMathCaptcha();
                    break;
                case 'image':
                    initImageCaptcha();
                    break;
                case 'behavior':
                    initBehaviorCaptcha();
                    break;
            }
            
            // Reset message
            elements.message.textContent = '';
            elements.message.className = 'message';
            
            // Analyze behavior before showing the method
            analyzePreInteractionBehavior();
        }
        
        function initBehaviorCaptcha() {
            // Select a random shape
            state.behaviorShape = config.behaviorShapes[Math.floor(Math.random() * config.behaviorShapes.length)];
            
            // Clear canvas
            state.canvasContext.clearRect(0, 0, elements.behaviorCanvas.width, elements.behaviorCanvas.height);
            
            // Draw the target shape faintly
            state.canvasContext.strokeStyle = 'rgba(76, 201, 240, 0.2)';
            state.canvasContext.lineWidth = 2;
            
            switch(state.behaviorShape) {
                case 'circle':
                    drawCircle();
                    break;
                case 'square':
                    drawSquare();
                    break;
                case 'triangle':
                    drawTriangle();
                    break;
                case 'star':
                    drawStar();
                    break;
            }
            
            // Reset for user drawing
            state.canvasContext.strokeStyle = '#4cc9f0';
            state.behaviorPath = [];
            
            elements.behaviorCaptcha.style.display = 'block';
            elements.methodTitle.textContent = 'Behavior Verification';
            
            // Update instructions
            document.querySelector('.behavior-instructions').textContent = 
                `Please trace the ${state.behaviorShape} shape as accurately as possible`;
        }
        
        function drawCircle() {
            state.canvasContext.beginPath();
            state.canvasContext.arc(175, 100, 60, 0, Math.PI * 2);
            state.canvasContext.stroke();
        }
        
        function drawSquare() {
            state.canvasContext.beginPath();
            state.canvasContext.rect(115, 40, 120, 120);
            state.canvasContext.stroke();
        }
        
        function drawTriangle() {
            state.canvasContext.beginPath();
            state.canvasContext.moveTo(175, 40);
            state.canvasContext.lineTo(115, 160);
            state.canvasContext.lineTo(235, 160);
            state.canvasContext.closePath();
            state.canvasContext.stroke();
        }
        
        function drawStar() {
            const spikes = 5;
            const outerRadius = 60;
            const innerRadius = 30;
            const cx = 175;
            const cy = 100;
            
            state.canvasContext.beginPath();
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;
            
            state.canvasContext.moveTo(cx, cy - outerRadius);
            
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                state.canvasContext.lineTo(x, y);
                rot += step;
                
                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                state.canvasContext.lineTo(x, y);
                rot += step;
            }
            
            state.canvasContext.lineTo(cx, cy - outerRadius);
            state.canvasContext.stroke();
        }
        
        function analyzeBehavior() {
            if (state.behaviorPath.length < 10) {
                elements.message.textContent = 'Please draw more of the shape';
                elements.message.className = 'message error';
                return;
            }
            
            // Analyze drawing characteristics
            const analysis = analyzeDrawing();
            
            // Check for robotic patterns
            if (analysis.tooPerfect) {
                increaseAiDetectionScore(30, 'Drawing is too geometrically perfect');
            }
            
            if (analysis.tooFast) {
                increaseAiDetectionScore(20, 'Drawing speed is unnaturally consistent');
            }
            
            if (analysis.tooSlow) {
                increaseAiDetectionScore(10, 'Drawing speed is unnaturally slow');
            }
            
            if (analysis.tooPrecise) {
                increaseAiDetectionScore(25, 'Drawing is unnaturally precise');
            }
            
            // Check if AI detected
            if (state.aiDetectionScore >= config.aiDetectionThreshold) {
                showAiDetectionWarning();
                return;
            }
            
            
                // If passed behavior check
            validateResponse('human');
        }
        
        function analyzeDrawing() {
            const result = {
                tooPerfect: false,
                tooFast: false,
                tooSlow: false,
                tooPrecise: false
            };
            
            if (state.behaviorPath.length < 20) {
                return result;
            }
            
            // Calculate drawing time
            const drawTime = Date.now() - state.behaviorStartTime;
            
            // Calculate average speed
            let totalDistance = 0;
            let totalTime = 0;
            let speeds = [];
            
            for (let i = 1; i < state.behaviorPath.length; i++) {
                const prev = state.behaviorPath[i - 1];
                const curr = state.behaviorPath[i];
                
                const distance = Math.sqrt(
                    Math.pow(curr.x - prev.x, 2) + 
                    Math.pow(curr.y - prev.y, 2)
                );
                const timeDiff = curr.time - prev.time;
                
                totalDistance += distance;
                totalTime += timeDiff;
                
                if (timeDiff > 0) {
                    speeds.push(distance / timeDiff);
                }
            }
            
            const avgSpeed = totalDistance / totalTime;
            
            // Calculate speed variance
            let speedVariance = 0;
            if (speeds.length > 0) {
                const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
                speedVariance = speeds.reduce((a, b) => a + Math.pow(b - meanSpeed, 2), 0) / speeds.length;
            }
            
            // Check for robotic patterns
            if (speedVariance < 0.1) {
                result.tooPerfect = true;
            }
            
            if (avgSpeed > 5) {
                result.tooFast = true;
            }
            
            if (avgSpeed < 0.5) {
                result.tooSlow = true;
            }
            
            // Check precision (human drawings have small imperfections)
            const shapeArea = calculateShapeArea();
            const drawnArea = calculateDrawnArea();
            const areaRatio = drawnArea / shapeArea;
            
            if (Math.abs(1 - areaRatio) < 0.05) {
                result.tooPrecise = true;
            }
            
            return result;
        }
        
        function calculateShapeArea() {
            switch(state.behaviorShape) {
                case 'circle':
                    return Math.PI * 60 * 60;
                case 'square':
                    return 120 * 120;
                case 'triangle':
                    return 0.5 * 120 * 120;
                case 'star':
                    // Approximation for star area
                    return 0.5 * 5 * 60 * 30;
                default:
                    return 0;
            }
        }
        
        function calculateDrawnArea() {
            // Simple approximation - convex hull area would be better
            if (state.behaviorPath.length < 3) return 0;
            
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            for (const point of state.behaviorPath) {
                if (point.x < minX) minX = point.x;
                if (point.x > maxX) maxX = point.x;
                if (point.y < minY) minY = point.y;
                if (point.y > maxY) maxY = point.y;
            }
            
            return (maxX - minX) * (maxY - minY);
        }
        
        function analyzePreInteractionBehavior() {
            // Analyze mouse movements before showing the CAPTCHA
            if (state.mouseMovements.length < 10) return;
            
            // Check for linear/robotic mouse movements
            const linearity = calculateMouseLinearity();
            if (linearity > 0.9) {
                increaseAiDetectionScore(15, 'Mouse movements are too linear');
            }
            
            // Check for uniform speed
            const speedConsistency = calculateMouseSpeedConsistency();
            if (speedConsistency > 0.8) {
                increaseAiDetectionScore(20, 'Mouse speed is unnaturally consistent');
            }
            
            // Check for rapid, precise movements
            const precision = calculateMousePrecision();
            if (precision > 0.85) {
                increaseAiDetectionScore(25, 'Mouse movements are too precise');
            }
            
            // Check for rapid method switching
            if (state.attempts > 0) {
                const switchTime = Date.now() - state.timingMetrics.methodSwitchTime;
                if (switchTime < 500) {
                    increaseAiDetectionScore(30, 'Method switching too fast for human');
                }
            }
        }
        
        function calculateMouseLinearity() {
            // Calculate how linear mouse movements are
            if (state.mouseMovements.length < 3) return 0;
            
            let totalAngleChange = 0;
            let count = 0;
            
            for (let i = 2; i < state.mouseMovements.length; i++) {
                const p1 = state.mouseMovements[i - 2];
                const p2 = state.mouseMovements[i - 1];
                const p3 = state.mouseMovements[i];
                
                const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
                
                let angleDiff = Math.abs(angle1 - angle2);
                if (angleDiff > Math.PI) {
                    angleDiff = 2 * Math.PI - angleDiff;
                }
                
                totalAngleChange += angleDiff;
                count++;
            }
            
            const avgAngleChange = totalAngleChange / count;
            
            // Normalize to 0-1 scale (1 being perfectly linear)
            return 1 - (avgAngleChange / Math.PI);
        }
        
        function calculateMouseSpeedConsistency() {
            // Calculate how consistent mouse speed is
            if (state.mouseMovements.length < 3) return 0;
            
            const speeds = [];
            for (let i = 1; i < state.mouseMovements.length; i++) {
                const prev = state.mouseMovements[i - 1];
                const curr = state.mouseMovements[i];
                
                const distance = Math.sqrt(
                    Math.pow(curr.x - prev.x, 2) + 
                    Math.pow(curr.y - prev.y, 2)
                );
                const timeDiff = curr.time - prev.time;
                
                if (timeDiff > 0) {
                    speeds.push(distance / timeDiff);
                }
            }
            
            if (speeds.length < 2) return 0;
            
            const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
            const variance = speeds.reduce((a, b) => a + Math.pow(b - meanSpeed, 2), 0) / speeds.length;
            const stdDev = Math.sqrt(variance);
            
            // Consistency is inverse of coefficient of variation
            return meanSpeed > 0 ? 1 - (stdDev / meanSpeed) : 0;
        }
        
        function calculateMousePrecision() {
            // Calculate how precise movements are (sudden stops, exact targeting)
            if (state.mouseMovements.length < 3) return 0;
            
            let precisionScore = 0;
            let count = 0;
            
            for (let i = 1; i < state.mouseMovements.length; i++) {
                const prev = state.mouseMovements[i - 1];
                const curr = state.mouseMovements[i];
                
                // Check for sudden stops
                if (i < state.mouseMovements.length - 1) {
                    const next = state.mouseMovements[i + 1];
                    const speedBefore = Math.sqrt(
                        Math.pow(curr.x - prev.x, 2) + 
                        Math.pow(curr.y - prev.y, 2)
                    ) / (curr.time - prev.time);
                    
                    const speedAfter = Math.sqrt(
                        Math.pow(next.x - curr.x, 2) + 
                        Math.pow(next.y - curr.y, 2)
                    ) / (next.time - curr.time);
                    
                    if (speedBefore > 1 && speedAfter < 0.1) {
                        precisionScore += 0.1;
                    }
                }
                
                count++;
            }
            
            return precisionScore / count;
        }
        
        function increaseAiDetectionScore(amount, reason) {
            state.aiDetectionScore = Math.min(100, state.aiDetectionScore + amount);
            updateDetectionIndicator();
            
            if (!state.detectionReasons.includes(reason)) {
                state.detectionReasons.push(reason);
            }
            
            // If threshold reached, show warning
            if (state.aiDetectionScore >= config.aiDetectionThreshold) {
                showAiDetectionWarning();
            }
        }
        
        function updateDetectionIndicator() {
            elements.detectionIndicator.textContent = `AI Detection: ${state.aiDetectionScore}%`;
            
            if (state.aiDetectionScore > 50) {
                elements.detectionIndicator.style.backgroundColor = 'rgba(247, 37, 133, 0.3)';
            } else {
                elements.detectionIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            }
        }
        
        function showAiDetectionWarning() {
            // Hide all CAPTCHA methods
            elements.voiceCaptcha.style.display = 'none';
            elements.mathCaptcha.style.display = 'none';
            elements.imageCaptcha.style.display = 'none';
            elements.behaviorCaptcha.style.display = 'none';
            
            // Show AI detection warning
            elements.aiDetectionContainer.style.display = 'block';
            elements.methodTitle.textContent = 'Verification Suspended';
            
            // Update detection message
            elements.aiDetectionMessage.textContent = 
                `Our system detected potential automated activity (confidence: ${state.aiDetectionScore}%).`;
            
            // List detection reasons
            elements.aiDetectionReasons.innerHTML = state.detectionReasons
                .map(reason => `<li>${reason}</li>`)
                .join('');
            
            // Add container effect
            elements.verificationContainer.classList.add('ai-detected');
        }
        
        function resetVerification() {
            // Reset detection state but keep the score
            state.detectionReasons = [];
            state.usedMethods = [];
            state.attempts = 0;
            
            // Remove AI detected style
            elements.verificationContainer.classList.remove('ai-detected');
            elements.aiDetectionContainer.style.display = 'none';
            
            // Start fresh verification
            selectRandomMethod();
        }
        
        function switchMethod() {
            state.attempts++;
            updateAttemptsWarning();
            
            // Analyze switching behavior
            const switchTime = Date.now() - state.timingMetrics.methodSwitchTime;
            if (switchTime < 500) {
                increaseAiDetectionScore(15, 'Method switching too fast for human');
            }
            
            selectRandomMethod();
        }
        
        // Voice CAPTCHA functions
        function initVoiceCaptcha() {
            state.currentWord = config.voiceWords[Math.floor(Math.random() * config.voiceWords.length)];
            elements.captchaWord.textContent = state.currentWord;
            elements.voiceCaptcha.style.display = 'block';
            elements.methodTitle.textContent = 'Voice Verification';
        }
        
        function startVoiceRecognition() {
            if (state.currentMethod !== 'voice') return;
            
            elements.holdButton.classList.add('listening', 'holding');
            elements.holdButton.textContent = 'Listening...';
            
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            
            recognition.onstart = function() {
                elements.message.textContent = 'Listening... Please say the word above.';
                elements.message.className = 'message';
            };
            
            recognition.onerror = function(event) {
                elements.message.textContent = 'Error: ' + event.error;
                elements.message.className = 'message error';
                elements.holdButton.classList.remove('listening', 'holding');
                elements.holdButton.textContent = 'Hold to Speak';
                
                if (event.error === 'not-allowed') {
                    increaseAiDetectionScore(20, 'Microphone access denied');
                }
            };
   
     recognition.onresult = function(event) {
                const spokenWord = event.results[0][0].transcript.toLowerCase().trim();
                
                // Analyze speech patterns
                analyzeSpeechPatterns(event.results[0][0]);
                
                validateResponse(spokenWord);
            };
            
            recognition.onend = function() {
                elements.holdButton.classList.remove('listening', 'holding');
                elements.holdButton.textContent = 'Hold to Speak';
            };
            
            recognition.start();
        }
        
        function analyzeSpeechPatterns(speechResult) {
            // Check for perfect pronunciation (AI often has perfect pronunciation)
            const confidence = speechResult.confidence;
            if (confidence > 0.95) {
                increaseAiDetectionScore(15, 'Voice recognition confidence too high (potential synthetic voice)');
            }
            
            // Check speech duration (AI often speaks at consistent speed)
            const duration = speechResult.endTimestamp - speechResult.startTimestamp;
            const wordLength = state.currentWord.length;
            const expectedDuration = wordLength * 150; // Approx 150ms per character
            
            if (Math.abs(duration - expectedDuration) < 100) {
                increaseAiDetectionScore(10, 'Speech duration too consistent with word length');
            }
        }
        
        function stopVoiceRecognition() {
            elements.holdButton.classList.remove('holding');
        }
        
        // Math CAPTCHA functions
        function initMathCaptcha() {
            // Generate a simple math problem
            state.mathProblem.num1 = Math.floor(Math.random() * 10) + 1;
            state.mathProblem.num2 = Math.floor(Math.random() * 10) + 1;
            
            // Random operator (+, -, *)
            const operators = ['+', '-', '*'];
            state.mathProblem.operator = operators[Math.floor(Math.random() * operators.length)];
            
            // Calculate answer
            switch(state.mathProblem.operator) {
                case '+':
                    state.mathProblem.answer = state.mathProblem.num1 + state.mathProblem.num2;
                    break;
                case '-':
                    state.mathProblem.answer = state.mathProblem.num1 - state.mathProblem.num2;
                    break;
                case '*':
                    state.mathProblem.answer = state.mathProblem.num1 * state.mathProblem.num2;
                    break;
            }
            
            elements.mathProblem.textContent = `${state.mathProblem.num1} ${state.mathProblem.operator} ${state.mathProblem.num2} = ?`;
            elements.mathAnswer.value = '';
            elements.mathCaptcha.style.display = 'block';
            elements.methodTitle.textContent = 'Math Verification';
        }
        
        function checkMathAnswer() {
            const userAnswer = parseInt(elements.mathAnswer.value);
            if (isNaN(userAnswer)) {
                elements.message.textContent = 'Please enter a valid number';
                elements.message.className = 'message error';
                return;
            }
            
            // Check answer time (humans take time to solve)
            const answerTime = Date.now() - state.timingMetrics.methodSwitchTime;
            const expectedTime = calculateExpectedMathTime();
            
            if (answerTime < expectedTime * 0.3) {
                increaseAiDetectionScore(25, 'Math problem solved too quickly');
            } else if (answerTime > expectedTime * 3) {
                increaseAiDetectionScore(10, 'Math problem solved too slowly');
            }
            
            validateResponse(userAnswer.toString());
        }
        
        function calculateExpectedMathTime() {
            // Base time for simple problems
            let baseTime = 3000; // 3 seconds
            
            // Add time based on operator
            if (state.mathProblem.operator === '*') {
                baseTime += 2000;
            } else if (state.mathProblem.operator === '-') {
                baseTime += 1000;
            }
            
            // Add time based on number size
            const maxNum = Math.max(state.mathProblem.num1, state.mathProblem.num2);
            if (maxNum > 5) {
                baseTime += (maxNum - 5) * 500;
            }
            
            return baseTime;
        }
        // Image CAPTCHA functions
        function initImageCaptcha() {
            // Select a random category
            const categories = Object.keys(config.imageCategories);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            state.imageTarget = randomCategory;
            
            // Get all emojis for this category
            const allEmojis = config.imageCategories[randomCategory];
            
            // Select 3-5 correct images
            const correctCount = Math.floor(Math.random() * 3) + 3;
            state.correctImages = [];
            
            // Shuffle array and pick first 'correctCount' items
            const shuffled = [...allEmojis].sort(() => 0.5 - Math.random());
            state.correctImages = shuffled.slice(0, correctCount);
            
            // Create options (correct + some incorrect)
            const options = [...state.correctImages];
            
            // Add incorrect options from other categories
            const otherCategories = categories.filter(cat => cat !== randomCategory);
            const incorrectPerCategory = Math.ceil((12 - correctCount) / otherCategories.length);
            
            otherCategories.forEach(cat => {
                const incorrectOptions = [...config.imageCategories[cat]]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, incorrectPerCategory);
                options.push(...incorrectOptions);
            });
            
            // Shuffle all options
            const finalOptions = options.sort(() => 0.5 - Math.random()).slice(0, 9);
            
            // Render options
            elements.imageOptions.innerHTML = '';
            elements.imageTarget.textContent = randomCategory;
            
            finalOptions.forEach(emoji => {
                const img = document.createElement('div');
                img.className = 'image-option';
                img.textContent = emoji;
                img.dataset.emoji = emoji;
                img.onclick = function() {
                    this.classList.toggle('selected');
                    const index = state.selectedImages.indexOf(emoji);
                    if (index === -1) {
                        state.selectedImages.push(emoji);
                    } else {
                        state.selectedImages.splice(index, 1);
                    }
                    
                    // Track selection time
                    state.lastSelectionTime = Date.now();
                };
                elements.imageOptions.appendChild(img);
            });
            
            elements.imageCaptcha.style.display = 'block';
            elements.methodTitle.textContent = 'Image Verification';
            state.selectedImages = [];
            state.lastSelectionTime = 0;
        }
        
        function checkImageSelection() {
            if (state.selectedImages.length === 0) {
                elements.message.textContent = 'Please select at least one image';
                elements.message.className = 'message error';
                return;
            }
            
            // Check selection time (humans take time to look at images)
            const selectionTime = Date.now() - state.timingMetrics.methodSwitchTime;
            if (selectionTime < 2000) {
                increaseAiDetectionScore(20, 'Image selection made too quickly');
            }
            
            // Check if all selected are correct and all correct are selected
            const allCorrectSelected = state.correctImages.every(emoji => 
                state.selectedImages.includes(emoji));
            const noIncorrectSelected = state.selectedImages.every(emoji => 
                state.correctImages.includes(emoji));
            
            if (allCorrectSelected && noIncorrectSelected) {
                validateResponse('correct');
            } else {
                // Count how many correct were selected
                const correctCount = state.selectedImages.filter(emoji => 
                    state.correctImages.includes(emoji)).length;
                const totalCorrect = state.correctImages.length;
                
                elements.message.textContent = `Selected ${correctCount} of ${totalCorrect} correct items`;
                elements.message.className = 'message error';
                state.attempts++;
                updateAttemptsWarning();
                
                // Check for systematic incorrect selections (bots often get this wrong)
                if (correctCount === 0 && state.selectedImages.length > 0) {
                    increaseAiDetectionScore(15, 'Systematic incorrect image selection');
                }
                
                initImageCaptcha(); // Reset with new images
            }
        }
        
        // Validation
        function validateResponse(response) {
            let isValid = false;
            
            switch(state.currentMethod) {
                case 'voice':
                    isValid = response === state.currentWord.toLowerCase();
                    break;
                case 'math':
                    isValid = parseInt(response) === state.mathProblem.answer;
                    break;
                case 'image':
                    isValid = response === 'correct';
                    break;
                case 'behavior':
                    isValid = response === 'human';
                    break;
            }
            
            if (isValid) {
                // Additional verification for high AI detection scores
                if (state.aiDetectionScore > 30) {
                    elements.loadingText.textContent = 'Additional verification required...';
                    increaseAiDetectionScore(-10, 'Successful verification');
                    
                    // 30% chance of requiring another verification
                    if (Math.random() < 0.3) {
                        elements.message.textContent = 'Verification partially successful. One more step required.';
                        elements.message.className = 'message warning';
                        setTimeout(selectRandomMethod, 2000);
                        return;
                    }
                }
                
                elements.message.textContent = 'Verification successful!';
                elements.message.className = 'message success';
                showLoadingAndRedirect();
            } else {
                elements.message.textContent = 'Verification failed. Please try again.';
                elements.message.className = 'message error';
                state.attempts++;
                updateAttemptsWarning();
                
                if (state.attempts >= config.maxAttempts) {
                    elements.message.textContent = 'Maximum attempts reached. Please try again later.';
                    increaseAiDetectionScore(30, 'Maximum verification attempts reached');
                } else {
                    // Switch to a different method after failure
                    setTimeout(selectRandomMethod, 1500);
                }
            }
        }
        
        function updateAttemptsWarning() {
            if (state.attempts > 0) {
                elements.attemptsWarning.style.display = 'block';
                elements.attemptsWarning.textContent = 
                    `Attempts: ${state.attempts}/${config.maxAttempts}`;
                
                if (state.attempts >= config.maxAttempts - 1) {
                    elements.attemptsWarning.style.color = 'var(--danger)';
                } else if (state.attempts >= config.maxAttempts - 2) {
                    elements.attemptsWarning.style.color = 'var(--warning)';
                }
            } else {
                elements.attemptsWarning.style.display = 'none';
            }
        }
        
        function showLoadingAndRedirect() {
            elements.voiceCaptcha.style.display = 'none';
            elements.mathCaptcha.style.display = 'none';
            elements.imageCaptcha.style.display = 'none';
            elements.behaviorCaptcha.style.display = 'none';
            elements.message.style.display = 'none';
            elements.loadingContainer.style.display = 'flex';
            
            // Simulate additional checks for high detection scores
            let delay = 2000;
            if (state.aiDetectionScore > 20) {
                delay = 4000;
                elements.loadingText.textContent = 'Performing additional security checks...';
            }
            
            setTimeout(() => {
                window.location.href = config.successRedirect;
            }, delay);
        }
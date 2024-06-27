chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateModifier' || request.action === 'restartModifier') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.storage.sync.get({
                color_crit_fail: 'red',
                color_crit_suc: 'lawngreen',
                color_over_ten: 'turquoise',
                color_under_11: 'yellow',
                websocket_host: 'localhost:8765',
            }, function (settings) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    args: [settings],
                    function: (settings) => {
                        const targetSelectors = [
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.iSLwJv', // PF1 Abilities
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.bfEkfm', // PF1 Attacks
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.jwpVvh', // PF1 Skills, Init, Saves
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.kxURXE', // PF2 Abilities
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.bYdjKO', // PF2 Attacks
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.irWQEY', // PF2 Skills, Init, Saves
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.bYselo', // SF1 Abilities
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.dDKJNn', // SF1 Attacks
                            '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.dzPKSE', // SF1 Skills, Init, Saves
                            '.abilityMod',          // Pathbuilder 2e abilities
                            '.section-skill-total', // Pathbuilder 2e skills
                        ];
                        const DUPLICATE_CLASS = "duplicate";
                        const WS_PROTOCOL = "ws://";

                        let webSocket;
                        let randomAddition = 0;
                        let additionalData = "";
                        let refreshInterval = null;

                        // Function to connect (or reconnect) to WebSocket
                        function connectToWebSocket(settings) {
                            const wsAddress = WS_PROTOCOL + settings.websocket_host;
                            webSocket = new WebSocket(wsAddress);

                            webSocket.onopen = () => {
                                console.log('WebSocket connection opened');
                            };

                            webSocket.onmessage = (event) => {
                                try {
                                    const data = JSON.parse(event.data);
                                    randomAddition = parseInt(data.roll);
                                    additionalData = data.average;  // Store the additional data
                                    updateModifiers();
                                    duplicateAndUpdateSpecificElement();
                                } catch (error) {
                                    console.error('Error parsing WebSocket data:', error);
                                }
                            };

                            webSocket.onclose = (event) => {
                                console.warn('WebSocket connection closed:', event.code, event.reason);
                                // Try to reconnect after a delay
                                setTimeout(() => connectToWebSocket(settings), 3000); // 3 seconds
                            };

                            webSocket.onerror = (error) => {
                                console.error('WebSocket Error:', error);
                            };
                        }

                        function initialize() {
                            removeAllDuplicates();

                            targetSelectors.forEach(selector => {
                                const originalElements = document.querySelectorAll(selector);
                                originalElements.forEach(originalElement => {
                                    const shouldDuplicate = shouldDuplicateElement(originalElement);
                                    if (shouldDuplicate) {
                                        const duplicatedElement = originalElement.cloneNode(true);
                                        duplicatedElement.classList.add(DUPLICATE_CLASS);

                                        // Add margin only to duplicated <span> elements
                                        if (originalElement.tagName.toLowerCase() === 'span') {
                                            duplicatedElement.style.marginLeft = '10px';
                                        }

                                        originalElement.parentNode.insertBefore(duplicatedElement, originalElement.nextSibling);
                                        updateModifier(originalElement, duplicatedElement);
                                    }
                                });
                            });
                        }

                        // Remove all duplicates and re-initialize every second
                        function startRefreshCycle() {
                            refreshInterval = setInterval(() => {
                                initialize();
                                duplicateAndUpdateSpecificElement();
                            }, 250);
                        }

                        // --- INITIALIZATION ---
                        connectToWebSocket(settings); // Connect to WebSocket
                        startRefreshCycle();

                        // --- WEBSOCKET HANDLING ---
                        webSocket.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                randomAddition = parseInt(data.roll, 10);
                                additionalData = data.average;  // Store the additional data
                            } catch (error) {
                                console.error('Error parsing WebSocket data:', error);
                            }
                            updateModifiers();
                            duplicateAndUpdateSpecificElement();
                        };
                        webSocket.onerror = (error) => {
                            console.error('WebSocket Error:', error);
                        };

                        function updateModifiers() {
                            const duplicates = document.querySelectorAll(`.${DUPLICATE_CLASS}`);
                            duplicates.forEach(duplicatedElement => {
                                const originalElement = duplicatedElement.previousElementSibling;
                                updateModifier(originalElement, duplicatedElement);
                            });
                        }

                        // --- HELPER FUNCTIONS ---
                        function removeAllDuplicates() {
                            document.querySelectorAll(`.${DUPLICATE_CLASS}`).forEach(el => el.remove());
                        }

                        function extractOriginalModifiers(elements) {
                            return elements.map(element => {
                                const originalModifierText = element.textContent.trim();
                                if (originalModifierText.includes('/')) {
                                    return originalModifierText.split('/').map(modifier => {
                                        if (/^[-+]/.test(modifier)) {
                                            return modifier;
                                        }
                                        return null;
                                    }).filter(Boolean);
                                } else {
                                    return originalModifierText;
                                }
                            });
                        }

                        function shouldDuplicateElement(element) {
                            const originalModifierText = element.textContent.trim();
                            // Check if it's a number with + or -
                            return /^\s*[-+]?\d/.test(originalModifierText);
                        }

                        function updateModifier(originalElement, duplicatedElement) {
                            const originalModifiers = extractOriginalModifiers([originalElement])[0];

                            if (Array.isArray(originalModifiers)) {
                                const newModifiers = originalModifiers.map(mod => (mod ? parseInt(mod, 10) + randomAddition : null));
                                duplicatedElement.textContent = newModifiers.filter(Boolean).join('/');
                            } else {
                                const total = parseInt(originalModifiers, 10) + randomAddition;
                                duplicatedElement.textContent = total;
                            }

                            // Color Setting Logic (use settings argument)
                            if (randomAddition === 20) {
                                duplicatedElement.style.color = settings.color_crit_suc;
                            } else if (randomAddition === 1) {
                                duplicatedElement.style.color = settings.color_crit_fail;
                            } else if (randomAddition > 10) {
                                duplicatedElement.style.color = settings.color_over_ten;
                            } else if (randomAddition < 11) { 
                                duplicatedElement.style.color = settings.color_under_11;
                            }
                        }

                        // --- NEW FUNCTION FOR SPECIFIC SELECTOR ---
                        function duplicateAndUpdateSpecificElement() {
                            const selector = '#root > div.hl-app.App__StyledApp-lgxutJ.kwpiCl > div > div.AppView__MainPanel-hWBBRa.dolPlo > div > div > section > header > div > h1:nth-child(1)';
                            const originalElement = document.querySelector(selector);
                            if (originalElement) {
                                // Remove existing duplicate if present
                                const existingDuplicate = originalElement.parentNode.querySelector(`.${DUPLICATE_CLASS}`);
                                if (existingDuplicate) {
                                    existingDuplicate.remove();
                                }

                                // Duplicate the element
                                const duplicatedElement = originalElement.cloneNode(true);
                                duplicatedElement.classList.add(DUPLICATE_CLASS);
                                duplicatedElement.textContent = additionalData; // Update with additionalData

                                // Add margin only to duplicated <span> elements
                                if (originalElement.tagName.toLowerCase() === 'span') {
                                    duplicatedElement.style.marginLeft = '10px';
                                }

                                originalElement.parentNode.insertBefore(duplicatedElement, originalElement.nextSibling);
                            }
                        }

                        // --- SETTINGS UPDATE HANDLING ---
                        chrome.runtime.onMessage.addListener(function(request) {
                            if (request.action === "updateSettings") {
                                settings = request.settings;

                                // Close existing WebSocket connection before updating settings
                                if (webSocket) {
                                    webSocket.close();
                                }
                                connectToWebSocket(settings); // Reconnect with new settings
                                updateModifiers(); // Immediately apply new settings
                                duplicateAndUpdateSpecificElement();
                            }
                        });

                    },
                });
            });
        });
    }
});

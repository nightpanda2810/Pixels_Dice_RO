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
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.drdAYC', // PF1 Abilities
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.hvUvxy', // PF1 Attacks
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.dFkGBp', // PF1 Skills, Init, Saves
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.bUvLwz', // PF2 Abilities
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.Tqtwx' , // PF2 Attacks
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.eGkTiH', // PF2 Skills, Init, Saves
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.hgmlIU', // SF1 Abilities
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.hTUvrB', // SF1 Attacks
                          '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.dwNcYt', // SF1 Skills, Init, Saves
                          '.section-skill-total', // Pathbuilder 2e skills
                          '.abilityMod',          // Pathbuilder 2e abilities
                        ];
                        const DUPLICATE_CLASS = "duplicate";
                        const WS_PROTOCOL = "ws://";
  
                        let webSocket;
                        let randomAddition = 0;
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
                                  randomAddition = parseInt(event.data, 10);
                                  updateModifiers();
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
                            }, 250);
                        }
  
                        // --- INITIALIZATION ---
                          connectToWebSocket(settings); // Connect to WebSocket
                          startRefreshCycle();
  
                        // --- WEBSOCKET HANDLING ---
                        webSocket.onmessage = (event) => {
                            try {
                                randomAddition = parseInt(event.data, 10);
                            } catch (error) {
                                console.error('Error parsing WebSocket data:', error);
                            }
                            updateModifiers();
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
                          }
                      });
  
                    },
                });
            });
        });
    }
  });
  
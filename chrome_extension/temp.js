chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateModifier') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: () => {
                    const webSocket = new WebSocket('ws://localhost:8765');
                    const targetSelectors = [
                        '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.drdAYC',
                        '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.dFkGBp',
                        '.Item-gYKFub.jnsGWt.Text__StyledText-inVtPV.hvUvxy',
                    ];
                    const DUPLICATE_CLASS = "duplicate"; 
  
                    // --- DUPLICATION AND INITIALIZATION ---
                    let randomAddition = 0;
                    let refreshInterval = null;
  
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
                    initialize();
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
                        return /^[-+]?\d/.test(originalModifierText);
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
  
                        if (randomAddition === 1) {
                            duplicatedElement.style.color = 'red';
                          } else if (randomAddition === 20) {
                              duplicatedElement.style.color = 'lawngreen';
                          } else if (randomAddition > 10) {
                              duplicatedElement.style.color = 'turquoise';
                          } else if (randomAddition < 11) {
                              duplicatedElement.style.color = 'yellow';
                        }
                    }
                },
            });
        });
    }
  });
  
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

                        // --- SELECTION VARIABLES ---
                        const targetSelectors = [
                            'td.sc-iiUIRa.dEzMkq',                    // PF1/2 Abilities, Saves, Skills
                            'span.sc-kTUwUJ.fpuwiR.sc-jtRfpW.htdZow', // PF1 Attacks
                            'td.sc-iiUIRa.fOEbpe',                    // PF1 Performance Combat, CMB
                            'span.sc-kTUwUJ.fpuwiR.sc-jtRfpW.bPGWdS', // PF2 Attacks
                            'span.sc-kTUwUJ.fpuwiR.sc-jtRfpW.fuRnak', // SF1 Attacks
                            '.abilityMod',                            // Pathbuilder 2e abilities
                            '.section-skill-total',                   // Pathbuilder 2e skills
                        ];

                        const shouldDuplicateElement = (element) => {
                            const originalModifierText = element.textContent.trim();

                            // Exclude elements containing specific keywords
                            if (/\b(lbs|gp|sp|cp|bulk|Light|Medium|Heavy|KAC)\b/.test(originalModifierText)) {
                                return false;
                            }

                            // Only duplicate if it contains a +, -, or /. (/ is included due to Maneuvers not lining up properly if not duplicated, even though blank.)
                            return /[+\-/]/.test(originalModifierText);
                        };

                        const DUPLICATE_CLASS = "duplicate";
                        const WS_PROTOCOL = "ws://";

                        let webSocket;
                        let randomAddition = 0;
                        let additionalData = "";
                        let refreshInterval = null;

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
                                    additionalData = data.average;
                                    updateModifiers();
                                    duplicateAndUpdateSpecificElement();
                                } catch (error) {
                                    console.error('Error parsing WebSocket data:', error);
                                }
                            };

                            webSocket.onclose = (event) => {
                                console.warn('WebSocket connection closed:', event.code, event.reason);
                                setTimeout(() => connectToWebSocket(settings), 3000);
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
                                    if (shouldDuplicateElement(originalElement)) {
                                        const duplicatedElement = originalElement.cloneNode(true);
                                        duplicatedElement.classList.add(DUPLICATE_CLASS);

                                        if (originalElement.tagName.toLowerCase() === 'span') {
                                            duplicatedElement.style.marginLeft = '10px';
                                        }

                                        originalElement.parentNode.insertBefore(duplicatedElement, originalElement.nextSibling);
                                        updateModifier(originalElement, duplicatedElement);
                                    }
                                });
                            });
                        }

                        function startRefreshCycle() {
                            refreshInterval = setInterval(() => {
                                initialize();
                                duplicateAndUpdateSpecificElement();
                            }, 250);
                        }

                        connectToWebSocket(settings);
                        startRefreshCycle();

                        webSocket.onmessage = (event) => {
                            try {
                                const data = JSON.parse(event.data);
                                randomAddition = parseInt(data.roll, 10);
                                additionalData = data.average;
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

                        function updateModifier(originalElement, duplicatedElement) {
                            const originalModifiers = extractOriginalModifiers([originalElement])[0];

                            if (Array.isArray(originalModifiers)) {
                                const newModifiers = originalModifiers.map(mod => (mod ? parseInt(mod, 10) + randomAddition : null));
                                duplicatedElement.textContent = newModifiers.filter(Boolean).join('/');
                            } else {
                                const total = parseInt(originalModifiers, 10) + randomAddition;
                                duplicatedElement.textContent = total;
                            }

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

                        function duplicateAndUpdateSpecificElement() {
                            const selector = '#root > div.hl-app.App__StyledApp-lgxutJ.kwpiCl > div > div.AppView__MainPanel-hWBBRa.dolPlo > div > div > section > header > div > h1:nth-child(1)';
                            const originalElement = document.querySelector(selector);
                            if (originalElement) {
                                const existingDuplicate = originalElement.parentNode.querySelector(`.${DUPLICATE_CLASS}`);
                                if (existingDuplicate) {
                                    existingDuplicate.remove();
                                }

                                const duplicatedElement = originalElement.cloneNode(true);
                                duplicatedElement.classList.add(DUPLICATE_CLASS);
                                duplicatedElement.textContent = additionalData;

                                if (originalElement.tagName.toLowerCase() === 'span') {
                                    duplicatedElement.style.marginLeft = '10px';
                                }

                                originalElement.parentNode.insertBefore(duplicatedElement, originalElement.nextSibling);
                            }
                        }

                        chrome.runtime.onMessage.addListener(function(request) {
                            if (request.action === "updateSettings") {
                                settings = request.settings;

                                if (webSocket) {
                                    webSocket.close();
                                }
                                connectToWebSocket(settings);
                                updateModifiers();
                                duplicateAndUpdateSpecificElement();
                            }
                        });

                    },
                });
            });
        });
    }
});

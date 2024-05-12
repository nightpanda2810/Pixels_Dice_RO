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
                      removeAllDuplicates(); // Remove any existing duplicates

                      targetSelectors.forEach(selector => {
                          const originalElements = document.querySelectorAll(selector);
                          originalElements.forEach(originalElement => {
                              const duplicatedElement = originalElement.cloneNode(true);
                              duplicatedElement.classList.add(DUPLICATE_CLASS);
                              originalElement.parentNode.insertBefore(duplicatedElement, originalElement.nextSibling);
                              updateModifier(originalElement, duplicatedElement);
                          });
                      });
                  }

                  // Remove all duplicates and re-initialize every second
                  function startRefreshCycle() {
                      refreshInterval = setInterval(() => {
                          initialize(); // Re-initialize every second
                      }, 250); // 1000 milliseconds = 1 second
                  }

                  // --- INITIALIZATION ---
                  initialize();
                  startRefreshCycle(); // Start the refresh cycle

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
                          const originalElement = duplicatedElement.previousElementSibling; // Get the original element before the duplicate
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
                              return originalModifierText.split('/').map(modifier => parseInt(modifier, 10) || 0);
                          } else if (/^[-+]?\d{1,2}$/.test(originalModifierText)) {
                              return parseInt(originalModifierText, 10);
                          } else {
                              return 0;
                          }
                      });
                  }

                  function updateModifier(originalElement, duplicatedElement) {
                      const originalModifier = extractOriginalModifiers([originalElement])[0];

                      if (Array.isArray(originalModifier)) {
                          const newModifiers = originalModifier.map(mod => mod + randomAddition);
                          duplicatedElement.textContent = newModifiers.join('/');
                      } else {
                          const total = originalModifier + randomAddition;
                          duplicatedElement.textContent = total;
                      }

                      if (randomAddition === 1) {
                          duplicatedElement.style.color = 'red';
                      } else if (randomAddition === 20) {
                          duplicatedElement.style.color = 'green';
                      } else {
                          duplicatedElement.style.color = 'yellow';
                      }
                  }
              },
          });
      });
  }
});

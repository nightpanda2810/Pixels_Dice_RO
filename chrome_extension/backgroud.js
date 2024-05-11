chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateModifier') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          const webSocket = new WebSocket('ws://localhost:8765');

          // Function to find and duplicate elements with the pattern
          function duplicateElementsByPattern() {
            const duplicatedElements = [];
            const allElements = document.querySelectorAll('*'); // Select all elements

            allElements.forEach(element => {
              const content = element.textContent.trim();
              if (/^[+-]\d+$/.test(content)) { // Check for "+/-[number]" pattern
                const duplicatedElement = element.cloneNode(true);
                element.parentNode.insertBefore(duplicatedElement, element.nextSibling);
                duplicatedElements.push(duplicatedElement);
              }
            });

            return duplicatedElements;
          }

          const duplicatedElements = duplicateElementsByPattern();
          let randomAddition = 0;

          function updateModifiers() {
            duplicatedElements.forEach(duplicatedElement => {
              if (duplicatedElement) {
                const originalModifier = parseInt(duplicatedElement.previousSibling.textContent.trim(), 10);
                const total = originalModifier + randomAddition;

                duplicatedElement.textContent = total;

                if (randomAddition === 1) {
                  duplicatedElement.style.color = 'red';
                } else if (randomAddition === 20) {
                  duplicatedElement.style.color = 'green';
                } else {
                  duplicatedElement.style.color = 'yellow';
                }
              }
            });
          }

          webSocket.onmessage = (event) => {
            try {
              randomAddition = parseInt(event.data, 10);
            } catch (error) {
              console.error('Error parsing WebSocket data:', error);
            }
            updateModifiers();
          };

          webSocket.onopen = updateModifiers;
        },
      });
    });
  }
});
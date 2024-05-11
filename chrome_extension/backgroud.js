chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateModifier') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: () => {
                  const webSocket = new WebSocket('ws://localhost:8765');

                  // Function to duplicate elements (your existing code)
                  function duplicateElements() {
                      const duplicatedElements = [];
                      for (let i = 1; i <= 6; i++) {
                        const originalElement = document.querySelector(
                          `#Sheet-character > div._content.Block__BlockContentWrapper-hnqvHr.iHYrAI > div > div:nth-child(2) > div > div._content.Block__BlockContentWrapper-hnqvHr.iHYrAI > div > div > div > div > table > tbody > tr:nth-child(${i}) > td.TableCell__StyledTableCell-dTHafv.gXTTrb > div > div`
                        );
                        if (originalElement) {
                          const duplicatedElement = originalElement.cloneNode(true); 
                          originalElement.parentNode.insertBefore(duplicatedElement, originalElement.nextSibling);
                          duplicatedElements.push(duplicatedElement);
                        }
                      }
                      return duplicatedElements;
                    }

                  const duplicatedElements = duplicateElements();
                  let randomAddition = 0; 

                  function updateModifiers() {
                      duplicatedElements.forEach((duplicatedElement, index) => {
                          const originalElement = document.querySelector(
                              `#Sheet-character  > div._content.Block__BlockContentWrapper-hnqvHr.iHYrAI  > div  > div:nth-child(2)  > div  > div._content.Block__BlockContentWrapper-hnqvHr.iHYrAI  > div  > div  > div  > div  > table  > tbody  > tr:nth-child(${index + 1
                              })  > td.TableCell__StyledTableCell-dTHafv.gXTTrb  > div  > div`
                            );

                          if (originalElement && duplicatedElement) {
                              const originalModifier = parseInt(originalElement.textContent, 10);
                              const total = originalModifier + randomAddition;

                              // Update text content and color (your existing code)
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
                          console.error("Error parsing WebSocket data:", error);
                      }
                      updateModifiers(); 
                  };

                  webSocket.onopen = updateModifiers; 
              }
          });
      });
  }
});

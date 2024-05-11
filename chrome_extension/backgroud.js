chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateModifier') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            // Function to duplicate and return an array of duplicated elements
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
  
            // Duplicate the elements once on initialization
            const duplicatedElements = duplicateElements();
            // const randomAddition = Math.floor(Math.random() * 20) + 1;
            
            function updateModifiers() {
              const randomAddition = Math.floor(Math.random() * 20) + 1;
              duplicatedElements.forEach((duplicatedElement, index) => {
                const originalElement = document.querySelector(
                  `#Sheet-character  > div._content.Block__BlockContentWrapper-hnqvHr.iHYrAI  > div  > div:nth-child(2)  > div  > div._content.Block__BlockContentWrapper-hnqvHr.iHYrAI  > div  > div  > div  > div  > table  > tbody  > tr:nth-child(${index + 1
                  })  > td.TableCell__StyledTableCell-dTHafv.gXTTrb  > div  > div`
                );
                
                if (originalElement && duplicatedElement) {
                  const originalModifier = parseInt(originalElement.textContent, 10);
                  const total = originalModifier + randomAddition;
                  
                  // Update the text content and color based on the random addition value
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
            
                console.log(`Random addition for element:`, randomAddition);
            }
  
            setInterval(updateModifiers, 1000);
          }
        });
      });
    }
  });
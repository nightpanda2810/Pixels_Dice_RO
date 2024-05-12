// Default Settings (including WebSocket host)
const defaultSettings = {
    color_under_11: '#FFFF00',
    color_over_ten: '#40E0D0',
    color_crit_fail: '#FF0000',
    color_crit_suc: '#7CFC00',
    websocket_host: 'localhost:8765' // Default WebSocket host/port
  };
  
  // Load saved settings
  chrome.storage.sync.get(defaultSettings, function(settings) {
    document.getElementById('color_under_11').value = settings.color_under_11;
    document.getElementById('color_over_ten').value = settings.color_over_ten;
    document.getElementById('color_crit_fail').value = settings.color_crit_fail;
    document.getElementById('color_crit_suc').value = settings.color_crit_suc;
    document.getElementById('websocket_host').value = settings.websocket_host;
  
    // Add event listeners *after* settings are loaded
    addSaveListener(settings);
    addResetListener();
  });
  
  // Separate function to add the save event listener
  function addSaveListener(currentSettings) {
    document.getElementById('save').addEventListener('click', () => {
      const newSettings = {
        color_under_11: document.getElementById('color_under_11').value,
        color_over_ten: document.getElementById('color_over_ten').value,
        color_crit_fail: document.getElementById('color_crit_fail').value,
        color_crit_suc: document.getElementById('color_crit_suc').value,
        websocket_host: document.getElementById('websocket_host').value
      };
  
      chrome.storage.sync.set(newSettings, function() {
        // Update the current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'updateSettings', settings: newSettings});
        });
        // Close the popup (optional)
        // window.close(); 
      });
    });
  }
  
  // Separate function to add the reset event listener
  function addResetListener() {
    document.getElementById('reset').addEventListener('click', () => {
      chrome.storage.sync.set(defaultSettings, function() {
        // Update the input fields with the default values
        for (const [key, value] of Object.entries(defaultSettings)) {
          document.getElementById(key).value = value;
        }
        // Show a message confirming reset
        let message = document.getElementById('reset-message');
        message.textContent = "Settings reset to defaults!";
        setTimeout(() => { message.textContent = ""; }, 3000); // Clear message after 3 seconds
  
        // Update the current tab (send a message to content.js)
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'updateModifier' });
        });
      });
    });
  }
  
document.getElementById('paint').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // This runs in the page
      const color = '#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0');
      document.documentElement.style.transition = 'background 150ms ease';
      document.documentElement.style.background = color;
      console.log('Painted page with', color);
    }
  });
  window.close();
});

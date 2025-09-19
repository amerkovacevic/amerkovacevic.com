// Optional example: add a context menu that logs the page title
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'log-title',
    title: 'Log page title to console',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'log-title' && tab.id) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => console.log('Page title is:', document.title)
    });
  }
});

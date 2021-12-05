browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'confirm':
      sendResponse(confirm(message.body));
      return
  }
});

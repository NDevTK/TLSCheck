browser.runtime.onMessage.addListener((message, sender) => {
  switch (message.type) {
    case 'confirm':
      confirm(message.body);
      break
  }
});

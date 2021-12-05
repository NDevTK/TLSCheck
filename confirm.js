"use strict";

browser.runtime.onMessage.addListener(message => {
  switch (message.type) {
    case 'confirm':
      return Promise.resolve(confirm(message.body));
  }
});

browser.webRequest.onHeadersReceived.addListener(response => {
  let info = browser.webRequest.getSecurityInfo(response.requestId, {certificateChain: true});
  if (info.state !== "secure") return
  let root = info.certificates[info.certificates.length - 1].fingerprint.sha256;
  let host = new URL(response.url).host;
  let check = browser.storage.local.get(host)[host];
  if (check === undefined) {
    browser.storage.local.set({host, root});
  } else if (check !== root) {
    if (confirm('CA change for host: ' + host) === true) {
      browser.storage.local.set({host, root});
    } else {
      return {cancel: true};
    }
  }
}, {urls: ['<all_urls>']}, ['blocking']);

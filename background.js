"use strict";

browser.webRequest.onHeadersReceived.addListener(async response => {
  let info = await browser.webRequest.getSecurityInfo(response.requestId, {certificateChain: true});
  if (info.state !== "secure") return
  let rootInfo = info.certificates[info.certificates.length - 1];
  let root = await sha256(rootInfo.fingerprint.sha256);
  let host = new URL(response.url).host;
  let hostHashed = await sha256(host);
  let check = await browser.storage.local.get(hostHashed);
  check = check[hostHashed];
  if (check === undefined) {
    await browser.storage.local.set({[hostHashed]: root});
  } else if (check !== root) {
    if (await confirm('CA for ' + host + ' changed to ' + rootInfo.issuer) === true) {
      await browser.storage.local.set({[hostHashed]: root});
    } else {
      return {cancel: true};
    }
  }
}, {urls: ['<all_urls>']}, ['blocking']);

async function sha256(data) {
    const msgUint8 = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function confirm(message) {
  let popup = await browser.windows.create({type: 'popup', url: "confirm.html"});
  await new Promise(resolve => setTimeout(resolve, 100));
  let result = await browser.tabs.sendMessage(popup.tabs[0].id, message);
  browser.windows.remove(popup.id);
  return result;
}

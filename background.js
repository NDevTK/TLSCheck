async function sha256(data) {
    const msgUint8 = new TextEncoder().encode(data + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

browser.webRequest.onHeadersReceived.addListener(async response => {
  let info = await browser.webRequest.getSecurityInfo(response.requestId, {certificateChain: true});
  if (info.state !== "secure") return
  let root = info.certificates[info.certificates.length - 1].fingerprint.sha256;
  let host = new URL(response.url).host;
  let hostHashed = await sha256(host);
  let check = await browser.storage.local.get(hostHashed)[hostHashed];
  if (check === undefined) {
    await browser.storage.local.set({hostHashed, root});
  } else if (check !== root) {
    if (confirm('CA change for host: ' + host) === true) {
      await browser.storage.local.set({hostHashed, root});
    } else {
      return {cancel: true};
    }
  }
}, {urls: ['<all_urls>']}, ['blocking']);

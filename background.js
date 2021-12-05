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



let salt = browser.storage.local.get("salt")["salt"] ?? generateRandom(50);
browser.storage.local.set({'salt', salt});


function generateRandom(length) {
    let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    if (window.crypto && window.crypto.getRandomValues) {
        let values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    } else {
        for (let i = 0; i < length; i++) {
            result += charset[Math.floor(Math.random() * charset.length)];
        }
        return result;
    }
}

async function sha256(data) {
    const msgUint8 = new TextEncoder().encode(data + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

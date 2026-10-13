// Bolo bridge: links the Bolo panel in the Word app to a Bolo tab in a real browser (Edge/Chrome),
// which has a speech service the Word app lacks. The two pages talk over a direct peer-to-peer
// WebRTC data channel on this computer. A public relay (ntfy.sh) carries only the one-time
// handshake, encrypted with a key that travels in the link itself (after the #), never to a server.
(() => {
  const RELAY = 'https://ntfy.sh/';
  const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  const te = new TextEncoder(), td = new TextDecoder();

  const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const randHex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');

  async function squeeze(bytes, mode) {
    if (!('CompressionStream' in window)) return bytes;
    const S = mode === 'in' ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw');
    const out = new Response(new Blob([bytes]).stream().pipeThrough(S));
    return new Uint8Array(await out.arrayBuffer());
  }
  const importKey = (raw) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function seal(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = await squeeze(te.encode(JSON.stringify(obj)), 'in');
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
    const all = new Uint8Array(iv.length + ct.length); all.set(iv); all.set(ct, iv.length);
    return b64u(all);
  }
  async function open(key, text) {
    const all = unb64u(text.trim());
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, key, all.slice(12));
    return JSON.parse(td.decode(await squeeze(new Uint8Array(plain), 'out')));
  }

  async function post(topic, text) {
    // A plain text POST with no custom headers is a "simple" request, so the browser sends it directly.
    const r = await fetch(RELAY + topic, { method: 'POST', body: text });
    if (!r.ok) throw new Error('relay ' + r.status);
  }
  // Wait for the newest message on a topic (polling keeps us well inside the relay's rate limits).
  async function wait(topic, { timeout = 180000, every = 2500, signal } = {}) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (signal && signal.aborted) throw new Error('cancelled');
      try {
        const r = await fetch(RELAY + topic + '/json?poll=1&since=all', { cache: 'no-store' });
        if (r.ok) {
          const lines = (await r.text()).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } })
            .filter((m) => m && m.event === 'message' && m.message);
          if (lines.length) return lines[lines.length - 1].message;
        }
      } catch {}
      await new Promise((ok) => setTimeout(ok, every));
    }
    throw new Error('timed out');
  }
  function gathered(pc, ms = 4000) {
    return new Promise((ok) => {
      if (pc.iceGatheringState === 'complete') return ok();
      const t = setTimeout(ok, ms);
      pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); ok(); } });
    });
  }

  // ---- Word panel side: create the link, return the browser URL to open ----
  async function host({ pageUrl, onOpen, onMessage, onClose, signal }) {
    const room = 'bolo-' + randHex(12);
    const raw = crypto.getRandomValues(new Uint8Array(16));
    const key = await importKey(raw);
    const pc = new RTCPeerConnection(ICE);
    const dc = pc.createDataChannel('bolo', { ordered: true });
    dc.onopen = () => onOpen && onOpen(dc);
    dc.onmessage = (e) => { try { onMessage && onMessage(JSON.parse(e.data)); } catch {} };
    dc.onclose = () => onClose && onClose();
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) onClose && onClose(); };
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    await post(room + '-o', await seal(key, pc.localDescription.toJSON()));
    const url = new URL(pageUrl); url.hash = 'room=' + room + '&k=' + b64u(raw);
    const answered = (async () => {
      const ans = await open(key, await wait(room + '-a', { signal }));
      await pc.setRemoteDescription(ans);
    })();
    return { url: url.href, pc, dc, answered };
  }

  // ---- browser side: join the link described in location.hash ----
  async function join({ onOpen, onMessage, onClose }) {
    const h = new URLSearchParams(location.hash.slice(1));
    const room = h.get('room'), k = h.get('k');
    if (!room || !k) throw new Error('no link');
    const key = await importKey(unb64u(k));
    const offer = await open(key, await wait(room + '-o', { timeout: 30000, every: 1500 }));
    const pc = new RTCPeerConnection(ICE);
    pc.ondatachannel = (e) => {
      const dc = e.channel;
      dc.onopen = () => onOpen && onOpen(dc);
      dc.onmessage = (ev) => { try { onMessage && onMessage(JSON.parse(ev.data)); } catch {} };
      dc.onclose = () => onClose && onClose();
    };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) onClose && onClose(); };
    await pc.setRemoteDescription(offer);
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    await post(room + '-a', await seal(key, pc.localDescription.toJSON()));
    // Take the handshake out of the address bar so it isn't bookmarked or shared by accident.
    try { history.replaceState(null, '', location.pathname + location.search); } catch {}
    return pc;
  }

  const isLinkPage = () => /(^|&)room=/.test(location.hash.slice(1));
  window.BoloBridge = { host, join, isLinkPage, _seal: seal, _open: open, _importKey: importKey, RELAY };
})();

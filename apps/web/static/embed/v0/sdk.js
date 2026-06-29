/*!
 * Blento Embed SDK — protocol v0
 *
 * Loaded by third-party iframes hosted inside a Blento page (e.g. atmo.rsvp event embeds).
 * Exposes window.Blento, which talks to the parent Blento window via postMessage.
 * The parent forwards authenticated AT Proto writes to the user's PDS using the visitor's
 * Blento session — no tokens or cookies are exposed to the iframe.
 *
 * ─── Wire protocol (iframe → parent) ─────────────────────────────────────────
 *   { v: 0, id, type: 'hello' }
 *   { v: 0, id, type: 'getSession' }
 *   { v: 0, id, type: 'createRecord', payload: { collection, rkey?, record } }
 *   { v: 0, id, type: 'putRecord',    payload: { collection, rkey, record } }
 *   { v: 0, id, type: 'deleteRecord', payload: { collection, rkey } }
 *   { v: 0, id, type: 'applyWrites',  payload: { writes, validate? } }
 *   { v: 0, id, type: 'uploadBlob',   payload: { bytes: number[], mimeType } }
 *   { v: 0,     type: 'blento:resize',      heightPx }
 *   { v: 0,     type: 'blento:navigate',    url }
 *   { v: 0,     type: 'blento:promptLogin' }
 *   { v: 0,     type: 'blento:notify',      name, payload? }
 *
 * ─── Wire protocol (parent → iframe) ─────────────────────────────────────────
 *   { v: 0, type: 'ready', session }                      // sent once after handshake
 *   { v: 0, type: 'session', session }                    // on session change
 *   { v: 0, id, ok: true,  result }                       // response to a request
 *   { v: 0, id, ok: false, error: { code, message } }     // error response
 *
 * ─── Session shape ───────────────────────────────────────────────────────────
 *   { did, handle, displayName?, avatar?, pdsUrl } | null
 *
 * ─── BlobRef shape (returned by uploadBlob) ──────────────────────────────────
 *   { $type: 'blob', ref: { $link: string }, mimeType: string, size: number }
 *
 * ─── Write shape (applyWrites payload) ───────────────────────────────────────
 *   { $type: 'create', collection, rkey?, value }
 *   { $type: 'update', collection, rkey,  value }
 *   { $type: 'delete', collection, rkey }
 *
 * ─── Theme (URL params on iframe src) ────────────────────────────────────────
 *   ?base=stone&accent=pink&dark=1&did=did:plc:...
 *   - base:   one of Tailwind's neutral palettes (gray, stone, zinc, neutral, slate)
 *   - accent: one of Tailwind's vivid palettes (red, pink, blue, …)
 *   - dark:   '1' if parent is in dark mode, '0' or absent otherwise
 *   - did:    visitor's DID (same value getSession() will report after ready)
 *
 * ─── Error codes ─────────────────────────────────────────────────────────────
 *   no_session | user_cancelled | rate_limited | pds_error
 *   unsupported | invalid_request | unknown
 */
(function () {
	'use strict';

	if (typeof window === 'undefined') return;
	if (window.Blento) return;

	var PROTOCOL_VERSION = 0;
	var READY_TIMEOUT_MS = 10000;
	var ERROR_CODES = [
		'no_session',
		'user_cancelled',
		'rate_limited',
		'pds_error',
		'unsupported',
		'invalid_request',
		'unknown'
	];

	function BlentoError(code, message, cause) {
		var err = new Error(message || code);
		err.name = 'BlentoError';
		err.code = ERROR_CODES.indexOf(code) >= 0 ? code : 'unknown';
		if (cause !== undefined) err.cause = cause;
		Object.setPrototypeOf(err, BlentoError.prototype);
		return err;
	}
	BlentoError.prototype = Object.create(Error.prototype);
	BlentoError.prototype.constructor = BlentoError;

	var params = new URLSearchParams(window.location.search);
	var theme = Object.freeze({
		base: params.get('base'),
		accent: params.get('accent'),
		dark: params.get('dark') === '1'
	});

	var session = null;
	var sessionListeners = new Set();
	var pending = new Map();
	var nextId = 1;

	var readyResolve, readyReject;
	var ready = new Promise(function (resolve, reject) {
		readyResolve = resolve;
		readyReject = reject;
	});
	var readySettled = false;
	function settleReady(ok, value) {
		if (readySettled) return;
		readySettled = true;
		if (ok) readyResolve(value);
		else readyReject(value);
	}

	function sendToParent(msg) {
		try {
			window.parent.postMessage(msg, '*');
		} catch (e) {
			/* parent may be gone */
		}
	}

	function call(type, payload) {
		return new Promise(function (resolve, reject) {
			var id = 'r' + nextId++;
			pending.set(id, { resolve: resolve, reject: reject });
			sendToParent({ v: PROTOCOL_VERSION, id: id, type: type, payload: payload });
		});
	}

	function notifySessionListeners() {
		sessionListeners.forEach(function (cb) {
			try {
				cb(session);
			} catch (e) {
				/* swallow */
			}
		});
	}

	function handleMessage(ev) {
		if (ev.source !== window.parent) return;
		var data = ev.data;
		if (!data || typeof data !== 'object') return;
		if (data.v !== PROTOCOL_VERSION) return;

		if (data.type === 'ready') {
			session = data.session || null;
			settleReady(true);
			return;
		}

		if (data.type === 'session') {
			session = data.session || null;
			notifySessionListeners();
			return;
		}

		if (data.id && pending.has(data.id)) {
			var entry = pending.get(data.id);
			pending.delete(data.id);
			if (data.ok) {
				entry.resolve(data.result);
			} else {
				var err = data.error || {};
				entry.reject(new BlentoError(err.code, err.message));
			}
		}
	}

	window.addEventListener('message', handleMessage);

	function on(event, cb) {
		if (event !== 'session') {
			throw new BlentoError('unsupported', 'Unknown event: ' + event);
		}
		sessionListeners.add(cb);
		return function () {
			sessionListeners.delete(cb);
		};
	}

	function uploadBlob(blob, opts) {
		var mimeType = (opts && opts.mimeType) || blob.type || 'application/octet-stream';
		return blob.arrayBuffer().then(function (buffer) {
			var bytes = Array.from(new Uint8Array(buffer));
			return call('uploadBlob', { bytes: bytes, mimeType: mimeType });
		});
	}

	var Blento = {
		ready: ready,
		getTheme: function () {
			return { base: theme.base, accent: theme.accent, dark: theme.dark };
		},
		getSession: function () {
			return session;
		},
		on: on,
		createRecord: function (opts) {
			return call('createRecord', opts);
		},
		putRecord: function (opts) {
			return call('putRecord', opts);
		},
		deleteRecord: function (opts) {
			return call('deleteRecord', opts);
		},
		applyWrites: function (opts) {
			return call('applyWrites', opts);
		},
		uploadBlob: uploadBlob,
		notifyResize: function (heightPx) {
			sendToParent({ v: PROTOCOL_VERSION, type: 'blento:resize', heightPx: heightPx });
		},
		notifyNavigate: function (url) {
			sendToParent({ v: PROTOCOL_VERSION, type: 'blento:navigate', url: url });
		},
		promptLogin: function () {
			sendToParent({ v: PROTOCOL_VERSION, type: 'blento:promptLogin' });
		},
		notify: function (name, payload) {
			if (typeof name !== 'string' || !name) {
				throw new BlentoError('invalid_request', 'notify(name): name must be a non-empty string');
			}
			sendToParent({ v: PROTOCOL_VERSION, type: 'blento:notify', name: name, payload: payload });
		}
	};

	Object.freeze(Blento);

	Object.defineProperty(window, 'Blento', {
		value: Blento,
		writable: false,
		configurable: false
	});

	sendToParent({ v: PROTOCOL_VERSION, type: 'hello' });

	setTimeout(function () {
		if (!readySettled) {
			settleReady(
				false,
				new BlentoError(
					'unknown',
					'Blento parent did not respond within ' + READY_TIMEOUT_MS + 'ms'
				)
			);
		}
	}, READY_TIMEOUT_MS);
})();

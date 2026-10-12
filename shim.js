/*
 * shim.js - static stand-in for the dashboard's server calls.
 *
 * The page talks to its backend through google.script.run.withSuccessHandler(fn)
 * .withFailureHandler(fn).<function>(...). This file recreates exactly that call shape and
 * answers from the synthetic JSON files in ./data, so the real page code runs unchanged on a
 * static host. Read functions return the payloads the backend would have produced.
 * Write functions only change an in-memory copy and tell the user nothing is persisted.
 */
(function (global) {
  'use strict';

  var cache = {};
  function getJSON(name) {
    return fetch('data/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Could not load data/' + name + '.json (' + r.status + ')');
      return r.json();
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var ready = Promise.all([getJSON('dashboard'), getJSON('analytics'), getJSON('kontribusi'),
    getJSON('peta'), getJSON('i18n_data')]).then(function (a) {
    cache.dashboard = a[0]; cache.analytics = a[1]; cache.kontribusi = a[2]; cache.peta = a[3];
    if (global.I18N) global.I18N.addDict(a[4]);
  }).catch(function (e) {
    if (global.console) console.error('[demo] ' + e.message + '. Serve this folder over http (python -m http.server); file:// blocks fetch().');
    throw e;
  });

  /* ------------------------------------------------------------------ helpers */
  function listFor(sheet) {
    var d = cache.dashboard;
    if (sheet === 'PELAKU USAHA') return d.investment_monitoring.master_data;
    if (sheet === 'RAPAT INVESTASI') return d.pks_updates.unit_inv;
    if (sheet === 'RAPAT ADENDUM') return d.pks_updates.adendum_rapat;
    return null;
  }
  function companyKey(name) {
    var x = String(name || '').toLowerCase().trim().replace(/\s+/g, ' ');
    x = x.replace(/\s+[0-9]+[a-c]?$/i, '').replace(/\([^)]*\)/g, ' ').replace(/[.,;:'"]/g, ' ');
    return x.replace(/\b(pt|ptn|cv|tbk|persero|yayasan)\b/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function findKey(rec, key) {
    if (key in rec) return key;
    var low = String(key).toLowerCase().trim();
    return Object.keys(rec).filter(function (k) { return k.toLowerCase().trim() === low; })[0] || null;
  }
  function demoToast() {
    setTimeout(function () {
      if (typeof global.showToast === 'function' && global.I18N) global.showToast(global.I18N.tr('Mode demo — perubahan tidak disimpan'));
    }, 420);
  }
  function applyChanges(rec, map) {
    Object.keys(map || {}).forEach(function (k) {
      var key = findKey(rec, k);
      if (key) rec[key] = map[k];
    });
    var nameKey = Object.keys(rec).filter(function (k) { return k.toLowerCase().indexOf('nama pelaku usaha') !== -1; })[0];
    if (nameKey && rec[nameKey]) { rec._nameKey = companyKey(rec[nameKey]); rec._companyKey = 'N:' + rec._nameKey; }
  }

  /* ------------------------------------------------------------------ API */
  var API = {
    getDashboardData: function () { return clone(cache.dashboard); },
    getAnalyticsData: function () { return clone(cache.analytics); },
    getKontribusiData: function () { return clone(cache.kontribusi); },

    daftarPeta: function (jenis) {
      jenis = jenis === 'Internal' ? 'Internal' : 'Eksternal';
      return { ok: true, jenis: jenis, files: clone(cache.peta[jenis]), folderDiatur: true, bisaUnggah: false };
    },
    ambilPeta: function (id) {
      var kind = /internal/.test(id) ? 'internal' : 'external';
      var lang = global.I18N ? global.I18N.getLang() : 'en';
      return fetch('assets/map-' + kind + '.' + lang + '.svg').then(function (r) { return r.text(); }).then(function (txt) {
        return { success: true, id: id, name: 'demo-map-' + kind + '.svg', mimeType: 'image/svg+xml',
          base64: btoa(unescape(encodeURIComponent(txt))), size: txt.length };
      });
    },

    updateInvestorSynced: function (sheet, row, map) {
      var rec = (listFor(sheet) || []).filter(function (r) { return r._sheetRowIndex === row; })[0];
      if (!rec) return 'Error: Invalid row index';
      applyChanges(rec, map); demoToast(); return 'Success';
    },
    editInvestorSynced: function (sheet, row, oldName, map) { return API.updateInvestorSynced(sheet, row, map); },
    addInvestorSynced: function (sheet, data) {
      var list = listFor(sheet);
      if (!list) return 'Error: Sheet not found';
      var tpl = list[0] || {}, rec = {};
      Object.keys(tpl).forEach(function (k) { rec[k] = (typeof tpl[k] === 'boolean') ? false : null; });
      rec._sheetRowIndex = list.reduce(function (m, r) { return Math.max(m, r._sheetRowIndex || 0); }, 1) + 1;
      rec._kodeId = '';
      applyChanges(rec, data);
      list.push(rec); demoToast(); return 'Success';
    },
    deleteInvestor: function (sheet, row) {
      var list = listFor(sheet);
      if (!list) return 'Error: Sheet not found';
      var i = list.findIndex(function (r) { return r._sheetRowIndex === row; });
      if (i < 0) return 'Error: Invalid row index';
      list.splice(i, 1); demoToast(); return 'Success';
    },
    addRapatPks: function (p) {
      var list = listFor(p.sheetName);
      if (!list) return { ok: false, message: 'Unknown sheet' };
      var tpl = list[0] || {}, rec = {};
      Object.keys(tpl).forEach(function (k) { rec[k] = (typeof tpl[k] === 'boolean') ? false : null; });
      rec._sheetRowIndex = list.reduce(function (m, r) { return Math.max(m, r._sheetRowIndex || 0); }, 1) + 1;
      rec['Tanggal Rapat'] = p.tanggal; rec['Agenda'] = p.agenda; rec['Progres'] = p.progres; rec['PIC'] = p.pic;
      rec['Mitra'] = p.mitra; rec['Deskripsi Singkat'] = p.deskripsi; rec['Case'] = p.caseNotes; rec['Notulen'] = p.notulen === true;
      rec._nameKey = companyKey(p.mitra); rec._kodeId = p.kode || ''; rec._companyKey = 'N:' + rec._nameKey;
      list.push(rec); demoToast();
      return { ok: true, sheetName: p.sheetName };
    }
  };

  /* ------------------------------------------------------------------ google.script.run clone */
  function run(name, args, ok, fail) {
    ready.then(function () {
      return new Promise(function (res) { setTimeout(res, 70 + Math.random() * 90); });   // feel like a round trip
    }).then(function () {
      if (typeof API[name] !== 'function') throw new Error(name + ' is not available in the static demo');
      return API[name].apply(null, args);
    }).then(function (result) {
      if (ok) ok(result);
    }, function (err) {
      if (fail) fail(err); else if (global.console) console.error(err);
    });
  }
  function runner(ok, fail) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (fn) { return runner(fn, fail); };
        if (name === 'withFailureHandler') return function (fn) { return runner(ok, fn); };
        if (typeof name !== 'string') return undefined;
        return function () { run(name, Array.prototype.slice.call(arguments), ok, fail); };
      }
    });
  }
  global.google = { script: { run: runner(null, null) } };
})(window);

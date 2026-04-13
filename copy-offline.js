/**
 * Clipboard copy with offline / file:// support:
 * 1. navigator.clipboard.writeText when available (HTTPS, permissions OK)
 * 2. document.execCommand('copy') after selecting the source textarea (no network)
 * 3. Temporary <textarea> in the page if no element is passed
 * 4. prompt() with full text as last resort
 */
(function () {
  'use strict';

  /**
   * Always copy the full string via a hidden textarea — selecting the on-page
   * field can fail for very long content (all slips 1–30).
   */
  function copyWithExecCommand(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
    return ok;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return copyWithExecCommand(text);
      });
    }
    return Promise.resolve(copyWithExecCommand(text));
  }

  window.copyText = function () {
    var textBox = document.getElementById('textBox');
    var message = document.getElementById('copyMessage');
    if (!textBox || !message) return;

    /* Entire textarea = SLIP 1 … SLIP 30 in one string */
    var text = textBox.value;

    function showCopied() {
      message.style.display = 'block';
      setTimeout(function () {
        message.style.display = 'none';
      }, 2000);
    }

    copyToClipboard(text).then(function (ok) {
      if (ok) {
        showCopied();
      } else {
        window.prompt('Copy this text (Ctrl+C, then Enter to close):', text);
      }
    });
  };
})();

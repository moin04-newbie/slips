/**
 * Clipboard copy with offline / file:// support:
 * 1. navigator.clipboard.writeText when available (HTTPS, permissions OK)
 * 2. document.execCommand('copy') after selecting the source textarea (no network)
 * 3. Temporary <textarea> in the page if no element is passed
 * 4. prompt() with full text as last resort
 */
(function () {
  'use strict';

  function copyWithExecCommand(text, sourceElement) {
    var el = sourceElement;
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      el.focus();
      el.select();
      el.setSelectionRange(0, text.length);
      return document.execCommand('copy');
    }
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

  function copyToClipboard(text, sourceElement) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return copyWithExecCommand(text, sourceElement);
      });
    }
    return Promise.resolve(copyWithExecCommand(text, sourceElement));
  }

  window.copyText = function () {
    var textBox = document.getElementById('textBox');
    var message = document.getElementById('copyMessage');
    if (!textBox || !message) return;

    var text = textBox.value;

    function showCopied() {
      message.style.display = 'block';
      setTimeout(function () {
        message.style.display = 'none';
      }, 2000);
    }

    copyToClipboard(text, textBox).then(function (ok) {
      if (ok) {
        showCopied();
      } else {
        window.prompt('Copy this text (Ctrl+C, then Enter to close):', text);
      }
    });
  };
})();

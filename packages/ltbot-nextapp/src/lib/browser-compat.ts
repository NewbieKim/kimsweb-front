/**
 * Must run synchronously in <head>, before any Next.js runtime chunk.
 *
 * Next.js 16 targets Safari 16.4+, while this product also supports iOS 15.
 * Keep this small: these APIs are used by the framework bootstrap path on
 * iOS 15.0–15.3, before client components can load a normal polyfill.
 */
export const browserCompatibilityScript = `
  (function () {
    function at(index) {
      var length = this == null ? 0 : Number(this.length) >>> 0;
      var relativeIndex = Number(index) || 0;
      relativeIndex = relativeIndex < 0 ? Math.ceil(relativeIndex) : Math.floor(relativeIndex);
      var actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex;
      return actualIndex < 0 || actualIndex >= length ? undefined : this[actualIndex];
    }

    if (!Array.prototype.at) {
      Object.defineProperty(Array.prototype, 'at', { value: at, configurable: true, writable: true });
    }
    if (!String.prototype.at) {
      Object.defineProperty(String.prototype, 'at', { value: at, configurable: true, writable: true });
    }
    if (!Object.hasOwn) {
      Object.hasOwn = function (object, property) {
        return Object.prototype.hasOwnProperty.call(Object(object), property);
      };
    }
  })();
`;

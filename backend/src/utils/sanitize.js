/**
 * Escapes special regex characters in a string to make it safe for use in MongoDB $regex queries.
 * @param {any} val - The input value to escape.
 * @returns {string} The escaped string.
 */
export function escapeRegex(val) {
  if (typeof val !== 'string') {
    return '';
  }
  return val.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

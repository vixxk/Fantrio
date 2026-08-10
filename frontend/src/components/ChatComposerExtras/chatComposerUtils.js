/**
 * Insert an emoji at the caret position of a controlled input.
 * Returns the new value. Falls back to appending if no input element is active.
 */
export const insertEmojiAtCaret = (currentValue, emoji, inputEl) => {
  if (inputEl && typeof inputEl.selectionStart === 'number') {
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd ?? start;
    const next = currentValue.slice(0, start) + emoji + currentValue.slice(end);
    requestAnimationFrame(() => {
      const pos = start + emoji.length;
      inputEl.focus();
      inputEl.setSelectionRange(pos, pos);
    });
    return next;
  }
  return currentValue + emoji;
};

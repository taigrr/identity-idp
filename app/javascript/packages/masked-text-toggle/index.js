class MaskedTextToggle {
  /**
   * @param {HTMLInputElement} toggle
   */
  constructor(toggle) {
    const ariaControls = toggle.getAttribute('aria-controls');
    if (!ariaControls) {
      throw new Error('MaskedTextToggle requires aria-controls attribute on toggle element');
    }
    
    this.elements = {
      toggle,
      texts: /** @type {NodeListOf<HTMLElement>} */ (
        document.querySelectorAll(`#${ariaControls} .masked-text__text`)
      ),
    };
  }

  bind() {
    this.elements.toggle.addEventListener('change', () => this.toggleTextVisibility());
    this.toggleTextVisibility();
  }

  toggleTextVisibility() {
    const { toggle, texts } = this.elements;
    const isMasked = !toggle.checked;
    texts.forEach((text) => {
      text.classList.toggle('display-none', text.dataset.masked !== isMasked.toString());
    });
  }
}

export default MaskedTextToggle;

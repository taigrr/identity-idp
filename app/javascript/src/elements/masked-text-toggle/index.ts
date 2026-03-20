interface MaskedTextToggleElements {
  toggle: HTMLInputElement;
  texts: NodeListOf<HTMLElement>;
}

function createMaskedTextToggle(toggle: HTMLInputElement) {
  const elements: MaskedTextToggleElements = {
    toggle,
    texts: document.querySelectorAll(`#${toggle.getAttribute('aria-controls')} .masked-text__text`),
  };

  function toggleTextVisibility() {
    const isMasked = !elements.toggle.checked;
    elements.texts.forEach((text) => {
      text.classList.toggle('display-none', text.dataset.masked !== isMasked.toString());
    });
  }

  function bind() {
    elements.toggle.addEventListener('change', toggleTextVisibility);
    toggleTextVisibility();
  }

  return { bind };
}

export default createMaskedTextToggle;

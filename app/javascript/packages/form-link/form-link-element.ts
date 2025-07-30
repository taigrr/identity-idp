class FormLinkElement extends HTMLElement {
  connectedCallback() {
    this.link.addEventListener('click', this.submit);
  }

  get form(): HTMLFormElement {
    const form = this.querySelector('form');
    if (!form) {
      throw new Error('FormLinkElement must contain a form element');
    }
    return form;
  }

  get link(): HTMLAnchorElement {
    const link = this.querySelector('a');
    if (!link) {
      throw new Error('FormLinkElement must contain an anchor element');
    }
    return link;
  }

  submit = (event: MouseEvent) => {
    event.preventDefault();
    this.form.submit();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'lg-form-link': FormLinkElement;
  }
}

if (!customElements.get('lg-form-link')) {
  customElements.define('lg-form-link', FormLinkElement);
}

export default FormLinkElement;

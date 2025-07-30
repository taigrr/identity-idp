import { tooltip } from '@18f/identity-design-system';

class TooltipElement extends HTMLElement {
  connectedCallback() {
    this.tooltipElement.setAttribute('title', this.tooltipText);
    this.tooltipElement.classList.add('usa-tooltip');
    tooltip.on(this.tooltipElement);
  }

  get tooltipElement(): HTMLElement {
    const element = this.firstElementChild;
    if (!element) {
      throw new Error('TooltipElement must contain a child element');
    }
    return element as HTMLElement;
  }

  /**
   * Retrieves the text to be shown in the tooltip.
   */
  get tooltipText(): string {
    const text = this.getAttribute('tooltip-text');
    if (!text) {
      throw new Error('TooltipElement requires tooltip-text attribute');
    }
    return text;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lg-tooltip': TooltipElement;
  }
}

if (!customElements.get('lg-tooltip')) {
  customElements.define('lg-tooltip', TooltipElement);
}

export default TooltipElement;

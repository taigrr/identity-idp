import MaskedTextToggle from '@/elements/masked-text-toggle';

const wrappers = document.querySelectorAll<HTMLInputElement>('.masked-text__toggle');
wrappers.forEach((toggle) => new MaskedTextToggle(toggle).bind());

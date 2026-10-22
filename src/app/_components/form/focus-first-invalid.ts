const FOCUSABLE_SELECTOR = [
  "input:not([type='hidden']):not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "button:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
  '[role="radio"]',
  '[role="checkbox"]',
].join(", ");

export function focusFirstInvalidField(root: ParentNode | null) {
  const moveFocus = () => {
    const invalid = root?.querySelector<HTMLElement>("[data-invalid=true]");
    if (!invalid) return;

    const control = invalid.matches(FOCUSABLE_SELECTOR)
      ? invalid
      : invalid.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

    const target = control ?? invalid;
    if (!control && !invalid.hasAttribute("tabindex")) {
      invalid.tabIndex = -1;
    }
    target.focus({
      preventScroll: true,
      focusVisible: true,
    });
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
      inline: "nearest",
    });
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(moveFocus);
  });
}

// Shared state for the "hold right-click while dragging to drop one item per
// slot" distribution feature. While the right mouse button is held during a
// drag, a single unit of the dragged stack is placed into each slot the cursor
// passes over.
export const rightDrag = {
  active: false,
  // slots already served during the current right-button hold (keyed by
  // `${inventoryId}:${slot}`) so each slot only receives one unit per pass
  visited: new Set<string>(),
};

const reset = () => {
  rightDrag.active = false;
  rightDrag.visited.clear();
};

if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (event) => {
    if (event.button !== 2) return;
    rightDrag.active = true;
    rightDrag.visited.clear();
  });

  window.addEventListener('mouseup', (event) => {
    if (event.button !== 2) return;
    reset();
  });

  // safety nets so the flag never gets stuck on
  window.addEventListener('blur', reset);
  window.addEventListener('dragend', reset);
}

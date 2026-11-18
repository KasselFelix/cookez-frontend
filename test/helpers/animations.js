// Reanimated's test mock (test/setup.js) ends every animation at once and runs
// its end callback right away, so a race between a running animation and an
// action (a tap during a fade-out) cannot happen under Jest. Hold them:
//
//   holdAnimations();
//   fireEvent.press(close);      // the fade-out starts and stays running
//   ...                          // act while it runs
//   act(() => finishAnimations()); // the end callbacks run now
//
// The hold is cleared after each test.

/** End callbacks of withTiming / withSpring wait until finishAnimations(). */
export function holdAnimations() {
  global.__reanimatedHeld = [];
}

/** Runs the held end callbacks as finished animations, and stops holding. */
export function finishAnimations() {
  const held = global.__reanimatedHeld || [];
  global.__reanimatedHeld = null;
  held.forEach((callback) => callback(true));
}

import React from "react";
import { act, render } from "@testing-library/react";
import HeroSection from "./HeroSection";

test("hero moves through three chapters with scroll, resets for reduced motion, and cleans up", () => {
  let onMotionChange;
  const motion = {
    matches: false,
    addEventListener: jest.fn((event, callback) => { onMotionChange = callback; }),
    removeEventListener: jest.fn(),
  };
  const originalMedia = window.matchMedia;
  window.matchMedia = jest.fn(() => motion);
  let nextFrame;
  const raf = jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    nextFrame = callback;
    return 1;
  });
  const cancel = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  const originalScroll = window.scrollY;
  window.scrollY = 0;

  const { container, unmount } = render(<HeroSection navigate={() => {}} catalogSize={28} brandCount={6} />);
  const hero = container.querySelector(".hs");
  jest.spyOn(hero, "getBoundingClientRect").mockImplementation(() => ({ top: -window.scrollY, height: 1200 }));
  Object.defineProperty(hero, "offsetHeight", { configurable: true, value: 1200 });
  Object.defineProperty(hero.firstElementChild, "offsetHeight", { configurable: true, value: 600 });

  act(() => nextFrame());
  expect(hero.style.getPropertyValue("--p")).toBe("0.0000");
  expect(hero.dataset.chapter).toBe("0");

  window.scrollY = 300;
  act(() => { window.dispatchEvent(new Event("scroll")); nextFrame(); });
  expect(hero.style.getPropertyValue("--p")).toBe("0.5000");
  expect(hero.dataset.chapter).toBe("1");

  window.scrollY = 600;
  act(() => { window.dispatchEvent(new Event("scroll")); nextFrame(); });
  expect(hero.style.getPropertyValue("--p")).toBe("1.0000");
  expect(hero.dataset.chapter).toBe("2");

  motion.matches = true;
  act(() => { onMotionChange(); nextFrame(); });
  expect(hero.style.getPropertyValue("--p")).toBe("0.0000");
  expect(hero.dataset.chapter).toBe("0");

  act(() => window.dispatchEvent(new Event("resize")));
  unmount();
  expect(cancel).toHaveBeenCalledWith(1);
  expect(motion.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  window.matchMedia = originalMedia;
  raf.mockRestore();
  cancel.mockRestore();
  window.scrollY = originalScroll;
});

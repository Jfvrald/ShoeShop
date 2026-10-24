import React, { useRef } from "react";
import { act, render } from "@testing-library/react";
import useScrollMotion from "./useScrollMotion";

test("sections trigger on entry, image depth follows scroll, and reduced motion restores content", async () => {
  const originalMedia = window.matchMedia;
  const originalObserver = window.IntersectionObserver;
  let intersect;
  let motionChange;
  let frame;
  const observer = { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
  window.IntersectionObserver = jest.fn(callback => { intersect = callback; return observer; });
  const preference = {
    matches: false,
    addEventListener: (event, callback) => { motionChange = callback; },
    removeEventListener: jest.fn(),
  };
  window.matchMedia = () => preference;
  const raf = jest.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
    frame = callback;
    return 1;
  });
  const cancel = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

  function Scene({ extra = false }) {
    const ref = useRef(null);
    useScrollMotion(ref, "home");
    return <main ref={ref}>
      <h2 className="rv">Featured items</h2>
      <div className="community-scroll"><div className="community-photo"><img className="par-img" alt="Sneakers" /></div></div>
      {extra && <article className="par-cell">Another pair</article>}
    </main>;
  }

  const { container, rerender, unmount } = render(<Scene />);
  const heading = container.querySelector("h2");
  const photo = container.querySelector(".community-photo");
  const image = container.querySelector("img");
  const bounds = jest.spyOn(photo, "getBoundingClientRect").mockReturnValue({ top: window.innerHeight, height: 500 });
  act(() => frame());
  expect(heading).toHaveClass("scroll-reveal");
  expect(heading).not.toHaveClass("is-in-view");
  expect(image.style.getPropertyValue("--scroll-progress")).toBe("0.0000");
  act(() => intersect([{ target: heading, isIntersecting: true, boundingClientRect: { top: 200 } }]));
  expect(heading).toHaveClass("is-in-view");
  bounds.mockReturnValue({ top: -500, height: 500 });
  act(() => { window.dispatchEvent(new Event("scroll")); frame(); });
  expect(image.style.getPropertyValue("--scroll-progress")).toBe("1.0000");
  const sceneBounds = jest.spyOn(container.querySelector(".community-scroll"), "getBoundingClientRect")
    .mockReturnValue({ top: 72, height: 1200 });
  bounds.mockReturnValue({ top: 72, height: 600 });
  act(() => { window.dispatchEvent(new Event("scroll")); frame(); });
  expect(image.style.getPropertyValue("--scroll-progress")).toBe("0.0000");
  sceneBounds.mockReturnValue({ top: -228, height: 1200 });
  act(() => { window.dispatchEvent(new Event("scroll")); frame(); });
  expect(image.style.getPropertyValue("--scroll-progress")).toBe("0.5000");
  act(() => intersect([{ target: heading, isIntersecting: false, boundingClientRect: { top: window.innerHeight } }]));
  expect(heading).not.toHaveClass("is-in-view");

  rerender(<Scene extra />);
  await act(async () => {});
  expect(container.querySelector("article")).toHaveClass("scroll-reveal");
  preference.matches = true;
  act(() => motionChange());
  expect(heading).not.toHaveClass("scroll-reveal");
  expect(image).not.toHaveClass("scroll-depth");
  expect(image.style.getPropertyValue("--scroll-progress")).toBe("");
  unmount();
  expect(preference.removeEventListener).toHaveBeenCalledWith("change", motionChange);
  expect(observer.disconnect).toHaveBeenCalled();
  raf.mockRestore();
  cancel.mockRestore();
  window.matchMedia = originalMedia;
  window.IntersectionObserver = originalObserver;
});

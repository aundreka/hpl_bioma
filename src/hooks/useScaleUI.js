import { useCallback, useLayoutEffect, useRef } from "react";

const applyCenterTransform = (node, data, baseW, baseH) => {
  if (!node || !data) return;
  const { scale, viewportW, viewportH } = data;
  const scaledW = baseW * scale;
  const scaledH = baseH * scale;
  node.style.position = "absolute";
  node.style.transformOrigin = "top left";
  node.style.left = `${(viewportW - scaledW) / 2}px`;
  node.style.top = `${(viewportH - scaledH) / 2}px`;
  node.style.width = `${baseW}px`;
  node.style.height = `${baseH}px`;
  node.style.transform = `scale(${scale})`;
};

const getViewportSize = (fallbackNode) => {
  const visualViewport = window.visualViewport;
  if (visualViewport?.width && visualViewport?.height) {
    return {
      viewportW: visualViewport.width,
      viewportH: visualViewport.height,
    };
  }

  if (window.innerWidth && window.innerHeight) {
    return {
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    };
  }

  const { width, height } = fallbackNode.getBoundingClientRect();
  return {
    viewportW: width,
    viewportH: height,
  };
};

export default function useScaleUI(baseW = 420, baseH = 820) {
  const appRef = useRef(null);
  const wrapperRef = useRef(null);
  const HeaderRef = useRef(null);
  const footerRef = useRef(null);
  const centerNodeRef = useRef(null);
  const lastScaleRef = useRef(null);

  const centerRef = useCallback(
    (node) => {
      centerNodeRef.current = node;
      applyCenterTransform(node, lastScaleRef.current, baseW, baseH);
    },
    [baseW, baseH],
  );

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const scaleUI = () => {
      const { viewportW, viewportH } = getViewportSize(wrapper);

      if (!viewportW || !viewportH) return;

      const scale = Math.min(viewportW / baseW, viewportH / baseH);
      const fullscreenScaleX = viewportW / baseW;

      const scaledW = baseW * scale;
      const scaledH = baseH * scale;

      wrapper.style.setProperty("--app-base-w", `${baseW}px`);
      wrapper.style.setProperty("--app-base-h", `${baseH}px`);
      wrapper.style.setProperty("--app-left", `${(viewportW - scaledW) / 2}px`);
      wrapper.style.setProperty("--app-top", `${(viewportH - scaledH) / 2}px`);
      wrapper.style.setProperty("--ui-scale", scale.toString());
      wrapper.style.setProperty(
        "--footer-cta-scalex",
        (scale / fullscreenScaleX).toString(),
      );

      const header = HeaderRef.current;
      if (header) {
        header.style.transformOrigin = "top left";
        header.style.width = `${viewportW / scale}px`;
        header.style.transform = `scale(${scale})`;
        header.style.left = "0px";
      }

      const footer = footerRef.current;
      if (footer) {
        footer.style.transformOrigin = "bottom left";
        footer.style.transform = `scaleX(${fullscreenScaleX}) scaleY(${scale})`;
        footer.style.left = "0px";
      }

      lastScaleRef.current = { scale, viewportW, viewportH };
      applyCenterTransform(
        centerNodeRef.current,
        lastScaleRef.current,
        baseW,
        baseH,
      );
    };

    scaleUI();

    const ro = new ResizeObserver(scaleUI);
    ro.observe(wrapper);

    window.visualViewport?.addEventListener("resize", scaleUI);
    window.addEventListener("orientationchange", scaleUI);
    window.addEventListener("resize", scaleUI);

    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", scaleUI);
      window.removeEventListener("orientationchange", scaleUI);
      window.removeEventListener("resize", scaleUI);
    };
  }, [baseW, baseH]);

  return { appRef, wrapperRef, HeaderRef, footerRef, centerRef };
}

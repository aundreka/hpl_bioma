import { useCallback, useEffect, useRef, useState } from "react";
import endsceneSfx from "../images/sfx/endscene.mp3";

export const EndScene = ({
  srcPortrait,
  srcLandscape,
  muted = true,
  playsInline = true,
  autoPlay = true,
  loop = true,
}) => {
  const targetAspectRatio = 16 / 9;
  const extremeRatioThreshold = 1.8;

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [containerSize, setContainerSize] = useState({
    widthPct: 100,
    heightPct: 100,
  });
  const [isLandscape, setIsLandscape] = useState(false);
  const [portraitTopBorderHeight, setPortraitTopBorderHeight] = useState(0);

  const computeLayout = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    setIsLandscape(!isPortrait);

    const src = isPortrait ? srcPortrait : srcLandscape;
    const normalizedRatio = width > height ? width / height : height / width;

    let widthPct = 100;
    let heightPct = 100;

    if (normalizedRatio > extremeRatioThreshold) {
      if (isPortrait) {
        const targetHeight = width * targetAspectRatio;
        heightPct = (targetHeight / height) * 100;
      } else {
        const targetWidth = height * targetAspectRatio;
        widthPct = (targetWidth / width) * 100;
      }
    }

    const containerHeight = height * (heightPct / 100);
    const topGap = Math.max(0, (height - containerHeight) / 2);
    setPortraitTopBorderHeight((prev) =>
      prev === topGap ? prev : topGap,
    );

    setContainerSize((prev) => {
      if (prev.widthPct === widthPct && prev.heightPct === heightPct)
        return prev;
      return { widthPct, heightPct };
    });

    const video = videoRef.current;
    if (!video) return;

    const current = video.currentSrc || video.src || "";
    const isAlready = current.includes(src);

    if (!isAlready) {
      video.src = src;
      video.load();
    }
  }, [srcPortrait, srcLandscape]);

  const rafIdRef = useRef(0);
  const scheduleOrientationUpdate = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = 0;
      computeLayout();
    });
  }, [computeLayout]);

  const syncWindowActivityState = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const isActive = document.visibilityState === "visible";

    if (isActive) {
      scheduleOrientationUpdate();
      if (autoPlay) video.play().catch(() => {});
    } else {
      video.pause();
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    }
  }, [scheduleOrientationUpdate, autoPlay]);

  useEffect(() => {
    const attach = () => {
      window.addEventListener("resize", scheduleOrientationUpdate, {
        passive: true,
      });
      window.addEventListener("orientationchange", scheduleOrientationUpdate, {
        passive: true,
      });
      document.addEventListener("visibilitychange", syncWindowActivityState);
      window.addEventListener("focus", syncWindowActivityState);
      window.addEventListener("blur", syncWindowActivityState);
      window.addEventListener("pagehide", syncWindowActivityState);
    };

    const detach = () => {
      window.removeEventListener("resize", scheduleOrientationUpdate);
      window.removeEventListener(
        "orientationchange",
        scheduleOrientationUpdate,
      );
      document.removeEventListener("visibilitychange", syncWindowActivityState);
      window.removeEventListener("focus", syncWindowActivityState);
      window.removeEventListener("blur", syncWindowActivityState);
      window.removeEventListener("pagehide", syncWindowActivityState);

      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };

    attach();
    syncWindowActivityState();
    return detach;
  }, [scheduleOrientationUpdate, syncWindowActivityState]);

  useEffect(() => {
    computeLayout();
  }, [computeLayout]);

  useEffect(() => {
    const audio = new Audio(endsceneSfx);
    audio.volume = 0.5;
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    return () => {
      audio.pause();
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyWidth = body.style.width;
    const prevBodyTop = body.style.top;
    const prevHtmlBackgroundColor = html.style.backgroundColor;
    const prevBodyBackgroundColor = body.style.backgroundColor;
    const scrollY = window.scrollY;
    const preventScroll = (e) => e.preventDefault();
    const preventScrollKeys = (e) => {
      if (
        [
          " ",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "PageUp",
          "PageDown",
          "Home",
          "End",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
    };

    html.style.overflow = "hidden";
    html.style.backgroundColor = isLandscape ? "#070C28" : "#F4F4F6";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.top = `-${scrollY}px`;
    body.style.backgroundColor = isLandscape ? "#070C28" : "#F4F4F6";

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventScrollKeys);

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventScrollKeys);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.width = prevBodyWidth;
      body.style.top = prevBodyTop;
      html.style.backgroundColor = prevHtmlBackgroundColor;
      body.style.backgroundColor = prevBodyBackgroundColor;
      window.scrollTo(0, scrollY);
    };
  }, [isLandscape]);

  const handleClickAction = () => {
    const mraid = window.mraid || {};
    if (mraid.open && typeof mraid.open === "function") {
      mraid.open();
    } else {
      window.open();
    }
  };

  const containerStyle = {
    width: `${containerSize.widthPct}%`,
    height: `${containerSize.heightPct}%`,
  };

  return (
    <div
      onClick={handleClickAction}
      style={{
        overflow: "hidden",
        overscrollBehavior: "none",
        touchAction: "none",
        backgroundColor: isLandscape ? "#070C28" : "#F4F4F6",
        zIndex: 9999,
        cursor: "pointer",
      }}
    >
      {!isLandscape && (
        <div
          className="endscene-portrait-top-border fixed -top-2 left-1/2 -translate-x-1/2 bg-[#070C28] w-[110%]"
          style={{
            height: `${portraitTopBorderHeight + 50}px`,
            pointerEvents: "none",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 50%, #070C28 90%)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 50%, #070C28 90%)",
          }}
        />
      )}
      <div
        ref={containerRef}
        id="video-container"
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          zIndex: 9999,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translate(-50%, -50%)",
          ...containerStyle,
        }}
      >
        <video
          ref={videoRef}
          id="endscene-video"
          muted={muted}
          playsInline={playsInline}
          autoPlay={autoPlay}
          loop={loop}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};

export default EndScene;

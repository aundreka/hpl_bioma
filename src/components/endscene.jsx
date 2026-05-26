import { useCallback, useEffect, useRef, useState } from "react";
import endsceneSfx from "../images/sfx/endscene.mp3";

const DEFAULT_VIDEO_ASPECT = {
  portrait: 1246 / 1662,
  landscape: 1662 / 1246,
};

const STRETCH_BLEND = 0.5;
const MAX_NARROW_STRETCH = 1.08;

const getHybridVideoSize = (viewportWidth, viewportHeight, videoAspect) => {
  if (!viewportWidth || !viewportHeight || !videoAspect) {
    return { widthPct: 100, heightPct: 100 };
  }

  const viewportAspect = viewportWidth / viewportHeight;
  let targetAspect =
    videoAspect * Math.pow(viewportAspect / videoAspect, STRETCH_BLEND);

  if (viewportAspect < videoAspect) {
    targetAspect = Math.max(targetAspect, videoAspect / MAX_NARROW_STRETCH);
  }

  if (targetAspect > viewportAspect) {
    return {
      widthPct: (targetAspect / viewportAspect) * 100,
      heightPct: 100,
    };
  }

  return {
    widthPct: 100,
    heightPct: (viewportAspect / targetAspect) * 100,
  };
};

const getInitialIsLandscape = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= window.innerHeight;
};

const getInitialVideoSize = () => {
  if (typeof window === "undefined") {
    return { widthPct: 100, heightPct: 100 };
  }

  const isLandscape = getInitialIsLandscape();
  const videoAspect = isLandscape
    ? DEFAULT_VIDEO_ASPECT.landscape
    : DEFAULT_VIDEO_ASPECT.portrait;

  return getHybridVideoSize(
    window.innerWidth,
    window.innerHeight,
    videoAspect,
  );
};

export const EndScene = ({
  srcPortrait,
  srcLandscape,
  muted = true,
  playsInline = true,
  autoPlay = true,
  loop = true,
}) => {
  const videoRef = useRef(null);
  const videoAspectBySrcRef = useRef({});

  const [isLandscape, setIsLandscape] = useState(getInitialIsLandscape);
  const [videoSize, setVideoSize] = useState(getInitialVideoSize);

  const computeLayout = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    setIsLandscape(!isPortrait);

    const src = isPortrait ? srcPortrait : srcLandscape;
    const fallbackAspect = isPortrait
      ? DEFAULT_VIDEO_ASPECT.portrait
      : DEFAULT_VIDEO_ASPECT.landscape;
    const videoAspect = videoAspectBySrcRef.current[src] || fallbackAspect;
    const nextVideoSize = getHybridVideoSize(width, height, videoAspect);

    setVideoSize((prev) => {
      if (
        prev.widthPct === nextVideoSize.widthPct &&
        prev.heightPct === nextVideoSize.heightPct
      ) {
        return prev;
      }

      return nextVideoSize;
    });

    const video = videoRef.current;
    if (!video) return;

    video.dataset.endSceneSrc = src;

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

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) return;

    const src = video.dataset.endSceneSrc;
    if (!src) return;

    videoAspectBySrcRef.current[src] = video.videoWidth / video.videoHeight;
    scheduleOrientationUpdate();
  }, [scheduleOrientationUpdate]);

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

  return (
    <div
      onClick={handleClickAction}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        overscrollBehavior: "none",
        touchAction: "none",
        backgroundColor: isLandscape ? "#070C28" : "#F4F4F6",
        zIndex: 9999,
        cursor: "pointer",
      }}
    >
      <div
        id="video-container"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 9999,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <video
          ref={videoRef}
          id="endscene-video"
          muted={muted}
          playsInline={playsInline}
          autoPlay={autoPlay}
          loop={loop}
          onLoadedMetadata={handleLoadedMetadata}
          style={{
            width: `${videoSize.widthPct}%`,
            height: `${videoSize.heightPct}%`,
            maxWidth: "none",
            maxHeight: "none",
            objectFit: "fill",
            display: "block",
            flex: "0 0 auto",
          }}
        />
      </div>
    </div>
  );
};

export default EndScene;

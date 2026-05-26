import { useEffect, useLayoutEffect, useRef, useState } from "react";
import cardCover from "../images/CARD 01.webp";
import handPointer from "../images/hand.webp";
import scratchingSfx from "../images/sfx/scratching.wav";
import revealSfx from "../images/sfx/reveal.wav";

const REVEAL_THRESHOLD = 0.55;
const SCRATCH_VOLUME = 0.6;
const REVEAL_VOLUME = 0.8;

const getContainRect = (sourceW, sourceH, targetW, targetH) => {
  if (!sourceW || !sourceH || !targetW || !targetH) {
    return { x: 0, y: 0, w: targetW, h: targetH };
  }

  const scale = Math.min(targetW / sourceW, targetH / sourceH);
  const w = sourceW * scale;
  const h = sourceH * scale;

  return {
    x: (targetW - w) / 2,
    y: (targetH - h) / 2,
    w,
    h,
  };
};

const sharedScratchAudio =
  typeof window !== "undefined" ? new Audio(scratchingSfx) : null;
if (sharedScratchAudio) {
  sharedScratchAudio.loop = true;
  sharedScratchAudio.volume = 0;
  sharedScratchAudio.muted = true;
  sharedScratchAudio.preload = "auto";
  sharedScratchAudio.load();
}

const revealAudioPool =
  typeof window !== "undefined"
    ? Array.from({ length: 4 }, () => {
        const a = new Audio(revealSfx);
        a.volume = REVEAL_VOLUME;
        a.preload = "auto";
        a.load();
        return a;
      })
    : [];
let revealPoolIdx = 0;

let audioPrimed = false;
const primeAudio = () => {
  if (audioPrimed) return;
  audioPrimed = true;
  if (sharedScratchAudio) {
    sharedScratchAudio.muted = true;
    sharedScratchAudio.volume = 0;
    const p = sharedScratchAudio.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        sharedScratchAudio.pause();
        sharedScratchAudio.currentTime = 0;
        sharedScratchAudio.muted = false;
      }).catch(() => {
        sharedScratchAudio.muted = false;
      });
    }
  }
  revealAudioPool.forEach((a) => {
    const prevVol = a.volume;
    a.muted = true;
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
        a.volume = prevVol;
      }).catch(() => {
        a.muted = false;
      });
    }
  });
};

if (typeof window !== "undefined") {
  const primeHandler = () => primeAudio();
  window.addEventListener("pointerdown", primeHandler, true);
  window.addEventListener("touchstart", primeHandler, true);
  window.addEventListener("mousedown", primeHandler, true);
  window.addEventListener("keydown", primeHandler, true);
}

const playRevealSfx = () => {
  if (!revealAudioPool.length) return;
  const audio = revealAudioPool[revealPoolIdx];
  revealPoolIdx = (revealPoolIdx + 1) % revealAudioPool.length;
  try {
    audio.currentTime = 0;
  } catch {
    /* not loaded yet */
  }
  audio.muted = false;
  audio.volume = REVEAL_VOLUME;
  const p = audio.play();
  if (p && typeof p.catch === "function") {
    p.catch(() => {});
  }
};

let activeScratchers = 0;

const ensureSharedScratchSfxPlaying = () => {
  const audio = sharedScratchAudio;
  if (!audio || activeScratchers <= 0) return;
  audio.muted = false;
  audio.volume = SCRATCH_VOLUME;
  if (audio.paused) {
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }
};

const startSharedScratchSfx = () => {
  const audio = sharedScratchAudio;
  if (!audio) return;
  activeScratchers += 1;
  audio.muted = false;
  audio.volume = SCRATCH_VOLUME;
  if (audio.paused) {
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }
};

const stopSharedScratchSfx = (force = false) => {
  const audio = sharedScratchAudio;
  if (!audio) return;
  if (force) {
    activeScratchers = 0;
  } else if (activeScratchers > 0) {
    activeScratchers -= 1;
  }
  if (activeScratchers <= 0) {
    activeScratchers = 0;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
};

if (typeof window !== "undefined") {
  const forceStop = () => stopSharedScratchSfx(true);
  window.addEventListener("touchcancel", forceStop, true);
  window.addEventListener("pointercancel", forceStop, true);
  window.addEventListener("blur", forceStop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) forceStop();
  });
  const onTouchEnd = (e) => {
    if (e.touches && e.touches.length > 0) return;
    forceStop();
  };
  window.addEventListener("touchend", onTouchEnd, true);
}

function ScratchCard({
  revealSrc,
  revealed,
  onRevealed,
  onScratchStart,
  showHint,
  maskRef,
  disabled = false,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const coverImgRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const checkTimerRef = useRef(0);
  const finishedRef = useRef(false);
  const scratchMaskRef = maskRef;
  const imagesLoadedRef = useRef(false);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const [hideHint, setHideHint] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const measure = () => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      if (!w || !h) return;
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(node);
    }
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!scratchMaskRef.current) {
      scratchMaskRef.current = document.createElement("canvas");
    }
    const maskCanvas = scratchMaskRef.current;
    if (
      maskCanvas.width !== Math.round(size.w * dpr) ||
      maskCanvas.height !== Math.round(size.h * dpr)
    ) {
      const prev = document.createElement("canvas");
      prev.width = maskCanvas.width;
      prev.height = maskCanvas.height;
      if (maskCanvas.width && maskCanvas.height) {
        prev.getContext("2d").drawImage(maskCanvas, 0, 0);
      }
      maskCanvas.width = Math.round(size.w * dpr);
      maskCanvas.height = Math.round(size.h * dpr);
      const mctx = maskCanvas.getContext("2d");
      if (prev.width && prev.height) {
        mctx.drawImage(prev, 0, 0, maskCanvas.width, maskCanvas.height);
      }
    }

    const paint = () => {
      const cover = coverImgRef.current;
      if (!cover) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, size.w, size.h);
      const coverRect = getContainRect(
        cover.naturalWidth || cover.width,
        cover.naturalHeight || cover.height,
        size.w,
        size.h,
      );
      ctx.drawImage(cover, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
      const mask = scratchMaskRef.current;
      if (mask && mask.width && mask.height) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(mask, 0, 0, size.w, size.h);
        ctx.restore();
      }
    };

    if (imagesLoadedRef.current) {
      paint();
    } else {
      const cover = new Image();
      cover.onload = () => {
        imagesLoadedRef.current = true;
        paint();
      };
      cover.src = cardCover;
      coverImgRef.current = cover;
    }
  }, [size.w, size.h, scratchMaskRef]);

  const activeTouchIdRef = useRef(null);

  const findTouch = (e, id) => {
    if (!e.touches && !e.changedTouches) return null;
    if (id != null) {
      const list = e.touches || [];
      for (let i = 0; i < list.length; i += 1) {
        if (list[i].identifier === id) return list[i];
      }
      const changed = e.changedTouches || [];
      for (let i = 0; i < changed.length; i += 1) {
        if (changed[i].identifier === id) return changed[i];
      }
      return null;
    }
    return (
      (e.touches && e.touches[0]) ||
      (e.changedTouches && e.changedTouches[0]) ||
      null
    );
  };

  const getPosFromPoint = (point) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / size.w;
    const scaleY = rect.height / size.h;
    return {
      x: (point.clientX - rect.left) / scaleX,
      y: (point.clientY - rect.top) / scaleY,
    };
  };

  const getPos = (e) => {
    if (e.touches !== undefined || e.changedTouches !== undefined) {
      const t = findTouch(e, activeTouchIdRef.current);
      if (!t) return null;
      return getPosFromPoint(t);
    }
    return getPosFromPoint(e);
  };

  const scratchAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const radius = Math.max(size.w, size.h) * 0.09;

    ctx.globalCompositeOperation = "destination-out";
    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = radius * 2;
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    const mask = scratchMaskRef.current;
    if (mask && mask.width && mask.height) {
      const mctx = mask.getContext("2d");
      const sx = mask.width / size.w;
      const sy = mask.height / size.h;
      mctx.globalCompositeOperation = "source-over";
      mctx.fillStyle = "#000";
      mctx.strokeStyle = "#000";
      if (lastPointRef.current) {
        mctx.beginPath();
        mctx.lineCap = "round";
        mctx.lineJoin = "round";
        mctx.lineWidth = radius * 2 * Math.max(sx, sy);
        mctx.moveTo(lastPointRef.current.x * sx, lastPointRef.current.y * sy);
        mctx.lineTo(x * sx, y * sy);
        mctx.stroke();
      }
      mctx.beginPath();
      mctx.arc(x * sx, y * sy, radius * Math.max(sx, sy), 0, Math.PI * 2);
      mctx.fill();
    }

    lastPointRef.current = { x, y };
  };

  const checkReveal = () => {
    if (finishedRef.current) return;
    const now = performance.now();
    if (now - checkTimerRef.current < 120) return;
    checkTimerRef.current = now;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const step = 8;
    const data = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    let sampled = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4 + 3;
        if (data[idx] === 0) cleared += 1;
        sampled += 1;
      }
    }
    if (cleared / sampled >= REVEAL_THRESHOLD) {
      finishedRef.current = true;
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        stopSharedScratchSfx();
      } else {
        stopSharedScratchSfx(true);
      }
      lastPointRef.current = null;
      playRevealSfx();
      const mask = scratchMaskRef.current;
      if (mask && mask.width && mask.height) {
        const mctx = mask.getContext("2d");
        mctx.globalCompositeOperation = "source-over";
        mctx.fillStyle = "#000";
        mctx.fillRect(0, 0, mask.width, mask.height);
      }
      const fadeStart = performance.now();
      const fadeMs = 350;
      const tick = () => {
        const t = Math.min(1, (performance.now() - fadeStart) / fadeMs);
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${0.25 + t * 0.75})`;
        ctx.fillRect(0, 0, size.w, size.h);
        ctx.restore();
        if (t < 1) requestAnimationFrame(tick);
        else onRevealed();
      };
      requestAnimationFrame(tick);
    }
  };

  const onDown = (e) => {
    if (revealedRef.current || disabledRef.current) return;
    if (e.cancelable) e.preventDefault();
    if (isDrawingRef.current) return;
    let touchId = null;
    if (e.changedTouches && e.changedTouches.length > 0) {
      touchId = e.changedTouches[0].identifier;
    }
    activeTouchIdRef.current = touchId;
    isDrawingRef.current = true;
    lastPointRef.current = null;
    setHideHint(true);
    if (onScratchStart) onScratchStart();
    startSharedScratchSfx();
    const pos = getPos(e);
    if (!pos) return;
    scratchAt(pos.x, pos.y);
  };

  const onMove = (e) => {
    if (!isDrawingRef.current || revealedRef.current || disabledRef.current) return;
    if (e.cancelable) e.preventDefault();
    ensureSharedScratchSfxPlaying();
    const pos = getPos(e);
    if (!pos) return;
    scratchAt(pos.x, pos.y);
    checkReveal();
  };

  const onUp = (e) => {
    if (!isDrawingRef.current) return;
    if (e && e.changedTouches && activeTouchIdRef.current != null) {
      let matched = false;
      for (let i = 0; i < e.changedTouches.length; i += 1) {
        if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
          matched = true;
          break;
        }
      }
      if (!matched) return;
    }
    isDrawingRef.current = false;
    activeTouchIdRef.current = null;
    lastPointRef.current = null;
    stopSharedScratchSfx();
    checkReveal();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    canvas.addEventListener("touchstart", onDown, opts);
    canvas.addEventListener("touchmove", onMove, opts);
    canvas.addEventListener("touchend", onUp, opts);
    canvas.addEventListener("touchcancel", onUp, opts);
    return () => {
      canvas.removeEventListener("touchstart", onDown, opts);
      canvas.removeEventListener("touchmove", onMove, opts);
      canvas.removeEventListener("touchend", onUp, opts);
      canvas.removeEventListener("touchcancel", onUp, opts);
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        activeTouchIdRef.current = null;
        stopSharedScratchSfx();
      }
    };
  }, [size.w, size.h]);

  return (
    <div ref={containerRef} className="relative select-none w-full h-full">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[28px] pointer-events-none">
        <img
          src={revealSrc}
          alt=""
          draggable={false}
          className="w-full h-full object-cover"
        />
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{
          opacity: revealed ? 0 : 1,
          transition: "opacity 200ms ease-out",
          pointerEvents: revealed || disabled ? "none" : "auto",
        }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      />
      {showHint && !revealed && !hideHint && size.w > 0 && (
        <div className="absolute right-[6%] bottom-[4%] flex items-center justify-center pointer-events-none">
          <img
            src={handPointer}
            alt=""
            draggable={false}
            className="animate-scratch-hint drop-shadow-lg"
            style={{ width: size.w * 0.28, height: "auto" }}
          />
        </div>
      )}
    </div>
  );
}

export default ScratchCard;

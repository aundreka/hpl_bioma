import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import logo from "../images/logo.webp";
import title from "../images/Scratch to reveal your discount today.webp";
import cardImage from "../images/CARD 01.webp";
import handPointer from "../images/hand.webp";
import clickSfx from "../images/sfx/click.wav";
import { Cta } from "./Cta";
import ResultOverlay from "./ResultOverlay";

const HINT_DELAY_MS = 1400;
const HINT_TARGET_ID = 2;
const PRODUCTS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

const MotionImg = motion.img;

export const Scene1 = ({ onResultComplete, centerRef }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const clickAudioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(clickSfx);
    audio.volume = 0.5;
    audio.preload = "auto";
    clickAudioRef.current = audio;

    return () => {
      audio.pause();
      clickAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selectedId !== null) return undefined;
    const t = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => clearTimeout(t);
  }, [selectedId]);

  const handleProductClick = (id) => {
    if (selectedId !== null) return;
    setShowHint(false);
    const clickAudio = clickAudioRef.current;
    if (clickAudio) {
      try {
        clickAudio.currentTime = 0;
      } catch {
        /* ignore */
      }
      const p = clickAudio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    setSelectedId(id);
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center px-[120px] pt-[120px] pb-[110px]">
      <img
        src={logo}
        alt="Bioma"
        className={`relative z-10 mt-[16px] w-[300px] object-contain ${showResult ? "invisible" : ""}`}
      />
      <img
        src={title}
        alt="Scratch to reveal your discount today"
        className={`relative z-10 mt-[46px] w-[780px] object-contain ${showResult ? "invisible" : ""}`}
      />

      <div className="relative z-10 mt-[104px] grid w-full grid-cols-2 gap-x-[34px] gap-y-[34px]">
        {PRODUCTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="relative select-none bg-transparent p-0 disabled:cursor-default"
            onClick={() => handleProductClick(p.id)}
            disabled={selectedId !== null}
          >
            <img src={cardImage} alt="" draggable={false} className="block w-full object-contain" />
            <AnimatePresence>
              {showHint && p.id === HINT_TARGET_ID && (
                <MotionImg
                  key="hand-pointer"
                  src={handPointer}
                  alt=""
                  draggable={false}
                  className="absolute pointer-events-none w-[30%] object-contain"
                  style={{ right: "-8%", bottom: "-5%" }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{
                    opacity: 1,
                    scale: [1, 0.92, 1],
                    y: [0, -10, 0],
                  }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    scale: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
                  }}
                />
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      <div className={`relative z-10 mt-auto w-[680px] ${showResult ? "invisible" : ""}`}>
        <Cta />
      </div>

      {selectedId !== null && (
        <ResultOverlay
          revealed={revealed}
          onRevealed={() => setRevealed(true)}
          onComplete={onResultComplete}
          centerRef={centerRef}
          onShowResultChange={setShowResult}
        />
      )}
    </div>
  );
};

export default Scene1;

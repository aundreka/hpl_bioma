import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import ScratchCard from "./ScratchCard";
import { Cta } from "./Cta";
import logo from "../images/logo.webp";
import title from "../images/Scratch to reveal your discount today.webp";
import discountArt from "../images/up_to_60_off_bundle.webp";

const REVEAL_TO_END_DELAY_MS = 2500;
const SCRATCH_HINT_DELAY_MS = 1200;
const CARD_WIDTH = 690;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 569) / 434);

const zoomMaskRef = { current: null };
const MotionDiv = motion.div;

const ResultOverlay = ({ revealed, onRevealed, onComplete, centerRef, onShowResultChange }) => {
  const [showScratchHint, setShowScratchHint] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowScratchHint(true), SCRATCH_HINT_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!revealed || !onComplete) return;
    const t = setTimeout(onComplete, REVEAL_TO_END_DELAY_MS);
    return () => clearTimeout(t);
  }, [revealed, onComplete]);

  useEffect(() => {
    if (onShowResultChange) onShowResultChange(true);
    return () => {
      if (onShowResultChange) onShowResultChange(false);
    };
  }, [onShowResultChange]);

  return createPortal(
    <MotionDiv
      className="bioma-overlay"
      style={{ zIndex: 600, isolation: "isolate" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.7)", zIndex: 0 }}
      />

      <div ref={centerRef} className="absolute inset-0" style={{ zIndex: 1 }}>
        <div className="relative flex h-full w-full flex-col items-center px-[120px] pt-[120px] pb-[110px] text-white">
          <img src={logo} alt="Bioma" className="relative z-10 mt-[16px] w-[300px] object-contain" />
          <img
            src={title}
            alt="Scratch to reveal your discount today"
            className="relative z-10 mt-[46px] w-[780px] object-contain"
          />

          <div
            className="relative z-10 mt-[198px]"
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          >
            <ScratchCard
              revealSrc={discountArt}
              revealed={revealed}
              onRevealed={onRevealed}
              onScratchStart={() => {}}
              showHint={showScratchHint}
              maskRef={zoomMaskRef}
              disabled={revealed}
            />
          </div>

          <div className="absolute bottom-[110px] left-1/2 z-50 w-[680px] -translate-x-1/2">
            <Cta />
          </div>
        </div>
      </div>
    </MotionDiv>,
    document.body,
  );
};

export default ResultOverlay;

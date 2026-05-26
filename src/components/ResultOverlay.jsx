import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import ScratchCard from "./ScratchCard";
import { Cta } from "./Cta";
import logo from "../images/logo.webp";
import title from "../images/Scratch to reveal your discount today.webp";
import flowerTop from "../images/flower_background.webp";
import flowerBottom from "../images/flower_background_big.webp";
import discountArt from "../images/up_to_60_off_bundle.webp";
import { flowerLayout } from "../config/flowerLayout";

const REVEAL_TO_END_DELAY_MS = 2500;
const SCRATCH_HINT_DELAY_MS = 1200;
const CARD_ASPECT_RATIO = "434 / 569";

const zoomMaskRef = { current: null };

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
    <motion.div
      className="fixed inset-0 bioma-viewport-bg"
      style={{ zIndex: 600 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={flowerTop}
          alt=""
          className="absolute opacity-95"
          style={flowerLayout.overlay.topRight}
        />
        <img
          src={flowerBottom}
          alt=""
          className="absolute opacity-95"
          style={flowerLayout.overlay.bottomLeft}
        />
      </div>
      <div
        className="fixed left-0 top-0 h-screen w-screen pointer-events-none"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
      />

      <div ref={centerRef} className="absolute inset-0">
        <div className="relative flex h-full w-full flex-col items-center px-[120px] pt-[120px] pb-[110px] text-white">
          <img src={logo} alt="Bioma" className="relative z-10 mt-[16px] w-[300px] object-contain" />
          <img
            src={title}
            alt="Scratch to reveal your discount today"
            className="relative z-10 mt-[46px] w-[780px] object-contain"
          />

          <motion.div
            className="relative z-10 mt-[120px] w-[690px]"
            style={{ aspectRatio: CARD_ASPECT_RATIO }}
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
          </motion.div>

          <div className="relative z-10 mt-auto w-[500px]">
            <Cta />
          </div>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};

export default ResultOverlay;

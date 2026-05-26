import ctaButton from "../images/cta.webp";

export const Cta = ({ className = "" }) => {
  const handleClickAction = () => {
    const mraid = window.mraid || {};
    if (mraid.open && typeof mraid.open === "function") {
      mraid.open();
    } else {
      window.open();
    }
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <button className="animate-pulsing block w-full" onClick={handleClickAction}>
        <img src={ctaButton} alt="Shop now" className="w-full object-contain block" />
      </button>
    </div>
  );
};

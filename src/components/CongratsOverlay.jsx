import { motion } from "motion/react";
import discount from "../images/up_to_60_off_bundle.webp";

// === Dynamic date config (mirrors src/components/SIP01.html formatSipDate) ===
// Tokens: YYYY YY MMMM MMM MM M DD Do D dddd ddd. Use [literal] to keep raw text.
const DATE_TOKENS = "MMMM DD, YYYY";
const DATE_LOCALE = "en-US";
const DATE_OFFSET_DAYS = 0;

const __pad2 = (n) => String(n).padStart(2, "0");
const __ordinalEn = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const __getNames = (locale) => ({
  monthsLong: Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: "long" }),
  ),
  monthsShort: Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: "short" }),
  ),
  weekdaysLong: Array.from({ length: 7 }, (_, i) =>
    new Date(2000, 0, 2 + i).toLocaleDateString(locale, { weekday: "long" }),
  ),
  weekdaysShort: Array.from({ length: 7 }, (_, i) =>
    new Date(2000, 0, 2 + i).toLocaleDateString(locale, { weekday: "short" }),
  ),
});
const __tokenOrder = [
  "YYYY",
  "YY",
  "MMMM",
  "MMM",
  "MM",
  "M",
  "Do",
  "DD",
  "D",
  "dddd",
  "ddd",
];

const formatSipDate = (tokens, date, locale) => {
  const names = __getNames(locale);
  const map = {
    YYYY: String(date.getFullYear()),
    YY: String(date.getFullYear()).slice(-2),
    MMMM: names.monthsLong[date.getMonth()],
    MMM: names.monthsShort[date.getMonth()],
    MM: __pad2(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: __pad2(date.getDate()),
    Do: __ordinalEn(date.getDate()),
    D: String(date.getDate()),
    dddd: names.weekdaysLong[date.getDay()],
    ddd: names.weekdaysShort[date.getDay()],
  };
  const literals = [];
  let out = (tokens || "").replace(/\[([^\]]*)\]/g, (_, lit) => {
    literals.push(lit);
    return `\x00L${literals.length - 1}\x00`;
  });
  const markers = __tokenOrder.map((t, i) => ({ t, m: `\x00T${i}\x00` }));
  for (const { t, m } of markers) out = out.split(t).join(m);
  for (const { t, m } of markers) out = out.split(m).join(map[t]);
  literals.forEach((lit, i) => {
    out = out.split(`\x00L${i}\x00`).join(lit);
  });
  return out;
};

const computeDynamicDate = () =>
  formatSipDate(
    DATE_TOKENS,
    new Date(Date.now() + DATE_OFFSET_DAYS * 86400000),
    DATE_LOCALE,
  );

export const CongratsOverlay = () => {
  const dateText = computeDynamicDate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center text-white"
      style={{
        fontFamily: "Assistant, sans-serif",
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-7xl  font-bold tracking-wide"
      >
        CONGRATS!
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="text-3xl  font-semibold mt-2 landscape:mt-1 opacity-95"
      >
        YOU&apos;VE GOT...
      </motion.div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-42 mt-4"
      >
        <motion.img
          src={discount}
          alt="61% OFF ENDS TODAY"
          draggable={false}
          animate={{ rotate: [0, -8, 8, -6, 6, -4, 4, 0] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: "easeInOut",
          }}
          className="w-full object-contain"
        />
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl  font-bold mt-4 tracking-wide"
      >
        {dateText}
      </motion.div>
    </motion.div>
  );
};

export default CongratsOverlay;

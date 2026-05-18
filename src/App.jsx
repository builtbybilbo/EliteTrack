import { useState, useCallback, useEffect, useRef } from "react";

const COACH_CREDENTIALS = { username: "coach", password: "elite2024" };
const STORAGE_KEYS = { clients: "elitetrack_clients", workouts: "elitetrack_workouts", logs: "elitetrack_logs" };

const DEFAULT_CLIENTS = [
  { id: "c1", name: "James Harrington", email: "james@example.com", pin: "1234", goal: "Strength", joinDate: "2024-01-15", avatar: "JH" },
  { id: "c2", name: "Sofia Marchetti", email: "sofia@example.com", pin: "5678", goal: "Hypertrophy", joinDate: "2024-02-20", avatar: "SM" },
];

const DEFAULT_WORKOUTS = {
  c1: [
    { id: "w1", name: "Power Block A", day: "Monday", exercises: [
      { id: "e1", name: "Back Squat", sets: 4, reps: 5, baseWeight: 120, unit: "kg" },
      { id: "e2", name: "Bench Press", sets: 4, reps: 5, baseWeight: 95, unit: "kg" },
      { id: "e3", name: "Barbell Row", sets: 3, reps: 6, baseWeight: 80, unit: "kg" },
    ]},
    { id: "w2", name: "Power Block B", day: "Thursday", exercises: [
      { id: "e4", name: "Deadlift", sets: 4, reps: 4, baseWeight: 160, unit: "kg" },
      { id: "e5", name: "Overhead Press", sets: 4, reps: 5, baseWeight: 65, unit: "kg" },
      { id: "e6", name: "Pull-Up", sets: 3, reps: 8, baseWeight: 0, unit: "kg" },
    ]}
  ],
  c2: [
    { id: "w3", name: "Hypertrophy Upper", day: "Tuesday", exercises: [
      { id: "e7", name: "Incline Dumbbell Press", sets: 4, reps: 10, baseWeight: 30, unit: "kg" },
      { id: "e8", name: "Cable Row", sets: 4, reps: 12, baseWeight: 55, unit: "kg" },
      { id: "e9", name: "Lateral Raise", sets: 3, reps: 15, baseWeight: 12, unit: "kg" },
    ]}
  ]
};

const EXERCISE_MUSCLES = {
  "back squat":["quads","glutes","hamstrings","lower_back"],
  "squat":["quads","glutes","hamstrings"],
  "bench press":["chest","front_delts","triceps"],
  "incline dumbbell press":["chest","front_delts","triceps"],
  "barbell row":["lats","mid_back","biceps","rear_delts"],
  "cable row":["lats","mid_back","biceps"],
  "deadlift":["lower_back","glutes","hamstrings","traps","lats"],
  "overhead press":["front_delts","side_delts","triceps","traps"],
  "pull-up":["lats","biceps","rear_delts"],
  "lateral raise":["side_delts"],
  "bicep curl":["biceps"],
  "tricep pushdown":["triceps"],
  "leg press":["quads","glutes"],
  "romanian deadlift":["hamstrings","glutes","lower_back"],
  "hip thrust":["glutes"],
  "calf raise":["calves"],
  "face pull":["rear_delts","traps"],
  "dumbbell fly":["chest"],
};

function getMuscleSets(exercises) {
  const map = {};
  exercises.forEach(ex => {
    const muscles = EXERCISE_MUSCLES[ex.name.toLowerCase().trim()] || [];
    muscles.forEach(m => { map[m] = (map[m] || 0) + 1; });
  });
  return map;
}

function calcNextWeight(baseWeight, sessionCount, goal) {
  const inc = goal === "Strength" ? 2.5 : 1.25;
  return +(baseWeight + sessionCount * inc).toFixed(2);
}
function calcPB(logs, exerciseId, baseWeight) {
  const relevant = logs.filter(l => l.exerciseId === exerciseId && l.completed);
  if (!relevant.length) return { weight: baseWeight, date: null };
  return relevant.reduce((a, b) => a.weight > b.weight ? a : b);
}
function useStorage(key, fallback) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
  });
  const save = useCallback((v) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key]);
  return [val, save];
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const S = {
  bg: "#080809", surface: "#0f0f11", surfaceHigh: "#151518",
  border: "rgba(255,255,255,0.06)", borderMid: "rgba(255,255,255,0.11)",
  accent: "#5BC8F5", accentDim: "rgba(91,200,245,0.12)", accentBorder: "rgba(91,200,245,0.3)",
  gold: "#C9A84C", goldDim: "rgba(201,168,76,0.10)",
  text: "#F0EFE8", textMuted: "#7a7a76", textFaint: "#464643",
  danger: "#E05454",
  font: "'Cormorant Garamond','Georgia',serif",
  mono: "'DM Sans','Helvetica Neue',sans-serif",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: #080809; color: #F0EFE8; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(91,200,245,0.25); border-radius: 2px; }
  @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
  @keyframes floatIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeScale { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
  .fi  { animation: floatIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .fi1 { animation-delay: 0.05s; } .fi2 { animation-delay: 0.10s; }
  .fi3 { animation-delay: 0.16s; } .fi4 { animation-delay: 0.22s; }
  .fi5 { animation-delay: 0.28s; }
  .pb-shine {
    background: linear-gradient(90deg, #C9A84C 0%, #FFF5CC 50%, #C9A84C 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 2.2s ease infinite;
  }
  button { cursor: pointer; }
  button:active { transform: scale(0.97); }
  input:focus, select:focus {
    outline: none;
    border-color: rgba(91,200,245,0.45) !important;
    box-shadow: 0 0 0 3px rgba(91,200,245,0.08);
  }
  .scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px);
  }
`;

// ─── PAGE TRANSITION ──────────────────────────────────────────────────────────
function PageTransition({ children, id }) {
  const [displayed, setDisplayed] = useState(children);
  const [currentId, setCurrentId] = useState(id);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (id === currentId) {
      setDisplayed(children);
      return;
    }
    setVisible(false);
    const t = setTimeout(() => {
      setDisplayed(children);
      setCurrentId(id);
      setVisible(true);
    }, 260);
    return () => clearTimeout(t);
  }, [id, children]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.983)",
      transition: "opacity 0.26s cubic-bezier(0.4,0,0.2,1), transform 0.26s cubic-bezier(0.4,0,0.2,1)",
    }}>
      {displayed}
    </div>
  );
}

// ─── WATERCOLOUR FIGURE ───────────────────────────────────────────────────────
function WatercolourFigure({ opacity = 0.13 }) {
  return (
    <div style={{ position: "fixed", right: -80, top: 0, bottom: 0, width: 560, pointerEvents: "none", zIndex: 0 }}>
      <svg viewBox="0 0 420 900" style={{ width: "100%", height: "100%", opacity }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="wc" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="7" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feGaussianBlur in="d" stdDeviation="1.4"/>
          </filter>
          <filter id="wcL" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="3" seed="15" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
            <feGaussianBlur stdDeviation="0.9"/>
          </filter>
        </defs>

        {/* watercolour washes */}
        <ellipse cx="210" cy="195" rx="115" ry="145" fill="rgba(91,200,245,0.17)" filter="url(#wc)"/>
        <ellipse cx="205" cy="470" rx="92" ry="128" fill="rgba(91,200,245,0.09)" filter="url(#wc)"/>
        <ellipse cx="210" cy="710" rx="82" ry="98"  fill="rgba(91,200,245,0.07)" filter="url(#wc)"/>
        <ellipse cx="162" cy="345" rx="52" ry="62"  fill="rgba(201,168,76,0.065)" filter="url(#wcL)"/>
        <ellipse cx="256" cy="370" rx="47" ry="55"  fill="rgba(201,168,76,0.045)" filter="url(#wcL)"/>

        {/* ── BODY ── */}
        {/* Head */}
        <ellipse cx="210" cy="65" rx="30" ry="34" fill="none" stroke="rgba(205,202,195,0.72)" strokeWidth="1.8" filter="url(#wcL)"/>
        {/* jaw detail */}
        <path d="M192 90 Q210 100 228 90" fill="none" stroke="rgba(205,202,195,0.25)" strokeWidth="0.9"/>
        {/* Neck */}
        <path d="M197 97 L194 118 M223 97 L226 118" fill="none" stroke="rgba(205,202,195,0.58)" strokeWidth="2" filter="url(#wcL)"/>
        {/* Traps / shoulders */}
        <path d="M194 118 Q158 115 130 133 Q110 146 108 164" fill="none" stroke="rgba(205,202,195,0.68)" strokeWidth="2.6" strokeLinecap="round" filter="url(#wcL)"/>
        <path d="M226 118 Q262 115 290 133 Q310 146 312 164" fill="none" stroke="rgba(205,202,195,0.68)" strokeWidth="2.6" strokeLinecap="round" filter="url(#wcL)"/>
        {/* trap inner */}
        <path d="M200 118 Q182 126 176 143" fill="none" stroke="rgba(205,202,195,0.28)" strokeWidth="1"/>
        <path d="M220 118 Q238 126 244 143" fill="none" stroke="rgba(205,202,195,0.28)" strokeWidth="1"/>
        {/* Chest */}
        <path d="M178 142 Q176 162 180 182 Q194 200 210 202 Q226 200 240 182 Q244 162 242 142" fill="none" stroke="rgba(205,202,195,0.62)" strokeWidth="2" filter="url(#wcL)"/>
        <path d="M210 142 Q208 165 210 202" fill="none" stroke="rgba(205,202,195,0.22)" strokeWidth="0.9"/>
        <path d="M180 159 Q190 167 208 170" fill="none" stroke="rgba(205,202,195,0.18)" strokeWidth="0.8"/>
        <path d="M240 159 Q230 167 212 170" fill="none" stroke="rgba(205,202,195,0.18)" strokeWidth="0.8"/>
        {/* Upper arms */}
        <path d="M130 133 Q112 152 108 186 Q106 212 112 236" fill="none" stroke="rgba(205,202,195,0.60)" strokeWidth="2.4" strokeLinecap="round" filter="url(#wcL)"/>
        <path d="M290 133 Q308 152 312 186 Q314 212 308 236" fill="none" stroke="rgba(205,202,195,0.60)" strokeWidth="2.4" strokeLinecap="round" filter="url(#wcL)"/>
        {/* bicep peaks */}
        <path d="M110 180 Q118 169 128 173" fill="none" stroke="rgba(91,200,245,0.28)" strokeWidth="1"/>
        <path d="M310 180 Q302 169 292 173" fill="none" stroke="rgba(91,200,245,0.28)" strokeWidth="1"/>
        {/* Forearms */}
        <path d="M112 236 Q108 268 114 296 Q118 310 122 322" fill="none" stroke="rgba(205,202,195,0.50)" strokeWidth="1.9" strokeLinecap="round" filter="url(#wcL)"/>
        <path d="M308 236 Q312 268 306 296 Q302 310 298 322" fill="none" stroke="rgba(205,202,195,0.50)" strokeWidth="1.9" strokeLinecap="round" filter="url(#wcL)"/>
        {/* Hands */}
        <ellipse cx="122" cy="330" rx="13" ry="17" fill="none" stroke="rgba(205,202,195,0.43)" strokeWidth="1.4" filter="url(#wcL)"/>
        <ellipse cx="298" cy="330" rx="13" ry="17" fill="none" stroke="rgba(205,202,195,0.43)" strokeWidth="1.4" filter="url(#wcL)"/>
        {/* Abs */}
        <path d="M180 202 Q178 244 180 286 Q190 316 210 324 Q230 316 240 286 Q242 244 240 202" fill="none" stroke="rgba(205,202,195,0.58)" strokeWidth="1.8" filter="url(#wcL)"/>
        <line x1="182" y1="228" x2="238" y2="228" stroke="rgba(205,202,195,0.19)" strokeWidth="0.8"/>
        <line x1="181" y1="256" x2="239" y2="256" stroke="rgba(205,202,195,0.19)" strokeWidth="0.8"/>
        <line x1="182" y1="284" x2="238" y2="284" stroke="rgba(205,202,195,0.19)" strokeWidth="0.8"/>
        <line x1="210" y1="204" x2="210" y2="322" stroke="rgba(205,202,195,0.13)" strokeWidth="0.8"/>
        {/* Obliques */}
        <path d="M180 224 Q164 254 166 286" fill="none" stroke="rgba(205,202,195,0.28)" strokeWidth="1.2"/>
        <path d="M240 224 Q256 254 254 286" fill="none" stroke="rgba(205,202,195,0.28)" strokeWidth="1.2"/>
        {/* Pelvis */}
        <path d="M180 322 Q167 333 165 348 Q172 358 210 362 Q248 358 255 348 Q252 333 240 322" fill="none" stroke="rgba(205,202,195,0.53)" strokeWidth="1.8" filter="url(#wcL)"/>
        {/* Thighs */}
        <path d="M167 350 Q154 402 156 462 Q158 510 164 550" fill="none" stroke="rgba(205,202,195,0.60)" strokeWidth="2.5" strokeLinecap="round" filter="url(#wcL)"/>
        <path d="M253 350 Q266 402 264 462 Q262 510 256 550" fill="none" stroke="rgba(205,202,195,0.60)" strokeWidth="2.5" strokeLinecap="round" filter="url(#wcL)"/>
        <path d="M200 360 Q196 412 198 466 Q200 502 204 548" fill="none" stroke="rgba(205,202,195,0.18)" strokeWidth="1"/>
        <path d="M220 360 Q224 412 222 466 Q220 502 216 548" fill="none" stroke="rgba(205,202,195,0.18)" strokeWidth="1"/>
        {/* quad lines */}
        <path d="M157 410 Q168 404 176 415" fill="none" stroke="rgba(91,200,245,0.22)" strokeWidth="0.8"/>
        <path d="M263 410 Q252 404 244 415" fill="none" stroke="rgba(91,200,245,0.22)" strokeWidth="0.8"/>
        {/* Knees */}
        <ellipse cx="163" cy="558" rx="16" ry="14" fill="none" stroke="rgba(205,202,195,0.38)" strokeWidth="1.5"/>
        <ellipse cx="257" cy="558" rx="16" ry="14" fill="none" stroke="rgba(205,202,195,0.38)" strokeWidth="1.5"/>
        {/* Shins */}
        <path d="M155 570 Q150 622 152 672 Q154 710 158 740" fill="none" stroke="rgba(205,202,195,0.50)" strokeWidth="1.9" strokeLinecap="round" filter="url(#wcL)"/>
        <path d="M265 570 Q270 622 268 672 Q266 710 262 740" fill="none" stroke="rgba(205,202,195,0.50)" strokeWidth="1.9" strokeLinecap="round" filter="url(#wcL)"/>
        {/* calf bulge */}
        <path d="M150 600 Q142 622 146 642" fill="none" stroke="rgba(205,202,195,0.28)" strokeWidth="1.3"/>
        <path d="M270 600 Q278 622 274 642" fill="none" stroke="rgba(205,202,195,0.28)" strokeWidth="1.3"/>
        {/* Feet */}
        <path d="M154 742 Q144 756 134 760 Q126 762 124 757 Q132 746 152 738" fill="none" stroke="rgba(205,202,195,0.38)" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M260 742 Q270 756 280 760 Q288 762 290 757 Q282 746 262 738" fill="none" stroke="rgba(205,202,195,0.38)" strokeWidth="1.4" strokeLinecap="round"/>

        {/* anime ink splatter */}
        {[[146,124,1.6],[162,98,1.1],[272,112,1.3],[287,136,1],[136,316,1.2],[284,302,1.1],[192,62,0.9],[228,57,0.9],[106,208,1.4],[314,222,1.4],[168,50,0.7],[252,46,0.7]].map(([cx,cy,r],i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(205,202,195,0.55)"/>
        ))}
        {/* cross-hatch chest */}
        <path d="M184 152 L195 163 M188 152 L201 164 M192 152 L202 162" stroke="rgba(205,202,195,0.11)" strokeWidth="0.7"/>
        <path d="M226 152 L237 163 M230 152 L241 164 M234 152 L243 162" stroke="rgba(205,202,195,0.11)" strokeWidth="0.7"/>
        {/* speed lines */}
        <line x1="330" y1="42" x2="400" y2="58" stroke="rgba(91,200,245,0.11)" strokeWidth="0.9"/>
        <line x1="334" y1="58" x2="406" y2="70" stroke="rgba(91,200,245,0.07)" strokeWidth="0.7"/>
        <line x1="328" y1="74" x2="400" y2="83" stroke="rgba(91,200,245,0.05)" strokeWidth="0.5"/>
        <line x1="336" y1="26" x2="408" y2="38" stroke="rgba(91,200,245,0.08)" strokeWidth="0.6"/>
      </svg>
    </div>
  );
}

// ─── MUSCLE BODY MAP ──────────────────────────────────────────────────────────
const MUSCLE_REGIONS = {
  front_delts:  { label:"Front Delts", side:"front", cx:126, cy:144, rx:15, ry:13 },
  side_delts:   { label:"Side Delts",  side:"front", cx:104, cy:152, rx:11, ry:11 },
  chest:        { label:"Chest",       side:"front", cx:154, cy:174, rx:26, ry:19 },
  biceps:       { label:"Biceps",      side:"front", cx:94,  cy:196, rx:13, ry:19 },
  triceps:      { label:"Triceps",     side:"front", cx:214, cy:196, rx:13, ry:19 },
  abs:          { label:"Abs",         side:"front", cx:154, cy:244, rx:19, ry:30 },
  quads:        { label:"Quads",       side:"front", cx:138, cy:354, rx:19, ry:32 },
  calves:       { label:"Calves",      side:"front", cx:133, cy:472, rx:12, ry:20 },
  traps:        { label:"Traps",       side:"back",  cx:154, cy:130, rx:21, ry:13 },
  lats:         { label:"Lats",        side:"back",  cx:130, cy:188, rx:17, ry:26 },
  mid_back:     { label:"Mid Back",    side:"back",  cx:154, cy:204, rx:13, ry:17 },
  lower_back:   { label:"Lower Back",  side:"back",  cx:154, cy:258, rx:15, ry:17 },
  rear_delts:   { label:"Rear Delts",  side:"back",  cx:126, cy:144, rx:15, ry:13 },
  glutes:       { label:"Glutes",      side:"back",  cx:146, cy:318, rx:21, ry:21 },
  hamstrings:   { label:"Hamstrings",  side:"back",  cx:142, cy:382, rx:17, ry:28 },
};
const MIRROR_W = 308;
function mColor(score, max) {
  if (!max || !score) return "rgba(255,255,255,0.04)";
  const t = score / max;
  if (t > 0.7) return "rgba(91,200,245,0.60)";
  if (t > 0.4) return "rgba(91,200,245,0.34)";
  return "rgba(91,200,245,0.16)";
}
function mStroke(score, max) {
  if (!max || !score) return "rgba(255,255,255,0.07)";
  const t = score / max;
  if (t > 0.7) return "rgba(91,200,245,0.88)";
  if (t > 0.4) return "rgba(91,200,245,0.52)";
  return "rgba(91,200,245,0.28)";
}

function BodySVG({ side, muscleMap, hovered, setHovered }) {
  const max = Math.max(...Object.values(muscleMap), 1);
  const muscles = Object.entries(MUSCLE_REGIONS).filter(([, r]) => r.side === side);
  const mirrorMuscles = ["traps","mid_back","lower_back"];

  // Shared outline paths
  const OutlineFront = () => (
    <g opacity="0.12" stroke="rgba(255,255,255,1)" strokeWidth="1.2" fill="none">
      <ellipse cx="154" cy="55" rx="24" ry="28"/>
      <path d="M142 82 L139 100 M166 82 L169 100"/>
      <path d="M139 100 Q112 98 88 114 Q70 126 68 142"/>
      <path d="M169 100 Q196 98 220 114 Q238 126 240 142"/>
      <path d="M128 120 Q126 142 130 162 Q142 178 154 180 Q166 178 178 162 Q182 142 180 120"/>
      <path d="M68 112 Q54 134 52 164 Q50 190 56 212"/>
      <path d="M240 112 Q254 134 256 164 Q258 190 252 212"/>
      <path d="M56 212 Q52 244 58 270 Q62 284 66 294"/>
      <path d="M252 212 Q256 244 250 270 Q246 284 242 294"/>
      <path d="M128 180 Q126 220 128 260 Q136 288 154 296 Q172 288 180 260 Q182 220 180 180"/>
      <path d="M128 295 Q116 305 114 318 Q120 326 154 330 Q188 326 194 318 Q190 305 180 295"/>
      <path d="M114 322 Q102 370 104 418 Q106 455 110 486"/>
      <path d="M194 322 Q206 370 204 418 Q202 455 198 486"/>
      <ellipse cx="110" cy="495" rx="13" ry="11"/>
      <ellipse cx="198" cy="495" rx="13" ry="11"/>
      <path d="M103 505 Q99 526 101 545"/>
      <path d="M205 505 Q209 526 207 545"/>
    </g>
  );
  const OutlineBack = () => (
    <g opacity="0.12" stroke="rgba(255,255,255,1)" strokeWidth="1.2" fill="none">
      <ellipse cx="154" cy="55" rx="24" ry="28"/>
      <path d="M142 82 L139 100 M166 82 L169 100"/>
      <path d="M139 100 Q112 98 88 114 Q70 126 68 142"/>
      <path d="M169 100 Q196 98 220 114 Q238 126 240 142"/>
      <path d="M128 120 Q126 162 130 200 Q142 232 154 237 Q166 232 178 200 Q182 162 180 120"/>
      <line x1="154" y1="122" x2="154" y2="276"/>
      <path d="M68 112 Q54 144 52 172 Q50 202 56 222"/>
      <path d="M240 112 Q254 144 256 172 Q258 202 252 222"/>
      <path d="M128 278 Q116 302 114 318 Q122 328 154 332 Q186 328 194 318 Q190 302 180 278"/>
      <path d="M114 324 Q100 374 102 424 Q104 462 108 494"/>
      <path d="M194 324 Q208 374 206 424 Q204 462 200 494"/>
      <ellipse cx="108" cy="504" rx="13" ry="11"/>
      <ellipse cx="200" cy="504" rx="13" ry="11"/>
    </g>
  );

  return (
    <svg viewBox="0 0 308 560" style={{ width: "100%", height: "100%" }}>
      {side === "front" ? <OutlineFront /> : <OutlineBack />}
      {muscles.map(([key, r]) => {
        const score = muscleMap[key] || 0;
        const isH = hovered === key;
        const cx2 = MIRROR_W - r.cx;
        const needsMirror = !mirrorMuscles.includes(key);
        return (
          <g key={key}>
            <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
              fill={mColor(score, max)} stroke={mStroke(score, max)}
              strokeWidth={isH ? 1.6 : 0.8}
              style={{ cursor: "pointer", transition: "fill 0.3s, stroke 0.3s, stroke-width 0.2s" }}
              onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}/>
            {needsMirror && (
              <ellipse cx={cx2} cy={r.cy} rx={r.rx} ry={r.ry}
                fill={mColor(score, max)} stroke={mStroke(score, max)}
                strokeWidth={isH ? 1.6 : 0.8}
                style={{ cursor: "pointer", transition: "fill 0.3s, stroke 0.3s, stroke-width 0.2s" }}
                onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}/>
            )}
          </g>
        );
      })}
      {hovered && MUSCLE_REGIONS[hovered]?.side === side && (
        <text x="154" y="548" textAnchor="middle" fill="rgba(91,200,245,0.88)"
          fontSize="10.5" fontFamily="'DM Sans',sans-serif" letterSpacing="0.07em">
          {MUSCLE_REGIONS[hovered].label} · {muscleMap[hovered] || 0} exercises
        </text>
      )}
    </svg>
  );
}

function BodyMap({ muscleMap }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...Object.values(muscleMap), 1);
  const allMuscles = Object.entries(MUSCLE_REGIONS).map(([k, v]) => ({ key: k, label: v.label, score: muscleMap[k] || 0 }));
  const strong = [...allMuscles].sort((a, b) => b.score - a.score).filter(m => m.score > 0).slice(0, 4);
  const weak   = [...allMuscles].sort((a, b) => a.score - b.score).filter(m => m.score === 0).slice(0, 4);

  return (
    <div style={{ background: S.surface, border: `0.5px solid rgba(91,200,245,0.14)`, borderRadius: 12, padding: "20px 22px", overflow: "hidden" }}>
      <div style={{ height: 2, background: `linear-gradient(90deg,${S.accent},transparent)`, marginBottom: 18, borderRadius: 1 }}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <span style={{ fontFamily: S.font, fontSize: 22, fontWeight: 300, color: S.text }}>Muscle Coverage</span>
        <span style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, letterSpacing: "0.18em" }}>HOVER TO INSPECT</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        {[["ANTERIOR","front"],["POSTERIOR","back"]].map(([label, side]) => (
          <div key={side}>
            <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textFaint, letterSpacing: "0.16em", textAlign: "center", marginBottom: 6 }}>{label}</div>
            <div style={{ height: 260 }}>
              <BodySVG side={side} muscleMap={muscleMap} hovered={hovered} setHovered={setHovered}/>
            </div>
          </div>
        ))}
      </div>
      {/* legend */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 16 }}>
        {[["High","rgba(91,200,245,0.60)"],["Medium","rgba(91,200,245,0.32)"],["Low","rgba(91,200,245,0.14)"],["None","rgba(255,255,255,0.04)"]].map(([l,c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: c, border: "0.5px solid rgba(91,200,245,0.35)" }}/>
            <span style={{ fontFamily: S.mono, fontSize: 9, color: S.textFaint, letterSpacing: "0.1em" }}>{l}</span>
          </div>
        ))}
      </div>
      {/* breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontFamily: S.mono, fontSize: 9, color: S.accent, letterSpacing: "0.14em", marginBottom: 8 }}>STRENGTHS</div>
          {strong.length
            ? strong.map(m => (
                <div key={m.key} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${S.border}` }}>
                  <span style={{ fontFamily: S.mono, fontSize: 11, color: S.text }}>{m.label}</span>
                  <span style={{ fontFamily: S.mono, fontSize: 11, color: S.accent }}>{m.score}</span>
                </div>
              ))
            : <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textFaint }}>Log sessions to reveal</div>}
        </div>
        <div>
          <div style={{ fontFamily: S.mono, fontSize: 9, color: "#E07A5F", letterSpacing: "0.14em", marginBottom: 8 }}>NEEDS WORK</div>
          {weak.map(m => (
            <div key={m.key} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${S.border}` }}>
              <span style={{ fontFamily: S.mono, fontSize: 11, color: S.textMuted }}>{m.label}</span>
              <span style={{ fontFamily: S.mono, fontSize: 11, color: "#E07A5F" }}>0</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Badge({ color = S.accent, children }) {
  const r = color === S.gold ? "201,168,76" : color === "#E07A5F" ? "224,122,95" : "91,200,245";
  return <span style={{ background: `rgba(${r},0.10)`, color, fontSize: 10, fontFamily: S.mono, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 3, border: `0.5px solid rgba(${r},0.28)` }}>{children}</span>;
}
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent},transparent)` }}/>}
      <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: S.font, fontSize: 26, fontWeight: 300, color: S.text }}>{value}</div>
      {sub && <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textFaint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
function Divider() { return <div style={{ height: "0.5px", background: S.border, margin: "20px 0" }}/>; }
function NavBar({ logoColor = S.accent, right }) {
  return (
    <div style={{ padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `0.5px solid ${S.border}`, background: "rgba(8,8,9,0.88)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <polygon points="16,2 30,28 2,28" stroke={logoColor} strokeWidth="1.5" fill="none"/>
          <polygon points="16,8 26,26 6,26" fill={`rgba(${logoColor===S.gold?"201,168,76":"91,200,245"},0.12)`}/>
        </svg>
        <span style={{ fontFamily: S.font, fontSize: 17, fontWeight: 300, letterSpacing: "0.22em", color: S.text }}>ÉLITE TRACK</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{right}</div>
    </div>
  );
}
const INP = { background: S.surfaceHigh, border: `0.5px solid ${S.borderMid}`, borderRadius: 6, padding: "11px 14px", color: S.text, fontFamily: S.mono, fontSize: 13, outline: "none", width: "100%", transition: "border-color 0.2s, box-shadow 0.2s" };

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onCoachLogin, onClientLogin, clients }) {
  const [mode, setMode] = useState("select");
  const [cUser, setCUser] = useState(""); const [cPass, setCPass] = useState("");
  const [sel, setSel] = useState(null); const [pin, setPin] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  function goCoach() {
    setLoading(true); setErr("");
    setTimeout(() => {
      if (cUser === COACH_CREDENTIALS.username && cPass === COACH_CREDENTIALS.password) onCoachLogin();
      else { setErr("Invalid credentials"); setLoading(false); }
    }, 700);
  }
  function goClient() {
    if (!sel) return; setLoading(true); setErr("");
    setTimeout(() => {
      if (pin === sel.pin) onClientLogin(sel);
      else { setErr("Incorrect PIN"); setLoading(false); }
    }, 700);
  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: S.font, position: "relative", overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style>
      <div className="scanlines"/>
      <WatercolourFigure opacity={0.18}/>
      <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="fi" style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 8 }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,28 2,28" stroke={S.accent} strokeWidth="1.5" fill="none"/>
              <polygon points="16,8 26,26 6,26" fill={S.accentDim}/>
              <line x1="16" y1="8" x2="16" y2="22" stroke={S.accent} strokeWidth="1"/>
            </svg>
            <span style={{ fontFamily: S.font, fontSize: 34, fontWeight: 300, letterSpacing: "0.26em", color: S.text }}>ÉLITE TRACK</span>
          </div>
          <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textFaint, letterSpacing: "0.42em", textTransform: "uppercase" }}>Performance Engineering</div>
        </div>

        <PageTransition id={mode}>
          <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {mode === "select" && (
              <div className="fi fi1" style={{ width: "100%" }}>
                <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, textAlign: "center", letterSpacing: "0.2em", marginBottom: 22 }}>SELECT ACCESS LEVEL</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => setMode("client")} style={{ background: S.surface, border: `0.5px solid ${S.borderMid}`, borderRadius: 10, padding: "22px 26px", color: S.text, textAlign: "left", fontFamily: S.font, transition: "border-color 0.2s, background 0.2s" }}>
                    <div style={{ fontSize: 21, fontWeight: 300, letterSpacing: "0.06em", marginBottom: 5 }}>Athlete Portal</div>
                    <div style={{ fontFamily: S.mono, fontSize: 11, color: S.textMuted }}>Access your training programme</div>
                  </button>
                  <button onClick={() => setMode("coach")} style={{ background: S.goldDim, border: `0.5px solid rgba(201,168,76,0.2)`, borderRadius: 10, padding: "22px 26px", color: S.text, textAlign: "left", fontFamily: S.font, transition: "border-color 0.2s, background 0.2s" }}>
                    <div style={{ fontSize: 21, fontWeight: 300, letterSpacing: "0.06em", marginBottom: 5, color: S.gold }}>Coach Dashboard</div>
                    <div style={{ fontFamily: S.mono, fontSize: 11, color: S.textMuted }}>Manage athletes & programmes</div>
                  </button>
                </div>
              </div>
            )}

            {mode === "coach" && (
              <div className="fi" style={{ width: "100%" }}>
                <button onClick={() => { setMode("select"); setErr(""); }} style={{ background: "none", border: "none", color: S.textMuted, fontFamily: S.mono, fontSize: 11, marginBottom: 24, letterSpacing: "0.12em" }}>← BACK</button>
                <div style={{ fontFamily: S.font, fontSize: 26, fontWeight: 300, color: S.gold, marginBottom: 24 }}>Coach Access</div>
                <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, marginBottom: 6, letterSpacing: "0.12em" }}>USERNAME</div>
                <input style={{ ...INP, marginBottom: 12 }} value={cUser} onChange={e => setCUser(e.target.value)} placeholder="coach"/>
                <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, marginBottom: 6, letterSpacing: "0.12em" }}>PASSWORD</div>
                <input type="password" style={{ ...INP, marginBottom: 12 }} value={cPass} onChange={e => setCPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && goCoach()}/>
                {err && <div style={{ color: S.danger, fontFamily: S.mono, fontSize: 12, marginBottom: 10 }}>{err}</div>}
                <button onClick={goCoach} disabled={loading} style={{ width: "100%", background: S.gold, border: "none", borderRadius: 7, padding: "14px", color: "#080809", fontFamily: S.mono, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}>
                  {loading ? "AUTHENTICATING…" : "ACCESS DASHBOARD"}
                </button>
                <div style={{ marginTop: 14, fontFamily: S.mono, fontSize: 10, color: S.textFaint, textAlign: "center" }}>Demo · coach / elite2024</div>
              </div>
            )}

            {mode === "client" && (
              <div className="fi" style={{ width: "100%" }}>
                <button onClick={() => { setMode("select"); setErr(""); setSel(null); setPin(""); }} style={{ background: "none", border: "none", color: S.textMuted, fontFamily: S.mono, fontSize: 11, marginBottom: 24, letterSpacing: "0.12em" }}>← BACK</button>
                <div style={{ fontFamily: S.font, fontSize: 26, fontWeight: 300, color: S.text, marginBottom: 20 }}>Select Athlete</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                  {clients.map(c => (
                    <button key={c.id} onClick={() => { setSel(c); setErr(""); setPin(""); }}
                      style={{ background: sel?.id === c.id ? S.accentDim : S.surface, border: `0.5px solid ${sel?.id === c.id ? S.accentBorder : S.border}`, borderRadius: 9, padding: "14px 18px", color: S.text, display: "flex", alignItems: "center", gap: 14, textAlign: "left", fontFamily: S.font, transition: "all 0.22s" }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: sel?.id === c.id ? S.accentDim : S.surfaceHigh, border: `0.5px solid ${sel?.id === c.id ? S.accentBorder : S.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S.mono, fontSize: 12, color: sel?.id === c.id ? S.accent : S.textMuted, flexShrink: 0 }}>{c.avatar}</div>
                      <div><div style={{ fontFamily: S.font, fontSize: 17, fontWeight: 400 }}>{c.name}</div><div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, marginTop: 2 }}>{c.goal}</div></div>
                    </button>
                  ))}
                </div>
                {sel && (
                  <div className="fi">
                    <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, marginBottom: 6, letterSpacing: "0.12em" }}>ATHLETE PIN</div>
                    <input type="password" maxLength={4} style={{ ...INP, marginBottom: 12 }} value={pin} onChange={e => setPin(e.target.value.replace(/\D/, ""))} placeholder="••••" onKeyDown={e => e.key === "Enter" && goClient()}/>
                    {err && <div style={{ color: S.danger, fontFamily: S.mono, fontSize: 12, marginBottom: 10 }}>{err}</div>}
                    <button onClick={goClient} disabled={loading} style={{ width: "100%", background: S.accent, border: "none", borderRadius: 7, padding: "14px", color: "#080809", fontFamily: S.mono, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}>
                      {loading ? "ENTERING…" : "ENTER PORTAL"}
                    </button>
                    <div style={{ marginTop: 14, fontFamily: S.mono, fontSize: 10, color: S.textFaint, textAlign: "center" }}>Demo · 1234 (James) · 5678 (Sofia)</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PageTransition>
      </div>
      <div style={{ position: "fixed", bottom: 22, fontFamily: S.mono, fontSize: 9, color: S.textFaint, letterSpacing: "0.22em", zIndex: 2 }}>ÉLITE TRACK · PERFORMANCE ENGINEERING</div>
    </div>
  );
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────────────
function ClientDashboard({ client, workouts, logs, onLogSet, onLogout }) {
  const [view, setView] = useState("home");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);
  const [setLog, setSetLog] = useState({});
  const [currentSet, setCurrentSet] = useState(1);
  const [tempWeight, setTempWeight] = useState(0);
  const [tempReps, setTempReps] = useState(0);

  const cw = workouts[client.id] || [];
  const allEx = cw.flatMap(w => w.exercises);
  const muscleMap = getMuscleSets(allEx);
  const totalSessions = [...new Set(logs.map(l => l.date))].length;
  const totalPBs = allEx.filter(ex => calcPB(logs, ex.id, ex.baseWeight).weight > ex.baseWeight).length;

  function scCount(eid) { return logs.filter(l => l.exerciseId === eid && l.completed).length; }
  function nw(ex) { return calcNextWeight(ex.baseWeight, Math.floor(scCount(ex.id) / ex.sets), client.goal); }
  function pb(ex) { return calcPB(logs, ex.id, ex.baseWeight); }

  function startWorkout(w) {
    setActiveWorkout(w); setActiveExercise(w.exercises[0]); setSetLog({}); setCurrentSet(1);
    setTempWeight(nw(w.exercises[0])); setTempReps(w.exercises[0].reps);
    setView("workout");
  }
  function logSet(eid, sn, weight, reps) {
    setSetLog(prev => ({ ...prev, [`${eid}-${sn}`]: { weight: +weight, reps: +reps, done: true } }));
    onLogSet({ exerciseId: eid, setNum: sn, weight: +weight, reps: +reps, date: new Date().toISOString().split("T")[0], completed: true });
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const NavRight = () => (
    <>
      {view === "home" && (
        <>
          <button onClick={() => setView("body")} style={{ background: "none", border: `0.5px solid ${S.border}`, borderRadius: 4, padding: "6px 13px", color: S.textMuted, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>BODY MAP</button>
          <button onClick={() => setView("history")} style={{ background: "none", border: `0.5px solid ${S.border}`, borderRadius: 4, padding: "6px 13px", color: S.textMuted, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>HISTORY</button>
        </>
      )}
      {view !== "home" && view !== "workout" && view !== "complete" && (
        <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: S.textMuted, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>← HOME</button>
      )}
      <button onClick={onLogout} style={{ background: "none", border: `0.5px solid ${S.border}`, borderRadius: 4, padding: "6px 13px", color: S.textFaint, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>SIGN OUT</button>
    </>
  );

  // ── Workout view (non-transition for live updates)
  if (view === "workout" && activeWorkout && activeExercise) {
    const exIdx = activeWorkout.exercises.findIndex(e => e.id === activeExercise.id);
    const setsComplete = Array.from({ length: activeExercise.sets }, (_, i) => setLog[`${activeExercise.id}-${i + 1}`]?.done);
    const allDone = setsComplete.every(Boolean);
    const isPBTarget = nw(activeExercise) > pb(activeExercise).weight;

    function nextEx() {
      if (exIdx < activeWorkout.exercises.length - 1) {
        const ne = activeWorkout.exercises[exIdx + 1];
        setActiveExercise(ne); setCurrentSet(1); setTempWeight(nw(ne)); setTempReps(ne.reps);
      } else setView("complete");
    }

    return (
      <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.font, color: S.text, position: "relative" }}>
        <style>{GLOBAL_CSS}</style>
        <WatercolourFigure opacity={0.07}/>
        <div style={{ position: "relative", zIndex: 2 }}>
          <NavBar right={<button onClick={() => setView("home")} style={{ background: "none", border: `0.5px solid ${S.border}`, borderRadius: 4, padding: "6px 13px", color: S.textMuted, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>← EXIT</button>}/>
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.1em" }}>{activeWorkout.name.toUpperCase()}</span>
              <span style={{ fontFamily: S.mono, fontSize: 10, color: S.accent }}>{exIdx + 1} / {activeWorkout.exercises.length}</span>
            </div>
            <div style={{ height: 2, background: S.surfaceHigh, borderRadius: 1, marginBottom: 28, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((exIdx + 1) / activeWorkout.exercises.length) * 100}%`, background: `linear-gradient(90deg,${S.accent},${S.gold})`, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }}/>
            </div>

            <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.2em", marginBottom: 6 }}>EXERCISE {exIdx + 1}</div>
            <h1 style={{ fontFamily: S.font, fontSize: 38, fontWeight: 300, letterSpacing: "0.02em", marginBottom: 12 }}>{activeExercise.name}</h1>
            {isPBTarget && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: S.goldDim, border: `0.5px solid rgba(201,168,76,0.28)`, borderRadius: 6, padding: "8px 14px", marginBottom: 18 }}>
                <span style={{ color: S.gold }}>★</span>
                <span style={{ fontFamily: S.mono, fontSize: 10, color: S.gold, letterSpacing: "0.1em" }}>PB OPPORTUNITY — {nw(activeExercise)}{activeExercise.unit}</span>
              </div>
            )}

            <div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "20px 22px", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {setsComplete.map((done, i) => (
                  <div key={i} onClick={() => setCurrentSet(i + 1)}
                    style={{ flex: 1, height: 36, borderRadius: 6, background: done ? S.accentDim : currentSet === i + 1 ? S.surfaceHigh : "transparent", border: `0.5px solid ${done ? S.accentBorder : currentSet === i + 1 ? S.borderMid : S.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
                    {done ? <span style={{ color: S.accent, fontSize: 14 }}>✓</span> : <span style={{ fontFamily: S.mono, fontSize: 11, color: currentSet === i + 1 ? S.text : S.textFaint }}>S{i + 1}</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                {[["WEIGHT ("+activeExercise.unit+")", tempWeight, setTempWeight, 2.5], ["REPS", tempReps, setTempReps, 1]].map(([lbl, val, setter, step]) => (
                  <div key={lbl}>
                    <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, letterSpacing: "0.12em", marginBottom: 8 }}>{lbl}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => setter(v => +(Math.max(0, v - step)).toFixed(2))} style={{ width: 32, height: 32, background: S.surfaceHigh, border: `0.5px solid ${S.border}`, borderRadius: 6, color: S.text, fontFamily: S.mono, fontSize: 18 }}>−</button>
                      <div style={{ flex: 1, textAlign: "center", fontFamily: S.font, fontSize: 30, fontWeight: 300 }}>{val}</div>
                      <button onClick={() => setter(v => +(v + step).toFixed(2))} style={{ width: 32, height: 32, background: S.surfaceHigh, border: `0.5px solid ${S.border}`, borderRadius: 6, color: S.text, fontFamily: S.mono, fontSize: 18 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { logSet(activeExercise.id, currentSet, tempWeight, tempReps); if (currentSet < activeExercise.sets) setCurrentSet(s => s + 1); }}
                disabled={setsComplete[currentSet - 1]}
                style={{ width: "100%", background: setsComplete[currentSet - 1] ? S.surfaceHigh : S.accent, border: "none", borderRadius: 8, padding: "14px", color: setsComplete[currentSet - 1] ? S.textFaint : "#080809", fontFamily: S.mono, fontSize: 12, letterSpacing: "0.14em", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
                {setsComplete[currentSet - 1] ? `SET ${currentSet} LOGGED ✓` : `LOG SET ${currentSet}`}
              </button>
            </div>

            {allDone && (
              <button onClick={nextEx} style={{ width: "100%", background: S.goldDim, border: `0.5px solid rgba(201,168,76,0.35)`, borderRadius: 8, padding: "15px", color: S.gold, fontFamily: S.mono, fontSize: 12, letterSpacing: "0.14em" }}>
                {exIdx < activeWorkout.exercises.length - 1 ? "NEXT EXERCISE →" : "COMPLETE WORKOUT ✓"}
              </button>
            )}

            <div style={{ marginTop: 24 }}>
              {activeWorkout.exercises.map((ex, i) => (
                <div key={ex.id} onClick={() => { setActiveExercise(ex); setCurrentSet(1); setTempWeight(nw(ex)); setTempReps(ex.reps); }}
                  style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `0.5px solid ${S.border}`, cursor: "pointer", opacity: i === exIdx ? 1 : 0.42, transition: "opacity 0.2s" }}>
                  <span style={{ fontFamily: S.mono, fontSize: 11, color: i === exIdx ? S.accent : S.textMuted }}>{i === exIdx ? "▶ " : ""}{ex.name}</span>
                  <span style={{ fontFamily: S.mono, fontSize: 11, color: S.textFaint }}>{ex.sets}×{ex.reps}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.font, color: S.text, position: "relative" }}>
      <style>{GLOBAL_CSS}</style>
      <WatercolourFigure opacity={0.09}/>
      <div style={{ position: "relative", zIndex: 2 }}>
        <NavBar right={<NavRight/>}/>
        <PageTransition id={view}>
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>

            {/* ── HOME ── */}
            {view === "home" && (
              <>
                <div className="fi" style={{ marginBottom: 30 }}>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.2em", marginBottom: 8 }}>{greeting.toUpperCase()}</div>
                  <h1 style={{ fontFamily: S.font, fontSize: 46, fontWeight: 300, letterSpacing: "0.02em", lineHeight: 1.05, marginBottom: 10 }}>{client.name.split(" ")[0]}</h1>
                  <div style={{ display: "flex", gap: 8 }}><Badge color={S.accent}>{client.goal}</Badge><Badge color={S.gold}>Since {client.joinDate}</Badge></div>
                </div>

                <div className="fi fi1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 32 }}>
                  <StatCard label="Sessions" value={totalSessions} sub="completed" accent={S.accent}/>
                  <StatCard label="Personal Bests" value={totalPBs} sub="records" accent={S.gold}/>
                  <StatCard label="Programme" value={cw.length} sub="sessions/wk" accent={S.accent}/>
                </div>

                {/* muscle preview bar */}
                <div className="fi fi2" onClick={() => setView("body")}
                  style={{ background: S.surface, border: `0.5px solid rgba(91,200,245,0.12)`, borderRadius: 10, padding: "14px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26, transition: "border-color 0.2s" }}>
                  <div>
                    <div style={{ fontFamily: S.font, fontSize: 18, fontWeight: 300, marginBottom: 4 }}>Muscle Coverage Map</div>
                    <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted }}>Strength & weakness analysis →</div>
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
                    {Object.values(muscleMap).concat([0,0,0,0,0]).slice(0, 6).map((v, i) => (
                      <div key={i} style={{ width: 7, height: 8 + (v * 8), borderRadius: 3, background: mColor(v, Math.max(...Object.values(muscleMap), 1)), border: "0.5px solid rgba(91,200,245,0.3)", transition: "height 0.4s" }}/>
                    ))}
                  </div>
                </div>

                <div className="fi fi3" style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                    <h2 style={{ fontFamily: S.font, fontSize: 24, fontWeight: 300 }}>Your Programme</h2>
                    <span style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted }}>{cw.length} SESSIONS</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {cw.map((w, i) => (
                      <div key={w.id} className={`fi fi${Math.min(i + 3, 5)}`} onClick={() => startWorkout(w)}
                        style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "18px 22px", cursor: "pointer", transition: "border-color 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <div style={{ fontFamily: S.font, fontSize: 20, fontWeight: 400, letterSpacing: "0.03em", marginBottom: 3 }}>{w.name}</div>
                            <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.1em" }}>{w.day.toUpperCase()} · {w.exercises.length} EXERCISES</div>
                          </div>
                          <div style={{ background: S.accentDim, border: `0.5px solid ${S.accentBorder}`, borderRadius: 6, padding: "7px 14px", color: S.accent, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>START →</div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {w.exercises.map(ex => {
                            const nextW = nw(ex); const isPB = nextW > pb(ex).weight;
                            return (
                              <div key={ex.id} style={{ background: S.surfaceHigh, borderRadius: 6, padding: "5px 10px", border: `0.5px solid ${S.border}` }}>
                                <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, marginBottom: 2 }}>{ex.name}</div>
                                <div style={{ fontFamily: S.mono, fontSize: 11, color: isPB ? S.gold : S.text }}>{ex.sets}×{ex.reps} @ {nextW}{ex.unit}{isPB && <span style={{ marginLeft: 4, fontSize: 9 }}>★</span>}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {cw.length === 0 && (
                      <div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
                        <div style={{ fontFamily: S.mono, fontSize: 11, color: S.textFaint }}>No programme assigned yet</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="fi fi4">
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                    <h2 style={{ fontFamily: S.font, fontSize: 24, fontWeight: 300 }}>Personal Bests</h2>
                    <Badge color={S.gold}>RECORD BOARD</Badge>
                  </div>
                  <div style={{ background: S.surface, border: `0.5px solid rgba(201,168,76,0.18)`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: 2, background: `linear-gradient(90deg,${S.gold},transparent)` }}/>
                    {allEx.map((ex, i) => {
                      const p = pb(ex); const nextW = nw(ex);
                      return (
                        <div key={ex.id} style={{ padding: "13px 22px", borderBottom: i < allEx.length - 1 ? `0.5px solid ${S.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontFamily: S.mono, fontSize: 12, color: S.text }}>{ex.name}</div>
                            {p.date && <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textFaint, marginTop: 2 }}>{p.date}</div>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div className={p.weight > ex.baseWeight ? "pb-shine" : ""} style={{ fontFamily: S.font, fontSize: 22, fontWeight: 300, color: p.weight > ex.baseWeight ? undefined : S.textMuted }}>{p.weight}{ex.unit}</div>
                            <div style={{ fontFamily: S.mono, fontSize: 9, color: S.accent, marginTop: 2 }}>Target: {nextW}{ex.unit}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── BODY MAP ── */}
            {view === "body" && (
              <>
                <div className="fi" style={{ marginBottom: 26 }}>
                  <h1 style={{ fontFamily: S.font, fontSize: 40, fontWeight: 300, letterSpacing: "0.02em", marginBottom: 6 }}>Body Analysis</h1>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.15em" }}>BASED ON YOUR CURRENT PROGRAMME</div>
                </div>
                <div className="fi fi1"><BodyMap muscleMap={muscleMap}/></div>
              </>
            )}

            {/* ── COMPLETE ── */}
            {view === "complete" && (
              <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="fi" style={{ textAlign: "center", maxWidth: 440 }}>
                  <div style={{ fontFamily: S.font, fontSize: 76, fontWeight: 300, color: S.gold, marginBottom: 4, lineHeight: 1 }}>★</div>
                  <h1 style={{ fontFamily: S.font, fontSize: 44, fontWeight: 300, letterSpacing: "0.04em", marginBottom: 6 }}>Session Complete</h1>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.2em", marginBottom: 30 }}>OUTSTANDING PERFORMANCE</div>
                  <div style={{ background: S.surface, border: `0.5px solid rgba(201,168,76,0.2)`, borderRadius: 10, padding: "18px 24px", marginBottom: 22 }}>
                    <div style={{ fontFamily: S.mono, fontSize: 10, color: S.gold, letterSpacing: "0.12em", marginBottom: 10 }}>NEXT SESSION TARGETS</div>
                    {(activeWorkout?.exercises || []).map(ex => (
                      <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `0.5px solid ${S.border}` }}>
                        <span style={{ fontFamily: S.mono, fontSize: 11, color: S.text }}>{ex.name}</span>
                        <span style={{ fontFamily: S.mono, fontSize: 11, color: S.accent }}>{ex.sets}×{ex.reps} @ {nw(ex)}{ex.unit}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setView("home")} style={{ background: S.accent, border: "none", borderRadius: 8, padding: "14px 32px", color: "#080809", fontFamily: S.mono, fontSize: 12, letterSpacing: "0.14em" }}>RETURN TO DASHBOARD</button>
                </div>
              </div>
            )}

            {/* ── HISTORY ── */}
            {view === "history" && (
              <>
                <div className="fi" style={{ marginBottom: 22 }}>
                  <h1 style={{ fontFamily: S.font, fontSize: 40, fontWeight: 300, letterSpacing: "0.02em", marginBottom: 6 }}>Session Log</h1>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.15em" }}>{logs.length} ENTRIES RECORDED</div>
                </div>
                {logs.length === 0
                  ? <div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}><div style={{ fontFamily: S.mono, fontSize: 11, color: S.textFaint }}>No sessions logged yet</div></div>
                  : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[...logs].reverse().slice(0, 30).map((l, i) => {
                        const ex = allEx.find(e => e.id === l.exerciseId);
                        if (!ex) return null;
                        return (
                          <div key={i} className={`fi fi${Math.min(i + 1, 5)}`} style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontFamily: S.mono, fontSize: 12, color: S.text }}>{ex.name}</div>
                              <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textFaint, marginTop: 2 }}>{l.date} · Set {l.setNum}</div>
                            </div>
                            <div style={{ fontFamily: S.font, fontSize: 20, fontWeight: 300, color: S.accent }}>{l.weight}{ex.unit} × {l.reps}</div>
                          </div>
                        );
                      })}
                    </div>
                }
              </>
            )}
          </div>
        </PageTransition>
      </div>
    </div>
  );
}

// ─── COACH DASHBOARD ──────────────────────────────────────────────────────────
function CoachDashboard({ clients, setClients, workouts, setWorkouts, onLogout }) {
  const [view, setView] = useState("overview");
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({});
  const [wForm, setWForm] = useState({ name: "", day: "Monday", exercises: [] });
  const [newEx, setNewEx] = useState({ name: "", sets: 3, reps: 8, baseWeight: 60, unit: "kg" });

  function addClient() {
    const id = "c" + Date.now();
    const c = { id, name: form.name || "New Athlete", email: form.email || "", pin: form.pin || "0000", goal: form.goal || "Strength", joinDate: new Date().toISOString().split("T")[0], avatar: (form.name || "NA").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) };
    setClients([...clients, c]); setWorkouts({ ...workouts, [id]: [] }); setForm({}); setView("overview");
  }
  function addWorkout() {
    if (!sel) return;
    const w = { id: "w" + Date.now(), name: wForm.name || "New Session", day: wForm.day, exercises: wForm.exercises };
    setWorkouts({ ...workouts, [sel.id]: [...(workouts[sel.id] || []), w] });
    setWForm({ name: "", day: "Monday", exercises: [] }); setView("client");
  }
  function addEx() {
    if (!newEx.name) return;
    setWForm(f => ({ ...f, exercises: [...f.exercises, { ...newEx, id: "e" + Date.now() }] }));
    setNewEx({ name: "", sets: 3, reps: 8, baseWeight: 60, unit: "kg" });
  }
  function removeWorkout(cid, wid) { setWorkouts({ ...workouts, [cid]: workouts[cid].filter(w => w.id !== wid) }); }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.font, color: S.text, position: "relative" }}>
      <style>{GLOBAL_CSS}</style>
      <WatercolourFigure opacity={0.06}/>
      <div style={{ position: "relative", zIndex: 2 }}>
        <NavBar logoColor={S.gold} right={
          <>
            <Badge color={S.gold}>COACH</Badge>
            <button onClick={onLogout} style={{ background: "none", border: `0.5px solid ${S.border}`, borderRadius: 4, padding: "6px 13px", color: S.textFaint, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>SIGN OUT</button>
          </>
        }/>
        <PageTransition id={view}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 28px" }}>

            {view === "overview" && (
              <>
                <div className="fi" style={{ marginBottom: 28 }}>
                  <h1 style={{ fontFamily: S.font, fontSize: 40, fontWeight: 300, marginBottom: 6 }}>Coach Dashboard</h1>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.15em" }}>{clients.length} ATHLETES UNDER MANAGEMENT</div>
                </div>
                <div className="fi fi1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 30 }}>
                  <StatCard label="Athletes" value={clients.length} accent={S.gold}/>
                  <StatCard label="Programmes" value={Object.values(workouts).flat().length} sub="total" accent={S.accent}/>
                  <StatCard label="Exercises" value={Object.values(workouts).flat().flatMap(w => w.exercises).length} sub="tracked" accent={S.accent}/>
                </div>
                <div className="fi fi2" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h2 style={{ fontFamily: S.font, fontSize: 22, fontWeight: 300 }}>Athletes</h2>
                  <button onClick={() => setView("addClient")} style={{ background: S.goldDim, border: `0.5px solid rgba(201,168,76,0.28)`, borderRadius: 6, padding: "8px 16px", color: S.gold, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>+ ADD ATHLETE</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {clients.map((c, i) => (
                    <div key={c.id} className={`fi fi${Math.min(i + 2, 5)}`} onClick={() => { setSel(c); setView("client"); }}
                      style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: S.goldDim, border: `0.5px solid rgba(201,168,76,0.22)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S.mono, fontSize: 13, color: S.gold, flexShrink: 0 }}>{c.avatar}</div>
                        <div>
                          <div style={{ fontFamily: S.font, fontSize: 19, fontWeight: 400, marginBottom: 4 }}>{c.name}</div>
                          <div style={{ display: "flex", gap: 8 }}><Badge color={S.accent}>{c.goal}</Badge><span style={{ fontFamily: S.mono, fontSize: 10, color: S.textFaint }}>{(workouts[c.id] || []).length} sessions</span></div>
                        </div>
                      </div>
                      <span style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.1em" }}>MANAGE →</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "client" && sel && (
              <>
                <button onClick={() => setView("overview")} style={{ background: "none", border: "none", color: S.textMuted, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em", marginBottom: 24 }}>← ATHLETES</button>
                <div className="fi" style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26 }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: S.goldDim, border: `0.5px solid rgba(201,168,76,0.28)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S.mono, fontSize: 16, color: S.gold }}>{sel.avatar}</div>
                  <div>
                    <h1 style={{ fontFamily: S.font, fontSize: 32, fontWeight: 300 }}>{sel.name}</h1>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}><Badge color={S.accent}>{sel.goal}</Badge><Badge color={S.gold}>PIN: {sel.pin}</Badge></div>
                  </div>
                </div>
                <div className="fi fi1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h2 style={{ fontFamily: S.font, fontSize: 20, fontWeight: 300 }}>Assigned Programme</h2>
                  <button onClick={() => setView("addWorkout")} style={{ background: S.accentDim, border: `0.5px solid ${S.accentBorder}`, borderRadius: 6, padding: "8px 16px", color: S.accent, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>+ ADD SESSION</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(workouts[sel.id] || []).map(w => (
                    <div key={w.id} className="fi" style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: S.font, fontSize: 18, fontWeight: 400, marginBottom: 3 }}>{w.name}</div>
                          <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.1em" }}>{w.day.toUpperCase()} · {w.exercises.length} EXERCISES</div>
                        </div>
                        <button onClick={() => removeWorkout(sel.id, w.id)} style={{ background: "none", border: `0.5px solid rgba(224,84,84,0.22)`, borderRadius: 4, padding: "4px 10px", color: S.danger, fontFamily: S.mono, fontSize: 9, letterSpacing: "0.1em" }}>REMOVE</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {w.exercises.map(ex => (
                          <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", background: S.surfaceHigh, borderRadius: 6 }}>
                            <span style={{ fontFamily: S.mono, fontSize: 11, color: S.text }}>{ex.name}</span>
                            <span style={{ fontFamily: S.mono, fontSize: 11, color: S.textMuted }}>{ex.sets}×{ex.reps} @ {ex.baseWeight}{ex.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!(workouts[sel.id] || []).length && (
                    <div style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 28, textAlign: "center" }}>
                      <div style={{ fontFamily: S.mono, fontSize: 11, color: S.textFaint }}>No sessions assigned yet</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {view === "addClient" && (
              <>
                <button onClick={() => setView("overview")} style={{ background: "none", border: "none", color: S.textMuted, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em", marginBottom: 24 }}>← CANCEL</button>
                <h1 className="fi" style={{ fontFamily: S.font, fontSize: 34, fontWeight: 300, marginBottom: 28 }}>Add New Athlete</h1>
                {[["Full Name","name","text","Alex Johnson"],["Email","email","email","athlete@email.com"],["PIN (4 digits)","pin","text","1234"]].map(([lbl, key, type, ph]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>{lbl.toUpperCase()}</div>
                    <input type={type} style={INP} placeholder={ph} maxLength={key === "pin" ? 4 : undefined} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/>
                  </div>
                ))}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>TRAINING GOAL</div>
                  <select style={INP} value={form.goal || "Strength"} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
                    {["Strength","Hypertrophy","Endurance","Power"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <button onClick={addClient} style={{ width: "100%", background: S.gold, border: "none", borderRadius: 8, padding: "14px", color: "#080809", fontFamily: S.mono, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em" }}>ADD ATHLETE</button>
              </>
            )}

            {view === "addWorkout" && (
              <>
                <button onClick={() => setView("client")} style={{ background: "none", border: "none", color: S.textMuted, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em", marginBottom: 24 }}>← CANCEL</button>
                <h1 className="fi" style={{ fontFamily: S.font, fontSize: 32, fontWeight: 300, marginBottom: 6 }}>Create Session</h1>
                <div className="fi" style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, marginBottom: 22 }}>for {sel?.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>SESSION NAME</div>
                    <input style={INP} placeholder="Power Block A" value={wForm.name} onChange={e => setWForm(f => ({ ...f, name: e.target.value }))}/>
                  </div>
                  <div>
                    <div style={{ fontFamily: S.mono, fontSize: 9, color: S.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>DAY</div>
                    <select style={INP} value={wForm.day} onChange={e => setWForm(f => ({ ...f, day: e.target.value }))}>
                      {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <Divider/>
                <div style={{ fontFamily: S.font, fontSize: 19, fontWeight: 300, marginBottom: 14 }}>Exercises</div>
                {wForm.exercises.map((ex, i) => (
                  <div key={ex.id} style={{ background: S.surface, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: S.mono, fontSize: 12, color: S.text }}>{ex.name}</div>
                      <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textFaint, marginTop: 2 }}>{ex.sets}×{ex.reps} @ {ex.baseWeight}{ex.unit}</div>
                    </div>
                    <button onClick={() => setWForm(f => ({ ...f, exercises: f.exercises.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: S.danger, fontSize: 14 }}>✕</button>
                  </div>
                ))}
                <div style={{ background: S.surfaceHigh, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: S.textMuted, letterSpacing: "0.1em", marginBottom: 10 }}>ADD EXERCISE</div>
                  <input style={{ ...INP, marginBottom: 8 }} placeholder="Exercise name" value={newEx.name} onChange={e => setNewEx(f => ({ ...f, name: e.target.value }))}/>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px", gap: 8, marginBottom: 10 }}>
                    {[["Sets","sets"],["Reps","reps"],["Base Wt","baseWeight"]].map(([lbl, key]) => (
                      <div key={key}>
                        <div style={{ fontFamily: S.mono, fontSize: 8, color: S.textFaint, letterSpacing: "0.1em", marginBottom: 4 }}>{lbl.toUpperCase()}</div>
                        <input type="number" style={INP} value={newEx[key]} onChange={e => setNewEx(f => ({ ...f, [key]: +e.target.value }))}/>
                      </div>
                    ))}
                    <div>
                      <div style={{ fontFamily: S.mono, fontSize: 8, color: S.textFaint, letterSpacing: "0.1em", marginBottom: 4 }}>UNIT</div>
                      <select style={INP} value={newEx.unit} onChange={e => setNewEx(f => ({ ...f, unit: e.target.value }))}><option>kg</option><option>lbs</option></select>
                    </div>
                  </div>
                  <button onClick={addEx} style={{ background: S.accentDim, border: `0.5px solid ${S.accentBorder}`, borderRadius: 6, padding: "8px 16px", color: S.accent, fontFamily: S.mono, fontSize: 10, letterSpacing: "0.12em" }}>+ ADD</button>
                </div>
                <button onClick={addWorkout} disabled={!wForm.name || !wForm.exercises.length}
                  style={{ width: "100%", background: wForm.name && wForm.exercises.length ? S.accent : S.surfaceHigh, border: "none", borderRadius: 8, padding: "14px", color: wForm.name && wForm.exercises.length ? "#080809" : S.textFaint, fontFamily: S.mono, fontSize: 12, letterSpacing: "0.14em", fontWeight: 500 }}>
                  SAVE SESSION
                </button>
              </>
            )}
          </div>
        </PageTransition>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [clients, setClients] = useStorage(STORAGE_KEYS.clients, DEFAULT_CLIENTS);
  const [workouts, setWorkouts] = useStorage(STORAGE_KEYS.workouts, DEFAULT_WORKOUTS);
  const [logs, setLogs] = useStorage(STORAGE_KEYS.logs, []);
  const [auth, setAuth] = useState(null);

  function clientLogs(cid) {
    const ids = new Set((workouts[cid] || []).flatMap(w => w.exercises.map(e => e.id)));
    return logs.filter(l => ids.has(l.exerciseId));
  }

  if (!auth) return <LoginScreen onCoachLogin={() => setAuth({ type: "coach" })} onClientLogin={c => setAuth({ type: "client", client: c })} clients={clients}/>;
  if (auth.type === "coach") return <CoachDashboard clients={clients} setClients={setClients} workouts={workouts} setWorkouts={setWorkouts} onLogout={() => setAuth(null)}/>;
  if (auth.type === "client") return <ClientDashboard client={auth.client} workouts={workouts} logs={clientLogs(auth.client.id)} onLogSet={e => setLogs(p => [...p, e])} onLogout={() => setAuth(null)}/>;
}

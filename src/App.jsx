import { useState, useCallback, useEffect, useRef } from "react";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const COACH = { username: "coach", password: "elite2024" };
const KEYS = { clients:"bbb_clients", workouts:"bbb_workouts", logs:"bbb_logs", templates:"et_templates" };

function useStorage(key, fallback) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
  });
  const save = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, save];
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const GOALS = ["Strength","Hypertrophy","Endurance","Power","Weight Loss","Athlete"];

const EXERCISE_MUSCLES = {
  "back squat":["quads","glutes","hamstrings","lower_back"],
  "front squat":["quads","glutes"],
  "squat":["quads","glutes","hamstrings"],
  "bench press":["chest","front_delts","triceps"],
  "incline bench press":["chest","front_delts","triceps"],
  "incline dumbbell press":["chest","front_delts","triceps"],
  "dumbbell press":["chest","front_delts","triceps"],
  "barbell row":["lats","mid_back","biceps","rear_delts"],
  "cable row":["lats","mid_back","biceps"],
  "seated row":["lats","mid_back","biceps"],
  "deadlift":["lower_back","glutes","hamstrings","traps","lats"],
  "sumo deadlift":["glutes","quads","lower_back"],
  "overhead press":["front_delts","side_delts","triceps","traps"],
  "push press":["front_delts","triceps","traps"],
  "pull-up":["lats","biceps","rear_delts"],
  "chin-up":["lats","biceps"],
  "lat pulldown":["lats","biceps"],
  "lateral raise":["side_delts"],
  "bicep curl":["biceps"],
  "hammer curl":["biceps"],
  "tricep pushdown":["triceps"],
  "skull crusher":["triceps"],
  "dips":["chest","triceps","front_delts"],
  "leg press":["quads","glutes"],
  "romanian deadlift":["hamstrings","glutes","lower_back"],
  "hip thrust":["glutes"],
  "calf raise":["calves"],
  "face pull":["rear_delts","traps"],
  "dumbbell fly":["chest"],
  "shrugs":["traps"],
  "plank":["abs"],
  "crunch":["abs"],
  "leg raise":["abs"],
};

const MUSCLE_META = {
  chest:       {label:"Chest",       side:"front",cx:154,cy:172,rx:26,ry:18},
  front_delts: {label:"Front Delts", side:"front",cx:122,cy:144,rx:14,ry:12},
  side_delts:  {label:"Side Delts",  side:"front",cx:102,cy:152,rx:11,ry:11},
  biceps:      {label:"Biceps",      side:"front",cx:90, cy:194,rx:12,ry:18},
  triceps:     {label:"Triceps",     side:"front",cx:218,cy:194,rx:12,ry:18},
  abs:         {label:"Abs",         side:"front",cx:154,cy:242,rx:18,ry:30},
  quads:       {label:"Quads",       side:"front",cx:136,cy:350,rx:18,ry:32},
  calves:      {label:"Calves",      side:"front",cx:130,cy:468,rx:12,ry:20},
  traps:       {label:"Traps",       side:"back", cx:154,cy:128,rx:20,ry:13},
  lats:        {label:"Lats",        side:"back", cx:128,cy:186,rx:16,ry:26},
  mid_back:    {label:"Mid Back",    side:"back", cx:154,cy:202,rx:12,ry:16},
  lower_back:  {label:"Lower Back",  side:"back", cx:154,cy:256,rx:14,ry:16},
  rear_delts:  {label:"Rear Delts",  side:"back", cx:122,cy:144,rx:14,ry:12},
  glutes:      {label:"Glutes",      side:"back", cx:144,cy:314,rx:20,ry:20},
  hamstrings:  {label:"Hamstrings",  side:"back", cx:140,cy:378,rx:16,ry:28},
};

function getMuscleSets(exercises=[]) {
  const map={};
  exercises.forEach(ex=>{(EXERCISE_MUSCLES[ex.name?.toLowerCase().trim()]||[]).forEach(m=>{map[m]=(map[m]||0)+1;});});
  return map;
}
function calcNW(base,sessions,goal){return +(base+sessions*(goal==="Strength"?2.5:1.25)).toFixed(2);}
function calcPB(logs=[],eid,base){
  const r=logs.filter(l=>l.exerciseId===eid&&l.completed);
  if(!r.length)return{weight:base,date:null};
  return r.reduce((a,b)=>a.weight>b.weight?a:b);
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C={
  bg:"#050507", surface:"#0c0c10", card:"#111118", cardHi:"#161622",
  border:"rgba(255,255,255,0.055)", borderB:"rgba(255,255,255,0.10)",
  red:"#E8353A", redDim:"rgba(232,53,58,0.12)", redBdr:"rgba(232,53,58,0.32)",
  cyan:"#00D4FF", cyanDim:"rgba(0,212,255,0.08)", cyanBdr:"rgba(0,212,255,0.28)",
  white:"#EEEEF2", muted:"#6B6B75", faint:"#35353D",
  font:"'Rajdhani','Arial Narrow',sans-serif",
  mono:"'Share Tech Mono','Courier New',monospace",
};

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;background:#050507;color:#EEEEF2;}
  ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(232,53,58,0.4);border-radius:2px;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes scanMove{0%{top:-4px;}100%{top:100%;}}
  @keyframes glitch{0%,94%,100%{transform:translate(0)}95%{transform:translate(-2px,1px)}97%{transform:translate(2px,-1px)}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:translateX(0);}}
  .fi{animation:fadeUp 0.42s cubic-bezier(0.22,1,0.36,1) both;}
  .fi1{animation-delay:.05s}.fi2{animation-delay:.10s}.fi3{animation-delay:.15s}
  .fi4{animation-delay:.20s}.fi5{animation-delay:.26s}
  .glitch{animation:glitch 5s ease infinite;}
  .scan-line{position:fixed;inset:0;pointer-events:none;z-index:1;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);}
  .scan-beam{position:fixed;left:0;right:0;height:3px;pointer-events:none;z-index:2;background:linear-gradient(90deg,transparent,rgba(0,212,255,0.05),transparent);animation:scanMove 10s linear infinite;}
  button{cursor:pointer;font-family:inherit;} button:active{transform:scale(0.96);}
  input,select,textarea{transition:border-color 0.2s,box-shadow 0.2s;font-family:inherit;}
  input:focus,select:focus,textarea:focus{outline:none!important;border-color:rgba(232,53,58,0.5)!important;box-shadow:0 0 0 3px rgba(232,53,58,0.07)!important;}
  .hover-card{transition:border-color 0.18s,background 0.18s;}
  .hover-card:hover{border-color:rgba(232,53,58,0.3)!important;background:#13131e!important;}
  .tab-active{border-bottom:2px solid #E8353A!important;color:#EEEEF2!important;}
  @media(max-width:600px){
    .desktop-only{display:none!important;}
    .mobile-nav{display:flex!important;}
    .main-content{padding-bottom:72px!important;}
  }
  @media(min-width:601px){
    .mobile-nav{display:none!important;}
  }
  input,select,textarea{font-size:16px!important;}
  *{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
  .touch-btn{min-height:48px;min-width:48px;}
`;

const INP={width:"100%",background:C.cardHi,border:`0.5px solid ${C.borderB}`,borderRadius:3,padding:"10px 13px",color:C.white,fontFamily:C.mono,fontSize:13,outline:"none"};
const TEXTAREA={...INP,resize:"vertical",minHeight:72};

// ─── PAGE TRANSITION ──────────────────────────────────────────────────────────
function PageTransition({children,id}){
  const [shown,setShown]=useState(children);
  const [curId,setCurId]=useState(id);
  const [vis,setVis]=useState(true);
  const t=useRef(null);
  useEffect(()=>{
    if(id===curId){setShown(children);return;}
    setVis(false);
    clearTimeout(t.current);
    t.current=setTimeout(()=>{setShown(children);setCurId(id);setVis(true);},230);
    return()=>clearTimeout(t.current);
  },[id,children]);
  return <div style={{opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(8px)",transition:"opacity 0.23s ease,transform 0.23s ease"}}>{shown}</div>;
}

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function Tag({color=C.red,children}){
  const rgb=color===C.cyan?"0,212,255":"232,53,58";
  return <span style={{background:`rgba(${rgb},0.10)`,color,fontSize:10,fontFamily:C.mono,letterSpacing:"0.14em",textTransform:"uppercase",padding:"3px 8px",borderRadius:2,border:`0.5px solid rgba(${rgb},0.3)`}}>{children}</span>;
}
function Btn({onClick,children,variant="ghost",disabled=false,full=false,size="md"}){
  const pad=size==="sm"?"5px 12px":"10px 20px";
  const fs=size==="sm"?11:13;
  const styles={
    ghost:{background:"transparent",border:`0.5px solid ${C.borderB}`,color:C.muted},
    red:{background:C.red,border:`1px solid ${C.red}`,color:C.white,boxShadow:"0 0 16px rgba(232,53,58,0.3)"},
    redOutline:{background:C.redDim,border:`0.5px solid ${C.redBdr}`,color:C.red},
    cyan:{background:C.cyan,border:`1px solid ${C.cyan}`,color:C.bg},
    cyanOutline:{background:C.cyanDim,border:`0.5px solid ${C.cyanBdr}`,color:C.cyan},
    danger:{background:"rgba(232,53,58,0.08)",border:`0.5px solid rgba(232,53,58,0.22)`,color:C.red},
  };
  return <button onClick={onClick} disabled={disabled} style={{...styles[variant],borderRadius:3,padding:pad,fontFamily:C.font,fontSize:fs,fontWeight:600,letterSpacing:"0.14em",width:full?"100%":undefined,opacity:disabled?0.45:1,transition:"opacity 0.2s,box-shadow 0.2s"}}>{children}</button>;
}
function StatBox({label,value,sub,accent=C.red}){
  return <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,width:"100%",height:2,background:`linear-gradient(90deg,${accent},transparent)`}}/>
    <div style={{position:"absolute",top:0,left:0,width:2,height:"100%",background:`linear-gradient(180deg,${accent},transparent)`}}/>
    <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>{label}</div>
    <div style={{fontFamily:C.font,fontSize:28,fontWeight:700,color:C.white}}>{value}</div>
    {sub&&<div style={{fontFamily:C.mono,fontSize:9,color:C.faint,marginTop:3}}>{sub}</div>}
  </div>;
}
function SectionLabel({children,action}){
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
    <div style={{width:3,height:16,background:C.red,borderRadius:1,flexShrink:0}}/>
    <span style={{fontFamily:C.mono,fontSize:9,color:C.muted,letterSpacing:"0.2em",textTransform:"uppercase",flex:1}}>{children}</span>
    {action}
    <div style={{flex:2,height:"0.5px",background:C.border}}/>
  </div>;
}
function FieldLabel({children}){return <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,letterSpacing:"0.16em",marginBottom:5,textTransform:"uppercase"}}>{children}</div>;}
function Divider(){return <div style={{height:"0.5px",background:C.border,margin:"18px 0"}}/>;}
function NavBar({logoColor=C.red,right,tabs}){
  return <div style={{background:"rgba(5,5,7,0.94)",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:10,borderBottom:`0.5px solid ${C.border}`}}>
    <div style={{padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 22,20 2,20" stroke={logoColor} strokeWidth="1.5" fill="none"/>
          <polygon points="12,7 19,19 5,19" fill={`rgba(${logoColor===C.cyan?"0,212,255":"232,53,58"},0.12)`}/>
          <line x1="12" y1="8" x2="12" y2="17" stroke={logoColor} strokeWidth="1"/>
        </svg>
        <div>
          <div className="glitch" style={{fontFamily:C.font,fontSize:15,fontWeight:700,letterSpacing:"0.22em",color:C.white,lineHeight:1}}>BUILTBYBILLY</div>
          <div style={{fontFamily:C.mono,fontSize:7,color:C.faint,letterSpacing:"0.3em"}}>COACHING PLATFORM</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>{right}</div>
    </div>
    {tabs&&<div style={{display:"flex",borderTop:`0.5px solid ${C.border}`,paddingLeft:24}}>{tabs}</div>}
  </div>;
}
function TabBtn({active,onClick,children}){
  return <button onClick={onClick} className={active?"tab-active":""} style={{background:"none",border:"none",borderBottom:`2px solid transparent`,padding:"10px 18px",color:active?C.white:C.muted,fontFamily:C.mono,fontSize:10,letterSpacing:"0.14em",transition:"all 0.18s"}}>{children}</button>;
}
function Modal({open,onClose,title,children}){
  if(!open)return null;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:C.surface,border:`0.5px solid ${C.borderB}`,borderRadius:6,padding:"24px",width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontFamily:C.font,fontSize:20,fontWeight:700,letterSpacing:"0.08em",color:C.white}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

// ─── ANIME FIGURE ─────────────────────────────────────────────────────────────
function AnimeFigure({opacity=0.1}){
  return <div style={{position:"fixed",right:-40,top:0,bottom:0,width:480,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
    <svg viewBox="0 0 400 860" style={{width:"100%",height:"100%",opacity}} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ink" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="5" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
          <feGaussianBlur in="d" stdDeviation="0.8"/>
        </filter>
        <radialGradient id="rg" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="rgba(232,53,58,0.15)"/>
          <stop offset="100%" stopColor="rgba(232,53,58,0)"/>
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="180" rx="170" ry="210" fill="url(#rg)"/>
      {[35,48,61,74,52,42,30,66].map((y,i)=><line key={i} x1={280+i*8} y1={y} x2={400} y2={y+12} stroke="rgba(232,53,58,0.15)" strokeWidth={i%2===0?0.8:0.5}/>)}
      <ellipse cx="200" cy="62" rx="29" ry="34" fill="none" stroke="rgba(215,210,205,0.68)" strokeWidth="2" filter="url(#ink)"/>
      <path d="M178 82 Q200 96 222 82" fill="none" stroke="rgba(215,210,205,0.35)" strokeWidth="1.2"/>
      <path d="M192 94 L188 116 M208 94 L212 116" fill="none" stroke="rgba(215,210,205,0.52)" strokeWidth="2.2"/>
      <path d="M188 116 Q148 112 118 132 Q96 146 92 166" fill="none" stroke="rgba(215,210,205,0.65)" strokeWidth="3" strokeLinecap="round" filter="url(#ink)"/>
      <path d="M212 116 Q252 112 282 132 Q304 146 308 166" fill="none" stroke="rgba(215,210,205,0.65)" strokeWidth="3" strokeLinecap="round" filter="url(#ink)"/>
      <path d="M168 140 Q166 162 170 182 Q184 200 200 202 Q216 200 230 182 Q234 162 232 140" fill="none" stroke="rgba(215,210,205,0.60)" strokeWidth="2.2" filter="url(#ink)"/>
      <path d="M200 142 L200 202" stroke="rgba(215,210,205,0.15)" strokeWidth="0.9"/>
      <path d="M182 172 Q200 168 220 174" fill="none" stroke="rgba(232,53,58,0.5)" strokeWidth="1.2"/>
      <path d="M92 132 Q76 152 72 184 Q70 212 76 238" fill="none" stroke="rgba(215,210,205,0.56)" strokeWidth="2.6" strokeLinecap="round" filter="url(#ink)"/>
      <path d="M308 132 Q324 152 328 184 Q330 212 324 238" fill="none" stroke="rgba(215,210,205,0.56)" strokeWidth="2.6" strokeLinecap="round" filter="url(#ink)"/>
      <path d="M74 178 Q82 167 94 171" fill="none" stroke="rgba(232,53,58,0.28)" strokeWidth="1.2"/>
      <path d="M326 178 Q318 167 306 171" fill="none" stroke="rgba(232,53,58,0.28)" strokeWidth="1.2"/>
      <path d="M76 238 Q72 270 78 298 Q82 312 86 324" fill="none" stroke="rgba(215,210,205,0.48)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M324 238 Q328 270 322 298 Q318 312 314 324" fill="none" stroke="rgba(215,210,205,0.48)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M170 202 Q168 244 170 284 Q180 314 200 322 Q220 314 230 284 Q232 244 230 202" fill="none" stroke="rgba(215,210,205,0.56)" strokeWidth="1.9" filter="url(#ink)"/>
      <line x1="172" y1="228" x2="228" y2="228" stroke="rgba(215,210,205,0.16)" strokeWidth="0.9"/>
      <line x1="172" y1="256" x2="228" y2="256" stroke="rgba(215,210,205,0.16)" strokeWidth="0.9"/>
      <line x1="172" y1="284" x2="228" y2="284" stroke="rgba(215,210,205,0.16)" strokeWidth="0.9"/>
      <path d="M168 318 L154 334 L200 344 L246 334 L232 318" fill="none" stroke="rgba(215,210,205,0.48)" strokeWidth="1.8"/>
      <path d="M156 336 Q142 390 144 450 Q146 498 152 536" fill="none" stroke="rgba(215,210,205,0.56)" strokeWidth="2.6" strokeLinecap="round" filter="url(#ink)"/>
      <path d="M244 336 Q258 390 256 450 Q254 498 248 536" fill="none" stroke="rgba(215,210,205,0.56)" strokeWidth="2.6" strokeLinecap="round" filter="url(#ink)"/>
      <ellipse cx="152" cy="544" rx="15" ry="13" fill="none" stroke="rgba(215,210,205,0.34)" strokeWidth="1.6"/>
      <ellipse cx="248" cy="544" rx="15" ry="13" fill="none" stroke="rgba(215,210,205,0.34)" strokeWidth="1.6"/>
      <path d="M144 556 Q140 608 142 658 Q144 696 148 726" fill="none" stroke="rgba(215,210,205,0.46)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M256 556 Q260 608 258 658 Q256 696 252 726" fill="none" stroke="rgba(215,210,205,0.46)" strokeWidth="2" strokeLinecap="round"/>
      {[[128,118,1.8],[150,92,1.2],[264,106,1.4],[280,130,1],[188,56,0.9],[214,52,0.9],[96,208,1.5],[304,220,1.5]].map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r} fill="rgba(215,210,205,0.55)"/>)}
      {[[132,172,1.2],[268,168,1.2]].map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r} fill="rgba(232,53,58,0.7)"/>)}
    </svg>
  </div>;
}

// ─── BODY MAP ─────────────────────────────────────────────────────────────────
function BodyMap({muscleMap={}}){
  const [hov,setHov]=useState(null);
  const max=Math.max(...Object.values(muscleMap),1);
  const noMir=["traps","mid_back","lower_back"];
  const W=308;
  function mFill(s){if(!s)return"rgba(255,255,255,0.03)";const t=s/max;return t>0.7?"rgba(232,53,58,0.55)":t>0.4?"rgba(232,53,58,0.30)":"rgba(232,53,58,0.14)";}
  function mBdr(s){if(!s)return"rgba(255,255,255,0.07)";const t=s/max;return t>0.7?"rgba(232,53,58,0.9)":t>0.4?"rgba(232,53,58,0.55)":"rgba(232,53,58,0.28)";}

  const Outline=({side})=><g fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1">
    <ellipse cx="154" cy="52" rx="24" ry="28"/>
    <path d="M142 78 L139 96 M166 78 L169 96"/>
    <path d="M139 96 Q112 94 88 110 Q70 122 68 138"/>
    <path d="M169 96 Q196 94 220 110 Q238 122 240 138"/>
    {side==="front"?<path d="M128 116 Q126 138 130 158 Q142 174 154 176 Q166 174 178 158 Q182 138 180 116"/>:<path d="M128 116 Q126 158 130 196 Q142 228 154 233 Q166 228 178 196 Q182 158 180 116"/>}
    <path d="M68 108 Q54 130 52 160 Q50 186 56 208"/><path d="M240 108 Q254 130 256 160 Q258 186 252 208"/>
    <path d="M128 292 Q116 302 114 316 Q120 324 154 328 Q188 324 194 316 Q190 302 180 292"/>
    <path d="M114 320 Q100 368 102 416 Q104 452 108 482"/>
    <path d="M194 320 Q208 368 206 416 Q204 452 200 482"/>
    <ellipse cx="108" cy="492" rx="12" ry="10"/><ellipse cx="200" cy="492" rx="12" ry="10"/>
    {side==="front"?<path d="M128 174 Q126 214 128 254 Q136 282 154 290 Q172 282 180 254 Q182 214 180 174"/>:<path d="M128 238 Q116 260 114 278 Q120 290 154 296 Q188 290 194 278 Q190 260 180 238"/>}
    {side==="back"&&<line x1="154" y1="118" x2="154" y2="272"/>}
  </g>;

  const BodySVG=({side})=>{
    const muscles=Object.entries(MUSCLE_META).filter(([,r])=>r.side===side);
    return <svg viewBox="0 0 308 530" style={{width:"100%",height:"100%"}}>
      <Outline side={side}/>
      {muscles.map(([key,r])=>{
        const s=muscleMap[key]||0; const isH=hov===key;
        return <g key={key}>
          <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill={mFill(s)} stroke={mBdr(s)} strokeWidth={isH?1.8:0.7} style={{cursor:"pointer",transition:"all 0.25s"}} onMouseEnter={()=>setHov(key)} onMouseLeave={()=>setHov(null)}/>
          {!noMir.includes(key)&&<ellipse cx={W-r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill={mFill(s)} stroke={mBdr(s)} strokeWidth={isH?1.8:0.7} style={{cursor:"pointer",transition:"all 0.25s"}} onMouseEnter={()=>setHov(key)} onMouseLeave={()=>setHov(null)}/>}
        </g>;
      })}
      {hov&&MUSCLE_META[hov]?.side===side&&<text x="154" y="520" textAnchor="middle" fill="rgba(232,53,58,0.9)" fontSize="10" fontFamily="'Share Tech Mono',monospace" letterSpacing="0.1em">{MUSCLE_META[hov].label} · {muscleMap[hov]||0} ex</text>}
    </svg>;
  };

  const sorted=Object.entries(MUSCLE_META).map(([k,v])=>({key:k,label:v.label,score:muscleMap[k]||0}));
  const strong=[...sorted].sort((a,b)=>b.score-a.score).filter(m=>m.score>0).slice(0,4);
  const weak=[...sorted].sort((a,b)=>a.score-b.score).filter(m=>m.score===0).slice(0,4);

  return <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"18px",overflow:"hidden",position:"relative"}}>
    <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(180deg,${C.red},transparent)`}}/>
    <SectionLabel>Muscle Coverage Analysis</SectionLabel>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
      {[["ANTERIOR","front"],["POSTERIOR","back"]].map(([lbl,side])=><div key={side}>
        <div style={{fontFamily:C.mono,fontSize:8,color:C.faint,letterSpacing:"0.2em",textAlign:"center",marginBottom:5}}>{lbl}</div>
        <div style={{height:240}}><BodySVG side={side}/></div>
      </div>)}
    </div>
    <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:14}}>
      {[["High","rgba(232,53,58,0.55)"],["Med","rgba(232,53,58,0.28)"],["Low","rgba(232,53,58,0.12)"],["None","rgba(255,255,255,0.03)"]].map(([l,c])=><div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
        <div style={{width:8,height:8,borderRadius:1,background:c,border:"0.5px solid rgba(232,53,58,0.35)"}}/>
        <span style={{fontFamily:C.mono,fontSize:8,color:C.faint}}>{l}</span>
      </div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div>
        <div style={{fontFamily:C.mono,fontSize:8,color:C.red,letterSpacing:"0.16em",marginBottom:7}}>DOMINANT GROUPS</div>
        {strong.length?strong.map(m=><div key={m.key} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`0.5px solid ${C.border}`}}>
          <span style={{fontFamily:C.font,fontSize:13,fontWeight:500}}>{m.label}</span>
          <span style={{fontFamily:C.mono,fontSize:11,color:C.red}}>{m.score}</span>
        </div>):<div style={{fontFamily:C.mono,fontSize:10,color:C.faint}}>Log sessions to unlock</div>}
      </div>
      <div>
        <div style={{fontFamily:C.mono,fontSize:8,color:C.muted,letterSpacing:"0.16em",marginBottom:7}}>NEEDS ATTENTION</div>
        {weak.map(m=><div key={m.key} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`0.5px solid ${C.border}`}}>
          <span style={{fontFamily:C.font,fontSize:13,fontWeight:500,color:C.muted}}>{m.label}</span>
          <span style={{fontFamily:C.mono,fontSize:11,color:C.faint}}>—</span>
        </div>)}
      </div>
    </div>
  </div>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({onCoachLogin,onClientLogin,clients}){
  const [mode,setMode]=useState("select");
  const [cU,setCU]=useState("");const [cP,setCP]=useState("");
  const [sel,setSel]=useState(null);const [pin,setPin]=useState("");
  const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  const [recoveryCode,setRecoveryCode]=useState("");
  const [newCoachPass,setNewCoachPass]=useState("");
  const [resetMsg,setResetMsg]=useState("");
  const RECOVERY="BUILTBYBILLY-RESET-2024";

  function goCoach(){setLoading(true);setErr("");setTimeout(()=>{if(cU===COACH.username&&cP===COACH.password)onCoachLogin();else{setErr("ACCESS DENIED");setLoading(false);}},600);}
  function goClient(){if(!sel)return;setLoading(true);setErr("");setTimeout(()=>{if(pin===sel.pin)onClientLogin(sel);else{setErr("INCORRECT PIN");setLoading(false);}},600);}

  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
    <style>{CSS}</style>
    <div className="scan-line"/><div className="scan-beam"/>
    <AnimeFigure opacity={0.15}/>
    {/* corner brackets */}
    {[{t:0,l:0,bt:"none",bl:"none"},{t:0,r:0,bt:"none",br:"none"},{b:0,l:0,bb:"none",bl:"none"},{b:0,r:0,bb:"none",br:"none"}].map((s,i)=><div key={i} style={{position:"fixed",width:50,height:50,...s,borderTop:s.bt||(s.b!==undefined?"none":"1px solid rgba(232,53,58,0.22)"),borderLeft:s.bl||(s.r!==undefined?"none":"1px solid rgba(232,53,58,0.22)"),borderBottom:s.bb||(s.t!==undefined?"none":"1px solid rgba(232,53,58,0.22)"),borderRight:s.br||(s.l!==undefined?"none":"1px solid rgba(232,53,58,0.22)"),pointerEvents:"none"}}/>)}

    <div style={{position:"relative",zIndex:3,width:"100%",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div className="fi" style={{textAlign:"center",marginBottom:48}}>
        <div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"center",marginBottom:8}}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 22,20 2,20" stroke={C.red} strokeWidth="1.5" fill="none"/>
            <polygon points="12,7 19,19 5,19" fill="rgba(232,53,58,0.12)"/>
            <line x1="12" y1="8" x2="12" y2="17" stroke={C.red} strokeWidth="1"/>
          </svg>
          <div>
            <div className="glitch" style={{fontFamily:C.font,fontSize:36,fontWeight:700,letterSpacing:"0.28em",color:C.white,lineHeight:1}}>BUILTBYBILLY</div>
            <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.48em"}}>COACHING PLATFORM</div>
          </div>
        </div>
      </div>
      <div style={{width:"100%",maxWidth:420}}>
        <PageTransition id={mode}>
          <div>
            {mode==="select"&&<div className="fi fi1">
              <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,textAlign:"center",letterSpacing:"0.24em",marginBottom:22}}>// SELECT ACCESS LEVEL</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[{label:"ATHLETE PORTAL",sub:"Access your training programme",mode:"client",accent:C.red},{label:"COACH DASHBOARD",sub:"Manage athletes & programmes",mode:"coach",accent:C.cyan}].map(b=><button key={b.mode} onClick={()=>setMode(b.mode)} className="hover-card" style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"20px 22px",color:C.white,textAlign:"left",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(180deg,${b.accent},transparent)`}}/>
                  <div style={{fontFamily:C.font,fontSize:21,fontWeight:700,letterSpacing:"0.08em",marginBottom:3,paddingLeft:8,color:b.mode==="coach"?C.cyan:C.white}}>{b.label}</div>
                  <div style={{fontFamily:C.mono,fontSize:10,color:C.muted,paddingLeft:8}}>{b.sub}</div>
                </button>)}
              </div>
            </div>}
            {mode==="coach"&&<div className="fi">
              <button onClick={()=>{setMode("select");setErr("");}} style={{background:"none",border:"none",color:C.muted,fontFamily:C.mono,fontSize:10,marginBottom:20,letterSpacing:"0.14em"}}>← BACK</button>
              <div style={{fontFamily:C.font,fontSize:26,fontWeight:700,color:C.cyan,marginBottom:22,letterSpacing:"0.1em"}}>COACH ACCESS</div>
              {[["USERNAME",cU,setCU,"text"],["PASSWORD",cP,setCP,"password"]].map(([l,v,s,t])=><div key={l} style={{marginBottom:12}}>
                <FieldLabel>{l}</FieldLabel>
                <input type={t} style={INP} value={v} onChange={e=>s(e.target.value)} onKeyDown={e=>e.key==="Enter"&&goCoach()}/>
              </div>)}
              {err&&<div style={{fontFamily:C.mono,fontSize:10,color:C.red,marginBottom:10}}>{err}</div>}
              <Btn variant="cyan" full onClick={goCoach} disabled={loading}>{loading?"AUTHENTICATING…":"ENTER"}</Btn>
              <div style={{marginTop:12,fontFamily:C.mono,fontSize:9,color:C.faint,textAlign:"center"}}>coach / elite2024</div>
              <button onClick={()=>setMode("resetCoach")} style={{background:"none",border:"none",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:"0.12em",marginTop:10,width:"100%",cursor:"pointer"}}>FORGOT PASSWORD?</button>
            </div>}
            {mode==="resetCoach"&&<div className="fi">
              <button onClick={()=>{setMode("coach");setResetMsg("");}} style={{background:"none",border:"none",color:C.muted,fontFamily:C.mono,fontSize:10,marginBottom:20,letterSpacing:"0.14em"}}>← BACK</button>
              <div style={{fontFamily:C.font,fontSize:24,fontWeight:700,color:C.white,marginBottom:6,letterSpacing:"0.08em"}}>RESET COACH PASSWORD</div>
              <div style={{fontFamily:C.mono,fontSize:10,color:C.muted,marginBottom:20}}>Enter your recovery code to set a new password.</div>
              <FieldLabel>RECOVERY CODE</FieldLabel>
              <input style={{...INP,marginBottom:12}} value={recoveryCode} onChange={e=>setRecoveryCode(e.target.value)} placeholder="BUILTBYBILLY-RESET-2024"/>
              <FieldLabel>NEW PASSWORD</FieldLabel>
              <input type="password" style={{...INP,marginBottom:12}} value={newCoachPass} onChange={e=>setNewCoachPass(e.target.value)} placeholder="New password"/>
              {resetMsg&&<div style={{fontFamily:C.mono,fontSize:10,color:resetMsg.includes("✓")?C.cyan:C.red,marginBottom:10}}>{resetMsg}</div>}
              <Btn variant="cyan" full onClick={()=>{
                if(recoveryCode!==RECOVERY){setResetMsg("Incorrect recovery code");return;}
                if(newCoachPass.length<6){setResetMsg("Password must be at least 6 characters");return;}
                COACH.password=newCoachPass;
                setResetMsg("✓ Password updated — you can now log in");
                setTimeout(()=>setMode("coach"),2000);
              }}>RESET PASSWORD</Btn>
              <div style={{marginTop:14,fontFamily:C.mono,fontSize:9,color:C.faint,textAlign:"center",lineHeight:1.6}}>Recovery code is: <span style={{color:C.muted}}>BUILTBYBILLY-RESET-2024</span><br/>Keep this private.</div>
            </div>}

            {mode==="client"&&<div className="fi">
              <button onClick={()=>{setMode("select");setErr("");setSel(null);setPin("");}} style={{background:"none",border:"none",color:C.muted,fontFamily:C.mono,fontSize:10,marginBottom:20,letterSpacing:"0.14em"}}>← BACK</button>
              <div style={{fontFamily:C.font,fontSize:26,fontWeight:700,color:C.white,marginBottom:18,letterSpacing:"0.1em"}}>SELECT ATHLETE</div>
              {clients.length===0&&<div style={{fontFamily:C.mono,fontSize:11,color:C.faint,textAlign:"center",padding:"24px 0"}}>No athletes registered yet</div>}
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
                {clients.map(c=><button key={c.id} onClick={()=>{setSel(c);setErr("");setPin("");}} className="hover-card" style={{background:sel?.id===c.id?C.redDim:C.card,border:`0.5px solid ${sel?.id===c.id?C.redBdr:C.border}`,borderRadius:4,padding:"13px 16px",color:C.white,display:"flex",alignItems:"center",gap:12,textAlign:"left",transition:"all 0.2s"}}>
                  <div style={{width:34,height:34,borderRadius:2,background:sel?.id===c.id?C.redDim:C.cardHi,border:`0.5px solid ${sel?.id===c.id?C.redBdr:C.borderB}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.font,fontSize:13,fontWeight:700,color:sel?.id===c.id?C.red:C.muted,flexShrink:0}}>{c.avatar}</div>
                  <div><div style={{fontFamily:C.font,fontSize:16,fontWeight:600,letterSpacing:"0.04em"}}>{c.name}</div><div style={{fontFamily:C.mono,fontSize:9,color:C.muted,marginTop:1}}>{c.goal}</div></div>
                </button>)}
              </div>
              {sel&&<div className="fi">
                <FieldLabel>ATHLETE PIN</FieldLabel>
                <input type="password" maxLength={4} style={{...INP,marginBottom:10,letterSpacing:"0.3em",fontSize:18}} value={pin} onChange={e=>setPin(e.target.value.replace(/[^0-9]/g,""))} placeholder="••••" onKeyDown={e=>e.key==="Enter"&&goClient()}/>
                {err&&<div style={{fontFamily:C.mono,fontSize:10,color:C.red,marginBottom:10}}>{err}</div>}
                <Btn variant="red" full onClick={goClient} disabled={loading}>{loading?"VERIFYING…":"ENTER PORTAL"}</Btn>
              </div>}
            </div>}
          </div>
        </PageTransition>
      </div>
    </div>
    <div style={{position:"fixed",bottom:16,fontFamily:C.mono,fontSize:8,color:C.faint,letterSpacing:"0.26em",zIndex:3}}>BUILTBYBILLY · v2.0 · COACHING PLATFORM</div>
  </div>;
}

// ─── EXERCISE EDITOR MODAL ────────────────────────────────────────────────────
function ExerciseModal({open,onClose,exercise,onSave}){
  const blank={name:"",sets:3,reps:8,baseWeight:60,unit:"kg",restSecs:90,notes:"",videoUrl:""};
  const [form,setForm]=useState(exercise||blank);
  useEffect(()=>{setForm(exercise||blank);},[exercise,open]);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  return <Modal open={open} onClose={onClose} title={exercise?"EDIT EXERCISE":"ADD EXERCISE"}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div><FieldLabel>Exercise Name</FieldLabel><input style={INP} value={form.name} onChange={e=>f("name",e.target.value)} placeholder="e.g. Back Squat"/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[["SETS","sets","number"],["REPS","reps","number"],["BASE WEIGHT","baseWeight","number"],["REST (sec)","restSecs","number"]].map(([l,k,t])=><div key={k}><FieldLabel>{l}</FieldLabel><input type={t} style={INP} value={form[k]} onChange={e=>f(k,+e.target.value)}/></div>)}
      </div>
      <div><FieldLabel>Unit</FieldLabel><select style={INP} value={form.unit} onChange={e=>f("unit",e.target.value)}><option>kg</option><option>lbs</option><option>bodyweight</option></select></div>
      <div><FieldLabel>Video URL (YouTube/Vimeo)</FieldLabel><input style={INP} value={form.videoUrl||""} onChange={e=>f("videoUrl",e.target.value)} placeholder="https://youtube.com/..."/></div>
      <div><FieldLabel>Coach Notes</FieldLabel><textarea style={TEXTAREA} value={form.notes||""} onChange={e=>f("notes",e.target.value)} placeholder="Form cues, technique notes..."/></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
        <Btn variant="ghost" onClick={onClose}>CANCEL</Btn>
        <Btn variant="red" onClick={()=>{if(form.name){onSave({...form,id:exercise?.id||uid()});onClose();}}}>{exercise?"SAVE CHANGES":"ADD EXERCISE"}</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── SESSION EDITOR MODAL ─────────────────────────────────────────────────────
function SessionModal({open,onClose,session,onSave}){
  const blank={name:"",day:"Monday",exercises:[],notes:""};
  const [form,setForm]=useState(session||blank);
  const [exModal,setExModal]=useState(false);
  const [editEx,setEditEx]=useState(null);
  useEffect(()=>{setForm(session||blank);},[session,open]);

  function saveEx(ex){
    setForm(p=>({...p,exercises:editEx?p.exercises.map(e=>e.id===ex.id?ex:[...p.exercises.filter(e2=>e2!==e),e]).filter((_,i,a)=>a.findIndex(x=>x.id===e.id)===i):p.exercises.map(e=>e.id===ex.id?e:e).concat(p.exercises.some(e=>e.id===ex.id)?[]:ex)}));
    // simpler:
    setForm(p=>{const exists=p.exercises.find(e=>e.id===ex.id);return{...p,exercises:exists?p.exercises.map(e=>e.id===ex.id?ex:e):[...p.exercises,ex]};});
  }
  function removeEx(id){setForm(p=>({...p,exercises:p.exercises.filter(e=>e.id!==id)}));}
  function moveEx(i,dir){
    setForm(p=>{const arr=[...p.exercises];const j=i+dir;if(j<0||j>=arr.length)return p;[arr[i],arr[j]]=[arr[j],arr[i]];return{...p,exercises:arr};});
  }

  return <Modal open={open} onClose={onClose} title={session?"EDIT SESSION":"CREATE SESSION"}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
        <div><FieldLabel>Session Name</FieldLabel><input style={INP} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Power Block A"/></div>
        <div><FieldLabel>Day</FieldLabel><select style={INP} value={form.day} onChange={e=>setForm(p=>({...p,day:e.target.value}))}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></div>
      </div>
      <div><FieldLabel>Session Notes</FieldLabel><textarea style={{...TEXTAREA,minHeight:52}} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Warm-up instructions, focus areas..."/></div>
      <Divider/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,letterSpacing:"0.16em"}}>EXERCISES ({form.exercises.length})</div>
        <Btn variant="redOutline" size="sm" onClick={()=>{setEditEx(null);setExModal(true);}}>+ ADD EXERCISE</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:280,overflowY:"auto"}}>
        {form.exercises.map((ex,i)=><div key={ex.id} style={{background:C.cardHi,border:`0.5px solid ${C.border}`,borderRadius:3,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <button onClick={()=>moveEx(i,-1)} disabled={i===0} style={{background:"none",border:"none",color:i===0?C.faint:C.muted,fontSize:10,padding:0,lineHeight:1}}>▲</button>
            <button onClick={()=>moveEx(i,1)} disabled={i===form.exercises.length-1} style={{background:"none",border:"none",color:i===form.exercises.length-1?C.faint:C.muted,fontSize:10,padding:0,lineHeight:1}}>▼</button>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:C.font,fontSize:14,fontWeight:600,letterSpacing:"0.04em"}}>{ex.name.toUpperCase()}</div>
            <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,marginTop:2}}>{ex.sets}×{ex.reps} @ {ex.baseWeight}{ex.unit} · Rest {ex.restSecs}s</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <Btn variant="ghost" size="sm" onClick={()=>{setEditEx(ex);setExModal(true);}}>EDIT</Btn>
            <Btn variant="danger" size="sm" onClick={()=>removeEx(ex.id)}>✕</Btn>
          </div>
        </div>)}
        {form.exercises.length===0&&<div style={{fontFamily:C.mono,fontSize:10,color:C.faint,textAlign:"center",padding:"16px 0"}}>No exercises yet — add one above</div>}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
        <Btn variant="ghost" onClick={onClose}>CANCEL</Btn>
        <Btn variant="red" onClick={()=>{if(form.name&&form.exercises.length){onSave({...form,id:session?.id||uid()});onClose();}}} disabled={!form.name||form.exercises.length===0}>SAVE SESSION</Btn>
      </div>
    </div>
    <ExerciseModal open={exModal} onClose={()=>setExModal(false)} exercise={editEx} onSave={saveEx}/>
  </Modal>;
}

// ─── COACH DASHBOARD ──────────────────────────────────────────────────────────
function CoachDashboard({clients,setClients,workouts,setWorkouts,onLogout}){
  const [tab,setTab]=useState("roster");
  const [selClient,setSelClient]=useState(null);
  const [clientTab,setClientTab]=useState("schedule");
  const [addClientModal,setAddClientModal]=useState(false);
  const [editClientModal,setEditClientModal]=useState(false);
  const [sessionModal,setSessionModal]=useState(false);
  const [editSession,setEditSession]=useState(null);
  const [clientForm,setClientForm]=useState({});
  const [editForm,setEditForm]=useState({});

  // ── Client CRUD
  function createClient(){
    if(!clientForm.name||!clientForm.pin)return;
    const id=uid();
    const c={id,name:clientForm.name,email:clientForm.email||"",pin:clientForm.pin,goal:clientForm.goal||"Strength",joinDate:new Date().toISOString().split("T")[0],avatar:clientForm.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2),notes:clientForm.notes||""};
    setClients(p=>[...p,c]);setWorkouts(p=>({...p,[id]:[]}));setClientForm({});setAddClientModal(false);
  }
  function updateClient(){
    setClients(p=>p.map(c=>c.id===selClient.id?{...c,...editForm,avatar:(editForm.name||c.name).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}:c));
    setSelClient(p=>({...p,...editForm}));setEditClientModal(false);
  }
  function deleteClient(id){if(window.confirm("Remove this athlete permanently?")){setClients(p=>p.filter(c=>c.id!==id));setWorkouts(p=>{const n={...p};delete n[id];return n;});if(selClient?.id===id){setSelClient(null);setTab("roster");}}}

  // ── Session CRUD
  function saveSession(s){
    setWorkouts(p=>{const arr=p[selClient.id]||[];const exists=arr.find(w=>w.id===s.id);return{...p,[selClient.id]:exists?arr.map(w=>w.id===s.id?s:w):[...arr,s]};});
  }
  function deleteSession(id){if(window.confirm("Remove this session?")){setWorkouts(p=>({...p,[selClient.id]:(p[selClient.id]||[]).filter(w=>w.id!==id)}));}}
  function duplicateSession(s){const dup={...s,id:uid(),name:s.name+" (copy)",exercises:s.exercises.map(e=>({...e,id:uid()}))};setWorkouts(p=>({...p,[selClient.id]:[...(p[selClient.id]||[]),dup]}));}

  const [resetModal,setResetModal]=useState(false);
  const [resetTarget,setResetTarget]=useState(null);
  const [newPin,setNewPin]=useState("");
  const [pinMsg,setPinMsg]=useState("");

  function doResetPin(){
    if(!newPin||newPin.length!==4||!(/^\d{4}$/.test(newPin))){setPinMsg("PIN must be exactly 4 digits");return;}
    setClients(p=>p.map(c=>c.id===resetTarget.id?{...c,pin:newPin}:c));
    if(selClient?.id===resetTarget.id)setSelClient(p=>({...p,pin:newPin}));
    setPinMsg(""); setNewPin(""); setResetModal(false);
    alert(`PIN for ${resetTarget.name} updated to ${newPin}`);
  }

  function exportPlan(client){
    const sessions=workouts[client.id]||[];
    if(!sessions.length){alert("No sessions to export for this athlete.");return;}
    const payload={
      _builtbybilly:"v1",
      exportedAt:new Date().toISOString(),
      athlete:{name:client.name,goal:client.goal},
      sessions:sessions.map(s=>({...s,id:uid(),exercises:s.exercises.map(e=>({...e,id:uid()}))}))
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`${client.name.replace(/\s+/g,"-").toLowerCase()}-plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportSingleSession(session,client){
    const payload={
      _builtbybilly:"v1",
      exportedAt:new Date().toISOString(),
      athlete:{name:client.name,goal:client.goal},
      sessions:[{...session,id:uid(),exercises:session.exercises.map(e=>({...e,id:uid()}))}]
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`${session.name.replace(/\s+/g,"-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cw=selClient?(workouts[selClient.id]||[]):[];

  // Weekly schedule grid
  const schedule=DAYS.map(d=>({day:d,sessions:cw.filter(s=>s.day===d)}));

  return <div style={{minHeight:"100vh",background:C.bg,color:C.white,position:"relative"}}>
    <style>{CSS}</style>
    <div className="scan-line"/>
    <AnimeFigure opacity={0.05}/>
    <div style={{position:"relative",zIndex:2}}>
      <NavBar logoColor={C.cyan} right={<><Tag color={C.cyan}>COACH</Tag><Btn variant="ghost" size="sm" onClick={onLogout}>SIGN OUT</Btn></>}
        tabs={!selClient&&<>
          {[["roster","ROSTER"],["overview","OVERVIEW"]].map(([t,l])=><TabBtn key={t} active={tab===t} onClick={()=>setTab(t)}>{l}</TabBtn>)}
        </>}
      />

      <PageTransition id={tab+"-"+(selClient?.id||"none")+"-"+clientTab}>
        <div style={{maxWidth:900,margin:"0 auto",padding:"24px 20px"}}>

          {/* ── ROSTER TAB */}
          {!selClient&&tab==="roster"&&<>
            <div className="fi" style={{marginBottom:22}}>
              <div style={{fontFamily:C.mono,fontSize:9,color:C.cyan,letterSpacing:"0.28em",marginBottom:4}}>// COMMAND CENTER</div>
              <h1 style={{fontFamily:C.font,fontSize:44,fontWeight:700,letterSpacing:"0.04em"}}>ATHLETE ROSTER</h1>
            </div>
            <div className="fi fi1" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
              <StatBox label="Athletes" value={clients.length} accent={C.cyan}/>
              <StatBox label="Programmes" value={Object.values(workouts).flat().length} sub="total sessions" accent={C.red}/>
              <StatBox label="Exercises" value={Object.values(workouts).flat().flatMap(w=>w.exercises).length} sub="tracked" accent={C.red}/>
            </div>
            <SectionLabel action={<Btn variant="redOutline" size="sm" onClick={()=>{setClientForm({});setAddClientModal(true);}}>+ ADD ATHLETE</Btn>}>Athlete Roster</SectionLabel>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {clients.map((c,i)=><div key={c.id} className={`fi fi${Math.min(i+1,5)} hover-card`} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(180deg,${C.cyan},transparent)`}}/>
                <div style={{display:"flex",alignItems:"center",gap:14,flex:1,cursor:"pointer",paddingLeft:8}} onClick={()=>{setSelClient(c);setClientTab("schedule");}}>
                  <div style={{width:40,height:40,borderRadius:2,background:C.redDim,border:`0.5px solid ${C.redBdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.font,fontSize:15,fontWeight:700,color:C.red,flexShrink:0}}>{c.avatar}</div>
                  <div>
                    <div style={{fontFamily:C.font,fontSize:17,fontWeight:700,letterSpacing:"0.04em",marginBottom:3}}>{c.name.toUpperCase()}</div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><Tag color={C.red}>{c.goal}</Tag><span style={{fontFamily:C.mono,fontSize:9,color:C.faint}}>{(workouts[c.id]||[]).length} sessions · since {c.joinDate}</span></div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Btn variant="ghost" size="sm" onClick={()=>{setSelClient(c);setClientTab("schedule");}}>MANAGE →</Btn>
                  <Btn variant="danger" size="sm" onClick={()=>deleteClient(c.id)}>REMOVE</Btn>
                </div>
              </div>)}
              {clients.length===0&&<div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:40,textAlign:"center"}}><div style={{fontFamily:C.mono,fontSize:11,color:C.faint}}>// NO ATHLETES YET — ADD YOUR FIRST CLIENT ABOVE</div></div>}
            </div>
          </>}

          {/* ── OVERVIEW TAB */}
          {!selClient&&tab==="overview"&&<>
            <div className="fi" style={{marginBottom:22}}>
              <div style={{fontFamily:C.mono,fontSize:9,color:C.cyan,letterSpacing:"0.28em",marginBottom:4}}>// STATS</div>
              <h1 style={{fontFamily:C.font,fontSize:44,fontWeight:700,letterSpacing:"0.04em"}}>OVERVIEW</h1>
            </div>
            <div className="fi fi1" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:28}}>
              <StatBox label="Total Athletes" value={clients.length} accent={C.cyan}/>
              <StatBox label="Total Sessions" value={Object.values(workouts).flat().length} accent={C.red}/>
              <StatBox label="Total Exercises" value={Object.values(workouts).flat().flatMap(w=>w.exercises).length} accent={C.red}/>
              <StatBox label="Goals Tracked" value={[...new Set(clients.map(c=>c.goal))].length} sub="unique goals" accent={C.cyan}/>
            </div>
            <SectionLabel>Client Summary</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {clients.map(c=><div key={c.id} className="hover-card" style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden"}} onClick={()=>{setSelClient(c);setClientTab("schedule");}}>
                <div style={{position:"absolute",top:0,left:0,width:"100%",height:2,background:`linear-gradient(90deg,${C.red},transparent)`}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontFamily:C.font,fontSize:16,fontWeight:700,letterSpacing:"0.04em"}}>{c.name.toUpperCase()}</div>
                  <Tag color={C.red}>{c.goal}</Tag>
                </div>
                <div style={{display:"flex",gap:16}}>
                  <div><div style={{fontFamily:C.font,fontSize:22,fontWeight:700,color:C.red}}>{(workouts[c.id]||[]).length}</div><div style={{fontFamily:C.mono,fontSize:8,color:C.faint}}>SESSIONS</div></div>
                  <div><div style={{fontFamily:C.font,fontSize:22,fontWeight:700,color:C.cyan}}>{(workouts[c.id]||[]).flatMap(w=>w.exercises).length}</div><div style={{fontFamily:C.mono,fontSize:8,color:C.faint}}>EXERCISES</div></div>
                </div>
              </div>)}
            </div>
          </>}

          {/* ── CLIENT VIEW */}
          {selClient&&<>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <button onClick={()=>setSelClient(null)} style={{background:"none",border:"none",color:C.muted,fontFamily:C.mono,fontSize:10,letterSpacing:"0.14em"}}>← ROSTER</button>
              <div style={{height:14,width:"0.5px",background:C.border}}/>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:2,background:C.redDim,border:`0.5px solid ${C.redBdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.font,fontSize:14,fontWeight:700,color:C.red}}>{selClient.avatar}</div>
                <div>
                  <div style={{fontFamily:C.font,fontSize:20,fontWeight:700,letterSpacing:"0.04em"}}>{selClient.name.toUpperCase()}</div>
                  <div style={{display:"flex",gap:6,marginTop:3}}><Tag color={C.red}>{selClient.goal}</Tag><Tag color={C.cyan}>PIN: {selClient.pin}</Tag></div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="cyanOutline" size="sm" onClick={()=>exportPlan(selClient)}>&#8595; EXPORT PLAN</Btn>
                <Btn variant="ghost" size="sm" onClick={()=>{setEditForm({name:selClient.name,email:selClient.email,pin:selClient.pin,goal:selClient.goal,notes:selClient.notes||""});setEditClientModal(true);}}>EDIT CLIENT</Btn>
                <Btn variant="danger" size="sm" onClick={()=>deleteClient(selClient.id)}>REMOVE</Btn>
              </div>
            </div>

            {/* Client sub-tabs */}
            <div style={{display:"flex",borderBottom:`0.5px solid ${C.border}`,marginBottom:20}}>
              {[["schedule","SCHEDULE"],["exercises","ALL EXERCISES"],["notes","NOTES"]].map(([t,l])=><TabBtn key={t} active={clientTab===t} onClick={()=>setClientTab(t)}>{l}</TabBtn>)}
            </div>

            {/* SCHEDULE TAB */}
            {clientTab==="schedule"&&<>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
                <Btn variant="redOutline" size="sm" onClick={()=>{setEditSession(null);setSessionModal(true);}}>+ CREATE SESSION</Btn>
              </div>
              {/* Weekly grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:20}}>
                {schedule.map(({day,sessions})=><div key={day} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,minHeight:120,overflow:"hidden"}}>
                  <div style={{background:sessions.length?C.redDim:"transparent",borderBottom:`0.5px solid ${C.border}`,padding:"6px 8px"}}>
                    <div style={{fontFamily:C.mono,fontSize:8,color:sessions.length?C.red:C.faint,letterSpacing:"0.16em"}}>{day.slice(0,3).toUpperCase()}</div>
                  </div>
                  <div style={{padding:6,display:"flex",flexDirection:"column",gap:5}}>
                    {sessions.map(s=><div key={s.id} style={{background:C.cardHi,borderRadius:2,padding:"5px 7px",cursor:"pointer",border:`0.5px solid ${C.border}`}} onClick={()=>{setEditSession(s);setSessionModal(true);}}>
                      <div style={{fontFamily:C.font,fontSize:11,fontWeight:600,letterSpacing:"0.04em",marginBottom:2,lineHeight:1.2}}>{s.name}</div>
                      <div style={{fontFamily:C.mono,fontSize:8,color:C.muted}}>{s.exercises.length} ex</div>
                    </div>)}
                    {sessions.length===0&&<div style={{fontFamily:C.mono,fontSize:8,color:C.faint,textAlign:"center",paddingTop:8}}>REST</div>}
                  </div>
                </div>)}
              </div>

              {/* Session list */}
              <SectionLabel>All Sessions ({cw.length})</SectionLabel>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {cw.map(s=><div key={s.id} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:s.exercises.length?`0.5px solid ${C.border}`:"none"}}>
                    <div>
                      <div style={{fontFamily:C.font,fontSize:16,fontWeight:700,letterSpacing:"0.05em",marginBottom:2}}>{s.name.toUpperCase()}</div>
                      <div style={{fontFamily:C.mono,fontSize:9,color:C.muted}}>{s.day.toUpperCase()} · {s.exercises.length} EXERCISES{s.notes?` · ${s.notes.slice(0,40)}${s.notes.length>40?"…":""}`:""}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <Btn variant="ghost" size="sm" onClick={()=>duplicateSession(s)}>COPY</Btn>
                      <Btn variant="cyanOutline" size="sm" onClick={()=>exportSingleSession(s,selClient)}>↓ EXPORT</Btn>
                      <Btn variant="redOutline" size="sm" onClick={()=>{setEditSession(s);setSessionModal(true);}}>EDIT</Btn>
                      <Btn variant="danger" size="sm" onClick={()=>deleteSession(s.id)}>✕</Btn>
                    </div>
                  </div>
                  {s.exercises.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 14px"}}>
                    {s.exercises.map(ex=><div key={ex.id} style={{background:C.cardHi,borderRadius:2,padding:"4px 10px",border:`0.5px solid ${C.border}`}}>
                      <div style={{fontFamily:C.font,fontSize:12,fontWeight:600}}>{ex.name.toUpperCase()}</div>
                      <div style={{fontFamily:C.mono,fontSize:8,color:C.muted}}>{ex.sets}×{ex.reps} @ {ex.baseWeight}{ex.unit}</div>
                    </div>)}
                  </div>}
                </div>)}
                {cw.length===0&&<div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:32,textAlign:"center"}}><div style={{fontFamily:C.mono,fontSize:11,color:C.faint}}>// NO SESSIONS ASSIGNED YET</div></div>}
              </div>
            </>}

            {/* EXERCISES TAB */}
            {clientTab==="exercises"&&<>
              <SectionLabel>{cw.flatMap(w=>w.exercises).length} total exercises across {cw.length} sessions</SectionLabel>
              <BodyMap muscleMap={getMuscleSets(cw.flatMap(w=>w.exercises))}/>
              <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
                {cw.map(s=><div key={s.id}>
                  <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,letterSpacing:"0.16em",marginBottom:5,marginTop:10}}>{s.name.toUpperCase()} — {s.day.toUpperCase()}</div>
                  {s.exercises.map(ex=><div key={ex.id} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:3,padding:"10px 14px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontFamily:C.font,fontSize:14,fontWeight:600,letterSpacing:"0.04em"}}>{ex.name.toUpperCase()}</div>
                      <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,marginTop:2}}>{ex.sets} sets · {ex.reps} reps · {ex.baseWeight}{ex.unit} · Rest {ex.restSecs}s{ex.notes?` · "${ex.notes.slice(0,50)}"`:""}</div>
                    </div>
                    {ex.videoUrl&&<a href={ex.videoUrl} target="_blank" rel="noreferrer" style={{fontFamily:C.mono,fontSize:9,color:C.cyan,letterSpacing:"0.1em",textDecoration:"none"}}>▶ VIDEO</a>}
                  </div>)}
                </div>)}
              </div>
            </>}

            {/* NOTES TAB */}
            {clientTab==="notes"&&<>
              <SectionLabel>Client Notes</SectionLabel>
              <textarea style={{...TEXTAREA,width:"100%",minHeight:200,marginBottom:12}} value={editForm.notes||selClient.notes||""} onChange={e=>setEditForm(p=>({...p,notes:e.target.value}))} placeholder="Private notes about this client — injuries, preferences, goals..."/>
              <Btn variant="red" onClick={()=>{setClients(p=>p.map(c=>c.id===selClient.id?{...c,notes:editForm.notes||""}:c));setSelClient(p=>({...p,notes:editForm.notes||""}));}}>SAVE NOTES</Btn>
            </>}
          </>}
        </div>
      </PageTransition>
    </div>

    {/* Modals */}
    <Modal open={addClientModal} onClose={()=>setAddClientModal(false)} title="REGISTER NEW ATHLETE">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><FieldLabel>Full Name *</FieldLabel><input style={INP} value={clientForm.name||""} onChange={e=>setClientForm(p=>({...p,name:e.target.value}))} placeholder="Alex Johnson"/></div>
          <div><FieldLabel>PIN (4 digits) *</FieldLabel><input style={INP} maxLength={4} value={clientForm.pin||""} onChange={e=>setClientForm(p=>({...p,pin:e.target.value.replace(/[^0-9]/g,"")}))} placeholder="1234"/></div>
        </div>
        <div><FieldLabel>Email</FieldLabel><input type="email" style={INP} value={clientForm.email||""} onChange={e=>setClientForm(p=>({...p,email:e.target.value}))} placeholder="athlete@email.com"/></div>
        <div><FieldLabel>Training Goal</FieldLabel><select style={INP} value={clientForm.goal||"Strength"} onChange={e=>setClientForm(p=>({...p,goal:e.target.value}))}>{GOALS.map(g=><option key={g}>{g}</option>)}</select></div>
        <div><FieldLabel>Notes</FieldLabel><textarea style={{...TEXTAREA,minHeight:60}} value={clientForm.notes||""} onChange={e=>setClientForm(p=>({...p,notes:e.target.value}))} placeholder="Injuries, experience level, preferences..."/></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setAddClientModal(false)}>CANCEL</Btn>
          <Btn variant="red" onClick={createClient} disabled={!clientForm.name||!clientForm.pin}>REGISTER ATHLETE</Btn>
        </div>
      </div>
    </Modal>

    <Modal open={editClientModal} onClose={()=>setEditClientModal(false)} title="EDIT ATHLETE">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><FieldLabel>Full Name</FieldLabel><input style={INP} value={editForm.name||""} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))}/></div>
          <div><FieldLabel>PIN (4 digits)</FieldLabel><input style={INP} maxLength={4} value={editForm.pin||""} onChange={e=>setEditForm(p=>({...p,pin:e.target.value.replace(/[^0-9]/g,"")}))} /></div>
        </div>
        <div><FieldLabel>Email</FieldLabel><input type="email" style={INP} value={editForm.email||""} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))}/></div>
        <div><FieldLabel>Training Goal</FieldLabel><select style={INP} value={editForm.goal||"Strength"} onChange={e=>setEditForm(p=>({...p,goal:e.target.value}))}>{GOALS.map(g=><option key={g}>{g}</option>)}</select></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>setEditClientModal(false)}>CANCEL</Btn>
          <Btn variant="cyan" onClick={updateClient}>SAVE CHANGES</Btn>
        </div>
      </div>
    </Modal>

    <SessionModal open={sessionModal} onClose={()=>setSessionModal(false)} session={editSession} onSave={saveSession}/>

  {resetModal&&resetTarget&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setResetModal(false);}}>
    <div style={{background:C.surface,border:`0.5px solid ${C.borderB}`,borderRadius:6,padding:"28px",width:"100%",maxWidth:400}}>
      <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.28em",marginBottom:6}}>{"//"} SECURITY</div>
      <div style={{fontFamily:C.font,fontSize:24,fontWeight:700,color:C.white,marginBottom:4}}>RESET PIN</div>
      <div style={{fontFamily:C.mono,fontSize:11,color:C.muted,marginBottom:20}}>Setting new PIN for <span style={{color:C.white}}>{resetTarget.name}</span></div>
      <FieldLabel>NEW 4-DIGIT PIN</FieldLabel>
      <input type="number" maxLength={4} style={{...INP,marginBottom:6,letterSpacing:"0.3em",fontSize:22,textAlign:"center"}} value={newPin} onChange={e=>setNewPin(e.target.value.slice(0,4).replace(/[^0-9]/g,""))} placeholder="••••"/>
      {pinMsg&&<div style={{fontFamily:C.mono,fontSize:10,color:C.red,marginBottom:10}}>{pinMsg}</div>}
      <div style={{fontFamily:C.mono,fontSize:9,color:C.faint,marginBottom:18}}>Current PIN: {resetTarget.pin}</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={()=>setResetModal(false)}>CANCEL</Btn>
        <Btn variant="red" onClick={doResetPin} disabled={newPin.length!==4}>SAVE NEW PIN</Btn>
      </div>
    </div>
  </div>}
  </div>;
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────────────
function ClientDashboard({client,workouts,setWorkouts,logs,onLogSet,onEditLog,onDeleteLog,onLogout}){
  const [tab,setTab]=useState("today");
  const [activeWorkout,setActiveWorkout]=useState(null);
  const [activeExercise,setActiveExercise]=useState(null);
  const [setLog,setSetLog]=useState({});
  const [currentSet,setCurrentSet]=useState(1);
  const [tempWeight,setTempWeight]=useState(0);
  const [tempReps,setTempReps]=useState(0);
  const [view,setView]=useState("dash"); // dash | workout | complete
  const [importModal,setImportModal]=useState(false);
  const [importStatus,setImportStatus]=useState(null); // null | 'success' | 'error'
  const [importMsg,setImportMsg]=useState("");
  const [editingLog,setEditingLog]=useState(null); // {logId, weight, reps}

  const cw=workouts[client.id]||[];
  const allEx=cw.flatMap(w=>w.exercises);
  const muscleMap=getMuscleSets(allEx);
  const totalSessions=[...new Set(logs.map(l=>l.date))].length;
  const totalPBs=allEx.filter(ex=>calcPB(logs,ex.id,ex.baseWeight).weight>ex.baseWeight).length;

  function scCount(eid){return logs.filter(l=>l.exerciseId===eid&&l.completed).length;}
  function nw(ex){return calcNW(ex.baseWeight,Math.floor(scCount(ex.id)/Math.max(ex.sets,1)),client.goal);}
  function pb(ex){return calcPB(logs,ex.id,ex.baseWeight);}

  const today=DAYS[new Date().getDay()===0?6:new Date().getDay()-1];
  const todaySessions=cw.filter(s=>s.day===today);
  const upcomingSessions=cw.filter(s=>s.day!==today);

  function startWorkout(w){
    setActiveWorkout(w);setActiveExercise(w.exercises[0]);setSetLog({});setCurrentSet(1);
    setTempWeight(nw(w.exercises[0]));setTempReps(w.exercises[0].reps);setView("workout");
  }
  function logSet(eid,sn,weight,reps){
    setSetLog(p=>({...p,[`${eid}-${sn}`]:{weight:+weight,reps:+reps,done:true}}));
    onLogSet({id:uid(),exerciseId:eid,setNum:sn,weight:+weight,reps:+reps,date:new Date().toISOString().split("T")[0],completed:true});
  }

  function importPlan(file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=JSON.parse(e.target.result);
        if(!data._builtbybilly||!data.sessions||!Array.isArray(data.sessions)){
          setImportStatus("error");setImportMsg("Invalid file format. Please use a file exported from BuiltByBilly.");return;
        }
        const newSessions=data.sessions.map(s=>({...s,id:uid(),exercises:(s.exercises||[]).map(ex=>({...ex,id:uid()}))}));
        // Merge with existing sessions — avoid duplicates by name+day
        const existing=workouts[client.id]||[];
        const merged=[...existing];
        let added=0;
        newSessions.forEach(s=>{
          const dup=merged.find(e=>e.name===s.name&&e.day===s.day);
          if(!dup){merged.push(s);added++;}
        });
        // Save via the setter passed from parent — we need to bubble up
        // Store pending import in a ref and trigger via callback
        setWorkouts(p=>({...p,[client.id]:merged}));
        setImportStatus("success");
        setImportMsg(added>0?`${added} session${added>1?"s":""} imported successfully!`:"All sessions already exist in your plan — nothing new to add.");
      }catch(err){
        setImportStatus("error");setImportMsg("Could not read file. Make sure it's a valid .json plan file.");
      }
    };
    reader.readAsText(file);
  }

  const greeting=new Date().getHours()<12?"GOOD MORNING":new Date().getHours()<17?"GOOD AFTERNOON":"GOOD EVENING";

  // ── WORKOUT VIEW
  if(view==="workout"&&activeWorkout&&activeExercise){
    const exIdx=activeWorkout.exercises.findIndex(e=>e.id===activeExercise.id);
    const setsComplete=Array.from({length:activeExercise.sets},(_,i)=>setLog[`${activeExercise.id}-${i+1}`]?.done);
    const allDone=setsComplete.every(Boolean);
    const isPBTarget=nw(activeExercise)>pb(activeExercise).weight;
    function nextEx(){
      if(exIdx<activeWorkout.exercises.length-1){const ne=activeWorkout.exercises[exIdx+1];setActiveExercise(ne);setCurrentSet(1);setTempWeight(nw(ne));setTempReps(ne.reps);}
      else setView("complete");
    }
    return <div style={{minHeight:"100vh",background:C.bg,color:C.white}}>
      <style>{CSS}</style>
      <div className="scan-line"/>
      <NavBar right={<Btn variant="ghost" size="sm" onClick={()=>setView("dash")}>← EXIT</Btn>}/>
      <div style={{maxWidth:540,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <span style={{fontFamily:C.mono,fontSize:9,color:C.muted,letterSpacing:"0.16em"}}>{activeWorkout.name.toUpperCase()}</span>
          <span style={{fontFamily:C.mono,fontSize:9,color:C.red}}>{exIdx+1} / {activeWorkout.exercises.length}</span>
        </div>
        <div style={{height:2,background:C.faint,borderRadius:1,marginBottom:24,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${((exIdx+1)/activeWorkout.exercises.length)*100}%`,background:C.red,transition:"width 0.5s ease",boxShadow:`0 0 8px ${C.red}`}}/>
        </div>

        {isPBTarget&&<div style={{display:"flex",alignItems:"center",gap:10,background:C.redDim,border:`0.5px solid ${C.redBdr}`,borderRadius:3,padding:"9px 14px",marginBottom:16}}>
          <span style={{color:C.red,fontSize:16}}>⚡</span>
          <span style={{fontFamily:C.mono,fontSize:10,color:C.red,letterSpacing:"0.1em"}}>PB TARGET — {nw(activeExercise)}{activeExercise.unit}</span>
        </div>}

        <div style={{fontFamily:C.mono,fontSize:9,color:C.muted,letterSpacing:"0.2em",marginBottom:4}}>// EXERCISE {exIdx+1}</div>
        <h1 style={{fontFamily:C.font,fontSize:38,fontWeight:700,letterSpacing:"0.04em",marginBottom:4}}>{activeExercise.name.toUpperCase()}</h1>

        {activeExercise.notes&&<div style={{fontFamily:C.mono,fontSize:10,color:C.cyan,marginBottom:8,padding:"7px 12px",background:C.cyanDim,borderRadius:3,border:`0.5px solid ${C.cyanBdr}`}}>💬 {activeExercise.notes}</div>}
        {activeExercise.videoUrl&&<a href={activeExercise.videoUrl} target="_blank" rel="noreferrer" style={{display:"inline-block",fontFamily:C.mono,fontSize:9,color:C.cyan,letterSpacing:"0.12em",textDecoration:"none",marginBottom:14}}>▶ WATCH DEMO VIDEO</a>}
        {!activeExercise.videoUrl&&<div style={{marginBottom:14}}/>}

        <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"18px",marginBottom:12}}>
          <div style={{display:"flex",gap:7,marginBottom:18}}>
            {setsComplete.map((done,i)=><div key={i} onClick={()=>setCurrentSet(i+1)} style={{flex:1,height:36,borderRadius:2,background:done?C.redDim:currentSet===i+1?C.cardHi:"transparent",border:`0.5px solid ${done?C.redBdr:currentSet===i+1?C.borderB:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s"}}>
              {done?<span style={{color:C.red,fontSize:15,fontWeight:"bold"}}>✓</span>:<span style={{fontFamily:C.mono,fontSize:10,color:currentSet===i+1?C.white:C.faint}}>S{i+1}</span>}
            </div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {[["WEIGHT ("+activeExercise.unit+")",tempWeight,setTempWeight,2.5],["REPS",tempReps,setTempReps,1]].map(([lbl,val,setter,step])=><div key={lbl}>
              <div style={{fontFamily:C.mono,fontSize:8,color:C.muted,letterSpacing:"0.14em",marginBottom:7}}>{lbl}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>setter(v=>+(Math.max(0,v-step)).toFixed(2))} style={{width:34,height:34,background:C.cardHi,border:`0.5px solid ${C.border}`,borderRadius:2,color:C.white,fontSize:20,fontFamily:C.mono}}>−</button>
                <div style={{flex:1,textAlign:"center",fontFamily:C.font,fontSize:32,fontWeight:700}}>{val}</div>
                <button onClick={()=>setter(v=>+(v+step).toFixed(2))} style={{width:34,height:34,background:C.cardHi,border:`0.5px solid ${C.border}`,borderRadius:2,color:C.white,fontSize:20,fontFamily:C.mono}}>+</button>
              </div>
            </div>)}
          </div>
          <Btn variant={setsComplete[currentSet-1]?"ghost":"red"} full disabled={setsComplete[currentSet-1]} onClick={()=>{logSet(activeExercise.id,currentSet,tempWeight,tempReps);if(currentSet<activeExercise.sets)setCurrentSet(s=>s+1);}}>
            {setsComplete[currentSet-1]?`SET ${currentSet} LOGGED ✓`:`LOG SET ${currentSet}`}
          </Btn>
        </div>

        {allDone&&<Btn variant="cyanOutline" full onClick={nextEx}>{exIdx<activeWorkout.exercises.length-1?"NEXT EXERCISE →":"COMPLETE SESSION ✓"}</Btn>}

        <div style={{marginTop:20}}>
          <SectionLabel>Remaining Exercises</SectionLabel>
          {activeWorkout.exercises.map((ex,i)=><div key={ex.id} onClick={()=>{setActiveExercise(ex);setCurrentSet(1);setTempWeight(nw(ex));setTempReps(ex.reps);}} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,cursor:"pointer",opacity:i===exIdx?1:0.38,transition:"opacity 0.2s"}}>
            <span style={{fontFamily:i===exIdx?C.font:C.mono,fontSize:i===exIdx?14:12,fontWeight:i===exIdx?700:400,color:i===exIdx?C.red:C.muted,letterSpacing:"0.05em"}}>{i===exIdx?"▶ ":""}{ex.name.toUpperCase()}</span>
            <span style={{fontFamily:C.mono,fontSize:10,color:C.faint}}>{ex.sets}×{ex.reps}</span>
          </div>)}
        </div>
      </div>
    </div>;
  }

  // ── COMPLETE VIEW
  if(view==="complete")return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.white}}>
    <style>{CSS}</style>
    <NavBar right={<Btn variant="ghost" size="sm" onClick={()=>setView("dash")}>HOME</Btn>}/>
    <div className="fi" style={{textAlign:"center",maxWidth:440,padding:"0 20px"}}>
      <div style={{fontFamily:C.font,fontSize:80,fontWeight:700,color:C.red,lineHeight:1,marginBottom:4,textShadow:`0 0 40px ${C.red}`}}>⚡</div>
      <h1 style={{fontFamily:C.font,fontSize:46,fontWeight:700,letterSpacing:"0.06em",marginBottom:6}}>SESSION DONE</h1>
      <div style={{fontFamily:C.mono,fontSize:10,color:C.muted,letterSpacing:"0.2em",marginBottom:28}}>// OUTSTANDING PERFORMANCE</div>
      <div style={{background:C.card,border:`0.5px solid ${C.redBdr}`,borderRadius:4,padding:"16px 20px",marginBottom:18}}>
        <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.16em",marginBottom:10}}>NEXT SESSION TARGETS</div>
        {(activeWorkout?.exercises||[]).map(ex=><div key={ex.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${C.border}`}}>
          <span style={{fontFamily:C.font,fontSize:13,fontWeight:600,letterSpacing:"0.05em"}}>{ex.name.toUpperCase()}</span>
          <span style={{fontFamily:C.mono,fontSize:11,color:C.cyan}}>{ex.sets}×{ex.reps} @ {nw(ex)}{ex.unit}</span>
        </div>)}
      </div>
      <Btn variant="red" onClick={()=>setView("dash")}>RETURN TO BASE</Btn>
    </div>
  </div>;

  // ── MAIN DASHBOARD
  return <div style={{minHeight:"100vh",background:C.bg,color:C.white,position:"relative"}}>
    <style>{CSS}</style>
    <div className="scan-line"/><div className="scan-beam"/>
    <AnimeFigure opacity={0.07}/>
    <div style={{position:"relative",zIndex:2}}>
      <NavBar right={<><Btn variant="cyanOutline" size="sm" onClick={()=>{setImportStatus(null);setImportMsg("");setImportModal(true);}}>&#8593; IMPORT PLAN</Btn><Btn variant="ghost" size="sm" onClick={onLogout}>SIGN OUT</Btn></>}
        tabs={<>
          {[["today","TODAY"],["programme","PROGRAMME"],["records","RECORDS"],["body","BODY MAP"],["history","HISTORY"]].map(([t,l])=><TabBtn key={t} active={tab===t} onClick={()=>setTab(t)}>{l}</TabBtn>)}
        </>}
      />

      <PageTransition id={tab}>
        <div className="main-content" style={{maxWidth:760,margin:"0 auto",padding:"24px 20px"}}>

          {/* TODAY TAB */}
          {tab==="today"&&<>
            <div className="fi" style={{marginBottom:20}}>
              <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.28em",marginBottom:4}}>{greeting}</div>
              <h1 style={{fontFamily:C.font,fontSize:48,fontWeight:700,letterSpacing:"0.04em",lineHeight:1,marginBottom:8}}>{client.name.split(" ")[0].toUpperCase()}</h1>
              <div style={{display:"flex",gap:8}}><Tag>{client.goal}</Tag><Tag color={C.cyan}>{today.toUpperCase()}</Tag></div>
            </div>
            <div className="fi fi1" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:22}}>
              <StatBox label="Sessions" value={totalSessions} sub="completed" accent={C.red}/>
              <StatBox label="Personal Bests" value={totalPBs} sub="records set" accent={C.red}/>
              <StatBox label="Programme" value={cw.length} sub="sessions/wk" accent={C.cyan}/>
            </div>

            {todaySessions.length>0&&<div className="fi fi2" style={{marginBottom:20}}>
              <SectionLabel>Today's Training</SectionLabel>
              {todaySessions.map(s=><div key={s.id} className="hover-card" onClick={()=>startWorkout(s)} style={{background:C.card,border:`0.5px solid ${C.redBdr}`,borderRadius:4,padding:"16px 18px",cursor:"pointer",position:"relative",overflow:"hidden",marginBottom:8}}>
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:C.red}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingLeft:8}}>
                  <div>
                    <div style={{fontFamily:C.font,fontSize:20,fontWeight:700,letterSpacing:"0.05em",marginBottom:3}}>{s.name.toUpperCase()}</div>
                    <div style={{fontFamily:C.mono,fontSize:9,color:C.muted}}>{s.exercises.length} EXERCISES</div>
                  </div>
                  <div style={{background:C.redDim,border:`0.5px solid ${C.redBdr}`,borderRadius:3,padding:"8px 16px",color:C.red,fontFamily:C.font,fontSize:13,fontWeight:700,letterSpacing:"0.14em"}}>BEGIN →</div>
                </div>
                {s.notes&&<div style={{fontFamily:C.mono,fontSize:9,color:C.muted,paddingLeft:8,marginTop:6,borderTop:`0.5px solid ${C.border}`,paddingTop:8}}>{s.notes}</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:8,marginTop:10}}>
                  {s.exercises.map(ex=>{const nextW=nw(ex);const isPB=nextW>pb(ex).weight;return <div key={ex.id} style={{background:C.cardHi,borderRadius:2,padding:"4px 9px",border:`0.5px solid ${isPB?C.redBdr:C.border}`}}>
                    <div style={{fontFamily:C.mono,fontSize:8,color:C.muted}}>{ex.name.toUpperCase()}</div>
                    <div style={{fontFamily:C.font,fontSize:12,fontWeight:600,color:isPB?C.red:C.white}}>{ex.sets}×{ex.reps} @ {nextW}{ex.unit}{isPB&&<span style={{marginLeft:3,fontSize:9}}>⚡</span>}</div>
                  </div>;})}
                </div>
              </div>)}
            </div>}

            {todaySessions.length===0&&<div className="fi fi2" style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"28px",textAlign:"center",marginBottom:20}}>
              <div style={{fontFamily:C.font,fontSize:22,fontWeight:700,color:C.muted,marginBottom:4}}>REST DAY</div>
              <div style={{fontFamily:C.mono,fontSize:10,color:C.faint}}>No sessions scheduled today — recover well</div>
            </div>}

            {upcomingSessions.length>0&&<div className="fi fi3">
              <SectionLabel>Upcoming This Week</SectionLabel>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {upcomingSessions.slice(0,4).map(s=><div key={s.id} className="hover-card" onClick={()=>startWorkout(s)} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:"12px 14px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(180deg,${C.red},transparent)`}}/>
                  <div style={{fontFamily:C.mono,fontSize:8,color:C.muted,marginBottom:3,paddingLeft:8}}>{s.day.toUpperCase()}</div>
                  <div style={{fontFamily:C.font,fontSize:15,fontWeight:700,letterSpacing:"0.05em",paddingLeft:8,marginBottom:3}}>{s.name.toUpperCase()}</div>
                  <div style={{fontFamily:C.mono,fontSize:8,color:C.faint,paddingLeft:8}}>{s.exercises.length} exercises</div>
                </div>)}
              </div>
            </div>}
          </>}

          {/* PROGRAMME TAB */}
          {tab==="programme"&&<>
            <div className="fi" style={{marginBottom:20}}>
              <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.28em",marginBottom:4}}>// WEEKLY PLAN</div>
              <h1 style={{fontFamily:C.font,fontSize:44,fontWeight:700,letterSpacing:"0.04em"}}>YOUR PROGRAMME</h1>
            </div>
            {/* Weekly schedule view */}
            <div className="fi fi1" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:20}}>
              {DAYS.map(d=>{const sessions=cw.filter(s=>s.day===d);const isToday=d===today;return <div key={d} style={{background:isToday?C.redDim:C.card,border:`0.5px solid ${isToday?C.redBdr:C.border}`,borderRadius:4,minHeight:90,overflow:"hidden"}}>
                <div style={{padding:"6px 7px",borderBottom:`0.5px solid ${isToday?C.redBdr:C.border}`}}>
                  <div style={{fontFamily:C.mono,fontSize:8,color:isToday?C.red:sessions.length?C.muted:C.faint,letterSpacing:"0.16em"}}>{d.slice(0,3).toUpperCase()}</div>
                </div>
                <div style={{padding:"5px 6px",display:"flex",flexDirection:"column",gap:4}}>
                  {sessions.map(s=><div key={s.id} onClick={()=>startWorkout(s)} style={{background:C.cardHi,borderRadius:2,padding:"4px 6px",cursor:"pointer",border:`0.5px solid ${C.border}`}}>
                    <div style={{fontFamily:C.font,fontSize:10,fontWeight:600,lineHeight:1.2,marginBottom:1}}>{s.name}</div>
                    <div style={{fontFamily:C.mono,fontSize:7,color:C.muted}}>{s.exercises.length}ex</div>
                  </div>)}
                  {sessions.length===0&&<div style={{fontFamily:C.mono,fontSize:7,color:C.faint,textAlign:"center",paddingTop:6}}>REST</div>}
                </div>
              </div>;})}
            </div>

            <div className="fi fi2" style={{display:"flex",flexDirection:"column",gap:10}}>
              {cw.length===0&&<div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:40,textAlign:"center"}}><div style={{fontFamily:C.mono,fontSize:11,color:C.faint}}>// NO PROGRAMME ASSIGNED YET</div></div>}
              {cw.map(s=><div key={s.id} className="hover-card" onClick={()=>startWorkout(s)} style={{background:C.card,border:`0.5px solid ${s.day===today?C.redBdr:C.border}`,borderRadius:4,padding:"14px 18px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(180deg,${s.day===today?C.red:C.muted},transparent)`}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,paddingLeft:8}}>
                  <div>
                    <div style={{fontFamily:C.font,fontSize:18,fontWeight:700,letterSpacing:"0.05em",marginBottom:2}}>{s.name.toUpperCase()}</div>
                    <div style={{fontFamily:C.mono,fontSize:9,color:s.day===today?C.red:C.muted,letterSpacing:"0.1em"}}>{s.day.toUpperCase()} · {s.exercises.length} EXERCISES</div>
                  </div>
                  <div style={{fontFamily:C.font,fontSize:12,fontWeight:700,color:C.red,letterSpacing:"0.1em"}}>START →</div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,paddingLeft:8}}>
                  {s.exercises.map(ex=>{const nextW=nw(ex);const isPB=nextW>pb(ex).weight;return <div key={ex.id} style={{background:C.cardHi,borderRadius:2,padding:"4px 9px",border:`0.5px solid ${isPB?C.redBdr:C.border}`}}>
                    <div style={{fontFamily:C.mono,fontSize:8,color:C.muted}}>{ex.name.toUpperCase()}</div>
                    <div style={{fontFamily:C.font,fontSize:12,fontWeight:600,color:isPB?C.red:C.white}}>{ex.sets}×{ex.reps} @ {nextW}{ex.unit}{isPB&&<span style={{marginLeft:3,fontSize:9}}>⚡</span>}</div>
                  </div>;})}
                </div>
              </div>)}
            </div>
          </>}

          {/* RECORDS TAB */}
          {tab==="records"&&<>
            <div className="fi" style={{marginBottom:20}}>
              <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.28em",marginBottom:4}}>// ACHIEVEMENTS</div>
              <h1 style={{fontFamily:C.font,fontSize:44,fontWeight:700,letterSpacing:"0.04em"}}>PERSONAL RECORDS</h1>
            </div>
            {allEx.length===0&&<div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:40,textAlign:"center"}}><div style={{fontFamily:C.mono,fontSize:11,color:C.faint}}>No exercises to track yet</div></div>}
            {cw.map(s=><div key={s.id} className="fi fi1" style={{marginBottom:18}}>
              <SectionLabel>{s.name} — {s.day}</SectionLabel>
              <div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:2,background:`linear-gradient(90deg,${C.red},transparent)`,boxShadow:`0 0 10px ${C.red}`}}/>
                {s.exercises.map((ex,i)=>{const p=pb(ex);const nextW=nw(ex);const isPB=p.weight>ex.baseWeight;return <div key={ex.id} style={{padding:"12px 18px",borderBottom:i<s.exercises.length-1?`0.5px solid ${C.border}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:C.font,fontSize:14,fontWeight:700,letterSpacing:"0.05em"}}>{ex.name.toUpperCase()}</div>
                    <div style={{fontFamily:C.mono,fontSize:8,color:C.faint,marginTop:2}}>{p.date?`Set ${p.date}`:"No sessions yet"}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:C.font,fontSize:28,fontWeight:700,color:isPB?C.red:C.muted,textShadow:isPB?`0 0 20px rgba(232,53,58,0.4)`:"none"}}>{p.weight}{ex.unit}</div>
                    <div style={{fontFamily:C.mono,fontSize:8,color:C.cyan,marginTop:2}}>NEXT: {nextW}{ex.unit}</div>
                  </div>
                </div>;})}
              </div>
            </div>)}
          </>}

          {/* BODY MAP TAB */}
          {tab==="body"&&<>
            <div className="fi" style={{marginBottom:20}}>
              <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.28em",marginBottom:4}}>// ANALYSIS</div>
              <h1 style={{fontFamily:C.font,fontSize:44,fontWeight:700,letterSpacing:"0.04em"}}>BODY MAP</h1>
            </div>
            <div className="fi fi1"><BodyMap muscleMap={muscleMap}/></div>
          </>}

          {/* HISTORY TAB */}
          {tab==="history"&&<>
            <div className="fi" style={{marginBottom:20}}>
              <div style={{fontFamily:C.mono,fontSize:9,color:C.red,letterSpacing:"0.28em",marginBottom:4}}>// LOG</div>
              <h1 style={{fontFamily:C.font,fontSize:44,fontWeight:700,letterSpacing:"0.04em"}}>SESSION HISTORY</h1>
              <div style={{fontFamily:C.mono,fontSize:10,color:C.muted,marginTop:4}}>{logs.length} entries recorded · tap any set to edit</div>
            </div>
            {logs.length===0
              ?<div style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:4,padding:40,textAlign:"center"}}><div style={{fontFamily:C.mono,fontSize:11,color:C.faint}}>// NO SESSIONS LOGGED YET</div></div>
              :<div style={{display:"flex",flexDirection:"column",gap:5}}>
                {[...logs].reverse().slice(0,80).map((l,i)=>{
                  const ex=allEx.find(e=>e.id===l.exerciseId);if(!ex)return null;
                  const logId=l.id||i;
                  const isEditing=editingLog?.logId===logId;
                  return <div key={logId} style={{background:isEditing?C.redDim:C.card,border:`0.5px solid ${isEditing?C.redBdr:C.border}`,borderRadius:3,padding:"10px 14px",transition:"all 0.2s"}}>
                    {!isEditing
                      ?<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{flex:1,cursor:"pointer"}} onClick={()=>setEditingLog({logId,weight:l.weight,reps:l.reps})}>
                          <div style={{fontFamily:C.font,fontSize:14,fontWeight:600,letterSpacing:"0.04em"}}>{ex.name.toUpperCase()}</div>
                          <div style={{fontFamily:C.mono,fontSize:8,color:C.faint,marginTop:1}}>{l.date} · SET {l.setNum}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{fontFamily:C.font,fontSize:20,fontWeight:700,color:C.red,cursor:"pointer"}} onClick={()=>setEditingLog({logId,weight:l.weight,reps:l.reps})}>
                            {l.weight}{ex.unit}<span style={{fontSize:12,color:C.muted,marginLeft:4}}>× {l.reps}</span>
                          </div>
                          <button onClick={()=>setEditingLog({logId,weight:l.weight,reps:l.reps})} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:2,padding:"4px 9px",color:C.muted,fontFamily:C.mono,fontSize:9,letterSpacing:"0.1em"}}>EDIT</button>
                          <button onClick={()=>{if(window.confirm("Delete this set entry?"))onDeleteLog(logId,i)}} style={{background:"none",border:`0.5px solid rgba(232,53,58,0.22)`,borderRadius:2,padding:"4px 9px",color:C.red,fontFamily:C.mono,fontSize:9}}>✕</button>
                        </div>
                      </div>
                      :<div>
                        <div style={{fontFamily:C.font,fontSize:13,fontWeight:600,letterSpacing:"0.04em",marginBottom:10}}>{ex.name.toUpperCase()} — {l.date} · SET {l.setNum}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                          <div>
                            <div style={{fontFamily:C.mono,fontSize:8,color:C.muted,letterSpacing:"0.14em",marginBottom:5}}>WEIGHT ({ex.unit})</div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <button onClick={()=>setEditingLog(p=>({...p,weight:+(Math.max(0,p.weight-2.5)).toFixed(2)}))} style={{width:30,height:30,background:C.cardHi,border:`0.5px solid ${C.border}`,borderRadius:2,color:C.white,fontSize:18,fontFamily:C.mono}}>−</button>
                              <div style={{flex:1,textAlign:"center",fontFamily:C.font,fontSize:26,fontWeight:700,color:C.red}}>{editingLog.weight}</div>
                              <button onClick={()=>setEditingLog(p=>({...p,weight:+(p.weight+2.5).toFixed(2)}))} style={{width:30,height:30,background:C.cardHi,border:`0.5px solid ${C.border}`,borderRadius:2,color:C.white,fontSize:18,fontFamily:C.mono}}>+</button>
                            </div>
                          </div>
                          <div>
                            <div style={{fontFamily:C.mono,fontSize:8,color:C.muted,letterSpacing:"0.14em",marginBottom:5}}>REPS</div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <button onClick={()=>setEditingLog(p=>({...p,reps:Math.max(1,p.reps-1)}))} style={{width:30,height:30,background:C.cardHi,border:`0.5px solid ${C.border}`,borderRadius:2,color:C.white,fontSize:18,fontFamily:C.mono}}>−</button>
                              <div style={{flex:1,textAlign:"center",fontFamily:C.font,fontSize:26,fontWeight:700,color:C.red}}>{editingLog.reps}</div>
                              <button onClick={()=>setEditingLog(p=>({...p,reps:p.reps+1}))} style={{width:30,height:30,background:C.cardHi,border:`0.5px solid ${C.border}`,borderRadius:2,color:C.white,fontSize:18,fontFamily:C.mono}}>+</button>
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>setEditingLog(null)} style={{flex:1,background:"transparent",border:`0.5px solid ${C.border}`,borderRadius:3,padding:"9px",color:C.muted,fontFamily:C.font,fontSize:13,fontWeight:600,letterSpacing:"0.12em"}}>CANCEL</button>
                          <button onClick={()=>{onEditLog(logId,i,{weight:editingLog.weight,reps:editingLog.reps});setEditingLog(null);}} style={{flex:2,background:C.red,border:"none",borderRadius:3,padding:"9px",color:C.white,fontFamily:C.font,fontSize:13,fontWeight:700,letterSpacing:"0.14em",boxShadow:`0 0 12px rgba(232,53,58,0.3)`}}>SAVE CHANGES</button>
                        </div>
                      </div>
                    }
                  </div>;
                })}
              </div>
            }
          </>}
        </div>
      </PageTransition>
    </div>

    {/* Mobile bottom nav */}
    <div className="mobile-nav" style={{position:"fixed",bottom:0,left:0,right:0,height:64,background:"rgba(5,5,7,0.97)",borderTop:`0.5px solid ${C.border}`,zIndex:20,alignItems:"center",justifyContent:"space-around",padding:"0 8px",backdropFilter:"blur(16px)"}}>
      {[["today","⚡","TODAY"],["programme","▦","PLAN"],["records","★","RECORDS"],["body","◉","BODY"],["history","≡","LOG"]].map(([t,icon,label])=><button key={t} onClick={()=>setTab(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",padding:"8px 12px",flex:1,opacity:tab===t?1:0.4,transition:"opacity 0.2s"}}>
        <span style={{fontSize:18,color:tab===t?C.red:C.muted,lineHeight:1}}>{icon}</span>
        <span style={{fontFamily:C.mono,fontSize:8,color:tab===t?C.red:C.muted,letterSpacing:"0.1em"}}>{label}</span>
      </button>)}
    </div>

    {importModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setImportModal(false);}}>
      <div style={{background:C.surface,border:`0.5px solid ${C.borderB}`,borderRadius:6,padding:"28px",width:"100%",maxWidth:460}}>
        <div style={{fontFamily:C.mono,fontSize:9,color:C.cyan,letterSpacing:"0.28em",marginBottom:6}}>{"//"} IMPORT</div>
        <div style={{fontFamily:C.font,fontSize:26,fontWeight:700,letterSpacing:"0.06em",color:C.white,marginBottom:8}}>IMPORT PLAN</div>
        <div style={{fontFamily:C.mono,fontSize:11,color:C.muted,marginBottom:22,lineHeight:1.7}}>Select a <span style={{color:C.cyan}}>.json</span> plan file sent by your coach. Sessions will be added to your existing programme without replacing anything.</div>
        {!importStatus&&<label style={{display:"block",background:C.redDim,border:`1.5px dashed ${C.redBdr}`,borderRadius:4,padding:"28px 20px",textAlign:"center",cursor:"pointer"}}>
          <input type="file" accept=".json,application/json" style={{display:"none"}} onChange={e=>{if(e.target.files[0])importPlan(e.target.files[0]);}}/>
          <div style={{fontFamily:C.font,fontSize:20,fontWeight:700,color:C.red,marginBottom:6}}>TAP TO SELECT FILE</div>
          <div style={{fontFamily:C.mono,fontSize:10,color:C.muted}}>Accepts .json files exported from BuiltByBilly</div>
        </label>}
        {importStatus==="success"&&<div style={{background:"rgba(34,197,94,0.10)",border:"0.5px solid rgba(34,197,94,0.35)",borderRadius:4,padding:"20px",textAlign:"center"}}>
          <div style={{fontFamily:C.font,fontSize:32,fontWeight:700,color:"#22C55E",marginBottom:4}}>IMPORTED ✓</div>
          <div style={{fontFamily:C.mono,fontSize:11,color:C.muted}}>{importMsg}</div>
        </div>}
        {importStatus==="error"&&<div style={{background:C.redDim,border:`0.5px solid ${C.redBdr}`,borderRadius:4,padding:"20px",textAlign:"center"}}>
          <div style={{fontFamily:C.font,fontSize:32,fontWeight:700,color:C.red,marginBottom:4}}>FAILED ✕</div>
          <div style={{fontFamily:C.mono,fontSize:11,color:C.muted,marginBottom:12}}>{importMsg}</div>
          <Btn variant="redOutline" size="sm" onClick={()=>setImportStatus(null)}>TRY AGAIN</Btn>
        </div>}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
          <Btn variant="ghost" onClick={()=>setImportModal(false)}>{importStatus==="success"?"DONE":"CANCEL"}</Btn>
        </div>
      </div>
    </div>}
  </div>;
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [clients,setClients]=useStorage(KEYS.clients,[]);
  const [workouts,setWorkouts]=useStorage(KEYS.workouts,{});
  const [logs,setLogs]=useStorage(KEYS.logs,[]);
  const [auth,setAuth]=useState(null);

  function clientLogs(cid){
    const ids=new Set((workouts[cid]||[]).flatMap(w=>w.exercises.map(e=>e.id)));
    return logs.filter(l=>ids.has(l.exerciseId));
  }

  if(!auth)return <LoginScreen onCoachLogin={()=>setAuth({type:"coach"})} onClientLogin={c=>setAuth({type:"client",client:c})} clients={clients}/>;
  if(auth.type==="coach")return <CoachDashboard clients={clients} setClients={setClients} workouts={workouts} setWorkouts={setWorkouts} onLogout={()=>setAuth(null)}/>;
  if(auth.type==="client")return <ClientDashboard
    client={auth.client}
    workouts={workouts}
    logs={clientLogs(auth.client.id)}
    onLogSet={e=>setLogs(p=>[...p,e])}
    onEditLog={(logId,fallbackIdx,changes)=>setLogs(p=>p.map((l,i)=>(l.id===logId||(l.id===undefined&&i===p.length-1-fallbackIdx))?{...l,...changes}:l))}
    onDeleteLog={(logId,fallbackIdx)=>setLogs(p=>p.filter((l,i)=>!(l.id===logId||(l.id===undefined&&i===p.length-1-fallbackIdx))))}
    onLogout={()=>setAuth(null)}/>;
}

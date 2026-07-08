import { useState, useEffect } from "react";

// ── SOUND ──────────────────────────────────────────────────────
const sfx = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const b = (f,s,d,v=0.25) => {
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value=f; o.type='sine';
      g.gain.setValueAtTime(v,t+s);
      g.gain.exponentialRampToValueAtTime(0.001,t+s+d);
      o.start(t+s); o.stop(t+s+d+0.05);
    };
    if(type==='check')   { b(523,0,.1); b(784,.1,.15); }
    if(type==='counter') { b(659,0,.08); b(880,.07,.12); }
    if(type==='complete'){ [523,659,784,1047].forEach((f,i)=>b(f,i*.1,.15)); }
    if(type==='incident'){ b(220,0,.2,.2); b(196,.15,.2,.15); }
    if(type==='redeem')  { [523,659,784,880,1047,1319].forEach((f,i)=>b(f,i*.07,.2)); }
    if(type==='undo')    { b(440,0,.08,.15); }
  } catch(e) {}
};

// ── BRAND TOKENS ───────────────────────────────────────────────
const B = {
  midnight: "#1E2B4D",
  sunshine: "#FFC840",
  coral:    "#FF7270",
  mint:     "#4EC7B0",
  lavender: "#8B47FF",
  cream:    "#FFF7F5",
};

const KID_COLORS = [
  {color:B.coral,    accent:"#FF5252", light:"#FFF0F0"},
  {color:B.mint,     accent:"#2EB89A", light:"#EDFAF7"},
  {color:B.lavender, accent:"#6E2FE8", light:"#F3EEFF"},
  {color:B.sunshine, accent:"#E6AA00", light:"#FFF8E0"},
];
const KID_AVATARS = ["🦁","🐣","🐻","🐱","🦄","🐸","🐬","🦊","🐧","🐨","🦋","🐙"];
const REWARD_COLORS = [B.coral, B.mint, B.lavender, B.sunshine, "#FF9F43","#54A0FF"];
const DEFAULT_TASKS = {
  id:[
    {emoji:"🚿",label:"Mandi pagi"},{emoji:"🍳",label:"Sarapan habis"},
    {emoji:"📖",label:"Belajar 30 menit"},{emoji:"🧹",label:"Beresin kamar"},
    {emoji:"📿",label:"Setoran ayat",type:"counter"},{emoji:"📗",label:"Baca Quran"},
    {emoji:"🕌",label:"Solat"},{emoji:"🌙",label:"Tidur tepat waktu"},
  ],
  en:[
    {emoji:"🚿",label:"Morning shower"},{emoji:"🍳",label:"Finish breakfast"},
    {emoji:"📖",label:"Study 30 mins"},{emoji:"🧹",label:"Tidy room"},
    {emoji:"📿",label:"Quran verses",type:"counter"},{emoji:"📗",label:"Quran reading"},
    {emoji:"🕌",label:"Prayer"},{emoji:"🌙",label:"Bedtime on time"},
  ],
};
const DEFAULT_REWARDS = {
  id:[
    {id:"r1",emoji:"📱",label:"Main HP",sublabel:"Weekend, 30 menit",cost:30,color:B.coral},
    {id:"r2",emoji:"🍡",label:"Jajan",sublabel:"Pilih sendiri",cost:60,color:B.sunshine},
    {id:"r3",emoji:"📚",label:"Beli Buku",sublabel:"Buku apa aja",cost:80,color:B.mint},
    {id:"r4",emoji:"🎁",label:"Beli Mainan",sublabel:"Nabung dulu!",cost:350,color:B.lavender},
  ],
  en:[
    {id:"r1",emoji:"📱",label:"Screen Time",sublabel:"Weekends, 30 mins",cost:30,color:B.coral},
    {id:"r2",emoji:"🍡",label:"Snack Treat",sublabel:"Your choice!",cost:60,color:B.sunshine},
    {id:"r3",emoji:"📚",label:"Buy a Book",sublabel:"Any book",cost:80,color:B.mint},
    {id:"r4",emoji:"🎁",label:"Buy a Toy",sublabel:"Save up first!",cost:350,color:B.lavender},
  ],
};
const DAYS_LABEL = {
  id:["Sen","Sel","Rab","Kam","Jum","Sab","Min"],
  en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
};
const BONUS = 3;

// ── GLOBAL STYLE ───────────────────────────────────────────────
const GS = () => <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:${B.cream};}
  h1,h2,h3,.fredoka{font-family:'Fredoka',sans-serif;}
  input,button{font-family:'Plus Jakarta Sans',sans-serif;}
  .tap{cursor:pointer;border:none;background:none;transition:transform .12s;}.tap:active{transform:scale(.96);}
  input:focus{outline:none;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{transform:scale(.8);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
  @keyframes sparkle{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-70px) scale(.2);opacity:0}}
  @keyframes badgePop{0%{transform:scale(.4)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
`}</style>;

// ── ONBOARDING ─────────────────────────────────────────────────
const SLIDES = [
  {
    bg: B.midnight,
    titleColor: "white",
    bodyColor: "rgba(255,255,255,0.75)",
    starStyle: {filter:"drop-shadow(0 8px 32px rgba(255,200,64,0.5))", transform:"scale(1.1)"},
    title: "Kindee",
    subtitle: "Growing little hearts,\none habit at a time. ❤️",
    isHome: true,
  },
  {
    bg: "#FFF3E8",
    titleColor: B.midnight,
    bodyColor: "#555",
    starStyle: {filter:"drop-shadow(0 8px 24px rgba(255,200,64,0.3))", transform:"rotate(-8deg) scale(1.05)"},
    title: "Little habits,\nbig impact.",
    body: "Every small action today helps your child grow into a responsible and kind person tomorrow.",
  },
  {
    bg: "#E8FBF7",
    titleColor: B.midnight,
    bodyColor: "#555",
    starStyle: {filter:"drop-shadow(0 8px 24px rgba(78,199,176,0.3))", transform:"rotate(5deg) scale(1.05)"},
    title: "Tasks, rewards,\nand growth.",
    body: "Kids complete tasks, earn rewards, and unlock new adventures with Kindee.",
  },
  {
    bg: "#FFF0F0",
    titleColor: B.midnight,
    bodyColor: "#555",
    starStyle: {filter:"drop-shadow(0 8px 24px rgba(255,114,112,0.3))", transform:"rotate(-5deg) scale(0.95)"},
    title: "Understand choices\nand consequences.",
    body: "We help kids understand that every choice has a result, so they can make better decisions every day.",
  },
  {
    bg: "#F0EEFF",
    titleColor: B.midnight,
    bodyColor: "#555",
    starStyle: {filter:"drop-shadow(0 8px 24px rgba(139,71,255,0.3))", transform:"rotate(8deg) scale(1.1)"},
    title: "Stronger\ntogether.",
    body: "Parents and kids journey together, celebrate progress, and build a better everyday.",
  },
];

function Onboarding({onDone}) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div style={{minHeight:"100vh",background:slide.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"60px 28px 48px",transition:"background .4s",animation:"fadeIn .3s ease"}}>
      <GS/>

      {/* Top dots */}
      <div style={{display:"flex",gap:8}}>
        {SLIDES.map((_,i)=>(
          <div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?24:8,height:8,borderRadius:100,background:i===idx?slide.titleColor:"rgba(0,0,0,0.15)",transition:"all .3s",cursor:"pointer"}}/>
        ))}
      </div>

      {/* Star mascot */}
      <div style={{animation:"float 3s ease-in-out infinite",textAlign:"center"}}>
        <img src="/kindee_star.png" alt="Kindee" style={{width:180,height:180,objectFit:"contain",...slide.starStyle,transition:"all .4s"}}/>
      </div>

      {/* Text */}
      <div style={{textAlign:"center",maxWidth:320}}>
        {slide.isHome ? (
          <>
            <h1 className="fredoka" style={{fontSize:52,fontWeight:700,color:B.sunshine,letterSpacing:1,lineHeight:1}}>Kindee</h1>
            <p style={{fontSize:18,color:"rgba(255,255,255,0.9)",marginTop:16,lineHeight:1.6,fontWeight:500,whiteSpace:"pre-line"}}>{slide.subtitle}</p>
          </>
        ) : (
          <>
            <h2 className="fredoka" style={{fontSize:30,fontWeight:700,color:slide.titleColor,lineHeight:1.3,whiteSpace:"pre-line"}}>{slide.title}</h2>
            <p style={{fontSize:15,color:slide.bodyColor,marginTop:12,lineHeight:1.7}}>{slide.body}</p>
          </>
        )}
      </div>

      {/* Buttons */}
      <div style={{width:"100%",maxWidth:340}}>
        <button className="tap" onClick={()=>isLast?onDone():setIdx(i=>i+1)}
          style={{width:"100%",padding:"16px",borderRadius:100,background:slide.isHome?B.sunshine:B.midnight,color:slide.isHome?B.midnight:"white",fontWeight:700,fontSize:17,boxShadow:`0 6px 24px rgba(0,0,0,0.15)`,fontFamily:"'Fredoka',sans-serif",letterSpacing:.5}}>
          {slide.isHome ? "Let's get started! 🚀" : isLast ? "Start your journey! ✨" : "Next →"}
        </button>
        {idx > 0 && (
          <button className="tap" onClick={onDone}
            style={{width:"100%",marginTop:12,padding:"10px",borderRadius:100,background:"transparent",color:slide.titleColor,fontWeight:600,fontSize:14,opacity:0.6}}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

// ── TASK EDITOR ────────────────────────────────────────────────
function TaskEditor({tasks,onToggle,onRemove,onMove,onAdd,color,light,lang}) {
  const [newTask,setNewTask] = useState("");
  const L=(id,en)=>lang==="id"?id:en;
  function doAdd(){if(!newTask.trim())return;onAdd(newTask.trim());setNewTask("");}
  return (
    <div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {tasks.map((t,ti)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:14,background:t.on!==false?light:"#F5F5F5",border:`2px solid ${t.on!==false?color+"33":"#E8E8E8"}`}}>
            {onToggle&&(
              <button className="tap" onClick={()=>onToggle(t.id)}
                style={{width:28,height:28,borderRadius:50,background:t.on!==false?color:"#DDD",color:"white",fontWeight:700,fontSize:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {t.on!==false?"✓":""}
              </button>
            )}
            <span style={{fontSize:18}}>{t.emoji}</span>
            <span style={{flex:1,fontWeight:600,fontSize:14,color:t.on!==false?B.midnight:"#BBB"}}>{t.label}</span>
            {t.type==="counter"&&<span style={{fontSize:11,color,fontWeight:700,background:light,padding:"2px 8px",borderRadius:20}}>+N</span>}
            <div style={{display:"flex",gap:2}}>
              <button className="tap" onClick={()=>onMove(t.id,-1)} disabled={ti===0} style={{color:ti===0?"#DDD":"#AAA",fontSize:14,padding:"3px"}}>↑</button>
              <button className="tap" onClick={()=>onMove(t.id,1)} disabled={ti===tasks.length-1} style={{color:ti===tasks.length-1?"#DDD":"#AAA",fontSize:14,padding:"3px"}}>↓</button>
              <button className="tap" onClick={()=>onRemove(t.id)} style={{color:"#CCC",fontSize:18,fontWeight:700,padding:"3px"}}>×</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAdd()}
          placeholder={L("Tambah tugas...","Add a task...")}
          style={{flex:1,padding:"11px 16px",borderRadius:14,border:`2px solid #E8E8E8`,fontSize:14,fontWeight:600,background:"white",color:B.midnight}}/>
        <button className="tap" onClick={doAdd}
          style={{padding:"11px 16px",borderRadius:14,background:color,color:"white",fontWeight:700,fontSize:14,whiteSpace:"nowrap"}}>
          + {L("Tambah","Add")}
        </button>
      </div>
    </div>
  );
}

// ── SETUP WIZARD ───────────────────────────────────────────────
function Setup({onDone}) {
  const [step,setStep] = useState(0);
  const [lang,setLang] = useState("id");
  const [numKids,setNumKids] = useState(2);
  const [kids,setKids] = useState([]);
  const [rewards,setRewards] = useState([]);
  const [newRw,setNewRw] = useState({emoji:"🏆",label:"",cost:""});

  const L=(id,en)=>lang==="id"?id:en;
  const initKid=(i,l)=>({name:"",avatar:KID_AVATARS[i%KID_AVATARS.length],colorIdx:i%KID_COLORS.length,incidentCost:i===0?3:2,tasks:DEFAULT_TASKS[l].map((t,ti)=>({...t,id:ti+1,on:true}))});
  const numSteps=2+numKids+1;
  const isKidStep=step>=2&&step<2+numKids;
  const isRewardStep=step===2+numKids;
  const ki=isKidStep?step-2:0;
  const kid=kids[ki];
  const kc=kid?KID_COLORS[kid.colorIdx]:KID_COLORS[0];

  function next(){
    if(step===0)setStep(1);
    else if(step===1){setKids(Array.from({length:Math.max(1,numKids)},(_,i)=>initKid(i,lang)));setStep(2);}
    else if(isKidStep){if(step===1+numKids)setRewards(DEFAULT_REWARDS[lang]);setStep(s=>s+1);}
    else if(isRewardStep)onDone({lang,kids:kids.map(k=>({...k,tasks:k.tasks.filter(t=>t.on)})),rewards});
  }
  function updKid(patch){setKids(p=>p.map((k,i)=>i===ki?{...k,...patch}:k));}
  function toggleTask(tid){setKids(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:k.tasks.map(t=>t.id===tid?{...t,on:!t.on}:t)}));}
  function removeTask(tid){setKids(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:k.tasks.filter(t=>t.id!==tid)}));}
  function moveTask(tid,dir){setKids(p=>p.map((k,i)=>{if(i!==ki)return k;const ts=[...k.tasks],idx=ts.findIndex(t=>t.id===tid),ni=idx+dir;if(ni<0||ni>=ts.length)return k;[ts[idx],ts[ni]]=[ts[ni],ts[idx]];return{...k,tasks:ts};}));}
  function addTask(label){setKids(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:[...k.tasks,{id:Date.now(),emoji:"✅",label,on:true}]}));}
  function updRw(id,patch){setRewards(p=>p.map(r=>r.id===id?{...r,...patch}:r));}
  function removeRw(id){setRewards(p=>p.filter(r=>r.id!==id));}
  function addRw(){if(!newRw.label.trim()||!newRw.cost)return;setRewards(p=>[...p,{id:"r"+Date.now(),emoji:newRw.emoji,label:newRw.label,sublabel:"",cost:parseInt(newRw.cost),color:REWARD_COLORS[p.length%REWARD_COLORS.length]}]);setNewRw({emoji:"🏆",label:"",cost:""});}

  const Card = ({children,mb=12}) => <div style={{background:"white",borderRadius:20,padding:18,marginBottom:mb,boxShadow:"0 2px 16px rgba(30,43,77,0.07)"}}>{children}</div>;
  const Label = ({t}) => <p style={{fontSize:11,fontWeight:700,color:"#AAA",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>{t}</p>;

  return (
    <div style={{minHeight:"100vh",background:B.cream,fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"28px 18px 80px"}}>
      <GS/>
      {step>0&&(
        <div style={{maxWidth:440,margin:"0 auto",display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button className="tap" onClick={()=>setStep(s=>Math.max(0,s-1))}
            style={{width:40,height:40,borderRadius:50,background:"white",boxShadow:"0 2px 10px rgba(0,0,0,0.1)",fontWeight:700,fontSize:18,color:B.midnight,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
          <div style={{flex:1,display:"flex",gap:4}}>
            {Array.from({length:numSteps}).map((_,i)=>(
              <div key={i} style={{flex:1,height:6,borderRadius:100,background:i<=step?kc.color:"#E8E8E8",transition:"all .3s"}}/>
            ))}
          </div>
        </div>
      )}

      <div style={{maxWidth:440,margin:"0 auto",animation:"fadeIn .3s ease"}}>

        {/* STEP 0 — Language */}
        {step===0&&(
          <div style={{textAlign:"center",paddingTop:20}}>
            <div style={{fontSize:72,marginBottom:8,animation:"float 3s ease-in-out infinite"}}>⭐</div>
            <h1 className="fredoka" style={{fontSize:44,color:B.midnight,fontWeight:700}}>Kindee</h1>
            <p style={{color:"#888",fontSize:15,marginTop:6,marginBottom:36}}>
              {L("Pilih bahasa kamu","Choose your language")}
            </p>
            <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:32}}>
              {[["id","🇮🇩","Indonesia"],["en","🇬🇧","English"]].map(([l,flag,name])=>(
                <button key={l} className="tap" onClick={()=>setLang(l)}
                  style={{flex:1,maxWidth:160,padding:"22px 16px",borderRadius:24,background:lang===l?B.midnight:"white",color:lang===l?"white":B.midnight,fontWeight:700,fontSize:16,boxShadow:lang===l?`0 6px 24px ${B.midnight}44`:"0 2px 12px rgba(0,0,0,0.08)",border:lang===l?"none":"2px solid #EEE",transition:"all .2s"}}>
                  <div style={{fontSize:40,marginBottom:10}}>{flag}</div>
                  <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18}}>{name}</div>
                </button>
              ))}
            </div>
            <button className="tap" onClick={next}
              style={{width:"100%",padding:"16px",borderRadius:100,background:B.midnight,color:"white",fontWeight:700,fontSize:17,fontFamily:"'Fredoka',sans-serif",letterSpacing:.5,boxShadow:`0 6px 24px ${B.midnight}44`}}>
              {L("Mulai Setup! 🚀","Start Setup! 🚀")}
            </button>
          </div>
        )}

        {/* STEP 1 — Num Kids */}
        {step===1&&(
          <div>
            <h2 className="fredoka" style={{fontSize:28,color:B.midnight,marginBottom:6}}>{L("Ada berapa anak?","How many kids?")}</h2>
            <p style={{color:"#999",fontSize:14,marginBottom:24}}>{L("Bisa diubah di Settings nanti","Can be changed in Settings later")}</p>
            <Card>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:28,padding:"12px 0"}}>
                <button className="tap" onClick={()=>setNumKids(n=>Math.max(1,n-1))}
                  style={{width:52,height:52,borderRadius:50,background:"#F5F5F5",fontWeight:700,fontSize:28,color:B.midnight,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                <div style={{textAlign:"center"}}>
                  <div className="fredoka" style={{fontSize:72,fontWeight:700,color:B.coral,lineHeight:1}}>{numKids}</div>
                  <div style={{fontSize:15,color:"#999",marginTop:4}}>{L(`${numKids} anak`,`${numKids} kid${numKids>1?"s":""}`)}</div>
                </div>
                <button className="tap" onClick={()=>setNumKids(n=>n+1)}
                  style={{width:52,height:52,borderRadius:50,background:B.coral,fontWeight:700,fontSize:28,color:"white",boxShadow:`0 4px 14px ${B.coral}55`,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
              </div>
            </Card>
            <button className="tap" onClick={next}
              style={{width:"100%",padding:"16px",borderRadius:100,background:B.coral,color:"white",fontWeight:700,fontSize:17,fontFamily:"'Fredoka',sans-serif",boxShadow:`0 6px 20px ${B.coral}44`}}>
              {L("Lanjut →","Next →")}
            </button>
          </div>
        )}

        {/* STEP 2+i — Per Kid */}
        {isKidStep&&kid&&(
          <div>
            <h2 className="fredoka" style={{fontSize:26,color:B.midnight,marginBottom:4}}>{L(`Setup Anak ${ki+1}`,`Set up Child ${ki+1}`)}</h2>
            <p style={{color:"#999",fontSize:14,marginBottom:18}}>{L("Sesuaikan untuk anakmu ✨","Personalize for your child ✨")}</p>
            <Card><Label t={L(`Nama Anak ${ki+1}`,`Child ${ki+1} Name`)}/><input value={kid.name} onChange={e=>updKid({name:e.target.value})} placeholder={L("Nama anak...","Child's name...")} style={{width:"100%",padding:"10px 0",fontSize:24,fontWeight:700,color:B.midnight,border:"none",borderBottom:`2px solid ${kc.color}44`,background:"transparent",fontFamily:"'Fredoka',sans-serif"}}/></Card>
            <Card>
              <Label t={L("Avatar & Warna","Avatar & Color")}/>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {KID_AVATARS.map(av=>(
                  <button key={av} className="tap" onClick={()=>updKid({avatar:av})}
                    style={{width:44,height:44,borderRadius:14,fontSize:24,background:kid.avatar===av?kc.light:"#F7F7F7",border:`2px solid ${kid.avatar===av?kc.color:"transparent"}`,transition:"all .15s"}}>
                    {av}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:14}}>
                {KID_COLORS.map((c,i)=>(
                  <button key={i} className="tap" onClick={()=>updKid({colorIdx:i})}
                    style={{width:38,height:38,borderRadius:50,background:c.color,border:kid.colorIdx===i?"3px solid #333":"3px solid transparent",boxShadow:kid.colorIdx===i?`0 0 0 3px white,0 0 0 5px ${c.color}`:"none",transition:"all .15s"}}/>
                ))}
              </div>
            </Card>
            <Card><Label t={L("Tugas Harian","Daily Tasks")}/><TaskEditor tasks={kid.tasks} onToggle={toggleTask} onRemove={removeTask} onMove={moveTask} onAdd={addTask} color={kc.color} light={kc.light} lang={lang}/></Card>
            <Card mb={24}>
              <Label t={L("Pengurangan poin per insiden","Points deducted per incident")}/>
              <div style={{display:"flex",gap:10}}>
                {[1,2,3,5].map(n=>(
                  <button key={n} className="tap" onClick={()=>updKid({incidentCost:n})}
                    style={{flex:1,padding:"12px 4px",borderRadius:14,background:kid.incidentCost===n?"#FEE2E2":"#F7F7F7",color:kid.incidentCost===n?"#EF4444":"#999",fontWeight:700,fontSize:16,border:kid.incidentCost===n?"2px solid #FECACA":"2px solid transparent"}}>
                    -{n}
                  </button>
                ))}
              </div>
            </Card>
            <button className="tap" onClick={next} disabled={!kid.name.trim()}
              style={{width:"100%",padding:"16px",borderRadius:100,background:kid.name.trim()?kc.color:"#DDD",color:"white",fontWeight:700,fontSize:17,fontFamily:"'Fredoka',sans-serif",boxShadow:kid.name.trim()?`0 6px 20px ${kc.color}44`:"none"}}>
              {L("Lanjut →","Next →")}
            </button>
            {!kid.name.trim()&&<p style={{textAlign:"center",color:"#CCC",fontSize:13,marginTop:10}}>{L("Isi nama dulu ya 😊","Please enter a name 😊")}</p>}
          </div>
        )}

        {/* REWARDS STEP */}
        {isRewardStep&&(
          <div>
            <h2 className="fredoka" style={{fontSize:26,color:B.midnight,marginBottom:4}}>{L("Setup Reward 🎁","Set Up Rewards 🎁")}</h2>
            <p style={{color:"#999",fontSize:14,marginBottom:20}}>{L("Edit nama & poin, atau tambah baru","Edit names & points, or add new ones")}</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {rewards.map(r=>(
                <div key={r.id} style={{background:"white",borderRadius:18,padding:"14px 16px",boxShadow:"0 2px 12px rgba(30,43,77,0.07)",border:`2px solid ${r.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:28}}>{r.emoji}</span>
                    <input value={r.label} onChange={e=>updRw(r.id,{label:e.target.value})} style={{flex:1,fontWeight:700,fontSize:16,border:"none",borderBottom:`2px solid #F0F0F0`,padding:"4px 0",background:"transparent",color:B.midnight}}/>
                    <button className="tap" onClick={()=>removeRw(r.id)} style={{color:"#CCC",fontSize:22,fontWeight:700}}>×</button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
                    <span style={{fontSize:12,color:"#BBB",fontWeight:600}}>{L("Poin:","Points:")}</span>
                    <input type="number" value={r.cost} onChange={e=>updRw(r.id,{cost:parseInt(e.target.value)||0})} style={{width:72,padding:"6px 10px",borderRadius:12,border:`2px solid #F0F0F0`,fontWeight:700,fontSize:15,color:r.color,textAlign:"center"}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:24,border:"2px dashed #E0E0E0"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#BBB",marginBottom:10}}>{L("+ Tambah Reward","+ Add Reward")}</p>
              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                <input value={newRw.emoji} onChange={e=>setNewRw(p=>({...p,emoji:e.target.value}))} style={{width:44,textAlign:"center",fontSize:22,border:"2px solid #F0F0F0",borderRadius:12,padding:"8px 4px"}}/>
                <input value={newRw.label} onChange={e=>setNewRw(p=>({...p,label:e.target.value}))} placeholder={L("Nama reward","Reward name")} style={{flex:1,padding:"10px 14px",border:"2px solid #F0F0F0",borderRadius:14,fontSize:13,fontWeight:600}}/>
                <input type="number" value={newRw.cost} onChange={e=>setNewRw(p=>({...p,cost:e.target.value}))} placeholder="pts" style={{width:60,padding:"10px 6px",border:"2px solid #F0F0F0",borderRadius:14,fontSize:13,fontWeight:700,textAlign:"center"}}/>
                <button className="tap" onClick={addRw} style={{padding:"10px 14px",borderRadius:14,background:B.mint,color:"white",fontWeight:700,fontSize:18}}>+</button>
              </div>
            </div>
            <button className="tap" onClick={next}
              style={{width:"100%",padding:"16px",borderRadius:100,background:B.mint,color:"white",fontWeight:700,fontSize:17,fontFamily:"'Fredoka',sans-serif",boxShadow:`0 6px 20px ${B.mint}44`}}>
              {L("Mulai! 🚀","Let's go! 🚀")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS PANEL ─────────────────────────────────────────────
function Settings({lang,kidsConfig,setKidsConfig,rewardsConfig,setRewardsConfig,appData,setAppData,onReset,onClose}) {
  const [view,setView] = useState(null);
  const [newRw,setNewRw] = useState({emoji:"🏆",label:"",cost:""});
  const [newKidForm,setNewKidForm] = useState({name:"",avatar:"🐣",colorIdx:1});
  const [confirmDel,setConfirmDel] = useState(null);
  const DAYS=DAYS_LABEL[lang];
  const L=(id,en)=>lang==="id"?id:en;

  function updKid(idx,patch){setKidsConfig(p=>p.map((k,i)=>i===idx?{...k,...patch}:k));}
  function removeTask(ki,tid){setKidsConfig(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:k.tasks.filter(t=>t.id!==tid)}));}
  function moveTask(ki,tid,dir){setKidsConfig(p=>p.map((k,i)=>{if(i!==ki)return k;const ts=[...k.tasks],idx=ts.findIndex(t=>t.id===tid),ni=idx+dir;if(ni<0||ni>=ts.length)return k;[ts[idx],ts[ni]]=[ts[ni],ts[idx]];return{...k,tasks:ts};}));}
  function addTask(ki,label){setKidsConfig(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:[...k.tasks,{id:Date.now(),emoji:"✅",label}]}));}
  function updRw(id,patch){setRewardsConfig(p=>p.map(r=>r.id===id?{...r,...patch}:r));}
  function removeRw(id){setRewardsConfig(p=>p.filter(r=>r.id!==id));}
  function addRw(){if(!newRw.label.trim()||!newRw.cost)return;setRewardsConfig(p=>[...p,{id:"r"+Date.now(),emoji:newRw.emoji,label:newRw.label,sublabel:"",cost:parseInt(newRw.cost),color:REWARD_COLORS[p.length%REWARD_COLORS.length]}]);setNewRw({emoji:"🏆",label:"",cost:""});}
  function addKid(){
    if(!newKidForm.name.trim())return;
    const tasks=DEFAULT_TASKS[lang].map((t,i)=>({...t,id:i+1}));
    const kid={...newKidForm,tasks,incidentCost:2};
    setKidsConfig(p=>[...p,kid]);
    const nd={days:{},redeemed:[],incidents:[]};
    DAYS.forEach((_,i)=>{nd.days[i]={tasks:{},incidents:0};tasks.forEach(t=>{nd.days[i].tasks[t.id]=t.type==="counter"?0:false;});});
    setAppData(p=>({...p,[newKidForm.name]:nd}));
    setNewKidForm({name:"",avatar:"🐣",colorIdx:1});setView(null);
  }
  function removeKid(idx){const name=kidsConfig[idx].name;setKidsConfig(p=>p.filter((_,i)=>i!==idx));setAppData(p=>{const d={...p};delete d[name];return d;});setConfirmDel(null);setView(null);}

  const kd=view?.type==="kid"?kidsConfig[view.idx]:null;
  const kc=kd?KID_COLORS[kd.colorIdx]:KID_COLORS[0];
  const Card=({children,mb=12})=><div style={{background:"white",borderRadius:20,padding:16,marginBottom:mb,boxShadow:"0 2px 12px rgba(30,43,77,0.07)"}}>{children}</div>;
  const Label=({t})=><p style={{fontSize:11,fontWeight:700,color:"#AAA",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>{t}</p>;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,43,77,0.5)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:B.cream,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",animation:"popIn .3s ease",padding:"20px 18px 48px",position:"relative"}}>
        <GS/>

        {confirmDel!==null&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",borderRadius:"24px 24px 0 0",display:"flex",alignItems:"center",justifyContent:"center",padding:24,zIndex:10}}>
            <div style={{background:"white",borderRadius:20,padding:24,maxWidth:280,textAlign:"center"}}>
              <p style={{fontFamily:"'Fredoka',sans-serif",fontWeight:700,fontSize:18,color:B.midnight}}>{L(`Hapus ${kidsConfig[confirmDel]?.name}?`,`Remove ${kidsConfig[confirmDel]?.name}?`)}</p>
              <p style={{fontSize:13,color:"#AAA",marginTop:8,lineHeight:1.5}}>{L("Semua data anak ini akan hilang.","All data for this child will be deleted.")}</p>
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button className="tap" onClick={()=>setConfirmDel(null)} style={{flex:1,padding:"12px",borderRadius:14,background:"#F0F0F0",fontWeight:700,color:"#555"}}>{L("Batal","Cancel")}</button>
                <button className="tap" onClick={()=>removeKid(confirmDel)} style={{flex:1,padding:"12px",borderRadius:14,background:"#EF4444",fontWeight:700,color:"white"}}>{L("Hapus","Remove")}</button>
              </div>
            </div>
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          {view&&<button className="tap" onClick={()=>setView(null)} style={{width:36,height:36,borderRadius:50,background:"white",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",fontWeight:700,fontSize:17,color:B.midnight,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>}
          <h2 className="fredoka" style={{flex:1,fontSize:22,color:B.midnight}}>
            {!view?L("⚙️ Pengaturan","⚙️ Settings"):view==="rewards"?L("🎁 Ubah Reward","🎁 Edit Rewards"):view==="addKid"?L("➕ Tambah Anak","➕ Add Child"):L(`✏️ ${kd?.name}`,`✏️ ${kd?.name}`)}
          </h2>
          <button className="tap" onClick={onClose} style={{width:36,height:36,borderRadius:50,background:"white",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",fontWeight:700,fontSize:18,color:"#AAA",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        {!view&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:11,fontWeight:700,color:"#AAA",textTransform:"uppercase",letterSpacing:1.2,paddingLeft:4}}>{L("ANAK-ANAK","CHILDREN")}</p>
            {kidsConfig.map((k,i)=>{
              const c=KID_COLORS[k.colorIdx];
              return(
                <button key={i} className="tap" onClick={()=>setView({type:"kid",idx:i})}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"white",borderRadius:18,boxShadow:"0 2px 10px rgba(30,43,77,0.07)",border:`2px solid ${c.color}22`,textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:30}}>{k.avatar}</span>
                  <div style={{flex:1}}><p className="fredoka" style={{fontWeight:600,fontSize:17,color:B.midnight}}>{k.name}</p><p style={{fontSize:12,color:"#AAA",marginTop:2}}>{k.tasks.length} {L("tugas","tasks")}</p></div>
                  <span style={{color:"#CCC",fontSize:22,fontWeight:700}}>›</span>
                </button>
              );
            })}
            <button className="tap" onClick={()=>setView("addKid")} style={{padding:"14px",borderRadius:18,border:"2px dashed #E0E0E0",fontWeight:700,fontSize:15,color:"#AAA"}}>
              + {L("Tambah Anak","Add Child")}
            </button>
            <div style={{height:1,background:"#EEE",margin:"4px 0"}}/>
            <button className="tap" onClick={()=>setView("rewards")}
              style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"white",borderRadius:18,boxShadow:"0 2px 10px rgba(30,43,77,0.07)",textAlign:"left",width:"100%"}}>
              <span style={{fontSize:30}}>🎁</span>
              <div style={{flex:1}}><p className="fredoka" style={{fontWeight:600,fontSize:17,color:B.midnight}}>{L("Reward","Rewards")}</p><p style={{fontSize:12,color:"#AAA",marginTop:2}}>{rewardsConfig.length} {L("reward","rewards")}</p></div>
              <span style={{color:"#CCC",fontSize:22,fontWeight:700}}>›</span>
            </button>
            <div style={{height:1,background:"#EEE",margin:"4px 0"}}/>
            <button className="tap" onClick={()=>{if(window.confirm(L("Reset semua data Kindee?","Reset all Kindee data?")))onReset();}}
              style={{padding:"14px",borderRadius:18,border:`2px solid #FFE0E0`,fontWeight:700,fontSize:14,color:"#EF4444",background:"transparent",width:"100%"}}>
              🔄 {L("Mulai Ulang dari Awal","Reset & Start Over")}
            </button>
          </div>
        )}

        {view?.type==="kid"&&kd&&(
          <div>
            <Card><Label t={L("Nama","Name")}/><input value={kd.name} onChange={e=>updKid(view.idx,{name:e.target.value})} style={{width:"100%",padding:"10px 0",fontSize:22,fontWeight:700,color:B.midnight,border:"none",borderBottom:`2px solid ${kc.color}44`,background:"transparent",fontFamily:"'Fredoka',sans-serif"}}/></Card>
            <Card>
              <Label t={L("Avatar & Warna","Avatar & Color")}/>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {KID_AVATARS.map(av=>(
                  <button key={av} className="tap" onClick={()=>updKid(view.idx,{avatar:av})} style={{width:42,height:42,borderRadius:12,fontSize:22,background:kd.avatar===av?kc.light:"#F7F7F7",border:`2px solid ${kd.avatar===av?kc.color:"transparent"}`}}>{av}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:12}}>
                {KID_COLORS.map((c,i)=>(
                  <button key={i} className="tap" onClick={()=>updKid(view.idx,{colorIdx:i})} style={{width:36,height:36,borderRadius:50,background:c.color,border:kd.colorIdx===i?"3px solid #333":"3px solid transparent",boxShadow:kd.colorIdx===i?`0 0 0 3px white,0 0 0 5px ${c.color}`:"none"}}/>
                ))}
              </div>
            </Card>
            <Card><Label t={L("Tugas","Tasks")}/><TaskEditor tasks={kd.tasks} onRemove={tid=>removeTask(view.idx,tid)} onMove={(tid,dir)=>moveTask(view.idx,tid,dir)} onAdd={label=>addTask(view.idx,label)} color={kc.color} light={kc.light} lang={lang}/></Card>
            {kidsConfig.length>1&&(
              <button className="tap" onClick={()=>setConfirmDel(view.idx)} style={{width:"100%",padding:"14px",borderRadius:18,background:"#FEE2E2",color:"#EF4444",fontWeight:700,fontSize:14,marginTop:4}}>
                🗑️ {L(`Hapus ${kd.name}`,`Remove ${kd.name}`)}
              </button>
            )}
          </div>
        )}

        {view==="rewards"&&(
          <div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {rewardsConfig.map(r=>(
                <div key={r.id} style={{background:"white",borderRadius:18,padding:"14px 16px",boxShadow:"0 2px 10px rgba(30,43,77,0.07)",border:`2px solid ${r.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:26}}>{r.emoji}</span>
                    <input value={r.label} onChange={e=>updRw(r.id,{label:e.target.value})} style={{flex:1,fontWeight:700,fontSize:15,border:"none",borderBottom:"2px solid #F0F0F0",padding:"4px 0",background:"transparent",color:B.midnight}}/>
                    <button className="tap" onClick={()=>removeRw(r.id)} style={{color:"#CCC",fontSize:20,fontWeight:700}}>×</button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
                    <span style={{fontSize:12,color:"#BBB",fontWeight:600}}>{L("Poin:","Points:")}</span>
                    <input type="number" value={r.cost} onChange={e=>updRw(r.id,{cost:parseInt(e.target.value)||0})} style={{width:72,padding:"6px 10px",borderRadius:12,border:"2px solid #F0F0F0",fontWeight:700,fontSize:15,color:r.color,textAlign:"center"}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:18,padding:16,border:"2px dashed #E0E0E0"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#BBB",marginBottom:10}}>{L("+ Tambah Reward","+ Add Reward")}</p>
              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                <input value={newRw.emoji} onChange={e=>setNewRw(p=>({...p,emoji:e.target.value}))} style={{width:44,textAlign:"center",fontSize:22,border:"2px solid #F0F0F0",borderRadius:12,padding:"8px 4px"}}/>
                <input value={newRw.label} onChange={e=>setNewRw(p=>({...p,label:e.target.value}))} placeholder={L("Nama","Name")} style={{flex:1,padding:"10px 12px",border:"2px solid #F0F0F0",borderRadius:14,fontSize:13,fontWeight:600}}/>
                <input type="number" value={newRw.cost} onChange={e=>setNewRw(p=>({...p,cost:e.target.value}))} placeholder="pts" style={{width:60,padding:"10px 6px",border:"2px solid #F0F0F0",borderRadius:14,fontSize:13,fontWeight:700,textAlign:"center"}}/>
                <button className="tap" onClick={addRw} style={{padding:"10px 14px",borderRadius:14,background:B.mint,color:"white",fontWeight:700,fontSize:18}}>+</button>
              </div>
            </div>
          </div>
        )}

        {view==="addKid"&&(
          <div>
            <Card><Label t={L("Nama","Name")}/><input value={newKidForm.name} onChange={e=>setNewKidForm(p=>({...p,name:e.target.value}))} placeholder={L("Nama anak...","Child's name...")} style={{width:"100%",padding:"10px 0",fontSize:22,fontWeight:700,color:B.midnight,border:"none",borderBottom:`2px solid ${KID_COLORS[newKidForm.colorIdx].color}44`,background:"transparent",fontFamily:"'Fredoka',sans-serif"}}/></Card>
            <Card mb={20}>
              <Label t={L("Avatar & Warna","Avatar & Color")}/>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {KID_AVATARS.map(av=>(
                  <button key={av} className="tap" onClick={()=>setNewKidForm(p=>({...p,avatar:av}))} style={{width:40,height:40,borderRadius:12,fontSize:20,background:newKidForm.avatar===av?KID_COLORS[newKidForm.colorIdx].light:"#F7F7F7",border:`2px solid ${newKidForm.avatar===av?KID_COLORS[newKidForm.colorIdx].color:"transparent"}`}}>{av}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:12}}>
                {KID_COLORS.map((c,i)=>(
                  <button key={i} className="tap" onClick={()=>setNewKidForm(p=>({...p,colorIdx:i}))} style={{width:36,height:36,borderRadius:50,background:c.color,border:newKidForm.colorIdx===i?"3px solid #333":"3px solid transparent",boxShadow:newKidForm.colorIdx===i?`0 0 0 3px white,0 0 0 5px ${c.color}`:"none"}}/>
                ))}
              </div>
            </Card>
            <button className="tap" onClick={addKid} disabled={!newKidForm.name.trim()}
              style={{width:"100%",padding:"16px",borderRadius:100,background:newKidForm.name.trim()?KID_COLORS[newKidForm.colorIdx].color:"#DDD",color:"white",fontWeight:700,fontSize:17,fontFamily:"'Fredoka',sans-serif"}}>
              {L("Tambah Anak ✨","Add Child ✨")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
function App({config,onReset}) {
  const {lang}=config;
  const DAYS=DAYS_LABEL[lang];
  const today=new Date().getDay();
  const todayIdx=today===0?6:today-1;

  const [kidsConfig,setKidsConfig]=useState(config.kids);
  const [rewardsConfig,setRewardsConfig]=useState(config.rewards);
  const [activeKid,setActiveKid]=useState(0);
  const [selDay,setSelDay]=useState(todayIdx);
  const [tab,setTab]=useState("tasks");
  const [sparkles,setSparkles]=useState([]);
  const [celebrate,setCelebrate]=useState(null);
  const [showIncident,setShowIncident]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [prevDayFull,setPrevDayFull]=useState(false);

  const [appData,setAppData]=useState(()=>{
    try{const s=localStorage.getItem('kindee_v1');if(s){const d=JSON.parse(s);if(d.appData&&Object.keys(d.appData).length>0)return d.appData;}}catch(e){}
    const d={};config.kids.forEach(k=>{d[k.name]={days:{},redeemed:[],incidents:[]};DAYS_LABEL[lang].forEach((_,i)=>{d[k.name].days[i]={tasks:{},incidents:0};k.tasks.forEach(t=>{d[k.name].days[i].tasks[t.id]=t.type==="counter"?0:false;});});});return d;
  });

  const L=(id,en)=>lang==="id"?id:en;

  useEffect(()=>{
    try{localStorage.setItem('kindee_v1',JSON.stringify({lang,kids:kidsConfig,rewards:rewardsConfig,appData}));}catch(e){}
  },[kidsConfig,rewardsConfig,appData]);

  const kidIdx=Math.min(activeKid,kidsConfig.length-1);
  const kid=kidsConfig[kidIdx];
  const kc=KID_COLORS[kid.colorIdx];
  const kd=appData[kid.name]||{days:Object.fromEntries(DAYS.map((_,i)=>[i,{tasks:{},incidents:0}])),redeemed:[],incidents:[]};

  function calcPts(kidName,kidObj){
    if(!appData[kidName])return{earned:0,spent:0,balance:0};
    const d=appData[kidName];let earned=0;
    DAYS.forEach((_,i)=>{const day=d.days[i];if(!day)return;let pts=0,done=0;kidObj.tasks.forEach(t=>{const v=day.tasks[t.id];if(t.type==="counter"){pts+=(v||0);if((v||0)>0)done++;}else{pts+=v?1:0;if(v)done++;}});earned+=pts;if(done===kidObj.tasks.length&&kidObj.tasks.length>0)earned+=BONUS;earned-=(day.incidents||0)*kidObj.incidentCost;});
    const spent=d.redeemed.reduce((a,r)=>a+r.cost,0);
    return{earned:Math.max(0,earned),spent,balance:Math.max(0,earned-spent)};
  }

  const {earned,spent,balance}=calcPts(kid.name,kid);
  const redeemableCount=rewardsConfig.filter(r=>balance>=r.cost).length;
  const dayTasks=kd.days[selDay]?.tasks||{};
  const dayDone=kid.tasks.filter(t=>t.type==="counter"?(dayTasks[t.id]||0)>0:!!dayTasks[t.id]).length;
  const dayFull=dayDone===kid.tasks.length&&kid.tasks.length>0;
  const dayInc=kd.days[selDay]?.incidents||0;

  if(dayFull&&!prevDayFull){setPrevDayFull(true);sfx('complete');}
  if(!dayFull&&prevDayFull){setPrevDayFull(false);}

  function addSparkle(e){const r=e.currentTarget.getBoundingClientRect();const id=Date.now()+Math.random();setSparkles(p=>[...p,{id,x:r.left+r.width/2,y:r.top}]);setTimeout(()=>setSparkles(p=>p.filter(s=>s.id!==id)),900);}
  function updateDay(patch){setAppData(p=>({...p,[kid.name]:{...p[kid.name],days:{...p[kid.name].days,[selDay]:{...p[kid.name].days[selDay],...patch}}}}));}
  function toggleTask(tid,e){const was=kd.days[selDay].tasks[tid];updateDay({tasks:{...dayTasks,[tid]:!was}});if(!was){addSparkle(e);sfx('check');}else sfx('undo');}
  function incrementCounter(tid,e){updateDay({tasks:{...dayTasks,[tid]:(dayTasks[tid]||0)+1}});addSparkle(e);sfx('counter');}
  function decrementCounter(tid){const cur=dayTasks[tid]||0;if(cur===0)return;updateDay({tasks:{...dayTasks,[tid]:cur-1}});sfx('undo');}
  function addIncident(){setShowIncident(false);sfx('incident');const time=new Date().toLocaleTimeString(lang==="id"?"id-ID":"en-US",{hour:"2-digit",minute:"2-digit"});setAppData(p=>({...p,[kid.name]:{...p[kid.name],days:{...p[kid.name].days,[selDay]:{...p[kid.name].days[selDay],incidents:(p[kid.name].days[selDay].incidents||0)+1}},incidents:[...p[kid.name].incidents,{day:selDay,time}]}}));}
  function redeem(rw){if(balance<rw.cost)return;sfx('redeem');setAppData(p=>({...p,[kid.name]:{...p[kid.name],redeemed:[...p[kid.name].redeemed,{...rw,at:new Date().toLocaleDateString(lang==="id"?"id-ID":"en-US")}]}}));setCelebrate(rw);setTimeout(()=>setCelebrate(null),3000);}

  return (
    <div style={{minHeight:"100vh",background:B.cream}}>
      <GS/>

      {sparkles.map(s=>(
        <div key={s.id} style={{position:"fixed",left:s.x-10,top:s.y,fontSize:22,pointerEvents:"none",animation:"sparkle .8s ease-out forwards",zIndex:9999}}>⭐</div>
      ))}

      {celebrate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(30,43,77,0.5)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:28,padding:"32px 36px",textAlign:"center",animation:"popIn .4s ease",maxWidth:300}}>
            <div style={{fontSize:64}}>{celebrate.emoji}</div>
            <div className="fredoka" style={{fontSize:24,color:celebrate.color,marginTop:12}}>{L("Reward Ditukar!","Reward Redeemed!")}</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:8,color:B.midnight}}>{celebrate.label}</div>
            <div style={{marginTop:14,background:B.cream,borderRadius:14,padding:"10px",fontWeight:700,color:celebrate.color,fontFamily:"'Fredoka',sans-serif",fontSize:20}}>-{celebrate.cost} {L("poin","pts")}</div>
          </div>
        </div>
      )}

      {showIncident&&(
        <div style={{position:"fixed",inset:0,background:"rgba(30,43,77,0.5)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:28,padding:"28px 24px",maxWidth:320,width:"100%",animation:"popIn .3s ease"}}>
            <div style={{fontSize:52,textAlign:"center"}}>😤</div>
            <div className="fredoka" style={{fontSize:22,fontWeight:700,textAlign:"center",marginTop:12,color:B.midnight}}>{L("Catat Insiden?","Record Incident?")}</div>
            <div style={{fontSize:14,color:"#888",textAlign:"center",marginTop:8,lineHeight:1.6}}>
              → <span style={{color:"#EF4444",fontWeight:700}}>-{kid.incidentCost} {L("poin","pts")}</span>
              <br/><span style={{fontSize:12,color:"#CCC"}}>{L("Kasih waktu 5 menit dulu ✋","Give 5 minutes grace first ✋")}</span>
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button className="tap" onClick={()=>setShowIncident(false)} style={{flex:1,padding:"13px",borderRadius:100,background:"#F0F0F0",fontWeight:700,fontSize:15,color:"#555"}}>{L("Batal","Cancel")}</button>
              <button className="tap" onClick={addIncident} style={{flex:1,padding:"13px",borderRadius:100,background:"#EF4444",fontWeight:700,fontSize:15,color:"white"}}>{L("Catat","Record")}</button>
            </div>
          </div>
        </div>
      )}

      {showSettings&&<Settings lang={lang} kidsConfig={kidsConfig} setKidsConfig={setKidsConfig} rewardsConfig={rewardsConfig} setRewardsConfig={setRewardsConfig} appData={appData} setAppData={setAppData} onReset={onReset} onClose={()=>setShowSettings(false)}/>}

      {/* Header */}
      <div style={{background:kc.color,padding:"env(safe-area-inset-top,24px) 18px 0",paddingTop:"max(env(safe-area-inset-top),24px)",transition:"background .4s"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:4}}>
            <div>
              <p style={{color:"rgba(255,255,255,0.7)",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Kindee ⭐</p>
              <h1 className="fredoka" style={{color:"white",fontSize:26,marginTop:1}}>{L("Halo ","Hello ")}{kid.avatar} {kid.name}!</h1>
            </div>
            <button className="tap" onClick={()=>setShowSettings(true)}
              style={{fontSize:12,color:"rgba(255,255,255,0.9)",fontWeight:700,padding:"8px 14px",borderRadius:100,background:"rgba(255,255,255,0.2)",backdropFilter:"blur(4px)"}}>
              ⚙️ {L("Setting","Settings")}
            </button>
          </div>
          {/* Kid tabs */}
          <div style={{display:"flex",gap:8,marginTop:16,overflowX:"auto",paddingBottom:2}}>
            {kidsConfig.map((k,i)=>(
              <button key={i} className="tap" onClick={()=>setActiveKid(i)}
                style={{flexShrink:0,padding:"10px 16px",borderRadius:"14px 14px 0 0",background:kidIdx===i?"white":"rgba(255,255,255,0.2)",color:kidIdx===i?KID_COLORS[k.colorIdx].color:"white",fontWeight:700,fontSize:15,fontFamily:"'Fredoka',sans-serif",whiteSpace:"nowrap",transition:"all .2s"}}>
                {k.avatar} {k.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"16px 18px 70px",animation:"fadeIn .25s ease"}}>

        {/* Points summary */}
        <div style={{background:"white",borderRadius:22,padding:18,boxShadow:"0 4px 20px rgba(30,43,77,0.09)",display:"flex",gap:10}}>
          {[[balance,L("Saldo","Balance"),true],[earned,L("Didapat","Earned"),false],[spent,L("Ditukar","Spent"),false]].map(([val,label,bold],i)=>(
            <div key={i} style={{flex:1,textAlign:"center",padding:"10px 6px",borderRadius:16,background:bold?kc.light:"#FAFAFA"}}>
              <div style={{fontSize:10,color:"#AAA",fontWeight:700,textTransform:"uppercase",letterSpacing:.8}}>{label}</div>
              <div className="fredoka" style={{fontSize:bold?32:22,color:bold?kc.color:B.midnight,marginTop:3,lineHeight:1}}>{val}</div>
              <div style={{fontSize:10,color:"#CCC",marginTop:2}}>{L("poin","pts")}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginTop:14,background:"#EEE",borderRadius:18,padding:4}}>
          {[["tasks",L("✅ Tugas","✅ Tasks"),0],["rewards",L("🎁 Reward","🎁 Rewards"),redeemableCount],["log",L("📋 Log","📋 Log"),0]].map(([t,label,badge])=>(
            <button key={t} className="tap" onClick={()=>setTab(t)}
              style={{flex:1,padding:"10px 4px",borderRadius:14,background:tab===t?"white":"transparent",color:tab===t?kc.color:"#999",fontWeight:700,fontSize:13,fontFamily:"'Fredoka',sans-serif",boxShadow:tab===t?"0 2px 8px rgba(0,0,0,0.1)":"none",position:"relative",transition:"all .2s"}}>
              {label}
              {badge>0&&<span style={{position:"absolute",top:1,right:3,width:18,height:18,borderRadius:50,background:"#EF4444",color:"white",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",animation:"badgePop .4s ease"}}>{badge}</span>}
            </button>
          ))}
        </div>

        {/* ── TASKS ── */}
        {tab==="tasks"&&(
          <div style={{marginTop:16}}>
            {/* Day picker */}
            <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:4}}>
              {DAYS.map((d,i)=>{
                const dd=appData[kid.name]?.days[i];
                const dc=dd?kid.tasks.filter(t=>t.type==="counter"?(dd.tasks[t.id]||0)>0:!!dd.tasks[t.id]).length:0;
                const full=dc===kid.tasks.length&&kid.tasks.length>0;
                return(
                  <button key={i} className="tap" onClick={()=>setSelDay(i)}
                    style={{minWidth:50,padding:"9px 4px",borderRadius:14,flex:"0 0 auto",background:selDay===i?kc.color:full?kc.light:"white",color:selDay===i?"white":full?kc.color:B.midnight,fontWeight:700,fontSize:12,border:selDay===i?"none":full?`2px solid ${kc.color}44`:"2px solid #EEE",boxShadow:selDay===i?`0 4px 14px ${kc.color}55`:"0 1px 4px rgba(0,0,0,0.05)",transition:"all .2s",fontFamily:"'Fredoka',sans-serif"}}>
                    <div>{d}</div><div style={{fontSize:16,marginTop:2}}>{full?"🌟":dc>0?"⭐":"○"}</div>
                  </button>
                );
              })}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
              <span style={{fontSize:13,color:"#AAA",fontWeight:600}}>{L("Hari ini:","Today:")} <span style={{color:B.midnight,fontWeight:700}}>{dayDone}/{kid.tasks.length}</span> {L("tugas","tasks")}</span>
              {dayFull&&<span style={{fontSize:12,fontWeight:700,color:kc.color,background:kc.light,padding:"4px 10px",borderRadius:100}}>+{BONUS} {L("bonus! 🌟","bonus! 🌟")}</span>}
            </div>
            <div style={{background:"#EEE",borderRadius:100,height:8,marginTop:8,overflow:"hidden"}}>
              <div style={{width:`${kid.tasks.length?(dayDone/kid.tasks.length)*100:0}%`,height:"100%",background:kc.color,borderRadius:100,transition:"width .4s"}}/>
            </div>

            {/* Task list */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
              {kid.tasks.map(task=>{
                const val=dayTasks[task.id];
                const done=task.type==="counter"?(val||0)>0:!!val;
                if(task.type==="counter")return(
                  <div key={task.id} style={{background:done?kc.light:"white",border:done?`2px solid ${kc.color}44`:"2px solid #EEE",borderRadius:18,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(30,43,77,0.06)"}}>
                    <span style={{fontSize:24}}>{task.emoji}</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:15,fontWeight:700,color:done?kc.color:B.midnight}}>{task.label}</span>
                      {(val||0)>0&&<span style={{fontSize:12,color:kc.color,fontWeight:700,marginLeft:8,background:kc.light,padding:"2px 8px",borderRadius:100}}>+{val} ⭐</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button className="tap" onClick={()=>decrementCounter(task.id)} style={{width:34,height:34,borderRadius:50,background:(val||0)>0?"#FEE2E2":"#F0F0F0",color:(val||0)>0?"#EF4444":"#CCC",fontWeight:700,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span className="fredoka" style={{fontSize:24,color:done?kc.color:"#CCC",minWidth:30,textAlign:"center"}}>{val||0}</span>
                      <button className="tap" onClick={e=>incrementCounter(task.id,e)} style={{width:34,height:34,borderRadius:50,background:kc.color,color:"white",fontWeight:700,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 10px ${kc.color}55`}}>+</button>
                    </div>
                  </div>
                );
                return(
                  <button key={task.id} className="tap" onClick={e=>toggleTask(task.id,e)}
                    style={{background:done?kc.light:"white",border:done?`2px solid ${kc.color}44`:"2px solid #EEE",borderRadius:18,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(30,43,77,0.06)",width:"100%",textAlign:"left",transition:"all .15s"}}>
                    <span style={{fontSize:24}}>{task.emoji}</span>
                    <span style={{flex:1,fontSize:15,fontWeight:700,color:done?kc.color:B.midnight,textDecoration:done?"line-through":"none",opacity:done?.7:1}}>{task.label}</span>
                    <span style={{width:30,height:30,borderRadius:50,background:done?kc.color:"#F0F0F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,transition:"all .2s"}}>{done?"⭐":""}</span>
                  </button>
                );
              })}
            </div>

            {/* Incident */}
            <div style={{marginTop:16,background:"white",borderRadius:18,padding:16,border:"2px solid #FFE0E0",boxShadow:"0 2px 8px rgba(30,43,77,0.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontWeight:700,fontSize:15,color:B.midnight}}>😤 {L("Insiden","Incident")}</p>
                  <p style={{fontSize:12,color:"#AAA",marginTop:2}}>{L("Hari ini","Today")}: {dayInc}× → -{dayInc*kid.incidentCost} {L("poin","pts")}</p>
                </div>
                <button className="tap" onClick={()=>setShowIncident(true)} style={{background:"#FEE2E2",color:"#EF4444",fontWeight:700,fontSize:13,padding:"8px 16px",borderRadius:100}}>
                  + {L("Catat","Record")}
                </button>
              </div>
              <p style={{fontSize:11,color:"#DDD",marginTop:8,fontStyle:"italic"}}>{L("Kasih waktu 5 menit dulu ✋","Give 5 minutes grace first ✋")}</p>
            </div>

            {dayFull&&(
              <div style={{marginTop:14,background:`linear-gradient(135deg,${kc.color},${kc.accent})`,borderRadius:18,padding:"16px",textAlign:"center",animation:"fadeIn .3s ease",boxShadow:`0 6px 24px ${kc.color}44`}}>
                <p className="fredoka" style={{color:"white",fontSize:22}}>🌟 {L("Semua selesai hari ini!","All done today!")}</p>
                <p style={{color:"rgba(255,255,255,0.85)",fontSize:14,marginTop:4,fontWeight:600}}>+{BONUS} {L("poin bonus!","bonus pts!")}</p>
              </div>
            )}
          </div>
        )}

        {/* ── REWARDS ── */}
        {tab==="rewards"&&(
          <div style={{marginTop:16}}>
            <p style={{fontSize:13,color:"#AAA",fontWeight:600,marginBottom:14}}>{L("Saldo","Balance")}: <span className="fredoka" style={{color:kc.color,fontSize:18}}>{balance} {L("poin","pts")}</span></p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {rewardsConfig.map(rw=>{
                const can=balance>=rw.cost,prog=Math.min(balance/rw.cost,1);
                return(
                  <div key={rw.id} style={{background:"white",borderRadius:22,padding:18,boxShadow:"0 4px 16px rgba(30,43,77,0.08)",border:can?`2px solid ${rw.color}55`:"2px solid #EEE",transition:"all .2s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:34}}>{rw.emoji}</span>
                      <div style={{flex:1}}><p className="fredoka" style={{fontWeight:600,fontSize:18,color:B.midnight}}>{rw.label}</p>{rw.sublabel&&<p style={{fontSize:12,color:"#AAA",marginTop:1}}>{rw.sublabel}</p>}</div>
                      <div style={{textAlign:"right"}}><p className="fredoka" style={{fontSize:26,color:rw.color,lineHeight:1}}>{rw.cost}</p><p style={{fontSize:11,color:"#AAA"}}>{L("poin","pts")}</p></div>
                    </div>
                    <div style={{marginTop:14}}>
                      <div style={{background:"#F0F0F0",borderRadius:100,height:8,overflow:"hidden"}}>
                        <div style={{width:`${prog*100}%`,height:"100%",background:can?rw.color:`${rw.color}66`,borderRadius:100,transition:"width .4s"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                        <span style={{fontSize:12,color:can?rw.color:"#AAA",fontWeight:700}}>{can?L("✅ Bisa ditukar!","✅ Can redeem!"):`${rw.cost-balance} ${L("poin lagi →","pts to go →")}`}</span>
                        <span style={{fontSize:12,color:"#AAA"}}>{balance}/{rw.cost}</span>
                      </div>
                    </div>
                    {can&&(
                      <button className="tap" onClick={()=>redeem(rw)}
                        style={{marginTop:14,width:"100%",background:rw.color,color:"white",fontWeight:700,fontSize:16,padding:"13px",borderRadius:100,fontFamily:"'Fredoka',sans-serif",boxShadow:`0 6px 18px ${rw.color}55`,letterSpacing:.5}}>
                        {L("Tukar Sekarang 🎉","Redeem Now 🎉")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LOG ── */}
        {tab==="log"&&(
          <div style={{marginTop:16}}>
            <p style={{fontSize:11,fontWeight:700,color:"#AAA",textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>{L("REWARD DITUKAR","REDEEMED")}</p>
            {(kd.redeemed||[]).length===0
              ?<div style={{background:"white",borderRadius:18,padding:20,textAlign:"center",color:"#CCC",fontFamily:"'Fredoka',sans-serif",fontSize:16}}>{L("Belum ada","None yet")} 🎁</div>
              :(kd.redeemed||[]).map((r,i)=>(
                <div key={i} style={{background:"white",borderRadius:16,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:8,boxShadow:"0 2px 8px rgba(30,43,77,0.06)"}}>
                  <span style={{fontSize:24}}>{r.emoji}</span>
                  <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14,color:B.midnight}}>{r.label}</p><p style={{fontSize:11,color:"#AAA"}}>{r.at}</p></div>
                  <span style={{fontWeight:700,color:"#EF4444",fontSize:14,fontFamily:"'Fredoka',sans-serif"}}>-{r.cost}</span>
                </div>
              ))
            }
            <p style={{fontSize:11,fontWeight:700,color:"#AAA",textTransform:"uppercase",letterSpacing:1.2,marginTop:20,marginBottom:10}}>{L("LOG INSIDEN","INCIDENT LOG")} 😤</p>
            {(kd.incidents||[]).length===0
              ?<div style={{background:"white",borderRadius:18,padding:20,textAlign:"center",color:"#CCC",fontFamily:"'Fredoka',sans-serif",fontSize:16}}>{L("Belum ada","None yet")} 🎉</div>
              :(kd.incidents||[]).map((inc,i)=>(
                <div key={i} style={{background:"white",borderRadius:16,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:8,boxShadow:"0 2px 8px rgba(30,43,77,0.06)"}}>
                  <span style={{fontSize:22}}>😤</span>
                  <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14,color:B.midnight}}>{L("Insiden","Incident")}</p><p style={{fontSize:11,color:"#AAA"}}>{DAYS[inc.day]}, {inc.time}</p></div>
                  <span style={{fontWeight:700,color:"#EF4444",fontSize:14,fontFamily:"'Fredoka',sans-serif"}}>-{kid.incidentCost}</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────
export default function Root() {
  const [screen,setScreen] = useState("loading");
  const [config,setConfig] = useState(null);

  useEffect(()=>{
    try{
      const s=localStorage.getItem('kindee_v1');
      if(s){const d=JSON.parse(s);if(d.lang&&d.kids&&d.rewards){setConfig({lang:d.lang,kids:d.kids,rewards:d.rewards});setScreen("app");return;}}
    }catch(e){}
    setScreen("onboarding");
  },[]);

  function handleOnboardingDone(){setScreen("setup");}
  function handleSetupDone(cfg){
    setConfig(cfg);
    try{localStorage.setItem('kindee_v1',JSON.stringify({...cfg,appData:{}}));}catch(e){}
    setScreen("app");
  }
  function handleReset(){
    try{localStorage.removeItem('kindee_v1');}catch(e){}
    setConfig(null);setScreen("onboarding");
  }

  if(screen==="loading")return(
    <div style={{minHeight:"100vh",background:B.midnight,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <GS/>
      <div style={{textAlign:"center",animation:"fadeIn .5s ease"}}>
        <img src="/kindee_star.png" alt="Kindee" style={{width:120,height:120,objectFit:"contain",animation:"float 2s ease-in-out infinite",filter:"drop-shadow(0 8px 32px rgba(255,200,64,0.4))"}}/>
        <div className="fredoka" style={{color:B.sunshine,fontSize:36,marginTop:12}}>Kindee</div>
      </div>
    </div>
  );
  if(screen==="onboarding")return <Onboarding onDone={handleOnboardingDone}/>;
  if(screen==="setup")return <Setup onDone={handleSetupDone}/>;
  if(screen==="app"&&config)return <App config={config} onReset={handleReset}/>;
  return <Onboarding onDone={handleOnboardingDone}/>;
}

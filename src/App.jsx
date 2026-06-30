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

// ── CONSTANTS ──────────────────────────────────────────────────
const KID_COLORS = [
  {color:"#FF6B6B",accent:"#FF8E53",light:"#FFF0F0"},
  {color:"#A78BFA",accent:"#7C3AED",light:"#F5F0FF"},
  {color:"#3B82F6",accent:"#2563EB",light:"#EFF6FF"},
  {color:"#10B981",accent:"#059669",light:"#ECFDF5"},
];
const KID_AVATARS = ["🦁","🐣","🐻","🐱","🦄","🐸","🐬","🦊","🐧","🐨","🦋","🐙"];
const REWARD_COLORS = ["#3B82F6","#F59E0B","#10B981","#EC4899","#8B5CF6","#EF4444","#F97316"];
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
    {id:"r1",emoji:"📱",label:"Main HP",sublabel:"Weekend, 30 menit",cost:30,color:"#3B82F6"},
    {id:"r2",emoji:"🍡",label:"Jajan",sublabel:"Pilih sendiri",cost:60,color:"#F59E0B"},
    {id:"r3",emoji:"📚",label:"Beli Buku",sublabel:"Buku apa aja",cost:80,color:"#10B981"},
    {id:"r4",emoji:"🎁",label:"Beli Mainan",sublabel:"Nabung dulu!",cost:350,color:"#EC4899"},
  ],
  en:[
    {id:"r1",emoji:"📱",label:"Screen Time",sublabel:"Weekends, 30 mins",cost:30,color:"#3B82F6"},
    {id:"r2",emoji:"🍡",label:"Snack Treat",sublabel:"Your choice!",cost:60,color:"#F59E0B"},
    {id:"r3",emoji:"📚",label:"Buy a Book",sublabel:"Any book",cost:80,color:"#10B981"},
    {id:"r4",emoji:"🎁",label:"Buy a Toy",sublabel:"Save up first!",cost:350,color:"#EC4899"},
  ],
};
const DAYS_LABEL = {
  id:["Sen","Sel","Rab","Kam","Jum","Sab","Min"],
  en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
};
const BONUS = 3;

// ── GLOBAL STYLE ───────────────────────────────────────────────
const GS = () => <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body,input,button{font-family:'Nunito',sans-serif;}
  .tap{cursor:pointer;border:none;background:none;transition:transform .12s;}.tap:active{transform:scale(.96);}
  input:focus{outline:none;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{transform:scale(.8);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
  @keyframes sparkle{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-60px) scale(.2);opacity:0}}
  @keyframes badgePop{0%{transform:scale(.4)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
`}</style>;

// ── TASK EDITOR (reusable in Setup + Settings) ─────────────────
function TaskEditor({tasks, onToggle, onRemove, onMove, onAdd, color, light, lang}) {
  const [newTask, setNewTask] = useState("");
  const L=(id,en)=>lang==="id"?id:en;
  function doAdd() {
    if (!newTask.trim()) return;
    onAdd(newTask.trim());
    setNewTask("");
  }
  return (
    <div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {tasks.map((t,ti)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:12,background:t.on!==false?light:"#F9F9F9",border:`1.5px solid ${t.on!==false?color+"44":"#EEE"}`}}>
            {onToggle && (
              <button className="tap" onClick={()=>onToggle(t.id)}
                style={{width:26,height:26,borderRadius:50,background:t.on!==false?color:"#DDD",color:"white",fontWeight:900,fontSize:13,flexShrink:0}}>
                {t.on!==false?"✓":""}
              </button>
            )}
            <span style={{fontSize:16}}>{t.emoji}</span>
            <span style={{flex:1,fontWeight:700,fontSize:13,color:t.on!==false?"#333":"#BBB"}}>{t.label}</span>
            {t.type==="counter"&&<span style={{fontSize:10,color,fontWeight:700,background:light,padding:"2px 6px",borderRadius:20}}>+N</span>}
            <div style={{display:"flex",gap:3,flexShrink:0}}>
              <button className="tap" onClick={()=>onMove(t.id,-1)} disabled={ti===0} style={{color:ti===0?"#DDD":"#AAA",fontSize:14,fontWeight:900,padding:"2px"}}>↑</button>
              <button className="tap" onClick={()=>onMove(t.id,1)} disabled={ti===tasks.length-1} style={{color:ti===tasks.length-1?"#DDD":"#AAA",fontSize:14,fontWeight:900,padding:"2px"}}>↓</button>
              <button className="tap" onClick={()=>onRemove(t.id)} style={{color:"#CCC",fontSize:18,fontWeight:900,padding:"2px"}}>×</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <input value={newTask} onChange={e=>setNewTask(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&doAdd()}
          placeholder={L("Tambah tugas...","Add a task...")}
          style={{flex:1,padding:"10px 14px",borderRadius:12,border:"2px solid #F0F0F0",fontSize:13,fontWeight:600}}/>
        <button className="tap" onClick={doAdd}
          style={{padding:"10px 14px",borderRadius:12,background:color,color:"white",fontWeight:800,fontSize:13}}>
          + {L("Tambah","Add")}
        </button>
      </div>
    </div>
  );
}

// ── SETUP WIZARD ───────────────────────────────────────────────
function Setup({onDone}) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("id");
  const [numKids, setNumKids] = useState(2);
  const [kids, setKids] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [newRw, setNewRw] = useState({emoji:"🏆",label:"",cost:""});

  const L=(id,en)=>lang==="id"?id:en;

  const initKid=(i,l)=>({
    name:"", avatar:KID_AVATARS[i%KID_AVATARS.length], colorIdx:i%KID_COLORS.length,
    incidentCost:i===0?3:2,
    tasks:DEFAULT_TASKS[l].map((t,ti)=>({...t,id:ti+1,on:true})),
  });

  const numSteps = 2+numKids+1;
  const isKidStep = step>=2&&step<2+numKids;
  const isRewardStep = step===2+numKids;
  const ki = isKidStep?step-2:0;
  const kid = kids[ki];
  const kc = kid?KID_COLORS[kid.colorIdx]:KID_COLORS[0];

  function next() {
    if(step===0) setStep(1);
    else if(step===1){
      setKids(Array.from({length:Math.max(1,numKids)},(_,i)=>initKid(i,lang)));
      setStep(2);
    } else if(isKidStep){
      if(step===1+numKids) setRewards(DEFAULT_REWARDS[lang]);
      setStep(s=>s+1);
    } else if(isRewardStep){
      onDone({lang, kids:kids.map(k=>({...k,tasks:k.tasks.filter(t=>t.on)})), rewards});
    }
  }

  function updKid(patch){setKids(p=>p.map((k,i)=>i===ki?{...k,...patch}:k));}
  function toggleTask(tid){setKids(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:k.tasks.map(t=>t.id===tid?{...t,on:!t.on}:t)}));}
  function removeTask(tid){setKids(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:k.tasks.filter(t=>t.id!==tid)}));}
  function moveTask(tid,dir){
    setKids(p=>p.map((k,i)=>{
      if(i!==ki)return k;
      const ts=[...k.tasks],idx=ts.findIndex(t=>t.id===tid),ni=idx+dir;
      if(ni<0||ni>=ts.length)return k;
      [ts[idx],ts[ni]]=[ts[ni],ts[idx]];
      return{...k,tasks:ts};
    }));
  }
  function addTask(label){
    setKids(p=>p.map((k,i)=>i!==ki?k:{...k,tasks:[...k.tasks,{id:Date.now(),emoji:"✅",label,on:true}]}));
  }
  function updRw(id,patch){setRewards(p=>p.map(r=>r.id===id?{...r,...patch}:r));}
  function removeRw(id){setRewards(p=>p.filter(r=>r.id!==id));}
  function addRw(){
    if(!newRw.label.trim()||!newRw.cost)return;
    setRewards(p=>[...p,{id:"r"+Date.now(),emoji:newRw.emoji,label:newRw.label,sublabel:"",cost:parseInt(newRw.cost),color:REWARD_COLORS[p.length%REWARD_COLORS.length]}]);
    setNewRw({emoji:"🏆",label:"",cost:""});
  }

  return (
    <div style={{minHeight:"100vh",background:"#F7F7FA",display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 16px 80px"}}>
      <GS/>

      {/* Back + progress bar */}
      {step>0&&(
        <div style={{width:"100%",maxWidth:440,display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button className="tap" onClick={()=>setStep(s=>Math.max(0,s-1))}
            style={{width:38,height:38,borderRadius:50,background:"white",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",fontWeight:900,fontSize:18,color:"#666",flexShrink:0}}>←</button>
          <div style={{flex:1,display:"flex",gap:4}}>
            {Array.from({length:numSteps}).map((_,i)=>(
              <div key={i} style={{flex:1,height:6,borderRadius:100,background:i<=step?kc.color:"#E0E0E0",transition:"all .3s"}}/>
            ))}
          </div>
        </div>
      )}

      <div style={{width:"100%",maxWidth:440,animation:"fadeIn .3s ease"}}>

        {/* STEP 0 — Language */}
        {step===0&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:72,marginBottom:12}}>⭐</div>
            <h1 style={{fontSize:30,fontWeight:900,color:"#333"}}>Reward Chart</h1>
            <p style={{color:"#AAA",fontSize:15,marginTop:6,marginBottom:32}}>for kids · untuk anak</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:28}}>
              {[["id","🇮🇩","Indonesia"],["en","🇬🇧","English"]].map(([l,flag,name])=>(
                <button key={l} className="tap" onClick={()=>setLang(l)}
                  style={{flex:1,maxWidth:170,padding:"22px 16px",borderRadius:22,background:lang===l?"#A78BFA":"white",color:lang===l?"white":"#555",fontWeight:800,fontSize:17,boxShadow:lang===l?"0 4px 18px #A78BFA55":"0 2px 8px rgba(0,0,0,0.08)",border:lang===l?"none":"2px solid #F0F0F0"}}>
                  <div style={{fontSize:40}}>{flag}</div><div style={{marginTop:10}}>{name}</div>
                </button>
              ))}
            </div>
            <button className="tap" onClick={next}
              style={{width:"100%",padding:"16px",borderRadius:16,background:"#A78BFA",color:"white",fontWeight:900,fontSize:18,boxShadow:"0 4px 18px #A78BFA55"}}>
              {L("Mulai Setup! 🚀","Start Setup! 🚀")}
            </button>
          </div>
        )}

        {/* STEP 1 — Num Kids */}
        {step===1&&(
          <div>
            <h2 style={{fontSize:24,fontWeight:900,color:"#333",marginBottom:6}}>{L("Ada berapa anak?","How many kids?")}</h2>
            <p style={{color:"#AAA",fontSize:13,marginBottom:24}}>{L("Bisa diubah di Settings nanti","Can be changed in Settings later")}</p>
            <div style={{background:"white",borderRadius:22,padding:"28px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",gap:24,marginBottom:28}}>
              <button className="tap" onClick={()=>setNumKids(n=>Math.max(1,n-1))}
                style={{width:52,height:52,borderRadius:50,background:"#F0F0F0",fontWeight:900,fontSize:26,color:"#555",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:64,fontWeight:900,color:"#FF6B6B",lineHeight:1}}>{numKids}</div>
                <div style={{fontSize:15,color:"#AAA",fontWeight:700,marginTop:6}}>{L(`${numKids} anak`,`${numKids} kid${numKids>1?"s":""}`)}</div>
              </div>
              <button className="tap" onClick={()=>setNumKids(n=>n+1)}
                style={{width:52,height:52,borderRadius:50,background:"#FF6B6B",fontWeight:900,fontSize:26,color:"white",boxShadow:"0 3px 12px #FF6B6B55",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
            <button className="tap" onClick={next}
              style={{width:"100%",padding:"16px",borderRadius:16,background:"#FF6B6B",color:"white",fontWeight:900,fontSize:18,boxShadow:"0 4px 16px #FF6B6B55"}}>
              {L("Lanjut →","Next →")}
            </button>
          </div>
        )}

        {/* STEP 2+i — Per Kid */}
        {isKidStep&&kid&&(
          <div>
            <h2 style={{fontSize:22,fontWeight:900,color:"#333",marginBottom:4}}>{L(`Setup Anak ${ki+1}`,`Set up Child ${ki+1}`)}</h2>
            <p style={{color:"#AAA",fontSize:13,marginBottom:18}}>{L("Sesuaikan untuk anakmu ✨","Personalize for your child ✨")}</p>

            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1}}>{L(`Nama Anak ${ki+1}`,`Child ${ki+1} Name`)}</label>
              <input value={kid.name} onChange={e=>updKid({name:e.target.value})} placeholder={L("Nama anak...","Child's name...")}
                style={{display:"block",width:"100%",marginTop:8,padding:"10px 0",fontSize:22,fontWeight:900,color:"#333",border:"none",borderBottom:"2px solid #F0F0F0",background:"transparent"}}/>
            </div>

            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1}}>{L("Avatar & Warna","Avatar & Color")}</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>
                {KID_AVATARS.map(av=>(
                  <button key={av} className="tap" onClick={()=>updKid({avatar:av})}
                    style={{width:42,height:42,borderRadius:12,fontSize:22,background:kid.avatar===av?kc.light:"#F7F7FA",border:`2px solid ${kid.avatar===av?kc.color:"transparent"}`}}>{av}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:14,marginTop:14}}>
                {KID_COLORS.map((c,i)=>(
                  <button key={i} className="tap" onClick={()=>updKid({colorIdx:i})}
                    style={{width:40,height:40,borderRadius:50,background:c.color,border:kid.colorIdx===i?"3px solid #333":"3px solid transparent",boxShadow:kid.colorIdx===i?`0 0 0 2px white,0 0 0 4px ${c.color}`:"none"}}/>
                ))}
              </div>
            </div>

            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:12}}>{L("Tugas Harian","Daily Tasks")}</label>
              <TaskEditor tasks={kid.tasks} onToggle={toggleTask} onRemove={removeTask} onMove={moveTask} onAdd={addTask} color={kc.color} light={kc.light} lang={lang}/>
            </div>

            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1}}>{L("Pengurangan poin per insiden","Points deducted per incident")}</label>
              <div style={{display:"flex",gap:10,marginTop:12}}>
                {[1,2,3,5].map(n=>(
                  <button key={n} className="tap" onClick={()=>updKid({incidentCost:n})}
                    style={{flex:1,padding:"12px 4px",borderRadius:14,background:kid.incidentCost===n?"#FEE2E2":"#F7F7FA",color:kid.incidentCost===n?"#EF4444":"#999",fontWeight:900,fontSize:16,border:kid.incidentCost===n?"2px solid #FECACA":"2px solid transparent"}}>
                    -{n}
                  </button>
                ))}
              </div>
            </div>

            <button className="tap" onClick={next} disabled={!kid.name.trim()}
              style={{width:"100%",padding:"16px",borderRadius:16,background:kid.name.trim()?kc.color:"#DDD",color:"white",fontWeight:900,fontSize:18,boxShadow:kid.name.trim()?`0 4px 16px ${kc.color}55`:"none"}}>
              {L("Lanjut →","Next →")}
            </button>
            {!kid.name.trim()&&<p style={{textAlign:"center",color:"#CCC",fontSize:13,marginTop:10,fontWeight:600}}>{L("Isi nama dulu ya 😊","Please enter a name 😊")}</p>}
          </div>
        )}

        {/* REWARDS STEP */}
        {isRewardStep&&(
          <div>
            <h2 style={{fontSize:22,fontWeight:900,color:"#333",marginBottom:4}}>{L("Setup Reward 🎁","Set Up Rewards 🎁")}</h2>
            <p style={{color:"#AAA",fontSize:13,marginBottom:20}}>{L("Edit nama & poin, atau tambah baru","Edit names & points, or add new ones")}</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {rewards.map(r=>(
                <div key={r.id} style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",border:`2px solid ${r.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:26}}>{r.emoji}</span>
                    <input value={r.label} onChange={e=>updRw(r.id,{label:e.target.value})}
                      style={{flex:1,fontWeight:800,fontSize:16,border:"none",borderBottom:"2px solid #F0F0F0",padding:"4px 0",background:"transparent",color:"#333"}}/>
                    <button className="tap" onClick={()=>removeRw(r.id)} style={{color:"#DDD",fontSize:22,fontWeight:900}}>×</button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
                    <span style={{fontSize:12,color:"#BBB",fontWeight:700}}>{L("Poin:","Points:")}</span>
                    <input type="number" value={r.cost} onChange={e=>updRw(r.id,{cost:parseInt(e.target.value)||0})}
                      style={{width:72,padding:"6px 10px",borderRadius:10,border:"2px solid #F0F0F0",fontWeight:900,fontSize:16,color:r.color,textAlign:"center"}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:16,padding:16,marginBottom:24,border:"2px dashed #E0E0E0"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#BBB",marginBottom:10}}>{L("+ Tambah Reward","+ Add Reward")}</p>
              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                <input value={newRw.emoji} onChange={e=>setNewRw(p=>({...p,emoji:e.target.value}))}
                  style={{width:44,textAlign:"center",fontSize:22,border:"2px solid #F0F0F0",borderRadius:10,padding:"8px 4px"}}/>
                <input value={newRw.label} onChange={e=>setNewRw(p=>({...p,label:e.target.value}))} placeholder={L("Nama reward","Reward name")}
                  style={{flex:1,padding:"10px 12px",border:"2px solid #F0F0F0",borderRadius:12,fontSize:13,fontWeight:600}}/>
                <input type="number" value={newRw.cost} onChange={e=>setNewRw(p=>({...p,cost:e.target.value}))} placeholder="pts"
                  style={{width:60,padding:"10px 6px",border:"2px solid #F0F0F0",borderRadius:12,fontSize:13,fontWeight:700,textAlign:"center"}}/>
                <button className="tap" onClick={addRw} style={{padding:"10px 14px",borderRadius:12,background:"#10B981",color:"white",fontWeight:900,fontSize:18}}>+</button>
              </div>
            </div>
            <button className="tap" onClick={next}
              style={{width:"100%",padding:"16px",borderRadius:16,background:"#10B981",color:"white",fontWeight:900,fontSize:18,boxShadow:"0 4px 16px #10B98155"}}>
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
  const [view,setView] = useState(null); // null | {type:'kid',idx} | 'rewards' | 'addKid'
  const [newRw,setNewRw] = useState({emoji:"🏆",label:"",cost:""});
  const [newKidForm,setNewKidForm] = useState({name:"",avatar:"🐣",colorIdx:1});
  const [confirmDel,setConfirmDel] = useState(null);
  const DAYS = DAYS_LABEL[lang];
  const L=(id,en)=>lang==="id"?id:en;

  function updKid(idx,patch){setKidsConfig(p=>p.map((k,i)=>i===idx?{...k,...patch}:k));}
  function removeTask(kidIdx,tid){setKidsConfig(p=>p.map((k,i)=>i!==kidIdx?k:{...k,tasks:k.tasks.filter(t=>t.id!==tid)}));}
  function moveTask(kidIdx,tid,dir){
    setKidsConfig(p=>p.map((k,i)=>{
      if(i!==kidIdx)return k;
      const ts=[...k.tasks],idx=ts.findIndex(t=>t.id===tid),ni=idx+dir;
      if(ni<0||ni>=ts.length)return k;
      [ts[idx],ts[ni]]=[ts[ni],ts[idx]]; return{...k,tasks:ts};
    }));
  }
  function addTask(kidIdx,label){
    setKidsConfig(p=>p.map((k,i)=>i!==kidIdx?k:{...k,tasks:[...k.tasks,{id:Date.now(),emoji:"✅",label}]}));
  }
  function updRw(id,patch){setRewardsConfig(p=>p.map(r=>r.id===id?{...r,...patch}:r));}
  function removeRw(id){setRewardsConfig(p=>p.filter(r=>r.id!==id));}
  function addRw(){
    if(!newRw.label.trim()||!newRw.cost)return;
    setRewardsConfig(p=>[...p,{id:"r"+Date.now(),emoji:newRw.emoji,label:newRw.label,sublabel:"",cost:parseInt(newRw.cost),color:REWARD_COLORS[p.length%REWARD_COLORS.length]}]);
    setNewRw({emoji:"🏆",label:"",cost:""});
  }
  function addKid(){
    if(!newKidForm.name.trim())return;
    const tasks=DEFAULT_TASKS[lang].map((t,i)=>({...t,id:i+1}));
    const kid={...newKidForm,tasks,incidentCost:2};
    setKidsConfig(p=>[...p,kid]);
    const nd={days:{},redeemed:[],incidents:[]};
    DAYS.forEach((_,i)=>{nd.days[i]={tasks:{},incidents:0};tasks.forEach(t=>{nd.days[i].tasks[t.id]=t.type==="counter"?0:false;});});
    setAppData(p=>({...p,[newKidForm.name]:nd}));
    setNewKidForm({name:"",avatar:"🐣",colorIdx:1});
    setView(null);
  }
  function removeKid(idx){
    const name=kidsConfig[idx].name;
    setKidsConfig(p=>p.filter((_,i)=>i!==idx));
    setAppData(p=>{const d={...p};delete d[name];return d;});
    setConfirmDel(null); setView(null);
  }

  const kd = view?.type==="kid"?kidsConfig[view.idx]:null;
  const kc = kd?KID_COLORS[kd.colorIdx]:KID_COLORS[0];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"white",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto",animation:"popIn .3s ease",padding:"20px 16px 48px",position:"relative"}}>

        {confirmDel!==null&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",borderRadius:"24px 24px 0 0",display:"flex",alignItems:"center",justifyContent:"center",padding:24,zIndex:10}}>
            <div style={{background:"white",borderRadius:20,padding:24,maxWidth:280,textAlign:"center"}}>
              <p style={{fontWeight:900,fontSize:16,color:"#333"}}>{L(`Hapus ${kidsConfig[confirmDel]?.name}?`,`Remove ${kidsConfig[confirmDel]?.name}?`)}</p>
              <p style={{fontSize:13,color:"#BBB",marginTop:8,lineHeight:1.5}}>{L("Semua data anak ini akan hilang.","All data for this child will be deleted.")}</p>
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button className="tap" onClick={()=>setConfirmDel(null)} style={{flex:1,padding:"12px",borderRadius:14,background:"#F0F0F0",fontWeight:800,color:"#555"}}>{L("Batal","Cancel")}</button>
                <button className="tap" onClick={()=>removeKid(confirmDel)} style={{flex:1,padding:"12px",borderRadius:14,background:"#EF4444",fontWeight:800,color:"white"}}>{L("Hapus","Remove")}</button>
              </div>
            </div>
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          {view&&<button className="tap" onClick={()=>setView(null)} style={{width:34,height:34,borderRadius:50,background:"#F0F0F0",fontWeight:900,fontSize:16,color:"#666"}}>←</button>}
          <h2 style={{flex:1,fontSize:20,fontWeight:900,color:"#333"}}>
            {!view?L("⚙️ Pengaturan","⚙️ Settings"):view==="rewards"?L("🎁 Ubah Reward","🎁 Edit Rewards"):view==="addKid"?L("➕ Tambah Anak","➕ Add Child"):L(`✏️ ${kd?.name}`,`✏️ ${kd?.name}`)}
          </h2>
          <button className="tap" onClick={onClose} style={{width:34,height:34,borderRadius:50,background:"#F0F0F0",fontWeight:900,fontSize:18,color:"#999"}}>×</button>
        </div>

        {/* Main menu */}
        {!view&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1,paddingLeft:4}}>{L("ANAK-ANAK","CHILDREN")}</p>
            {kidsConfig.map((k,i)=>{
              const c=KID_COLORS[k.colorIdx];
              return(
                <button key={i} className="tap" onClick={()=>setView({type:"kid",idx:i})}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"white",borderRadius:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:`2px solid ${c.color}22`,textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:28}}>{k.avatar}</span>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:800,fontSize:16,color:"#333"}}>{k.name}</p>
                    <p style={{fontSize:12,color:"#BBB",marginTop:2}}>{k.tasks.length} {L("tugas","tasks")}</p>
                  </div>
                  <span style={{color:"#CCC",fontSize:20,fontWeight:900}}>›</span>
                </button>
              );
            })}
            <button className="tap" onClick={()=>setView("addKid")}
              style={{padding:"14px",borderRadius:16,border:"2px dashed #E0E0E0",fontWeight:800,fontSize:15,color:"#AAA"}}>
              + {L("Tambah Anak","Add Child")}
            </button>
            <div style={{height:1,background:"#F0F0F0",margin:"4px 0"}}/>
            <button className="tap" onClick={()=>setView("rewards")}
              style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"white",borderRadius:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:"2px solid #10B98122",textAlign:"left",width:"100%"}}>
              <span style={{fontSize:28}}>🎁</span>
              <div style={{flex:1}}>
                <p style={{fontWeight:800,fontSize:16,color:"#333"}}>{L("Reward","Rewards")}</p>
                <p style={{fontSize:12,color:"#BBB",marginTop:2}}>{rewardsConfig.length} {L("reward","rewards")}</p>
              </div>
              <span style={{color:"#CCC",fontSize:20,fontWeight:900}}>›</span>
            </button>
            <div style={{height:1,background:"#F0F0F0",margin:"4px 0"}}/>
            <button className="tap" onClick={()=>{ if(window.confirm(L("Reset semua data Kindee? Ini tidak bisa dibatalkan.","Reset all Kindee data? This cannot be undone."))) onReset(); }}
              style={{padding:"14px",borderRadius:16,border:"2px solid #FEE2E2",fontWeight:800,fontSize:14,color:"#EF4444",background:"transparent",width:"100%"}}>
              🔄 {L("Mulai Ulang dari Awal","Reset & Start Over")}
            </button>
          </div>
        )}

        {/* Edit Kid */}
        {view?.type==="kid"&&kd&&(
          <div>
            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1}}>{L("Nama","Name")}</label>
              <input value={kd.name} onChange={e=>updKid(view.idx,{name:e.target.value})}
                style={{display:"block",width:"100%",marginTop:8,padding:"10px 0",fontSize:22,fontWeight:900,color:"#333",border:"none",borderBottom:"2px solid #F0F0F0",background:"transparent"}}/>
            </div>
            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1}}>{L("Avatar & Warna","Avatar & Color")}</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>
                {KID_AVATARS.map(av=>(
                  <button key={av} className="tap" onClick={()=>updKid(view.idx,{avatar:av})}
                    style={{width:40,height:40,borderRadius:12,fontSize:20,background:kd.avatar===av?kc.light:"#F7F7FA",border:`2px solid ${kd.avatar===av?kc.color:"transparent"}`}}>{av}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:12,marginTop:12}}>
                {KID_COLORS.map((c,i)=>(
                  <button key={i} className="tap" onClick={()=>updKid(view.idx,{colorIdx:i})}
                    style={{width:36,height:36,borderRadius:50,background:c.color,border:kd.colorIdx===i?"3px solid #333":"3px solid transparent",boxShadow:kd.colorIdx===i?`0 0 0 2px white,0 0 0 4px ${c.color}`:"none"}}/>
                ))}
              </div>
            </div>
            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:12}}>{L("Tugas","Tasks")}</label>
              <TaskEditor tasks={kd.tasks} onRemove={tid=>removeTask(view.idx,tid)} onMove={(tid,dir)=>moveTask(view.idx,tid,dir)} onAdd={label=>addTask(view.idx,label)} color={kc.color} light={kc.light} lang={lang}/>
            </div>
            {kidsConfig.length>1&&(
              <button className="tap" onClick={()=>setConfirmDel(view.idx)}
                style={{width:"100%",padding:"14px",borderRadius:16,background:"#FEE2E2",color:"#EF4444",fontWeight:800,fontSize:15,marginTop:8}}>
                🗑️ {L(`Hapus ${kd.name}`,`Remove ${kd.name}`)}
              </button>
            )}
          </div>
        )}

        {/* Edit Rewards */}
        {view==="rewards"&&(
          <div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {rewardsConfig.map(r=>(
                <div key={r.id} style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",border:`2px solid ${r.color}33`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:24}}>{r.emoji}</span>
                    <input value={r.label} onChange={e=>updRw(r.id,{label:e.target.value})}
                      style={{flex:1,fontWeight:800,fontSize:15,border:"none",borderBottom:"2px solid #F0F0F0",padding:"4px 0",background:"transparent",color:"#333"}}/>
                    <button className="tap" onClick={()=>removeRw(r.id)} style={{color:"#DDD",fontSize:20,fontWeight:900}}>×</button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
                    <span style={{fontSize:12,color:"#BBB",fontWeight:700}}>{L("Poin:","Points:")}</span>
                    <input type="number" value={r.cost} onChange={e=>updRw(r.id,{cost:parseInt(e.target.value)||0})}
                      style={{width:72,padding:"6px 10px",borderRadius:10,border:"2px solid #F0F0F0",fontWeight:900,fontSize:15,color:r.color,textAlign:"center"}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:16,padding:16,border:"2px dashed #E0E0E0"}}>
              <p style={{fontSize:12,fontWeight:700,color:"#BBB",marginBottom:10}}>{L("+ Tambah Reward","+ Add Reward")}</p>
              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                <input value={newRw.emoji} onChange={e=>setNewRw(p=>({...p,emoji:e.target.value}))} style={{width:44,textAlign:"center",fontSize:20,border:"2px solid #F0F0F0",borderRadius:10,padding:"8px 4px"}}/>
                <input value={newRw.label} onChange={e=>setNewRw(p=>({...p,label:e.target.value}))} placeholder={L("Nama","Name")} style={{flex:1,padding:"10px 12px",border:"2px solid #F0F0F0",borderRadius:12,fontSize:13,fontWeight:600}}/>
                <input type="number" value={newRw.cost} onChange={e=>setNewRw(p=>({...p,cost:e.target.value}))} placeholder="pts" style={{width:60,padding:"10px 6px",border:"2px solid #F0F0F0",borderRadius:12,fontSize:13,fontWeight:700,textAlign:"center"}}/>
                <button className="tap" onClick={addRw} style={{padding:"10px 14px",borderRadius:12,background:"#10B981",color:"white",fontWeight:900,fontSize:18}}>+</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Kid */}
        {view==="addKid"&&(
          <div>
            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1}}>{L("Nama","Name")}</label>
              <input value={newKidForm.name} onChange={e=>setNewKidForm(p=>({...p,name:e.target.value}))} placeholder={L("Nama anak...","Child's name...")}
                style={{display:"block",width:"100%",marginTop:8,padding:"10px 0",fontSize:22,fontWeight:900,color:"#333",border:"none",borderBottom:"2px solid #F0F0F0",background:"transparent"}}/>
            </div>
            <div style={{background:"white",borderRadius:18,padding:16,marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <label style={{fontSize:11,fontWeight:700,color:"#BBB",textTransform:"uppercase",letterSpacing:1}}>{L("Avatar & Warna","Avatar & Color")}</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>
                {KID_AVATARS.map(av=>(
                  <button key={av} className="tap" onClick={()=>setNewKidForm(p=>({...p,avatar:av}))}
                    style={{width:40,height:40,borderRadius:12,fontSize:20,background:newKidForm.avatar===av?KID_COLORS[newKidForm.colorIdx].light:"#F7F7FA",border:`2px solid ${newKidForm.avatar===av?KID_COLORS[newKidForm.colorIdx].color:"transparent"}`}}>{av}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:12,marginTop:12}}>
                {KID_COLORS.map((c,i)=>(
                  <button key={i} className="tap" onClick={()=>setNewKidForm(p=>({...p,colorIdx:i}))}
                    style={{width:36,height:36,borderRadius:50,background:c.color,border:newKidForm.colorIdx===i?"3px solid #333":"3px solid transparent",boxShadow:newKidForm.colorIdx===i?`0 0 0 2px white,0 0 0 4px ${c.color}`:"none"}}/>
                ))}
              </div>
            </div>
            <button className="tap" onClick={addKid} disabled={!newKidForm.name.trim()}
              style={{width:"100%",padding:"16px",borderRadius:16,background:newKidForm.name.trim()?KID_COLORS[newKidForm.colorIdx].color:"#DDD",color:"white",fontWeight:900,fontSize:18}}>
              {L("Tambah Anak ✨","Add Child ✨")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
function App({config, onReset}) {
  const {lang} = config;
  const DAYS = DAYS_LABEL[lang];
  const today = new Date().getDay();
  const todayIdx = today===0?6:today-1;

  const [kidsConfig,setKidsConfig] = useState(config.kids);
  const [rewardsConfig,setRewardsConfig] = useState(config.rewards);
  const [activeKid,setActiveKid] = useState(0);
  const [selDay,setSelDay] = useState(todayIdx);
  const [tab,setTab] = useState("tasks");
  const [sparkles,setSparkles] = useState([]);
  const [celebrate,setCelebrate] = useState(null);
  const [showIncident,setShowIncident] = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [prevDayFull,setPrevDayFull] = useState(false);

  const [appData,setAppData] = useState(()=>{
    try {
      const s = localStorage.getItem('kindee_v1');
      if (s) {
        const d = JSON.parse(s);
        if (d.appData && Object.keys(d.appData).length > 0) return d.appData;
      }
    } catch(e) {}
    const d={};
    config.kids.forEach(k=>{
      d[k.name]={days:{},redeemed:[],incidents:[]};
      DAYS_LABEL[config.lang].forEach((_,i)=>{
        d[k.name].days[i]={tasks:{},incidents:0};
        k.tasks.forEach(t=>{d[k.name].days[i].tasks[t.id]=t.type==="counter"?0:false;});
      });
    });
    return d;
  });

  const L=(id,en)=>lang==="id"?id:en;

  // 💾 Save everything to localStorage on every change
  useEffect(()=>{
    try {
      localStorage.setItem('kindee_v1', JSON.stringify({
        lang, kids:kidsConfig, rewards:rewardsConfig, appData
      }));
    } catch(e) {}
  },[kidsConfig,rewardsConfig,appData]);

  const kidIdx = Math.min(activeKid,kidsConfig.length-1);
  const kid = kidsConfig[kidIdx];
  const kc = KID_COLORS[kid.colorIdx];
  const kd = appData[kid.name]||{days:Object.fromEntries(DAYS.map((_,i)=>[i,{tasks:{},incidents:0}])),redeemed:[],incidents:[]};

  function calcPts(kidName,kidObj){
    if(!appData[kidName])return{earned:0,spent:0,balance:0};
    const d=appData[kidName]; let earned=0;
    DAYS.forEach((_,i)=>{
      const day=d.days[i]; if(!day)return;
      let pts=0,done=0;
      kidObj.tasks.forEach(t=>{
        const v=day.tasks[t.id];
        if(t.type==="counter"){pts+=(v||0);if((v||0)>0)done++;}
        else{pts+=v?1:0;if(v)done++;}
      });
      earned+=pts;
      if(done===kidObj.tasks.length&&kidObj.tasks.length>0)earned+=BONUS;
      earned-=(day.incidents||0)*kidObj.incidentCost;
    });
    const spent=d.redeemed.reduce((a,r)=>a+r.cost,0);
    return{earned:Math.max(0,earned),spent,balance:Math.max(0,earned-spent)};
  }

  const {earned,spent,balance}=calcPts(kid.name,kid);
  const redeemableCount=rewardsConfig.filter(r=>balance>=r.cost).length;

  const dayTasks=kd.days[selDay]?.tasks||{};
  const dayDone=kid.tasks.filter(t=>t.type==="counter"?(dayTasks[t.id]||0)>0:!!dayTasks[t.id]).length;
  const dayFull=dayDone===kid.tasks.length&&kid.tasks.length>0;
  const dayInc=kd.days[selDay]?.incidents||0;

  // Play complete sound when day becomes full
  if(dayFull&&!prevDayFull){setPrevDayFull(true);sfx('complete');}
  if(!dayFull&&prevDayFull){setPrevDayFull(false);}

  function addSparkle(e){
    const r=e.currentTarget.getBoundingClientRect();
    const id=Date.now()+Math.random();
    setSparkles(p=>[...p,{id,x:r.left+r.width/2,y:r.top}]);
    setTimeout(()=>setSparkles(p=>p.filter(s=>s.id!==id)),900);
  }

  function updateDay(patch){
    setAppData(p=>({...p,[kid.name]:{...p[kid.name],days:{...p[kid.name].days,[selDay]:{...p[kid.name].days[selDay],...patch}}}}));
  }

  function toggleTask(tid,e){
    const was=kd.days[selDay].tasks[tid];
    updateDay({tasks:{...dayTasks,[tid]:!was}});
    if(!was){addSparkle(e);sfx('check');}else sfx('undo');
  }
  function incrementCounter(tid,e){
    updateDay({tasks:{...dayTasks,[tid]:(dayTasks[tid]||0)+1}});
    addSparkle(e); sfx('counter');
  }
  function decrementCounter(tid){
    const cur=dayTasks[tid]||0; if(cur===0)return;
    updateDay({tasks:{...dayTasks,[tid]:cur-1}}); sfx('undo');
  }
  function addIncident(){
    setShowIncident(false); sfx('incident');
    const time=new Date().toLocaleTimeString(lang==="id"?"id-ID":"en-US",{hour:"2-digit",minute:"2-digit"});
    setAppData(p=>({...p,[kid.name]:{...p[kid.name],days:{...p[kid.name].days,[selDay]:{...p[kid.name].days[selDay],incidents:(p[kid.name].days[selDay].incidents||0)+1}},incidents:[...p[kid.name].incidents,{day:selDay,time}]}}));
  }
  function redeem(rw){
    if(balance<rw.cost)return; sfx('redeem');
    setAppData(p=>({...p,[kid.name]:{...p[kid.name],redeemed:[...p[kid.name].redeemed,{...rw,at:new Date().toLocaleDateString(lang==="id"?"id-ID":"en-US")}]}}));
    setCelebrate(rw); setTimeout(()=>setCelebrate(null),3000);
  }

  return (
    <div style={{minHeight:"100vh",background:"#F7F7FA"}}>
      <GS/>

      {sparkles.map(s=>(
        <div key={s.id} style={{position:"fixed",left:s.x-10,top:s.y,fontSize:20,pointerEvents:"none",animation:"sparkle .8s ease-out forwards",zIndex:9999,color:kc.color}}>⭐</div>
      ))}

      {celebrate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:24,padding:"32px 36px",textAlign:"center",animation:"popIn .4s ease",maxWidth:300}}>
            <div style={{fontSize:60}}>{celebrate.emoji}</div>
            <div style={{fontSize:22,fontWeight:900,color:celebrate.color,marginTop:12}}>{L("Reward Ditukar!","Reward Redeemed!")}</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:8}}>{celebrate.label}</div>
            <div style={{marginTop:12,background:"#F7F7FA",borderRadius:12,padding:"10px",fontWeight:900,color:celebrate.color}}>-{celebrate.cost} {L("poin","pts")}</div>
          </div>
        </div>
      )}

      {showIncident&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"100%",animation:"popIn .3s ease"}}>
            <div style={{fontSize:48,textAlign:"center"}}>😤</div>
            <div style={{fontSize:20,fontWeight:900,textAlign:"center",marginTop:12}}>{L("Catat Insiden?","Record Incident?")}</div>
            <div style={{fontSize:14,color:"#888",textAlign:"center",marginTop:8,lineHeight:1.6}}>
              → <span style={{color:"#EF4444",fontWeight:800}}>-{kid.incidentCost} {L("poin","pts")}</span>
              <br/><span style={{fontSize:12,color:"#CCC"}}>{L("Kasih waktu 5 menit dulu ✋","Give 5 minutes grace first ✋")}</span>
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button className="tap" onClick={()=>setShowIncident(false)} style={{flex:1,padding:"12px",borderRadius:14,background:"#F0F0F0",fontWeight:800,color:"#555"}}>{L("Batal","Cancel")}</button>
              <button className="tap" onClick={addIncident} style={{flex:1,padding:"12px",borderRadius:14,background:"#EF4444",fontWeight:800,color:"white"}}>{L("Catat","Record")}</button>
            </div>
          </div>
        </div>
      )}

      {showSettings&&(
        <Settings lang={lang} kidsConfig={kidsConfig} setKidsConfig={setKidsConfig} rewardsConfig={rewardsConfig} setRewardsConfig={setRewardsConfig} appData={appData} setAppData={setAppData} onReset={onReset} onClose={()=>setShowSettings(false)}/>
      )}

      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${kc.color},${kc.accent})`,padding:"24px 16px 0",transition:"background .4s"}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{color:"rgba(255,255,255,0.8)",fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>⭐ Reward Chart</p>
              <h1 style={{color:"white",fontSize:22,fontWeight:900}}>{L("Halo ","Hello ")}{kid.avatar} {kid.name}!</h1>
            </div>
            <button className="tap" onClick={()=>setShowSettings(true)}
              style={{fontSize:13,color:"rgba(255,255,255,0.9)",fontWeight:700,padding:"8px 12px",borderRadius:12,background:"rgba(255,255,255,0.2)"}}>
              ⚙️ {L("Pengaturan","Settings")}
            </button>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14,overflowX:"auto",paddingBottom:2}}>
            {kidsConfig.map((k,i)=>(
              <button key={i} className="tap" onClick={()=>setActiveKid(i)}
                style={{flexShrink:0,padding:"10px 14px",borderRadius:"14px 14px 0 0",background:kidIdx===i?"white":"rgba(255,255,255,0.2)",color:kidIdx===i?KID_COLORS[k.colorIdx].color:"white",fontWeight:800,fontSize:14,whiteSpace:"nowrap"}}>
                {k.avatar} {k.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"14px 16px 60px",animation:"fadeIn .25s ease"}}>

        {/* Points summary */}
        <div style={{background:"white",borderRadius:20,padding:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",display:"flex",gap:10}}>
          {[[balance,L("Saldo","Balance"),true],[earned,L("Total Dapat","Earned"),false],[spent,L("Tertukar","Spent"),false]].map(([val,label,bold],i)=>(
            <div key={i} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:14,background:bold?kc.light:"#FAFAFA"}}>
              <div style={{fontSize:10,color:"#BBB",fontWeight:700}}>{label}</div>
              <div style={{fontSize:bold?28:20,fontWeight:900,color:bold?kc.color:"#666",marginTop:2}}>{val}</div>
              <div style={{fontSize:10,color:"#CCC",fontWeight:600}}>{L("poin","pts")}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginTop:12,background:"#EBEBEB",borderRadius:16,padding:4}}>
          {[["tasks",L("✅ Tugas","✅ Tasks"),0],["rewards",L("🎁 Reward","🎁 Rewards"),redeemableCount],["log",L("📋 Log","📋 Log"),0]].map(([t,label,badge])=>(
            <button key={t} className="tap" onClick={()=>setTab(t)}
              style={{flex:1,padding:"9px 4px",borderRadius:12,background:tab===t?"white":"transparent",color:tab===t?kc.color:"#999",fontWeight:800,fontSize:12,boxShadow:tab===t?"0 1px 6px rgba(0,0,0,0.1)":"none",position:"relative"}}>
              {label}
              {badge>0&&(
                <span style={{position:"absolute",top:1,right:3,width:18,height:18,borderRadius:50,background:"#EF4444",color:"white",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",animation:"badgePop .4s ease"}}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TASKS TAB ── */}
        {tab==="tasks"&&(
          <div style={{marginTop:14}}>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
              {DAYS.map((d,i)=>{
                const dd=appData[kid.name]?.days[i];
                const dc=dd?kid.tasks.filter(t=>t.type==="counter"?(dd.tasks[t.id]||0)>0:!!dd.tasks[t.id]).length:0;
                const full=dc===kid.tasks.length&&kid.tasks.length>0;
                return(
                  <button key={i} className="tap" onClick={()=>setSelDay(i)}
                    style={{minWidth:48,padding:"8px 4px",borderRadius:13,flex:"0 0 auto",background:selDay===i?kc.color:full?kc.light:"white",color:selDay===i?"white":full?kc.color:"#666",fontWeight:800,fontSize:12,border:selDay===i?"none":full?`2px solid ${kc.color}44`:"2px solid #F0F0F0",boxShadow:selDay===i?`0 3px 10px ${kc.color}66`:"none"}}>
                    <div>{d}</div><div style={{fontSize:15,marginTop:2}}>{full?"🌟":dc>0?"⭐":"○"}</div>
                  </button>
                );
              })}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
              <span style={{fontSize:12,color:"#BBB",fontWeight:700}}>{L("Hari ini:","Today:")} {dayDone}/{kid.tasks.length} {L("tugas","tasks")}</span>
              {dayFull&&<span style={{fontSize:12,fontWeight:800,color:kc.color}}>+{BONUS} {L("poin bonus! 🌟","bonus pts! 🌟")}</span>}
            </div>
            <div style={{background:"#F0F0F0",borderRadius:100,height:7,marginTop:7,overflow:"hidden"}}>
              <div style={{width:`${kid.tasks.length?(dayDone/kid.tasks.length)*100:0}%`,height:"100%",background:`linear-gradient(90deg,${kc.color},${kc.accent})`,borderRadius:100,transition:"width .4s"}}/>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:14}}>
              {kid.tasks.map(task=>{
                const val=dayTasks[task.id];
                const done=task.type==="counter"?(val||0)>0:!!val;
                if(task.type==="counter")return(
                  <div key={task.id} style={{background:done?kc.light:"white",border:done?`2px solid ${kc.color}44`:"2px solid #F0F0F0",borderRadius:16,padding:"13px 15px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                    <span style={{fontSize:22}}>{task.emoji}</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:15,fontWeight:700,color:done?kc.color:"#333"}}>{task.label}</span>
                      {(val||0)>0&&<span style={{fontSize:12,color:kc.color,fontWeight:800,marginLeft:8}}>+{val} {L("poin","pts")} ⭐</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <button className="tap" onClick={()=>decrementCounter(task.id)}
                        style={{width:32,height:32,borderRadius:50,background:(val||0)>0?"#FEE2E2":"#F0F0F0",color:(val||0)>0?"#EF4444":"#CCC",fontWeight:900,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{fontSize:22,fontWeight:900,color:done?kc.color:"#BBB",minWidth:28,textAlign:"center"}}>{val||0}</span>
                      <button className="tap" onClick={e=>incrementCounter(task.id,e)}
                        style={{width:32,height:32,borderRadius:50,background:kc.color,color:"white",fontWeight:900,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${kc.color}55`}}>+</button>
                    </div>
                  </div>
                );
                return(
                  <button key={task.id} className="tap" onClick={e=>toggleTask(task.id,e)}
                    style={{background:done?kc.light:"white",border:done?`2px solid ${kc.color}44`:"2px solid #F0F0F0",borderRadius:16,padding:"13px 15px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",width:"100%",textAlign:"left"}}>
                    <span style={{fontSize:22}}>{task.emoji}</span>
                    <span style={{flex:1,fontSize:15,fontWeight:700,color:done?kc.color:"#333",textDecoration:done?"line-through":"none",opacity:done?.75:1}}>{task.label}</span>
                    <span style={{width:28,height:28,borderRadius:50,background:done?kc.color:"#F0F0F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{done?"⭐":""}</span>
                  </button>
                );
              })}
            </div>

            <div style={{marginTop:16,background:"white",borderRadius:18,padding:14,border:"2px solid #FEE2E2"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontWeight:800,fontSize:14,color:"#333"}}>😤 {L("Insiden","Incident")}</p>
                  <p style={{fontSize:11,color:"#BBB",marginTop:2}}>{L("Hari ini","Today")}: {dayInc}× → -{dayInc*kid.incidentCost} {L("poin","pts")}</p>
                </div>
                <button className="tap" onClick={()=>setShowIncident(true)}
                  style={{background:"#FEE2E2",color:"#EF4444",fontWeight:800,fontSize:12,padding:"8px 14px",borderRadius:12}}>+ {L("Catat","Record")}</button>
              </div>
              <p style={{fontSize:10,color:"#DDD",marginTop:8,fontStyle:"italic"}}>{L("Kasih waktu 5 menit dulu ✋","Give 5 minutes grace first ✋")}</p>
            </div>

            {dayFull&&(
              <div style={{marginTop:12,background:`linear-gradient(135deg,${kc.color},${kc.accent})`,borderRadius:16,padding:"14px",textAlign:"center",animation:"fadeIn .3s ease"}}>
                <p style={{color:"white",fontWeight:900,fontSize:17}}>🌟 {L("Semua selesai hari ini!","All done today!")}</p>
                <p style={{color:"rgba(255,255,255,0.85)",fontSize:13,marginTop:3,fontWeight:600}}>+{BONUS} {L("poin bonus!","bonus pts!")}</p>
              </div>
            )}
          </div>
        )}

        {/* ── REWARDS TAB ── */}
        {tab==="rewards"&&(
          <div style={{marginTop:14}}>
            <p style={{fontSize:12,color:"#BBB",fontWeight:700,marginBottom:12}}>{L("Saldo","Balance")}: <span style={{color:kc.color,fontSize:16}}>{balance} {L("poin","pts")}</span></p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {rewardsConfig.map(rw=>{
                const can=balance>=rw.cost, prog=Math.min(balance/rw.cost,1);
                return(
                  <div key={rw.id} style={{background:"white",borderRadius:20,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:can?`2px solid ${rw.color}44`:"2px solid #F0F0F0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:30}}>{rw.emoji}</span>
                      <div style={{flex:1}}>
                        <p style={{fontWeight:800,fontSize:16}}>{rw.label}</p>
                        {rw.sublabel&&<p style={{fontSize:12,color:"#BBB",marginTop:1}}>{rw.sublabel}</p>}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <p style={{fontWeight:900,fontSize:20,color:rw.color}}>{rw.cost}</p>
                        <p style={{fontSize:11,color:"#BBB"}}>{L("poin","pts")}</p>
                      </div>
                    </div>
                    <div style={{marginTop:12}}>
                      <div style={{background:"#F0F0F0",borderRadius:100,height:7,overflow:"hidden"}}>
                        <div style={{width:`${prog*100}%`,height:"100%",background:can?rw.color:`${rw.color}66`,borderRadius:100,transition:"width .4s"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                        <span style={{fontSize:11,color:can?rw.color:"#BBB",fontWeight:700}}>{can?L("✅ Bisa ditukar!","✅ Can redeem!"):`${rw.cost-balance} ${L("poin lagi →","pts to go →")}`}</span>
                        <span style={{fontSize:11,color:"#BBB"}}>{balance}/{rw.cost}</span>
                      </div>
                    </div>
                    {can&&(
                      <button className="tap" onClick={()=>redeem(rw)}
                        style={{marginTop:12,width:"100%",background:rw.color,color:"white",fontWeight:800,fontSize:15,padding:"12px",borderRadius:14,boxShadow:`0 4px 12px ${rw.color}55`}}>
                        {L("Tukar Sekarang 🎉","Redeem Now 🎉")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LOG TAB ── */}
        {tab==="log"&&(
          <div style={{marginTop:14}}>
            <p style={{fontSize:12,fontWeight:700,color:"#BBB",marginBottom:8}}>{L("REWARD DITUKAR","REDEEMED")}</p>
            {(kd.redeemed||[]).length===0
              ?<div style={{background:"white",borderRadius:14,padding:20,textAlign:"center",color:"#DDD",fontWeight:700,fontSize:14}}>{L("Belum ada","None yet")} 🎁</div>
              :(kd.redeemed||[]).map((r,i)=>(
                <div key={i} style={{background:"white",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                  <span style={{fontSize:22}}>{r.emoji}</span>
                  <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14}}>{r.label}</p><p style={{fontSize:11,color:"#BBB"}}>{r.at}</p></div>
                  <span style={{fontWeight:800,color:"#EF4444",fontSize:14}}>-{r.cost}</span>
                </div>
              ))
            }
            <p style={{fontSize:12,fontWeight:700,color:"#BBB",marginTop:18,marginBottom:8}}>{L("LOG INSIDEN","INCIDENT LOG")} 😤</p>
            {(kd.incidents||[]).length===0
              ?<div style={{background:"white",borderRadius:14,padding:20,textAlign:"center",color:"#DDD",fontWeight:700,fontSize:14}}>{L("Belum ada","None yet")} 🎉</div>
              :(kd.incidents||[]).map((inc,i)=>(
                <div key={i} style={{background:"white",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                  <span style={{fontSize:20}}>😤</span>
                  <div style={{flex:1}}><p style={{fontWeight:700,fontSize:14}}>{L("Insiden","Incident")}</p><p style={{fontSize:11,color:"#BBB"}}>{DAYS[inc.day]}, {inc.time}</p></div>
                  <span style={{fontWeight:800,color:"#EF4444",fontSize:14}}>-{kid.incidentCost}</span>
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
  const [config, setConfig] = useState(() => {
    try {
      const s = localStorage.getItem('kindee_v1');
      if (!s) return null;
      const d = JSON.parse(s);
      return d.lang && d.kids && d.rewards ? { lang:d.lang, kids:d.kids, rewards:d.rewards } : null;
    } catch(e) { return null; }
  });

  function handleDone(cfg) {
    setConfig(cfg);
    try { localStorage.setItem('kindee_v1', JSON.stringify({...cfg, appData:{}})); } catch(e) {}
  }

  function handleReset() {
    try { localStorage.removeItem('kindee_v1'); } catch(e) {}
    setConfig(null);
  }

  if(!config) return <Setup onDone={handleDone}/>;
  return <App config={config} onReset={handleReset}/>;
}

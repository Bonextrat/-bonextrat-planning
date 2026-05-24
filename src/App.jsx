import { useState, useMemo } from "react";

// --- DATA ---------------------------------------------------------
const TYPE_MAP = {
  salarie: { label:"Salarie",  bg:"#DBEAFE", color:"#1D4ED8" },
  auto:    { label:"Auto-Ent", bg:"#D1FAE5", color:"#065F46" },
  associe: { label:"Associe",  bg:"#FEF3C7", color:"#92400E" },
};
const POSTES = ["Receptionniste","Femme de chambre","Valet","Night Auditor","Concierge","Bagagiste","Room Service","Chef de reception","Agent d'accueil","Veilleur de nuit"];
const COLORS_LIST = ["#2563A8","#065F46","#1C3557","#0891B2","#0369A1","#B45309","#6D28D9","#BE185D","#0F766E","#DC2626","#D97706","#0E7490","#047857"];
const MOIS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
const JOURS_COURT = ["L","M","M","J","V","S","D"];

const INIT_INTERVENANTS = [
  { id:1,  nom:"Gaya",    type:"salarie",  tarif:0,  color:"#2563A8", poste:"Veilleur de nuit"  },
  { id:2,  nom:"Massi",   type:"associe",  tarif:19, color:"#065F46", poste:"Receptionniste"    },
  { id:3,  nom:"Sina",    type:"associe",  tarif:19, color:"#1C3557", poste:"Receptionniste"    },
  { id:4,  nom:"Youva",   type:"auto",     tarif:14, color:"#0891B2", poste:"Receptionniste"    },
  { id:5,  nom:"Riad",    type:"auto",     tarif:14, color:"#0369A1", poste:"Receptionniste"    },
  { id:6,  nom:"Walid",   type:"auto",     tarif:14, color:"#B45309", poste:"Receptionniste"    },
  { id:7,  nom:"Lydia",   type:"auto",     tarif:14, color:"#6D28D9", poste:"Receptionniste"    },
  { id:8,  nom:"Gloria",  type:"auto",     tarif:14, color:"#BE185D", poste:"Receptionniste"    },
  { id:9,  nom:"Yaman",   type:"auto",     tarif:14, color:"#0F766E", poste:"Night Auditor"     },
  { id:10, nom:"Rayan",   type:"auto",     tarif:14, color:"#DC2626", poste:"Receptionniste"    },
  { id:11, nom:"Celina",  type:"auto",     tarif:14, color:"#D97706", poste:"Receptionniste"    },
  { id:12, nom:"Sabrina", type:"auto",     tarif:14, color:"#0E7490", poste:"Receptionniste"    },
  { id:13, nom:"Saloua",  type:"auto",     tarif:14, color:"#047857", poste:"Femme de chambre"  },
];

const INIT_HOTELS = [
  { nom:"Hotel Bonaparte",        tarif:40, color:"#1C3557" },
  { nom:"Hotel Bleu de Grenelle", tarif:22, color:"#2563A8" },
  { nom:"Villa Glamour",          tarif:22, color:"#6D28D9" },
  { nom:"Hotel Drouot",           tarif:22, color:"#0891B2" },
];

function findI(nom,arr){ return (arr||INIT_INTERVENANTS).find(i=>i.nom.toLowerCase()===nom.toLowerCase())||{id:99,nom,type:"auto",tarif:14,color:"#94A3B8",poste:"Receptionniste"}; }
function findH(nom,arr){
  const list=arr||INIT_HOTELS;
  const n=nom.toLowerCase();
  if(n.includes("bonaparte")) return list[0];
  if(n.includes("bleu")||n.includes("grenelle")) return list[1]||list[0];
  if(n.includes("villa")||n.includes("glamour")) return list[2]||list[0];
  if(n.includes("drouot")) return list[3]||list[0];
  return list.find(h=>h.nom.toLowerCase().includes(n))||list[0];
}

function toMins(t){ if(!t)return 0; const[h,m]=t.split(":").map(Number); return h*60+m; }
function calcH(d,f){ if(!d||!f)return 0; let x=toMins(f)-toMins(d); if(x<=0)x+=1440; return Math.round(x/6)/10; }
function getDays(y,m){ return new Date(y,m+1,0).getDate(); }
function getFirstDay(y,m){ return (new Date(y,m,1).getDay()+6)%7; }

const RAW = [
  {date:"2026-05-01",h:"Bonaparte",i:"Gaya",   d:"20:00",f:"07:30"},
  {date:"2026-05-01",h:"Bleu de Grenelle",i:"Rayan",  d:"20:30",f:"07:30"},
  {date:"2026-05-01",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-02",h:"Bonaparte",i:"Riad",   d:"20:00",f:"07:30"},
  {date:"2026-05-02",h:"Bonaparte",i:"Lydia",  d:"09:30",f:"14:30"},
  {date:"2026-05-03",h:"Bleu de Grenelle",i:"Lydia",  d:"08:30",f:"13:30"},
  {date:"2026-05-03",h:"Villa Glamour",i:"Yaman",  d:"19:00",f:"07:00"},
  {date:"2026-05-03",h:"Bonaparte",i:"Riad",   d:"20:00",f:"07:30"},
  {date:"2026-05-04",h:"Bonaparte",i:"Gaya",   d:"07:30",f:"13:00"},
  {date:"2026-05-04",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-04",h:"Bleu de Grenelle",i:"Lydia",  d:"08:00",f:"13:00"},
  {date:"2026-05-05",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-05",h:"Bonaparte",i:"Walid",  d:"07:30",f:"13:00"},
  {date:"2026-05-05",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-06",h:"Bonaparte",i:"Walid",  d:"07:30",f:"13:00"},
  {date:"2026-05-06",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-07",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-08",h:"Bonaparte",i:"Youva",  d:"20:00",f:"07:30"},
  {date:"2026-05-08",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-09",h:"Bonaparte",i:"Riad",   d:"20:00",f:"07:30"},
  {date:"2026-05-09",h:"Drouot",   i:"Yaman",  d:"19:00",f:"07:00"},
  {date:"2026-05-10",h:"Bleu de Grenelle",i:"Lydia",  d:"08:30",f:"13:30"},
  {date:"2026-05-10",h:"Villa Glamour",i:"Sina",   d:"19:00",f:"07:00"},
  {date:"2026-05-10",h:"Bonaparte",i:"Gaya",   d:"20:00",f:"07:30"},
  {date:"2026-05-11",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-11",h:"Villa Glamour",i:"Sina",   d:"19:00",f:"07:00"},
  {date:"2026-05-12",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-12",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-13",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-13",h:"Bonaparte",i:"Walid",  d:"14:00",f:"20:15"},
  {date:"2026-05-13",h:"Bonaparte",i:"Celina", d:"09:30",f:"14:30"},
  {date:"2026-05-14",h:"Bonaparte",i:"Gaya",   d:"14:00",f:"20:15"},
  {date:"2026-05-14",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-14",h:"Bonaparte",i:"Youva",  d:"20:00",f:"07:30"},
  {date:"2026-05-14",h:"Villa Glamour",i:"Rayan",  d:"19:00",f:"07:00"},
  {date:"2026-05-15",h:"Bonaparte",i:"Gaya",   d:"14:00",f:"20:15"},
  {date:"2026-05-15",h:"Bonaparte",i:"Riad",   d:"20:00",f:"07:30"},
  {date:"2026-05-15",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-16",h:"Bonaparte",i:"Gaya",   d:"14:00",f:"20:15"},
  {date:"2026-05-16",h:"Bonaparte",i:"Walid",  d:"20:00",f:"07:30"},
  {date:"2026-05-17",h:"Bleu de Grenelle",i:"Saloua", d:"08:30",f:"13:30"},
  {date:"2026-05-17",h:"Bonaparte",i:"Gaya",   d:"13:30",f:"20:15"},
  {date:"2026-05-17",h:"Bonaparte",i:"Sina",   d:"07:30",f:"13:30"},
  {date:"2026-05-17",h:"Bonaparte",i:"Walid",  d:"20:00",f:"07:30"},
  {date:"2026-05-17",h:"Villa Glamour",i:"Yaman",  d:"19:00",f:"07:00"},
  {date:"2026-05-18",h:"Bonaparte",i:"Sina",   d:"20:00",f:"07:30"},
  {date:"2026-05-19",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-19",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-20",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-20",h:"Bonaparte",i:"Lydia",  d:"09:30",f:"14:30"},
  {date:"2026-05-21",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-21",h:"Bonaparte",i:"Sabrina",d:"09:30",f:"14:30"},
  {date:"2026-05-22",h:"Bonaparte",i:"Youva",  d:"20:00",f:"07:30"},
  {date:"2026-05-22",h:"Bonaparte",i:"Lydia",  d:"09:30",f:"14:30"},
  {date:"2026-05-23",h:"Drouot",   i:"Youva",  d:"19:00",f:"07:30"},
  {date:"2026-05-23",h:"Bonaparte",i:"Gaya",   d:"20:00",f:"07:30"},
  {date:"2026-05-23",h:"Bonaparte",i:"Lydia",  d:"09:30",f:"14:30"},
  {date:"2026-05-24",h:"Bleu de Grenelle",i:"Saloua", d:"06:30",f:"13:30"},
  {date:"2026-05-24",h:"Bonaparte",i:"Walid",  d:"14:00",f:"20:15"},
  {date:"2026-05-24",h:"Bonaparte",i:"Lydia",  d:"09:30",f:"14:30"},
  {date:"2026-05-24",h:"Bonaparte",i:"Youva",  d:"20:00",f:"07:30"},
  {date:"2026-05-24",h:"Villa Glamour",i:"Yaman",  d:"19:00",f:"07:00"},
  {date:"2026-05-24",h:"Bleu de Grenelle",i:"Sina",   d:"20:30",f:"07:30"},
  {date:"2026-05-25",h:"Bonaparte",i:"Sina",   d:"20:00",f:"07:30"},
  {date:"2026-05-25",h:"Bleu de Grenelle",i:"Lydia",  d:"08:00",f:"13:00"},
  {date:"2026-05-25",h:"Bleu de Grenelle",i:"Massi",  d:"20:30",f:"07:30"},
  {date:"2026-05-26",h:"Bonaparte",i:"Walid",  d:"20:00",f:"07:30"},
  {date:"2026-05-26",h:"Drouot",   i:"Massi",  d:"19:00",f:"07:00"},
  {date:"2026-05-26",h:"Bleu de Grenelle",i:"Rayan",  d:"20:30",f:"07:30"},
  {date:"2026-05-27",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-27",h:"Bonaparte",i:"Celina", d:"09:30",f:"14:30"},
  {date:"2026-05-28",h:"Bonaparte",i:"Massi",  d:"20:00",f:"07:30"},
  {date:"2026-05-28",h:"Bleu de Grenelle",i:"Lydia",  d:"08:00",f:"13:00"},
  {date:"2026-05-28",h:"Bonaparte",i:"Sabrina",d:"09:30",f:"14:30"},
  {date:"2026-05-28",h:"Bonaparte",i:"Celina", d:"09:30",f:"14:30"},
  {date:"2026-05-29",h:"Bonaparte",i:"Gaya",   d:"20:00",f:"07:30"},
  {date:"2026-05-29",h:"Bonaparte",i:"Gloria", d:"09:30",f:"14:30"},
  {date:"2026-05-29",h:"Bonaparte",i:"Sabrina",d:"09:30",f:"14:30"},
  {date:"2026-05-29",h:"Bleu de Grenelle",i:"Lydia",  d:"08:00",f:"13:00"},
  {date:"2026-05-30",h:"Bonaparte",i:"Youva",  d:"20:00",f:"07:30"},
  {date:"2026-05-30",h:"Villa Glamour",i:"Sina",   d:"19:00",f:"07:00"},
  {date:"2026-05-30",h:"Bleu de Grenelle",i:"Saloua", d:"08:30",f:"13:30"},
  {date:"2026-05-30",h:"Bleu de Grenelle",i:"Rayan",  d:"20:30",f:"07:30"},
  {date:"2026-05-31",h:"Bleu de Grenelle",i:"Lydia",  d:"08:30",f:"13:30"},
  {date:"2026-05-31",h:"Bonaparte",i:"Sabrina",d:"09:30",f:"14:30"},
  {date:"2026-05-31",h:"Bonaparte",i:"Sina",   d:"20:00",f:"07:30"},
  {date:"2026-05-31",h:"Bleu de Grenelle",i:"Saloua", d:"06:30",f:"13:30"},
  {date:"2026-05-31",h:"Bleu de Grenelle",i:"Massi",  d:"20:30",f:"07:30"},
];

const INIT_MISSIONS = RAW.map((r,i)=>({
  id:i+1, date:r.date,
  hotel: findH(r.h).nom,
  hotelColor: findH(r.h).color,
  intervenant: findI(r.i),
  debut:r.d, fin:r.f,
  heures: calcH(r.d,r.f),
  montant: findI(r.i).tarif * calcH(r.d,r.f),
  note:""
}));

// --- HELPERS ------------------------------------------------------
const lbl = {display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:5};
const inp = {width:"100%",padding:"9px 11px",borderRadius:9,border:"1.5px solid #E2E8F0",fontSize:12,color:"#1E293B",background:"#F8FAFC",outline:"none",boxSizing:"border-box"};
const bP  = {padding:"10px 0",borderRadius:11,border:"none",background:"#1C3557",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,width:"100%"};
const bS  = {padding:"10px 0",borderRadius:11,border:"1.5px solid #E2E8F0",background:"#F8FAFC",color:"#64748B",cursor:"pointer",fontWeight:600,fontSize:12,width:"100%"};

function Av({nom,color,size=28}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:color||"#94A3B8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:700,flexShrink:0}}>{nom.slice(0,2).toUpperCase()}</div>;
}

function Modal({title,onClose,children}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)",padding:14}}>
    <div style={{background:"#fff",borderRadius:18,padding:24,width:"min(96vw,440px)",boxShadow:"0 24px 60px rgba(0,0,0,0.25)",maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h2 style={{margin:0,fontSize:16,color:"#1C3557",fontFamily:"Georgia,serif"}}>{title}</h2>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94A3B8"}}>x</button>
      </div>
      {children}
    </div>
  </div>;
}

function ModalMission({date,prefInter,prefHotel,onClose,onSave,onDelete,existing,allIntervenants,allHotels}){
  const [hotel,setHotel]=useState(existing?.hotel||prefHotel||(allHotels||INIT_HOTELS)[0].nom);
  const [inter,setInter]=useState(existing?.intervenant||prefInter||(allIntervenants||INIT_INTERVENANTS)[0]);
  const [debut,setDebut]=useState(existing?.debut||"");
  const [fin,setFin]=useState(existing?.fin||"");
  const [note,setNote]=useState(existing?.note||"");
  const heures=calcH(debut,fin); const montant=inter.tarif*heures;
  const ok=debut&&fin&&heures>0;
  return <Modal title={existing?"Modifier la mission":`Mission - ${date?.split("-").reverse().join("/")}`} onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div><label style={lbl}>Hotel</label>
        <select style={inp} value={hotel} onChange={e=>setHotel(e.target.value)}>
          {(allHotels||INIT_HOTELS).map(h=><option key={h.nom}>{h.nom}</option>)}
        </select>
      </div>
      <div><label style={lbl}>Creneau</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={{...lbl,fontSize:10,color:"#94A3B8"}}>Debut</label><input type="time" style={inp} value={debut} onChange={e=>setDebut(e.target.value)}/></div>
          <div><label style={{...lbl,fontSize:10,color:"#94A3B8"}}>Fin</label><input type="time" style={inp} value={fin} onChange={e=>setFin(e.target.value)}/></div>
        </div>
        {heures>0&&<div style={{marginTop:6,padding:"6px 10px",background:"#F0F7FF",borderRadius:7,fontSize:11,color:"#1C3557",fontWeight:600}}>Duree : {heures}h {heures!==Math.floor(heures)?`(${Math.floor(heures)}h${Math.round((heures%1)*60)}min)`:""}</div>}
      </div>
      <div><label style={lbl}>Intervenant</label>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:180,overflowY:"auto"}}>
          {(allIntervenants||INIT_INTERVENANTS).map(i=><div key={i.id} onClick={()=>setInter(i)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:9,cursor:"pointer",border:"1.5px solid",borderColor:inter.id===i.id?"#1C3557":"#E2E8F0",background:inter.id===i.id?"#EBF0F8":"#F8FAFC"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Av nom={i.nom} color={i.color} size={26}/><div><div style={{fontSize:12,fontWeight:600,color:"#1E293B"}}>{i.nom}</div><div style={{fontSize:10,color:"#64748B"}}>{i.poste}</div></div></div>
            <div style={{fontSize:11,color:"#64748B",fontWeight:600}}>{i.tarif>0?`${i.tarif}EUR/h`:"Salarie"}</div>
          </div>)}
        </div>
      </div>
      <div><label style={lbl}>Note</label><input style={inp} placeholder="Remarque..." value={note} onChange={e=>setNote(e.target.value)}/></div>
      {montant>0&&<div style={{background:"#F0F7FF",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}><span style={{color:"#475569",fontSize:12}}>{heures}h x {inter.tarif}EUR/h</span><span style={{color:"#1C3557",fontWeight:700,fontSize:15}}>{montant.toFixed(2)}EUR</span></div>}
      <div style={{display:"flex",gap:8}}>
        {existing&&<button onClick={onDelete} style={{...bS,color:"#EF4444",borderColor:"#FEE2E2",flex:1}}>Supprimer</button>}
        <button onClick={onClose} style={{...bS,flex:1}}>Annuler</button>
        <button disabled={!ok} onClick={()=>onSave({hotel,hotelColor:findH(hotel).color,intervenant:inter,debut,fin,heures,montant,note})} style={{...bP,flex:2,opacity:ok?1:0.4}}>Confirmer</button>
      </div>
    </div>
  </Modal>;
}


// --- MODAL AJOUT INTERVENANT --------------------------------------
function ModalIntervenant({onClose,onSave}){
  const [nom,setNom]=useState(""); const [type,setType]=useState("auto");
  const [tarif,setTarif]=useState(14); const [color,setColor]=useState(COLORS_LIST[0]);
  const [siret,setSiret]=useState(""); const [adresse,setAdresse]=useState(""); const [poste,setPoste]=useState(POSTES[0]);
  const err=!nom.trim();
  return <Modal title="Nouvel intervenant" onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
      <div><label style={lbl}>Nom complet</label><input style={inp} placeholder="Prenom NOM" value={nom} onChange={e=>setNom(e.target.value)}/></div>
      <div><label style={lbl}>Statut</label><div style={{display:"flex",gap:6}}>
        {Object.entries(TYPE_MAP).map(([k,v])=><button key={k} onClick={()=>{setType(k);if(k==="salarie")setTarif(0);}} style={{flex:1,padding:"7px 4px",borderRadius:9,border:"1.5px solid",borderColor:type===k?"#1C3557":"#E2E8F0",background:type===k?"#EBF0F8":"#F8FAFC",color:type===k?"#1C3557":"#64748B",cursor:"pointer",fontSize:11,fontWeight:600}}>{v.label}</button>)}
      </div></div>
      <div><label style={lbl}>Poste</label><select style={inp} value={poste} onChange={e=>setPoste(e.target.value)}>{POSTES.map(p=><option key={p}>{p}</option>)}</select></div>
      {type!=="salarie"&&<div><label style={lbl}>Tarif (EUR/h)</label><input style={inp} type="number" min="1" max="100" value={tarif} onChange={e=>setTarif(Number(e.target.value))}/></div>}
      {type!=="salarie"&&<div><label style={lbl}>SIRET</label><input style={inp} placeholder="XXX XXX XXX" value={siret} onChange={e=>setSiret(e.target.value)}/></div>}
      <div><label style={lbl}>Couleur</label><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{COLORS_LIST.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #1C3557":"3px solid transparent",boxSizing:"border-box"}}/>)}</div></div>
      <div style={{background:"#F8FAFC",borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,border:"1px solid #E2E8F0"}}>
        <div style={{width:34,height:34,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{nom.slice(0,2).toUpperCase()||"NP"}</div>
        <div><div style={{fontWeight:600,color:"#1E293B",fontSize:12}}>{nom||"Prenom"}</div><div style={{fontSize:10,color:"#64748B"}}>{poste} - {type!=="salarie"?`${tarif}EUR/h`:"Salarie"}</div></div>
      </div>
      <div style={{display:"flex",gap:8}}><button onClick={onClose} style={{...bS,flex:1}}>Annuler</button><button disabled={err} onClick={()=>onSave({id:Date.now(),nom:nom.trim(),type,tarif,color,siret,adresse,poste})} style={{...bP,flex:2,opacity:err?0.4:1}}>Ajouter</button></div>
    </div>
  </Modal>;
}

// --- MODAL AJOUT HOTEL --------------------------------------------
function ModalHotel({onClose,onSave}){
  const [nom,setNom]=useState(""); const [adresse,setAdresse]=useState("");
  const [contact,setContact]=useState(""); const [tarif,setTarif]=useState(22);
  const [color,setColor]=useState(COLORS_LIST[0]);
  const err=!nom.trim();
  return <Modal title="Nouvel hotel client" onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
      <div><label style={lbl}>Nom de l hotel</label><input style={inp} placeholder="Hotel ..." value={nom} onChange={e=>setNom(e.target.value)}/></div>
      <div><label style={lbl}>Adresse</label><input style={inp} placeholder="Adresse complete" value={adresse} onChange={e=>setAdresse(e.target.value)}/></div>
      <div><label style={lbl}>Contact</label><input style={inp} placeholder="Responsable" value={contact} onChange={e=>setContact(e.target.value)}/></div>
      <div><label style={lbl}>Tarif facturation (EUR/h)</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[20,21,22,23,24,25,30,35,40].map(t=><button key={t} onClick={()=>setTarif(t)} style={{flex:1,minWidth:40,padding:"7px 4px",borderRadius:9,border:"1.5px solid",borderColor:tarif===t?"#1C3557":"#E2E8F0",background:tarif===t?"#1C3557":"#F8FAFC",color:tarif===t?"#fff":"#64748B",cursor:"pointer",fontSize:11,fontWeight:600}}>{t}EUR</button>)}
        </div>
      </div>
      <div><label style={lbl}>Couleur</label><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{COLORS_LIST.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #1C3557":"3px solid transparent",boxSizing:"border-box"}}/>)}</div></div>
      <div style={{background:"#F0F7FF",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #BFDBFE"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:"50%",background:color}}/><div><div style={{fontWeight:700,color:"#1C3557",fontSize:13}}>{nom||"Nom hotel"}</div><div style={{fontSize:10,color:"#64748B"}}>{adresse||"Adresse"}</div></div></div>
        <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:"#1C3557",fontSize:15}}>{tarif}EUR/h</div></div>
      </div>
      <div style={{display:"flex",gap:8}}><button onClick={onClose} style={{...bS,flex:1}}>Annuler</button><button disabled={err} onClick={()=>onSave({nom:nom.trim(),adresse,contact,tarif,color})} style={{...bP,flex:2,opacity:err?0.4:1}}>Ajouter</button></div>
    </div>
  </Modal>;
}


// --- MODAL ENVOI PLANNING -----------------------------------------
function ModalEnvoiPlanning({inter, missions, year, month, onClose}){
  const MOIS_LIST = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
  const ms = missions.filter(m=>
    m.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`) &&
    m.intervenant.id===inter.id
  ).sort((a,b)=>a.date.localeCompare(b.date));

  const totalH = ms.reduce((a,m)=>a+m.heures,0);
  const totalE = ms.reduce((a,m)=>a+m.montant,0);

  const [email, setEmail] = useState(inter.email||"");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const lignes = ms.map(m => {
    const d = m.date.split("-").reverse().join("/");
    const note = m.note ? " | Note : " + m.note : "";
    return d + "  |  " + m.hotel + " | " + m.debut + " - " + m.fin + " (" + m.heures + "h)" + note;
  }).join("\n");

  const planningText = [
    "BONEXTRAT - Planning " + MOIS_LIST[month] + " " + year,
    "=======================================",
    "Intervenant : " + inter.nom,
    "Poste : " + (inter.poste||""),
    "=======================================",
    "",
    lignes,
    "",
    "=======================================",
    "TOTAL : " + totalH + "h" + (totalE > 0 ? " - " + totalE.toFixed(2) + "EUR HT" : ""),
    "=======================================",
    "",
    "Ce planning vous a ete envoye par BONEXTRAT",
    "185 rue Saint-Denis, 75002 Paris",
    "bonextrat@outlook.com"
  ].join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(planningText).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false), 2000);
    });
  };

  const handleWhatsapp = () => {
    const txt = encodeURIComponent(planningText);
    window.open(`https://wa.me/?text=${txt}`, "_blank");
  };

  const handleEmail = () => {
    const subj = encodeURIComponent(`Votre planning Bonextrat - ${MOIS_LIST[month]} ${year}`);
    const body = encodeURIComponent(planningText);
    window.open(`mailto:${email}?subject=${subj}&body=${body}`, "_blank");
    setSent(true);
    setTimeout(()=>setSent(false), 2000);
  };

  const handleSMS = () => {
    const txt = encodeURIComponent(planningText);
    window.open(`sms:?body=${txt}`, "_blank");
  };

  return <Modal title={`Planning de ${inter.nom}`} onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* Recap */}
      <div style={{background:"#F0F7FF",borderRadius:12,padding:"12px 16px",border:"1px solid #BFDBFE"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:inter.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{inter.nom.slice(0,2).toUpperCase()}</div>
          <div>
            <div style={{fontWeight:700,color:"#1C3557",fontSize:13}}>{inter.nom}</div>
            <div style={{fontSize:11,color:"#64748B"}}>{inter.poste} - {MOIS_LIST[month]} {year}</div>
          </div>
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            <div style={{fontWeight:700,color:"#1C3557",fontSize:16}}>{totalH}h</div>
            {totalE>0&&<div style={{fontSize:11,color:"#065F46",fontWeight:600}}>{totalE.toFixed(2)}EUR</div>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:160,overflowY:"auto"}}>
          {ms.length===0
            ? <div style={{textAlign:"center",color:"#94A3B8",fontSize:12,padding:"10px 0"}}>Aucune mission ce mois</div>
            : ms.map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",background:"#fff",borderRadius:8,fontSize:11}}>
                <div>
                  <span style={{fontWeight:600,color:"#1E293B"}}>{m.date.split("-").reverse().join("/")}</span>
                  <span style={{color:"#64748B"}}> - {m.hotel}</span>
                </div>
                <div style={{color:"#1C3557",fontWeight:600}}>{m.debut}-{m.fin} ({m.heures}h)</div>
              </div>)
          }
        </div>
      </div>

      {/* Email input */}
      <div>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Email de {inter.nom} (optionnel)</label>
        <input
          style={{width:"100%",padding:"9px 11px",borderRadius:9,border:"1.5px solid #E2E8F0",fontSize:12,color:"#1E293B",background:"#F8FAFC",outline:"none",boxSizing:"border-box"}}
          placeholder="prenom@email.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
      </div>

      {/* Boutons envoi */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button onClick={handleWhatsapp} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px",borderRadius:11,border:"none",background:"#25D366",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12}}>
           WhatsApp
        </button>
        <button onClick={handleEmail} disabled={!email} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px",borderRadius:11,border:"none",background:sent?"#065F46":email?"#2563A8":"#94A3B8",color:"#fff",cursor:email?"pointer":"not-allowed",fontWeight:600,fontSize:12}}>
          {sent ? " Envoye !" : " Email"}
        </button>
        <button onClick={handleSMS} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px",borderRadius:11,border:"none",background:"#6D28D9",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12}}>
           SMS
        </button>
        <button onClick={handleCopy} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px",borderRadius:11,border:"1.5px solid #E2E8F0",background:copied?"#F0FDF4":"#fff",color:copied?"#065F46":"#475569",cursor:"pointer",fontWeight:600,fontSize:12}}>
          {copied ? " Copie !" : " Copier"}
        </button>
      </div>

      <button onClick={onClose} style={{padding:"10px",borderRadius:11,border:"1.5px solid #E2E8F0",background:"#F8FAFC",color:"#64748B",cursor:"pointer",fontWeight:600,fontSize:12}}>Fermer</button>
    </div>
  </Modal>;
}

// --- BLOC SHIFT ---------------------------------------------------
function ShiftBloc({m, onClick, mode}){
  const label = mode==="hotel" ? m.intervenant.nom : m.hotel.replace("Hotel ","");
  const color = mode==="hotel" ? m.intervenant.color : m.hotelColor;
  return <div onClick={()=>onClick(m)} style={{
    background:color, color:"#fff", borderRadius:5,
    padding:"2px 4px", marginBottom:2, cursor:"pointer",
    fontSize:9, fontWeight:600, lineHeight:1.3,
    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
    boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
    userSelect:"none",
  }}>
    <div>{label}</div>
    <div style={{fontSize:8,opacity:0.9}}>{m.debut}-{m.fin}</div>
  </div>;
}

// --- GRILLE SKELLO ------------------------------------------------
function GrilleSkello({missions, intervenants: inters, hotels: hotls, year, month, mode, onCellClick, onShiftClick, onSendPlanning}){
  const days = getDays(year, month);
  const allDays = Array.from({length:days},(_,i)=>i+1);

  // Lignes selon le mode
  const INTER_LIST = inters||INIT_INTERVENANTS;
  const HOTEL_LIST = hotls||INIT_HOTELS;
  const lignes = mode==="intervenant"
    ? INTER_LIST
    : HOTEL_LIST.map(h=>({id:h.nom, nom:h.nom, color:h.color, tarif:h.tarif}));

  const today = new Date();
  const isToday = (d) => d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();

  const getMissions = (ligne, day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    if(mode==="intervenant"){
      return missions.filter(m=>m.date===dateStr && m.intervenant.id===ligne.id);
    } else {
      return missions.filter(m=>m.date===dateStr && m.hotel===ligne.nom);
    }
  };

  const getTotalH = (ligne) => {
    const thisM = missions.filter(m=>{
      if(mode==="intervenant") return m.intervenant.id===ligne.id;
      return m.hotel===ligne.nom;
    });
    return thisM.reduce((a,m)=>a+m.heures,0);
  };

  const CELL_W = 36;
  const ROW_H = 64;

  return (
    <div style={{overflowX:"auto",borderRadius:14,border:"1px solid #E2E8F0",background:"#fff"}}>
      <div style={{minWidth: 180 + days*CELL_W}}>

        {/* HEADER jours */}
        <div style={{display:"flex",borderBottom:"1.5px solid #E2E8F0",background:"#F8FAFC",position:"sticky",top:0,zIndex:10}}>
          <div style={{width:180,minWidth:180,padding:"10px 14px",fontSize:11,fontWeight:700,color:"#475569",borderRight:"1px solid #E2E8F0"}}>
            {mode==="intervenant" ? "Intervenant" : "Hotel"}
          </div>
          {allDays.map(d=>{
            const fd = getFirstDay(year,month);
            const dayOfWeek = (fd + d - 1) % 7;
            const isWE = dayOfWeek>=5;
            return <div key={d} style={{
              width:CELL_W,minWidth:CELL_W,
              padding:"4px 2px",textAlign:"center",
              background: isToday(d)?"#1C3557": isWE?"#F1F5F9":"#F8FAFC",
              borderRight:"1px solid #E2E8F0",
            }}>
              <div style={{fontSize:8,color:isToday(d)?"#93B4D4":isWE?"#94A3B8":"#94A3B8",fontWeight:600}}>{JOURS_COURT[dayOfWeek]}</div>
              <div style={{fontSize:11,fontWeight:700,color:isToday(d)?"#fff":isWE?"#94A3B8":"#1C3557"}}>{d}</div>
            </div>;
          })}
          <div style={{width:70,minWidth:70,padding:"10px 6px",fontSize:10,fontWeight:700,color:"#475569",textAlign:"center",borderLeft:"1px solid #E2E8F0"}}>Total</div>
        </div>

        {/* LIGNES */}
        {lignes.map(ligne=>{
          const tH = getTotalH(ligne);
          return <div key={ligne.id||ligne.nom} style={{display:"flex",borderBottom:"1px solid #F1F5F9",minHeight:ROW_H}}>
            {/* Label ligne */}
            <div style={{width:180,minWidth:180,padding:"8px 12px",borderRight:"1px solid #E2E8F0",display:"flex",alignItems:"flex-start",gap:8,background:"#FAFBFC"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:mode==="intervenant"?ligne.color:ligne.color,marginTop:5,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#1E293B"}}>{ligne.nom}</div>
                <div style={{fontSize:10,color:"#64748B"}}>{mode==="intervenant"?ligne.poste:`${ligne.tarif}EUR/h`}</div>
                {mode==="intervenant"&&<div style={{marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                  <span style={{background:TYPE_MAP[ligne.type]?.bg,color:TYPE_MAP[ligne.type]?.color,padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:600}}>{TYPE_MAP[ligne.type]?.label}</span>
                  <button
                    onClick={()=>onSendPlanning&&onSendPlanning(ligne)}
                    title="Envoyer le planning"
                    style={{background:"#EBF0F8",border:"none",borderRadius:6,padding:"2px 6px",cursor:"pointer",fontSize:9,color:"#1C3557",fontWeight:600}}
                  > Envoyer</button>
                </div>}
              </div>
            </div>

            {/* Cellules jours */}
            {allDays.map(d=>{
              const fd = getFirstDay(year,month);
              const dayOfWeek = (fd + d - 1) % 7;
              const isWE = dayOfWeek>=5;
              const ms = getMissions(ligne, d);
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              return <div key={d}
                onClick={()=>ms.length===0&&onCellClick(dateStr, ligne)}
                style={{
                  width:CELL_W,minWidth:CELL_W,
                  padding:"3px 2px",
                  borderRight:"1px solid #E2E8F0",
                  background: isToday(d)?"#EBF0F8": isWE?"#F9FAFB":"#fff",
                  cursor:ms.length===0?"pointer":"default",
                  verticalAlign:"top",
                  position:"relative",
                }}>
                {ms.length===0 ? (
                  <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",opacity:0}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#94A3B8"}}>+</div>
                  </div>
                ) : ms.map(m=><ShiftBloc key={m.id} m={m} onClick={onShiftClick} mode={mode}/>)}
                {ms.length===0&&<div className="add-hint" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.15s"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#64748B",fontWeight:300}}>+</div>
                </div>}
              </div>;
            })}

            {/* Total ligne */}
            <div style={{width:70,minWidth:70,padding:"8px 6px",borderLeft:"1px solid #E2E8F0",textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",background:"#FAFBFC"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1C3557"}}>{tH}h</div>
              {mode==="hotel"&&tH>0&&<div style={{fontSize:9,color:"#065F46",fontWeight:600}}>{(tH*(HOTEL_LIST.find(h=>h.nom===ligne.nom)?.tarif||ligne.tarif||0)).toFixed(0)}EUR</div>}
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}

// --- APP ----------------------------------------------------------
export default function App(){
  const [year,setYear]=useState(2026);
  const [month,setMonth]=useState(4);
  const [intervenants,setIntervenants]=useState(INIT_INTERVENANTS);
  const [hotels,setHotels]=useState(INIT_HOTELS);
  const [missions,setMissions]=useState(INIT_MISSIONS);
  const [mode,setMode]=useState("intervenant");
  const [view,setView]=useState("grille");
  const [modal,setModal]=useState(null);
  const [modalData,setModalData]=useState(null);
  const [envoiInter,setEnvoiInter]=useState(null);

  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const thisM=missions.filter(m=>m.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`));

  const handleCellClick=(date,ligne)=>{
    setModalData({
      date,
      prefInter: mode==="intervenant"?ligne:null,
      prefHotel: mode==="hotel"?ligne.nom:null,
      existing: null,
    });
    setModal("mission");
  };

  const handleShiftClick=(m)=>{
    setModalData({date:m.date, prefInter:null, prefHotel:null, existing:m});
    setModal("mission");
  };

  const handleSave=(data)=>{
    if(modalData?.existing){
      setMissions(p=>p.map(m=>m.id===modalData.existing.id?{...m,...data}:m));
    } else {
      setMissions(p=>[...p,{...data,date:modalData.date,id:Date.now()}]);
    }
    setModal(null);
  };

  const handleDelete=()=>{
    setMissions(p=>p.filter(m=>m.id!==modalData.existing.id));
    setModal(null);
  };

  const totalH=thisM.reduce((a,m)=>a+m.heures,0);
  const totalCout=thisM.filter(m=>m.intervenant.type!=="salarie").reduce((a,m)=>a+m.montant,0);

  // FACTURES
  const factures=useMemo(()=>{
    const map={};
    thisM.forEach(m=>{
      if(m.intervenant.type==="salarie")return;
      const k=m.intervenant.id;
      if(!map[k])map[k]={inter:m.intervenant,missions:[],total:0,heures:0};
      map[k].missions.push(m);
      map[k].total+=m.montant;
      map[k].heures+=m.heures;
    });
    return Object.values(map).sort((a,b)=>b.total-a.total);
  },[thisM]);

  // STATS hotels
  const statsHotels=useMemo(()=>{
    const map={};
    thisM.forEach(m=>{map[m.hotel]=(map[m.hotel]||0)+m.heures;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  },[thisM]);

  return <div style={{minHeight:"100vh",background:"#F0F4F8",fontFamily:"'DM Sans',system-ui,sans-serif"}}>

    {/* HEADER */}
    <div style={{background:"#1C3557",boxShadow:"0 2px 16px rgba(28,53,87,0.4)"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"#2563A8",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff"}}>B</div>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:15,letterSpacing:"0.02em"}}>BONEXTRAT</div>
            <div style={{color:"#93B4D4",fontSize:9}}>Planning style Skello</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {[{id:"grille",label:" Planning"},{id:"factures",label:" Factures"},{id:"stats",label:" Stats"}].map(v=>
            <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:view===v.id?"#2563A8":"rgba(255,255,255,0.1)",color:view===v.id?"#fff":"#93B4D4"}}>{v.label}</button>
          )}
        </div>
      </div>
    </div>

    <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 14px"}}>

      {/* BARRE NAVIGATION */}
      <div style={{background:"#fff",borderRadius:14,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #E2E8F0",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={prev} style={{background:"#F1F5F9",border:"none",borderRadius:9,width:32,height:32,cursor:"pointer",fontSize:16,color:"#475569",display:"flex",alignItems:"center",justifyContent:"center"}}><</button>
          <div style={{textAlign:"center",minWidth:140}}>
            <div style={{fontWeight:700,fontSize:16,color:"#1C3557"}}>{MOIS[month]} {year}</div>
            <div style={{fontSize:10,color:"#94A3B8"}}>{thisM.length} missions - {totalH}h</div>
          </div>
          <button onClick={next} style={{background:"#F1F5F9",border:"none",borderRadius:9,width:32,height:32,cursor:"pointer",fontSize:16,color:"#475569",display:"flex",alignItems:"center",justifyContent:"center"}}>></button>
        </div>

        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {view==="grille"&&<div style={{display:"flex",gap:4,background:"#F1F5F9",padding:4,borderRadius:10}}>
            <button onClick={()=>setMode("intervenant")} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:mode==="intervenant"?"#fff":"transparent",color:mode==="intervenant"?"#1C3557":"#64748B",boxShadow:mode==="intervenant"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}> Par intervenant</button>
            <button onClick={()=>setMode("hotel")} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:mode==="hotel"?"#fff":"transparent",color:mode==="hotel"?"#1C3557":"#64748B",boxShadow:mode==="hotel"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}> Par hotel</button>
          </div>}
          <button onClick={()=>setModal("intervenant")} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:10,border:"1.5px solid #1C3557",background:"#fff",color:"#1C3557",cursor:"pointer",fontWeight:600,fontSize:11}}>
            <span style={{fontSize:14,fontWeight:300}}>+</span> Intervenant
          </button>
          <button onClick={()=>setModal("hotel")} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:10,border:"none",background:"#1C3557",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:11}}>
            <span style={{fontSize:14,fontWeight:300}}>+</span> Hotel
          </button>
        </div>

        {/* Totaux rapides */}
        <div style={{display:"flex",gap:12}}>
          {[
            {l:"Missions",v:thisM.length},
            {l:"Heures",v:`${totalH}h`},
            {l:"Cout AE",v:`${totalCout.toFixed(0)}EUR`},
          ].map(s=><div key={s.l} style={{textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1C3557"}}>{s.v}</div>
            <div style={{fontSize:9,color:"#94A3B8"}}>{s.l}</div>
          </div>)}
        </div>
      </div>

      {/* LEGENDE */}
      {view==="grille"&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {(mode==="intervenant"?intervenants:hotels).map((item,idx)=><div key={item.id||item.nom} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"#fff",border:"1px solid #E2E8F0",fontSize:11,color:"#475569",position:"relative"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:item.color}}/>
          {item.nom}
          {mode==="hotel"&&<button
            onClick={()=>{
              if(window.confirm(`Supprimer ${item.nom} ?`)){
                setHotels(p=>p.filter((_,i)=>i!==idx));
                setMissions(p=>p.filter(m=>m.hotel!==item.nom));
              }
            }}
            style={{marginLeft:4,background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:12,padding:"0 2px",lineHeight:1}}
          >x</button>}
          {mode==="intervenant"&&<button
            onClick={()=>{
              if(window.confirm(`Supprimer ${item.nom} ?`)){
                setIntervenants(p=>p.filter(i=>i.id!==item.id));
                setMissions(p=>p.filter(m=>m.intervenant.id!==item.id));
              }
            }}
            style={{marginLeft:4,background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:12,padding:"0 2px",lineHeight:1}}
          >x</button>}
        </div>)}
      </div>}

      {/* GRILLE SKELLO */}
      {view==="grille"&&<GrilleSkello
        missions={missions}
        intervenants={intervenants}
        hotels={hotels}
        year={year} month={month}
        mode={mode}
        onCellClick={handleCellClick}
        onShiftClick={handleShiftClick}
        onSendPlanning={(i)=>setEnvoiInter(i)}
      />}

      {/* FACTURES */}
      {view==="factures"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        {factures.length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8"}}><div style={{fontSize:48}}></div><div>Aucune facture</div></div>}
        {factures.map(({inter,missions:ms,total,heures})=><div key={inter.id} style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #E2E8F0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Av nom={inter.nom} color={inter.color} size={40}/>
              <div><div style={{fontWeight:700,color:"#1E293B",fontSize:14}}>{inter.nom}</div><div style={{fontSize:11,color:"#64748B"}}>{inter.poste}</div>{inter.siret&&<div style={{fontSize:10,color:"#94A3B8"}}>SIRET: {inter.siret}</div>}</div>
            </div>
            <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:700,color:"#1C3557"}}>{total.toFixed(2)}EUR</div><div style={{fontSize:11,color:"#94A3B8"}}>{heures}h HT</div></div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{borderBottom:"1.5px solid #E2E8F0"}}>{["Date","Hotel","Debut","Fin","H","Montant"].map(h=><th key={h} style={{textAlign:"left",padding:"5px 6px",color:"#64748B",fontWeight:600}}>{h}</th>)}</tr></thead>
            <tbody>{ms.sort((a,b)=>a.date.localeCompare(b.date)).map((m,i)=><tr key={i} style={{borderBottom:"1px solid #F1F5F9"}}>
              <td style={{padding:"6px"}}>{m.date.split("-").reverse().join("/")}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.hotel}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.debut}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.fin}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.heures}h</td>
              <td style={{padding:"6px",fontWeight:600,color:"#1C3557"}}>{m.montant.toFixed(2)}EUR</td>
            </tr>)}</tbody>
          </table>
          <div style={{marginTop:12,padding:"8px 12px",background:"#F0F7FF",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:"#475569"}}>{ms.length} mission(s)</span>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setEnvoiInter(inter)} style={{padding:"6px 12px",background:"#25D366",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontSize:11,fontWeight:600}}> Envoyer</button>
              <button style={{padding:"6px 12px",background:"#1C3557",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontSize:11,fontWeight:600}}>PDF</button>
            </div>
          </div>
        </div>)}
      </div>}

      {/* STATS */}
      {view==="stats"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
          {[
            {l:"Missions",v:thisM.length,s:"ce mois"},
            {l:"Heures",v:`${totalH}h`,s:"d'intervention"},
            {l:"Cout AE",v:`${totalCout.toFixed(0)}EUR`,s:"HT",c:"#065F46"},
            {l:"Hotels",v:statsHotels.length,s:"actifs"},
          ].map(s=><div key={s.l} style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.c||"#1C3557"}}>{s.v}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:3}}>{s.s}</div>
          </div>)}
        </div>
        <div style={{background:"#fff",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <h3 style={{margin:"0 0 14px",fontSize:13,color:"#1C3557",fontWeight:700}}>Heures par intervenant</h3>
          {intervenants.map(i=>{
            const h=thisM.filter(m=>m.intervenant.id===i.id).reduce((a,m)=>a+m.heures,0);
            if(!h)return null;
            return <div key={i.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:i.color}}/><span style={{fontSize:12,color:"#475569"}}>{i.nom}</span></div>
                <span style={{fontSize:12,fontWeight:700,color:"#1C3557"}}>{h}h</span>
              </div>
              <div style={{height:5,background:"#F1F5F9",borderRadius:99}}><div style={{height:"100%",borderRadius:99,background:i.color,width:`${Math.round(h/totalH*100)}%`,transition:"width 0.5s"}}/></div>
            </div>;
          })}
        </div>
        <div style={{background:"#fff",borderRadius:12,padding:18,border:"1px solid #E2E8F0"}}>
          <h3 style={{margin:"0 0 14px",fontSize:13,color:"#1C3557",fontWeight:700}}>Heures par hotel</h3>
          {statsHotels.map(([h,n])=>{
          const hInfo=hotels.find(x=>x.nom===h);
          const tarifH=hInfo?.tarif||0;
          return <div key={h} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <div style={{display:"flex",flexDirection:"column"}}><span style={{fontSize:12,color:"#475569"}}>{h}</span>{tarifH>0&&<span style={{fontSize:10,color:"#065F46",fontWeight:600}}>CA: {(n*tarifH).toFixed(0)}EUR</span>}</div>
              <span style={{fontSize:12,fontWeight:700,color:"#1C3557"}}>{n}h</span>
            </div>
            <div style={{height:5,background:"#F1F5F9",borderRadius:99}}><div style={{height:"100%",borderRadius:99,background:"#1C3557",width:`${Math.round(n/totalH*100)}%`}}/></div>
          </div>;
        })}
        </div>
      </div>}

      {/* HINT */}
      {view==="grille"&&<div style={{marginTop:12,fontSize:11,color:"#94A3B8",textAlign:"center"}}>
        Cliquez sur une case vide pour ajouter - Cliquez sur un shift pour modifier
      </div>}
    </div>

    {/* MODAL */}
    {envoiInter&&<ModalEnvoiPlanning
      inter={envoiInter}
      missions={missions}
      year={year}
      month={month}
      onClose={()=>setEnvoiInter(null)}
    />}
    {modal==="mission"&&<ModalMission
      date={modalData?.date}
      prefInter={modalData?.prefInter}
      prefHotel={modalData?.prefHotel}
      existing={modalData?.existing}
      allIntervenants={intervenants}
      allHotels={hotels}
      onClose={()=>setModal(null)}
      onSave={handleSave}
      onDelete={handleDelete}
    />}
    {modal==="intervenant"&&<ModalIntervenant onClose={()=>setModal(null)} onSave={i=>{setIntervenants(p=>[...p,i]);setModal(null);}}/>}
    {modal==="hotel"&&<ModalHotel onClose={()=>setModal(null)} onSave={h=>{setHotels(p=>[...p,h]);setModal(null);}}/>}
  </div>;
}

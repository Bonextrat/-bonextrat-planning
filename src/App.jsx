import { useState, useMemo, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGSuQYfId3GAtymM0S11mnxVlrIk0CHA4",
  authDomain: "bonextrat.firebaseapp.com",
  projectId: "bonextrat",
  storageBucket: "bonextrat.firebasestorage.app",
  messagingSenderId: "342486455356",
  appId: "1:342486455356:web:599da94e280297858e1f39"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TYPE_MAP = {
  salarie: { label:"Salarie",  bg:"#DBEAFE", color:"#1D4ED8" },
  auto:    { label:"Auto-Ent", bg:"#D1FAE5", color:"#065F46" },
  associe: { label:"Associe",  bg:"#FEF3C7", color:"#92400E" },
};
const POSTES = ["Receptionniste","Femme de chambre","Valet","Night Auditor","Concierge","Bagagiste","Room Service","Chef de reception","Agent accueil","Veilleur de nuit"];
const COLORS_LIST = ["#2563A8","#065F46","#1C3557","#0891B2","#0369A1","#B45309","#6D28D9","#BE185D","#0F766E","#DC2626","#D97706","#0E7490","#047857"];
const MOIS = ["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
const JOURS_COURT = ["L","M","M","J","V","S","D"];

const INIT_INTERVENANTS = [
  { id:"1",  nom:"Gaya",    type:"salarie",  tarif:0,  color:"#2563A8", poste:"Veilleur de nuit"  },
  { id:"2",  nom:"Massi",   type:"associe",  tarif:19, color:"#065F46", poste:"Receptionniste"    },
  { id:"3",  nom:"Sina",    type:"associe",  tarif:19, color:"#1C3557", poste:"Receptionniste"    },
  { id:"4",  nom:"Youva",   type:"auto",     tarif:14, color:"#0891B2", poste:"Receptionniste"    },
  { id:"5",  nom:"Riad",    type:"auto",     tarif:14, color:"#0369A1", poste:"Receptionniste"    },
  { id:"6",  nom:"Walid",   type:"auto",     tarif:14, color:"#B45309", poste:"Receptionniste"    },
  { id:"7",  nom:"Lydia",   type:"auto",     tarif:14, color:"#6D28D9", poste:"Receptionniste"    },
  { id:"8",  nom:"Gloria",  type:"auto",     tarif:14, color:"#BE185D", poste:"Receptionniste"    },
  { id:"9",  nom:"Yaman",   type:"auto",     tarif:14, color:"#0F766E", poste:"Night Auditor"     },
  { id:"10", nom:"Rayan",   type:"auto",     tarif:14, color:"#DC2626", poste:"Receptionniste"    },
  { id:"11", nom:"Celina",  type:"auto",     tarif:14, color:"#D97706", poste:"Receptionniste"    },
  { id:"12", nom:"Sabrina", type:"auto",     tarif:14, color:"#0E7490", poste:"Receptionniste"    },
  { id:"13", nom:"Saloua",  type:"auto",     tarif:14, color:"#047857", poste:"Femme de chambre"  },
];

const INIT_HOTELS = [
  { id:"h1", nom:"Hotel Bonaparte",        tarif:40, color:"#1C3557" },
  { id:"h2", nom:"Hotel Bleu de Grenelle", tarif:22, color:"#2563A8" },
  { id:"h3", nom:"Villa Glamour",          tarif:22, color:"#6D28D9" },
  { id:"h4", nom:"Hotel Drouot",           tarif:22, color:"#0891B2" },
];

function findI(nom,arr){ return (arr||INIT_INTERVENANTS).find(i=>i.nom.toLowerCase()===nom.toLowerCase())||{id:"99",nom,type:"auto",tarif:14,color:"#94A3B8",poste:"Receptionniste"}; }
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
        <h2 style={{margin:0,fontSize:16,color:"#1C3557"}}>{title}</h2>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94A3B8"}}>X</button>
      </div>
      {children}
    </div>
  </div>;
}

function ModalMission({date,prefInter,prefHotel,onClose,onSave,onDelete,existing,allIntervenants,allHotels}){
  const hotels = allHotels||INIT_HOTELS;
  const intervenants = allIntervenants||INIT_INTERVENANTS;
  const [hotel,setHotel]=useState(existing?.hotel||prefHotel||hotels[0].nom);
  const [inter,setInter]=useState(existing?.intervenant||prefInter||intervenants[0]);
  const [debut,setDebut]=useState(existing?.debut||"");
  const [fin,setFin]=useState(existing?.fin||"");
  const [note,setNote]=useState(existing?.note||"");
  const heures=calcH(debut,fin);
  const montant=inter.tarif*heures;
  const ok=debut&&fin&&heures>0;
  return <Modal title={existing?"Modifier":"Mission - "+date} onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div><label style={lbl}>Hotel</label>
        <select style={inp} value={hotel} onChange={e=>setHotel(e.target.value)}>
          {hotels.map(h=><option key={h.nom}>{h.nom}</option>)}
        </select>
      </div>
      <div><label style={lbl}>Creneau</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={{...lbl,fontSize:10}}>Debut</label><input type="time" style={inp} value={debut} onChange={e=>setDebut(e.target.value)}/></div>
          <div><label style={{...lbl,fontSize:10}}>Fin</label><input type="time" style={inp} value={fin} onChange={e=>setFin(e.target.value)}/></div>
        </div>
        {heures>0&&<div style={{marginTop:6,padding:"6px 10px",background:"#F0F7FF",borderRadius:7,fontSize:11,color:"#1C3557",fontWeight:600}}>Duree : {heures}h</div>}
      </div>
      <div><label style={lbl}>Intervenant</label>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:180,overflowY:"auto"}}>
          {intervenants.map(i=><div key={i.id} onClick={()=>setInter(i)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:9,cursor:"pointer",border:"1.5px solid",borderColor:inter.id===i.id?"#1C3557":"#E2E8F0",background:inter.id===i.id?"#EBF0F8":"#F8FAFC"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Av nom={i.nom} color={i.color} size={26}/><div><div style={{fontSize:12,fontWeight:600,color:"#1E293B"}}>{i.nom}</div><div style={{fontSize:10,color:"#64748B"}}>{i.poste}</div></div></div>
            <div style={{fontSize:11,color:"#64748B",fontWeight:600}}>{i.tarif>0?i.tarif+"EUR/h":"Salarie"}</div>
          </div>)}
        </div>
      </div>
      <div><label style={lbl}>Note</label><input style={inp} placeholder="Remarque..." value={note} onChange={e=>setNote(e.target.value)}/></div>
      {montant>0&&<div style={{background:"#F0F7FF",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}><span style={{color:"#475569",fontSize:12}}>{heures}h x {inter.tarif}EUR/h</span><span style={{color:"#1C3557",fontWeight:700,fontSize:15}}>{montant.toFixed(2)} EUR</span></div>}
      <div style={{display:"flex",gap:8}}>
        {existing&&<button onClick={onDelete} style={{...bS,color:"#EF4444",borderColor:"#FEE2E2",flex:1}}>Supprimer</button>}
        <button onClick={onClose} style={{...bS,flex:1}}>Annuler</button>
        <button disabled={!ok} onClick={()=>onSave({hotel,hotelColor:findH(hotel,allHotels).color,intervenant:inter,debut,fin,heures,montant,note})} style={{...bP,flex:2,opacity:ok?1:0.4}}>Confirmer</button>
      </div>
    </div>
  </Modal>;
}

function ModalIntervenant({onClose,onSave}){
  const [nom,setNom]=useState("");
  const [type,setType]=useState("auto");
  const [tarif,setTarif]=useState(14);
  const [color,setColor]=useState(COLORS_LIST[0]);
  const [siret,setSiret]=useState("");
  const [poste,setPoste]=useState(POSTES[0]);
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
        <div style={{width:34,height:34,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{nom.slice(0,2).toUpperCase()||"NP"}</div>
        <div><div style={{fontWeight:600,color:"#1E293B",fontSize:12}}>{nom||"Prenom"}</div><div style={{fontSize:10,color:"#64748B"}}>{poste} - {type!=="salarie"?tarif+"EUR/h":"Salarie"}</div></div>
      </div>
      <div style={{display:"flex",gap:8}}><button onClick={onClose} style={{...bS,flex:1}}>Annuler</button><button disabled={err} onClick={()=>onSave({nom:nom.trim(),type,tarif,color,siret,poste})} style={{...bP,flex:2,opacity:err?0.4:1}}>Ajouter</button></div>
    </div>
  </Modal>;
}

function ModalHotel({onClose,onSave}){
  const [nom,setNom]=useState("");
  const [adresse,setAdresse]=useState("");
  const [contact,setContact]=useState("");
  const [tarif,setTarif]=useState(22);
  const [color,setColor]=useState(COLORS_LIST[0]);
  const err=!nom.trim();
  return <Modal title="Nouvel hotel client" onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
      <div><label style={lbl}>Nom</label><input style={inp} placeholder="Hotel ..." value={nom} onChange={e=>setNom(e.target.value)}/></div>
      <div><label style={lbl}>Adresse</label><input style={inp} placeholder="Adresse" value={adresse} onChange={e=>setAdresse(e.target.value)}/></div>
      <div><label style={lbl}>Contact</label><input style={inp} placeholder="Responsable" value={contact} onChange={e=>setContact(e.target.value)}/></div>
      <div><label style={lbl}>Tarif facturation (EUR/h)</label>
        <input style={inp} type="number" min="0" step="0.01" placeholder="ex: 21.50" value={tarif} onChange={e=>setTarif(Number(e.target.value))}/>
        <div style={{fontSize:10,color:"#94A3B8",marginTop:4}}>Saisissez le tarif librement : 21, 21.5, 22.75...</div>
      </div>
      <div><label style={lbl}>Couleur</label><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{COLORS_LIST.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #1C3557":"3px solid transparent",boxSizing:"border-box"}}/>)}</div></div>
      <div style={{background:"#F0F7FF",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #BFDBFE"}}>
        <div><div style={{fontWeight:700,color:"#1C3557",fontSize:13}}>{nom||"Nom hotel"}</div><div style={{fontSize:10,color:"#64748B"}}>{adresse||"Adresse"}</div></div>
        <div style={{fontWeight:700,color:"#1C3557",fontSize:15}}>{tarif} EUR/h</div>
      </div>
      <div style={{display:"flex",gap:8}}><button onClick={onClose} style={{...bS,flex:1}}>Annuler</button><button disabled={err} onClick={()=>onSave({nom:nom.trim(),adresse,contact,tarif,color})} style={{...bP,flex:2,opacity:err?0.4:1}}>Ajouter</button></div>
    </div>
  </Modal>;
}


function ModalEditIntervenant({inter, onClose, onSave, onDelete}){
  const [nom,setNom]=useState(inter.nom);
  const [type,setType]=useState(inter.type);
  const [tarif,setTarif]=useState(inter.tarif);
  const [color,setColor]=useState(inter.color);
  const [siret,setSiret]=useState(inter.siret||"");
  const [poste,setPoste]=useState(inter.poste||POSTES[0]);
  const err=!nom.trim();
  return <Modal title={"Modifier - "+inter.nom} onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
      <div><label style={lbl}>Nom complet</label><input style={inp} value={nom} onChange={e=>setNom(e.target.value)}/></div>
      <div><label style={lbl}>Statut</label><div style={{display:"flex",gap:6}}>
        {Object.entries(TYPE_MAP).map(([k,v])=><button key={k} onClick={()=>{setType(k);if(k==="salarie")setTarif(0);}} style={{flex:1,padding:"7px 4px",borderRadius:9,border:"1.5px solid",borderColor:type===k?"#1C3557":"#E2E8F0",background:type===k?"#EBF0F8":"#F8FAFC",color:type===k?"#1C3557":"#64748B",cursor:"pointer",fontSize:11,fontWeight:600}}>{v.label}</button>)}
      </div></div>
      <div><label style={lbl}>Poste</label><select style={inp} value={poste} onChange={e=>setPoste(e.target.value)}>{POSTES.map(p=><option key={p}>{p}</option>)}</select></div>
      {type!=="salarie"&&<div><label style={lbl}>Tarif (EUR/h)</label><input style={inp} type="number" min="0" step="0.5" value={tarif} onChange={e=>setTarif(Number(e.target.value))}/></div>}
      {type!=="salarie"&&<div><label style={lbl}>SIRET</label><input style={inp} placeholder="XXX XXX XXX" value={siret} onChange={e=>setSiret(e.target.value)}/></div>}
      <div><label style={lbl}>Couleur</label><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{COLORS_LIST.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #1C3557":"3px solid transparent",boxSizing:"border-box"}}/>)}</div></div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={()=>{if(window.confirm("Supprimer "+inter.nom+" ?"))onDelete(inter.id);}} style={{flex:1,padding:"10px",borderRadius:11,border:"1.5px solid #FEE2E2",background:"#FEF2F2",color:"#EF4444",cursor:"pointer",fontWeight:600,fontSize:12}}>Supprimer</button>
        <button onClick={onClose} style={{...bS,flex:1}}>Annuler</button>
        <button disabled={err} onClick={()=>onSave(inter.id,{nom:nom.trim(),type,tarif,color,siret,poste})} style={{...bP,flex:2,opacity:err?0.4:1}}>Enregistrer</button>
      </div>
    </div>
  </Modal>;
}

function ModalEditHotel({hotel, onClose, onSave, onDelete}){
  const [nom,setNom]=useState(hotel.nom);
  const [adresse,setAdresse]=useState(hotel.adresse||"");
  const [contact,setContact]=useState(hotel.contact||"");
  const [tarif,setTarif]=useState(hotel.tarif||0);
  const [color,setColor]=useState(hotel.color||COLORS_LIST[0]);
  const err=!nom.trim();
  return <Modal title={"Modifier - "+hotel.nom} onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:13}}>
      <div><label style={lbl}>Nom de l hotel</label><input style={inp} value={nom} onChange={e=>setNom(e.target.value)}/></div>
      <div><label style={lbl}>Adresse</label><input style={inp} placeholder="Adresse" value={adresse} onChange={e=>setAdresse(e.target.value)}/></div>
      <div><label style={lbl}>Contact</label><input style={inp} placeholder="Responsable" value={contact} onChange={e=>setContact(e.target.value)}/></div>
      <div><label style={lbl}>Tarif facturation (EUR/h)</label>
        <input style={inp} type="number" min="0" step="0.01" placeholder="ex: 21.50" value={tarif} onChange={e=>setTarif(Number(e.target.value))}/>
        <div style={{fontSize:10,color:"#94A3B8",marginTop:4}}>Saisissez librement : 21, 21.5, 22.75...</div>
      </div>
      <div><label style={lbl}>Couleur</label><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{COLORS_LIST.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #1C3557":"3px solid transparent",boxSizing:"border-box"}}/>)}</div></div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={()=>{if(window.confirm("Supprimer "+hotel.nom+" ?"))onDelete(hotel.id||hotel.nom);}} style={{flex:1,padding:"10px",borderRadius:11,border:"1.5px solid #FEE2E2",background:"#FEF2F2",color:"#EF4444",cursor:"pointer",fontWeight:600,fontSize:12}}>Supprimer</button>
        <button onClick={onClose} style={{...bS,flex:1}}>Annuler</button>
        <button disabled={err} onClick={()=>onSave(hotel.id||hotel.nom,{nom:nom.trim(),adresse,contact,tarif,color})} style={{...bP,flex:2,opacity:err?0.4:1}}>Enregistrer</button>
      </div>
    </div>
  </Modal>;
}


function exportExcel(missions, intervenants, hotels, year, month, MOIS){
  const allMissions = missions.sort((a,b)=>a.date.localeCompare(b.date));

  // Build CSV content with multiple sheets simulated
  const now = new Date().toLocaleDateString("fr-FR");

  // Sheet 1 - All missions
  let csv = "BONEXTRAT - Export donnees - "+now+"\n\n";
  csv += "=== MISSIONS ===\n";
  csv += "Date,Hotel,Intervenant,Poste,Debut,Fin,Heures,Montant EUR,Type\n";
  allMissions.forEach(m=>{
    csv += [
      m.date.split("-").reverse().join("/"),
      '"'+m.hotel+'"',
      '"'+m.intervenant.nom+'"',
      '"'+(m.intervenant.poste||"")+'"',
      m.debut,
      m.fin,
      m.heures,
      m.montant.toFixed(2),
      m.intervenant.type
    ].join(",")+"
";
  });

  csv += "\n=== INTERVENANTS ===\n";
  csv += "Nom,Type,Poste,Tarif EUR/h,SIRET\n";
  intervenants.forEach(i=>{
    csv += ['"'+i.nom+'"',i.type,'"'+(i.poste||"")+'"',i.tarif,'"'+(i.siret||"")+'"'].join(",")+"
";
  });

  csv += "\n=== HOTELS ===\n";
  csv += "Nom,Tarif EUR/h,Adresse,Contact\n";
  hotels.forEach(h=>{
    csv += ['"'+h.nom+'"',h.tarif||0,'"'+(h.adresse||"")+'"','"'+(h.contact||"")+'"'].join(",")+"
";
  });

  csv += "\n=== RESUME PAR INTERVENANT ===\n";
  csv += "Intervenant,Type,Total Heures,Total Missions,Montant Total EUR\n";
  intervenants.forEach(i=>{
    const ms=allMissions.filter(m=>m.intervenant.id===i.id);
    const h=ms.reduce((a,m)=>a+m.heures,0);
    const e=ms.reduce((a,m)=>a+m.montant,0);
    if(h>0) csv += ['"'+i.nom+'"',i.type,h,ms.length,e.toFixed(2)].join(",")+"
";
  });

  csv += "\n=== RESUME PAR HOTEL ===\n";
  csv += "Hotel,Tarif EUR/h,Total Heures,Total Missions,CA EUR\n";
  hotels.forEach(h=>{
    const ms=allMissions.filter(m=>m.hotel===h.nom);
    const nh=ms.reduce((a,m)=>a+m.heures,0);
    const ca=nh*(h.tarif||0);
    if(nh>0) csv += ['"'+h.nom+'"',h.tarif||0,nh,ms.length,ca.toFixed(2)].join(",")+"
";
  });

  csv += "\n=== RESUME PAR MOIS "+year+" ===\n";
  csv += "Mois,Total Heures,Total Missions,Cout AE EUR\n";
  MOIS.forEach((m,i)=>{
    const prefix=year+"-"+String(i+1).padStart(2,"0");
    const ms=allMissions.filter(m2=>m2.date.startsWith(prefix));
    const h=ms.reduce((a,m2)=>a+m2.heures,0);
    const e=ms.filter(m2=>m2.intervenant.type!=="salarie").reduce((a,m2)=>a+m2.montant,0);
    if(ms.length>0) csv += ['"'+m+" "+year+'"',h,ms.length,e.toFixed(2)].join(",")+"
";
  });

  // Download
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Bonextrat_Export_"+now.replace(/\//g,"-")+".csv";
  a.click();
  URL.revokeObjectURL(url);
}

function generatePDF(inter, ms, year, month, showPrix, MOIS){
  const totalH=ms.reduce((a,m)=>a+m.heures,0);
  const totalE=ms.reduce((a,m)=>a+m.montant,0);

  const rows=ms.map(m=>{
    const d=m.date.split("-").reverse().join("/");
    const prix=showPrix&&m.montant>0?"<td style='padding:8px 12px;text-align:right;font-weight:600;color:#065F46;'>"+m.montant.toFixed(2)+" EUR</td>":"";
    return "<tr style='border-bottom:1px solid #F1F5F9;'><td style='padding:8px 12px;font-weight:600;color:#1E293B;'>"+d+"</td><td style='padding:8px 12px;color:#475569;'>"+m.hotel+"</td><td style='padding:8px 12px;color:#475569;text-align:center;'>"+m.debut+"</td><td style='padding:8px 12px;color:#475569;text-align:center;'>"+m.fin+"</td><td style='padding:8px 12px;color:#1C3557;font-weight:600;text-align:center;'>"+m.heures+"h</td>"+prix+"</tr>";
  }).join("");

  const colPrix=showPrix?"<th style='padding:10px 12px;text-align:right;'>Montant</th>":"";
  const totalRow=showPrix?"<td colspan='4'></td><td style='padding:10px 12px;text-align:center;font-weight:700;color:#1C3557;'>"+totalH+"h</td><td style='padding:10px 12px;text-align:right;font-weight:700;color:#065F46;'>"+totalE.toFixed(2)+" EUR HT</td>":"<td colspan='4'></td><td style='padding:10px 12px;text-align:center;font-weight:700;color:#1C3557;'>"+totalH+"h</td>";

  const html="<!DOCTYPE html><html><head><meta charset='UTF-8'/><title>Planning "+inter.nom+"</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:system-ui,sans-serif;color:#1E293B;background:#fff;}@media print{.no-print{display:none;}}</style></head><body style='padding:0;'>"
  +"<div style='background:#1C3557;padding:24px 32px;'>"
  +"<div style='color:#fff;font-size:22px;font-weight:700;letter-spacing:0.05em;'>BONEXTRAT</div>"
  +"<div style='color:#93B4D4;font-size:11px;margin-top:4px;'>185 rue Saint-Denis, 75002 Paris | bonextrat@outlook.com</div>"
  +"</div>"
  +"<div style='padding:24px 32px;'>"
  +"<div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #E2E8F0;'>"
  +"<div>"
  +"<div style='font-size:18px;font-weight:700;color:#1C3557;'>Planning "+MOIS[month]+" "+year+"</div>"
  +"<div style='font-size:14px;color:#475569;margin-top:4px;'>"+inter.nom+" - "+inter.poste+"</div>"
  +"</div>"
  +"<div style='text-align:right;'>"
  +"<div style='font-size:28px;font-weight:700;color:#1C3557;'>"+totalH+"h</div>"
  +"<div style='font-size:11px;color:#94A3B8;'>"+ms.length+" mission(s)</div>"
  +(showPrix&&totalE>0?"<div style='font-size:13px;font-weight:700;color:#065F46;margin-top:4px;'>"+totalE.toFixed(2)+" EUR HT</div>":"")
  +"</div></div>"
  +"<table style='width:100%;border-collapse:collapse;font-size:12px;'>"
  +"<thead><tr style='background:#1C3557;color:#fff;'>"
  +"<th style='padding:10px 12px;text-align:left;'>Date</th>"
  +"<th style='padding:10px 12px;text-align:left;'>Hotel</th>"
  +"<th style='padding:10px 12px;text-align:center;'>Debut</th>"
  +"<th style='padding:10px 12px;text-align:center;'>Fin</th>"
  +"<th style='padding:10px 12px;text-align:center;'>Heures</th>"
  +colPrix
  +"</tr></thead><tbody>"+rows+"</tbody>"
  +"<tfoot><tr style='background:#F0F7FF;font-weight:700;'>"+totalRow+"</tr></tfoot>"
  +"</table>"
  +"<div style='margin-top:32px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:10px;color:#94A3B8;text-align:center;'>Document genere par BONEXTRAT - Confidentiel</div>"
  +"</div>"
  +"<div class='no-print' style='position:fixed;bottom:20px;right:20px;display:flex;gap:10px;'>"
  +"<button onclick='window.print()' style='padding:12px 24px;background:#1C3557;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;'>Imprimer / Sauvegarder PDF</button>"
  +"<button onclick='window.close()' style='padding:12px 24px;background:#F1F5F9;color:#475569;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;'>Fermer</button>"
  +"</div>"
  +"</body></html>";

  const w=window.open("","_blank","width=900,height=700");
  w.document.write(html);
  w.document.close();
}

function ModalEnvoiPlanning({inter,missions,year,month,onClose}){
  const ms=missions.filter(m=>m.date.startsWith(year+"-"+String(month+1).padStart(2,"0"))&&m.intervenant.id===inter.id).sort((a,b)=>a.date.localeCompare(b.date));
  const totalH=ms.reduce((a,m)=>a+m.heures,0);
  const totalE=ms.reduce((a,m)=>a+m.montant,0);
  const [email,setEmail]=useState(inter.email||"");
  const [copied,setCopied]=useState(false);
  const [showPrix,setShowPrix]=useState(false);
  const lignes=ms.map(m=>{const d=m.date.split("-").reverse().join("/");const prix=showPrix&&m.montant>0?" - "+m.montant.toFixed(2)+" EUR":"";return d+" | "+m.hotel+" | "+m.debut+"-"+m.fin+" ("+m.heures+"h)"+prix;}).join("\n");
  const total=showPrix?"TOTAL : "+totalH+"h"+(totalE>0?" - "+totalE.toFixed(2)+" EUR HT":""):"TOTAL : "+totalH+"h";
  const txt=["BONEXTRAT - Planning "+MOIS[month]+" "+year,"=======================================","Intervenant : "+inter.nom,"Poste : "+(inter.poste||""),"=======================================","",lignes,"","=======================================",total,"=======================================","","bonextrat@outlook.com"].join("\n");
  const copy=()=>{navigator.clipboard.writeText(txt).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const wa=()=>window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");
  const mail=()=>window.open("mailto:"+email+"?subject=Planning Bonextrat "+MOIS[month]+" "+year+"&body="+encodeURIComponent(txt),"_blank");
  const sms=()=>window.open("sms:?body="+encodeURIComponent(txt),"_blank");
  return <Modal title={"Planning de "+inter.nom} onClose={onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"#F0F7FF",borderRadius:12,padding:"12px 16px",border:"1px solid #BFDBFE"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <Av nom={inter.nom} color={inter.color} size={36}/>
          <div><div style={{fontWeight:700,color:"#1C3557",fontSize:13}}>{inter.nom}</div><div style={{fontSize:11,color:"#64748B"}}>{MOIS[month]} {year}</div></div>
          <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontWeight:700,color:"#1C3557",fontSize:16}}>{totalH}h</div>{totalE>0&&<div style={{fontSize:11,color:"#065F46"}}>{totalE.toFixed(2)} EUR</div>}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:150,overflowY:"auto"}}>
          {ms.length===0?<div style={{color:"#94A3B8",fontSize:12,textAlign:"center"}}>Aucune mission</div>:ms.map((m,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",background:"#fff",borderRadius:7,fontSize:11}}>
            <span style={{fontWeight:600}}>{m.date.split("-").reverse().join("/")} - {m.hotel}</span>
            <span style={{color:"#1C3557",fontWeight:600}}>{m.debut}-{m.fin}</span>
          </div>)}
        </div>
      </div>
      <div><label style={lbl}>Email (optionnel)</label><input style={inp} placeholder="email@exemple.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#F8FAFC",borderRadius:10,border:"1px solid #E2E8F0"}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#1E293B"}}>Afficher les prix dans le planning</div>
          <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>Si desactive, seules les heures sont visibles</div>
        </div>
        <div onClick={()=>setShowPrix(p=>!p)} style={{width:44,height:24,borderRadius:12,background:showPrix?"#1C3557":"#D1D5DB",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:showPrix?22:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
        </div>
      </div>
      <button onClick={()=>generatePDF(inter,ms,year,month,showPrix,MOIS)} style={{padding:"12px",borderRadius:11,border:"none",background:"#1C3557",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        Generer PDF
      </button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button onClick={wa} style={{padding:"11px",borderRadius:11,border:"none",background:"#25D366",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12}}>WhatsApp</button>
        <button onClick={mail} disabled={!email} style={{padding:"11px",borderRadius:11,border:"none",background:email?"#2563A8":"#94A3B8",color:"#fff",cursor:email?"pointer":"not-allowed",fontWeight:600,fontSize:12}}>Email</button>
        <button onClick={sms} style={{padding:"11px",borderRadius:11,border:"none",background:"#6D28D9",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12}}>SMS</button>
        <button onClick={copy} style={{padding:"11px",borderRadius:11,border:"1.5px solid #E2E8F0",background:copied?"#F0FDF4":"#fff",color:copied?"#065F46":"#475569",cursor:"pointer",fontWeight:600,fontSize:12}}>{copied?"Copie !":"Copier"}</button>
      </div>
      <button onClick={onClose} style={{...bS}}>Fermer</button>
    </div>
  </Modal>;
}

function ShiftBloc({m,onClick,mode}){
  const label=mode==="hotel"?m.intervenant.nom:m.hotel.replace("Hotel ","");
  const color=mode==="hotel"?m.intervenant.color:m.hotelColor;
  return <div onClick={()=>onClick(m)} style={{background:color,color:"#fff",borderRadius:5,padding:"2px 4px",marginBottom:2,cursor:"pointer",fontSize:9,fontWeight:600,lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",userSelect:"none"}}>
    <div>{label}</div>
    <div style={{fontSize:8,opacity:0.9}}>{m.debut}-{m.fin}</div>
  </div>;
}

function GrilleSkello({missions,intervenants,hotels,year,month,mode,filtreInter,filtreHotel,onCellClick,onShiftClick,onSendPlanning}){
  const days=getDays(year,month);
  const allDays=Array.from({length:days},(_,i)=>i+1);
  const HOTEL_LIST=hotels||INIT_HOTELS;
  const INTER_LIST=intervenants||INIT_INTERVENANTS;
  const lignesAll=mode==="intervenant"?INTER_LIST:HOTEL_LIST.map(h=>({id:h.id||h.nom,nom:h.nom,color:h.color,tarif:h.tarif,type:"hotel"}));
  const lignes=mode==="intervenant"?(filtreInter?lignesAll.filter(l=>l.id===filtreInter):lignesAll):(filtreHotel?lignesAll.filter(l=>l.nom===filtreHotel):lignesAll);
  const today=new Date();
  const isToday=d=>d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
  const getMissions=(ligne,day)=>{
    const dateStr=year+"-"+String(month+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
    if(mode==="intervenant") return missions.filter(m=>m.date===dateStr&&m.intervenant.id===ligne.id);
    return missions.filter(m=>m.date===dateStr&&m.hotel===ligne.nom);
  };
  const getTotalH=ligne=>{
    const ms=missions.filter(m=>mode==="intervenant"?m.intervenant.id===ligne.id:m.hotel===ligne.nom);
    return ms.reduce((a,m)=>a+m.heures,0);
  };
  const CELL_W=36;
  return <div style={{overflowX:"auto",borderRadius:14,border:"1px solid #E2E8F0",background:"#fff"}}>
    <div style={{minWidth:180+days*CELL_W}}>
      <div style={{display:"flex",borderBottom:"1.5px solid #E2E8F0",background:"#F8FAFC",position:"sticky",top:0,zIndex:10}}>
        <div style={{width:180,minWidth:180,padding:"10px 14px",fontSize:11,fontWeight:700,color:"#475569",borderRight:"1px solid #E2E8F0"}}>{mode==="intervenant"?"Intervenant":"Hotel"}</div>
        {allDays.map(d=>{
          const fd=getFirstDay(year,month);
          const dow=(fd+d-1)%7;
          const isWE=dow>=5;
          return <div key={d} style={{width:CELL_W,minWidth:CELL_W,padding:"4px 2px",textAlign:"center",background:isToday(d)?"#1C3557":isWE?"#F1F5F9":"#F8FAFC",borderRight:"1px solid #E2E8F0"}}>
            <div style={{fontSize:8,color:isToday(d)?"#93B4D4":"#94A3B8",fontWeight:600}}>{JOURS_COURT[dow]}</div>
            <div style={{fontSize:11,fontWeight:700,color:isToday(d)?"#fff":isWE?"#94A3B8":"#1C3557"}}>{d}</div>
          </div>;
        })}
        <div style={{width:70,minWidth:70,padding:"10px 6px",fontSize:10,fontWeight:700,color:"#475569",textAlign:"center",borderLeft:"1px solid #E2E8F0"}}>Total</div>
      </div>
      {lignes.map(ligne=>{
        const tH=getTotalH(ligne);
        const tarifH=mode==="hotel"?(HOTEL_LIST.find(h=>h.nom===ligne.nom)?.tarif||0):0;
        return <div key={ligne.id||ligne.nom} style={{display:"flex",borderBottom:"1px solid #F1F5F9",minHeight:64}}>
          <div style={{width:180,minWidth:180,padding:"8px 12px",borderRight:"1px solid #E2E8F0",display:"flex",alignItems:"flex-start",gap:8,background:"#FAFBFC"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:ligne.color,marginTop:5,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#1E293B"}}>{ligne.nom}</div>
              <div style={{fontSize:10,color:"#64748B"}}>{mode==="intervenant"?ligne.poste:ligne.tarif+" EUR/h"}</div>
              {mode==="intervenant"&&<div style={{marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                <span style={{background:TYPE_MAP[ligne.type]?.bg,color:TYPE_MAP[ligne.type]?.color,padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:600}}>{TYPE_MAP[ligne.type]?.label}</span>
                <button onClick={()=>onSendPlanning&&onSendPlanning(ligne)} style={{background:"#EBF0F8",border:"none",borderRadius:6,padding:"2px 6px",cursor:"pointer",fontSize:9,color:"#1C3557",fontWeight:600}}>Envoyer</button>
              </div>}
            </div>
          </div>
          {allDays.map(d=>{
            const fd=getFirstDay(year,month);
            const dow=(fd+d-1)%7;
            const isWE=dow>=5;
            const ms=getMissions(ligne,d);
            const dateStr=year+"-"+String(month+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
            return <div key={d} onClick={()=>ms.length===0&&onCellClick(dateStr,ligne)} style={{width:CELL_W,minWidth:CELL_W,padding:"3px 2px",borderRight:"1px solid #E2E8F0",background:isToday(d)?"#EBF0F8":isWE?"#F9FAFB":"#fff",cursor:ms.length===0?"pointer":"default"}}>
              {ms.map(m=><ShiftBloc key={m.id} m={m} onClick={onShiftClick} mode={mode}/>)}
            </div>;
          })}
          <div style={{width:70,minWidth:70,padding:"8px 6px",borderLeft:"1px solid #E2E8F0",textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",background:"#FAFBFC"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#1C3557"}}>{tH}h</div>
            {mode==="hotel"&&tH>0&&<div style={{fontSize:9,color:"#065F46",fontWeight:600}}>{(tH*tarifH).toFixed(0)} EUR</div>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}


function StatsView({missions,intervenants,hotels,year,month,thisM,totalH,totalCout,statsH}){
  const [periode,setPeriode]=useState("mois");
  const [onglet,setOnglet]=useState("intervenants");

  const MOIS_LIST=["Janv","Fevr","Mars","Avri","Mai","Juin","Juil","Aout","Sept","Octo","Nove","Dece"];

  // Donnees annuelles - tous les mois de annee
  const annee=missions.filter(m=>m.date.startsWith(year+"-"));
  const totalHAnnee=annee.reduce((a,m)=>a+m.heures,0);
  const totalCoutAnnee=annee.filter(m=>m.intervenant.type!=="salarie").reduce((a,m)=>a+m.montant,0);

  // Heures par mois pour graphe
  const parMois=Array.from({length:12},(_,i)=>{
    const prefix=year+"-"+String(i+1).padStart(2,"0");
    const ms=missions.filter(m=>m.date.startsWith(prefix));
    return {mois:MOIS_LIST[i],h:ms.reduce((a,m)=>a+m.heures,0),cout:ms.filter(m=>m.intervenant.type!=="salarie").reduce((a,m)=>a+m.montant,0),nb:ms.length};
  });
  const maxH=Math.max(...parMois.map(m=>m.h),1);

  // Par intervenant - mensuel et annuel
  const statInter=intervenants.map(i=>{
    const mMs=thisM.filter(m=>m.intervenant.id===i.id);
    const aMs=annee.filter(m=>m.intervenant.id===i.id);
    const parM=Array.from({length:12},(_,idx)=>{
      const prefix=year+"-"+String(idx+1).padStart(2,"0");
      return missions.filter(m=>m.date.startsWith(prefix)&&m.intervenant.id===i.id).reduce((a,m)=>a+m.heures,0);
    });
    return {
      ...i,
      hMois:mMs.reduce((a,m)=>a+m.heures,0),
      coutMois:mMs.reduce((a,m)=>a+m.montant,0),
      hAnnee:aMs.reduce((a,m)=>a+m.heures,0),
      coutAnnee:aMs.reduce((a,m)=>a+m.montant,0),
      parMois:parM,
      nbMois:mMs.length,
      nbAnnee:aMs.length,
    };
  }).filter(i=>periode==="mois"?i.hMois>0:i.hAnnee>0).sort((a,b)=>periode==="mois"?b.hMois-a.hMois:b.hAnnee-a.hAnnee);

  // Par hotel - mensuel et annuel
  const statHotel=hotels.map(h=>{
    const mMs=thisM.filter(m=>m.hotel===h.nom);
    const aMs=annee.filter(m=>m.hotel===h.nom);
    const parM=Array.from({length:12},(_,idx)=>{
      const prefix=year+"-"+String(idx+1).padStart(2,"0");
      return missions.filter(m=>m.date.startsWith(prefix)&&m.hotel===h.nom).reduce((a,m)=>a+m.heures,0);
    });
    const hMois=mMs.reduce((a,m)=>a+m.heures,0);
    const hAnnee=aMs.reduce((a,m)=>a+m.heures,0);
    return {
      ...h,
      hMois,hAnnee,
      caMois:hMois*(h.tarif||0),
      caAnnee:hAnnee*(h.tarif||0),
      parMois:parM,
      nbMois:mMs.length,
      nbAnnee:aMs.length,
    };
  }).filter(h=>periode==="mois"?h.hMois>0:h.hAnnee>0).sort((a,b)=>periode==="mois"?b.hMois-a.hMois:b.hAnnee-a.hAnnee);

  const totalRef=periode==="mois"?totalH:totalHAnnee;
  const coutRef=periode==="mois"?totalCout:totalCoutAnnee;
  const nbRef=periode==="mois"?thisM.length:annee.length;

  return <div style={{display:"flex",flexDirection:"column",gap:14}}>

    {/* Toggle periode */}
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:4,background:"#F1F5F9",padding:4,borderRadius:10}}>
        <button onClick={()=>setPeriode("mois")} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:periode==="mois"?"#fff":"transparent",color:periode==="mois"?"#1C3557":"#64748B",boxShadow:periode==="mois"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>Ce mois</button>
        <button onClick={()=>setPeriode("annee")} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:periode==="annee"?"#fff":"transparent",color:periode==="annee"?"#1C3557":"#64748B",boxShadow:periode==="annee"?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>Annuel {year}</button>
      </div>
      <div style={{display:"flex",gap:4,background:"#F1F5F9",padding:4,borderRadius:10}}>
        <button onClick={()=>setOnglet("intervenants")} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:onglet==="intervenants"?"#1C3557":"transparent",color:onglet==="intervenants"?"#fff":"#64748B"}}>Intervenants</button>
        <button onClick={()=>setOnglet("hotels")} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:onglet==="hotels"?"#1C3557":"transparent",color:onglet==="hotels"?"#fff":"#64748B"}}>Hotels</button>
      </div>
    </div>

    {/* Export Excel */}
    <div style={{display:"flex",justifyContent:"flex-end"}}>
      <button onClick={()=>exportExcel(missions,intervenants,hotels,year,month,MOIS)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:11,border:"1.5px solid #065F46",background:"#F0FDF4",color:"#065F46",cursor:"pointer",fontWeight:600,fontSize:12}}>
        Exporter Excel / CSV
      </button>
    </div>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
      {[
        {l:"Missions",v:nbRef,s:periode==="mois"?"ce mois":"cette annee"},
        {l:"Heures",v:totalRef+"h",s:"d'intervention"},
        {l:"Cout AE",v:coutRef.toFixed(0)+" EUR",s:"HT",c:"#065F46"},
        {l:periode==="mois"?"Hotels actifs":"Hotels",v:periode==="mois"?statsH.length:statHotel.length,s:"clients"},
      ].map(s=><div key={s.l} style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #E2E8F0"}}>
        <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,marginBottom:6}}>{s.l}</div>
        <div style={{fontSize:22,fontWeight:700,color:s.c||"#1C3557"}}>{s.v}</div>
        <div style={{fontSize:11,color:"#64748B",marginTop:3}}>{s.s}</div>
      </div>)}
    </div>

    {/* Graphe mensuel - seulement en vue annuelle */}
    {periode==="annee"&&<div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #E2E8F0"}}>
      <h3 style={{margin:"0 0 16px",fontSize:13,color:"#1C3557",fontWeight:700}}>Evolution mensuelle {year}</h3>
      <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120}}>
        {parMois.map((m,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{fontSize:9,color:"#64748B",fontWeight:600}}>{m.h>0?m.h+"h":""}</div>
          <div style={{width:"100%",background:i===month?"#1C3557":"#BFDBFE",borderRadius:"4px 4px 0 0",height:m.h>0?Math.max(Math.round(m.h/maxH*90),4):2,transition:"height 0.3s",cursor:"pointer",position:"relative"}} title={m.mois+" : "+m.h+"h"}>
            {i===month&&<div style={{position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",fontSize:8,color:"#1C3557",fontWeight:700,whiteSpace:"nowrap"}}>Actuel</div>}
          </div>
          <div style={{fontSize:9,color:i===month?"#1C3557":"#94A3B8",fontWeight:i===month?700:400}}>{m.mois}</div>
        </div>)}
      </div>
    </div>}

    {/* PAR INTERVENANT */}
    {onglet==="intervenants"&&<div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={{margin:0,fontSize:13,color:"#1C3557",fontWeight:700}}>Heures par intervenant</h3>
        <span style={{fontSize:11,color:"#94A3B8"}}>{periode==="mois"?"Ce mois":"Annuel "+year}</span>
      </div>
      {statInter.length===0&&<div style={{padding:30,textAlign:"center",color:"#94A3B8",fontSize:12}}>Aucune donnee</div>}
      {statInter.map((i,idx)=>{
        const h=periode==="mois"?i.hMois:i.hAnnee;
        const cout=periode==="mois"?i.coutMois:i.coutAnnee;
        const nb=periode==="mois"?i.nbMois:i.nbAnnee;
        const pct=totalRef>0?Math.round(h/totalRef*100):0;
        return <div key={i.id} style={{padding:"14px 18px",borderBottom:"1px solid #F8FAFC"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <Av nom={i.nom} color={i.color} size={36}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:700,color:"#1E293B",fontSize:13}}>{i.nom}</span>
                  <span style={{marginLeft:8,background:TYPE_MAP[i.type]?.bg,color:TYPE_MAP[i.type]?.color,padding:"1px 7px",borderRadius:10,fontSize:9,fontWeight:600}}>{TYPE_MAP[i.type]?.label}</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:"#1C3557",fontSize:16}}>{h}h</div>
                  <div style={{fontSize:10,color:"#94A3B8"}}>{nb} mission(s)</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                <div style={{flex:1,height:6,background:"#F1F5F9",borderRadius:99}}>
                  <div style={{height:"100%",borderRadius:99,background:i.color,width:pct+"%",transition:"width 0.5s"}}/>
                </div>
                <span style={{fontSize:10,color:"#64748B",fontWeight:600,minWidth:30}}>{pct}%</span>
              </div>
            </div>
          </div>
          {cout>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:"#F0F7FF",borderRadius:8}}>
            <span style={{fontSize:11,color:"#475569"}}>{i.tarif} EUR/h</span>
            <span style={{fontSize:11,fontWeight:700,color:"#065F46"}}>{cout.toFixed(2)} EUR HT</span>
          </div>}
          {/* Mini graphe mensuel en vue annuelle */}
          {periode==="annee"&&<div style={{display:"flex",alignItems:"flex-end",gap:3,height:40,marginTop:8}}>
            {i.parMois.map((h,mi)=><div key={mi} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{width:"100%",background:mi===month?i.color:i.color+"44",borderRadius:"2px 2px 0 0",height:Math.max(h>0?Math.round(h/Math.max(...i.parMois,1)*34):0,h>0?2:0)}} title={MOIS_LIST[mi]+": "+h+"h"}/>
              <div style={{fontSize:7,color:"#94A3B8",marginTop:1}}>{mi===month?"*":""}</div>
            </div>)}
          </div>}
        </div>;
      })}
    </div>}

    {/* PAR HOTEL */}
    {onglet==="hotels"&&<div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <h3 style={{margin:0,fontSize:13,color:"#1C3557",fontWeight:700}}>Heures par hotel</h3>
        <span style={{fontSize:11,color:"#94A3B8"}}>{periode==="mois"?"Ce mois":"Annuel "+year}</span>
      </div>
      {statHotel.length===0&&<div style={{padding:30,textAlign:"center",color:"#94A3B8",fontSize:12}}>Aucune donnee</div>}
      {statHotel.map((h,idx)=>{
        const nh=periode==="mois"?h.hMois:h.hAnnee;
        const ca=periode==="mois"?h.caMois:h.caAnnee;
        const nb=periode==="mois"?h.nbMois:h.nbAnnee;
        const pct=totalRef>0?Math.round(nh/totalRef*100):0;
        const msRef=periode==="mois"?missions.filter(m=>m.hotel===h.nom&&m.date.startsWith(year+"-"+String(month+1).padStart(2,"0"))):missions.filter(m=>m.hotel===h.nom&&m.date.startsWith(year+"-"));
        const parPoste={};
        msRef.forEach(m=>{const p=m.intervenant.poste||"Autre";parPoste[p]=(parPoste[p]||0)+m.heures;});
        const postesH=Object.entries(parPoste).sort((a,b)=>b[1]-a[1]);
        return <div key={h.id||h.nom} style={{padding:"14px 18px",borderBottom:"1px solid #F8FAFC"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:10,background:h.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>H</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,color:"#1E293B",fontSize:13}}>{h.nom}</div>
                  <div style={{fontSize:10,color:"#64748B"}}>{h.tarif} EUR/h - {nb} mission(s)</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:"#1C3557",fontSize:16}}>{nh}h</div>
                  {ca>0&&<div style={{fontSize:11,fontWeight:700,color:"#065F46"}}>{ca.toFixed(0)} EUR</div>}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                <div style={{flex:1,height:6,background:"#F1F5F9",borderRadius:99}}>
                  <div style={{height:"100%",borderRadius:99,background:h.color,width:pct+"%",transition:"width 0.5s"}}/>
                </div>
                <span style={{fontSize:10,color:"#64748B",fontWeight:600,minWidth:30}}>{pct}%</span>
              </div>
            </div>
          </div>
          {/* Detail par poste */}
          {postesH.length>0&&<div style={{marginTop:8,padding:"10px 12px",background:"#F8FAFC",borderRadius:10,display:"flex",flexWrap:"wrap",gap:8}}>
            {postesH.map(([poste,heuresP])=>(
              <div key={poste} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:"#fff",borderRadius:20,border:"1px solid #E2E8F0"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:h.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:"#475569"}}>{poste}</span>
                <span style={{fontSize:11,fontWeight:700,color:"#1C3557"}}>{heuresP}h</span>
                <span style={{fontSize:10,color:"#94A3B8"}}>({Math.round(heuresP/nh*100)}%)</span>
              </div>
            ))}
          </div>}
          {/* Mini graphe mensuel en vue annuelle */}
          {periode==="annee"&&<div style={{display:"flex",alignItems:"flex-end",gap:3,height:40,marginTop:8}}>
            {h.parMois.map((nh2,mi)=><div key={mi} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{width:"100%",background:mi===month?h.color:h.color+"44",borderRadius:"2px 2px 0 0",height:Math.max(nh2>0?Math.round(nh2/Math.max(...h.parMois,1)*34):0,nh2>0?2:0)}} title={MOIS_LIST[mi]+": "+nh2+"h"}/>
              <div style={{fontSize:7,color:"#94A3B8",marginTop:1}}>{mi===month?"*":""}</div>
            </div>)}
          </div>}
        </div>;
      })}
    </div>}
  </div>;
}

export default function App(){
  const [year,setYear]=useState(2026);
  const [month,setMonth]=useState(4);
  const [missions,setMissions]=useState([]);
  const [intervenants,setIntervenants]=useState(INIT_INTERVENANTS);
  const [hotels,setHotels]=useState(INIT_HOTELS);
  const [mode,setMode]=useState("intervenant");
  const [view,setView]=useState("planning");
  const [modal,setModal]=useState(null);
  const [modalData,setModalData]=useState(null);
  const [envoiInter,setEnvoiInter]=useState(null);
  const [loading,setLoading]=useState(true);
  const [filtreInter,setFiltreInter]=useState(null);
  const [filtreHotel,setFiltreHotel]=useState(null);
  const [editInter,setEditInter]=useState(null);
  const [editHotel,setEditHotel]=useState(null);

  // Firebase - sync missions
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"missions"),snap=>{
      if(snap.empty){
        // First load - seed with RAW data
        const initial=RAW.map((r,i)=>{
          const inter=findI(r.i,INIT_INTERVENANTS);
          const hotel=findH(r.h,INIT_HOTELS);
          const heures=calcH(r.d,r.f);
          return {id:"m"+i,date:r.date,hotel:hotel.nom,hotelColor:hotel.color,intervenant:inter,debut:r.d,fin:r.f,heures,montant:inter.tarif*heures,note:""};
        });
        initial.forEach(m=>setDoc(doc(db,"missions",m.id),m));
      } else {
        setMissions(snap.docs.map(d=>({...d.data(),id:d.id})));
      }
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  // Firebase - sync intervenants
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"intervenants"),snap=>{
      if(snap.empty){
        INIT_INTERVENANTS.forEach(i=>setDoc(doc(db,"intervenants",i.id),i));
      } else {
        setIntervenants(snap.docs.map(d=>({...d.data(),id:d.id})));
      }
    });
    return ()=>unsub();
  },[]);

  // Firebase - sync hotels
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"hotels"),snap=>{
      if(snap.empty){
        INIT_HOTELS.forEach(h=>setDoc(doc(db,"hotels",h.id),h));
      } else {
        setHotels(snap.docs.map(d=>({...d.data(),id:d.id})));
      }
    });
    return ()=>unsub();
  },[]);

  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const thisM=missions.filter(m=>m.date.startsWith(year+"-"+String(month+1).padStart(2,"0")));

  const handleCellClick=(date,ligne)=>{
    setModalData({date,prefInter:mode==="intervenant"?ligne:null,prefHotel:mode==="hotel"?ligne.nom:null,existing:null});
    setModal("mission");
  };
  const handleShiftClick=m=>{setModalData({date:m.date,existing:m});setModal("mission");};

  const handleSave=async(data)=>{
    if(modalData?.existing){
      await setDoc(doc(db,"missions",modalData.existing.id),{...modalData.existing,...data});
    } else {
      const newDoc={...data,date:modalData.date,id:Date.now().toString()};
      await setDoc(doc(db,"missions",newDoc.id),newDoc);
    }
    setModal(null);
  };

  const handleDelete=async()=>{
    await deleteDoc(doc(db,"missions",modalData.existing.id));
    setModal(null);
  };

  const handleAddInter=async(data)=>{
    const id=Date.now().toString();
    await setDoc(doc(db,"intervenants",id),{...data,id});
    setModal(null);
  };

  const handleAddHotel=async(data)=>{
    const id=Date.now().toString();
    await setDoc(doc(db,"hotels",id),{...data,id});
    setModal(null);
  };

  const handleUpdateInter=async(id,data)=>{
    await setDoc(doc(db,"intervenants",id),{...data,id});
    setEditInter(null);
  };

  const handleUpdateHotel=async(id,data)=>{
    await setDoc(doc(db,"hotels",id),{...data,id});
    setEditHotel(null);
  };

  const handleDelInter=async(id)=>{
    if(window.confirm("Supprimer cet intervenant ?")){
      await deleteDoc(doc(db,"intervenants",id));
    }
  };

  const handleDelHotel=async(id)=>{
    if(window.confirm("Supprimer cet hotel ?")){
      await deleteDoc(doc(db,"hotels",id));
    }
  };

  const totalH=thisM.reduce((a,m)=>a+m.heures,0);
  const totalCout=thisM.filter(m=>m.intervenant.type!=="salarie").reduce((a,m)=>a+m.montant,0);

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

  const statsH=useMemo(()=>{
    const map={};
    thisM.forEach(m=>{map[m.hotel]=(map[m.hotel]||0)+m.heures;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  },[thisM]);
  const MOIS_LIST=["Janv","Fevr","Mars","Avri","Mai","Juin","Juil","Aout","Sept","Octo","Nove","Dece"];

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F0F4F8",fontFamily:"system-ui"}}>
    <div style={{textAlign:"center"}}>
      <div style={{width:48,height:48,borderRadius:"50%",border:"4px solid #E2E8F0",borderTopColor:"#1C3557",margin:"0 auto 16px",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#1C3557",fontWeight:600}}>Chargement Bonextrat...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  </div>;

  return <div style={{minHeight:"100vh",background:"#F0F4F8",fontFamily:"system-ui,sans-serif"}}>
    <div style={{background:"#1C3557",boxShadow:"0 2px 16px rgba(28,53,87,0.4)"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"#2563A8",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff"}}>B</div>
          <div><div style={{color:"#fff",fontWeight:700,fontSize:15}}>BONEXTRAT</div><div style={{color:"#93B4D4",fontSize:9}}>Planning Skello</div></div>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {[{id:"planning",label:"Planning"},{id:"factures",label:"Factures"},{id:"stats",label:"Stats"}].map(v=>
            <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:view===v.id?"#2563A8":"rgba(255,255,255,0.1)",color:view===v.id?"#fff":"#93B4D4"}}>{v.label}</button>
          )}
          <button onClick={()=>exportExcel(missions,intervenants,hotels,year,month,MOIS)} title="Sauvegarder toutes les donnees en Excel" style={{padding:"6px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.1)",color:"#93B4D4",cursor:"pointer",fontWeight:600,fontSize:11}}>Export</button>
        </div>
      </div>
    </div>

    <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 14px"}}>
      <div style={{background:"#fff",borderRadius:14,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #E2E8F0",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={prev} style={{background:"#F1F5F9",border:"none",borderRadius:9,width:32,height:32,cursor:"pointer",fontSize:16,color:"#475569"}}>{"<"}</button>
          <div style={{textAlign:"center",minWidth:140}}>
            <div style={{fontWeight:700,fontSize:16,color:"#1C3557"}}>{MOIS[month]} {year}</div>
            <div style={{fontSize:10,color:"#94A3B8"}}>{thisM.length} missions - {totalH}h</div>
          </div>
          <button onClick={next} style={{background:"#F1F5F9",border:"none",borderRadius:9,width:32,height:32,cursor:"pointer",fontSize:16,color:"#475569"}}>{">"}</button>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {view==="planning"&&<div style={{display:"flex",gap:4,background:"#F1F5F9",padding:4,borderRadius:10}}>
            <button onClick={()=>setMode("intervenant")} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:mode==="intervenant"?"#fff":"transparent",color:mode==="intervenant"?"#1C3557":"#64748B"}}>Par intervenant</button>
            <button onClick={()=>setMode("hotel")} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:mode==="hotel"?"#fff":"transparent",color:mode==="hotel"?"#1C3557":"#64748B"}}>Par hotel</button>
          </div>}
          <button onClick={()=>setModal("intervenant")} style={{padding:"7px 14px",borderRadius:10,border:"1.5px solid #1C3557",background:"#fff",color:"#1C3557",cursor:"pointer",fontWeight:600,fontSize:11}}>+ Intervenant</button>
          <button onClick={()=>setModal("hotel")} style={{padding:"7px 14px",borderRadius:10,border:"none",background:"#1C3557",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:11}}>+ Hotel</button>
        </div>
        <div style={{display:"flex",gap:12}}>
          {[{l:"Missions",v:thisM.length},{l:"Heures",v:totalH+"h"},{l:"Cout AE",v:totalCout.toFixed(0)+" EUR"}].map(s=><div key={s.l} style={{textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1C3557"}}>{s.v}</div>
            <div style={{fontSize:9,color:"#94A3B8"}}>{s.l}</div>
          </div>)}
        </div>
      </div>

      {view==="planning"&&<div>
        {/* Filtre + Gestion */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
          <button onClick={()=>mode==="intervenant"?setFiltreInter(null):setFiltreHotel(null)} style={{padding:"5px 14px",borderRadius:20,border:"1.5px solid",borderColor:(mode==="intervenant"?!filtreInter:!filtreHotel)?"#1C3557":"#E2E8F0",background:(mode==="intervenant"?!filtreInter:!filtreHotel)?"#1C3557":"#F8FAFC",color:(mode==="intervenant"?!filtreInter:!filtreHotel)?"#fff":"#64748B",cursor:"pointer",fontSize:11,fontWeight:600}}>Tous</button>
          {(mode==="intervenant"?intervenants:hotels).map(item=>(
            <div key={item.id||item.nom} style={{display:"flex",alignItems:"center",gap:0,borderRadius:20,border:"1.5px solid",borderColor:(mode==="intervenant"?filtreInter===item.id:filtreHotel===item.nom)?"#1C3557":"#E2E8F0",background:(mode==="intervenant"?filtreInter===item.id:filtreHotel===item.nom)?"#EBF0F8":"#fff",overflow:"hidden"}}>
              <button onClick={()=>mode==="intervenant"?setFiltreInter(item.id===filtreInter?null:item.id):setFiltreHotel(item.nom===filtreHotel?null:item.nom)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",border:"none",background:"transparent",color:(mode==="intervenant"?filtreInter===item.id:filtreHotel===item.nom)?"#1C3557":"#475569",cursor:"pointer",fontSize:11}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:item.color,flexShrink:0}}/>
                {item.nom}
              </button>
              <button onClick={()=>mode==="intervenant"?setEditInter(item):setEditHotel(item)} title="Modifier" style={{padding:"5px 7px",border:"none",borderLeft:"1px solid #E2E8F0",background:"transparent",cursor:"pointer",color:"#64748B",fontSize:11}}>edit</button>
            </div>
          ))}
        </div>
        <GrilleSkello missions={missions} intervenants={intervenants} hotels={hotels} year={year} month={month} mode={mode} filtreInter={filtreInter} filtreHotel={filtreHotel} onCellClick={handleCellClick} onShiftClick={handleShiftClick} onSendPlanning={i=>setEnvoiInter(i)}/>
        <div style={{marginTop:10,fontSize:11,color:"#94A3B8",textAlign:"center"}}>Cliquez case vide pour ajouter - Cliquez shift pour modifier</div>
      </div>}

      {view==="factures"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        {factures.length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8"}}>Aucune facture</div>}
        {factures.map(({inter,missions:ms,total,heures})=><div key={inter.id} style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #E2E8F0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><Av nom={inter.nom} color={inter.color} size={40}/><div><div style={{fontWeight:700,color:"#1E293B",fontSize:14}}>{inter.nom}</div><div style={{fontSize:11,color:"#64748B"}}>{inter.poste}</div></div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:700,color:"#1C3557"}}>{total.toFixed(2)} EUR</div><div style={{fontSize:11,color:"#94A3B8"}}>{heures}h HT</div></div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{borderBottom:"1.5px solid #E2E8F0"}}>{["Date","Hotel","Debut","Fin","H","Montant"].map(h=><th key={h} style={{textAlign:"left",padding:"5px 6px",color:"#64748B",fontWeight:600}}>{h}</th>)}</tr></thead>
            <tbody>{ms.sort((a,b)=>a.date.localeCompare(b.date)).map((m,i)=><tr key={i} style={{borderBottom:"1px solid #F1F5F9"}}>
              <td style={{padding:"6px"}}>{m.date.split("-").reverse().join("/")}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.hotel}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.debut}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.fin}</td>
              <td style={{padding:"6px",color:"#475569"}}>{m.heures}h</td>
              <td style={{padding:"6px",fontWeight:600,color:"#1C3557"}}>{m.montant.toFixed(2)} EUR</td>
            </tr>)}</tbody>
          </table>
          <div style={{marginTop:12,padding:"8px 12px",background:"#F0F7FF",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#475569"}}>{ms.length} mission(s)</span>
            <button onClick={()=>setEnvoiInter(inter)} style={{padding:"6px 14px",background:"#25D366",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontSize:11,fontWeight:600}}>Envoyer</button>
          </div>
        </div>)}
      </div>}

      {view==="stats"&&<StatsView missions={missions} intervenants={intervenants} hotels={hotels} year={year} month={month} thisM={thisM} totalH={totalH} totalCout={totalCout} statsH={statsH}/>}
    </div>

    {envoiInter&&<ModalEnvoiPlanning inter={envoiInter} missions={missions} year={year} month={month} onClose={()=>setEnvoiInter(null)}/>}
    {modal==="mission"&&<ModalMission date={modalData?.date} prefInter={modalData?.prefInter} prefHotel={modalData?.prefHotel} existing={modalData?.existing} allIntervenants={intervenants} allHotels={hotels} onClose={()=>setModal(null)} onSave={handleSave} onDelete={handleDelete}/>}
    {modal==="intervenant"&&<ModalIntervenant onClose={()=>setModal(null)} onSave={handleAddInter}/>}
    {modal==="hotel"&&<ModalHotel onClose={()=>setModal(null)} onSave={handleAddHotel}/>}
    {editInter&&<ModalEditIntervenant inter={editInter} onClose={()=>setEditInter(null)} onSave={handleUpdateInter} onDelete={async(id)=>{await deleteDoc(doc(db,"intervenants",id));setEditInter(null);}}/>}
    {editHotel&&<ModalEditHotel hotel={editHotel} onClose={()=>setEditHotel(null)} onSave={handleUpdateHotel} onDelete={async(id)=>{await deleteDoc(doc(db,"hotels",id));setEditHotel(null);}}/>}
  </div>;
}

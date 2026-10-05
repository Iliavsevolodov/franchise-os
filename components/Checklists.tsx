"use client";

import { useMemo, useState } from "react";
import {
  Check, CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, Clock3,
  Plus, ShieldCheck, Trash2, Users
} from "lucide-react";
import { AppState, AppUser, ChecklistTemplate } from "@/lib/types";

function localDate(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

const frequencyLabel:Record<ChecklistTemplate["frequency"],string>={
  shift_open:"Открытие смены",
  shift_close:"Закрытие смены",
  daily:"Каждый день",
  weekly:"Раз в неделю"
};

function progress(template:ChecklistTemplate,doneIds:string[]){
  const required=template.items.filter(i=>i.required);
  const requiredDone=required.filter(i=>doneIds.includes(i.id)).length;
  const pct=required.length?Math.round(requiredDone/required.length*100):100;
  return {required:required.length,requiredDone,pct,complete:pct===100};
}

function ChecklistCard({
  template,userId,locationId,state,setState,readonly=false
}:{
  template:ChecklistTemplate;
  userId:string;
  locationId:string;
  state:AppState;
  setState:React.Dispatch<React.SetStateAction<AppState>>;
  readonly?:boolean;
}){
  const today=localDate();
  const [open,setOpen]=useState(true);
  const completion=state.checklistCompletions.find(c=>
    c.templateId===template.id&&c.userId===userId&&c.locationId===locationId&&c.date===today
  );
  const done=completion?.completedItemIds??[];
  const p=progress(template,done);

  const toggle=(itemId:string)=>{
    if(readonly)return;
    setState(s=>{
      const existing=s.checklistCompletions.find(c=>c.templateId===template.id&&c.userId===userId&&c.locationId===locationId&&c.date===today);
      const current=existing?.completedItemIds??[];
      const next=current.includes(itemId)?current.filter(x=>x!==itemId):[...current,itemId];
      const requiredIds=template.items.filter(i=>i.required).map(i=>i.id);
      const wasComplete=requiredIds.every(id=>current.includes(id));
      const complete=requiredIds.every(id=>next.includes(id));
      const now=new Date().toISOString();
      const completionId=existing?.id??crypto.randomUUID();

      const checklistCompletions=existing
        ?s.checklistCompletions.map(c=>c.id===existing.id?{...c,completedItemIds:next,completedAt:complete?now:undefined}:c)
        :[...s.checklistCompletions,{
          id:completionId,templateId:template.id,userId,locationId,date:today,
          completedItemIds:next,completedAt:complete?now:undefined
        }];

      let staffNotifications=s.staffNotifications;
      if(complete&&!wasComplete&&template.role==="master"){
        const master=s.users.find(u=>u.id===userId);
        const masterName=master?.name??"Мастер";
        const managers=s.users.filter(u=>u.role==="manager"&&u.status==="active"&&u.locationIds.includes(locationId));
        const type=template.frequency==="shift_open"?"shift_ready" as const:"checklist_complete" as const;
        const title=template.frequency==="shift_open"
          ?`${masterName} готов к смене`
          :`${masterName} заполнил чек-лист`;
        const body=template.frequency==="shift_open"
          ?`Чек-лист «${template.title}» выполнен полностью. Мастер подтвердил готовность к работе.`
          :`Выполнен чек-лист «${template.title}».`;
        const already=s.staffNotifications.some(n=>n.checklistCompletionId===completionId&&n.type===type);
        if(!already&&managers.length){
          staffNotifications=[...s.staffNotifications,...managers.map(manager=>({
            id:crypto.randomUUID(),
            userId:manager.id,
            locationId,
            type,
            title,
            body,
            createdAt:now,
            checklistCompletionId:completionId
          }))];
        }
      }

      return {...s,checklistCompletions,staffNotifications};
    });
  };

  return <section className={`checklist-card ${p.complete?"complete":""}`}>
    <button className="checklist-head" onClick={()=>setOpen(v=>!v)}>
      <div className={`checklist-status ${p.complete?"done":""}`}>{p.complete?<Check size={17}/>:<ClipboardCheck size={17}/>}</div>
      <div className="checklist-title"><b>{template.title}</b><span>{frequencyLabel[template.frequency]} · {p.requiredDone}/{p.required} обязательных</span></div>
      <div className="checklist-progress"><span><i style={{width:`${p.pct}%`}}/></span><b>{p.pct}%</b></div>
      {open?<ChevronUp size={17}/>:<ChevronDown size={17}/>}
    </button>
    {open&&<div className="checklist-body">
      <p>{template.description}</p>
      <div className="checklist-items">
        {template.items.map(item=>{
          const checked=done.includes(item.id);
          return <button type="button" key={item.id} disabled={readonly} className={`check-item ${checked?"checked":""}`} onClick={()=>toggle(item.id)}>
            <span className="check-box">{checked&&<Check size={14}/>}</span>
            <span className="check-text">{item.text}{item.required&&<small>обязательно</small>}</span>
          </button>;
        })}
      </div>
      {p.complete&&<div className="checklist-complete"><CheckCircle2 size={17}/><span>Чек-лист выполнен</span></div>}
    </div>}
  </section>;
}

function TemplatesEditor({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}){
  const [role,setRole]=useState<"manager"|"master">("master");
  const templates=state.checklistTemplates.filter(t=>t.role===role);

  const addTemplate=()=>setState(s=>({...s,checklistTemplates:[...s.checklistTemplates,{
    id:crypto.randomUUID(),title:"Новый чек-лист",description:"",role,frequency:"daily",
    locationIds:s.locations.map(l=>l.id),active:true,items:[{id:crypto.randomUUID(),text:"Новый пункт",required:true}]
  }]}));

  const update=(id:string,patch:Partial<ChecklistTemplate>)=>setState(s=>({...s,checklistTemplates:s.checklistTemplates.map(t=>t.id===id?{...t,...patch}:t)}));
  const remove=(id:string)=>setState(s=>({...s,checklistTemplates:s.checklistTemplates.filter(t=>t.id!==id),checklistCompletions:s.checklistCompletions.filter(c=>c.templateId!==id)}));

  return <div>
    <div className="checklist-editor-toolbar">
      <div className="scenario-tabs">
        <button className={role==="master"?"active":""} onClick={()=>setRole("master")}>Для мастеров</button>
        <button className={role==="manager"?"active":""} onClick={()=>setRole("manager")}>Для управляющих</button>
      </div>
      <button className="btn primary" onClick={addTemplate}><Plus size={15}/> Новый чек-лист</button>
    </div>
    <div className="template-grid">
      {templates.map(t=><section className="panel template-editor" key={t.id}>
        <div className="template-editor-head">
          <input className="template-title-input" value={t.title} onChange={e=>update(t.id,{title:e.target.value})}/>
          <button className="icon-btn" onClick={()=>remove(t.id)}><Trash2 size={16}/></button>
        </div>
        <textarea value={t.description} onChange={e=>update(t.id,{description:e.target.value})} placeholder="Описание"/>
        <div className="template-options">
          <select value={t.frequency} onChange={e=>update(t.id,{frequency:e.target.value as ChecklistTemplate["frequency"]})}>
            <option value="shift_open">Открытие смены</option>
            <option value="shift_close">Закрытие смены</option>
            <option value="daily">Каждый день</option>
            <option value="weekly">Раз в неделю</option>
          </select>
          <label><input type="checkbox" checked={t.active} onChange={e=>update(t.id,{active:e.target.checked})}/> Активен</label>
        </div>
        <div className="template-locations">{state.locations.map(l=><label key={l.id}><input type="checkbox" checked={t.locationIds.includes(l.id)} onChange={e=>update(t.id,{locationIds:e.target.checked?[...new Set([...t.locationIds,l.id])]:t.locationIds.filter(id=>id!==l.id)})}/>{l.city}</label>)}</div>
        <div className="template-items">
          {t.items.map((item,i)=><div key={item.id}>
            <button className={`mini-check ${item.required?"required":""}`} onClick={()=>update(t.id,{items:t.items.map((x,j)=>j===i?{...x,required:!x.required}:x)})}>{item.required?"!":"○"}</button>
            <input value={item.text} onChange={e=>update(t.id,{items:t.items.map((x,j)=>j===i?{...x,text:e.target.value}:x)})}/>
            <button className="icon-btn" onClick={()=>update(t.id,{items:t.items.filter((_,j)=>j!==i)})}><Trash2 size={14}/></button>
          </div>)}
          <button className="btn soft sm" onClick={()=>update(t.id,{items:[...t.items,{id:crypto.randomUUID(),text:"Новый пункт",required:true}]})}><Plus size={14}/> Добавить пункт</button>
        </div>
      </section>)}
    </div>
  </div>;
}

function ManagerMasterControl({state,user}:{state:AppState;user:AppUser}){
  const today=localDate();
  const locations=state.locations.filter(l=>user.locationIds.includes(l.id));
  const masters=state.users.filter(u=>u.role==="master"&&u.status==="active"&&u.locationIds.some(id=>user.locationIds.includes(id)));
  const masterTemplates=state.checklistTemplates.filter(t=>t.role==="master"&&t.active);

  return <section className="panel mt">
    <div className="section-title"><div><h2>Контроль чек-листов мастеров</h2><p>Сегодня · только сотрудники назначенных тебе точек</p></div></div>
    <div className="compliance-list">
      {masters.map(m=>{
        const locId=m.locationIds.find(id=>user.locationIds.includes(id))??m.locationIds[0];
        const relevant=masterTemplates.filter(t=>t.locationIds.includes(locId));
        const completed=relevant.filter(t=>{
          const c=state.checklistCompletions.find(x=>x.templateId===t.id&&x.userId===m.id&&x.locationId===locId&&x.date===today);
          return c?progress(t,c.completedItemIds).complete:false;
        }).length;
        const pct=relevant.length?Math.round(completed/relevant.length*100):100;
        return <div key={m.id}>
          <span className="compliance-user"><b>{m.name}</b><small>{locations.find(l=>l.id===locId)?.city??"—"}</small></span>
          <span className="compliance-bar"><i style={{width:`${pct}%`}}/></span>
          <b className={pct===100?"positive":""}>{completed}/{relevant.length}</b>
        </div>;
      })}
      {!masters.length&&<div className="empty-state small-empty"><Users size={24}/><b>Мастера пока не назначены</b></div>}
    </div>
  </section>;
}

export default function ChecklistsPage({
  state,setState,user
}:{
  state:AppState;
  setState:React.Dispatch<React.SetStateAction<AppState>>;
  user:AppUser;
}){
  const [ownerTab,setOwnerTab]=useState<"control"|"templates">("control");
  const role=user.role;
  const today=localDate();

  if(role==="owner"){
    const active=state.checklistTemplates.filter(t=>t.active);
    const todayDone=state.checklistCompletions.filter(c=>c.date===today&&c.completedAt).length;
    const people=state.users.filter(u=>u.role!=="owner"&&u.status==="active").length;
    return <div className="page">
      <div className="page-head"><div><span className="eyebrow">ЧЕК-ЛИСТЫ</span><h1>Стандарты работы сети</h1><p>Настраивай процессы для мастеров и управляющих и контролируй выполнение.</p></div></div>
      <div className="kpi-grid three">
        <div className="kpi-card"><div className="kpi-icon blue"><ClipboardCheck size={18}/></div><div className="kpi-copy"><span>Активных чек-листов</span><strong>{active.length}</strong><small>для команды сети</small></div></div>
        <div className="kpi-card"><div className="kpi-icon green"><CheckCircle2 size={18}/></div><div className="kpi-copy"><span>Выполнено сегодня</span><strong>{todayDone}</strong><small>закрытых чек-листов</small></div></div>
        <div className="kpi-card"><div className="kpi-icon amber"><Users size={18}/></div><div className="kpi-copy"><span>Пользователей</span><strong>{people}</strong><small>управляющие + мастера</small></div></div>
      </div>
      <div className="scenario-tabs">
        <button className={ownerTab==="control"?"active":""} onClick={()=>setOwnerTab("control")}>Контроль</button>
        <button className={ownerTab==="templates"?"active":""} onClick={()=>setOwnerTab("templates")}>Шаблоны</button>
      </div>
      {ownerTab==="templates"?<TemplatesEditor state={state} setState={setState}/>:<div className="owner-check-control">
        {state.users.filter(u=>u.role!=="owner"&&u.status==="active").map(u=>{
          const locId=u.locationIds[0]??"";
          const relevant=active.filter(t=>t.role===u.role&&t.locationIds.includes(locId));
          const done=relevant.filter(t=>{
            const c=state.checklistCompletions.find(x=>x.templateId===t.id&&x.userId===u.id&&x.locationId===locId&&x.date===today);
            return c?progress(t,c.completedItemIds).complete:false;
          }).length;
          const pct=relevant.length?Math.round(done/relevant.length*100):100;
          return <div className="owner-check-row" key={u.id}><span><b>{u.name}</b><small>{u.role==="manager"?"Управляющий":"Мастер"} · {state.locations.find(l=>l.id===locId)?.city??"без точки"}</small></span><span className="compliance-bar"><i style={{width:`${pct}%`}}/></span><b>{done}/{relevant.length}</b></div>;
        })}
      </div>}
    </div>;
  }

  const locationId=user.locationIds[0]??state.locations[0]?.id??"";
  const templates=state.checklistTemplates.filter(t=>t.active&&t.role===role&&t.locationIds.includes(locationId));

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">{role==="master"?"МОИ ЧЕК-ЛИСТЫ":"ЧЕК-ЛИСТЫ УПРАВЛЯЮЩЕГО"}</span><h1>{role==="master"?"Рабочий день":"Контроль точки"}</h1><p>{role==="master"?"Открытие, закрытие смены и регулярные проверки рабочего места.":"Открытие, ежедневный контроль и закрытие точки."}</p></div>
      <span className={`role-badge ${role}`}><ShieldCheck size={15}/>{role==="master"?"Мастер":"Управляющий"}</span>
    </div>
    <div className="checklist-grid">
      {templates.map(t=><ChecklistCard key={t.id} template={t} userId={user.id} locationId={locationId} state={state} setState={setState}/>)}
    </div>
    {role==="manager"&&<ManagerMasterControl state={state} user={user}/>}
  </div>;
}

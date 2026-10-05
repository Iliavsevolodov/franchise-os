"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, Bell, Check, CheckCircle2, Inbox, MessageSquare, PackageCheck,
  PackagePlus, Plus, Send, ShoppingBasket, Trash2, Wrench
} from "lucide-react";
import {
  AppState, AppUser, StaffNotification, WorkRequest, WorkRequestCategory,
  WorkRequestPriority, WorkRequestStatus
} from "@/lib/types";

const categoryLabels:Record<WorkRequestCategory,string>={
  supplies:"Расходники",
  repair:"Поломка / ремонт",
  equipment:"Оборудование",
  household:"Хозтовары",
  incident:"Проблема / ситуация",
  other:"Другое"
};

const statusLabels:Record<WorkRequestStatus,string>={
  new:"Новая",accepted:"Принято",ordered:"Заказано",resolved:"Закрыто",rejected:"Отклонено"
};

const statusTone:Record<WorkRequestStatus,string>={
  new:"red",accepted:"blue",ordered:"amber",resolved:"green",rejected:"neutral"
};

function requesterName(state:AppState,id:string){
  return state.users.find(u=>u.id===id)?.name??"Сотрудник";
}

function locationName(state:AppState,id:string){
  return state.locations.find(l=>l.id===id)?.city??"Точка";
}

function statusNotification(request:WorkRequest,status:WorkRequestStatus):StaffNotification{
  const label=statusLabels[status];
  return {
    id:crypto.randomUUID(),
    userId:request.fromUserId,
    locationId:request.locationId,
    type:"request_status",
    title:"Заявка: "+label.toLowerCase(),
    body:"«"+request.title+"» — статус изменён на «"+label+"»."+(request.managerNote?.trim()?" Комментарий: "+request.managerNote.trim():""),
    createdAt:new Date().toISOString(),
    requestId:request.id
  };
}

function NotificationsInbox({state,setState,user}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;user:AppUser}){
  const list=state.staffNotifications.filter(n=>n.userId===user.id).slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const unread=list.filter(n=>!n.readAt).length;

  const mark=(id:string)=>setState(s=>({...s,staffNotifications:s.staffNotifications.map(n=>n.id===id?{...n,readAt:n.readAt??new Date().toISOString()}:n)}));
  const markAll=()=>setState(s=>({...s,staffNotifications:s.staffNotifications.map(n=>n.userId===user.id&&!n.readAt?{...n,readAt:new Date().toISOString()}:n)}));

  return <section className="panel staff-inbox">
    <div className="section-title">
      <div><h2>Уведомления</h2><p>{unread?"Новых: "+unread:"Всё просмотрено"}</p></div>
      {unread>0&&<button className="btn soft sm" onClick={markAll}>Прочитать все</button>}
    </div>
    <div className="staff-notifications">
      {list.length?list.slice(0,12).map(n=><button key={n.id} className={"staff-notification "+(n.readAt?"read":"unread")} onClick={()=>mark(n.id)}>
        <span className="staff-notification-icon">{n.type==="shift_ready"?<CheckCircle2 size={17}/>:n.type==="request_new"?<Inbox size={17}/>:n.type==="checklist_complete"?<Check size={17}/>:<Bell size={17}/>}</span>
        <span className="staff-notification-copy"><b>{n.title}</b><small>{n.body}</small><em>{new Date(n.createdAt).toLocaleString("ru-RU",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</em></span>
        {!n.readAt&&<i/>}
      </button>):<div className="empty-state small-empty"><Bell size={23}/><b>Уведомлений пока нет</b><span>Здесь появятся сообщения о чек-листах и заявках.</span></div>}
    </div>
  </section>;
}

function MasterRequests({state,setState,user}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;user:AppUser}){
  const locationId=user.locationIds[0]??state.locations[0]?.id??"";
  const [category,setCategory]=useState<WorkRequestCategory>("supplies");
  const [priority,setPriority]=useState<WorkRequestPriority>("normal");
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [items,setItems]=useState([{id:crypto.randomUUID(),name:"",quantity:1,unit:"шт"}]);
  const itemMode=["supplies","equipment","household"].includes(category);

  const addItem=()=>setItems(v=>[...v,{id:crypto.randomUUID(),name:"",quantity:1,unit:"шт"}]);
  const updateItem=(id:string,patch:Partial<(typeof items)[number]>)=>setItems(v=>v.map(x=>x.id===id?{...x,...patch}:x));
  const removeItem=(id:string)=>setItems(v=>v.filter(x=>x.id!==id));

  const submit=()=>{
    const cleanItems=itemMode?items.filter(i=>i.name.trim()).map(i=>({...i,name:i.name.trim(),quantity:Math.max(0,i.quantity)})):[];
    const inferredTitle=title.trim()||(cleanItems.length?cleanItems.map(i=>i.name).slice(0,2).join(", "):categoryLabels[category]);
    if(!inferredTitle.trim())return;

    setState(s=>{
      const now=new Date().toISOString();
      const request:WorkRequest={
        id:crypto.randomUUID(),fromUserId:user.id,locationId,category,title:inferredTitle,
        description:description.trim(),items:cleanItems,priority,status:"new",createdAt:now,updatedAt:now
      };
      const managers=s.users.filter(u=>u.role==="manager"&&u.status==="active"&&u.locationIds.includes(locationId));
      const notifications:StaffNotification[]=managers.map(manager=>({
        id:crypto.randomUUID(),userId:manager.id,locationId,type:"request_new",
        title:priority==="urgent"?"Срочная заявка от "+user.name:"Новая заявка от "+user.name,
        body:categoryLabels[category]+": "+request.title,createdAt:now,requestId:request.id
      }));
      return {...s,workRequests:[request,...s.workRequests],staffNotifications:[...s.staffNotifications,...notifications]};
    });

    setTitle("");setDescription("");setPriority("normal");
    setItems([{id:crypto.randomUUID(),name:"",quantity:1,unit:"шт"}]);
  };

  const requests=state.workRequests.filter(r=>r.fromUserId===user.id).slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">ОБРАЩЕНИЯ</span><h1>Сообщить управляющему</h1><p>Расходники, закупки, поломки и рабочие вопросы — внутри платформы.</p></div>
      <span className="role-badge master"><MessageSquare size={15}/> Мастер</span>
    </div>

    <div className="layout-2">
      <section className="panel">
        <div className="section-title"><div><h2>Новая заявка</h2><p>Управляющий получит уведомление сразу после отправки.</p></div></div>

        <div className="request-category-grid">
          {(Object.keys(categoryLabels) as WorkRequestCategory[]).map(k=><button key={k} className={category===k?"active":""} onClick={()=>setCategory(k)}>
            {k==="repair"?<Wrench size={16}/>:k==="supplies"||k==="household"?<ShoppingBasket size={16}/>:<PackagePlus size={16}/>}
            <span>{categoryLabels[k]}</span>
          </button>)}
        </div>

        <div className="request-form-grid">
          <label className="field"><span>Кратко</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder={itemMode?"Например: расходники на неделю":"Что случилось?"}/></label>
          <label className="field"><span>Приоритет</span><select value={priority} onChange={e=>setPriority(e.target.value as WorkRequestPriority)}><option value="low">Не срочно</option><option value="normal">Обычно</option><option value="urgent">Срочно</option></select></label>
        </div>

        {itemMode&&<div className="request-items-editor">
          <div className="row between"><div><b>Что нужно заказать / купить</b><small>Можно добавить несколько позиций</small></div><button className="btn soft sm" onClick={addItem}><Plus size={14}/> Позиция</button></div>
          {items.map(item=><div className="request-item-row" key={item.id}>
            <input value={item.name} onChange={e=>updateItem(item.id,{name:e.target.value})} placeholder="Название"/>
            <input type="text" inputMode="decimal" value={String(item.quantity)} onChange={e=>updateItem(item.id,{quantity:Number(e.target.value.replace(",","."))||0})}/>
            <select value={item.unit} onChange={e=>updateItem(item.id,{unit:e.target.value})}><option>шт</option><option>уп</option><option>л</option><option>мл</option><option>кг</option><option>рулон</option><option>компл.</option></select>
            <button className="icon-btn" onClick={()=>removeItem(item.id)} disabled={items.length===1}><Trash2 size={15}/></button>
          </div>)}
        </div>}

        <label className="field request-description"><span>Комментарий</span><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Количество, где используется, что именно сломалось или другая важная информация."/></label>
        <button className="btn primary request-send" onClick={submit}><Send size={16}/> Отправить управляющему</button>
      </section>

      <NotificationsInbox state={state} setState={setState} user={user}/>
    </div>

    <section className="panel mt">
      <div className="section-title"><div><h2>Мои заявки</h2><p>История и текущий статус.</p></div></div>
      <div className="request-history">
        {requests.length?requests.map(r=><div className="request-history-row" key={r.id}>
          <div className={"request-category-icon "+r.priority}>{r.category==="repair"?<Wrench size={17}/>:<ShoppingBasket size={17}/>}</div>
          <span><b>{r.title}</b><small>{categoryLabels[r.category]} · {new Date(r.createdAt).toLocaleString("ru-RU",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</small></span>
          <span className={"request-status "+statusTone[r.status]}>{statusLabels[r.status]}</span>
          {r.managerNote&&<em>{r.managerNote}</em>}
        </div>):<div className="empty-state small-empty"><Inbox size={24}/><b>Заявок ещё нет</b></div>}
      </div>
    </section>
  </div>;
}

function ManagerRequests({state,setState,user}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;user:AppUser}){
  const [filter,setFilter]=useState<"open"|"all">("open");
  const requests=state.workRequests
    .filter(r=>user.locationIds.includes(r.locationId))
    .filter(r=>filter==="all"||!["resolved","rejected"].includes(r.status))
    .slice().sort((a,b)=>{
      if(a.priority==="urgent"&&b.priority!=="urgent")return -1;
      if(b.priority==="urgent"&&a.priority!=="urgent")return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  const open=state.workRequests.filter(r=>user.locationIds.includes(r.locationId)&&!["resolved","rejected"].includes(r.status));
  const urgent=open.filter(r=>r.priority==="urgent").length;
  const supplyRequests=open.filter(r=>["supplies","equipment","household"].includes(r.category));

  const purchaseRows=useMemo(()=>{
    const map=new Map<string,{name:string,unit:string,quantity:number,locationIds:Set<string>}>();
    for(const r of supplyRequests){
      for(const item of r.items){
        const key=item.name.trim().toLowerCase()+"::"+item.unit;
        if(!item.name.trim())continue;
        const current=map.get(key)??{name:item.name.trim(),unit:item.unit,quantity:0,locationIds:new Set<string>()};
        current.quantity+=item.quantity;
        current.locationIds.add(r.locationId);
        map.set(key,current);
      }
    }
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name,"ru"));
  },[state.workRequests,user.locationIds.join("|")]);

  const updateRequest=(id:string,patch:Partial<WorkRequest>,notifyStatus?:WorkRequestStatus)=>{
    setState(s=>{
      const request=s.workRequests.find(r=>r.id===id);
      if(!request)return s;
      const next={...request,...patch,updatedAt:new Date().toISOString()};
      const workRequests=s.workRequests.map(r=>r.id===id?next:r);
      const staffNotifications=notifyStatus?[...s.staffNotifications,statusNotification(next,notifyStatus)]:s.staffNotifications;
      return {...s,workRequests,staffNotifications};
    });
  };

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">ЗАЯВКИ КОМАНДЫ</span><h1>Что нужно точкам</h1><p>Расходники, закупки, поломки и сообщения мастеров собраны в одном месте.</p></div>
      <span className="role-badge manager"><Inbox size={15}/> Управляющий</span>
    </div>

    <div className="kpi-grid three">
      <div className="kpi-card"><div className="kpi-icon red"><Inbox size={18}/></div><div className="kpi-copy"><span>Открытых заявок</span><strong>{open.length}</strong><small>нужно обработать</small></div></div>
      <div className="kpi-card"><div className="kpi-icon amber"><AlertTriangle size={18}/></div><div className="kpi-copy"><span>Срочных</span><strong>{urgent}</strong><small>приоритет команды</small></div></div>
      <div className="kpi-card"><div className="kpi-icon blue"><ShoppingBasket size={18}/></div><div className="kpi-copy"><span>Позиций к закупке</span><strong>{purchaseRows.length}</strong><small>сводный список</small></div></div>
    </div>

    <div className="layout-2">
      <section className="panel">
        <div className="section-title"><div><h2>Список к заказу / покупке</h2><p>Автоматически собран из открытых заявок мастеров.</p></div></div>
        <div className="purchase-list">
          {purchaseRows.length?purchaseRows.map((item,i)=><div key={item.name+"-"+item.unit+"-"+i}>
            <span className="purchase-check"><ShoppingBasket size={15}/></span>
            <span><b>{item.name}</b><small>{Array.from(item.locationIds).map(id=>locationName(state,id)).join(", ")}</small></span>
            <strong>{item.quantity} {item.unit}</strong>
          </div>):<div className="empty-state small-empty"><PackageCheck size={24}/><b>Список пуст</b><span>Открытых заявок на закупку сейчас нет.</span></div>}
        </div>
      </section>
      <NotificationsInbox state={state} setState={setState} user={user}/>
    </div>

    <section className="panel mt">
      <div className="section-title">
        <div><h2>Заявки сотрудников</h2><p>Прими, закажи, закрой или отклони заявку.</p></div>
        <div className="scenario-tabs request-tabs"><button className={filter==="open"?"active":""} onClick={()=>setFilter("open")}>Открытые</button><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Все</button></div>
      </div>
      <div className="manager-request-list">
        {requests.length?requests.map(r=><article className={"manager-request "+r.priority} key={r.id}>
          <div className="manager-request-head">
            <div className="request-source"><div className={"request-category-icon "+r.priority}>{r.category==="repair"?<Wrench size={17}/>:<ShoppingBasket size={17}/>}</div><span><b>{r.title}</b><small>{requesterName(state,r.fromUserId)} · {locationName(state,r.locationId)} · {categoryLabels[r.category]}</small></span></div>
            <span className={"request-status "+statusTone[r.status]}>{statusLabels[r.status]}</span>
          </div>
          {r.description&&<p>{r.description}</p>}
          {!!r.items.length&&<div className="request-item-chips">{r.items.map(i=><span key={i.id}>{i.name} <b>{i.quantity} {i.unit}</b></span>)}</div>}
          <label className="manager-note"><span>Комментарий мастеру</span><input value={r.managerNote??""} onChange={e=>updateRequest(r.id,{managerNote:e.target.value})} placeholder="Например: закажу сегодня"/></label>
          <div className="request-actions">
            {r.status==="new"&&<button className="btn soft sm" onClick={()=>updateRequest(r.id,{status:"accepted"},"accepted")}><Check size={14}/> Принять</button>}
            {["new","accepted"].includes(r.status)&&<button className="btn soft sm" onClick={()=>updateRequest(r.id,{status:"ordered"},"ordered")}><ShoppingBasket size={14}/> Заказано</button>}
            {!["resolved","rejected"].includes(r.status)&&<button className="btn primary sm" onClick={()=>updateRequest(r.id,{status:"resolved"},"resolved")}><CheckCircle2 size={14}/> Закрыть</button>}
            {!["resolved","rejected"].includes(r.status)&&<button className="btn ghost sm" onClick={()=>updateRequest(r.id,{status:"rejected"},"rejected")}>Отклонить</button>}
          </div>
        </article>):<div className="empty-state small-empty"><Inbox size={24}/><b>Открытых заявок нет</b><span>Новые обращения мастеров появятся здесь автоматически.</span></div>}
      </div>
    </section>
  </div>;
}

function OwnerRequests({state}:{state:AppState}){
  const open=state.workRequests.filter(r=>!["resolved","rejected"].includes(r.status));
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">ЗАЯВКИ СЕТИ</span><h1>Операционные обращения</h1><p>Владельцу доступна общая картина по всем точкам.</p></div></div>
    <div className="kpi-grid three">
      <div className="kpi-card"><div className="kpi-icon red"><Inbox size={18}/></div><div className="kpi-copy"><span>Открытых</span><strong>{open.length}</strong><small>по всей сети</small></div></div>
      <div className="kpi-card"><div className="kpi-icon amber"><AlertTriangle size={18}/></div><div className="kpi-copy"><span>Срочных</span><strong>{open.filter(r=>r.priority==="urgent").length}</strong><small>требуют внимания</small></div></div>
      <div className="kpi-card"><div className="kpi-icon blue"><ShoppingBasket size={18}/></div><div className="kpi-copy"><span>На закупку</span><strong>{open.filter(r=>["supplies","equipment","household"].includes(r.category)).length}</strong><small>заявок</small></div></div>
    </div>
    <section className="panel">
      <div className="manager-request-list">{state.workRequests.length?state.workRequests.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(r=><article className={"manager-request "+r.priority} key={r.id}>
        <div className="manager-request-head"><div className="request-source"><div className={"request-category-icon "+r.priority}><Inbox size={17}/></div><span><b>{r.title}</b><small>{requesterName(state,r.fromUserId)} · {locationName(state,r.locationId)} · {categoryLabels[r.category]}</small></span></div><span className={"request-status "+statusTone[r.status]}>{statusLabels[r.status]}</span></div>
        {r.description&&<p>{r.description}</p>}
        {!!r.items.length&&<div className="request-item-chips">{r.items.map(i=><span key={i.id}>{i.name} <b>{i.quantity} {i.unit}</b></span>)}</div>}
      </article>):<div className="empty-state small-empty"><Inbox size={24}/><b>Заявок пока нет</b></div>}</div>
    </section>
  </div>;
}

export default function RequestsPage({state,setState,user}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;user:AppUser}){
  if(user.role==="master")return <MasterRequests state={state} setState={setState} user={user}/>;
  if(user.role==="manager")return <ManagerRequests state={state} setState={setState} user={user}/>;
  return <OwnerRequests state={state}/>;
}

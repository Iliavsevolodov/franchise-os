"use client";

import { useState } from "react";
import {
  BadgeCheck, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Gauge, Inbox,
  MessageSquare, Plus, ShieldCheck, Trash2, TrendingUp, UserCog, Users, WalletCards,
  ClipboardCheck, ArrowRight, Bell
} from "lucide-react";
import { AppState, AppUser, UserRole } from "@/lib/types";
import { employeeCost, locationPnl, money, num } from "@/lib/finance";
import { roleDescriptions, roleLabels } from "@/lib/access";

function Kpi({label,value,sub,icon:Icon,tone="blue"}:{label:string;value:string;sub?:string;icon:any;tone?:"blue"|"green"|"red"|"amber"}) {
  return <div className="kpi-card">
    <div className={`kpi-icon ${tone}`}><Icon size={18}/></div>
    <div className="kpi-copy"><span>{label}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>
  </div>;
}

function SectionTitle({title,sub}:{title:string;sub?:string}) {
  return <div className="section-title"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div></div>;
}

export function ManagerDashboard({state,user,onNavigate}:{state:AppState;user:AppUser;onNavigate:(tab:"staff"|"schedule"|"checklists"|"requests"|"openings")=>void}) {
  const [locationId,setLocationId]=useState(state.locations[0]?.id??"");
  const location=state.locations.find(l=>l.id===locationId)??state.locations[0];
  if(!location)return <div className="page"><div className="panel">Для управляющего пока не назначена точка.</div></div>;

  const p=locationPnl(location);
  const employees=state.employees.filter(e=>e.locationId===location.id);
  const active=employees.filter(e=>e.status==="active").length;
  const candidates=employees.filter(e=>e.status==="candidate").length;
  const planPct=location.targetRevenue?location.revenue/location.targetRevenue*100:0;
  const totalTeamPayroll=employees.reduce((sum,e)=>sum+employeeCost(e).salary,0);
  const now=new Date();
  const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const todayShifts=state.shifts.filter(s=>s.locationId===location.id&&s.date===today&&s.status!=="dayoff");
  const openRequests=state.workRequests.filter(r=>r.locationId===location.id&&!["resolved","rejected"].includes(r.status));
  const urgentRequests=openRequests.filter(r=>r.priority==="urgent").length;
  const unread=state.staffNotifications.filter(n=>n.userId===user.id&&!n.readAt).length;
  const masters=state.users.filter(u=>u.role==="master"&&u.locationIds.includes(location.id)&&u.status==="active");
  const masterTemplates=state.checklistTemplates.filter(t=>t.active&&t.role==="master"&&t.locationIds.includes(location.id));
  const mastersReady=masters.filter(m=>{
    const openTemplate=masterTemplates.find(t=>t.frequency==="shift_open");
    if(!openTemplate)return false;
    return state.checklistCompletions.some(comp=>comp.userId===m.id&&comp.templateId===openTemplate.id&&comp.locationId===location.id&&comp.date===today&&comp.completedAt);
  }).length;

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">РЕЖИМ УПРАВЛЯЮЩЕГО</span><h1>{location.city}</h1><p>Операционные показатели точки без финансов владельца.</p></div>
      <div className="manager-head-actions">
        {state.locations.length>1&&<select className="manager-location-select" value={location.id} onChange={e=>setLocationId(e.target.value)}>{state.locations.map(l=><option key={l.id} value={l.id}>{l.city}</option>)}</select>}
        <span className="role-badge manager"><UserCog size={15}/> Управляющий</span>
      </div>
    </div>

    <section className="role-workspace manager-workspace">
      <div className="role-workspace-main">
        <span className="eyebrow">РАБОЧИЙ ЦЕНТР</span>
        <h2>Что важно сегодня</h2>
        <p>Все ежедневные действия управляющего собраны в одном месте.</p>
      </div>
      <div className="role-action-grid">
        <button onClick={()=>onNavigate("schedule")}><span className="role-action-icon blue"><CalendarDays size={18}/></span><span><b>{todayShifts.length} смен сегодня</b><small>Открыть график команды</small></span><ArrowRight size={16}/></button>
        <button onClick={()=>onNavigate("checklists")}><span className="role-action-icon green"><ClipboardCheck size={18}/></span><span><b>{mastersReady}/{masters.length||0} мастеров готовы</b><small>Чек-листы открытия смены</small></span><ArrowRight size={16}/></button>
        <button onClick={()=>onNavigate("requests")} className={urgentRequests?"attention":""}><span className="role-action-icon red"><Inbox size={18}/></span><span><b>{openRequests.length} открытых заявок</b><small>{urgentRequests?"Срочных: "+urgentRequests:"Расходники и проблемы"}</small></span><ArrowRight size={16}/></button>
        <button onClick={()=>onNavigate("staff")}><span className="role-action-icon amber"><Users size={18}/></span><span><b>{unread} новых уведомлений</b><small>Команда и рабочие сообщения</small></span><ArrowRight size={16}/></button>
      </div>
    </section>

    <div className="kpi-grid">
      <Kpi label="Выручка точки" value={money(location.revenue)} sub={`план выполнен на ${num(planPct)}%`} icon={TrendingUp} tone="green"/>
      <Kpi label="Клиентов / процедур" value={String(Math.round(p.procedures))} sub={`≈ ${num(p.procedures/30)} в день`} icon={Users} tone="blue"/>
      <Kpi label="Средний чек" value={money(p.avgCheck)} sub="по текущему миксу услуг" icon={Gauge} tone="amber"/>
      <Kpi label="ФОТ команды" value={money(p.staff)} sub={`${num(p.staffPct)}% выручки`} icon={WalletCards} tone="red"/>
    </div>

    <div className="layout-2">
      <section className="panel">
        <SectionTitle title="Команда точки" sub="То, что управляющему нужно для ежедневной работы"/>
        <div className="manager-team-summary">
          <div><span>Активных</span><b>{active}</b></div>
          <div><span>Кандидатов</span><b>{candidates}</b></div>
          <div><span>План мастеров</span><b>{location.hairMasters+location.nailMasters}</b></div>
          <div><span>Начисления по карточкам</span><b>{money(totalTeamPayroll)}</b></div>
        </div>
        <div className="simple-list">
          {employees.map(e=>{
            const c=employeeCost(e);
            return <div key={e.id}>
              <span><b>{e.name}</b><small>{e.role} · {e.status==="active"?"работает":e.status==="candidate"?"кандидат":"резерв"}</small></span>
              <span><b>{money(e.revenue)}</b><small>{e.procedures} клиентов · начислено {money(c.salary)}</small></span>
            </div>;
          })}
        </div>
      </section>

      <section className="panel">
        <SectionTitle title="Контроль точки" sub="Без чистой прибыли, капитала и окупаемости владельца"/>
        <div className="ops-checks">
          <div><CheckCircle2 size={17}/><span>Плановая выручка</span><b>{money(location.targetRevenue)}</b></div>
          <div><CheckCircle2 size={17}/><span>Операционный фикс</span><b>{money(p.fixedOpex)}</b></div>
          <div><CheckCircle2 size={17}/><span>Расходники</span><b>{money(p.materials)}</b></div>
          <div><CheckCircle2 size={17}/><span>Эквайринг</span><b>{money(p.acquiring)}</b></div>
          <div><CheckCircle2 size={17}/><span>Загрузка в день</span><b>{num(p.procedures/30)} процедур</b></div>
        </div>
      </section>
    </div>
  </div>;
}

export function MasterDashboard({state,user,onNavigate}:{state:AppState;user:AppUser;onNavigate:(tab:"checklists"|"requests")=>void}) {
  const employee=state.employees.find(e=>e.id===user.employeeId);
  const location=state.locations[0];
  if(!employee)return <div className="page"><div className="panel">К аккаунту мастера не привязана карточка сотрудника.</div></div>;

  const c=employeeCost(employee);
  const avgCheck=employee.procedures?employee.revenue/employee.procedures:0;
  const perShiftClients=employee.shifts?employee.procedures/employee.shifts:0;
  const perShiftRevenue=employee.shifts?employee.revenue/employee.shifts:0;
  const shifts=state.shifts
    .filter(s=>s.employeeId===employee.id)
    .slice()
    .sort((a,b)=>a.date.localeCompare(b.date));
  const now=new Date();
  const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const todayShift=shifts.find(s=>s.date===today&&s.status!=="dayoff");
  const nextShift=shifts.find(s=>s.date>=today&&s.status!=="dayoff");
  const templates=state.checklistTemplates.filter(t=>t.active&&t.role==="master"&&t.locationIds.includes(location?.id??""));
  const completedToday=templates.filter(t=>state.checklistCompletions.some(comp=>comp.userId===user.id&&comp.templateId===t.id&&comp.date===today&&comp.completedAt)).length;
  const openRequests=state.workRequests.filter(r=>r.fromUserId===user.id&&!["resolved","rejected"].includes(r.status)).length;
  const unread=state.staffNotifications.filter(n=>n.userId===user.id&&!n.readAt).length;

  return <div className="page master-page">
    <div className="master-hero">
      <div><span className="eyebrow">ЛИЧНЫЙ КАБИНЕТ МАСТЕРА</span><h1>{employee.name}</h1><p>{location?.city??"Точка"} · {employee.role}</p></div>
      <span className="role-badge master"><BadgeCheck size={15}/> Мастер</span>
    </div>

    <section className="master-today">
      <div className="master-today-shift">
        <span className="eyebrow">СЕГОДНЯ</span>
        <div className="master-shift-time"><Clock3 size={20}/><div><b>{todayShift?todayShift.startTime+"–"+todayShift.endTime:nextShift?"Следующая смена "+new Date(nextShift.date+"T00:00:00").toLocaleDateString("ru-RU",{day:"2-digit",month:"long"}):"Смен нет"}</b><span>{todayShift?"Рабочая смена по графику":"Проверь актуальный график"}</span></div></div>
      </div>
      <button className="master-today-action" onClick={()=>onNavigate("checklists")}><span className="role-action-icon green"><ClipboardCheck size={18}/></span><span><b>Чек-листы</b><small>{completedToday}/{templates.length} выполнено сегодня</small></span><ArrowRight size={16}/></button>
      <button className="master-today-action" onClick={()=>onNavigate("requests")}><span className="role-action-icon blue"><MessageSquare size={18}/></span><span><b>Заявки управляющему</b><small>{openRequests} открытых · {unread} новых сообщений</small></span><ArrowRight size={16}/></button>
    </section>

    <div className="kpi-grid">
      <Kpi label="Личная выручка" value={money(employee.revenue)} sub="текущий расчётный период" icon={TrendingUp} tone="green"/>
      <Kpi label="Клиентов" value={String(employee.procedures)} sub={`≈ ${num(perShiftClients)} за смену`} icon={Users} tone="blue"/>
      <Kpi label="Начислено" value={money(c.salary)} sub={`${num(employee.percent)}% + фикс ${money(employee.fixed)}`} icon={CircleDollarSign} tone="red"/>
      <Kpi label="Средний чек" value={money(avgCheck)} sub={`≈ ${money(perShiftRevenue)} выручки за смену`} icon={Gauge} tone="amber"/>
    </div>

    <div className="layout-2">
      <section className="panel">
        <SectionTitle title="График работы" sub="Только личные смены мастера"/>
        <div className="shift-list">
          {shifts.length?shifts.filter(s=>s.date>=today).slice(0,6).map(s=><div key={s.id} className="shift-row">
            <div className="shift-date"><CalendarDays size={17}/><span><b>{new Date(s.date+"T00:00:00").toLocaleDateString("ru-RU",{day:"2-digit",month:"long"})}</b><small>{new Date(s.date+"T00:00:00").toLocaleDateString("ru-RU",{weekday:"long"})}</small></span></div>
            <div className="shift-time"><Clock3 size={15}/><b>{s.startTime}–{s.endTime}</b></div>
          </div>):<div className="empty-state small-empty"><CalendarDays size={24}/><b>Смен пока нет</b><span>График появится после назначения управляющим.</span></div>}
        </div>
      </section>

      <section className="panel">
        <SectionTitle title="Мои показатели" sub="Без финансов сети и данных других сотрудников"/>
        <div className="master-stats">
          <div><span>Смен в периоде</span><b>{employee.shifts}</b></div>
          <div><span>Клиентов / смену</span><b>{num(perShiftClients)}</b></div>
          <div><span>Выручка / смену</span><b>{money(perShiftRevenue)}</b></div>
          <div><span>Начисление / смену</span><b>{money(employee.shifts?c.salary/employee.shifts:0)}</b></div>
          <div><span>Мой процент</span><b>{num(employee.percent)}%</b></div>
          <div><span>Моя точка</span><b>{location?.city??"—"}</b></div>
        </div>
      </section>
    </div>
  </div>;
}

export function SchedulePage({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const firstEmployee=state.employees[0];
  const [employeeId,setEmployeeId]=useState(firstEmployee?.id??"");
  const [date,setDate]=useState("2026-10-05");
  const [startTime,setStartTime]=useState("10:00");
  const [endTime,setEndTime]=useState("20:00");

  const addShift=()=>{
    const employee=state.employees.find(e=>e.id===employeeId);
    if(!employee || !date)return;
    setState(s=>({...s,shifts:[...s.shifts,{
      id:crypto.randomUUID(),employeeId:employee.id,locationId:employee.locationId,date,startTime,endTime,status:"planned"
    }]}));
  };

  const removeShift=(id:string)=>setState(s=>({...s,shifts:s.shifts.filter(x=>x.id!==id)}));
  const rows=state.shifts.slice().sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime));

  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">ГРАФИК РАБОТЫ</span><h1>Смены мастеров</h1><p>Управляющий назначает смены, мастер видит только свой график.</p></div></div>
    <div className="layout-2">
      <section className="panel">
        <SectionTitle title="Добавить смену" sub="Выбери мастера, день и время"/>
        <div className="schedule-form">
          <label className="field"><span>Мастер</span><select value={employeeId} onChange={e=>setEmployeeId(e.target.value)}>{state.employees.map(e=><option key={e.id} value={e.id}>{e.name} · {state.locations.find(l=>l.id===e.locationId)?.city}</option>)}</select></label>
          <label className="field"><span>Дата</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          <label className="field"><span>Начало</span><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/></label>
          <label className="field"><span>Конец</span><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/></label>
        </div>
        <button className="btn primary mt-sm" onClick={addShift} disabled={!employeeId}><Plus size={16}/> Добавить смену</button>
      </section>

      <section className="panel">
        <SectionTitle title="Сводка" sub="Количество смен в текущем расписании"/>
        <div className="manager-team-summary">
          {state.employees.slice(0,4).map(e=><div key={e.id}><span>{e.name}</span><b>{state.shifts.filter(s=>s.employeeId===e.id).length} смен</b></div>)}
        </div>
      </section>
    </div>

    <section className="panel table-panel mt">
      <div className="table-wrap"><table>
        <thead><tr><th>Дата</th><th>Мастер</th><th>Точка</th><th>Время</th><th>Статус</th><th></th></tr></thead>
        <tbody>{rows.map(s=>{
          const e=state.employees.find(x=>x.id===s.employeeId);
          const l=state.locations.find(x=>x.id===s.locationId);
          return <tr key={s.id}><td>{new Date(s.date+"T00:00:00").toLocaleDateString("ru-RU")}</td><td><b>{e?.name??"—"}</b></td><td>{l?.city??"—"}</td><td>{s.startTime}–{s.endTime}</td><td>{s.status==="planned"?"Запланирована":s.status==="completed"?"Отработана":s.status==="missed"?"Неявка":"Выходной"}</td><td><button className="icon-btn" onClick={()=>removeShift(s.id)} aria-label="Удалить смену"><Trash2 size={16}/></button></td></tr>;
        })}</tbody>
      </table></div>
    </section>
  </div>;
}

export function AccessPage({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const updateUser=(id:string,patch:Partial<AppUser>)=>setState(s=>({...s,users:s.users.map(u=>u.id===id?{...u,...patch}:u)}));
  const addUser=()=>setState(s=>({...s,users:[...s.users,{
    id:crypto.randomUUID(),
    name:"Новый сотрудник",
    role:"master",
    email:"",
    locationIds:[s.locations[0]?.id].filter(Boolean) as string[],
    status:"invited"
  }]}));

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">РОЛИ И ДОСТУПЫ</span><h1>Кто что видит</h1><p>Права задаются по роли и конкретным точкам сети.</p></div>
      <button className="btn primary" onClick={addUser}>Добавить доступ</button>
    </div>

    <div className="role-cards">
      {(["owner","manager","master"] as UserRole[]).map(role=><div className={`role-card ${role}`} key={role}>
        <div><ShieldCheck size={20}/><b>{roleLabels[role]}</b></div>
        <p>{roleDescriptions[role]}</p>
      </div>)}
    </div>

    <section className="panel table-panel mt">
      <div className="table-wrap"><table>
        <thead><tr><th>Пользователь</th><th>Роль</th><th>Точка</th><th>Карточка мастера</th><th>Статус</th></tr></thead>
        <tbody>{state.users.map(u=><tr key={u.id}>
          <td><input className="table-input" value={u.name} disabled={u.id==="owner"} onChange={e=>updateUser(u.id,{name:e.target.value})}/></td>
          <td><select value={u.role} disabled={u.id==="owner"} onChange={e=>updateUser(u.id,{role:e.target.value as UserRole})}><option value="owner">Владелец</option><option value="manager">Управляющий</option><option value="master">Мастер</option></select></td>
          <td><div className="access-locations">{state.locations.map(l=><label key={l.id} className={u.id==="owner"?"disabled":""}><input type="checkbox" disabled={u.id==="owner"} checked={u.locationIds.includes(l.id)} onChange={e=>updateUser(u.id,{locationIds:e.target.checked?[...new Set([...u.locationIds,l.id])]:u.locationIds.filter(id=>id!==l.id)})}/><span>{l.city}</span></label>)}</div></td>
          <td><select value={u.employeeId??""} disabled={u.role!=="master"} onChange={e=>updateUser(u.id,{employeeId:e.target.value||undefined})}><option value="">Не привязан</option>{state.employees.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></td>
          <td><select value={u.status} disabled={u.id==="owner"} onChange={e=>updateUser(u.id,{status:e.target.value as AppUser["status"]})}><option value="active">Активен</option><option value="invited">Приглашён</option><option value="disabled">Отключён</option></select></td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Bell, BookOpen, BriefcaseBusiness,
  Building2, Calculator, CalendarDays, CalendarRange, CheckCircle2, ChevronLeft,
  ChevronRight, Circle, CircleDollarSign, ClipboardCheck, Coins, CreditCard, FileText, Gauge,
  Landmark, LayoutDashboard, Menu, PiggyBank, Plus, ReceiptText, RotateCcw, Save,
  Settings, ShieldCheck, Sparkles, Target, Trash2, TrendingUp, Users, Wallet, X,
  LockKeyhole, Delete, MessageSquare, Search
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import { seed } from "@/lib/seed";
import { franchiseData } from "@/lib/franchiseData";
import { ActualMonth, AppState, AppUser, CashEvent, Employee, FundTx, Location, Scenario } from "@/lib/types";
import { actualNet, employeeCost, locationPnl, money, num } from "@/lib/finance";
import { navByRole, roleLabels, scopedState } from "@/lib/access";
import { AccessPage, ManagerDashboard, MasterDashboard, SchedulePage } from "@/components/RoleViews";
import ChecklistsPage from "@/components/Checklists";
import RequestsPage from "@/components/WorkRequests";

type Tab =
  | "overview" | "calendar" | "actuals" | "notifications" | "locations" | "finance" | "scenarios"
  | "staff" | "schedule" | "checklists" | "requests" | "funds" | "openings" | "payments" | "dossier" | "access" | "settings";

type NavGroup = "overview" | "finance" | "team" | "growth" | "system";

const nav: {id:Tab; label:string; icon:any; group:NavGroup}[] = [
  {id:"overview",label:"Главная",icon:LayoutDashboard,group:"overview"},
  {id:"locations",label:"Точки",icon:Building2,group:"overview"},
  {id:"notifications",label:"Уведомления",icon:Bell,group:"overview"},

  {id:"actuals",label:"План vs факт",icon:ReceiptText,group:"finance"},
  {id:"calendar",label:"Календарь денег",icon:CalendarDays,group:"finance"},
  {id:"finance",label:"P&L и прибыль",icon:CircleDollarSign,group:"finance"},
  {id:"scenarios",label:"Сценарии",icon:Calculator,group:"finance"},
  {id:"funds",label:"Фонды",icon:PiggyBank,group:"finance"},
  {id:"payments",label:"Платежи",icon:CreditCard,group:"finance"},

  {id:"staff",label:"Команда",icon:Users,group:"team"},
  {id:"schedule",label:"График",icon:CalendarDays,group:"team"},
  {id:"checklists",label:"Чек-листы",icon:ClipboardCheck,group:"team"},
  {id:"requests",label:"Заявки",icon:MessageSquare,group:"team"},

  {id:"openings",label:"Открытия",icon:CalendarRange,group:"growth"},
  {id:"dossier",label:"База STRIXY",icon:BookOpen,group:"growth"},

  {id:"access",label:"Роли и доступы",icon:ShieldCheck,group:"system"},
  {id:"settings",label:"Настройки",icon:Settings,group:"system"},
];

const navGroups:{id:NavGroup;label:string}[]=[
  {id:"overview",label:"Обзор"},
  {id:"finance",label:"Финансы"},
  {id:"team",label:"Команда"},
  {id:"growth",label:"Развитие"},
  {id:"system",label:"Система"}
];

function cloneSeed(): AppState {
  return JSON.parse(JSON.stringify(seed));
}

function hydrateState(raw:any): AppState {
  const base=cloneSeed();
  if(!raw || typeof raw!=="object") return base;
  const savedLocations=Array.isArray(raw.locations)?raw.locations:[];
  return {
    ...base,
    ...raw,
    locations:base.locations.map(b=>{
      const saved=savedLocations.find((x:any)=>x.id===b.id);
      return saved ? {...b,...saved,services:Array.isArray(saved.services)?saved.services:b.services} : b;
    }),
    employees:Array.isArray(raw.employees)?raw.employees:base.employees,
    funds:Array.isArray(raw.funds)?raw.funds:base.funds,
    scenarios:Array.isArray(raw.scenarios)?raw.scenarios:base.scenarios,
    openingTasks:Array.isArray(raw.openingTasks)?raw.openingTasks:base.openingTasks,
    actuals:Array.isArray(raw.actuals)?raw.actuals:base.actuals,
    cashEvents:Array.isArray(raw.cashEvents)?raw.cashEvents:base.cashEvents,
    dismissedNotifications:Array.isArray(raw.dismissedNotifications)?raw.dismissedNotifications:base.dismissedNotifications,
    cashBalance:Number.isFinite(raw.cashBalance)?raw.cashBalance:base.cashBalance,
    privateNotes:Array.isArray(raw.privateNotes)?raw.privateNotes:base.privateNotes,
    users:Array.isArray(raw.users)?raw.users:base.users,
    shifts:Array.isArray(raw.shifts)?raw.shifts:base.shifts,
    checklistTemplates:Array.isArray(raw.checklistTemplates)?raw.checklistTemplates:base.checklistTemplates,
    checklistCompletions:Array.isArray(raw.checklistCompletions)?raw.checklistCompletions:base.checklistCompletions,
    workRequests:Array.isArray(raw.workRequests)?raw.workRequests:base.workRequests,
    staffNotifications:Array.isArray(raw.staffNotifications)?raw.staffNotifications:base.staffNotifications,
  };
}

function downloadCsv(filename:string, rows:(string|number)[][]) {
  const csv=rows.map(row=>row.map(cell=>{
    const value=String(cell??"");
    return /[;"\n]/.test(value)?`"${value.replace(/"/g,'""')}"`:value;
  }).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=filename;
  a.click();
  URL.revokeObjectURL(url);
}

function localIsoDate(d=new Date()) {
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function monthKey(d=new Date()) {
  return localIsoDate(d).slice(0,7);
}

function addMonthsToIso(date:string,months:number) {
  const [y,m,d]=date.split("-").map(Number);
  const x=new Date(y,m-1+months,d);
  if(x.getMonth()!==((m-1+months)%12+12)%12){
    x.setDate(0);
  }
  return localIsoDate(x);
}

function daysUntil(date:string) {
  const [y,m,d]=date.split("-").map(Number);
  const due=new Date(y,m-1,d);
  const now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  return Math.round((due.getTime()-today.getTime())/86400000);
}

function signedCash(e:CashEvent) {
  return e.type==="income" ? e.amount : -e.amount;
}

function cashOccurrences(events:CashEvent[],from:string,to:string) {
  const output:{event:CashEvent;date:string}[]=[];
  for(const event of events){
    if(event.status!=="planned")continue;
    if(event.recurrence==="once"){
      if(event.dueDate>=from&&event.dueDate<=to)output.push({event,date:event.dueDate});
      continue;
    }
    let date=event.dueDate;
    let guard=0;
    while(date<=to&&guard<36){
      if(date>=from)output.push({event,date});
      date=addMonthsToIso(date,1);
      guard++;
    }
  }
  return output.sort((a,b)=>a.date.localeCompare(b.date));
}

type AppNotification = {
  id:string;
  title:string;
  body:string;
  level:"critical"|"warning"|"info"|"success";
  date?:string;
  source:"money"|"plan"|"system";
};

function buildNotifications(state:AppState):AppNotification[] {
  const out:AppNotification[]=[];
  for(const e of state.cashEvents){
    if(e.status!=="planned")continue;
    const d=daysUntil(e.dueDate);
    if(d<0){
      out.push({id:`cash-overdue-${e.id}-${e.dueDate}`,title:`Просрочено: ${e.title}`,body:`${money(e.amount)} · срок был ${e.dueDate}`,level:"critical",date:e.dueDate,source:"money"});
    }else if(d<=e.reminderDays){
      out.push({id:`cash-due-${e.id}-${e.dueDate}`,title:d===0?`Сегодня: ${e.title}`:`${e.title} через ${d} дн.`,body:`${money(e.amount)} · ${e.type==="expense"?"расход":"поступление"}`,level:d<=1?"warning":"info",date:e.dueDate,source:"money"});
    }
  }

  const latestByLocation=new Map<string,ActualMonth>();
  for(const a of [...state.actuals].sort((x,y)=>y.month.localeCompare(x.month))){
    if(!latestByLocation.has(a.locationId))latestByLocation.set(a.locationId,a);
  }
  for(const [locationId,a] of latestByLocation){
    const l=state.locations.find(x=>x.id===locationId);
    if(!l)continue;
    const revenueRatio=l.revenue>0?a.revenue/l.revenue:1;
    if(a.revenue>0&&revenueRatio<0.9){
      out.push({id:`plan-revenue-${a.id}`,title:`${l.city}: выручка ниже плана`,body:`${money(a.revenue)} вместо ${money(l.revenue)} · ${num((revenueRatio-1)*100)}%`,level:revenueRatio<0.75?"critical":"warning",source:"plan"});
    }
    const net=actualNet(a);
    if(a.revenue>0&&net<0){
      out.push({id:`plan-loss-${a.id}`,title:`${l.city}: месяц в минусе`,body:`Фактический результат ${money(net)}`,level:"critical",source:"plan"});
    }
  }

  for(const l of state.locations){
    const share=l.services.reduce((s,x)=>s+x.sharePct,0);
    if(Math.abs(share-100)>.01){
      out.push({id:`service-share-${l.id}`,title:`${l.city}: проверь структуру услуг`,body:`Сумма долей сейчас ${num(share)}%, должна быть 100%`,level:"warning",source:"system"});
    }
  }

  const horizon=new Date();
  horizon.setDate(horizon.getDate()+30);
  const upcoming=cashOccurrences(state.cashEvents,localIsoDate(),localIsoDate(horizon));
  const forecast=state.cashBalance+upcoming.reduce((s,x)=>s+signedCash(x.event),0);
  if(forecast<600000){
    out.push({id:"cash-reserve-30",title:"Резерв на горизонте 30 дней низкий",body:`Прогноз остатка: ${money(forecast)}`,level:forecast<0?"critical":"warning",source:"money"});
  }

  return out.sort((a,b)=>{
    const rank={critical:0,warning:1,info:2,success:3};
    return rank[a.level]-rank[b.level] || (a.date??"9999").localeCompare(b.date??"9999");
  });
}

function Pill({children,tone="neutral"}:{children:React.ReactNode;tone?:"neutral"|"green"|"amber"|"red"|"blue"}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function SectionTitle({title,sub,action}:{title:string;sub?:string;action?:React.ReactNode}) {
  return <div className="section-title">
    <div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>
    {action}
  </div>;
}

function formatEditableNumber(value:number) {
  if(!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2,useGrouping:true})
    .format(value)
    .replace(/\u00A0/g," ")
    .replace(/\u202F/g," ");
}

function parseEditableNumber(raw:string) {
  const normalized=raw.replace(/[\s\u00A0\u202F]/g,"").replace(",",".").replace(/[^0-9.\-]/g,"");
  const value=Number(normalized);
  return Number.isFinite(value)?value:0;
}

function Field({label,value,onChange,suffix,prefix,helper,emphasis=false,allowNegative=false}:{label:string;value:number;onChange:(n:number)=>void;suffix?:string;prefix?:string;helper?:string;emphasis?:boolean;allowNegative?:boolean}) {
  const keyboardMode: React.HTMLAttributes<HTMLInputElement>["inputMode"] =
    suffix==="%" || allowNegative ? "decimal" : "numeric";
  return <label className={`field ${emphasis?"field-emphasis":""}`}>
    <span className="field-label">{label}</span>
    <div className="field-control">
      {prefix&&<b className="field-prefix">{prefix}</b>}
      <input
        type="text"
        inputMode={keyboardMode}
        pattern={keyboardMode==="numeric" ? "[0-9 ]*" : undefined}
        autoComplete="off"
        value={formatEditableNumber(value)}
        onChange={e=>onChange(parseEditableNumber(e.target.value))}
        aria-label={label}
      />
      {suffix&&<b className="field-suffix">{suffix}</b>}
    </div>
    {helper&&<small className="field-helper">{helper}</small>}
  </label>;
}

function CompactNumberInput({value,onChange,suffix}:{value:number;onChange:(n:number)=>void;suffix?:string}) {
  const keyboardMode: React.HTMLAttributes<HTMLInputElement>["inputMode"] = suffix==="%" ? "decimal" : "numeric";
  return <div className="compact-number">
    <input
      type="text"
      inputMode={keyboardMode}
      pattern={keyboardMode==="numeric" ? "[0-9 ]*" : undefined}
      autoComplete="off"
      value={formatEditableNumber(value)}
      onChange={e=>onChange(parseEditableNumber(e.target.value))}
    />
    {suffix&&<span>{suffix}</span>}
  </div>;
}

function Kpi({label,value,sub,icon:Icon,tone="red"}:{label:string;value:string;sub?:string;icon:any;tone?:"red"|"green"|"blue"|"amber"}) {
  return <div className="kpi-card">
    <div className={`kpi-icon ${tone}`}><Icon size={18}/></div>
    <div className="kpi-copy"><span>{label}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>
  </div>;
}

function PasscodeGate({onUnlock}:{onUnlock:()=>void}) {
  const [pin,setPin]=useState("");
  const [error,setError]=useState(false);
  const [checking,setChecking]=useState(false);
  const pinHash="940a01e99ef8b507cbef66b5d642c154172c06acc4193389edd911af96c9e745";

  const digest=async(value:string)=>{
    const bytes=new TextEncoder().encode(value);
    const hash=await crypto.subtle.digest("SHA-256",bytes);
    return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");
  };

  const verify=async(value:string)=>{
    if(value.length!==4 || checking)return;
    setChecking(true);
    const hash=await digest(value);
    if(hash===pinHash){
      sessionStorage.setItem("franchise-os-unlocked","1");
      setError(false);
      onUnlock();
    }else{
      setError(true);
      setTimeout(()=>{setPin("");setError(false);setChecking(false)},420);
      return;
    }
    setChecking(false);
  };

  const press=(digit:string)=>{
    if(checking || pin.length>=4)return;
    const next=pin+digit;
    setPin(next);
    if(next.length===4)void verify(next);
  };

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(/^[0-9]$/.test(e.key))press(e.key);
      if(e.key==="Backspace")setPin(v=>v.slice(0,-1));
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[pin,checking]);

  return <div className="passcode-screen">
    <div className="passcode-brand"><div className="brand-mark">F</div><div><b>FRANCHISE OS</b><span>PRIVATE OWNER ACCESS</span></div></div>
    <div className={`passcode-card ${error?"error":""}`}>
      <div className="passcode-lock"><LockKeyhole size={24}/></div>
      <h1>Вход в платформу</h1>
      <p>Введите 4-значный код доступа</p>
      <div className="pin-dots" aria-label={`Введено ${pin.length} из 4 цифр`}>
        {[0,1,2,3].map(i=><span key={i} className={i<pin.length?"filled":""}/>)}
      </div>
      <div className="keypad" aria-label="Цифровая клавиатура">
        {["1","2","3","4","5","6","7","8","9"].map(n=><button type="button" key={n} onClick={()=>press(n)}>{n}</button>)}
        <button type="button" className="keypad-empty" aria-hidden="true" tabIndex={-1}></button>
        <button type="button" onClick={()=>press("0")}>0</button>
        <button type="button" className="keypad-delete" onClick={()=>setPin(v=>v.slice(0,-1))} aria-label="Удалить цифру"><Delete size={22}/></button>
      </div>
      <div className="passcode-status">{error?"Неверный код. Попробуйте ещё раз.":checking?"Проверяем…":"Клавиатура уже готова к вводу"}</div>
    </div>
    <div className="passcode-footer">STRIXY · OWNER COCKPIT</div>
  </div>;
}


function LocationStatus({status}:{status:Location["status"]}) {
  const map={
    planned:{label:"Запланировано",tone:"neutral" as const},
    opening:{label:"В запуске",tone:"amber" as const},
    active:{label:"Работает",tone:"green" as const}
  };
  const x=map[status];
  return <Pill tone={x.tone}>{x.label}</Pill>;
}

function Overview({state,setTab,setSelected}:{state:AppState;setTab:(t:Tab)=>void;setSelected:(id:string)=>void}) {
  const rows=state.locations.map(l=>({l,p:locationPnl(l)}));
  const totalRevenue=rows.reduce((s,x)=>s+x.l.revenue,0);
  const totalNet=rows.reduce((s,x)=>s+x.p.net,0);
  const totalFreeCash=rows.reduce((s,x)=>s+x.p.freeCash,0);
  const reservedInstallments=state.locations.reduce((s,l)=>s+l.installmentBalance,0);
  const capital=(state.capitalMin+state.capitalMax)/2;
  const invested=state.locations.filter(l=>l.status!=="planned").reduce((s,l)=>s+l.launchCost,0);
  const freeReserve=Math.max(0,capital-invested-reservedInstallments);
  const next=state.locations.find(l=>l.status==="planned") ?? state.locations.find(l=>l.status==="opening");

  const readiness=[
    {label:"Резерв ≥ 600 тыс. ₽",ok:freeReserve>=600000},
    {label:"Есть прибыльная работающая точка",ok:state.locations.some(l=>l.status==="active"&&locationPnl(l).net>0)},
    {label:"Команда: минимум 4 активных сотрудника",ok:state.employees.filter(e=>e.status==="active").length>=4},
    {label:"CAPEX следующей точки покрывается",ok:next?freeReserve>=next.launchCost:true},
  ];
  const readyCount=readiness.filter(x=>x.ok).length;
  const readinessPct=Math.round(readyCount/readiness.length*100);

  const barData=rows.map(({l,p})=>({name:l.city,revenue:l.revenue,profit:Math.max(0,p.net)}));
  const actualChart=state.actuals.slice().sort((a,b)=>a.month.localeCompare(b.month)).slice(-8).map(a=>({
    month:a.month.slice(5)+"/"+a.month.slice(2,4),
    revenue:a.revenue,
    profit:actualNet(a)
  }));

  const today=localIsoDate();
  const inSeven=new Date();
  inSeven.setDate(inSeven.getDate()+7);
  const upcomingPayments=cashOccurrences(state.cashEvents,today,localIsoDate(inSeven)).filter(x=>x.event.type==="expense");
  const openRequests=state.workRequests.filter(r=>!["resolved","rejected"].includes(r.status));
  const urgentRequests=openRequests.filter(r=>r.priority==="urgent");
  const ownerAlerts=buildNotifications(state).filter(n=>!state.dismissedNotifications.includes(n.id));
  const activeStaff=state.users.filter(u=>u.role!=="owner"&&u.status==="active");
  const incompleteChecklists=activeStaff.filter(u=>{
    const loc=u.locationIds[0];
    const templates=state.checklistTemplates.filter(t=>t.active&&t.role===u.role&&t.locationIds.includes(loc));
    if(!templates.length)return false;
    return templates.some(t=>!state.checklistCompletions.some(comp=>comp.userId===u.id&&comp.templateId===t.id&&comp.locationId===loc&&comp.date===today&&comp.completedAt));
  }).length;

  return <div className="page">
    <div className="welcome">
      <div>
        <span className="eyebrow">FRANCHISE OS · STRIXY</span>
        <h1>Панель владельца сети</h1>
        <p>Капитал, прибыль, команда и открытия — в одном понятном контуре.</p>
      </div>
      <div className="welcome-actions">
        <button className="btn ghost" onClick={()=>setTab("actuals")}><ReceiptText size={16}/> Добавить факт</button>
        <button className="btn primary" onClick={()=>setTab("scenarios")}><Calculator size={16}/> Проверить сценарий</button>
      </div>
    </div>

    <div className="summary-strip">
      <div className="summary-main">
        <div className="summary-label">Плановый оборот сети</div>
        <div className="summary-value">{money(totalRevenue)}</div>
        <div className="summary-note">минимальный зрелый сценарий</div>
      </div>
      <div className="summary-divider"/>
      <div className="summary-side"><span>Чистая прибыль</span><b>{money(totalNet)}</b><small>{num(totalRevenue?totalNet/totalRevenue*100:0)}% маржа</small></div>
      <div className="summary-side"><span>Свободный денежный поток</span><b>{money(totalFreeCash)}</b><small>после текущих рассрочек</small></div>
      <div className="summary-side"><span>Капитал</span><b>{money(state.capitalMin)}–{money(state.capitalMax)}</b><small>без кредита</small></div>
    </div>

    <div className="kpi-grid">
      <Kpi label="Свободный резерв" value={money(freeReserve)} sub="после зарезервированных рассрочек" icon={Wallet} tone="green"/>
      <Kpi label="Рассрочки STRIXY" value={money(reservedInstallments)} sub="будущие обязательства сети" icon={Landmark} tone="amber"/>
      <Kpi label="Фонды / месяц" value={money(state.locations.reduce((s,l)=>s+l.depreciationFund+l.cultureFund,0))} sub="амортизация + команда" icon={PiggyBank} tone="blue"/>
      <Kpi label="Готовность к следующей точке" value={`${readinessPct}%`} sub={next?`следующая: ${next.city}`:"план выполнен"} icon={Target} tone={readinessPct===100?"green":"red"}/>
    </div>

    <section className="attention-center">
      <div className="attention-head">
        <div><span className="eyebrow">СЕГОДНЯ</span><h2>Центр внимания</h2><p>Сначала то, что требует решения. Потом — аналитика.</p></div>
        <div className="attention-score">{ownerAlerts.length+openRequests.length+incompleteChecklists===0?<><CheckCircle2 size={18}/><span>Всё спокойно</span></>:<><AlertTriangle size={18}/><span>{ownerAlerts.length+openRequests.length+incompleteChecklists} сигналов</span></>}</div>
      </div>
      <div className="attention-grid">
        <button onClick={()=>setTab("notifications")} className={`attention-item ${ownerAlerts.some(x=>x.level==="critical")?"danger":ownerAlerts.length?"warning":"ok"}`}>
          <span className="attention-icon"><Bell size={18}/></span>
          <span><b>{ownerAlerts.length?ownerAlerts.length:"0"} финансовых сигналов</b><small>{ownerAlerts[0]?.title??"Просроченных и критичных событий нет"}</small></span>
          <ChevronRight size={18}/>
        </button>
        <button onClick={()=>setTab("requests")} className={`attention-item ${urgentRequests.length?"danger":openRequests.length?"warning":"ok"}`}>
          <span className="attention-icon"><MessageSquare size={18}/></span>
          <span><b>{openRequests.length} открытых заявок</b><small>{urgentRequests.length?`Срочных: ${urgentRequests.length}`:"Команда без срочных обращений"}</small></span>
          <ChevronRight size={18}/>
        </button>
        <button onClick={()=>setTab("checklists")} className={`attention-item ${incompleteChecklists?"warning":"ok"}`}>
          <span className="attention-icon"><ClipboardCheck size={18}/></span>
          <span><b>{incompleteChecklists} сотрудников с незакрытыми чек-листами</b><small>{incompleteChecklists?"Можно проверить выполнение":"Обязательные процессы закрыты"}</small></span>
          <ChevronRight size={18}/>
        </button>
        <button onClick={()=>setTab("calendar")} className={`attention-item ${upcomingPayments.length?"warning":"ok"}`}>
          <span className="attention-icon"><CalendarDays size={18}/></span>
          <span><b>{upcomingPayments.length} платежей в ближайшие 7 дней</b><small>{upcomingPayments.length?`На сумму ${money(upcomingPayments.reduce((s,x)=>s+x.event.amount,0))}`:"На неделю обязательств нет"}</small></span>
          <ChevronRight size={18}/>
        </button>
      </div>
      <div className="quick-actions">
        <button onClick={()=>setTab("actuals")}><ReceiptText size={16}/><span><b>Добавить факт</b><small>Закрыть месяц</small></span></button>
        <button onClick={()=>setTab("schedule")}><CalendarDays size={16}/><span><b>График</b><small>Смены команды</small></span></button>
        <button onClick={()=>setTab("requests")}><MessageSquare size={16}/><span><b>Заявки</b><small>Закупки и проблемы</small></span></button>
        <button onClick={()=>setTab("openings")}><Building2 size={16}/><span><b>Открытия</b><small>План следующей точки</small></span></button>
      </div>
    </section>

    <div className="layout-2">
      <section className="panel">
        <SectionTitle title="Точки сети" sub="Плановая зрелая экономика"/>
        <div className="location-list">
          {rows.map(({l,p})=><button key={l.id} className="location-row" onClick={()=>{setSelected(l.id);setTab("locations")}}>
            <div className="location-id"><div className="location-avatar">{l.city[0]}</div><div><b>{l.city}</b><span>{l.format}</span></div></div>
            <div className="location-metric"><span>Выручка</span><b>{money(l.revenue)}</b></div>
            <div className="location-metric"><span>Прибыль</span><b className={p.net>=0?"positive":"negative"}>{money(p.net)}</b></div>
            <div className="location-metric desktop-only"><span>Маржа</span><b>{num(p.margin)}%</b></div>
            <LocationStatus status={l.status}/>
            <ChevronRight size={18} className="muted"/>
          </button>)}
        </div>
      </section>

      <section className="panel action-panel">
        <SectionTitle title="Следующий шаг" sub={next?`Фокус: ${next.city}`:"Все точки запущены"}/>
        <div className="readiness-ring" style={{"--progress":`${readinessPct}%`} as React.CSSProperties}>
          <div><b>{readinessPct}%</b><span>готовность</span></div>
        </div>
        <div className="readiness-list">
          {readiness.map(r=><div key={r.label}>{r.ok?<CheckCircle2 size={17} className="positive"/>:<Circle size={17}/>}<span>{r.label}</span></div>)}
        </div>
        <button className="btn soft full" onClick={()=>setTab("openings")}>Открыть план запуска <ArrowRight size={16}/></button>
      </section>
    </div>

    <div className="layout-2 charts">
      <section className="panel">
        <SectionTitle title="План: выручка и прибыль" sub="По городам"/>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid vertical={false} stroke="#eef0f4"/>
            <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#858b98"/>
            <YAxis tickLine={false} axisLine={false} stroke="#858b98" tickFormatter={v=>`${Math.round(Number(v)/1000)}k`}/>
            <Tooltip formatter={(v:any)=>money(Number(v))} contentStyle={{background:"#fff",border:"1px solid #e7e9ef",borderRadius:12,boxShadow:"0 10px 30px rgba(20,27,45,.08)"}}/>
            <Legend/>
            <Bar dataKey="revenue" name="Выручка" fill="#151a24" radius={[7,7,0,0]}/>
            <Bar dataKey="profit" name="Чистая прибыль" fill="#ff4d57" radius={[7,7,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <SectionTitle title={actualChart.length?"Фактическая динамика":"Фактические данные"} sub={actualChart.length?"Последние записи":"Начни вносить месяцы после запуска"}/>
        {actualChart.length?<ResponsiveContainer width="100%" height={280}>
          <LineChart data={actualChart}>
            <CartesianGrid vertical={false} stroke="#eef0f4"/>
            <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#858b98"/>
            <YAxis tickLine={false} axisLine={false} stroke="#858b98" tickFormatter={v=>`${Math.round(Number(v)/1000)}k`}/>
            <Tooltip formatter={(v:any)=>money(Number(v))} contentStyle={{background:"#fff",border:"1px solid #e7e9ef",borderRadius:12}}/>
            <Line dataKey="revenue" name="Выручка" stroke="#151a24" strokeWidth={3} dot={false}/>
            <Line dataKey="profit" name="Прибыль" stroke="#ff4d57" strokeWidth={3} dot={false}/>
          </LineChart>
        </ResponsiveContainer>:<div className="empty-state"><Activity size={28}/><b>Факт пока не внесён</b><span>Когда откроется первая точка, здесь появится динамика по месяцам.</span><button className="btn soft" onClick={()=>setTab("actuals")}>Открыть раздел «Факт»</button></div>}
      </section>
    </div>
  </div>;
}

function Locations({state,setState,selected,setSelected}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;selected:string;setSelected:(s:string)=>void}) {
  const l=state.locations.find(x=>x.id===selected)??state.locations[0];
  const p=locationPnl(l);
  const update=(patch:Partial<Location>)=>setState(s=>({...s,locations:s.locations.map(x=>x.id===l.id?{...x,...patch}:x)}));
  const serviceShare=l.services.reduce((s,x)=>s+x.sharePct,0);
  const totalMasters=l.hairMasters+l.nailMasters;
  const avgSalary=totalMasters?p.staff/totalMasters:0;
  const proceduresPerDay=p.procedures/30;

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">ТОЧКИ СЕТИ</span><h1>{l.city}</h1><p>{l.format}</p></div>
      <div className="tabs-compact">{state.locations.map(x=><button key={x.id} className={selected===x.id?"active":""} onClick={()=>setSelected(x.id)}>{x.city}</button>)}</div>
    </div>

    <div className="location-overview">
      <div><span>Выручка</span><b>{money(l.revenue)}</b></div>
      <div><span>Чистая прибыль</span><b>{money(p.net)}</b></div>
      <div><span>Средний чек</span><b>{money(p.avgCheck)}</b></div>
      <div><span>Процедур / день</span><b>{num(proceduresPerDay)}</b></div>
      <div><span>Средняя ЗП мастера</span><b>{money(avgSalary)}</b></div>
    </div>

    <div className="layout-2 location-editor">
      <section className="panel">
        <SectionTitle title="Экономика точки" sub="Все поля можно менять — расчёт обновляется сразу"/>
        <div className="form-grid">
          <Field label="Плановая выручка" value={l.revenue} onChange={v=>update({revenue:v})} suffix="₽" helper="Целевой оборот точки за месяц" emphasis/>
          <Field label="Стоимость запуска" value={l.launchCost} onChange={v=>update({launchCost:v})} suffix="₽" helper="Деньги до открытия точки"/>
          <Field label="Аренда + КУ" value={l.rent} onChange={v=>update({rent:v})} suffix="₽"/>
          <Field label="Реклама / месяц" value={l.marketing} onChange={v=>update({marketing:v})} suffix="₽"/>
          <Field label="Расходники" value={l.materialsPct} onChange={v=>update({materialsPct:v})} suffix="%"/>
          <Field label="Эквайринг" value={l.acquiringPct} onChange={v=>update({acquiringPct:v})} suffix="%"/>
          <Field label="Налоговый резерв" value={l.taxPct} onChange={v=>update({taxPct:v})} suffix="%"/>
          <Field label="Амортизационный фонд" value={l.depreciationFund} onChange={v=>update({depreciationFund:v})} suffix="₽"/>
          <Field label="Фонд команды" value={l.cultureFund} onChange={v=>update({cultureFund:v})} suffix="₽"/>
          <Field label="Рассрочка / месяц" value={l.installmentMonthly} onChange={v=>update({installmentMonthly:v})} suffix="₽"/>
        </div>

        <div className="subsection">
          <div className="row between"><div><h3>Статус и команда</h3><p className="muted">Используется для readiness и расчёта загрузки.</p></div></div>
          <div className="form-grid">
            <label className="field"><span>Статус точки</span><select value={l.status} onChange={e=>update({status:e.target.value as Location["status"]})}><option value="planned">Запланировано</option><option value="opening">В запуске</option><option value="active">Работает</option></select></label>
            <label className="field"><span>Целевая зона</span><input value={l.targetZone} onChange={e=>update({targetZone:e.target.value})}/></label>
            <Field label="Парикмахеров" value={l.hairMasters} onChange={v=>update({hairMasters:v})}/>
            <Field label="Nail-мастеров" value={l.nailMasters} onChange={v=>update({nailMasters:v})}/>
          </div>
          <label className="toggle-row"><input type="checkbox" checked={l.officialEmployment} onChange={e=>update({officialEmployment:e.target.checked})}/><div><b>Считать официальное трудоустройство сверху</b><span>Добавляет страховые взносы и кадровые резервы поверх начисленной зарплаты.</span></div></label>
          {l.officialEmployment&&<div className="form-grid compact">
            <Field label="Страховые взносы" value={l.employerInsurancePct} onChange={v=>update({employerInsurancePct:v})} suffix="%"/>
            <Field label="Отпускные" value={l.vacationReservePct} onChange={v=>update({vacationReservePct:v})} suffix="%"/>
            <Field label="Больничные / резерв" value={l.sickReservePct} onChange={v=>update({sickReservePct:v})} suffix="%"/>
          </div>}
        </div>

        <div className="subsection">
          <div className="row between"><div><h3>Структура услуг</h3><p className={serviceShare===100?"muted":"warning-text"}>Сумма долей: {num(serviceShare)}%</p></div><button className="btn soft sm" onClick={()=>update({services:[...l.services,{id:crypto.randomUUID(),name:"Новая услуга",price:500,sharePct:0,masterPct:50}]})}><Plus size={15}/> Услуга</button></div>
          <div className="service-table">
            {l.services.map((s,i)=>{
              const revenue=l.revenue*s.sharePct/100;
              const procedures=s.price?revenue/s.price:0;
              const patch=(x:Partial<typeof s>)=>update({services:l.services.map((v,j)=>j===i?{...v,...x}:v)});
              return <div className="service-row" key={s.id}>
                <div className="service-name"><input value={s.name} onChange={e=>patch({name:e.target.value})}/><span>{money(revenue)} · ≈ {Math.round(procedures)} процедур</span></div>
                <Field label="Цена" value={s.price} onChange={v=>patch({price:v})} suffix="₽"/>
                <Field label="Доля" value={s.sharePct} onChange={v=>patch({sharePct:v})} suffix="%"/>
                <Field label="Мастеру" value={s.masterPct} onChange={v=>patch({masterPct:v})} suffix="%"/>
              </div>;
            })}
          </div>
        </div>
      </section>

      <section className="panel pnl-sticky">
        <SectionTitle title="P&L зрелого месяца" sub="Свободные деньги отделены от фондов и рассрочки"/>
        <div className="pnl-list">
          <div><span>Выручка</span><b>{money(l.revenue)}</b></div>
          <div><span>ФОТ мастеров · {num(p.staffPct)}%</span><b>−{money(p.staff)}</b></div>
          {p.employerCosts>0&&<div><span>Работодатель сверху</span><b>−{money(p.employerCosts)}</b></div>}
          <div><span>Расходники</span><b>−{money(p.materials)}</b></div>
          <div><span>Эквайринг</span><b>−{money(p.acquiring)}</b></div>
          <div><span>Операционные постоянные</span><b>−{money(p.fixedOpex)}</b></div>
          <div><span>Фонды</span><b>−{money(p.reserves)}</b></div>
          <div><span>Налоговый резерв</span><b>−{money(p.tax)}</b></div>
          <div className="pnl-total"><span>Чистая прибыль</span><b>{money(p.net)}</b></div>
          <div><span>Текущая рассрочка</span><b>−{money(p.installment)}</b></div>
          <div className="cash-total"><span>Свободный cash flow</span><b>{money(p.freeCash)}</b></div>
        </div>
        <div className="mini-grid">
          <div><span>Безубыточность</span><b>{money(p.breakEvenRevenue)}</b></div>
          <div><span>Чистая маржа</span><b>{num(p.margin)}%</b></div>
          <div><span>Процедур / месяц</span><b>{Math.round(p.procedures)}</b></div>
          <div><span>Средний чек</span><b>{money(p.avgCheck)}</b></div>
        </div>
        {p.freeCash<0&&<div className="alert amber"><AlertTriangle size={18}/><span>Точка в текущих настройках создаёт кассовый минус.</span></div>}
      </section>
    </div>
  </div>;
}

function Finance({state}:{state:AppState}) {
  const rows=state.locations.map(l=>({l,p:locationPnl(l)}));
  const totalRevenue=rows.reduce((s,x)=>s+x.l.revenue,0);
  const totalNet=rows.reduce((s,x)=>s+x.p.net,0);
  const totalFree=rows.reduce((s,x)=>s+x.p.freeCash,0);
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">ФИНАНСЫ</span><h1>P&L сети</h1><p>Разделяем прибыль, фонды и свободный денежный поток.</p></div>
      <button className="btn soft" onClick={()=>downloadCsv("franchise-os-pnl.csv",[
        ["Точка","Выручка","ФОТ","Работодатель","Расходники","Эквайринг","Операционный фикс","Фонды","Налог","Чистая прибыль","Рассрочка","Свободный cash flow"],
        ...rows.map(({l,p})=>[l.city,l.revenue,p.staff,p.employerCosts,p.materials,p.acquiring,p.fixedOpex,p.reserves,p.tax,p.net,p.installment,p.freeCash])
      ])}><Save size={16}/> Экспорт CSV</button>
    </div>
    <div className="kpi-grid">
      <Kpi label="Оборот" value={money(totalRevenue)} icon={TrendingUp} tone="blue"/>
      <Kpi label="Чистая прибыль" value={money(totalNet)} icon={CircleDollarSign} tone="green"/>
      <Kpi label="Свободный cash flow" value={money(totalFree)} icon={Wallet} tone="red"/>
      <Kpi label="Чистая маржа" value={`${num(totalRevenue?totalNet/totalRevenue*100:0)}%`} icon={Gauge} tone="amber"/>
    </div>
    <section className="panel table-panel">
      <div className="table-wrap"><table>
        <thead><tr><th>Точка</th><th>Выручка</th><th>ФОТ</th><th>Работодатель</th><th>Фикс</th><th>Фонды</th><th>Налог</th><th>Чистая прибыль</th><th>Cash flow</th></tr></thead>
        <tbody>{rows.map(({l,p})=><tr key={l.id}><td><b>{l.city}</b></td><td>{money(l.revenue)}</td><td>{money(p.staff)}</td><td>{money(p.employerCosts)}</td><td>{money(p.fixedOpex)}</td><td>{money(p.reserves)}</td><td>{money(p.tax)}</td><td className={p.net>=0?"positive":"negative"}><b>{money(p.net)}</b></td><td className={p.freeCash>=0?"positive":"negative"}><b>{money(p.freeCash)}</b></td></tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

function CashCalendar({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const [cursor,setCursor]=useState(()=>{
    const now=new Date();
    return new Date(now.getFullYear(),now.getMonth(),1);
  });
  const [form,setForm]=useState<Omit<CashEvent,"id"|"status"|"paidAt">>({
    title:"",type:"expense",amount:0,dueDate:localIsoDate(),category:"Аренда",
    locationId:"",recurrence:"once",reminderDays:3,note:""
  });

  const y=cursor.getFullYear();
  const m=cursor.getMonth();
  const month=`${y}-${String(m+1).padStart(2,"0")}`;
  const first=`${month}-01`;
  const last=`${month}-${String(new Date(y,m+1,0).getDate()).padStart(2,"0")}`;
  const occurrences=cashOccurrences(state.cashEvents,first,last);
  const paid=state.cashEvents.filter(e=>e.status==="paid"&&e.dueDate.startsWith(month));
  const plannedIncome=occurrences.filter(x=>x.event.type==="income").reduce((s,x)=>s+x.event.amount,0);
  const plannedExpense=occurrences.filter(x=>x.event.type==="expense").reduce((s,x)=>s+x.event.amount,0);
  const paidNet=paid.reduce((s,e)=>s+signedCash(e),0);
  const forecast=state.cashBalance+plannedIncome-plannedExpense;
  const forecastFor=(days:number)=>{
    const end=new Date();
    end.setDate(end.getDate()+days);
    return state.cashBalance+cashOccurrences(state.cashEvents,localIsoDate(),localIsoDate(end)).reduce((s,x)=>s+signedCash(x.event),0);
  };
  const forecast30=forecastFor(30), forecast60=forecastFor(60), forecast90=forecastFor(90);
  const monthLabel=new Intl.DateTimeFormat("ru-RU",{month:"long",year:"numeric"}).format(cursor);
  const daysInMonth=new Date(y,m+1,0).getDate();
  const offset=(new Date(y,m,1).getDay()+6)%7;
  const cells=Array.from({length:offset+daysInMonth},(_,i)=>i<offset?null:i-offset+1);
  const categories=["Аренда","Зарплата","Налоги","Рассрочка STRIXY","Маркетинг","Расходники","Оборудование","Фонд команды","Амортизация","Выручка","Прочее"];

  const add=()=>{
    if(!form.title.trim()||!form.amount||!form.dueDate)return;
    const item:CashEvent={...form,id:crypto.randomUUID(),status:"planned",locationId:form.locationId||undefined};
    setState(s=>({...s,cashEvents:[...s.cashEvents,item]}));
    setForm(x=>({...x,title:"",amount:0,note:""}));
  };

  const markPaid=(event:CashEvent)=>{
    if(event.status==="paid")return;
    const history:CashEvent={...event,id:crypto.randomUUID(),status:"paid",recurrence:"once",paidAt:localIsoDate()};
    setState(s=>{
      const nextEvents=event.recurrence==="monthly"
        ? [...s.cashEvents.map(x=>x.id===event.id?{...x,dueDate:addMonthsToIso(x.dueDate,1)}:x),history]
        : s.cashEvents.map(x=>x.id===event.id?{...x,status:"paid" as const,paidAt:localIsoDate()}:x);
      return {...s,cashBalance:s.cashBalance+signedCash(event),cashEvents:nextEvents};
    });
  };

  const remove=(id:string)=>setState(s=>({...s,cashEvents:s.cashEvents.filter(x=>x.id!==id)}));
  const upcoming=state.cashEvents.filter(e=>e.status==="planned").sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,12);

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">КАЛЕНДАРЬ ДЕНЕГ</span><h1>Все платежи и поступления</h1><p>Внеси обязательство один раз — платформа посчитает остаток и напомнит о сроке.</p></div>
      <div className="calendar-head-actions"><Field label="Деньги сейчас" value={state.cashBalance} onChange={v=>setState(s=>({...s,cashBalance:v}))} suffix="₽" emphasis/></div>
    </div>

    <div className="kpi-grid">
      <Kpi label="Денег сейчас" value={money(state.cashBalance)} sub="фактический остаток" icon={Wallet} tone="blue"/>
      <Kpi label="Поступления месяца" value={money(plannedIncome)} sub="запланировано" icon={TrendingUp} tone="green"/>
      <Kpi label="Расходы месяца" value={money(plannedExpense)} sub="запланировано" icon={CreditCard} tone="red"/>
      <Kpi label="Прогноз после платежей" value={money(forecast)} sub={paidNet?"факт месяца уже учтён в остатке":"на конец выбранного месяца"} icon={Target} tone={forecast>=600000?"green":"amber"}/>
    </div>

    <section className="forecast-strip">
      <div><span>Через 30 дней</span><b className={forecast30>=600000?"positive":"negative"}>{money(forecast30)}</b></div>
      <div><span>Через 60 дней</span><b className={forecast60>=600000?"positive":"negative"}>{money(forecast60)}</b></div>
      <div><span>Через 90 дней</span><b className={forecast90>=600000?"positive":"negative"}>{money(forecast90)}</b></div>
      <div><span>Минимальный резерв</span><b>{money(600000)}</b></div>
    </section>

    <div className="money-layout">
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <button className="icon-btn bordered" onClick={()=>setCursor(new Date(y,m-1,1))}><ChevronLeft size={18}/></button>
          <div><b>{monthLabel}</b><span>Плановые даты платежей</span></div>
          <button className="icon-btn bordered" onClick={()=>setCursor(new Date(y,m+1,1))}><ChevronRight size={18}/></button>
        </div>
        <div className="calendar-weekdays">{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(x=><span key={x}>{x}</span>)}</div>
        <div className="cash-calendar">
          {cells.map((day,i)=>{
            if(day===null)return <div className="calendar-cell blank" key={`b-${i}`}/>;
            const date=`${month}-${String(day).padStart(2,"0")}`;
            const dayEvents=occurrences.filter(x=>x.date===date);
            const dayPaid=paid.filter(x=>x.dueDate===date);
            const isToday=date===localIsoDate();
            return <button className={`calendar-cell ${isToday?"today":""}`} key={date} onClick={()=>setForm(f=>({...f,dueDate:date}))}>
              <span className="day-number">{day}</span>
              <div className="day-events">
                {dayEvents.slice(0,3).map(x=><span key={x.event.id+x.date} className={x.event.type==="income"?"income":"expense"}>{x.event.type==="income"?"+":"−"} {formatEditableNumber(x.event.amount)}</span>)}
                {dayPaid.slice(0,2).map(x=><span key={x.id} className="paid">✓ {formatEditableNumber(x.amount)}</span>)}
                {dayEvents.length+dayPaid.length>5&&<small>+{dayEvents.length+dayPaid.length-5}</small>}
              </div>
            </button>;
          })}
        </div>
        <div className="calendar-legend"><span><i className="dot income"/>Поступление</span><span><i className="dot expense"/>Расход</span><span><i className="dot paid"/>Оплачено</span></div>
      </section>

      <section className="panel cash-form-panel">
        <SectionTitle title="Добавить в календарь" sub="Разовый или ежемесячный платёж"/>
        <div className="cash-type-switch">
          <button className={form.type==="expense"?"active expense":""} onClick={()=>setForm({...form,type:"expense"})}>Расход</button>
          <button className={form.type==="income"?"active income":""} onClick={()=>setForm({...form,type:"income"})}>Поступление</button>
        </div>
        <label className="field"><span className="field-label">Название</span><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Например: аренда Сокол"/></label>
        <Field label="Сумма" value={form.amount} onChange={v=>setForm({...form,amount:v})} suffix="₽" emphasis/>
        <div className="form-grid cash-form-grid">
          <label className="field"><span className="field-label">Дата</span><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></label>
          <label className="field"><span className="field-label">Категория</span><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="field"><span className="field-label">Точка</span><select value={form.locationId??""} onChange={e=>setForm({...form,locationId:e.target.value})}><option value="">Вся сеть / без точки</option>{state.locations.map(l=><option value={l.id} key={l.id}>{l.city}</option>)}</select></label>
          <label className="field"><span className="field-label">Повтор</span><select value={form.recurrence} onChange={e=>setForm({...form,recurrence:e.target.value as CashEvent["recurrence"]})}><option value="once">Один раз</option><option value="monthly">Каждый месяц</option></select></label>
          <Field label="Напомнить заранее" value={form.reminderDays} onChange={v=>setForm({...form,reminderDays:Math.max(0,Math.round(v))})} suffix="дн."/>
        </div>
        <label className="field"><span className="field-label">Комментарий</span><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Необязательно"/></label>
        <button className="btn primary full" onClick={add}><Plus size={16}/> Добавить событие</button>
      </section>
    </div>

    <section className="panel mt">
      <SectionTitle title="Ближайшие деньги" sub="Отмечай оплату — текущий остаток пересчитается автоматически"/>
      <div className="cash-event-list">
        {upcoming.length?upcoming.map(e=>{
          const l=state.locations.find(x=>x.id===e.locationId);
          const d=daysUntil(e.dueDate);
          return <div className={`cash-event ${d<0?"overdue":""}`} key={e.id}>
            <div className={`cash-event-icon ${e.type}`}>{e.type==="income"?"+":"−"}</div>
            <div className="cash-event-copy"><b>{e.title}</b><span>{e.dueDate} · {e.category}{l?` · ${l.city}`:""}{e.recurrence==="monthly"?" · ежемесячно":""}</span>{d<0&&<small>Просрочено на {Math.abs(d)} дн.</small>}</div>
            <b className={e.type==="income"?"positive":"negative"}>{e.type==="income"?"+":"−"}{money(e.amount)}</b>
            <button className="btn soft sm" onClick={()=>markPaid(e)}>{e.type==="income"?"Получено":"Оплачено"}</button>
            <button className="icon-btn danger-icon" onClick={()=>remove(e.id)} aria-label="Удалить"><Trash2 size={16}/></button>
          </div>;
        }):<div className="empty-state small-empty"><CalendarDays size={25}/><b>Платежей пока нет</b><span>Добавь аренду, рассрочки, налоги и ожидаемые поступления.</span></div>}
      </div>
    </section>
  </div>;
}

function Actuals({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const first=state.locations[0]?.id??"sokol";
  const [locationId,setLocationId]=useState(first);
  const [month,setMonth]=useState(monthKey());
  const loc=state.locations.find(l=>l.id===locationId)??state.locations[0];
  const plan=locationPnl(loc);

  const blank=():Omit<ActualMonth,"id">=>({
    locationId,month,revenue:0,procedures:0,payroll:0,employerCosts:0,materials:0,
    acquiring:0,rent:0,marketing:0,other:0,tax:0,note:""
  });
  const [form,setForm]=useState<Omit<ActualMonth,"id">>(blank);

  useEffect(()=>{
    const existing=state.actuals.find(a=>a.locationId===locationId&&a.month===month);
    if(existing){
      const {id,...rest}=existing;
      setForm(rest);
    }else{
      setForm(blank());
    }
  },[locationId,month]);

  const planOther=loc.accounting+loc.internet+loc.cleaning+loc.software+loc.depreciationFund+loc.cultureFund;
  const fillPlan=()=>setForm({
    locationId,month,revenue:loc.revenue,procedures:Math.round(plan.procedures),payroll:Math.round(plan.staff),
    employerCosts:Math.round(plan.employerCosts),materials:Math.round(plan.materials),acquiring:Math.round(plan.acquiring),
    rent:loc.rent,marketing:loc.marketing,other:planOther,tax:Math.round(plan.tax),note:""
  });
  const save=()=>{
    const old=state.actuals.find(a=>a.locationId===locationId&&a.month===month);
    const item:ActualMonth={...form,locationId,month,id:old?.id??crypto.randomUUID()};
    setState(s=>({...s,actuals:old?s.actuals.map(a=>a.id===old.id?item:a):[item,...s.actuals]}));
  };

  const actualResult=actualNet({...form,id:"preview"});
  const actualAvg=form.procedures?form.revenue/form.procedures:0;
  const compare=[
    {label:"Выручка",plan:loc.revenue,actual:form.revenue,higher:true,money:true},
    {label:"Процедуры",plan:Math.round(plan.procedures),actual:form.procedures,higher:true,money:false},
    {label:"Средний чек",plan:plan.avgCheck,actual:actualAvg,higher:true,money:true},
    {label:"ФОТ",plan:plan.staff,actual:form.payroll,higher:false,money:true},
    {label:"Работодатель сверху",plan:plan.employerCosts,actual:form.employerCosts,higher:false,money:true},
    {label:"Расходники",plan:plan.materials,actual:form.materials,higher:false,money:true},
    {label:"Эквайринг",plan:plan.acquiring,actual:form.acquiring,higher:false,money:true},
    {label:"Аренда",plan:loc.rent,actual:form.rent,higher:false,money:true},
    {label:"Маркетинг",plan:loc.marketing,actual:form.marketing,higher:false,money:true},
    {label:"Прочие + фонды",plan:planOther,actual:form.other,higher:false,money:true},
    {label:"Налог",plan:plan.tax,actual:form.tax,higher:false,money:true},
    {label:"Чистая прибыль",plan:plan.net,actual:actualResult,higher:true,money:true},
  ];
  const revenuePct=loc.revenue?form.revenue/loc.revenue*100:0;
  const profitPct=plan.net?actualResult/plan.net*100:0;
  const history=state.actuals.filter(a=>a.locationId===locationId).sort((a,b)=>a.month.localeCompare(b.month)).map(a=>({month:a.month.slice(5)+"/"+a.month.slice(2,4),revenue:a.revenue,profit:actualNet(a)}));

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">ПЛАН VS ФАКТ</span><h1>{loc.city}: контроль месяца</h1><p>Вводи реальный результат — платформа сама покажет отклонения.</p></div>
      <div className="plan-fact-selectors">
        <select value={locationId} onChange={e=>setLocationId(e.target.value)}>{state.locations.map(l=><option value={l.id} key={l.id}>{l.city}</option>)}</select>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)}/>
      </div>
    </div>

    <div className="kpi-grid">
      <Kpi label="План выручки" value={money(loc.revenue)} sub="на месяц" icon={Target} tone="blue"/>
      <Kpi label="Факт выручки" value={money(form.revenue)} sub={`${num(revenuePct)}% плана`} icon={BarChart3} tone={revenuePct>=100?"green":revenuePct>=90?"amber":"red"}/>
      <Kpi label="План прибыли" value={money(plan.net)} sub={`${num(plan.margin)}% маржа`} icon={CircleDollarSign} tone="blue"/>
      <Kpi label="Факт прибыли" value={money(actualResult)} sub={`${num(profitPct)}% от плана`} icon={Wallet} tone={actualResult>=plan.net?"green":actualResult>=0?"amber":"red"}/>
    </div>

    <div className="plan-fact-layout">
      <section className="panel">
        <SectionTitle title="Фактический месяц" sub="Заполни цифры из кассы и учёта" action={<button className="btn soft sm" onClick={fillPlan}>Заполнить планом</button>}/>
        <div className="form-grid">
          <Field label="Выручка" value={form.revenue} onChange={v=>setForm({...form,revenue:v})} suffix="₽" emphasis/>
          <Field label="Процедуры" value={form.procedures} onChange={v=>setForm({...form,procedures:Math.round(v)})}/>
          <Field label="ФОТ" value={form.payroll} onChange={v=>setForm({...form,payroll:v})} suffix="₽"/>
          <Field label="Работодатель сверху" value={form.employerCosts} onChange={v=>setForm({...form,employerCosts:v})} suffix="₽"/>
          <Field label="Расходники" value={form.materials} onChange={v=>setForm({...form,materials:v})} suffix="₽"/>
          <Field label="Эквайринг" value={form.acquiring} onChange={v=>setForm({...form,acquiring:v})} suffix="₽"/>
          <Field label="Аренда + КУ" value={form.rent} onChange={v=>setForm({...form,rent:v})} suffix="₽"/>
          <Field label="Маркетинг" value={form.marketing} onChange={v=>setForm({...form,marketing:v})} suffix="₽"/>
          <Field label="Прочие + фонды" value={form.other} onChange={v=>setForm({...form,other:v})} suffix="₽"/>
          <Field label="Налог" value={form.tax} onChange={v=>setForm({...form,tax:v})} suffix="₽"/>
        </div>
        <label className="field full-field"><span className="field-label">Комментарий месяца</span><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Почему план выполнен / не выполнен?"/></label>
        <button className="btn primary" onClick={save}><Save size={16}/> Сохранить факт</button>
      </section>

      <section className="panel">
        <SectionTitle title="Отклонения" sub="Зелёное — лучше плана, красное — требует внимания"/>
        <div className="variance-list">
          {compare.map(row=>{
            const delta=row.actual-row.plan;
            const pct=row.plan?delta/Math.abs(row.plan)*100:0;
            const good=row.higher?delta>=0:delta<=0;
            return <div className="variance-row" key={row.label}>
              <div><b>{row.label}</b><span>План {row.money?money(row.plan):formatEditableNumber(row.plan)}</span></div>
              <div className="variance-actual"><b>{row.money?money(row.actual):formatEditableNumber(row.actual)}</b><span className={good?"positive":"negative"}>{delta>=0?"+":""}{num(pct)}%</span></div>
            </div>;
          })}
        </div>
      </section>
    </div>

    <section className="panel mt">
      <SectionTitle title="Динамика факта" sub={history.length?"Все сохранённые месяцы выбранной точки":"Появится после первого сохранённого месяца"}/>
      {history.length?<ResponsiveContainer width="100%" height={280}><LineChart data={history}><CartesianGrid vertical={false} stroke="#eef0f4"/><XAxis dataKey="month" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(Number(v)/1000)}k`}/><Tooltip formatter={(v:any)=>money(Number(v))}/><Legend/><Line dataKey="revenue" name="Выручка" stroke="#171b24" strokeWidth={3}/><Line dataKey="profit" name="Прибыль" stroke="#ff4d57" strokeWidth={3}/></LineChart></ResponsiveContainer>:<div className="empty-state small-empty"><BarChart3 size={25}/><b>Истории пока нет</b><span>Сохрани первый фактический месяц.</span></div>}
    </section>
  </div>;
}

function NotificationsCenter({state,setState,setTab}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;setTab:(t:Tab)=>void}) {
  const all=buildNotifications(state);
  const active=all.filter(n=>!state.dismissedNotifications.includes(n.id));
  const critical=active.filter(n=>n.level==="critical").length;
  const warning=active.filter(n=>n.level==="warning").length;
  const due=active.filter(n=>n.source==="money").length;
  const dismiss=(id:string)=>setState(s=>({...s,dismissedNotifications:[...new Set([...s.dismissedNotifications,id])]}));
  const clearAll=()=>setState(s=>({...s,dismissedNotifications:[...new Set([...s.dismissedNotifications,...active.map(n=>n.id)])]}));
  const enableBrowser=async()=>{
    if(!("Notification" in window))return;
    await Notification.requestPermission();
  };

  return <div className="page">
    <div className="page-head">
      <div><span className="eyebrow">ЦЕНТР УВЕДОМЛЕНИЙ</span><h1>Что требует внимания</h1><p>Платежи, просрочки и отклонения от плана собираются автоматически.</p></div>
      <div className="welcome-actions"><button className="btn soft" onClick={enableBrowser}><Bell size={16}/> Разрешить уведомления</button>{active.length>0&&<button className="btn ghost" onClick={clearAll}>Отметить всё просмотренным</button>}</div>
    </div>

    <div className="kpi-grid three">
      <Kpi label="Критично" value={String(critical)} icon={AlertTriangle} tone="red"/>
      <Kpi label="Предупреждения" value={String(warning)} icon={Bell} tone="amber"/>
      <Kpi label="По деньгам" value={String(due)} icon={CalendarDays} tone="blue"/>
    </div>

    <div className="notification-layout">
      <section className="panel">
        <SectionTitle title="Активные уведомления" sub="Исчезают после устранения причины или ручного закрытия"/>
        <div className="notification-list">
          {active.length?active.map(n=><div className={`notification-card ${n.level}`} key={n.id}>
            <div className="notification-symbol">{n.level==="critical"?<AlertTriangle size={19}/>:n.source==="money"?<CalendarDays size={19}/>:<Bell size={19}/>}</div>
            <div className="notification-copy"><b>{n.title}</b><span>{n.body}</span>{n.date&&<small>{n.date}</small>}</div>
            {n.source==="money"&&<button className="btn soft sm" onClick={()=>setTab("calendar")}>К календарю</button>}
            {n.source==="plan"&&<button className="btn soft sm" onClick={()=>setTab("actuals")}>План vs факт</button>}
            <button className="icon-btn" onClick={()=>dismiss(n.id)} aria-label="Скрыть"><X size={16}/></button>
          </div>):<div className="empty-state"><CheckCircle2 size={30} className="positive"/><b>Всё под контролем</b><span>Нет активных просрочек или критичных отклонений.</span></div>}
        </div>
      </section>

      <section className="panel notification-rules">
        <SectionTitle title="Что контролирует система"/>
        <div className="check-list neutral">
          <div><CalendarDays size={17}/><span>Срок каждого платежа и указанное тобой количество дней для напоминания.</span></div>
          <div><AlertTriangle size={17}/><span>Просроченные расходы и поступления.</span></div>
          <div><BarChart3 size={17}/><span>Фактическую выручку ниже 90% месячного плана.</span></div>
          <div><CircleDollarSign size={17}/><span>Убыточный фактический месяц.</span></div>
          <div><Wallet size={17}/><span>Прогноз денежного резерва на ближайшие 30 дней.</span></div>
          <div><Settings size={17}/><span>Ошибки в модели, например сумма долей услуг не равна 100%.</span></div>
        </div>
        <div className="alert blue"><Bell size={18}/><span>Системные уведомления браузера появляются при открытии платформы. Сам центр уведомлений работает всегда внутри FRANCHISE OS.</span></div>
      </section>
    </div>
  </div>;
}

function Scenarios({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const [selected,setSelected]=useState(state.scenarios[1]?.id??state.scenarios[0]?.id);
  const sc=state.scenarios.find(x=>x.id===selected)??state.scenarios[0];
  const update=(patch:Partial<Scenario>)=>setState(s=>({...s,scenarios:s.scenarios.map(x=>x.id===sc.id?{...x,...patch}:x)}));
  const calc=(l:Location)=>locationPnl({...l,revenue:sc.revenues[l.id]??l.revenue,staffPct:sc.staffPct,materialsPct:sc.materialsPct,acquiringPct:sc.acquiringPct});
  const total=state.locations.reduce((s,l)=>s+calc(l).net,0);
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">СЦЕНАРИИ</span><h1>Что будет, если…</h1><p>Меняй выручку и ключевые проценты без риска для основной модели.</p></div></div>
    <div className="scenario-tabs">{state.scenarios.map(x=><button key={x.id} onClick={()=>setSelected(x.id)} className={selected===x.id?"active":""}>{x.name}</button>)}</div>
    <div className="layout-2">
      <section className="panel"><SectionTitle title="Допущения" sub="Сценарий не меняет базовые точки"/>
        <div className="form-grid">{state.locations.map(l=><Field key={l.id} label={`Выручка · ${l.city}`} value={sc.revenues[l.id]??0} onChange={v=>update({revenues:{...sc.revenues,[l.id]:v}})} suffix="₽"/>)}
          <Field label="ФОТ мастеров" value={sc.staffPct} onChange={v=>update({staffPct:v})} suffix="%"/>
          <Field label="Расходники" value={sc.materialsPct} onChange={v=>update({materialsPct:v})} suffix="%"/>
          <Field label="Эквайринг" value={sc.acquiringPct} onChange={v=>update({acquiringPct:v})} suffix="%"/>
        </div>
      </section>
      <section className="panel scenario-summary">
        <span className="eyebrow">РЕЗУЛЬТАТ СЕТИ</span><strong>{money(total)}</strong><small>чистая прибыль / месяц</small>
        <div className="scenario-cities">{state.locations.map(l=>{const p=calc(l);return <div key={l.id}><span>{l.city}<small>{num(p.margin)}% маржа</small></span><b>{money(p.net)}</b></div>})}</div>
      </section>
    </div>
  </div>;
}

function Staff({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const [query,setQuery]=useState("");
  const [locationFilter,setLocationFilter]=useState("all");
  const add=()=>{
    const e:Employee={id:crypto.randomUUID(),locationId:"sokol",name:"Новый кандидат",role:"Парикмахер",service:"Стрижки",status:"candidate",percent:50,fixed:0,revenue:100000,procedures:180,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1};
    setState(s=>({...s,employees:[...s.employees,e]}));
  };
  const upd=(id:string,patch:Partial<Employee>)=>setState(s=>({...s,employees:s.employees.map(e=>e.id===id?{...e,...patch}:e)}));
  const filteredEmployees=state.employees.filter(e=>
    (locationFilter==="all"||e.locationId===locationFilter)
    &&(!query.trim()||(e.name+" "+e.role+" "+e.service).toLowerCase().includes(query.trim().toLowerCase()))
  );
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">КОМАНДА</span><h1>Люди и загрузка</h1><p>Не раздувай штат: следи за зарплатой, выручкой на мастера и загрузкой.</p></div><button className="btn primary" onClick={add}><Plus size={16}/> Добавить мастера</button></div>
    <div className="team-cards">{state.locations.map(l=>{const p=locationPnl(l);const count=l.hairMasters+l.nailMasters;return <div className="team-card" key={l.id}><div><b>{l.city}</b><span>{count} мастеров в плане</span></div><div><span>ЗП / мастер</span><b>{money(count?p.staff/count:0)}</b></div><div><span>Выручка / мастер</span><b>{money(count?l.revenue/count:0)}</b></div><div><span>Процедур / мастер / день</span><b>{num(count?p.procedures/30/count:0)}</b></div></div>})}</div>
    <div className="team-toolbar">
      <label className="search-field"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Найти мастера"/></label>
      <div className="tabs-compact"><button className={locationFilter==="all"?"active":""} onClick={()=>setLocationFilter("all")}>Все</button>{state.locations.map(l=><button key={l.id} className={locationFilter===l.id?"active":""} onClick={()=>setLocationFilter(l.id)}>{l.city}</button>)}</div>
      <span className="team-result-count">{filteredEmployees.length} сотрудников</span>
    </div>
    <section className="panel table-panel mt"><div className="table-wrap"><table><thead><tr><th>Мастер</th><th>Точка</th><th>Выручка</th><th>%</th><th>Начислено</th><th>Сверху</th><th>Стоимость бизнесу</th><th>Процедур/смену</th></tr></thead>
    <tbody>{filteredEmployees.map(e=>{const c=employeeCost(e);return <tr key={e.id}>
      <td><input className="table-input" value={e.name} onChange={x=>upd(e.id,{name:x.target.value})}/><small className="cell-sub">{e.role}</small></td>
      <td><select value={e.locationId} onChange={x=>upd(e.id,{locationId:x.target.value})}>{state.locations.map(l=><option value={l.id} key={l.id}>{l.city}</option>)}</select></td>
      <td><CompactNumberInput value={e.revenue} onChange={v=>upd(e.id,{revenue:v})} suffix="₽"/></td>
      <td><CompactNumberInput value={e.percent} onChange={v=>upd(e.id,{percent:v})} suffix="%"/></td>
      <td>{money(c.salary)}</td><td>{money(c.insurance+c.vacation+c.sick)}</td><td><b>{money(c.total)}</b></td><td>{e.shifts?num(e.procedures/e.shifts):"—"}</td>
    </tr>})}</tbody></table></div></section>
    <div className="alert blue"><ShieldCheck size={18}/><span>Начисленная зарплата, сумма «на руки» и полная стоимость сотрудника — разные показатели. Платформа не смешивает их.</span></div>
  </div>;
}

function Funds({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const [amount,setAmount]=useState(15000);
  const [fund,setFund]=useState<FundTx["fund"]>("culture");
  const [note,setNote]=useState("");
  const sums={depreciation:0,culture:0,reserve:0};
  state.funds.forEach(x=>sums[x.fund]+=x.amount);
  const add=()=>{if(!amount)return;setState(s=>({...s,funds:[{id:crypto.randomUUID(),fund,date:new Date().toISOString().slice(0,10),category:"Операция",amount,note},...s.funds]}));setNote("")};
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">ФОНДЫ</span><h1>Деньги, которые нельзя «съесть»</h1><p>Амортизация, команда и резерв хранятся отдельно от свободной прибыли.</p></div></div>
    <div className="kpi-grid three">
      <Kpi label="Амортизация" value={money(sums.depreciation)} icon={Coins} tone="blue"/>
      <Kpi label="Корпоративный фонд" value={money(sums.culture)} icon={Sparkles} tone="red"/>
      <Kpi label="Резерв" value={money(sums.reserve)} icon={PiggyBank} tone="green"/>
    </div>
    <div className="layout-2">
      <section className="panel"><SectionTitle title="Новая операция" sub="Положительная сумма — пополнение, отрицательная — трата"/>
        <div className="fund-form"><label className="field"><span>Фонд</span><select value={fund} onChange={e=>setFund(e.target.value as FundTx["fund"])}><option value="culture">Корпоративный</option><option value="depreciation">Амортизационный</option><option value="reserve">Резерв</option></select></label><Field label="Сумма" value={amount} onChange={setAmount} suffix="₽" helper="Можно вводить со знаком минус для расхода" allowNegative/><label className="field"><span>Комментарий</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Подарки, оборудование, резерв…"/></label><button className="btn primary" onClick={add}><Plus size={16}/> Добавить</button></div>
      </section>
      <section className="panel"><SectionTitle title="Последние операции"/><div className="transactions">{state.funds.length?state.funds.slice(0,10).map(x=><div key={x.id}><span>{x.date}<small>{x.note||x.category}</small></span><b className={x.amount>=0?"positive":"negative"}>{money(x.amount)}</b></div>):<div className="empty-state small-empty"><PiggyBank size={24}/><b>Операций пока нет</b><span>Фонды начнут накапливаться после фактического запуска.</span></div>}</div></section>
    </div>
  </div>;
}

function Openings({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const cycle=(id:string)=>setState(s=>({...s,openingTasks:s.openingTasks.map(t=>t.id===id?{...t,status:t.status==="todo"?"doing":t.status==="doing"?"done":"todo"}:t)}));
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">ПЛАН ОТКРЫТИЙ</span><h1>Сокол → Грязовец → Шексна</h1><p>Полный рабочий чек-лист от помещения до штатного режима.</p></div></div>
    <div className="opening-grid">{state.locations.map(l=>{
      const tasks=state.openingTasks.filter(t=>t.locationId===l.id);
      const done=tasks.filter(t=>t.status==="done").length;
      const pct=Math.round(done/tasks.length*100);
      return <section className="panel opening-card" key={l.id}>
        <div className="row between"><div><h2>{l.city}</h2><p>{l.plannedLaunch} · {l.targetZone}</p></div><LocationStatus status={l.status}/></div>
        <div className="progress"><span style={{width:`${pct}%`}}/></div><div className="progress-copy"><span>{done} из {tasks.length} задач</span><b>{pct}%</b></div>
        <div className="task-list">{tasks.map(t=><button key={t.id} onClick={()=>cycle(t.id)} className={`task ${t.status}`}>{t.status==="done"?<CheckCircle2 size={17}/>:t.status==="doing"?<CircleDollarSign size={17}/>:<Circle size={17}/>}<span>{t.title}</span><small>{t.week===0?"до старта":`нед. ${t.week}`}</small></button>)}</div>
      </section>;
    })}</div>
  </div>;
}

function Payments({state}:{state:AppState}) {
  const total=state.locations.reduce((s,l)=>s+l.installmentBalance,0);
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">ПЛАТЕЖИ</span><h1>Рассрочки и обязательства</h1><p>Держим будущие платежи отдельно от свободного резерва.</p></div></div>
    <div className="kpi-grid three"><Kpi label="Всего будущих рассрочек" value={money(total)} icon={CreditCard} tone="amber"/><Kpi label="Платёж при 3 активных точках" value={money(state.locations.reduce((s,l)=>s+l.installmentMonthly,0))} icon={Landmark} tone="red"/><Kpi label="Срок одной рассрочки" value="10 месяцев" icon={CalendarRange} tone="blue"/></div>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Точка</th><th>Остаток</th><th>Платёж</th><th>Осталось месяцев</th><th>Состояние</th></tr></thead><tbody>{state.locations.map(l=><tr key={l.id}><td><b>{l.city}</b></td><td>{money(l.installmentBalance)}</td><td>{money(l.installmentMonthly)}</td><td>{l.installmentMonthly?Math.ceil(l.installmentBalance/l.installmentMonthly):0}</td><td><LocationStatus status={l.status}/></td></tr>)}</tbody></table></div></section>
  </div>;
}

function Dossier() {
  const d=franchiseData;
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">БАЗА STRIXY</span><h1>Твоя рабочая модель франшизы</h1><p>Не рекламная презентация, а набор решений, цифр и контрольных правил владельца.</p></div><Pill tone="blue">обновлено {d.updatedAt}</Pill></div>
    <div className="dossier-grid">
      <section className="panel"><SectionTitle title="Стратегия"/><div className="check-list">{d.strategy.map(x=><div key={x}><CheckCircle2 size={17}/><span>{x}</span></div>)}</div></section>
      <section className="panel"><SectionTitle title="Целевая зрелая выручка"/><div className="dossier-revenue">{d.matureRevenue.map(x=><div key={x.city}><span>{x.city}<small>{x.note}</small></span><b>{money(x.value)}</b></div>)}</div></section>
      <section className="panel"><SectionTitle title="Ключевая экономика"/><div className="data-list">{d.economics.map(x=><div key={x.label}><span>{x.label}</span><b>{x.value}</b></div>)}</div></section>
      <section className="panel"><SectionTitle title="Операционные стандарты"/><div className="check-list neutral">{d.standards.map(x=><div key={x}><BriefcaseBusiness size={17}/><span>{x}</span></div>)}</div></section>
      <section className="panel"><SectionTitle title="KPI владельца"/><div className="tag-cloud">{d.kpis.map(x=><span key={x}>{x}</span>)}</div></section>
      <section className="panel"><SectionTitle title="Риски, которые контролируем"/><div className="risk-list">{d.risks.map(x=><div key={x}><AlertTriangle size={17}/><span>{x}</span></div>)}</div></section>
    </div>
  </div>;
}

function SettingsPage({state,setState,reset}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>;reset:()=>void}) {
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">НАСТРОЙКИ</span><h1>Параметры владельца</h1><p>Глобальные значения и управление локальными данными.</p></div></div>
    <div className="layout-2">
      <section className="panel"><SectionTitle title="Капитал"/><div className="form-grid"><Field label="Минимум" value={state.capitalMin} onChange={v=>setState(s=>({...s,capitalMin:v}))} suffix="₽" emphasis/><Field label="Максимум" value={state.capitalMax} onChange={v=>setState(s=>({...s,capitalMax:v}))} suffix="₽" emphasis/></div></section>
      <section className="panel"><SectionTitle title="Хранение данных"/><div className="alert blue"><Save size={18}/><span>Сейчас рабочие изменения сохраняются в localStorage этого браузера.</span></div><button className="btn danger mt-sm" onClick={reset}><RotateCcw size={16}/> Вернуть стартовую модель</button></section>
    </div>
  </div>;
}

export default function FranchiseApp() {
  const [state,setState]=useState<AppState>(cloneSeed());
  const [tab,setTab]=useState<Tab>("overview");
  const [selected,setSelected]=useState("sokol");
  const [mobileOpen,setMobileOpen]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [unlocked,setUnlocked]=useState(false);
  const [authChecked,setAuthChecked]=useState(false);
  const [viewUserId,setViewUserId]=useState("owner");

  useEffect(()=>{
    setUnlocked(sessionStorage.getItem("franchise-os-unlocked")==="1");
    setAuthChecked(true);
  },[]);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem("franchise-os");
      if(raw)setState(hydrateState(JSON.parse(raw)));
    }catch{}
    setLoaded(true);
  },[]);
  useEffect(()=>{if(loaded)localStorage.setItem("franchise-os",JSON.stringify(state))},[state,loaded]);
  const activeNotifications=useMemo(
    ()=>buildNotifications(state).filter(n=>!state.dismissedNotifications.includes(n.id)),
    [state]
  );

  useEffect(()=>{
    if(viewUserId!=="owner"||!unlocked||!loaded||typeof Notification==="undefined"||Notification.permission!=="granted")return;
    const important=activeNotifications.filter(n=>n.level==="critical"||n.level==="warning").slice(0,4);
    for(const n of important){
      const key=`franchise-os-notified-${n.id}`;
      if(sessionStorage.getItem(key))continue;
      new Notification(n.title,{body:n.body,tag:n.id});
      sessionStorage.setItem(key,"1");
    }
  },[unlocked,loaded,activeNotifications,viewUserId]);

  const reset=()=>{const x=cloneSeed();setState(x);setViewUserId("owner");localStorage.setItem("franchise-os",JSON.stringify(x))};
  const lock=()=>{sessionStorage.removeItem("franchise-os-unlocked");setUnlocked(false);setViewUserId("owner");setMobileOpen(false)};
  const viewUser:AppUser=state.users.find(u=>u.id===viewUserId && u.status!=="disabled") ?? state.users.find(u=>u.id==="owner") ?? {
    id:"owner",name:"Владелец",role:"owner",locationIds:state.locations.map(l=>l.id),status:"active"
  };
  const role=viewUser.role;
  const visibleState=scopedState(state,viewUser);
  const allowedTabs=new Set(navByRole[role] as Tab[]);
  const staffUnread=visibleState.staffNotifications.filter(n=>n.userId===viewUser.id&&!n.readAt).length;
  const changeView=(id:string)=>{
    const next=state.users.find(u=>u.id===id);
    if(!next || next.status==="disabled")return;
    setViewUserId(id);
    setTab("overview");
    setSelected(next.locationIds[0]??"sokol");
    setMobileOpen(false);
  };

  if(!authChecked)return <div className="passcode-loading"/>;
  if(!unlocked)return <PasscodeGate onUnlock={()=>setUnlocked(true)}/>;

  const ownerContent =
    tab==="overview"?<Overview state={state} setTab={setTab} setSelected={setSelected}/>:
    tab==="calendar"?<CashCalendar state={state} setState={setState}/>:
    tab==="actuals"?<Actuals state={state} setState={setState}/>:
    tab==="notifications"?<NotificationsCenter state={state} setState={setState} setTab={setTab}/>:
    tab==="locations"?<Locations state={state} setState={setState} selected={selected} setSelected={setSelected}/>:
    tab==="finance"?<Finance state={state}/>:
    tab==="scenarios"?<Scenarios state={state} setState={setState}/>:
    tab==="staff"?<Staff state={state} setState={setState}/>:
    tab==="schedule"?<SchedulePage state={state} setState={setState}/>:
    tab==="checklists"?<ChecklistsPage state={state} setState={setState} user={viewUser}/>:
    tab==="requests"?<RequestsPage state={state} setState={setState} user={viewUser}/>:
    tab==="funds"?<Funds state={state} setState={setState}/>:
    tab==="openings"?<Openings state={state} setState={setState}/>:
    tab==="payments"?<Payments state={state}/>:
    tab==="dossier"?<Dossier/>:
    tab==="access"?<AccessPage state={state} setState={setState}/>:
    <SettingsPage state={state} setState={setState} reset={reset}/>;

  const managerContent =
    tab==="staff"?<Staff state={visibleState} setState={setState}/>:
    tab==="schedule"?<SchedulePage state={visibleState} setState={setState}/>:
    tab==="checklists"?<ChecklistsPage state={visibleState} setState={setState} user={viewUser}/>:
    tab==="requests"?<RequestsPage state={visibleState} setState={setState} user={viewUser}/>:
    tab==="openings"?<Openings state={visibleState} setState={setState}/>:
    <ManagerDashboard state={visibleState} user={viewUser} onNavigate={setTab}/>;

  const masterContent=tab==="checklists"
    ?<ChecklistsPage state={visibleState} setState={setState} user={viewUser}/>
    :tab==="requests"
      ?<RequestsPage state={visibleState} setState={setState} user={viewUser}/>
      :<MasterDashboard state={visibleState} user={viewUser} onNavigate={setTab}/>;
  const content=role==="owner"?ownerContent:role==="manager"?managerContent:masterContent;

  const renderNav=(group:NavGroup)=>nav.filter(n=>n.group===group && allowedTabs.has(n.id)).map(n=>{
    const I=n.icon;
    const badge=n.id==="notifications"?activeNotifications.length:n.id==="requests"&&role!=="owner"?staffUnread:0;
    return <button key={n.id} className={tab===n.id?"nav-item active":"nav-item"} onClick={()=>{setTab(n.id);setMobileOpen(false)}}><I size={18}/><span>{n.label}</span>{badge>0&&<b className="nav-badge">{badge>9?"9+":badge}</b>}{tab===n.id&&<span className="nav-active-dot"/>}</button>;
  });

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="brand"><div className="brand-mark">F</div><div><strong>FRANCHISE OS</strong><span>STRIXY</span></div><button className="icon-btn mobile-only close-nav" onClick={()=>setMobileOpen(false)}><X size={20}/></button></div>
      <nav className="sidebar-nav">
        {navGroups.map(group=>{
          const hasItems=nav.some(n=>n.group===group.id&&allowedTabs.has(n.id));
          return hasItems?<div className="sidebar-section" key={group.id}><span className="sidebar-label">{group.label}</span>{renderNav(group.id)}</div>:null;
        })}
      </nav>
      <div className="sidebar-bottom"><div className="storage-note"><div className="online-dot"/><span><b>Данные сохранены</b><small>локально в браузере</small></span></div></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="top-left"><button className="icon-btn mobile-only" onClick={()=>setMobileOpen(true)}><Menu size={21}/></button><div><span>{role==="owner"?(nav.find(n=>n.id===tab)?.label??"Главная"):roleLabels[role]}</span><small>{role==="owner"?"STRIXY · Сокол → Грязовец → Шексна":`${viewUser.name} · ${visibleState.locations.map(l=>l.city).join(", ")||"без точки"}`}</small></div></div>
        <div className="top-actions">
          {viewUserId==="owner"&&<label className="role-viewer"><span>Предпросмотр</span><select value={viewUser.id} onChange={e=>changeView(e.target.value)}>{state.users.filter(u=>u.status!=="disabled").map(u=><option key={u.id} value={u.id}>{roleLabels[u.role]} · {u.name}</option>)}</select></label>}
          {role==="owner"&&<button className="notification-button" onClick={()=>setTab("notifications")} aria-label="Уведомления"><Bell size={17}/>{activeNotifications.length>0&&<span>{activeNotifications.length>9?"9+":activeNotifications.length}</span>}</button>}
          {role!=="owner"&&<button className="notification-button" onClick={()=>setTab("requests")} aria-label="Рабочие уведомления"><Bell size={17}/>{staffUnread>0&&<span>{staffUnread>9?"9+":staffUnread}</span>}</button>}
          {role==="owner"&&<button className="quick-pill top-dossier" onClick={()=>setTab("dossier")}><BookOpen size={15}/> База STRIXY</button>}
          <button className="quick-pill lock-pill" onClick={lock}><LockKeyhole size={15}/> Закрыть</button>
          <button className={`owner-avatar role-${role}`} onClick={lock} aria-label="Заблокировать платформу">{role==="owner"?"ИВ":role==="manager"?"У":"М"}</button>
        </div>
      </header>
      {viewUserId!=="owner"&&<div className="preview-banner"><div><ShieldCheck size={16}/><span>Предпросмотр: <b>{roleLabels[role]} · {viewUser.name}</b></span></div><button onClick={()=>changeView("owner")}>Вернуться владельцу</button></div>}
      {content}
    </main>

    <div className="mobile-nav">
      {nav.filter(n=>allowedTabs.has(n.id) && (role==="owner"?["overview","locations","actuals","finance"].includes(n.id):role==="manager"?["overview","staff","schedule","checklists","requests"].includes(n.id):["overview","checklists","requests"].includes(n.id))).map(n=>{const I=n.icon;const badge=n.id==="requests"&&role!=="owner"?staffUnread:0;return <button key={n.id} className={tab===n.id?"active":""} onClick={()=>setTab(n.id)}><span className="mobile-nav-icon"><I size={19}/>{badge>0&&<b>{badge>9?"9+":badge}</b>}</span><span>{n.label}</span></button>})}
      {role==="owner"&&<button className={mobileOpen?"active":""} onClick={()=>setMobileOpen(true)}><Menu size={19}/><span>Ещё</span></button>}
    </div>
  </div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, BookOpen, BriefcaseBusiness,
  Building2, Calculator, CalendarRange, CheckCircle2, ChevronRight, Circle,
  CircleDollarSign, Coins, CreditCard, FileText, Gauge, Landmark, LayoutDashboard,
  Menu, PiggyBank, Plus, ReceiptText, RotateCcw, Save, Settings, ShieldCheck,
  Sparkles, Target, TrendingUp, Users, Wallet, X, LockKeyhole, Delete
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import { seed } from "@/lib/seed";
import { franchiseData } from "@/lib/franchiseData";
import { ActualMonth, AppState, Employee, FundTx, Location, Scenario } from "@/lib/types";
import { actualNet, employeeCost, locationPnl, money, num } from "@/lib/finance";

type Tab =
  | "overview" | "locations" | "finance" | "actuals" | "scenarios"
  | "staff" | "funds" | "openings" | "payments" | "dossier" | "settings";

const nav: {id:Tab; label:string; icon:any; group:"main"|"manage"|"system"}[] = [
  {id:"overview",label:"Главная",icon:LayoutDashboard,group:"main"},
  {id:"locations",label:"Точки",icon:Building2,group:"main"},
  {id:"finance",label:"Финансы",icon:CircleDollarSign,group:"main"},
  {id:"actuals",label:"Факт",icon:ReceiptText,group:"main"},
  {id:"scenarios",label:"Сценарии",icon:Calculator,group:"main"},
  {id:"staff",label:"Команда",icon:Users,group:"manage"},
  {id:"funds",label:"Фонды",icon:PiggyBank,group:"manage"},
  {id:"openings",label:"Открытия",icon:CalendarRange,group:"manage"},
  {id:"payments",label:"Платежи",icon:CreditCard,group:"manage"},
  {id:"dossier",label:"База STRIXY",icon:BookOpen,group:"manage"},
  {id:"settings",label:"Настройки",icon:Settings,group:"system"},
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
    privateNotes:Array.isArray(raw.privateNotes)?raw.privateNotes:base.privateNotes,
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

function Actuals({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}) {
  const first=state.locations[0]?.id??"sokol";
  const [form,setForm]=useState<Omit<ActualMonth,"id">>({
    locationId:first,month:new Date().toISOString().slice(0,7),revenue:0,procedures:0,payroll:0,
    employerCosts:0,materials:0,acquiring:0,rent:40000,marketing:10000,other:0,tax:0,note:""
  });
  const add=()=>{
    if(!form.month)return;
    const item:ActualMonth={...form,id:crypto.randomUUID()};
    setState(s=>({...s,actuals:[item,...s.actuals]}));
  };
  const totalActualRevenue=state.actuals.reduce((s,a)=>s+a.revenue,0);
  const totalActualNet=state.actuals.reduce((s,a)=>s+actualNet(a),0);
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">ФАКТИЧЕСКИЕ ДАННЫЕ</span><h1>План → факт</h1><p>После открытия вноси реальный месяц и сравнивай его с моделью.</p></div></div>
    <div className="kpi-grid three">
      <Kpi label="Внесено месяцев" value={String(state.actuals.length)} icon={CalendarRange} tone="blue"/>
      <Kpi label="Фактическая выручка" value={money(totalActualRevenue)} icon={BarChart3} tone="green"/>
      <Kpi label="Фактическая прибыль" value={money(totalActualNet)} icon={Wallet} tone={totalActualNet>=0?"green":"red"}/>
    </div>
    <div className="layout-2">
      <section className="panel">
        <SectionTitle title="Добавить месяц" sub="Вводи фактические суммы из учёта"/>
        <div className="form-grid">
          <label className="field"><span>Точка</span><select value={form.locationId} onChange={e=>setForm({...form,locationId:e.target.value})}>{state.locations.map(l=><option key={l.id} value={l.id}>{l.city}</option>)}</select></label>
          <label className="field"><span>Месяц</span><input type="month" value={form.month} onChange={e=>setForm({...form,month:e.target.value})}/></label>
          <Field label="Выручка" value={form.revenue} onChange={v=>setForm({...form,revenue:v})} suffix="₽" emphasis/>
          <Field label="Процедур" value={form.procedures} onChange={v=>setForm({...form,procedures:v})}/>
          <Field label="ФОТ" value={form.payroll} onChange={v=>setForm({...form,payroll:v})}/>
          <Field label="Работодатель сверху" value={form.employerCosts} onChange={v=>setForm({...form,employerCosts:v})}/>
          <Field label="Расходники" value={form.materials} onChange={v=>setForm({...form,materials:v})}/>
          <Field label="Эквайринг" value={form.acquiring} onChange={v=>setForm({...form,acquiring:v})}/>
          <Field label="Аренда + КУ" value={form.rent} onChange={v=>setForm({...form,rent:v})}/>
          <Field label="Маркетинг" value={form.marketing} onChange={v=>setForm({...form,marketing:v})}/>
          <Field label="Прочие" value={form.other} onChange={v=>setForm({...form,other:v})}/>
          <Field label="Налог" value={form.tax} onChange={v=>setForm({...form,tax:v})}/>
        </div>
        <label className="field full-field"><span>Комментарий</span><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Что повлияло на месяц?"/></label>
        <button className="btn primary" onClick={add}><Plus size={16}/> Сохранить месяц</button>
      </section>
      <section className="panel">
        <SectionTitle title="Предварительный результат" sub="До сохранения"/>
        <div className="actual-preview">
          <span>Выручка <b>{money(form.revenue)}</b></span>
          <span>Все расходы <b>{money(form.revenue-actualNet({...form,id:"preview"}))}</b></span>
          <span className="big">Чистый результат <b>{money(actualNet({...form,id:"preview"}))}</b></span>
        </div>
      </section>
    </div>
    <section className="panel table-panel mt">
      <div className="table-wrap"><table><thead><tr><th>Месяц</th><th>Точка</th><th>Выручка</th><th>Процедур</th><th>Средний чек</th><th>ФОТ</th><th>Чистый результат</th><th>Комментарий</th></tr></thead>
      <tbody>{state.actuals.map(a=>{const l=state.locations.find(x=>x.id===a.locationId);return <tr key={a.id}><td>{a.month}</td><td><b>{l?.city??a.locationId}</b></td><td>{money(a.revenue)}</td><td>{a.procedures}</td><td>{money(a.procedures?a.revenue/a.procedures:0)}</td><td>{money(a.payroll+a.employerCosts)}</td><td className={actualNet(a)>=0?"positive":"negative"}><b>{money(actualNet(a))}</b></td><td>{a.note||"—"}</td></tr>})}</tbody></table></div>
    </section>
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
  const add=()=>{
    const e:Employee={id:crypto.randomUUID(),locationId:"sokol",name:"Новый кандидат",role:"Парикмахер",service:"Стрижки",status:"candidate",percent:50,fixed:0,revenue:100000,procedures:180,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1};
    setState(s=>({...s,employees:[...s.employees,e]}));
  };
  const upd=(id:string,patch:Partial<Employee>)=>setState(s=>({...s,employees:s.employees.map(e=>e.id===id?{...e,...patch}:e)}));
  return <div className="page">
    <div className="page-head"><div><span className="eyebrow">КОМАНДА</span><h1>Люди и загрузка</h1><p>Не раздувай штат: следи за зарплатой, выручкой на мастера и загрузкой.</p></div><button className="btn primary" onClick={add}><Plus size={16}/> Добавить мастера</button></div>
    <div className="team-cards">{state.locations.map(l=>{const p=locationPnl(l);const count=l.hairMasters+l.nailMasters;return <div className="team-card" key={l.id}><div><b>{l.city}</b><span>{count} мастеров в плане</span></div><div><span>ЗП / мастер</span><b>{money(count?p.staff/count:0)}</b></div><div><span>Выручка / мастер</span><b>{money(count?l.revenue/count:0)}</b></div><div><span>Процедур / мастер / день</span><b>{num(count?p.procedures/30/count:0)}</b></div></div>})}</div>
    <section className="panel table-panel mt"><div className="table-wrap"><table><thead><tr><th>Мастер</th><th>Точка</th><th>Выручка</th><th>%</th><th>Начислено</th><th>Сверху</th><th>Стоимость бизнесу</th><th>Процедур/смену</th></tr></thead>
    <tbody>{state.employees.map(e=>{const c=employeeCost(e);return <tr key={e.id}>
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
  const reset=()=>{const x=cloneSeed();setState(x);localStorage.setItem("franchise-os",JSON.stringify(x))};
  const lock=()=>{sessionStorage.removeItem("franchise-os-unlocked");setUnlocked(false);setMobileOpen(false)};

  if(!authChecked)return <div className="passcode-loading"/>;
  if(!unlocked)return <PasscodeGate onUnlock={()=>setUnlocked(true)}/>;

  const content =
    tab==="overview"?<Overview state={state} setTab={setTab} setSelected={setSelected}/>:
    tab==="locations"?<Locations state={state} setState={setState} selected={selected} setSelected={setSelected}/>:
    tab==="finance"?<Finance state={state}/>:
    tab==="actuals"?<Actuals state={state} setState={setState}/>:
    tab==="scenarios"?<Scenarios state={state} setState={setState}/>:
    tab==="staff"?<Staff state={state} setState={setState}/>:
    tab==="funds"?<Funds state={state} setState={setState}/>:
    tab==="openings"?<Openings state={state} setState={setState}/>:
    tab==="payments"?<Payments state={state}/>:
    tab==="dossier"?<Dossier/>:
    <SettingsPage state={state} setState={setState} reset={reset}/>;

  const renderNav=(group:"main"|"manage"|"system")=>nav.filter(n=>n.group===group).map(n=>{
    const I=n.icon;
    return <button key={n.id} className={tab===n.id?"nav-item active":"nav-item"} onClick={()=>{setTab(n.id);setMobileOpen(false)}}><I size={18}/><span>{n.label}</span>{tab===n.id&&<span className="nav-active-dot"/>}</button>;
  });

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="brand"><div className="brand-mark">F</div><div><strong>FRANCHISE OS</strong><span>STRIXY</span></div><button className="icon-btn mobile-only close-nav" onClick={()=>setMobileOpen(false)}><X size={20}/></button></div>
      <div className="sidebar-section"><span className="sidebar-label">Управление</span>{renderNav("main")}</div>
      <div className="sidebar-section"><span className="sidebar-label">Операции</span>{renderNav("manage")}</div>
      <div className="sidebar-bottom">{renderNav("system")}<div className="storage-note"><div className="online-dot"/><span><b>Данные сохранены</b><small>локально в браузере</small></span></div></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="top-left"><button className="icon-btn mobile-only" onClick={()=>setMobileOpen(true)}><Menu size={21}/></button><div><span>{nav.find(n=>n.id===tab)?.label}</span><small>STRIXY · Сокол → Грязовец → Шексна</small></div></div>
        <div className="top-actions"><button className="quick-pill" onClick={()=>setTab("dossier")}><BookOpen size={15}/> База STRIXY</button><button className="quick-pill lock-pill" onClick={lock}><LockKeyhole size={15}/> Закрыть</button><button className="owner-avatar" onClick={lock} aria-label="Заблокировать платформу">ИВ</button></div>
      </header>
      {content}
    </main>

    <div className="mobile-nav">
      {nav.filter(n=>["overview","locations","finance","actuals","staff"].includes(n.id)).map(n=>{const I=n.icon;return <button key={n.id} className={tab===n.id?"active":""} onClick={()=>setTab(n.id)}><I size={19}/><span>{n.label}</span></button>})}
    </div>
  </div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Building2, Calculator, CalendarRange, ChevronRight, CircleDollarSign,
  Coins, CreditCard, Gauge, Landmark, Menu, PiggyBank, Settings, ShieldCheck,
  Sparkles, Target, TrendingUp, Users, Wallet, X, Plus, RotateCcw, CheckCircle2,
  AlertTriangle, Circle, Save
} from "lucide-react";
import {
  BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import { seed } from "@/lib/seed";
import { AppState, Employee, FundTx, Location, Scenario } from "@/lib/types";
import { employeeCost, locationPnl, money, num } from "@/lib/finance";

type Tab = "overview"|"locations"|"finance"|"scenarios"|"staff"|"funds"|"openings"|"payments"|"settings";

const nav: {id:Tab; label:string; icon:any}[] = [
  {id:"overview",label:"Обзор",icon:Gauge},
  {id:"locations",label:"Точки",icon:Building2},
  {id:"finance",label:"Финансы",icon:CircleDollarSign},
  {id:"scenarios",label:"Сценарии",icon:Calculator},
  {id:"staff",label:"Персонал",icon:Users},
  {id:"funds",label:"Фонды",icon:PiggyBank},
  {id:"openings",label:"План открытий",icon:CalendarRange},
  {id:"payments",label:"Платежи",icon:CreditCard},
  {id:"settings",label:"Настройки",icon:Settings},
];

function cloneSeed(): AppState {
  return JSON.parse(JSON.stringify(seed));
}

function downloadCsv(filename:string, rows:(string|number)[][]) {
  const csv = rows.map(row=>row.map(cell=>{
    const value=String(cell ?? "");
    return /[;"\n]/.test(value) ? `"${value.replace(/"/g,'""')}"` : value;
  }).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function Kpi({label,value,sub,icon:Icon,tone="red"}:{label:string;value:string;sub?:string;icon:any;tone?:string}) {
  return <div className="kpi">
    <div className={`kpi-icon ${tone}`}><Icon size={18}/></div>
    <div><div className="muted tiny">{label}</div><div className="kpi-value">{value}</div>{sub&&<div className="muted tiny">{sub}</div>}</div>
  </div>
}

function Pill({children,tone="neutral"}:{children:React.ReactNode;tone?:string}) {
  return <span className={`pill ${tone}`}>{children}</span>
}

function SectionTitle({title,sub,action}:{title:string;sub?:string;action?:React.ReactNode}) {
  return <div className="section-title"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{action}</div>
}

function NumberInput({value,onChange,suffix}:{value:number;onChange:(n:number)=>void;suffix?:string}) {
  return <label className="number-input"><input type="number" value={value} onChange={e=>onChange(Number(e.target.value||0))}/>{suffix&&<span>{suffix}</span>}</label>
}

function LocationCard({l,onOpen}:{l:Location;onOpen:()=>void}) {
  const pnl=locationPnl(l);
  return <button className="location-card" onClick={onOpen}>
    <div className="row between">
      <div>
        <div className="row gap8"><span className="location-dot"/><strong>{l.city}</strong></div>
        <div className="muted tiny">{l.format}</div>
      </div>
      <Pill tone={l.status==="active"?"green":l.status==="opening"?"amber":"neutral"}>{l.status==="active"?"Работает":l.status==="opening"?"Открытие":"План"}</Pill>
    </div>
    <div className="card-metrics">
      <div><span>Выручка</span><b>{money(l.revenue)}</b></div>
      <div><span>Чистая прибыль</span><b>{money(pnl.net)}</b></div>
      <div><span>Маржа</span><b>{num(pnl.margin)}%</b></div>
    </div>
    <div className="row between muted tiny"><span>Безубыточность {money(pnl.breakEvenRevenue)}</span><ChevronRight size={16}/></div>
  </button>
}

function Overview({state,setTab,setSelected}:{state:AppState;setTab:(t:Tab)=>void;setSelected:(id:string)=>void}) {
  const totalRevenue=state.locations.reduce((s,l)=>s+l.revenue,0);
  const totalNet=state.locations.reduce((s,l)=>s+locationPnl(l).net,0);
  const invested=state.locations.filter(l=>l.status!=="planned").reduce((s,l)=>s+l.launchCost,0);
  const reserved=state.locations.reduce((s,l)=>s+l.installmentBalance,0);
  const capital=(state.capitalMin+state.capitalMax)/2;
  const free=Math.max(0,capital-invested-reserved);
  const totalFunds=state.locations.reduce((s,l)=>s+l.depreciationFund+l.cultureFund,0);
  const chart=state.locations.map(l=>({name:l.city,revenue:l.revenue,profit:Math.max(0,locationPnl(l).net)}));
  const next=state.locations.find(l=>l.status==="planned");
  const readiness = [
    {label:"Резерв не ниже 600 тыс. ₽",ok:free>=600000},
    {label:"Есть работающая прибыльная точка",ok:state.locations.some(l=>l.status==="active"&&locationPnl(l).net>0)},
    {label:"Команда укомплектована",ok:state.employees.filter(e=>e.status==="active").length>=4},
    {label:"Следующая точка профинансирована",ok:next ? free>=next.launchCost : true},
  ];

  return <div className="page">
    <div className="hero">
      <div><Pill tone="red">FRANCHISE OS · STRIXY</Pill><h1>Сеть под контролем.<br/>Деньги — по плану.</h1><p>Сокол → Грязовец → Шексна. Базовая модель без кредитов.</p></div>
      <div className="hero-capital"><span>Капитал на бизнес</span><strong>{money(state.capitalMin)}–{money(state.capitalMax)}</strong><small>после продажи квартиры и налога</small></div>
    </div>

    <div className="kpi-grid">
      <Kpi label="Оборот сети / месяц" value={money(totalRevenue)} sub="базовый зрелый сценарий" icon={TrendingUp}/>
      <Kpi label="Чистая прибыль / месяц" value={money(totalNet)} sub={`${num(totalRevenue?totalNet/totalRevenue*100:0)}% чистая маржа`} icon={Wallet} tone="green"/>
      <Kpi label="Зарезервировано рассрочек" value={money(reserved)} sub="будущие платежи STRIXY" icon={Landmark} tone="amber"/>
      <Kpi label="Фонды / месяц" value={money(totalFunds)} sub="амортизация + команда" icon={PiggyBank} tone="blue"/>
    </div>

    <div className="two-col">
      <section className="panel">
        <SectionTitle title="Точки сети" sub="Плановая зрелая экономика" action={<button className="link-btn" onClick={()=>setTab("locations")}>Все точки <ChevronRight size={14}/></button>}/>
        <div className="locations-grid">{state.locations.map(l=><LocationCard key={l.id} l={l} onOpen={()=>{setSelected(l.id);setTab("locations")}}/>)}</div>
      </section>

      <section className="panel">
        <SectionTitle title="Готовность к следующей точке" sub={next ? `Следующая: ${next.city}` : "Все точки открыты"}/>
        <div className="readiness">
          {readiness.map(r=><div className="readiness-row" key={r.label}>{r.ok?<CheckCircle2 size={18} className="ok"/>:<Circle size={18} className="muted"/>}<span>{r.label}</span></div>)}
        </div>
        <div className="reserve-box"><span>Расчётный свободный резерв</span><b>{money(free)}</b><small>капитал − инвестировано − будущие рассрочки</small></div>
      </section>
    </div>

    <div className="two-col wide-left">
      <section className="panel chart-panel">
        <SectionTitle title="Выручка и прибыль" sub="По точкам, ₽/мес."/>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#24262d"/><XAxis dataKey="name" stroke="#777"/><YAxis stroke="#777" tickFormatter={(v)=>`${Math.round(v/1000)}k`}/><Tooltip formatter={(v:any)=>money(Number(v))} contentStyle={{background:"#14151a",border:"1px solid #292b33",borderRadius:12}}/><Legend/><Bar dataKey="revenue" name="Выручка" fill="#ef3340" radius={[7,7,0,0]}/><Bar dataKey="profit" name="Чистая прибыль" fill="#e6e7eb" radius={[7,7,0,0]}/></BarChart>
        </ResponsiveContainer>
      </section>
      <section className="panel">
        <SectionTitle title="Капитал" sub="План распределения"/>
        <div className="capital-stack">
          <div><span>Средний доступный капитал</span><b>{money(capital)}</b></div>
          <div><span>Три старта STANDARD</span><b>{money(state.locations.reduce((s,l)=>s+l.launchCost,0))}</b></div>
          <div><span>Будущие рассрочки</span><b>{money(reserved)}</b></div>
        </div>
        <div className="warning"><AlertTriangle size={18}/><span>Три точки одновременно создадут кассовый риск. План — последовательный запуск.</span></div>
      </section>
    </div>
  </div>
}

function Locations({state,setState,selected,setSelected}:{state:AppState;setState:any;selected:string;setSelected:(s:string)=>void}) {
  const l=state.locations.find(x=>x.id===selected)||state.locations[0];
  const pnl=locationPnl(l);
  const update=(patch:Partial<Location>)=>setState((s:AppState)=>({...s,locations:s.locations.map(x=>x.id===l.id?{...x,...patch}:x)}));
  const addService=()=>update({services:[...l.services,{id:crypto.randomUUID(),name:"Новая услуга",price:500,sharePct:0,masterPct:50}]});
  const serviceShare=l.services.reduce((s,x)=>s+x.sharePct,0);
  return <div className="page">
    <SectionTitle title="Точки" sub="Экономика и параметры каждой точки"/>
    <div className="tabs-row">{state.locations.map(x=><button key={x.id} className={selected===x.id?"chip active":"chip"} onClick={()=>setSelected(x.id)}>{x.city}</button>)}</div>
    <div className="detail-grid">
      <section className="panel">
        <div className="row between"><div><h2>{l.name}</h2><p className="muted">{l.format}</p></div><Pill tone="red">{money(l.revenue)}/мес.</Pill></div>
        <div className="form-grid">
          <label>Плановая выручка<NumberInput value={l.revenue} onChange={v=>update({revenue:v})}/></label>
          <label>Стоимость запуска<NumberInput value={l.launchCost} onChange={v=>update({launchCost:v})}/></label>
          <label>Аренда + КУ<NumberInput value={l.rent} onChange={v=>update({rent:v})}/></label>
          <label>Реклама<NumberInput value={l.marketing} onChange={v=>update({marketing:v})}/></label>
          <label>Мастерам<NumberInput value={l.staffPct} onChange={v=>update({staffPct:v})} suffix="%"/></label>
          <label>Расходники<NumberInput value={l.materialsPct} onChange={v=>update({materialsPct:v})} suffix="%"/></label>
          <label>Эквайринг<NumberInput value={l.acquiringPct} onChange={v=>update({acquiringPct:v})} suffix="%"/></label>
          <label>Налоговый резерв<NumberInput value={l.taxPct} onChange={v=>update({taxPct:v})} suffix="%"/></label>
          <label>Амортизационный фонд<NumberInput value={l.depreciationFund} onChange={v=>update({depreciationFund:v})}/></label>
          <label>Фонд команды<NumberInput value={l.cultureFund} onChange={v=>update({cultureFund:v})}/></label>
          <label>Остаток рассрочки<NumberInput value={l.installmentBalance} onChange={v=>update({installmentBalance:v})}/></label>
          <label>Платёж рассрочки<NumberInput value={l.installmentMonthly} onChange={v=>update({installmentMonthly:v})}/></label>
        </div>
        <div className="service-box">
          <div className="row between">
            <div><h3>Структура услуг</h3><span className={serviceShare===100?"muted tiny":"share-warning"}>Сумма долей: {num(serviceShare)}%</span></div>
            <button className="link-btn" onClick={addService}><Plus size={14}/> Услуга</button>
          </div>
          <div className="service-lines">
            {l.services.map((s,i)=>{
              const serviceRevenue=l.revenue*s.sharePct/100;
              const procedures=s.price?serviceRevenue/s.price:0;
              const patchService=(patch:any)=>update({services:l.services.map((x,j)=>j===i?{...x,...patch}:x)});
              return <div className="service-line expanded" key={s.id}>
                <div>
                  <input className="table-input" value={s.name} onChange={e=>patchService({name:e.target.value})}/>
                  <small>{money(serviceRevenue)} · ≈ {Math.round(procedures)} процедур/мес.</small>
                </div>
                <label><span>Цена</span><NumberInput value={s.price} onChange={v=>patchService({price:v})}/></label>
                <label><span>Доля</span><NumberInput value={s.sharePct} onChange={v=>patchService({sharePct:v})} suffix="%"/></label>
                <label><span>Мастеру</span><NumberInput value={s.masterPct} onChange={v=>patchService({masterPct:v})} suffix="%"/></label>
              </div>
            })}
          </div>
        </div>

      </section>
      <section className="panel sticky-summary">
        <SectionTitle title="P&L точки" sub="Зрелый месяц"/>
        <div className="pnl-list">
          <div><span>Выручка</span><b>{money(l.revenue)}</b></div>
          <div><span>ФОТ мастеров</span><b className="negative">−{money(pnl.staff)}</b></div>
          <div><span>Расходники</span><b className="negative">−{money(pnl.materials)}</b></div>
          <div><span>Эквайринг</span><b className="negative">−{money(pnl.acquiring)}</b></div>
          <div><span>Постоянные + фонды</span><b className="negative">−{money(pnl.fixed)}</b></div>
          <div><span>Операционная прибыль</span><b>{money(pnl.operating)}</b></div>
          <div><span>Налоговый резерв</span><b className="negative">−{money(pnl.tax)}</b></div>
          <div className="total"><span>Чистая прибыль</span><b>{money(pnl.net)}</b></div>
        </div>
        <div className="mini-kpis"><div><span>Маржа</span><b>{num(pnl.margin)}%</b></div><div><span>Безубыточность</span><b>{money(pnl.breakEvenRevenue)}</b></div></div>
      </section>
    </div>
  </div>
}

function Finance({state}:{state:AppState}) {
  const rows=state.locations.map(l=>({l,p:locationPnl(l)}));
  const totalRevenue=rows.reduce((s,x)=>s+x.l.revenue,0), totalNet=rows.reduce((s,x)=>s+x.p.net,0);
  return <div className="page">
    <SectionTitle title="Финансы" sub="P&L сети и каждой точки" action={<button className="primary" onClick={()=>downloadCsv("franchise-os-pnl.csv",[
      ["Точка","Выручка","ФОТ","Расходники","Эквайринг","Фикс и фонды","Налог","Чистая прибыль","Маржа %"],
      ...rows.map(({l,p})=>[l.city,l.revenue,p.staff,p.materials,p.acquiring,p.fixed,p.tax,p.net,p.margin.toFixed(1)])
    ])}><Save size={16}/> CSV</button>}/>
    <div className="kpi-grid three">
      <Kpi label="Выручка сети" value={money(totalRevenue)} icon={BarChart3}/>
      <Kpi label="Чистая прибыль" value={money(totalNet)} icon={Wallet} tone="green"/>
      <Kpi label="Чистая маржа" value={`${num(totalRevenue?totalNet/totalRevenue*100:0)}%`} icon={Target} tone="blue"/>
    </div>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Точка</th><th>Выручка</th><th>ФОТ</th><th>Расходники</th><th>Фикс + фонды</th><th>Налог</th><th>Чистая прибыль</th><th>Маржа</th></tr></thead><tbody>
      {rows.map(({l,p})=><tr key={l.id}><td><b>{l.city}</b></td><td>{money(l.revenue)}</td><td>{money(p.staff)}</td><td>{money(p.materials)}</td><td>{money(p.fixed)}</td><td>{money(p.tax)}</td><td className="positive"><b>{money(p.net)}</b></td><td>{num(p.margin)}%</td></tr>)}
      <tr className="total-row"><td>Сеть</td><td>{money(totalRevenue)}</td><td colSpan={4}></td><td>{money(totalNet)}</td><td>{num(totalRevenue?totalNet/totalRevenue*100:0)}%</td></tr>
    </tbody></table></div></section>
  </div>
}

function Scenarios({state,setState}:{state:AppState;setState:any}) {
  const [selected,setSelected]=useState(state.scenarios[1]?.id||state.scenarios[0]?.id);
  const sc=state.scenarios.find(x=>x.id===selected)!;
  const calc=(l:Location)=>{
    const revenue=sc.revenues[l.id]??l.revenue;
    return locationPnl({...l,revenue,staffPct:sc.staffPct,materialsPct:sc.materialsPct,acquiringPct:sc.acquiringPct});
  };
  const updateSc=(patch:Partial<Scenario>)=>setState((s:AppState)=>({...s,scenarios:s.scenarios.map(x=>x.id===sc.id?{...x,...patch}:x)}));
  return <div className="page">
    <SectionTitle title="Сценарии" sub="Проверь устойчивость сети до вложения денег"/>
    <div className="tabs-row">{state.scenarios.map(x=><button className={selected===x.id?"chip active":"chip"} key={x.id} onClick={()=>setSelected(x.id)}>{x.name}</button>)}</div>
    <div className="two-col">
      <section className="panel">
        <h3>Параметры сценария</h3>
        <div className="form-grid">
          {state.locations.map(l=><label key={l.id}>Выручка · {l.city}<NumberInput value={sc.revenues[l.id]||0} onChange={v=>updateSc({revenues:{...sc.revenues,[l.id]:v}})}/></label>)}
          <label>ФОТ мастеров<NumberInput value={sc.staffPct} onChange={v=>updateSc({staffPct:v})} suffix="%"/></label>
          <label>Расходники<NumberInput value={sc.materialsPct} onChange={v=>updateSc({materialsPct:v})} suffix="%"/></label>
          <label>Эквайринг<NumberInput value={sc.acquiringPct} onChange={v=>updateSc({acquiringPct:v})} suffix="%"/></label>
        </div>
      </section>
      <section className="panel">
        <h3>Результат</h3>
        <div className="scenario-results">
          {state.locations.map(l=>{const p=calc(l);return <div key={l.id}><span>{l.city}</span><b>{money(p.net)}</b><small>{num(p.margin)}% маржа · Б/У {money(p.breakEvenRevenue)}</small></div>})}
        </div>
        <div className="total-scenario"><span>Сеть / месяц</span><b>{money(state.locations.reduce((s,l)=>s+calc(l).net,0))}</b></div>
      </section>
    </div>
  </div>
}

function Staff({state,setState}:{state:AppState;setState:any}) {
  const add=()=> {
    const e:Employee={id:crypto.randomUUID(),locationId:"sokol",name:"Новый кандидат",role:"Парикмахер",service:"Стрижки",status:"candidate",percent:50,fixed:0,revenue:100000,procedures:180,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1};
    setState((s:AppState)=>({...s,employees:[...s.employees,e]}));
  };
  const upd=(id:string,patch:Partial<Employee>)=>setState((s:AppState)=>({...s,employees:s.employees.map(e=>e.id===id?{...e,...patch}:e)}));
  return <div className="page">
    <SectionTitle title="Персонал" sub="Зарплата мастера и полная стоимость для бизнеса" action={<button className="primary" onClick={add}><Plus size={16}/> Добавить</button>}/>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Мастер</th><th>Точка</th><th>Выручка</th><th>%</th><th>Начислено</th><th>Взносы + резервы</th><th>Стоимость бизнесу</th><th>Процедур/смену</th></tr></thead><tbody>
      {state.employees.map(e=>{const c=employeeCost(e);const loc=state.locations.find(l=>l.id===e.locationId);return <tr key={e.id}>
        <td><input className="table-input" value={e.name} onChange={x=>upd(e.id,{name:x.target.value})}/><small>{e.role}</small></td>
        <td><select value={e.locationId} onChange={x=>upd(e.id,{locationId:x.target.value})}>{state.locations.map(l=><option value={l.id} key={l.id}>{l.city}</option>)}</select></td>
        <td><NumberInput value={e.revenue} onChange={v=>upd(e.id,{revenue:v})}/></td>
        <td><NumberInput value={e.percent} onChange={v=>upd(e.id,{percent:v})} suffix="%"/></td>
        <td>{money(c.salary)}</td><td>{money(c.insurance+c.vacation+c.sick)}</td><td><b>{money(c.total)}</b></td><td>{e.shifts?num(e.procedures/e.shifts):"—"}</td>
      </tr>})}
    </tbody></table></div></section>
    <div className="note"><ShieldCheck size={18}/><span>Официальное оформление считается отдельно от процента: начисленная зарплата ≠ деньги «на руки» ≠ полная стоимость сотрудника.</span></div>
  </div>
}

function Funds({state,setState}:{state:AppState;setState:any}) {
  const [amount,setAmount]=useState(15000),[fund,setFund]=useState<FundTx["fund"]>("culture"),[note,setNote]=useState("");
  const add=()=>{if(!amount)return; const tx:FundTx={id:crypto.randomUUID(),fund,date:new Date().toISOString().slice(0,10),category:"Пополнение",amount,note}; setState((s:AppState)=>({...s,funds:[tx,...s.funds]}));setNote("")};
  const sums={depreciation:0,culture:0,reserve:0}; state.funds.forEach(x=>sums[x.fund]+=x.amount);
  return <div className="page">
    <SectionTitle title="Фонды" sub="Зарезервированные деньги — не свободная прибыль владельца"/>
    <div className="kpi-grid three">
      <Kpi label="Амортизационный фонд" value={money(sums.depreciation)} icon={Coins}/>
      <Kpi label="Фонд команды" value={money(sums.culture)} icon={Sparkles} tone="blue"/>
      <Kpi label="Резерв" value={money(sums.reserve)} icon={PiggyBank} tone="green"/>
    </div>
    <div className="two-col">
      <section className="panel"><h3>Операция фонда</h3><div className="fund-form">
        <select value={fund} onChange={e=>setFund(e.target.value as any)}><option value="culture">Фонд команды</option><option value="depreciation">Амортизация</option><option value="reserve">Резерв</option></select>
        <NumberInput value={amount} onChange={setAmount}/>
        <input placeholder="Комментарий" value={note} onChange={e=>setNote(e.target.value)}/>
        <button className="primary" onClick={add}><Plus size={16}/> Добавить</button>
      </div></section>
      <section className="panel"><h3>Последние операции</h3><div className="transactions">{state.funds.length?state.funds.slice(0,8).map(x=><div key={x.id}><span>{x.date} · {x.note||x.category}</span><b>{money(x.amount)}</b></div>):<div className="empty">Операций пока нет</div>}</div></section>
    </div>
  </div>
}

function Openings({state,setState}:{state:AppState;setState:any}) {
  const cycle=(id:string)=>setState((s:AppState)=>({...s,openingTasks:s.openingTasks.map(t=>t.id===id?{...t,status:t.status==="todo"?"doing":t.status==="doing"?"done":"todo"}:t)}));
  return <div className="page"><SectionTitle title="План открытий" sub="Сокол → Грязовец → Шексна"/>
    <div className="opening-grid">{state.locations.map(l=><section className="panel" key={l.id}><div className="row between"><div><h3>{l.city}</h3><span className="muted tiny">{l.plannedLaunch}</span></div><Pill>{l.status==="planned"?"План":l.status}</Pill></div>
      <div className="task-list">{state.openingTasks.filter(t=>t.locationId===l.id).map(t=><button key={t.id} onClick={()=>cycle(t.id)} className={`task ${t.status}`}>{t.status==="done"?<CheckCircle2 size={17}/>:t.status==="doing"?<CircleDollarSign size={17}/>:<Circle size={17}/>}<span>{t.title}</span><small>нед. {t.week}</small></button>)}</div>
    </section>)}</div>
  </div>
}

function Payments({state}:{state:AppState}) {
  return <div className="page"><SectionTitle title="Платежи" sub="Рассрочки франшизы и обязательства"/>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Точка</th><th>Остаток</th><th>Платёж / мес.</th><th>Месяцев</th><th>Статус</th></tr></thead><tbody>
      {state.locations.map(l=><tr key={l.id}><td><b>{l.city}</b></td><td>{money(l.installmentBalance)}</td><td>{money(l.installmentMonthly)}</td><td>{l.installmentMonthly?Math.ceil(l.installmentBalance/l.installmentMonthly):0}</td><td><Pill tone={l.status==="active"?"amber":"neutral"}>{l.status==="active"?"Платим":"Начнётся после запуска"}</Pill></td></tr>)}
    </tbody></table></div></section>
  </div>
}

function SettingsPage({state,setState,reset}:{state:AppState;setState:any;reset:()=>void}) {
  return <div className="page"><SectionTitle title="Настройки" sub="Глобальные параметры модели"/>
    <div className="two-col"><section className="panel"><h3>Капитал</h3><div className="form-grid"><label>Минимум<NumberInput value={state.capitalMin} onChange={v=>setState((s:AppState)=>({...s,capitalMin:v}))}/></label><label>Максимум<NumberInput value={state.capitalMax} onChange={v=>setState((s:AppState)=>({...s,capitalMax:v}))}/></label></div></section>
    <section className="panel"><h3>Данные</h3><p className="muted">Изменения автоматически сохраняются в этом браузере.</p><button className="danger" onClick={reset}><RotateCcw size={16}/> Сбросить к стартовой модели</button></section></div>
  </div>
}

export default function FranchiseApp() {
  const [state,setState]=useState<AppState>(cloneSeed());
  const [tab,setTab]=useState<Tab>("overview");
  const [selected,setSelected]=useState("sokol");
  const [mobileOpen,setMobileOpen]=useState(false);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{try{const raw=localStorage.getItem("franchise-os");if(raw)setState(JSON.parse(raw));}catch{} setLoaded(true)},[]);
  useEffect(()=>{if(loaded)localStorage.setItem("franchise-os",JSON.stringify(state))},[state,loaded]);
  const reset=()=>{const x=cloneSeed();setState(x);localStorage.setItem("franchise-os",JSON.stringify(x))};

  const content = tab==="overview"?<Overview state={state} setTab={setTab} setSelected={setSelected}/>:
    tab==="locations"?<Locations state={state} setState={setState} selected={selected} setSelected={setSelected}/>:
    tab==="finance"?<Finance state={state}/>:
    tab==="scenarios"?<Scenarios state={state} setState={setState}/>:
    tab==="staff"?<Staff state={state} setState={setState}/>:
    tab==="funds"?<Funds state={state} setState={setState}/>:
    tab==="openings"?<Openings state={state} setState={setState}/>:
    tab==="payments"?<Payments state={state}/>:
    <SettingsPage state={state} setState={setState} reset={reset}/>;

  return <div className="app">
    <aside className={`sidebar ${mobileOpen?"open":""}`}>
      <div className="brand"><div className="brand-mark">F</div><div><strong>FRANCHISE</strong><span>OS</span></div><button className="icon-btn mobile-only" onClick={()=>setMobileOpen(false)}><X size={20}/></button></div>
      <div className="network-label">Сеть <b>STRIXY</b></div>
      <nav>{nav.map(n=>{const I=n.icon;return <button key={n.id} className={tab===n.id?"nav-item active":"nav-item"} onClick={()=>{setTab(n.id);setMobileOpen(false)}}><I size={18}/><span>{n.label}</span></button>})}</nav>
      <div className="sidebar-foot"><div className="status-dot"/>Локальный режим<br/><small>данные сохраняются автоматически</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="icon-btn mobile-only" onClick={()=>setMobileOpen(true)}><Menu size={21}/></button><div className="top-title">{nav.find(n=>n.id===tab)?.label}</div><div className="save-state"><Save size={15}/> Сохранено</div></header>
      {content}
    </main>
    <div className="mobile-nav">{nav.slice(0,5).map(n=>{const I=n.icon;return <button key={n.id} className={tab===n.id?"active":""} onClick={()=>setTab(n.id)}><I size={19}/><span>{n.label}</span></button>})}</div>
  </div>
}

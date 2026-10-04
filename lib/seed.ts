import { AppState } from "./types";

export const seed: AppState = {
  capitalMin: 3900000,
  capitalMax: 4000000,
  locations: [
    {
      id:"sokol", name:"STRIXY Сокол", city:"Сокол", format:"STANDARD · 3 кресла + 2 ногтевых места",
      status:"planned", revenue:800000, targetRevenue:800000, launchCost:1213773,
      installmentBalance:340000, installmentMonthly:34000, rent:40000, accounting:2500,
      internet:1000, cleaning:5000, software:2000, marketing:10000, depreciationFund:15000,
      cultureFund:15000, materialsPct:8, acquiringPct:2, staffPct:49.5, taxPct:15,
      plannedLaunch:"2027-09", manicure:true, services:[{id:"cut",name:"Стрижки",price:500,sharePct:59,masterPct:50},{id:"color",name:"Окрашивания",price:1800,sharePct:13,masterPct:40},{id:"nails",name:"Ногти",price:1250,sharePct:28,masterPct:50}]
    },
    {
      id:"gryazovets", name:"STRIXY Грязовец", city:"Грязовец", format:"STANDARD · 3 кресла",
      status:"planned", revenue:500000, targetRevenue:500000, launchCost:1213773,
      installmentBalance:340000, installmentMonthly:34000, rent:40000, accounting:2500,
      internet:1000, cleaning:5000, software:2000, marketing:10000, depreciationFund:15000,
      cultureFund:15000, materialsPct:8, acquiringPct:2, staffPct:49.5, taxPct:15,
      plannedLaunch:"2028-01", manicure:false, services:[{id:"cut",name:"Стрижки",price:500,sharePct:90,masterPct:50},{id:"color",name:"Окрашивания",price:1800,sharePct:10,masterPct:40}]
    },
    {
      id:"sheksna", name:"STRIXY Шексна", city:"Шексна", format:"STANDARD · 3 кресла",
      status:"planned", revenue:500000, targetRevenue:500000, launchCost:1213773,
      installmentBalance:340000, installmentMonthly:34000, rent:40000, accounting:2500,
      internet:1000, cleaning:5000, software:2000, marketing:10000, depreciationFund:15000,
      cultureFund:15000, materialsPct:8, acquiringPct:2, staffPct:49.5, taxPct:15,
      plannedLaunch:"2028-06", manicure:false, services:[{id:"cut",name:"Стрижки",price:500,sharePct:90,masterPct:50},{id:"color",name:"Окрашивания",price:1800,sharePct:10,masterPct:40}]
    }
  ],
  employees: [
    {id:"e1",locationId:"sokol",name:"Мастер 1",role:"Парикмахер",service:"Стрижки",status:"candidate",percent:50,fixed:0,revenue:120000,procedures:210,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1},
    {id:"e2",locationId:"sokol",name:"Мастер 2",role:"Парикмахер",service:"Стрижки",status:"candidate",percent:50,fixed:0,revenue:120000,procedures:210,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1},
    {id:"e3",locationId:"sokol",name:"Nail-мастер 1",role:"Мастер ногтей",service:"Маникюр",status:"candidate",percent:50,fixed:0,revenue:110000,procedures:88,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1}
  ],
  funds: [],
  scenarios: [
    {id:"conservative",name:"Консервативный",revenues:{sokol:650000,gryazovets:400000,sheksna:400000},staffPct:50,materialsPct:8,acquiringPct:2},
    {id:"base",name:"Базовый",revenues:{sokol:800000,gryazovets:500000,sheksna:500000},staffPct:49.5,materialsPct:8,acquiringPct:2},
    {id:"strong",name:"Сильный",revenues:{sokol:1000000,gryazovets:650000,sheksna:650000},staffPct:48,materialsPct:8,acquiringPct:2}
  ],
  openingTasks: [
    "Договор с франшизой","Поиск помещения","Согласование помещения","Договор аренды",
    "Дизайн и планировка","Ремонт","Заказ мебели и оборудования","Набор мастеров",
    "Реклама до открытия","Доставка","Монтаж","Вывеска","Запуск","Реклама после открытия"
  ].flatMap((title, i) => ["sokol","gryazovets","sheksna"].map(locationId => ({
    id:`${locationId}-t${i}`, locationId, title, status:"todo" as const, week: Math.min(6, Math.floor(i/2)+1)
  })))
};

import { AppState } from "./types";

const openingTemplate = [
  {week:0,title:"Собеседование с франшизой, договоры и оплата первого платежа"},
  {week:0,title:"Регистрация ИП / проверка действующего ИП"},
  {week:0,title:"Доступ к бизнесбуку и добавление в чат запуска"},
  {week:0,title:"Поиск и согласование помещения — ориентир 7–30+ дней"},
  {week:1,title:"Проверка и подписание договора аренды"},
  {week:1,title:"Разработка дизайна и плана точки"},
  {week:1,title:"Разработка проекта фасада"},
  {week:1,title:"Поиск подрядчика по ремонту и составление сметы"},
  {week:2,title:"Ремонт помещения по дизайн-проекту"},
  {week:2,title:"Заказ мебели и оборудования"},
  {week:2,title:"Заказ инструментов, расходников и косметики"},
  {week:2,title:"Размещение вакансий и подбор персонала"},
  {week:3,title:"Рабочая документация по персоналу"},
  {week:3,title:"Запуск рекламы до открытия"},
  {week:3,title:"Рекламные макеты и печатная продукция"},
  {week:3,title:"Финальное ценообразование"},
  {week:4,title:"Доставка мебели, оборудования, терминала, инструментов и косметики"},
  {week:4,title:"Монтаж мебели и оборудования"},
  {week:4,title:"Монтаж вывесок и рекламных конструкций"},
  {week:4,title:"Санитарные, пожарные и иные обязательные процедуры"},
  {week:5,title:"Открытие точки"},
  {week:5,title:"Запуск рекламы после открытия"},
  {week:6,title:"Фотосессия и видеосъёмка открытия"},
  {week:6,title:"Переход в штатный режим управления точкой"},
];

export const seed: AppState = {
  capitalMin: 3900000,
  capitalMax: 4000000,
  cashBalance: 3900000,
  locations: [
    {
      id:"sokol", name:"STRIXY Сокол", city:"Сокол", format:"STANDARD · 3 кресла + 2 ногтевых места",
      status:"planned", revenue:800000, targetRevenue:800000, launchCost:1213773,
      installmentBalance:340000, installmentMonthly:34000, rent:40000, accounting:2500,
      internet:1000, cleaning:5000, software:2000, marketing:10000, depreciationFund:15000,
      cultureFund:15000, materialsPct:8, acquiringPct:2, staffPct:49.5, taxPct:15,
      plannedLaunch:"2027-09", manicure:true, targetZone:"Советская / сильный пешеходный трафик",
      hairMasters:5, nailMasters:2, officialEmployment:false, employerInsurancePct:20,
      vacationReservePct:8.33, sickReservePct:1,
      services:[
        {id:"cut",name:"Стрижки",price:500,sharePct:59,masterPct:50},
        {id:"color",name:"Окрашивания",price:1800,sharePct:13,masterPct:40},
        {id:"nails",name:"Ногти",price:1250,sharePct:28,masterPct:50}
      ]
    },
    {
      id:"gryazovets", name:"STRIXY Грязовец", city:"Грязовец", format:"STANDARD · 3 кресла",
      status:"planned", revenue:500000, targetRevenue:500000, launchCost:1213773,
      installmentBalance:340000, installmentMonthly:34000, rent:40000, accounting:2500,
      internet:1000, cleaning:5000, software:2000, marketing:10000, depreciationFund:15000,
      cultureFund:15000, materialsPct:8, acquiringPct:2, staffPct:49.5, taxPct:15,
      plannedLaunch:"2028-01", manicure:false, targetZone:"Проспект Ленина / район сильного трафика",
      hairMasters:5, nailMasters:0, officialEmployment:false, employerInsurancePct:20,
      vacationReservePct:8.33, sickReservePct:1,
      services:[
        {id:"cut",name:"Стрижки",price:500,sharePct:90,masterPct:50},
        {id:"color",name:"Окрашивания",price:1800,sharePct:10,masterPct:40}
      ]
    },
    {
      id:"sheksna", name:"STRIXY Шексна", city:"Шексна", format:"STANDARD · 3 кресла",
      status:"planned", revenue:500000, targetRevenue:500000, launchCost:1213773,
      installmentBalance:340000, installmentMonthly:34000, rent:40000, accounting:2500,
      internet:1000, cleaning:5000, software:2000, marketing:10000, depreciationFund:15000,
      cultureFund:15000, materialsPct:8, acquiringPct:2, staffPct:49.5, taxPct:15,
      plannedLaunch:"2028-06", manicure:false, targetZone:"Точка первой линии с сильным ежедневным трафиком",
      hairMasters:5, nailMasters:0, officialEmployment:false, employerInsurancePct:20,
      vacationReservePct:8.33, sickReservePct:1,
      services:[
        {id:"cut",name:"Стрижки",price:500,sharePct:90,masterPct:50},
        {id:"color",name:"Окрашивания",price:1800,sharePct:10,masterPct:40}
      ]
    }
  ],
  employees: [
    {id:"e1",locationId:"sokol",name:"Мастер 1",role:"Парикмахер",service:"Стрижки",status:"candidate",percent:50,fixed:0,revenue:120000,procedures:210,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1},
    {id:"e2",locationId:"sokol",name:"Мастер 2",role:"Парикмахер",service:"Стрижки",status:"candidate",percent:50,fixed:0,revenue:120000,procedures:210,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1},
    {id:"e3",locationId:"sokol",name:"Nail-мастер 1",role:"Мастер ногтей",service:"Ногти",status:"candidate",percent:50,fixed:0,revenue:110000,procedures:88,shifts:15,official:true,insurancePct:20,vacationPct:8.33,sickPct:1}
  ],
  funds: [],
  scenarios: [
    {id:"conservative",name:"Консервативный",revenues:{sokol:650000,gryazovets:400000,sheksna:400000},staffPct:50,materialsPct:8,acquiringPct:2},
    {id:"base",name:"Базовый",revenues:{sokol:800000,gryazovets:500000,sheksna:500000},staffPct:49.5,materialsPct:8,acquiringPct:2},
    {id:"strong",name:"Сильный",revenues:{sokol:1000000,gryazovets:650000,sheksna:650000},staffPct:48,materialsPct:8,acquiringPct:2}
  ],
  openingTasks: openingTemplate.flatMap((task, i) =>
    ["sokol","gryazovets","sheksna"].map(locationId => ({
      id:`${locationId}-t${i}`,
      locationId,
      title:task.title,
      status:"todo" as const,
      week:task.week
    }))
  ),
  actuals: [],
  cashEvents: [],
  dismissedNotifications: [],
  privateNotes: [
    {id:"n1",title:"Главный принцип",body:"Не открывать три точки одновременно. Сокол должен сначала подтвердить поток, ФОТ и реальную чистую прибыль.",updatedAt:"2026-10-05"},
    {id:"n2",title:"Базовый минимум зрелой сети",body:"Сокол 800 000 ₽, Грязовец 500 000 ₽, Шексна 500 000 ₽ выручки в месяц.",updatedAt:"2026-10-05"}
  ],
  users: [
    {id:"owner",name:"Илья Всеволодов",role:"owner",email:"",locationIds:["sokol","gryazovets","sheksna"],status:"active"},
    {id:"manager-sokol",name:"Управляющий · Сокол",role:"manager",email:"",locationIds:["sokol"],status:"active"},
    {id:"master-1",name:"Мастер 1",role:"master",email:"",locationIds:["sokol"],employeeId:"e1",status:"active"},
    {id:"master-2",name:"Мастер 2",role:"master",email:"",locationIds:["sokol"],employeeId:"e2",status:"active"},
    {id:"master-nail-1",name:"Nail-мастер 1",role:"master",email:"",locationIds:["sokol"],employeeId:"e3",status:"active"}
  ],
  shifts: [
    {id:"sh1",employeeId:"e1",locationId:"sokol",date:"2026-10-05",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh2",employeeId:"e1",locationId:"sokol",date:"2026-10-07",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh3",employeeId:"e1",locationId:"sokol",date:"2026-10-09",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh4",employeeId:"e1",locationId:"sokol",date:"2026-10-11",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh5",employeeId:"e2",locationId:"sokol",date:"2026-10-06",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh6",employeeId:"e2",locationId:"sokol",date:"2026-10-08",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh7",employeeId:"e2",locationId:"sokol",date:"2026-10-10",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh8",employeeId:"e3",locationId:"sokol",date:"2026-10-05",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh9",employeeId:"e3",locationId:"sokol",date:"2026-10-08",startTime:"10:00",endTime:"20:00",status:"planned"},
    {id:"sh10",employeeId:"e3",locationId:"sokol",date:"2026-10-11",startTime:"10:00",endTime:"20:00",status:"planned"}
  ]
};

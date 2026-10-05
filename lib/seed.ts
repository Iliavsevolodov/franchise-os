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
  ],
  checklistTemplates: [
    {
      id:"master-open",title:"Открытие смены",description:"Подготовить рабочее место и быть готовым к началу смены.",
      role:"master",frequency:"shift_open",locationIds:["sokol","gryazovets","sheksna"],active:true,
      items:[
        {id:"mo1",text:"Прийти к началу смены по графику",required:true},
        {id:"mo2",text:"Проверить чистоту и порядок рабочего места",required:true},
        {id:"mo3",text:"Подготовить и обработать рабочие инструменты по внутренним правилам",required:true},
        {id:"mo4",text:"Проверить запас основных расходных материалов на смену",required:true},
        {id:"mo5",text:"Проверить исправность рабочего оборудования",required:true},
        {id:"mo6",text:"Сообщить управляющему о нехватке расходников, поломках или других проблемах",required:false}
      ]
    },
    {
      id:"master-close",title:"Закрытие смены",description:"Оставить рабочее место полностью готовым к следующей смене.",
      role:"master",frequency:"shift_close",locationIds:["sokol","gryazovets","sheksna"],active:true,
      items:[
        {id:"mc1",text:"Очистить рабочее место после последнего клиента",required:true},
        {id:"mc2",text:"Обработать и убрать рабочие инструменты по внутренним правилам",required:true},
        {id:"mc3",text:"Убрать волосы и рабочие отходы со своей зоны",required:true},
        {id:"mc4",text:"Проверить, что оборудование в рабочей зоне выключено или оставлено в безопасном режиме",required:true},
        {id:"mc5",text:"Пополнить расходники или сообщить, что требуется пополнение",required:false},
        {id:"mc6",text:"Передать управляющему информацию о поломках, жалобах или нестандартных ситуациях",required:false}
      ]
    },
    {
      id:"master-weekly",title:"Еженедельный контроль рабочего места",description:"Короткая проверка состояния своей рабочей зоны.",
      role:"master",frequency:"weekly",locationIds:["sokol","gryazovets","sheksna"],active:true,
      items:[
        {id:"mw1",text:"Проверить состояние инструментов и принадлежностей",required:true},
        {id:"mw2",text:"Проверить остатки расходных материалов",required:true},
        {id:"mw3",text:"Сообщить о том, что требует ремонта или замены",required:true},
        {id:"mw4",text:"Проверить порядок хранения личных и рабочих вещей",required:false}
      ]
    },
    {
      id:"manager-open",title:"Открытие точки",description:"Проверка готовности точки и команды к рабочему дню.",
      role:"manager",frequency:"daily",locationIds:["sokol","gryazovets","sheksna"],active:true,
      items:[
        {id:"go1",text:"Проверить готовность помещения к открытию",required:true},
        {id:"go2",text:"Проверить выход мастеров по графику",required:true},
        {id:"go3",text:"Проверить чистоту клиентской и рабочих зон",required:true},
        {id:"go4",text:"Проверить наличие критичных расходных материалов",required:true},
        {id:"go5",text:"Проверить работоспособность ключевого оборудования и терминала франшизы",required:true},
        {id:"go6",text:"Зафиксировать отсутствующих сотрудников и проблемы до начала работы",required:false}
      ]
    },
    {
      id:"manager-daily",title:"Ежедневный контроль точки",description:"Основные операционные показатели и проблемы в течение дня.",
      role:"manager",frequency:"daily",locationIds:["sokol","gryazovets","sheksna"],active:true,
      items:[
        {id:"gd1",text:"Проверить выполнение плана по выручке и клиентам",required:true},
        {id:"gd2",text:"Проверить загрузку и выход сотрудников",required:true},
        {id:"gd3",text:"Проверить наличие расходников и хозяйственных материалов",required:true},
        {id:"gd4",text:"Разобрать жалобы, отзывы и нестандартные ситуации",required:false},
        {id:"gd5",text:"Проверить поломки, заявки на ремонт и обслуживание",required:false},
        {id:"gd6",text:"Зафиксировать задачи, которые переходят на следующий день",required:true}
      ]
    },
    {
      id:"manager-close",title:"Закрытие точки",description:"Контроль завершения рабочего дня.",
      role:"manager",frequency:"shift_close",locationIds:["sokol","gryazovets","sheksna"],active:true,
      items:[
        {id:"gc1",text:"Проверить закрытие смен сотрудников",required:true},
        {id:"gc2",text:"Проверить порядок и чистоту во всех рабочих зонах",required:true},
        {id:"gc3",text:"Проверить выключение оборудования, которое не должно работать после закрытия",required:true},
        {id:"gc4",text:"Сверить доступный отчёт по выручке за день",required:true},
        {id:"gc5",text:"Зафиксировать неисправности, дефицит расходников и задачи на завтра",required:true},
        {id:"gc6",text:"Убедиться, что точка закрыта по внутреннему регламенту",required:true}
      ]
    },
    {
      id:"manager-weekly",title:"Еженедельный контроль управляющего",description:"Проверка команды, графика, запасов и состояния точки.",
      role:"manager",frequency:"weekly",locationIds:["sokol","gryazovets","sheksna"],active:true,
      items:[
        {id:"gw1",text:"Сформировать и проверить график мастеров на следующую неделю",required:true},
        {id:"gw2",text:"Проверить выручку, клиентов, средний чек и ФОТ по мастерам",required:true},
        {id:"gw3",text:"Проверить остатки расходников и план закупок",required:true},
        {id:"gw4",text:"Проверить состояние оборудования, мебели и рабочих мест",required:true},
        {id:"gw5",text:"Разобрать отзывы клиентов и повторяющиеся проблемы",required:true},
        {id:"gw6",text:"Передать владельцу критичные вопросы, расходы и решения, требующие согласования",required:true}
      ]
    }
  ],
  checklistCompletions: []
};

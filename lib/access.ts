import { AppState, AppUser, UserRole } from "./types";

export const roleLabels: Record<UserRole,string> = {
  owner: "Владелец",
  manager: "Управляющий",
  master: "Мастер"
};

export const roleDescriptions: Record<UserRole,string> = {
  owner: "Полный доступ ко всей сети, капиталу, чистой прибыли, фондам и развитию.",
  manager: "Операционное управление назначенными точками без капитала и чистой прибыли владельца.",
  master: "Только личный график, клиенты, выручка, начисления и рабочая статистика."
};

export const navByRole: Record<UserRole,string[]> = {
  owner:["overview","calendar","actuals","notifications","locations","finance","scenarios","staff","schedule","checklists","funds","openings","payments","dossier","access","settings"],
  manager:["overview","staff","schedule","checklists","openings"],
  master:["overview","checklists"]
};

export function scopedState(state:AppState,user:AppUser):AppState {
  if(user.role==="owner") return state;
  const allowed=new Set(user.locationIds);
  const locations=state.locations.filter(l=>allowed.has(l.id));
  const employeeIds=new Set(state.employees.filter(e=>allowed.has(e.locationId)).map(e=>e.id));

  if(user.role==="manager"){
    return {
      ...state,
      locations,
      employees:state.employees.filter(e=>allowed.has(e.locationId)),
      funds:state.funds.filter(f=>!f.locationId || allowed.has(f.locationId)),
      openingTasks:state.openingTasks.filter(t=>allowed.has(t.locationId)),
      actuals:state.actuals.filter(a=>allowed.has(a.locationId)),
      shifts:state.shifts.filter(s=>allowed.has(s.locationId)),
      users:state.users.filter(u=>u.role==="master" && u.locationIds.some(id=>allowed.has(id))),
      checklistTemplates:state.checklistTemplates.filter(t=>t.locationIds.some(id=>allowed.has(id))),
      checklistCompletions:state.checklistCompletions.filter(c=>allowed.has(c.locationId))
    };
  }

  const ownEmployee=user.employeeId;
  return {
    ...state,
    locations,
    employees:state.employees.filter(e=>e.id===ownEmployee),
    funds:[],
    scenarios:[],
    openingTasks:[],
    actuals:[],
    privateNotes:[],
    shifts:state.shifts.filter(s=>s.employeeId===ownEmployee),
    users:[user],
    checklistTemplates:state.checklistTemplates.filter(t=>t.role==="master"&&t.locationIds.some(id=>allowed.has(id))),
    checklistCompletions:state.checklistCompletions.filter(c=>c.userId===user.id)
  };
}

export function canSeeOwnerFinance(role:UserRole){
  return role==="owner";
}

export function canEditOperations(role:UserRole){
  return role==="owner" || role==="manager";
}

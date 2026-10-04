import { Location, Employee, ActualMonth } from "./types";

export const money = (n:number) => new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
export const num = (n:number) => new Intl.NumberFormat("ru-RU",{maximumFractionDigits:1}).format(Number.isFinite(n)?n:0);

export function weightedStaffPct(l: Location) {
  const totalShare=l.services.reduce((s,x)=>s+x.sharePct,0);
  if(totalShare<=0) return l.staffPct;
  return l.services.reduce((s,x)=>s+x.sharePct*x.masterPct,0)/totalShare;
}

export function estimatedProcedures(l: Location) {
  return l.services.reduce((sum,s)=>{
    const revenue=l.revenue*s.sharePct/100;
    return sum+(s.price>0?revenue/s.price:0);
  },0);
}

export function locationPnl(l: Location) {
  const staffPct=weightedStaffPct(l);
  const staff = l.revenue * staffPct / 100;
  const employerRate = l.officialEmployment ? (l.employerInsurancePct+l.vacationReservePct+l.sickReservePct)/100 : 0;
  const employerCosts = staff * employerRate;
  const materials = l.revenue * l.materialsPct / 100;
  const acquiring = l.revenue * l.acquiringPct / 100;
  const fixedOpex = l.rent + l.accounting + l.internet + l.cleaning + l.software + l.marketing;
  const reserves = l.depreciationFund + l.cultureFund;
  const fixed = fixedOpex + reserves;
  const operating = l.revenue - staff - employerCosts - materials - acquiring - fixed;
  const tax = Math.max(l.revenue * 0.01, Math.max(0, operating) * l.taxPct / 100);
  const net = operating - tax;
  const installment = l.installmentBalance>0 ? Math.min(l.installmentMonthly,l.installmentBalance) : 0;
  const freeCash = net - installment;
  const variableRate = (staffPct + l.materialsPct + l.acquiringPct)/100 + (staffPct/100)*employerRate;
  const contribution = 1 - variableRate;
  const breakEvenRevenue = contribution > 0 ? fixed / contribution : Infinity;
  const procedures=estimatedProcedures(l);
  const avgCheck=procedures>0?l.revenue/procedures:0;
  return {
    staffPct,staff,employerCosts,materials,acquiring,fixedOpex,reserves,fixed,
    operating,tax,net,installment,freeCash,breakEvenRevenue,
    margin:l.revenue?net/l.revenue*100:0,procedures,avgCheck
  };
}

export function employeeCost(e: Employee) {
  const salary = e.revenue * e.percent/100 + e.fixed;
  const insurance = e.official ? salary * e.insurancePct/100 : 0;
  const vacation = e.official ? salary * e.vacationPct/100 : 0;
  const sick = e.official ? salary * e.sickPct/100 : 0;
  return {salary,insurance,vacation,sick,total:salary+insurance+vacation+sick};
}

export function actualNet(a: ActualMonth) {
  return a.revenue-a.payroll-a.employerCosts-a.materials-a.acquiring-a.rent-a.marketing-a.other-a.tax;
}

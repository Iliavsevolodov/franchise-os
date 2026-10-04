import { Location, Employee } from "./types";

export const money = (n:number) => new Intl.NumberFormat("ru-RU",{style:"currency",currency:"RUB",maximumFractionDigits:0}).format(n);
export const num = (n:number) => new Intl.NumberFormat("ru-RU",{maximumFractionDigits:1}).format(n);

export function locationPnl(l: Location) {
  const staff = l.revenue * l.staffPct / 100;
  const materials = l.revenue * l.materialsPct / 100;
  const acquiring = l.revenue * l.acquiringPct / 100;
  const fixed = l.rent + l.accounting + l.internet + l.cleaning + l.software + l.marketing + l.depreciationFund + l.cultureFund;
  const operating = l.revenue - staff - materials - acquiring - fixed;
  const tax = Math.max(l.revenue * 0.01, Math.max(0, operating) * l.taxPct / 100);
  const net = operating - tax;
  const contribution = 1 - (l.staffPct + l.materialsPct + l.acquiringPct)/100;
  const breakEvenRevenue = contribution > 0 ? fixed / contribution : Infinity;
  return {staff,materials,acquiring,fixed,operating,tax,net,breakEvenRevenue,margin:l.revenue?net/l.revenue*100:0};
}

export function employeeCost(e: Employee) {
  const salary = e.revenue * e.percent/100 + e.fixed;
  const insurance = e.official ? salary * e.insurancePct/100 : 0;
  const vacation = e.official ? salary * e.vacationPct/100 : 0;
  const sick = e.official ? salary * e.sickPct/100 : 0;
  return {salary,insurance,vacation,sick,total:salary+insurance+vacation+sick};
}

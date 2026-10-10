import { views } from "./views/index.js";

const ROUTES = {
  dashboard: { title: "Dashboard", view: views.dashboardView },
  workforce: { title: "Workforce planning", view: views.workforceView },
  recruitment: { title: "Recruitment", view: views.recruitmentView },
  onboarding: { title: "Onboarding", view: views.onboardingView },
  employees: { title: "Employees", view: views.employeesView },
  leave: { title: "Leave automation", view: views.leaveView },
  attendance: { title: "Time and attendance", view: views.attendanceView },
  payroll: { title: "Payroll", view: views.payrollView },
  performance: { title: "Performance", view: views.performanceView },
  compensation: { title: "Compensation", view: views.compensationView },
  relations: { title: "Relations and compliance", view: views.relationsView },
  reports: { title: "Reports", view: views.reportsView },
  admin: { title: "Administration", view: views.adminView },
};

function currentKey() {
  return window.location.hash.replace(/^#\/?/, "") || "dashboard";
}

export function initRouter(root) {
  function render() {
    const key = currentKey();
    const route = ROUTES[key] ?? ROUTES.dashboard;
    root.innerHTML = "";
    route.view(root);
    root.scrollTop = 0;
    document.title = `ouhrapp - ${route.title}`;
    document.dispatchEvent(new CustomEvent("route:change", { detail: { key } }));
  }

  window.addEventListener("hashchange", render);
  render();
}

import React, { useState } from "react";
import useMediaQuery from "../hooks/useMediaQuery.js";
import MobileDashboardTabs from "../components/MobileDashboardTabs.jsx";

export default function DashboardShell({ topBar, motor, center, metrics }) {
  const isDashboard = Boolean(motor || metrics);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const showMobileTabs = isDashboard && isMobile;
  const [activePanel, setActivePanel] = useState("kanban");

  const shellClass = `ux-dashboard text-slate-200 relative overflow-x-hidden min-h-screen${showMobileTabs ? " ux-dashboard--mobile" : ""}`;

  const panelClass = (panel) => {
    if (!showMobileTabs) return "";
    return activePanel === panel ? "" : " dashboard-panel--hidden";
  };

  return (
    <div className={shellClass}>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 18% 8%, hsla(215,48%,14%,1) 0%, transparent 52%), radial-gradient(ellipse at 82% 6%, hsla(210,52%,10%,1) 0%, transparent 48%), radial-gradient(ellipse at 4% 62%, hsla(230,42%,12%,1) 0%, transparent 48%), radial-gradient(ellipse at 92% 58%, hsla(200,48%,10%,1) 0%, transparent 48%), radial-gradient(ellipse at 50% 100%, hsla(240,38%,8%,1) 0%, transparent 55%), #04071a",
        }}
        aria-hidden
      />
      <div
        className="bg-orb w-[700px] h-[700px] top-[-120px] left-[-100px] z-0"
        style={{ background: "radial-gradient(circle,#14b8a6,#06b6d4,transparent)" }}
        aria-hidden
      />
      <div
        className="bg-orb bg-orb-2 w-[500px] h-[500px] bottom-0 right-10 z-0"
        style={{ background: "radial-gradient(circle,#06b6d4,#0ea5e9,transparent)" }}
        aria-hidden
      />
      <div
        className="bg-orb bg-orb-3 w-96 h-96 top-1/2 left-1/2 z-0"
        style={{ background: "radial-gradient(circle,#8b5cf6,#6366f1,transparent)" }}
        aria-hidden
      />
      <div
        className="bg-orb bg-orb-4 w-[450px] h-[450px] top-1/3 right-1/3 z-0"
        style={{ background: "radial-gradient(circle,#6366f1,#818cf8,transparent)" }}
        aria-hidden
      />

      <div
        className="relative z-10 flex flex-col w-full"
        style={{ height: "100dvh", minHeight: 0 }}
      >
        <div className="dashboard-header-slot relative z-50 flex-shrink-0">
          {topBar}
        </div>
        <div
          className={`flex-1 flex gap-3 px-4 pb-3 overflow-hidden items-stretch relative z-0${isDashboard ? "" : " app-shell__content--full"}${showMobileTabs ? " dashboard-main-body--tabs" : ""}`}
          id="main-body"
          style={{ minHeight: 0 }}
        >
          {motor ? (
            <div className={`dashboard-panel--motor flex-shrink-0${panelClass("motor")}`}>
              {motor}
            </div>
          ) : null}
          <main
            className={`flex-1 flex flex-col overflow-hidden min-w-0 min-h-0${panelClass("kanban")}`}
            id={isDashboard ? "kanban-center" : "app-subpage-center"}
          >
            {center}
          </main>
          {metrics ? (
            <div className={`dashboard-panel--metrics flex-shrink-0${panelClass("metrics")}`}>
              {metrics}
            </div>
          ) : null}
        </div>
        {showMobileTabs ? (
          <MobileDashboardTabs activePanel={activePanel} onPanelChange={setActivePanel} />
        ) : null}
      </div>
    </div>
  );
}

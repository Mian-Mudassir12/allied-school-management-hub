export default function Slide6Access() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
      {/* Top accent bar */}
      <div className="w-full h-[0.6vh] bg-accent" />

      {/* Content area */}
      <div className="flex-1 flex flex-col px-[9vw] pt-[6vh] pb-[2vh]">
        {/* Action title */}
        <h2
          className="text-[2.5vw] font-bold text-primary leading-tight mb-[2vh]"
          style={{ textWrap: "balance" }}
        >
          Access the portal from any browser — no installation needed
        </h2>

        {/* Crimson rule */}
        <div className="w-full h-[0.2vh] bg-accent opacity-30 mb-[3.5vh]" />

        {/* Two-column layout */}
        <div className="flex gap-[5vw] flex-1">
          {/* Left column — How to open */}
          <div className="flex-1">
            <p className="text-[1.7vw] font-bold text-muted uppercase tracking-widest mb-[2.5vh]">
              How to open
            </p>

            <div className="flex items-start gap-[1.5vw] mb-[2.5vh]">
              <div className="shrink-0 w-[3vw] h-[3vw] rounded-full bg-accent flex items-center justify-center">
                <span className="text-[1.5vw] font-bold text-bg">1</span>
              </div>
              <div className="pt-[0.3vh]">
                <p className="text-[2vw] text-primary font-bold leading-tight">Open the portal URL</p>
                <p className="text-[1.7vw] text-muted mt-[0.5vh]">Works on Chrome, Safari, or any browser</p>
              </div>
            </div>

            <div className="flex items-start gap-[1.5vw] mb-[2.5vh]">
              <div className="shrink-0 w-[3vw] h-[3vw] rounded-full bg-accent flex items-center justify-center">
                <span className="text-[1.5vw] font-bold text-bg">2</span>
              </div>
              <div className="pt-[0.3vh]">
                <p className="text-[2vw] text-primary font-bold leading-tight">Enter username and password</p>
                <p className="text-[1.7vw] text-muted mt-[0.5vh]">Provided by the Administrator</p>
              </div>
            </div>

            <div className="flex items-start gap-[1.5vw]">
              <div className="shrink-0 w-[3vw] h-[3vw] rounded-full bg-accent flex items-center justify-center">
                <span className="text-[1.5vw] font-bold text-bg">3</span>
              </div>
              <div className="pt-[0.3vh]">
                <p className="text-[2vw] text-primary font-bold leading-tight">Use the system</p>
                <p className="text-[1.7vw] text-muted mt-[0.5vh]">Dashboard, fees, attendance — all in one place</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-[0.15vw] bg-muted opacity-20 self-stretch" />

          {/* Right column — Who can access */}
          <div className="flex-1">
            <p className="text-[1.7vw] font-bold text-muted uppercase tracking-widest mb-[2.5vh]">
              Who can access
            </p>

            <div className="mb-[2.2vh]">
              <p className="text-[2vw] font-bold text-accent">Director / Principal</p>
              <p className="text-[1.8vw] text-muted mt-[0.4vh]">Full access — all modules and reports</p>
            </div>

            <div className="mb-[2.2vh]">
              <p className="text-[2vw] font-bold text-accent">Admin Staff</p>
              <p className="text-[1.8vw] text-muted mt-[0.4vh]">Manage students, fees, and attendance</p>
            </div>

            <div className="mb-[2.2vh]">
              <p className="text-[2vw] font-bold text-accent">Parents</p>
              <p className="text-[1.8vw] text-muted mt-[0.4vh]">No login — enter child's roll number in Parent Portal</p>
            </div>

            <div className="mt-[3vh] bg-table-head rounded-sm px-[1.5vw] py-[1.5vh]">
              <p className="text-[1.6vw] text-primary leading-snug">
                Works on mobile, tablet, and desktop — from school or home
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">6 / 6</span>
      </div>
    </div>
  );
}

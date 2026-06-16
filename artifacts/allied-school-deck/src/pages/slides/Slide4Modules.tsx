export default function Slide4Modules() {
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
          Six modules cover the complete administrative workflow
        </h2>

        {/* Crimson rule under title */}
        <div className="w-full h-[0.2vh] bg-accent opacity-30 mb-[3vh]" />

        {/* Table */}
        <div className="flex-1 flex flex-col">
          {/* Header row */}
          <div className="flex w-full bg-table-head">
            <div className="w-[28%] px-[1.5vw] py-[1.4vh] text-[1.8vw] font-bold text-primary">
              Module
            </div>
            <div className="w-[72%] px-[1.5vw] py-[1.4vh] text-[1.8vw] font-bold text-primary border-l border-muted border-opacity-20">
              Function
            </div>
          </div>

          {/* Row 1 */}
          <div className="flex w-full border-t border-muted border-opacity-20">
            <div className="w-[28%] px-[1.5vw] py-[1.3vh] text-[1.9vw] font-bold text-accent">
              Dashboard
            </div>
            <div className="w-[72%] px-[1.5vw] py-[1.3vh] text-[1.9vw] text-primary border-l border-muted border-opacity-20">
              Real-time totals: students enrolled, fees collected vs. pending, today's attendance
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex w-full border-t border-muted border-opacity-20 bg-table-head bg-opacity-50">
            <div className="w-[28%] px-[1.5vw] py-[1.3vh] text-[1.9vw] font-bold text-accent">
              Class-wise Fees
            </div>
            <div className="w-[72%] px-[1.5vw] py-[1.3vh] text-[1.9vw] text-primary border-l border-muted border-opacity-20">
              Mark students paid or unpaid per month with a single click
            </div>
          </div>

          {/* Row 3 */}
          <div className="flex w-full border-t border-muted border-opacity-20">
            <div className="w-[28%] px-[1.5vw] py-[1.3vh] text-[1.9vw] font-bold text-accent">
              Student Registry
            </div>
            <div className="w-[72%] px-[1.5vw] py-[1.3vh] text-[1.9vw] text-primary border-l border-muted border-opacity-20">
              New admission form and search by name or roll number
            </div>
          </div>

          {/* Row 4 */}
          <div className="flex w-full border-t border-muted border-opacity-20 bg-table-head bg-opacity-50">
            <div className="w-[28%] px-[1.5vw] py-[1.3vh] text-[1.9vw] font-bold text-accent">
              Attendance
            </div>
            <div className="w-[72%] px-[1.5vw] py-[1.3vh] text-[1.9vw] text-primary border-l border-muted border-opacity-20">
              Daily class-wise present/absent marking with summary counts
            </div>
          </div>

          {/* Row 5 */}
          <div className="flex w-full border-t border-muted border-opacity-20">
            <div className="w-[28%] px-[1.5vw] py-[1.3vh] text-[1.9vw] font-bold text-accent">
              Announcements
            </div>
            <div className="w-[72%] px-[1.5vw] py-[1.3vh] text-[1.9vw] text-primary border-l border-muted border-opacity-20">
              Targeted notices sent to admin staff or parents
            </div>
          </div>

          {/* Row 6 */}
          <div className="flex w-full border-t border-b border-muted border-opacity-20 bg-table-head bg-opacity-50">
            <div className="w-[28%] px-[1.5vw] py-[1.3vh] text-[1.9vw] font-bold text-accent">
              Parent Portal
            </div>
            <div className="w-[72%] px-[1.5vw] py-[1.3vh] text-[1.9vw] text-primary border-l border-muted border-opacity-20">
              Parents check their child's fees, attendance, and school notices by roll number
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">4 / 5</span>
      </div>
    </div>
  );
}

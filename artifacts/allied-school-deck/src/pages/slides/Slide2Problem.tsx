export default function Slide2Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
      {/* Top accent bar */}
      <div className="w-full h-[0.6vh] bg-accent" />

      {/* Content area */}
      <div className="flex-1 flex flex-col px-[9vw] pt-[7vh] pb-[2vh]">
        {/* Action title */}
        <h2
          className="text-[2.5vw] font-bold text-primary leading-tight mb-[2vh]"
          style={{ textWrap: "balance" }}
        >
          Student and fee records were managed manually, creating errors and collection delays
        </h2>

        {/* Crimson rule under title */}
        <div className="w-full h-[0.2vh] bg-accent opacity-30 mb-[4vh]" />

        {/* Bullets */}
        <div className="flex flex-col gap-[3vh] flex-1">
          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              Fees tracked in paper registers — collections lagged 1–2 weeks behind the due date
            </p>
          </div>

          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              Attendance marked per class in physical books, with no central summary view
            </p>
          </div>

          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              Student admissions stored in physical files, no way to search by name or roll number
            </p>
          </div>

          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              Parents had no visibility into fee status or daily attendance
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">2 / 5</span>
      </div>
    </div>
  );
}

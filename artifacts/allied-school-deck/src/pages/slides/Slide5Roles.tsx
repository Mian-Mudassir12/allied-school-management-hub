export default function Slide5Roles() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
      {/* Top accent bar */}
      <div className="w-full h-[0.6vh] bg-accent" />

      {/* Content area */}
      <div className="flex-1 flex flex-col px-[9vw] pt-[6vh] pb-[2vh]">
        {/* Title */}
        <h2 className="text-[2.5vw] font-bold text-primary leading-tight mb-[2vh]" style={{ textWrap: "balance" }}>
          Three roles — one Admin controls data, two Directors review it
        </h2>
        <div className="w-full h-[0.2vh] bg-accent opacity-30 mb-[3.5vh]" />

        {/* Role cards */}
        <div className="flex gap-[3vw] flex-1 items-start">

          {/* Admin */}
          <div className="flex-1 border-t-[0.5vh] border-accent pt-[2.5vh]">
            <p className="text-[2.2vw] font-bold text-accent mb-[1.5vh]">Admin</p>
            <p className="text-[1.7vw] text-muted mb-[2.5vh]">Username: <span className="text-primary font-bold">admin</span></p>
            <div className="flex flex-col gap-[1.4vh]">
              {[
                "Add, edit, and delete students",
                "Mark fees paid / unpaid",
                "Mark attendance present / absent",
                "Generate monthly fee slips",
                "Post announcements",
                "Reset passwords for any account",
                "Download or restore full backup",
              ].map((item) => (
                <div key={item} className="flex items-start gap-[1vw]">
                  <div className="mt-[0.6vh] w-[0.45vw] h-[0.45vw] rounded-full bg-accent shrink-0" />
                  <p className="text-[1.75vw] text-primary leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-[0.15vw] bg-muted opacity-20 self-stretch" />

          {/* Director */}
          <div className="flex-1 border-t-[0.5vh] border-muted border-opacity-40 pt-[2.5vh]">
            <p className="text-[2.2vw] font-bold text-primary mb-[1.5vh]">Director</p>
            <p className="text-[1.7vw] text-muted mb-[2.5vh]">Username: <span className="text-primary font-bold">director</span></p>
            <div className="flex flex-col gap-[1.4vh]">
              {[
                "View all students (read-only)",
                "View fee status per class",
                "View daily attendance reports",
                "Read all announcements",
                "Access parent portal link",
                "Change own password only",
              ].map((item) => (
                <div key={item} className="flex items-start gap-[1vw]">
                  <div className="mt-[0.6vh] w-[0.45vw] h-[0.45vw] rounded-full bg-muted opacity-50 shrink-0" />
                  <p className="text-[1.75vw] text-primary leading-snug opacity-70">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-[0.15vw] bg-muted opacity-20 self-stretch" />

          {/* Principal */}
          <div className="flex-1 border-t-[0.5vh] border-muted border-opacity-40 pt-[2.5vh]">
            <p className="text-[2.2vw] font-bold text-primary mb-[1.5vh]">Principal</p>
            <p className="text-[1.7vw] text-muted mb-[2.5vh]">Username: <span className="text-primary font-bold">principal</span></p>
            <div className="flex flex-col gap-[1.4vh]">
              {[
                "View all students (read-only)",
                "View fee status per class",
                "View daily attendance reports",
                "Read all announcements",
                "Access parent portal link",
                "Change own password only",
              ].map((item) => (
                <div key={item} className="flex items-start gap-[1vw]">
                  <div className="mt-[0.6vh] w-[0.45vw] h-[0.45vw] rounded-full bg-muted opacity-50 shrink-0" />
                  <p className="text-[1.75vw] text-primary leading-snug opacity-70">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">5 / 7</span>
      </div>
    </div>
  );
}

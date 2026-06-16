export default function Slide3Solution() {
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
          A browser-based portal gives the Director real-time control from any device
        </h2>

        {/* Crimson rule under title */}
        <div className="w-full h-[0.2vh] bg-accent opacity-30 mb-[4vh]" />

        {/* Bullets */}
        <div className="flex flex-col gap-[3vh] flex-1">
          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              Accessible from mobile or desktop — no software installation required
            </p>
          </div>

          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              Three admin roles (Admin, Director, Principal) with password management built in
            </p>
          </div>

          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              All data stored in PostgreSQL — changes are instant and persistent
            </p>
          </div>

          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.5vh] w-[0.5vw] h-[0.5vw] rounded-full bg-accent shrink-0" />
            <p className="text-[2.1vw] text-primary leading-snug">
              Parent portal allows families to view progress by roll number without a login account
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">3 / 5</span>
      </div>
    </div>
  );
}

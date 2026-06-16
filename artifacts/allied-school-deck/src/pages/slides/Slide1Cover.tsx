import schoolLogo from "@assets/image_1781358894878.png";

export default function Slide1Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
      {/* Top accent bar */}
      <div className="w-full h-[0.6vh] bg-accent" />

      {/* Main content — left-aligned, vertically centered */}
      <div className="flex-1 flex flex-col justify-center px-[9vw] pb-[4vh]">
        {/* Logo + school name row */}
        <div className="flex items-center gap-[2vw] mb-[5vh]">
          <img
            src={schoolLogo}
            alt="Allied School Logo"
            crossOrigin="anonymous"
            className="h-[10vh] w-auto object-contain"
          />
          <div className="h-[7vh] w-[0.15vw] bg-muted opacity-40" />
          <div>
            <p className="text-[1.6vw] font-bold text-primary tracking-wide leading-tight">ALLIED SCHOOL</p>
            <p className="text-[1.3vw] text-muted leading-tight mt-[0.4vh]">Rehman Campus · 4GD</p>
          </div>
        </div>

        {/* Crimson rule */}
        <div className="w-[6vw] h-[0.35vh] bg-accent mb-[3.5vh]" />

        {/* Main title */}
        <h1
          className="text-[5.5vw] font-bold text-primary leading-none tracking-tight mb-[2vh]"
          style={{ textWrap: "balance" }}
        >
          Management System
        </h1>

        {/* Subtitle */}
        <p className="text-[2.2vw] text-primary font-normal leading-snug mb-[5vh]">
          Rehman Campus Administration Portal
        </p>

        {/* Metadata row */}
        <div className="flex items-center gap-[3vw]">
          <span className="text-[1.6vw] text-muted">June 2026</span>
          <span className="text-muted opacity-40 text-[1.6vw]">·</span>
          <span className="text-[1.6vw] text-muted">Internal — Administration</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">1 / 5</span>
      </div>
    </div>
  );
}

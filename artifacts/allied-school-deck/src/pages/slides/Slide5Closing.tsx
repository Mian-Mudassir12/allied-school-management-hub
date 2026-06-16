import schoolLogo from "@assets/image_1781358894878.png";

export default function Slide5Closing() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
      {/* Top accent bar */}
      <div className="w-full h-[0.6vh] bg-accent" />

      {/* Main content — vertically centered */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-[9vw] pb-[4vh]">
        <img
          src={schoolLogo}
          alt="Allied School Logo"
          crossOrigin="anonymous"
          className="h-[14vh] w-auto object-contain mb-[4vh]"
        />

        {/* Crimson rule */}
        <div className="w-[5vw] h-[0.35vh] bg-accent mb-[3.5vh]" />

        <h2 className="text-[3.8vw] font-bold text-primary leading-tight tracking-tight mb-[1.5vh]">
          Allied School Rehman Campus
        </h2>

        <p className="text-[2.4vw] text-primary font-normal mb-[4vh]">
          Management System
        </p>

        <p className="text-[1.8vw] text-muted mb-[1.5vh]">
          Rehman Campus 4GD  ·  Growing Together
        </p>

        <p className="text-[1.5vw] text-muted opacity-70">
          Built on React, Node.js, and PostgreSQL
        </p>
      </div>

      {/* Bottom bar */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">5 / 5</span>
      </div>
    </div>
  );
}

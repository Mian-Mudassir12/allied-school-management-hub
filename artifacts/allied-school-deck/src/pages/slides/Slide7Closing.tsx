import schoolLogo from "@assets/image_1781358894878.png";

export default function Slide7Closing() {
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
          Management System — Ready for Immediate Use
        </p>

        <p className="text-[1.8vw] text-muted mb-[1.5vh]">
          Renala Khurd · 4GD · Growing Together
        </p>

        {/* Demo credentials box */}
        <div className="mt-[3vh] bg-table-head rounded-sm px-[4vw] py-[2vh] flex gap-[5vw]">
          <div>
            <p className="text-[1.5vw] text-muted mb-[0.5vh]">Admin login</p>
            <p className="text-[1.7vw] font-bold text-primary">admin / allied2024</p>
          </div>
          <div className="w-[0.15vw] bg-muted opacity-30" />
          <div>
            <p className="text-[1.5vw] text-muted mb-[0.5vh]">Director login</p>
            <p className="text-[1.7vw] font-bold text-primary">director / director2024</p>
          </div>
          <div className="w-[0.15vw] bg-muted opacity-30" />
          <div>
            <p className="text-[1.5vw] text-muted mb-[0.5vh]">Principal login</p>
            <p className="text-[1.7vw] font-bold text-primary">principal / principal2024</p>
          </div>
        </div>

        <p className="text-[1.4vw] text-muted opacity-60 mt-[3vh]">
          Built on React · Node.js · PostgreSQL
        </p>
      </div>

      {/* Bottom bar */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">7 / 7</span>
      </div>
    </div>
  );
}

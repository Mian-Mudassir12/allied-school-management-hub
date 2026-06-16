export default function Slide6Hosting() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
      {/* Top accent bar */}
      <div className="w-full h-[0.6vh] bg-accent" />

      {/* Content area */}
      <div className="flex-1 flex flex-col px-[9vw] pt-[6vh] pb-[2vh]">
        {/* Title */}
        <h2 className="text-[2.5vw] font-bold text-primary leading-tight mb-[2vh]" style={{ textWrap: "balance" }}>
          Three ways to run the system — choose what fits your school
        </h2>
        <div className="w-full h-[0.2vh] bg-accent opacity-30 mb-[3.5vh]" />

        {/* Three hosting options */}
        <div className="flex gap-[3vw] flex-1 items-start">

          {/* Option 1 — School Computer */}
          <div className="flex-1 bg-table-head rounded-sm px-[1.8vw] pt-[2.5vh] pb-[2vh] flex flex-col gap-[1.2vh]">
            <div className="flex items-center gap-[1vw] mb-[0.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-[1.4vw] font-bold text-bg">1</span>
              </div>
              <p className="text-[2vw] font-bold text-primary">School Computer</p>
            </div>
            <p className="text-[1.6vw] font-bold text-accent">Rs. 0 / month</p>
            <p className="text-[1.6vw] text-muted leading-snug">
              Run on one school PC — all staff connect via school WiFi or LAN cable
            </p>
            <div className="mt-[1.5vh] flex flex-col gap-[1vh]">
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">No monthly cost</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">Works without internet</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-yellow-600 font-bold shrink-0">—</span>
                <p className="text-[1.5vw] text-primary">That PC must stay on during school hours</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-yellow-600 font-bold shrink-0">—</span>
                <p className="text-[1.5vw] text-primary">Not accessible from outside school</p>
              </div>
            </div>
          </div>

          {/* Option 2 — Cloud Hosting */}
          <div className="flex-1 bg-table-head rounded-sm px-[1.8vw] pt-[2.5vh] pb-[2vh] flex flex-col gap-[1.2vh]">
            <div className="flex items-center gap-[1vw] mb-[0.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[1.4vw] font-bold text-bg">2</span>
              </div>
              <p className="text-[2vw] font-bold text-primary">Cloud Server</p>
            </div>
            <p className="text-[1.6vw] font-bold text-accent">Rs. 1,500–4,000 / month</p>
            <p className="text-[1.6vw] text-muted leading-snug">
              Hosted on internet server — anyone opens it from phone or laptop, anywhere
            </p>
            <div className="mt-[1.5vh] flex flex-col gap-[1vh]">
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">Works 24/7 without any school PC</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">Accessible from home or anywhere</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">Data safe even if school PC lost</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-yellow-600 font-bold shrink-0">—</span>
                <p className="text-[1.5vw] text-primary">Monthly subscription cost</p>
              </div>
            </div>
          </div>

          {/* Option 3 — Replit Free (Current) */}
          <div className="flex-1 border-[0.15vw] border-accent rounded-sm px-[1.8vw] pt-[2.5vh] pb-[2vh] flex flex-col gap-[1.2vh] relative">
            <div className="absolute top-[-1.4vh] left-[1.5vw] bg-accent px-[1vw] py-[0.3vh] rounded-sm">
              <span className="text-[1.2vw] font-bold text-bg">CURRENT SETUP</span>
            </div>
            <div className="flex items-center gap-[1vw] mb-[0.5vh] mt-[1vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-[1.4vw] font-bold text-bg">3</span>
              </div>
              <p className="text-[2vw] font-bold text-primary">Replit Platform</p>
            </div>
            <p className="text-[1.6vw] font-bold text-accent">Free (demo) · Rs. 800/month (always on)</p>
            <p className="text-[1.6vw] text-muted leading-snug">
              Already live — accessible from any phone by visiting the school link
            </p>
            <div className="mt-[1.5vh] flex flex-col gap-[1vh]">
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">Already deployed and working today</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">Open from any device, no installation</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-green-600 font-bold shrink-0">✓</span>
                <p className="text-[1.5vw] text-primary">Free for demo — upgrade anytime</p>
              </div>
              <div className="flex items-start gap-[0.8vw]">
                <span className="text-[1.5vw] text-yellow-600 font-bold shrink-0">—</span>
                <p className="text-[1.5vw] text-primary">Free version may sleep when unused</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[9vw] pb-[3.5vh] flex items-center justify-between">
        <span className="text-[1.3vw] text-muted">Allied School Rehman Campus Management System</span>
        <span className="text-[1.3vw] text-muted">6 / 7</span>
      </div>
    </div>
  );
}

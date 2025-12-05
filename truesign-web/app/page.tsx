import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-blue-500 selection:text-white">

      {/* NAV */}
      <nav className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          {/* YOUR LOGO IS HERE NOW */}
          <div className="relative w-8 h-8">
            <Image 
              src="/truesign_tick.png" 
              alt="TrueSign Logo" 
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-xl tracking-tight">TrueSign</span>
        </div>
        <Link href="#download" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Beta Access
        </Link>
      </nav>

      {/* HERO SECTION */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-300 tracking-wide">LIVE BETA</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            The Anti-AI Camera.
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Deepfakes are everywhere. TrueSign uses the <span className="text-white font-semibold">Secure Enclave</span> in your phone to cryptographically sign photos at the moment of capture.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4" id="download">
            {/* DOWNLOAD BUTTON */}
            <Link
              href="https://drive.google.com/file/d/1HKvshguik43OrHmR6V70H_z3LBRFyWdx/view?usp=sharing"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-900/20 w-full sm:w-auto"
            >
              Download Beta (Android)
            </Link>
            {/* VERIFY BUTTON */}
            <Link
              href="/verify/proof_EXAMPLE.jpg" 
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full backdrop-blur-sm border border-white/10 transition-all w-full sm:w-auto"
            >
              See Verified Proof
            </Link>
          </div>

          <p className="mt-8 text-xs text-gray-600 uppercase tracking-widest">
            No Login • No Cloud • Pure Math
          </p>
        </div>
      </div>
    </main>
  );
}
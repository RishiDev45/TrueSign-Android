import { supabase } from "../../lib/supabase";

// This runs on the server. It grabs the ID from the URL and finds the photo.
export default async function VerifyPage({ params }: { params: Promise<{ filename: string }> }) {
  const resolvedParams = await params;
  const { filename } = resolvedParams;

  // 1. Get the Public URL from Supabase Storage
  const { data } = supabase.storage
    .from('evidence')
    .getPublicUrl(filename);

  const imageUrl = data.publicUrl;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans">
      
      {/* HEADER */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          {/* Simple Shield Icon */}
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <span className="text-white font-bold text-xl tracking-wide">TrueSign</span>
      </div>

      {/* THE EVIDENCE CARD */}
      <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/50 border border-gray-800 bg-gray-900">
        
        {/* The Photo */}
        <div className="relative w-full h-full">
           <img 
             src={imageUrl} 
             alt="Verified Evidence" 
             className="w-full h-full object-cover"
           />
        </div>

        {/* THE "VERIFIED" OVERLAY */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pt-24">
          <div className="flex items-center gap-3">
            <div className="relative">
                <div className="absolute -inset-1 bg-blue-500 rounded-full blur opacity-75 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">Authentic Media</h1>
              <p className="text-gray-400 text-xs font-mono mt-1">ID: {filename.slice(0, 18)}...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { ChevronDown, Clock3, MoreHorizontal, Plus } from "lucide-react";

export default function Aptouvals() {
  return (
    <div className="w-full min-h-screen bg-[#f5f5f5] border border-gray-200">
      <div className="h-[68px] px-6 border-b border-gray-200 bg-white flex items-center justify-between">
        <button className="flex items-center gap-1.5 leading-none font-medium text-[#111827]">
          <span className="text-[14px] md:text-[32px] font-medium">All Approval</span>
          <ChevronDown size={18} className="text-[#2563eb] mt-1" />
        </button>

        <div className="flex items-center gap-3">
          <button className="h-9 px-4 rounded-md border border-gray-300 bg-[#f8f8f8] text-[14px] md:text-[24px] text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-2">
            <Clock3 size={18} />
            <span>Start</span>
          </button>

          <div className="h-9 rounded-md overflow-hidden flex border border-[#22b573]">
            <button className="h-full px-4 bg-[#22b573] text-white hover:bg-[#1ca363] transition-colors flex items-center gap-2">
              <Plus size={18} />
              <span className="font-medium">New</span>
            </button>
            <button className="h-full w-8 bg-[#22b573] text-white border-l border-white/30 hover:bg-[#1ca363] transition-colors flex items-center justify-center">
              <ChevronDown size={15} />
            </button>
          </div>

          <button className="h-9 w-9 rounded-md border border-gray-300 bg-[#f8f8f8] hover:bg-gray-100 transition-colors flex items-center justify-center">
            <MoreHorizontal size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      <div className="h-[66px] px-6 border-b border-gray-200 bg-white flex items-center gap-6">
        <span className="text-[12px] md:text-[26px] font-semibold tracking-wide text-[#64748b]">VIEW BY:</span>
        <button className="flex items-center gap-2 text-[14px] md:text-[30px] text-[#1f2937]">
          <span>All Approval</span>
          <ChevronDown size={20} className="text-[#6b7280] mt-1" />
        </button>
      </div>

      <div className="px-4 py-8 md:py-16">
        <div className="mx-auto mt-10 md:mt-16 max-w-4xl text-center">
          <h1 className="text-xl md:text-[42px] leading-tight font-medium text-[#111827]">
            Get time entries approved by managers
          </h1>
          <p className="mt-4 text-sm md:text-[30px] text-[#64748b]">
            Create Approvals with time entries and send them to your{" "}
            <span className="text-[#4b6285]">project manager.</span>
          </p>

          <button className="mt-8 md:mt-10 h-11 md:h-14 px-8 md:px-14 rounded-md bg-[#22b573] hover:bg-[#1ca363] transition-colors text-white text-xs md:text-[22px] font-semibold tracking-wide">
            CREATE APPROVAL
          </button>
        </div>
      </div>
    </div>
  );
}

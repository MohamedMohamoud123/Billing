import React from 'react';
import { 
  ChevronDown, 
  Plus, 
  Clock, 
  MoreHorizontal, 
  Users, 
  Calendar, 
  Mail, 
  CheckSquare, 
  FileText, 
  XCircle,
  CheckCircle2
} from 'lucide-react';

const CustomerApproval = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-700">
      {/* Top Header - Same as Approvals */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
        <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
          <h1 className="text-lg font-semibold text-slate-900">All Customer Approvals</h1>
          <ChevronDown size={16} className="text-blue-600 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-sm font-medium hover:bg-slate-50"><Clock size={14} /> Start</button>
          <div className="flex">
            <button className="flex items-center gap-1.5 bg-[#25b87e] text-white px-3 py-1.5 rounded-l text-sm font-medium"><Plus size={16} /> New</button>
            <button className="bg-[#25b87e] text-white px-1.5 py-1.5 rounded-r border-l border-[#1a8a5d]"><ChevronDown size={16} /></button>
          </div>
          <button className="p-1.5 border border-slate-300 rounded hover:bg-slate-50"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-6 py-4 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span>View By:</span>
        <button className="flex items-center gap-1 text-slate-400 capitalize bg-slate-50 border border-slate-200 px-2 py-1 rounded">
          <Users size={14} /> Select customer <ChevronDown size={14} />
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mt-20 px-4">
        <h2 className="text-2xl text-slate-800 mb-2">Get time entries approved by customers.</h2>
        <p className="text-slate-400 text-[15px] mb-8">
          Create customer approvals for time entries and send them to your customers for approval.
        </p>
        <button className="bg-[#25b87e] hover:bg-[#1f9d6b] text-white font-bold py-3 px-6 rounded uppercase text-sm tracking-wide transition-colors">
          Create Customer Approval
        </button>
      </div>

      {/* Lifecycle Flowchart */}
      <div className="max-w-5xl mx-auto mt-24 px-4">
        <h3 className="text-center text-slate-700 text-lg mb-16">Life cycle of a Customer Approval</h3>
        
        <div className="relative flex items-center justify-center gap-4 mb-20 overflow-x-auto py-10">
          <FlowStep icon={<Calendar className="text-blue-500" size={18} />} label="TIME ENTRIES" />
          <Arrow />
          <FlowStep icon={<Users className="text-green-500" size={18} />} label="CUSTOMER APPROVAL" />
          <Arrow />
          <FlowStep icon={<Mail className="text-purple-500" size={18} />} label="SENT TO CUSTOMER" />
          
          <div className="flex flex-col gap-8 ml-8">
            <FlowStep icon={<CheckSquare className="text-green-500" size={18} />} label="APPROVE" small />
            <FlowStep icon={<XCircle className="text-red-500" size={18} />} label="REJECT" small />
          </div>
          
          <div className="ml-8 self-start mt-[-10px]">
             <Arrow />
             <FlowStep icon={<FileText className="text-blue-400" size={18} />} label="INVOICE" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-16 max-w-2xl mx-auto">
          <h3 className="text-center text-slate-700 mb-8">In the Customer Approvals module, you can:</h3>
          <ul className="space-y-4 text-sm text-slate-600 ml-12">
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-blue-400" />
              Create and submit customer approvals for time entries.
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-blue-400" />
              Interact with your customers about time entries.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Helper Components for Flowchart
const FlowStep = ({ icon, label, small = false }: { icon: React.ReactNode, label: string, small?: boolean }) => (
  <div className={`flex items-center gap-2 border border-blue-400 rounded bg-white shadow-sm ${small ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
    {icon}
    <span className={`font-semibold text-slate-500 tracking-tighter ${small ? 'text-[10px]' : 'text-xs'}`}>{label}</span>
  </div>
);

const Arrow = () => (
  <div className="flex items-center">
    <div className="h-0.5 w-6 bg-blue-200 border-t border-dashed border-blue-400"></div>
    <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-blue-400"></div>
  </div>
);

export default CustomerApproval;
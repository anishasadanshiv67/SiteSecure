import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, ClipboardCheck, Wrench, ShieldAlert, XCircle } from 'lucide-react';

interface TimelineStep {
  label: string;
  status: string;
  icon: React.ReactNode;
  description: string;
}

interface IncidentTimelineProps {
  currentStatus: string;
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ currentStatus }) => {
  const steps: TimelineStep[] = [
    { 
      label: 'Reported', 
      status: 'reported', 
      icon: <Clock className="w-5 h-5" />,
      description: 'Hazard identified and reported by flagger'
    },
    { 
      label: 'Approved', 
      status: 'approved', 
      icon: <ShieldCheck className="w-5 h-5" />,
      description: 'Online verifier confirmed hazard validity'
    },
    { 
      label: 'Verified', 
      status: 'verified', 
      icon: <ClipboardCheck className="w-5 h-5" />,
      description: 'Ground staff verified location and severity'
    },
    { 
      label: 'Resolved', 
      status: 'resolved', 
      icon: <Wrench className="w-5 h-5" />,
      description: 'Repair team fixed the hazard'
    },
    { 
      label: 'Compliance', 
      status: 'compliance_review', 
      icon: <ShieldAlert className="w-5 h-5" />,
      description: 'Final safety inspection by officer'
    },
    { 
      label: 'Closed', 
      status: 'closed', 
      icon: <CheckCircle2 className="w-5 h-5" />,
      description: 'Hazard officially marked as safe'
    }
  ];

  const getStepStatus = (stepStatus: string, index: number) => {
    const statusOrder = ['reported', 'approved', 'verified', 'resolved', 'compliance_review', 'closed'];
    const currentIndex = statusOrder.indexOf(currentStatus === 'rejected' ? 'reported' : currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (currentStatus === 'rejected' && index === 1) return 'rejected';
    if (stepIndex < currentIndex || currentStatus === 'closed') return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="py-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/5" />
        
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const state = getStepStatus(step.status, index);
            
            return (
              <div key={step.label} className="flex flex-col items-center group relative z-10 w-32">
                {/* Icon Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  state === 'completed' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' :
                  state === 'active' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 scale-110' :
                  state === 'rejected' ? 'bg-rose-500 border-rose-400 text-white' :
                  'bg-slate-900 border-white/10 text-slate-600'
                }`}>
                  {state === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    state === 'active' ? 'text-white' : 
                    state === 'completed' ? 'text-emerald-400' : 
                    state === 'rejected' ? 'text-rose-400' :
                    'text-slate-600'
                  }`}>
                    {step.label}
                  </p>
                </div>

                {/* Tooltip-like description on hover */}
                <div className="absolute top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 border border-white/10 p-2 rounded-lg w-40 text-center shadow-2xl z-20">
                  <p className="text-[9px] text-slate-400 leading-tight">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IncidentTimeline;

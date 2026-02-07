
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Share2, 
  Search, 
  User,
  Dna,
  Stethoscope,
  Fingerprint,
  MapPin,
  Building2,
  ExternalLink,
  Info,
  Save,
  Mail,
  FileText,
  ChevronDown,
  Activity
} from 'lucide-react';
import type { MatchResultData } from '@/types';

interface ResultsScreenProps {
  results: MatchResultData;
  onBack: () => void;
}

type MobileTab = 'patient' | 'trials' | 'details';

const ResultsScreen: React.FC<ResultsScreenProps> = ({ results, onBack }) => {
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(results.trials[0]?.id || null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('trials');
  
  const selectedTrial = results.trials.find(t => t.id === selectedTrialId) || results.trials[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-tighter">Probable Match</span>;
      case 'uncertain':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-tighter">Review Needed</span>;
      case 'exclude':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-tighter">Ineligible</span>;
      default:
        return null;
    }
  };

  const handleTrialSelect = (id: string) => {
    setSelectedTrialId(id);
    if (window.innerWidth < 1024) {
      setMobileTab('details');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200 hidden xs:block"></div>
          <h2 className="text-sm sm:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[150px] sm:max-w-none">
            Clinical Match Dashboard
          </h2>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right mr-2 sm:mr-4 hidden sm:block">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Database Sync</p>
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </p>
          </div>
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-100">
            <Plus className="w-3 h-3 sm:w-4 h-4" />
            <span className="hidden xs:inline">New Analysis</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white">
        <button 
          onClick={() => setMobileTab('patient')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${mobileTab === 'patient' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
        >
          Patient
        </button>
        <button 
          onClick={() => setMobileTab('trials')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${mobileTab === 'trials' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
        >
          Matches ({results.trials.length})
        </button>
        <button 
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${mobileTab === 'details' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent'}`}
        >
          Trial Details
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Patient Summary */}
        <aside className={`
          lg:w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col overflow-y-auto
          absolute inset-0 z-20 transition-transform duration-300 lg:relative lg:translate-x-0
          ${mobileTab === 'patient' ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Patient Profile</p>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">{results.summary.split('|')[0]}</h3>
                <p className="text-xs text-slate-500 font-medium">ID: #ME-92289</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Stethoscope className="w-3 h-3" /> Diagnosis
                </div>
                <p className="text-sm font-bold text-slate-700">{results.patientProfile.diagnosis}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Fingerprint className="w-3 h-3" /> Staging
                </div>
                <p className="text-sm font-bold text-slate-700">{results.patientProfile.stage}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Dna className="w-3 h-3" /> Biomarkers
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {results.patientProfile.mutations.map(m => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Activity className="w-3 h-3" /> Performance
                </div>
                <p className="text-sm font-bold text-slate-700">ECOG {results.patientProfile.ecog}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50/50 flex-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Trials Analyzed</span>
                <span className="text-xs font-bold text-slate-900">18,402</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Potential Matches</span>
                <span className="text-xs font-bold text-emerald-600">3 Found</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Trial Table View */}
        <section className={`
          flex-1 flex flex-col min-w-0 bg-white
          ${mobileTab === 'trials' ? 'block' : 'hidden lg:flex'}
        `}>
          {/* Table Controls */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/30">
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter trials..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <div className="hidden sm:flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">
                  Phase <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trial Table - Scrollable */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left min-w-[600px] lg:min-w-0">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 sm:w-40">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 sm:w-24">Phase</th>
                  <th className="px-4 sm:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID & Title</th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Sponsor</th>
                  <th className="px-4 sm:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 sm:w-32 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.trials.map((trial) => (
                  <tr 
                    key={trial.id} 
                    onClick={() => handleTrialSelect(trial.id)}
                    className={`group cursor-pointer transition-colors ${selectedTrialId === trial.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      {getStatusBadge(trial.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white uppercase tracking-tighter">
                        {trial.phase.replace('Phase ', 'P')}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-[10px] sm:text-xs font-mono font-bold text-blue-600 mb-0.5">{trial.nctId}</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">{trial.name}</p>
                        <p className="hidden sm:block text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 mt-0.5 italic">{trial.officialTitle}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 line-clamp-1">{trial.sponsor}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-center">
                        <span className={`text-[10px] sm:text-xs font-bold ${trial.matchScore > 80 ? 'text-teal-600' : 'text-slate-500'}`}>{trial.matchScore}%</span>
                        <div className="w-12 sm:w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${trial.matchScore > 80 ? 'bg-teal-500' : trial.matchScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${trial.matchScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Panel: Trial Detail View */}
        <aside className={`
          lg:w-96 bg-white border-l border-slate-200 flex-shrink-0 flex flex-col overflow-hidden shadow-2xl
          absolute inset-0 z-20 transition-transform duration-300 lg:relative lg:translate-x-0
          ${mobileTab === 'details' ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {selectedTrial ? (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Protocol Details</span>
                  <div className="flex items-center gap-3">
                    <a 
                      href={selectedTrial.clinicalTrialsGovLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-tight">{selectedTrial.name}</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed mb-6">{selectedTrial.officialTitle}</p>
                
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Sponsor: {selectedTrial.sponsor.split(' ')[0]}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Multiple Sites</span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* AI Reasoning */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" /> Match Analysis
                  </h4>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed italic">
                      "{selectedTrial.explanation}"
                    </p>
                  </div>
                </div>

                {/* Eligibility Checklist */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inclusion Eligibility</h4>
                  <div className="space-y-3">
                    {selectedTrial.inclusionCriteria.map((c, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 leading-normal">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTrial.failedCriteria && selectedTrial.failedCriteria.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Exclusion Flags</h4>
                    <div className="space-y-3">
                      {selectedTrial.failedCriteria.map((c, i) => (
                        <div key={i} className="flex gap-3 items-start p-3 bg-rose-50 border border-rose-100 rounded-xl">
                          <div className="w-4 h-4 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
                          </div>
                          <p className="text-xs font-bold text-rose-800 leading-normal">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Container */}
              <div className="mt-auto p-6 sm:p-8 bg-slate-50 border-t border-slate-200 space-y-3">
                <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                  <Mail className="w-4 h-4" />
                  Contact Site
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button className="py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-slate-300" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select match for details</p>
            </div>
          )}
        </aside>
      </div>

      {/* Footer Branding */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between text-white flex-shrink-0">
        <p className="text-[8px] sm:text-[10px] font-black tracking-widest uppercase opacity-60 truncate mr-4">
          MatchEngine Precision Oncology · HIPAA Secure
        </p>
        <div className="flex gap-4 sm:gap-6 text-[8px] sm:text-[10px] font-bold opacity-60 uppercase tracking-tight whitespace-nowrap">
          <span className="hidden xs:inline">Auth: Dr. Smith</span>
          <span>Session: 14:02</span>
        </div>
      </footer>
    </div>
  );
};

export default ResultsScreen;


import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Zap, FileText, ClipboardList, Info, Activity, History, ChevronRight, Upload, CheckCircle2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { getConsultationHistory, formatRelativeTime, type ConsultationRecord } from '@/utils/consultationHistory';

interface InputScreenProps {
  onMatch: (notes: string) => Promise<void>;
  initialValue?: string;
}

const InputScreen: React.FC<InputScreenProps> = ({ onMatch, initialValue = '' }) => {
  const [notes, setNotes] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [history, setHistory] = useState<ConsultationRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load consultation history on mount and when returning from results
  useEffect(() => {
    const refreshHistory = () => {
      setHistory(getConsultationHistory());
    };
    
    // Initial load
    refreshHistory();
    
    // Refresh when window gains focus (user returns from another tab)
    window.addEventListener('focus', refreshHistory);
    
    // Refresh periodically to catch updates
    const interval = setInterval(refreshHistory, 1000);
    
    return () => {
      window.removeEventListener('focus', refreshHistory);
      clearInterval(interval);
    };
  }, []);

  const generateRandomDemo = (): string => {
    const ages = ['45', '52', '58', '61', '49', '67'];
    const stages = ['Stage II', 'Stage III', 'Stage IV'];
    const her2Status = ['HER2+', 'HER2-', 'HER2+ ER+', 'HER2+ ER- PR-'];
    const priorTreatments = [
      'Progressed on Trastuzumab and Docetaxel',
      'Failed Pertuzumab and Paclitaxel',
      'Completed AC-T regimen',
      'Progressed on T-DM1',
      'Failed first-line Trastuzumab',
      'Completed neoadjuvant therapy with residual disease'
    ];
    const metastases = [
      'New lesions in liver',
      'Bone metastases detected',
      'Lung nodules present',
      'No distant metastases',
      'Brain metastases stable on radiation',
      'Lymph node involvement'
    ];
    const ecogScores = ['ECOG 0', 'ECOG 1', 'ECOG 2'];
    const additionalInfo = [
      'No brain mets.',
      'Adequate organ function.',
      'Left ventricular ejection fraction 55%.',
      'No significant cardiac history.',
      'Willing to participate in clinical trial.',
      'Recent imaging shows progression.'
    ];

    const age = ages[Math.floor(Math.random() * ages.length)];
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const her2 = her2Status[Math.floor(Math.random() * her2Status.length)];
    const treatment = priorTreatments[Math.floor(Math.random() * priorTreatments.length)];
    const mets = metastases[Math.floor(Math.random() * metastases.length)];
    const ecog = ecogScores[Math.floor(Math.random() * ecogScores.length)];
    const info = additionalInfo[Math.floor(Math.random() * additionalInfo.length)];

    return `${age}yo female, ${stage} ${her2} breast cancer. ${treatment} last month. ${mets}. ${ecog}. ${info}`;
  };

  const handleLoadDemo = () => {
    setNotes(generateRandomDemo());
    setScanComplete(false);
  };

  const handleLoadHistory = (item: ConsultationRecord) => {
    // Handle legacy records that don't have originalNotes
    if (item.originalNotes) {
      setNotes(item.originalNotes);
      setScanComplete(false);
    } else {
      // Fallback: use patient summary if originalNotes not available
      alert('This consultation was saved before notes tracking was enabled. Please enter notes manually.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.length < 20) return;
    setIsLoading(true);
    
    try {
      await onMatch(notes);
    } catch (error) {
      console.error('Match failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const preprocessCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const contrast = 1.3; // slight contrast boost
    const intercept = 128 * (1 - contrast);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const v = Math.min(255, Math.max(0, lum * contrast + intercept));
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const imageFileToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
    const bitmap = await createImageBitmap(file);
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return preprocessCanvas(canvas);
  };



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 10MB');
      return;
    }

    setIsScanning(true);
    setScanComplete(false);

    try {
      // Initialize Tesseract worker
      const worker = await createWorker('eng');

      // Preprocess then OCR
      const canvas = await imageFileToCanvas(file);
      const dataUrl = canvas.toDataURL('image/png');
      const { data: { text } } = await worker.recognize(dataUrl);
      
      // Clean up worker
      await worker.terminate();

      // Auto-populate notes field with extracted text
      if (text.trim()) {
        setNotes(text.trim());
        setScanComplete(true);
        
        // Auto-hide scan confirmation after 3 seconds
        setTimeout(() => {
          setScanComplete(false);
        }, 3000);
      } else {
        alert('No text detected in image. Please try a clearer scan.');
      }
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Failed to scan document. Please try again or enter text manually.');
    } finally {
      setIsScanning(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
              <Activity className="w-5 h-5 sm:w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              MatchEngine <span className="text-indigo-600 font-medium">Oncology</span>
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Precision Eligibility Protocol & Patient Referral</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            NCT Sync Active
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            AI v4.2
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Main Workspace - 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-500" />
                Clinical Narrative Analysis
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={handleUploadClick}
                  disabled={isScanning}
                  className="text-[10px] sm:text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      Upload Document
                    </>
                  )}
                </button>
                <span className="text-slate-300">|</span>
                <button 
                  type="button" 
                  onClick={handleLoadDemo}
                  className="text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  + Load Clinical Demo
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-4 sm:p-8">
                <div className="relative group">
                  <textarea
                    className="w-full min-h-[300px] sm:min-h-[400px] p-4 sm:p-6 text-sm sm:text-[15px] leading-relaxed text-slate-800 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none font-mono-clinical shadow-inner"
                    placeholder="Paste de-identified clinical notes here... (e.g., Patient presents with Stage IV HER2+ Breast CA, failed 2nd line therapy, ECOG 1...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    <ClipboardList className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        {notes.length} Characters Detected
                      </span>
                    </div>
                    {scanComplete && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 animate-fade-in">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
                          Scan Complete
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={notes.length < 20 || isLoading}
                    className={`w-full sm:w-auto px-8 py-3.5 sm:px-10 sm:py-4 text-xs sm:text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-3 overflow-hidden ${
                      notes.length < 20 || isLoading
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing Clinical Data...
                      </>
                    ) : (
                      <>
                        Identify Matching Trials
                        <ChevronRight className="w-4 h-4 text-indigo-400" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] sm:text-xs font-medium text-slate-400">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Strict HIPAA compliance maintained. All data is processed in a secure environment.</span>
          </div>
        </div>

        {/* Sidebar - 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Guide */}
          <div className="bg-indigo-900 rounded-xl shadow-lg p-5 sm:p-6 text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Optimization Tips
            </h2>
            <div className="space-y-4 relative z-10">
              <p className="text-[11px] text-indigo-100 leading-relaxed">
                For highest accuracy, ensure notes include the following clinical parameters:
              </p>
              <div className="grid grid-cols-2 gap-3 sm:block sm:space-y-3">
                {[
                  { label: "Staging", desc: "e.g. Stage III, metastatic" },
                  { label: "Biomarkers", desc: "HER2, BRCA, PD-L1 %" },
                  { label: "Performance", desc: "ECOG 0-1, Karnofsky" },
                  { label: "History", desc: "Prior lines of therapy" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[11px] font-bold text-white">{item.label}</span>
                    <span className="text-[9px] sm:text-[10px] text-indigo-300">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Analysis Sidebar Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Consultations
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-400 mb-2">No recent consultations</p>
                <p className="text-[10px] text-slate-300">Your analysis history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLoadHistory(item)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-800 truncate">{item.diagnosis}</div>
                      <div className="text-[9px] text-slate-500 truncate">{item.patientSummary}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className={`text-[9px] font-bold uppercase ${item.matchType === 'High' ? 'text-emerald-600' : item.matchType === 'Med' ? 'text-amber-600' : 'text-slate-400'}`}>
                        {item.matchType}
                      </div>
                      <div className="text-[8px] text-slate-400">{formatRelativeTime(item.timestamp)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputScreen;

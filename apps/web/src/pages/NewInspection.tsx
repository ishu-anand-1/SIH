import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, FileText, Scan, RefreshCw, Cpu, Layers, AlertTriangle 
} from 'lucide-react';
import { api } from '../lib/api';
import { useUI } from '../context/UIContext';

export const NewInspection: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUI();
  const [currentStep, setCurrentStep] = useState(1);
  const [productId, setProductId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

  const steps = [
    { num: 1, title: 'Product' },
    { num: 2, title: 'Capture' },
    { num: 3, title: 'Analyze' },
    { num: 4, title: 'Review' },
    { num: 5, title: 'Finalize' },
  ];

  const qualityMetrics = [
    { label: 'Blur Score', val: 95, status: 'GOOD', color: 'bg-status-success' },
    { label: 'Brightness', val: 91, status: 'GOOD', color: 'bg-status-success' },
    { label: 'Contrast', val: 93, status: 'GOOD', color: 'bg-status-success' },
    { label: 'Glare Level', val: 96, status: 'GOOD', color: 'bg-status-success' },
    { label: 'Text Visibility', val: 94, status: 'GOOD', color: 'bg-status-success' },
  ];

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      addToast('success', 'Product package image captured.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      addToast('success', 'Product package image loaded.');
    }
  };

  const handleStartInspection = async () => {
    if (!productId) {
      addToast('error', 'Please select a product before starting the inspection.');
      return;
    }

    try {
      const res = await api.createInspection(productId);

      if (!res?.id) {
        throw new Error('Backend did not return a valid inspection ID.');
      }

      setInspectionId(res.id);
      setCurrentStep(2);

      addToast('success', `Created Inspection ${res.id}`);
    } catch (err: any) {
      console.error('Inspection creation failed:', err);

      setInspectionId(null);
      setCurrentStep(1);

      addToast(
        'error',
        err?.message || 'Could not create inspection. Please try again.'
      );
    }
  };

  const handleStartAnalysis = async () => {
    if (!inspectionId) {
      addToast('error', 'Inspection has not been created yet.');
      return;
    }

    if (!imageFile) {
      addToast('error', 'Please upload a product package image before analysis.');
      return;
    }

    setCurrentStep(3);
    setAnalyzing(true);
    setProgress(10);
    setAnalysisError(null);

    try {
      addToast('info', 'Uploading product package image...');

      await api.uploadInspectionImage(inspectionId, imageFile);

      setProgress(40);
      addToast('success', 'Image uploaded and validated successfully.');

      addToast('info', 'Running OCR and compliance analysis...');

      await api.analyzeInspection(inspectionId);

      setProgress(100);
      setAnalyzing(false);

      addToast('success', 'Analysis completed successfully.');
    } catch (err: any) {
      console.error('Inspection analysis failed:', err);

      setAnalyzing(false);
      setProgress(40);

      const message =
        err?.message ||
        'Analysis could not extract usable declarations. Manual review is required.';

      setAnalysisError(message);

      addToast('warning', message);
    }
  };

  const handleProceedToOcr = () => {
    if (!inspectionId) {
      addToast('error', 'Inspection ID is missing.');
      return;
    }

    navigate(`/inspections/${inspectionId}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Start New Inspection</h1>
        <p className="text-xs text-text-muted mt-1">Capture package image, analyze OCR quality, and trigger deterministic LMPC rules.</p>
      </div>

      {/* Stepper */}
      <div className="bg-surface rounded-card p-4 border border-border shadow-subtle flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCurrent = step.num === currentStep;
          const isDone = step.num < currentStep;

          return (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone 
                      ? 'bg-status-success text-white' 
                      : (isCurrent ? 'bg-brand-blue text-white shadow-subtle' : 'border border-border text-text-muted bg-surface-subtle')
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" strokeWidth={2} /> : `0${step.num}`}
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? 'text-brand-blue font-bold' : (isDone ? 'text-text-primary' : 'text-text-muted')}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 transition-colors ${idx + 1 < currentStep ? 'bg-status-success' : 'bg-border-subtle'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: PRODUCT SELECTION */}
      {currentStep === 1 && (
        <div className="bg-surface rounded-card p-6 border border-border shadow-card space-y-6 page-entry">
          <h2 className="text-base font-bold text-text-primary">01 Select Target Product</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setProductId('PROD-FB-001')}
              className={`p-4 rounded-lg border text-left transition-all ${
                productId === 'PROD-FB-001' ? 'border-brand-blue bg-brand-blue/5 shadow-subtle' : 'border-border bg-surface-subtle hover:bg-surface-hover'
              }`}
            >
              <div className="text-xs font-bold font-mono text-brand-blue">PROD-FB-001</div>
              <div className="text-sm font-semibold text-text-primary mt-1">AI will identify the product from the uploaded image</div>
              <div className="text-xs text-text-muted mt-1">Packaged Food â€¢ 100 g</div>
            </button>

            <button
              onClick={() => setProductId('PROD-HC-002')}
              className={`p-4 rounded-lg border text-left transition-all ${
                productId === 'PROD-HC-002' ? 'border-status-danger bg-status-dangerBg/40 shadow-subtle' : 'border-border bg-surface-subtle hover:bg-surface-hover'
              }`}
            >
              <div className="text-xs font-bold font-mono text-status-danger">PROD-HC-002</div>
              <div className="text-sm font-semibold text-text-primary mt-1">HomeCare Active Detergent</div>
              <div className="text-xs text-text-muted mt-1">Household Cleaning â€¢ 1 kg</div>
            </button>

            <button
              onClick={() => setProductId('PROD-EC-003')}
              className={`p-4 rounded-lg border text-left transition-all ${
                productId === 'PROD-EC-003' ? 'border-status-warning bg-status-warningBg/40 shadow-subtle' : 'border-border bg-surface-subtle hover:bg-surface-hover'
              }`}
            >
              <div className="text-xs font-bold font-mono text-status-warning">PROD-EC-003</div>
              <div className="text-sm font-semibold text-text-primary mt-1">EcoGrain Whole Wheat Flour</div>
              <div className="text-xs text-text-muted mt-1">Staples â€¢ 500 g</div>
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleStartInspection}
              className="px-6 py-2.5 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-sm shadow-subtle transition-all flex items-center gap-2"
            >
              <span>Continue to Capture</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CAPTURE & UPLOAD ZONE */}
      {currentStep === 2 && (
        <div className="bg-surface rounded-card p-6 border border-border shadow-card space-y-6 page-entry">
          <h2 className="text-base font-bold text-text-primary">02 Capture / Upload Package Image</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-border hover:border-brand-blue bg-surface-subtle hover:bg-brand-blue/5 rounded-card p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[260px]"
            >
              <div className="p-4 rounded-full bg-brand-blue/10 text-brand-blue mb-3">
                <Camera className="w-8 h-8" strokeWidth={1.8} />
              </div>
              <p className="text-sm font-semibold text-text-primary">Drop product package images here</p>
              <p className="text-xs text-text-muted mt-1">Front, back, side panel, or close-up label</p>
              
              <label className="mt-4 px-4 py-2 rounded-btn bg-surface border border-border hover:bg-surface-hover text-xs font-semibold text-text-primary cursor-pointer shadow-2xs transition-colors">
                Browse Files
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>

            {/* Quality & Preview Panel */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface-subtle border border-border">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Computer Vision Quality Panel</h3>
                
                <div className="space-y-2.5">
                  {qualityMetrics.map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-text-secondary">{m.label}</span>
                        <span className="text-status-success font-semibold font-mono">{m.val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${m.color}`} style={{ width: `${m.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-text-muted mt-3">
                  Lighting glare and text visibility scores meet computer-vision optical thresholds for reliable OCR extraction.
                </p>
              </div>

              {imagePreview && (
                <div className="p-3 rounded-lg border border-border bg-surface flex items-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded border border-border" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-text-primary">FRONT LABEL CAPTURE</div>
                    <div className="text-[10px] text-text-muted">1920 Ã— 1080 â€¢ Quality: GOOD â€¢ OCR Ready</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-status-success" strokeWidth={1.8} />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-btn border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text-secondary"
            >
              Back
            </button>
            <button
              onClick={handleStartAnalysis}
              className="px-6 py-2.5 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-sm shadow-subtle transition-all flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" strokeWidth={1.8} />
              <span>ANALYZE PRODUCT</span>
            </button>
          </div>
        </div>
      )}
      {/* STEP 3: AI PROCESSING PROGRESS */}
      {currentStep === 3 && (
        <div className="bg-surface rounded-card p-8 border border-border shadow-card space-y-6 page-entry text-center max-w-2xl mx-auto">

          {!analysisError ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 text-brand-bright flex items-center justify-center mx-auto mb-2">
                <Scan
                  className={`w-8 h-8 ${analyzing ? 'animate-pulse' : ''}`}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                  METROLOGYX ANALYSIS
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Processing package evidence & evaluating versioned rules...
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-text-muted">
                  <span>Pipeline Progress</span>
                  <span className="font-mono text-brand-blue">{progress}%</span>
                </div>

                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-bright transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-surface-subtle rounded-lg p-4 border border-border text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-status-success font-semibold">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
                  <span>Image quality assessment</span>
                </div>

                <div className="flex items-center gap-2 text-status-success font-semibold">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
                  <span>Text region detection & bounding box calculation</span>
                </div>

                <div className={`flex items-center gap-2 ${
                  progress >= 40
                    ? 'text-status-success font-semibold'
                    : 'text-brand-blue'
                }`}>
                  <RefreshCw
                    className={`w-4 h-4 ${
                      progress < 40 ? 'animate-spin' : ''
                    }`}
                    strokeWidth={1.8}
                  />
                  <span>OCR text extraction & confidence scoring</span>
                </div>

                <div className={`flex items-center gap-2 ${
                  progress >= 60
                    ? 'text-status-success font-semibold'
                    : 'text-text-muted'
                }`}>
                  <span>Declaration normalization (Net Qty, MRP, Manufacturer)</span>
                </div>

                <div className={`flex items-center gap-2 ${
                  progress >= 80
                    ? 'text-status-success font-semibold'
                    : 'text-text-muted'
                }`}>
                  <span>Deterministic Rule Engine evaluation</span>
                </div>

                <div className={`flex items-center gap-2 ${
                  progress >= 100
                    ? 'text-status-success font-semibold'
                    : 'text-text-muted'
                }`}>
                  <span>Evidence generation & SHA-256 integrity hashing</span>
                </div>
              </div>

              {progress >= 100 && (
                <button
                  onClick={handleProceedToOcr}
                  className="w-full py-3 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-sm shadow-subtle transition-all flex items-center justify-center gap-2 page-entry"
                >
                  <span>VIEW OCR EXTRACTION & COMPLIANCE MATRIX</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-status-warning/10 text-status-warning flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" strokeWidth={1.8} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-warning/10 text-status-warning text-xs font-bold tracking-wide">
                  NEEDS REVIEW
                </div>

                <h2 className="text-xl font-extrabold text-text-primary tracking-tight mt-4">
                  Manual Review Required
                </h2>

                <p className="text-sm text-text-muted mt-2 leading-relaxed">
                  The uploaded package image was accepted, but the OCR pipeline
                  could not extract enough usable declarations for automated
                  compliance evaluation.
                </p>
              </div>

              <div className="bg-status-warning/5 border border-status-warning/20 rounded-lg p-4 text-left">
                <p className="text-xs font-semibold text-text-primary mb-1">
                  Analysis result
                </p>

                <p className="text-xs text-text-muted leading-relaxed">
                  {analysisError}
                </p>
              </div>

              <div className="bg-surface-subtle rounded-lg p-4 border border-border text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-status-success font-semibold">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
                  <span>Product inspection created</span>
                </div>

                <div className="flex items-center gap-2 text-status-success font-semibold">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} />
                  <span>Package image uploaded & validated</span>
                </div>

                <div className="flex items-center gap-2 text-status-warning font-semibold">
                  <AlertTriangle className="w-4 h-4" strokeWidth={1.8} />
                  <span>OCR declarations require officer review</span>
                </div>
              </div>

              <button
                onClick={handleProceedToOcr}
                className="w-full py-3 rounded-btn bg-brand-bright hover:bg-brand-blue text-white font-semibold text-sm shadow-subtle transition-all flex items-center justify-center gap-2"
              >
                <span>OPEN INSPECTION FOR MANUAL REVIEW</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

};











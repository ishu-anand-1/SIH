import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Scan,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowRight,
  MapPin,
  FileText,
  ShieldCheck,
} from 'lucide-react';

import { api } from '../lib/api';
import {
  InspectionDetail,
  ComplianceFinding,
  OcrResult,
} from '../types';

import { StatusBadge } from '../components/common/StatusBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { ComplianceMatrix } from '../components/inspection/ComplianceMatrix';
import { FindingDrawer } from '../components/inspection/FindingDrawer';
import { RuleTraceModal } from '../components/inspection/RuleTraceModal';
import { useUI } from '../context/UIContext';


/* ============================================================
   HELPERS
============================================================ */

const DEFAULT_IMAGE =
  '/static/samples/freshbite_front.jpg';

const DEFAULT_IMAGE_WIDTH = 1920;
const DEFAULT_IMAGE_HEIGHT = 1080;


/**
 * Convert backend pixel bounding box into percentage coordinates.
 *
 * Backend:
 * {
 *   x: 942,
 *   y: 600,
 *   width: 652,
 *   height: 14
 * }
 *
 * Frontend overlay:
 * left/top/width/height -> %
 */
function bboxToPercentage(
  bbox: OcrResult['bounding_box'],
  imageWidth: number,
  imageHeight: number,
) {
  if (!bbox) {
    return null;
  }

  if (
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return null;
  }

  return {
    left: Math.max(
      0,
      Math.min(
        100,
        (bbox.x / imageWidth) * 100,
      ),
    ),

    top: Math.max(
      0,
      Math.min(
        100,
        (bbox.y / imageHeight) * 100,
      ),
    ),

    width: Math.max(
      0,
      Math.min(
        100,
        (bbox.width / imageWidth) * 100,
      ),
    ),

    height: Math.max(
      0,
      Math.min(
        100,
        (bbox.height / imageHeight) * 100,
      ),
    ),
  };
}


/**
 * Safely format OCR confidence.
 */
function formatConfidence(
  confidence: number | null | undefined,
) {
  if (
    confidence === null ||
    confidence === undefined ||
    Number.isNaN(Number(confidence))
  ) {
    return '—';
  }

  return `${Math.round(Number(confidence))}%`;
}


/**
 * Get image dimensions from API metadata.
 *
 * API currently stores resolution as:
 * "1254 x 1254"
 * or
 * "1920 x 1080"
 */
function parseResolution(
  resolution?: string,
) {
  if (!resolution) {
    return {
      width: DEFAULT_IMAGE_WIDTH,
      height: DEFAULT_IMAGE_HEIGHT,
    };
  }

  const match = resolution.match(
    /(\d+)\s*[x×]\s*(\d+)/i,
  );

  if (!match) {
    return {
      width: DEFAULT_IMAGE_WIDTH,
      height: DEFAULT_IMAGE_HEIGHT,
    };
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}


/* ============================================================
   COMPONENT
============================================================ */

export const AnalysisOcr: React.FC = () => {
  const { id } = useParams<{
    id: string;
  }>();

  const navigate = useNavigate();

  const { addToast } = useUI();

  const [
    detail,
    setDetail,
  ] = useState<InspectionDetail | null>(null);

  const [
    selectedFieldKey,
    setSelectedFieldKey,
  ] = useState<string | null>(
    'net_quantity',
  );

  const [
    selectedFinding,
    setSelectedFinding,
  ] = useState<ComplianceFinding | null>(
    null,
  );

  const [
    activeRuleTraceFinding,
    setActiveRuleTraceFinding,
  ] = useState<ComplianceFinding | null>(
    null,
  );

  const [
    zoomLevel,
    setZoomLevel,
  ] = useState(1);


  /* ==========================================================
     LOAD INSPECTION
  ========================================================== */

  const loadDetail = async () => {
    if (!id) {
      return;
    }

    try {
      const data =
        await api.getInspectionDetail(id);

      setDetail(data);

      /*
       * Select first real OCR field only.
       * Do not fabricate net_quantity.
       */
      if (
        data.ocr_results &&
        data.ocr_results.length > 0
      ) {
        setSelectedFieldKey(
          data.ocr_results[0].field_key,
        );
      } else {
        setSelectedFieldKey(null);
      }
    } catch (err) {
      /*
       * IMPORTANT:
       * Do NOT show fake/sample inspection data
       * when backend fails.
       *
       * A government inspection system must make
       * backend failure visible rather than presenting
       * fabricated evidence.
       */

      console.error(
        'Failed to load inspection detail:',
        err,
      );

      addToast(
        'error',
        'Unable to load inspection data from the backend.',
      );

      setDetail(null);
    }
  };


  useEffect(() => {
    loadDetail();
  }, [id]);


  /* ==========================================================
     LOADING
  ========================================================== */

  if (!detail) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-brand-blue/20 border-t-brand-blue animate-spin" />

          <p className="text-sm font-semibold text-text-primary">
            Loading inspection analysis...
          </p>

          <p className="text-xs text-text-muted mt-1">
            Retrieving OCR, evidence and rule evaluation.
          </p>
        </div>
      </div>
    );
  }


  /* ==========================================================
     IMAGE INFORMATION
  ========================================================== */

  const primaryImage =
    detail.images?.[0];

  const imageUrl =
    primaryImage?.image_url ||
    DEFAULT_IMAGE;

  const imageResolution =
    parseResolution(
      primaryImage?.resolution,
    );

  const imageWidth =
    imageResolution.width;

  const imageHeight =
    imageResolution.height;


  /* ==========================================================
     SELECTED OCR
  ========================================================== */

  const selectedOcr =
    detail.ocr_results?.find(
      (ocr) =>
        ocr.field_key ===
        selectedFieldKey,
    ) ||
    detail.ocr_results?.[0] ||
    null;


  /* ==========================================================
     FIELD SELECTOR
  ========================================================== */

  const selectOcrField = (
    ocr: OcrResult,
  ) => {
    setSelectedFieldKey(
      ocr.field_key,
    );

    addToast(
      'info',
      `Selected region: ${ocr.label}`,
    );
  };


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        <div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-brand-blue mb-1">

            <span>
              INSPECTION ID: {detail.id}
            </span>

            <span className="text-text-muted">
              •
            </span>

            <span>
              RULE VERSION {detail.rule_version}
            </span>

          </div>


          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {detail.product_name}
          </h1>


          <p className="text-xs text-text-muted mt-1">
            {detail.brand}
            <span className="mx-2">
              •
            </span>
            {detail.category}
          </p>

        </div>


        <div className="flex flex-wrap items-center gap-3">

          <StatusBadge
            status={
              detail.overall_compliance
            }
            size="lg"
          />


          <button
            onClick={() =>
              navigate(
                `/inspections/${detail.id}/evidence`,
              )
            }
            className="px-4 py-2 rounded-btn bg-surface border border-border hover:bg-surface-hover text-xs font-semibold text-text-primary shadow-2xs"
          >
            Evidence Viewer
          </button>


          <button
            onClick={() =>
              navigate(
                `/inspections/${detail.id}/review`,
              )
            }
            className="px-4 py-2 rounded-btn bg-brand-bright hover:bg-brand-blue text-white text-xs font-semibold shadow-subtle flex items-center gap-1.5"
          >
            <span>
              Officer Review
            </span>

            <ArrowRight
              className="w-3.5 h-3.5"
              strokeWidth={1.8}
            />
          </button>

        </div>

      </div>


      {/* ======================================================
          SPLIT SCREEN
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">


        {/* ====================================================
            IMAGE CANVAS
        ==================================================== */}

        <div className="lg:col-span-7 bg-surface rounded-card p-4 border border-border shadow-card">

          {/* Canvas header */}

          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">

            <div className="flex items-center gap-2">

              <Scan
                className="w-4 h-4 text-brand-blue"
                strokeWidth={1.8}
              />

              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                PACKAGE LABEL BOUNDING CANVAS
              </span>

            </div>


            <div className="flex items-center gap-1">

              <button
                onClick={() =>
                  setZoomLevel(
                    (prev) =>
                      Math.min(
                        prev + 0.25,
                        2.5,
                      ),
                  )
                }
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary"
                title="Zoom In"
              >
                <ZoomIn
                  className="w-4 h-4"
                  strokeWidth={1.8}
                />
              </button>


              <button
                onClick={() =>
                  setZoomLevel(
                    (prev) =>
                      Math.max(
                        prev - 0.25,
                        0.75,
                      ),
                  )
                }
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary"
                title="Zoom Out"
              >
                <ZoomOut
                  className="w-4 h-4"
                  strokeWidth={1.8}
                />
              </button>


              <button
                onClick={() =>
                  setZoomLevel(1)
                }
                className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary"
                title="Reset Zoom"
              >
                <Maximize2
                  className="w-4 h-4"
                  strokeWidth={1.8}
                />
              </button>

            </div>

          </div>


          {/* ==================================================
              ACTUAL IMAGE CONTAINER
          ================================================== */}

          <div className="relative w-full h-[400px] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">

            <div
              className="relative max-w-full max-h-full transition-transform duration-300"
              style={{
                transform:
                  `scale(${zoomLevel})`,
              }}
            >

              <img
                src={imageUrl}
                alt={`${detail.product_name} package`}
                className="block max-h-[400px] max-w-full object-contain"
              />


              {/* =================================================
                  BOUNDING BOXES
              ================================================= */}

              {detail.ocr_results?.map(
                (ocr) => {

                  const box =
                    bboxToPercentage(
                      ocr.bounding_box,
                      imageWidth,
                      imageHeight,
                    );

                  if (!box) {
                    return null;
                  }

                  const isSelected =
                    ocr.field_key ===
                    selectedFieldKey;


                  return (
                    <button
                      key={ocr.id}
                      type="button"
                      onClick={() =>
                        selectOcrField(
                          ocr,
                        )
                      }
                      aria-label={`Select ${ocr.label}`}
                      style={{
                        left: `${box.left}%`,
                        top: `${box.top}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                      className={`
                        absolute
                        border-2
                        rounded
                        cursor-pointer
                        transition-all
                        duration-200
                        p-0
                        ${isSelected
                          ? 'border-brand-bright bg-brand-bright/25 shadow-lg z-20'
                          : 'border-brand-blue/80 bg-brand-blue/10 hover:border-brand-bright hover:bg-brand-bright/20 z-10'
                        }
                      `}
                    >

                      {/* Label */}

                      <span
                        className={`
                          absolute
                          -top-6
                          left-0
                          whitespace-nowrap
                          text-[10px]
                          font-mono
                          font-bold
                          px-1.5
                          py-0.5
                          rounded
                          shadow-2xs
                          ${isSelected
                            ? 'bg-brand-bright text-white'
                            : 'bg-navy-primary text-slate-200'
                          }
                        `}
                      >
                        {ocr.label}
                        {' '}
                        ({formatConfidence(
                          ocr.ocr_confidence,
                        )})
                      </span>

                    </button>
                  );
                },
              )}

            </div>

          </div>


          {/* Canvas footer */}

          <div className="pt-3 text-[11px] text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">

            <span className="flex items-center gap-1.5">

              <MapPin
                className="w-3.5 h-3.5 text-brand-blue"
              />

              Click a bounding region or declaration
              card to synchronize inspection.

            </span>


            <span className="font-mono text-brand-blue font-semibold">
              {imageWidth} × {imageHeight} px
            </span>

          </div>

        </div>


        {/* ====================================================
            DECLARATION CARDS
        ==================================================== */}

        <div className="lg:col-span-5 bg-surface rounded-card p-4 border border-border shadow-card">

          <div className="pb-3 border-b border-border mb-3 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <FileText
                className="w-4 h-4 text-brand-blue"
              />

              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                EXTRACTED DECLARATION FIELDS
              </span>

            </div>


            <span className="text-xs font-mono text-text-muted">
              {detail.ocr_results?.length || 0}
              {' '}
              Fields Detected
            </span>

          </div>


          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">

            {detail.ocr_results &&
              detail.ocr_results.length > 0 ? (

              detail.ocr_results.map(
                (ocr) => {

                  const isSelected =
                    ocr.field_key ===
                    selectedFieldKey;


                  return (
                    <button
                      key={ocr.id}
                      type="button"
                      onClick={() =>
                        selectOcrField(
                          ocr,
                        )
                      }
                      className={`
                        w-full
                        p-3.5
                        rounded-lg
                        border
                        text-left
                        transition-all
                        cursor-pointer
                        ${isSelected
                          ? 'border-brand-bright bg-brand-blue/5 shadow-subtle'
                          : 'border-border bg-surface-subtle hover:bg-surface-hover'
                        }
                      `}
                    >

                      {/* Field title */}

                      <div className="flex items-center justify-between gap-3 mb-2">

                        <span className="text-xs font-semibold text-text-primary">
                          {ocr.label}
                        </span>


                        {/* Confidence explicitly labelled */}

                        <div className="flex items-center gap-2">

                          <span className="text-[10px] uppercase tracking-wide text-text-muted font-medium">
                            OCR
                          </span>

                          <ConfidenceBadge
                            confidence={
                              ocr.ocr_confidence
                            }
                            showMeter={false}
                          />

                        </div>

                      </div>


                      {/* Actual normalized value */}

                      <div className="flex items-baseline gap-2 mb-1">

                        <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                          Detected
                        </span>

                        <span className="text-sm font-mono font-bold text-brand-blue">
                          {ocr.normalized_value ||
                            'NOT DETECTED'}
                        </span>

                      </div>


                      {/* Raw OCR */}

                      <div className="text-[11px] text-text-muted font-mono truncate">

                        Raw OCR:
                        {' '}
                        <span className="text-text-secondary">
                          "{ocr.raw_text || '—'}"
                        </span>

                      </div>


                      {/* Bounding box info */}

                      {ocr.bounding_box && (
                        <div className="mt-2 text-[10px] font-mono text-text-muted">

                          BBox:
                          {' '}
                          x={ocr.bounding_box.x},
                          {' '}
                          y={ocr.bounding_box.y},
                          {' '}
                          w={ocr.bounding_box.width},
                          {' '}
                          h={ocr.bounding_box.height}

                        </div>
                      )}

                    </button>
                  );
                },
              )

            ) : (

              <div className="p-5 rounded-lg border border-dashed border-border text-center">

                <ShieldCheck
                  className="w-8 h-8 mx-auto mb-2 text-text-muted"
                />

                <p className="text-xs font-semibold text-text-primary">
                  No declarations detected
                </p>

                <p className="text-[11px] text-text-muted mt-1">
                  Manual review is required.
                </p>

              </div>

            )}

          </div>


          {/* ==================================================
              SELECTED REGION
          ================================================== */}

          {selectedOcr && (

            <div className="pt-3 border-t border-border mt-3">

              <div className="bg-surface-subtle p-3 rounded-lg">

                <div className="flex items-center gap-2 mb-1">

                  <MapPin
                    className="w-3.5 h-3.5 text-brand-blue"
                  />

                  <div className="font-semibold text-text-primary text-xs">
                    Selected Region
                  </div>

                </div>


                <p className="text-[11px] text-text-muted leading-relaxed">

                  <span className="font-semibold text-text-primary">
                    {selectedOcr.label}
                  </span>

                  {' '}
                  was extracted from the uploaded
                  package image.

                  The OCR engine detected:

                  {' '}

                  <span className="font-mono text-brand-blue font-semibold">
                    {selectedOcr.raw_text}
                  </span>

                  .

                  {' '}

                  OCR confidence:

                  {' '}

                  <span className="font-mono font-semibold">
                    {formatConfidence(
                      selectedOcr.ocr_confidence,
                    )}
                  </span>

                  .

                </p>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* ======================================================
          COMPLIANCE MATRIX
      ====================================================== */}

      <ComplianceMatrix
        findings={
          detail.findings || []
        }
        onSelectFinding={(
          finding,
        ) =>
          setSelectedFinding(
            finding,
          )
        }
      />


      {/* ======================================================
          FINDING DRAWER
      ====================================================== */}

      <FindingDrawer
        finding={selectedFinding}
        onClose={() =>
          setSelectedFinding(null)
        }
        onOpenRuleTrace={(
          finding,
        ) => {
          setSelectedFinding(null);
          setActiveRuleTraceFinding(
            finding,
          );
        }}
      />


      {/* ======================================================
          RULE TRACE
      ====================================================== */}

      <RuleTraceModal
        finding={
          activeRuleTraceFinding
        }
        onClose={() =>
          setActiveRuleTraceFinding(null)
        }
      />

    </div>
  );
};
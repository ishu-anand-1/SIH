import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  SearchCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Activity,
  Clock3,
  FileSearch,
  PackageCheck,
  ChevronRight,
  Database,
  ScanLine,
  Layers3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { api } from '../lib/api';
import { useUI } from '../context/UIContext';

interface DashboardStats {
  total_inspections: number;
  compliant_count: number;
  non_compliant_count: number;
  needs_review_count: number;
  weekly_trend: Array<{
    day: string;
    compliant: number;
    potential_issues: number;
    needs_review: number;
  }>;
}

interface Inspection {
  id: string;
  product_name?: string;
  category?: string;
  rule_version?: string;
  overall_compliance?: string;
  status?: string;
  created_at?: string;
  finalized_at?: string;
}

const EMPTY_STATS: DashboardStats = {
  total_inspections: 0,
  compliant_count: 0,
  non_compliant_count: 0,
  needs_review_count: 0,
  weekly_trend: [],
};

const formatDate = (value?: string): string => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUI();

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsData, inspectionData] = await Promise.all([
        api.getDashboardStats(),
        api.listInspections(),
      ]);

      const safeStats: DashboardStats = {
        total_inspections: normalizeNumber(
          statsData?.total_inspections
        ),
        compliant_count: normalizeNumber(
          statsData?.compliant_count
        ),
        non_compliant_count: normalizeNumber(
          statsData?.non_compliant_count
        ),
        needs_review_count: normalizeNumber(
          statsData?.needs_review_count
        ),
        weekly_trend: Array.isArray(statsData?.weekly_trend)
          ? statsData.weekly_trend
          : [],
      };

      setStats(safeStats);

      setInspections(
        Array.isArray(inspectionData)
          ? inspectionData
          : []
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard data.';

      setError(message);
      setStats(EMPTY_STATS);
      setInspections([]);

      addToast(
        'error',
        `Dashboard data unavailable: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
   * Build category statistics from actual inspection records.
   * No hardcoded category counts.
   */
  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();

    inspections.forEach((inspection) => {
      const category =
        inspection.category?.trim() || 'Uncategorized';

      counts.set(
        category,
        (counts.get(category) || 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [inspections]);

  /*
   * Latest inspections first.
   */
  const recentInspections = useMemo(() => {
    return [...inspections]
      .sort((a, b) => {
        const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return bTime - aTime;
      })
      .slice(0, 6);
  }, [inspections]);

  const completionRate = useMemo(() => {
    if (stats.total_inspections <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        ((stats.compliant_count +
          stats.non_compliant_count) /
          stats.total_inspections) *
          100
      )
    );
  }, [stats]);

  const reviewRate = useMemo(() => {
    if (stats.total_inspections <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (stats.needs_review_count /
          stats.total_inspections) *
          100
      )
    );
  }, [stats]);

  const handleRefresh = async () => {
    await loadData();

    if (!error) {
      addToast(
        'success',
        'Dashboard refreshed successfully.'
      );
    }
  };

  return (
    <div className="min-h-full space-y-6 pb-8">

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-brand-bright/5 blur-3xl" />

          <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-brand-blue/10" />
          <div className="absolute right-14 top-14 h-20 w-20 rounded-full border border-brand-blue/10" />
        </div>

        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div className="max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-status-success" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-blue">
                Inspection Command Center
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-[34px]">
              Legal Metrology Intelligence
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              Evidence-backed inspection monitoring with
              AI-assisted extraction, deterministic rule
              evaluation and human officer review.
            </p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-[11px] text-text-muted">

              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
                Evidence integrity
              </span>

              <span className="inline-flex items-center gap-1.5">
                <ScanLine className="h-3.5 w-3.5 text-brand-blue" />
                AI-assisted analysis
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-status-warning" />
                Versioned rules
              </span>

            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-brand-blue/30 hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                navigate('/inspections/new')
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:bg-brand-bright hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />

              New Inspection
            </button>

          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <section className="flex items-start gap-3 rounded-xl border border-status-danger/20 bg-status-dangerBg p-4">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-danger" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-status-danger">
              Dashboard data could not be loaded
            </p>

            <p className="mt-1 text-xs leading-5 text-text-secondary">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="shrink-0 text-xs font-bold text-status-danger hover:underline"
          >
            Retry
          </button>

        </section>
      )}

      {/* =====================================================
          KPI CARDS
      ====================================================== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <KpiCard
          title="Total Inspections"
          value={stats.total_inspections}
          icon={SearchCheck}
          accentColor="text-brand-blue"
          delayMs={0}
        />

        <KpiCard
          title="Compliant"
          value={stats.compliant_count}
          icon={CheckCircle2}
          accentColor="text-status-success"
          delayMs={70}
        />

        <KpiCard
          title="Potential Issues"
          value={stats.non_compliant_count}
          icon={AlertCircle}
          accentColor="text-status-danger"
          delayMs={140}
        />

        <KpiCard
          title="Needs Review"
          value={stats.needs_review_count}
          icon={AlertTriangle}
          accentColor="text-status-warning"
          delayMs={210}
        />

      </section>

      {/* =====================================================
          OPERATIONAL SNAPSHOT
      ====================================================== */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* RESOLUTION */}
        <MetricCard
          title="Resolved Outcome Rate"
          value={`${loading ? 0 : completionRate}%`}
          description="Compliant + potential issue outcomes"
          icon={CheckCircle2}
          iconClass="text-status-success"
          iconBg="bg-status-successBg"
          progress={completionRate}
          progressClass="bg-status-success"
        />

        {/* REVIEW */}
        <MetricCard
          title="Human Review Queue"
          value={`${loading ? 0 : reviewRate}%`}
          description="Inspections requiring officer verification"
          icon={Clock3}
          iconClass="text-status-warning"
          iconBg="bg-status-warningBg"
          progress={reviewRate}
          progressClass="bg-status-warning"
        />

        {/* REPOSITORY */}
        <MetricCard
          title="Inspection Repository"
          value={loading ? 0 : inspections.length}
          description="Inspection records available to the command center"
          icon={PackageCheck}
          iconClass="text-brand-blue"
          iconBg="bg-brand-blue/10"
        />

      </section>

      {/* =====================================================
          ANALYTICS
      ====================================================== */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* WEEKLY TREND */}
        <div className="xl:col-span-2 rounded-2xl border border-border bg-surface p-5 shadow-card">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-blue" />

                <h2 className="text-base font-bold text-text-primary">
                  Inspection Activity
                </h2>
              </div>

              <p className="mt-1 text-xs text-text-muted">
                Seven-day outcome trend from the inspection API
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] font-medium text-text-muted">

              <Legend
                className="bg-brand-blue"
                label="Compliant"
              />

              <Legend
                className="bg-status-danger"
                label="Potential"
              />

              <Legend
                className="bg-status-warning"
                label="Review"
              />

            </div>
          </div>

          <div className="h-72">

            {loading ? (
              <ChartSkeleton />
            ) : stats.weekly_trend.length === 0 ? (
              <EmptyChartState
                icon={Activity}
                title="No activity data"
                description="Complete an inspection to populate this chart."
              />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={stats.weekly_trend}
                  margin={{
                    top: 10,
                    right: 8,
                    left: -20,
                    bottom: 0,
                  }}
                >

                  <defs>

                    <linearGradient
                      id="dashboardCompliant"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#1769E0"
                        stopOpacity={0.22}
                      />

                      <stop
                        offset="100%"
                        stopColor="#1769E0"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="dashboardPotential"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#C63D3D"
                        stopOpacity={0.16}
                      />

                      <stop
                        offset="100%"
                        stopColor="#C63D3D"
                        stopOpacity={0}
                      />
                    </linearGradient>

                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#E6EBF0"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="day"
                    stroke="#7C8998"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#7C8998"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: '#0B1F33',
                      border: '1px solid #12395A',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    labelStyle={{
                      color: '#CBD5E1',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="compliant"
                    name="Compliant"
                    stroke="#1769E0"
                    strokeWidth={2.5}
                    fill="url(#dashboardCompliant)"
                  />

                  <Area
                    type="monotone"
                    dataKey="potential_issues"
                    name="Potential Issues"
                    stroke="#C63D3D"
                    strokeWidth={2}
                    fill="url(#dashboardPotential)"
                  />

                  <Area
                    type="monotone"
                    dataKey="needs_review"
                    name="Needs Review"
                    stroke="#C98200"
                    strokeWidth={2}
                    fill="transparent"
                  />

                </AreaChart>
              </ResponsiveContainer>
            )}

          </div>
        </div>

        {/* CATEGORY BREAKDOWN */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">

          <div className="flex items-start justify-between">

            <div>
              <div className="flex items-center gap-2">

                <div className="rounded-lg bg-brand-blue/10 p-1.5">
                  <Layers3 className="h-4 w-4 text-brand-blue" />
                </div>

                <h2 className="text-base font-bold text-text-primary">
                  Product Categories
                </h2>

              </div>

              <p className="mt-2 text-xs text-text-muted">
                Derived from live inspection records
              </p>
            </div>

            <span className="rounded-lg bg-status-successBg px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-status-success">
              Live
            </span>

          </div>

          <div className="mt-5 h-64">

            {loading ? (
              <ChartSkeleton />
            ) : categoryData.length === 0 ? (
              <EmptyChartState
                icon={PackageCheck}
                title="No category data"
                description="Inspection records will appear here."
              />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{
                    top: 0,
                    right: 8,
                    left: 0,
                    bottom: 0,
                  }}
                >

                  <XAxis
                    type="number"
                    hide
                    allowDecimals={false}
                  />

                  <YAxis
                    dataKey="category"
                    type="category"
                    width={105}
                    tick={{
                      fill: '#64748B',
                      fontSize: 10,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    cursor={{
                      fill: '#F1F5F9',
                    }}
                    contentStyle={{
                      background: '#0B1F33',
                      border: '1px solid #12395A',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />

                  <Bar
                    dataKey="count"
                    name="Inspections"
                    fill="#1769E0"
                    radius={[0, 5, 5, 0]}
                    barSize={18}
                  />

                </BarChart>
              </ResponsiveContainer>
            )}

          </div>

          <button
            type="button"
            onClick={() => navigate('/products')}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-subtle py-2.5 text-xs font-bold text-text-secondary transition hover:border-brand-blue/30 hover:bg-surface-hover hover:text-brand-blue"
          >
            Open Product Repository
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>
      </section>

      {/* =====================================================
          RECENT INSPECTIONS
      ====================================================== */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">

        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-brand-blue" />

              <h2 className="text-base font-bold text-text-primary">
                Recent Inspections
              </h2>
            </div>

            <p className="mt-1 text-xs text-text-muted">
              Latest inspection records from the backend repository
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate('/inspections')}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue transition hover:text-brand-bright"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>

        {loading ? (
          <TableSkeleton />
        ) : recentInspections.length === 0 ? (
          <EmptyTableState
            onCreate={() => navigate('/inspections/new')}
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">

              <table className="w-full border-collapse text-left">

                <thead>
                  <tr className="border-b border-border bg-surface-subtle text-[10px] font-bold uppercase tracking-wider text-text-muted">

                    <th className="px-5 py-3.5">
                      Inspection
                    </th>

                    <th className="px-5 py-3.5">
                      Product
                    </th>

                    <th className="px-5 py-3.5">
                      Category
                    </th>

                    <th className="px-5 py-3.5">
                      Rule Version
                    </th>

                    <th className="px-5 py-3.5">
                      Status
                    </th>

                    <th className="px-5 py-3.5">
                      Date
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-border-subtle">

                  {recentInspections.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        navigate(
                          `/inspections/${item.id}`
                        )
                      }
                      className="group cursor-pointer transition hover:bg-surface-hover/70"
                    >

                      <td className="px-5 py-4">
                        <span className="font-mono text-[11px] font-bold text-brand-blue">
                          {item.id}
                        </span>
                      </td>

                      <td className="max-w-[250px] px-5 py-4">
                        <p className="truncate text-sm font-semibold text-text-primary transition group-hover:text-brand-blue">
                          {item.product_name ||
                            'Unknown product'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs text-text-secondary">
                          {item.category ||
                            'Uncategorized'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-surface-subtle px-2 py-1 font-mono text-[10px] font-semibold text-text-muted">
                          {item.rule_version ||
                            '2026.1'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            item.overall_compliance ||
                            'NEEDS_REVIEW'
                          }
                          size="sm"
                        />
                      </td>

                      <td className="px-5 py-4 text-xs text-text-muted">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue">
                          Review

                          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-border-subtle md:hidden">

              {recentInspections.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    navigate(
                      `/inspections/${item.id}`
                    )
                  }
                  className="w-full p-4 text-left transition hover:bg-surface-hover"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold text-text-primary">
                        {item.product_name ||
                          'Unknown product'}
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-brand-blue">
                        {item.id}
                      </p>

                    </div>

                    <StatusBadge
                      status={
                        item.overall_compliance ||
                        'NEEDS_REVIEW'
                      }
                      size="sm"
                    />

                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                    <span>
                      {item.category ||
                        'Uncategorized'}
                    </span>

                    <span>
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                </button>
              ))}

            </div>
          </>
        )}

      </section>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}
      <section>

        <div className="mb-3">
          <h2 className="text-sm font-bold text-text-primary">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-text-muted">
            Continue the inspection workflow
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          <QuickAction
            icon={Plus}
            title="New Inspection"
            description="Create a new evidence-backed inspection"
            onClick={() => navigate('/inspections/new')}
          />

          <QuickAction
            icon={FileSearch}
            title="Inspection Repository"
            description="Review previous inspection records"
            onClick={() => navigate('/inspections')}
          />

          <QuickAction
            icon={ShieldCheck}
            title="Rules Library"
            description="Inspect configured Legal Metrology rules"
            onClick={() => navigate('/rules')}
          />

        </div>
      </section>

    </div>
  );
};

/* =============================================================
   METRIC CARD
============================================================= */

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
  progress?: number;
  progressClass?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
  progress,
  progressClass,
}) => {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle transition hover:shadow-card">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-2.5 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>

      </div>

      {typeof progress === 'number' && progressClass && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-subtle">

          <div
            className={`h-full rounded-full transition-all duration-700 ${progressClass}`}
            style={{
              width: `${Math.max(
                0,
                Math.min(100, progress)
              )}%`,
            }}
          />

        </div>
      )}

      <p className="mt-2 text-[11px] leading-5 text-text-muted">
        {description}
      </p>

    </div>
  );
};

/* =============================================================
   LEGEND
============================================================= */

const Legend: React.FC<{
  className: string;
  label: string;
}> = ({ className, label }) => {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${className}`}
      />
      {label}
    </span>
  );
};

/* =============================================================
   CHART SKELETON
============================================================= */

const ChartSkeleton: React.FC = () => {
  return (
    <div className="flex h-full flex-col justify-end gap-3 rounded-xl bg-surface-subtle p-5">

      <div className="flex h-full items-end gap-3">

        {[35, 55, 42, 70, 48, 78, 60].map(
          (height, index) => (
            <div
              key={index}
              className="flex-1 animate-pulse rounded-t-md bg-border"
              style={{
                height: `${height}%`,
              }}
            />
          )
        )}

      </div>

      <div className="h-2 w-full animate-pulse rounded bg-border" />

    </div>
  );
};

/* =============================================================
   EMPTY CHART
============================================================= */

const EmptyChartState: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-subtle px-6 text-center">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
        <Icon className="h-5 w-5 text-text-muted" />
      </div>

      <p className="mt-3 text-sm font-semibold text-text-secondary">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-xs leading-5 text-text-muted">
        {description}
      </p>

    </div>
  );
};

/* =============================================================
   TABLE SKELETON
============================================================= */

const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-5">

      {[1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="h-12 animate-pulse rounded-lg bg-surface-subtle"
        />
      ))}

    </div>
  );
};

/* =============================================================
   EMPTY TABLE
============================================================= */

const EmptyTableState: React.FC<{
  onCreate: () => void;
}> = ({ onCreate }) => {
  return (
    <div className="p-10 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle">
        <FileSearch className="h-5 w-5 text-text-muted" />
      </div>

      <p className="mt-4 text-sm font-semibold text-text-secondary">
        No inspections available
      </p>

      <p className="mt-1 text-xs text-text-muted">
        Start a new inspection to create the first record.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-bright"
      >
        <Plus className="h-3.5 w-3.5" />
        Start Inspection
      </button>

    </div>
  );
};

/* =============================================================
   QUICK ACTION
============================================================= */

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left shadow-subtle transition hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-card"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-bold text-text-primary">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-text-muted">
          {description}
        </p>

      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-blue" />

    </button>
  );
};
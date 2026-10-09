import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
  ReferenceDot,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Database,
  Users,
  BedDouble,
  CalendarRange,
  Lightbulb,
  Filter,
  Download,
  ExternalLink,
  Github,
  Moon,
  Sun,
  Menu,
  X,
  ArrowUpRight,
  Hotel,
  ShieldCheck,
  Sparkles,
  GitCompareArrows,
  CircleHelp,
  BookOpenText,
  CheckCircle2,
  CalendarX2,
  Percent,
  Banknote,
  LayoutDashboard,
  SlidersHorizontal,
} from 'lucide-react';

const DATASET_URL = 'https://www.kaggle.com/datasets/ahsan81/hotel-reservations-classification-dataset';
const GITHUB_URL = 'https://github.com/viany519/hotel-booking-cancellation-analysis';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'customer', label: 'Customer behaviour', icon: Users },
  { id: 'booking', label: 'Booking characteristics', icon: BedDouble },
  { id: 'seasonal', label: 'Seasonal trend', icon: CalendarRange },
  { id: 'insights', label: 'Key findings', icon: Lightbulb },
];
const COLORS = ['#ff5ea8', '#8b6bff', '#4dd8ff', '#ffc857', '#60d394', '#ff8c69', '#5b8cff'];
const ORDERS = {
  lead_time_category: ['last minute', 'medium term', 'long term'],
  stay_category: ['short', 'medium', 'long'],
  price_category: ['Low Price', 'Medium Price', 'High Price', 'Very High Price'],
  market_segment_type: ['Online', 'Offline', 'Corporate', 'Complementary', 'Aviation'],
  room_type_reserved: ['Room_Type 1', 'Room_Type 4', 'Room_Type 6', 'Room_Type 2', 'Room_Type 5', 'Room_Type 7', 'Room_Type 3'],
};

const fmtNum = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value || 0));
const fmtMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value || 0));
const fmtPct = (value) => `${Number(value || 0).toFixed(2)}%`;

const titleCase = (value) => String(value ?? '')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const toFriendly = (key, value) => {
  if (key === 'arrival_month') return MONTHS[Number(value) - 1] || String(value);
  if (key === 'repeated_guest') return Number(value) === 1 ? 'Returning guest' : 'First-time guest';
  if (key === 'required_car_parking_space') return Number(value) === 1 ? 'Parking required' : 'No parking request';
  if (key === 'family_trip') return value ? 'Family trip' : 'Non-family booking';
  if (key === 'meal_park') return value ? 'Meal and/or parking added' : 'No meal & parking extras';
  if (key === 'weekend_group') {
    if (!value) return 'Weeknights only';
    if (String(value).toLowerCase() === 'weekday') return 'Weekdays only';
    return titleCase(value);
  }
  return titleCase(value);
};

function summarizeBy(rows, key, options = {}) {
  const map = new Map();
  rows.forEach((row) => {
    const raw = options.accessor ? options.accessor(row) : row[key];
    const bucket = raw ?? 'Missing';
    if (!map.has(bucket)) {
      map.set(bucket, { raw: bucket, name: options.labeler ? options.labeler(bucket) : toFriendly(key, bucket), total: 0, canceled: 0 });
    }
    const item = map.get(bucket);
    item.total += 1;
    if (row.isCanceled) item.canceled += 1;
  });

  const data = [...map.values()].map((item) => ({
    ...item,
    confirmed: item.total - item.canceled,
    rate: item.total ? (item.canceled / item.total) * 100 : 0,
  }));

  if (options.order) {
    data.sort((a, b) => options.order.indexOf(a.raw) - options.order.indexOf(b.raw));
  } else {
    data.sort((a, b) => b.total - a.total);
  }

  return data;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <strong>{label}</strong>
      {payload.map((entry, index) => {
        const isRate = String(entry.name).toLowerCase().includes('rate');
        return (
          <div key={`${entry.name}-${index}`}>
            <span style={{ color: entry.color || entry.fill }}>●</span>
            {` ${entry.name}: `}
            <b>{isRate ? fmtPct(entry.value) : fmtNum(entry.value)}</b>
          </div>
        );
      })}
    </div>
  );
}

const Ico = ({ icon: Icon, size = 18 }) => (
  <span className="ico"><Icon size={size} strokeWidth={1.8} /></span>
);

function useTilt(max = 4) {
  const ref = useRef(null);
  const raf = useRef(0);
  const enabled = () => !window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches;
  return {
    ref,
    onPointerMove: (e) => {
      const el = ref.current;
      if (!el || !enabled()) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.classList.add('tilting');
        el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
    },
    onPointerLeave: () => {
      const el = ref.current;
      if (!el) return;
      cancelAnimationFrame(raf.current);
      el.classList.remove('tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    },
  };
}

function Tilt({ className, max = 6, children }) {
  const tilt = useTilt(max);
  return <div className={className} {...tilt}>{children}</div>;
}

function SectionTitle({ title, description }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <Ico icon={Hotel} size={20} />
          <div><strong>Hotel Booking Cancelation Analysis</strong><span>Data Mining & Visualization</span></div>
        </div>
        <nav className="side-nav">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              className="nav-link"
              onClick={() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setMobileOpen(false);
              }}
            >
              <Ico icon={icon} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="side-links">
          <a href={DATASET_URL} target="_blank" rel="noreferrer"><Ico icon={Database} /><span>Kaggle dataset</span></a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer"><Ico icon={Github} /><span>GitHub repository</span></a>
        </div>
      </aside>
    </>
  );
}

function MetricCard({ icon, label, value, helper }) {
  const tilt = useTilt(6);
  return (
    <div className="metric-card" {...tilt}>
      <div className="metric-head"><span>{label}</span><Ico icon={icon} /></div>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function InsightBlurb({ title, body }) {
  return (
    <div className="insight-blurb">
      <h4>{title}</h4>
      <p>{body}</p>
    </div>
  );
}

function Surface({ title, subtitle, children, footer, wide = false }) {
  const tilt = useTilt(wide ? 2 : 4);
  return (
    <article className={`surface ${wide ? 'wide' : ''}`} {...tilt}>
      {(title || subtitle) && (
        <header className="surface-head">
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      <div className="surface-body">{children}</div>
      {footer && (
        <div className="insight">
          <Ico icon={Lightbulb} size={16} />
          <div>
            {typeof footer === 'string' ? <p>{footer}</p> : (
              <>
                <strong>{footer.title}</strong>
                <p>{footer.text}</p>
                {footer.facts?.length > 0 && (
                  <div className="facts">
                    {footer.facts.map((fact) => <div key={fact.label}><b>{fact.value}</b><span>{fact.label}</span></div>)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

const TICK = { fill: 'var(--muted)', fontSize: 12 };
const AX = { tickLine: false, axisLine: false, tick: TICK };
const pct1 = (v) => `${Number(v || 0).toFixed(1)}%`;
const axisPct = (v) => `${v}%`;
const maxDomain = (m) => Math.max(10, Math.ceil((m * 1.2) / 10) * 10);
const TIP = { content: <CustomTooltip />, cursor: { fill: 'var(--cursor)' } };
const LEG = { verticalAlign: 'top', height: 34, iconType: 'circle', iconSize: 9, wrapperStyle: { fontSize: 12, color: 'var(--muted)' } };
const ins = (title, text, facts = []) => ({ title, text, facts });
const BRIEF = [
  { icon: Users, title: 'Customer behaviour', question: 'Do guest characteristics influence cancellation risk?', detail: 'Special requests, first-time versus returning guests, family trips and extra services.' },
  { icon: BedDouble, title: 'Booking characteristics', question: 'Which booking attributes drive reservation instability?', detail: 'Lead time, room price, market segment, room type and length of stay.' },
  { icon: CalendarRange, title: 'Seasonal trend', question: 'How strongly does seasonality shape cancellations?', detail: 'Cancellation rate and booking volume month by month across the year.' },
];
const LABEL = { fill: 'var(--text)', fontSize: 12, fontWeight: 600 };

function BarRateChart({ data, layout = 'horizontal' }) {
  const vertical = layout === 'vertical';
  const top = Math.max(...data.map((d) => d.rate), 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={layout} margin={{ top: 24, right: vertical ? 56 : 12, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="4 5" vertical={vertical} horizontal={!vertical} />
        {vertical && <XAxis type="number" {...AX} domain={[0, maxDomain]} tickFormatter={axisPct} />}
        {vertical && <YAxis type="category" dataKey="name" width={130} {...AX} />}
        {!vertical && <XAxis dataKey="name" {...AX} interval={0} tickMargin={8} />}
        {!vertical && <YAxis {...AX} width={48} domain={[0, maxDomain]} tickFormatter={axisPct} />}
        <Tooltip {...TIP} />
        <Bar dataKey="rate" name="Cancellation rate" radius={vertical ? [0, 8, 8, 0] : [8, 8, 0, 0]} maxBarSize={46}>
          {data.map((d) => <Cell key={d.raw} fill={top > 0 && d.rate === top ? 'var(--coral)' : 'var(--bar-muted)'} />)}
          <LabelList dataKey="rate" position={vertical ? 'right' : 'top'} formatter={pct1} style={LABEL} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MonthlyTrendChart({ data, gid = 'rateFill' }) {
  const peak = [...data].sort((a, b) => b.rate - a.rate)[0];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 34, right: 18, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--coral)" stopOpacity=".38" />
            <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="4 5" vertical={false} />
        <XAxis dataKey="name" {...AX} tickMargin={8} />
        <YAxis {...AX} width={48} domain={[0, maxDomain]} tickFormatter={axisPct} />
        <Tooltip {...TIP} />
        <Area type="monotone" dataKey="rate" name="Cancellation rate" stroke="var(--coral)" strokeWidth={3} fill={`url(#${gid})`} dot={{ r: 3, fill: 'var(--coral)', strokeWidth: 0 }} />
        {peak && (
          <ReferenceDot x={peak.name} y={peak.rate} r={6} fill="var(--coral)" stroke="var(--surface-solid)" strokeWidth={2}
            label={{ value: `Peak ${pct1(peak.rate)}`, position: 'top', fill: 'var(--text)', fontSize: 12, fontWeight: 600 }} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MonthlyVolumeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="4 5" vertical={false} />
        <XAxis dataKey="name" {...AX} tickMargin={8} />
        <YAxis yAxisId="left" {...AX} width={52} tickFormatter={fmtNum} />
        <YAxis yAxisId="right" orientation="right" {...AX} width={48} domain={[0, maxDomain]} tickFormatter={axisPct} />
        <Tooltip {...TIP} />
        <Legend {...LEG} />
        <Bar yAxisId="left" dataKey="confirmed" name="Not canceled" stackId="a" fill="var(--bar-muted)" maxBarSize={30} />
        <Bar yAxisId="left" dataKey="canceled" name="Canceled" stackId="a" fill="var(--coral)" radius={[6, 6, 0, 0]} maxBarSize={30} />
        <Line yAxisId="right" type="monotone" dataKey="rate" name="Cancellation rate" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function StayChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="4 5" vertical={false} />
        <XAxis dataKey="name" {...AX} tickMargin={8} />
        <YAxis yAxisId="left" {...AX} width={52} tickFormatter={fmtNum} />
        <YAxis yAxisId="right" orientation="right" {...AX} width={48} domain={[0, maxDomain]} tickFormatter={axisPct} />
        <Tooltip {...TIP} />
        <Legend {...LEG} />
        <Bar yAxisId="left" dataKey="total" name="Booking volume" fill="var(--bar-muted)" radius={[8, 8, 0, 0]} maxBarSize={56} />
        <Line yAxisId="right" type="monotone" dataKey="rate" name="Cancellation rate" stroke="var(--coral)" strokeWidth={3} dot={{ r: 4, fill: 'var(--coral)', strokeWidth: 0 }}>
          <LabelList dataKey="rate" position="top" formatter={pct1} style={LABEL} />
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function LoyaltyCompare({ data, total }) {
  return (
    <div className="loyalty">
      {data.map((d) => (
        <div className="loyalty-row" key={d.raw}>
          <div className="loyalty-top">
            <div>
              <strong>{d.name}</strong>
              <span>{fmtNum(d.total)} bookings, {pct1(total ? (d.total / total) * 100 : 0)} of all reservations</span>
            </div>
            <div className="loyalty-rate"><b className={Number(d.raw) === 0 ? 'hot' : 'ok'}>{pct1(d.rate)}</b><span>canceled</span></div>
          </div>
          <div className="stack" role="img" aria-label={`${d.name}: ${pct1(d.rate)} canceled`}>
            <i className="c" style={{ width: `${Math.max(d.rate, d.canceled ? 2 : 0)}%` }} />
            <i className="k" />
          </div>
          <div className="stack-legend">
            <span><i className="c" />{fmtNum(d.canceled)} canceled</span>
            <span><i className="k" />{fmtNum(d.confirmed)} kept</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExposureList({ data }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const maxRate = Math.max(...data.map((d) => d.rate), 1);
  return (
    <div className="exposure">
      <div className="exposure-row head"><span>Segment</span><span>Booking volume</span><span>Cancellation rate</span></div>
      {data.map((d) => (
        <div className="exposure-row" key={d.raw}>
          <strong>{d.name}</strong>
          <div className="xbar"><div className="track"><i style={{ width: `${(d.total / maxTotal) * 100}%` }} /></div><b>{fmtNum(d.total)}</b></div>
          <div className="xbar"><div className="track"><i className={d.rate === maxRate ? 'hot' : 'warm'} style={{ width: `${(d.rate / maxRate) * 100}%` }} /></div><b>{pct1(d.rate)}</b></div>
        </div>
      ))}
    </div>
  );
}

function StatusDonut({ canceled, confirmed }) {
  const total = canceled + confirmed;
  const data = [{ name: 'Canceled', value: canceled }, { name: 'Not canceled', value: confirmed }];
  return (
    <div className="donut">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={3} stroke="none">
              <Cell fill="var(--coral)" />
              <Cell fill="var(--steel)" />
            </Pie>
            <Tooltip formatter={(value) => fmtNum(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><strong>{total ? pct1((canceled / total) * 100) : '-'}</strong><span>canceled</span></div>
      </div>
      <ul className="donut-legend">
        <li><i style={{ background: 'var(--coral)' }} />Canceled <b>{fmtNum(canceled)}</b></li>
        <li><i style={{ background: 'var(--steel)' }} />Not canceled <b>{fmtNum(confirmed)}</b></li>
      </ul>
    </div>
  );
}

function ComparisonRows({ rows }) {
  return (
    <div className="comparison-rows">
      {rows.map((item) => (
        <div key={item.label} className="comparison-row">
          <div className="comparison-head">
            <strong>{item.label}</strong>
            <span>{fmtPct(item.rate)}</span>
          </div>
          <div className="comparison-bar">
            <div className="comparison-fill" style={{ width: `${Math.min(item.rate, 100)}%` }} />
          </div>
          <p>{item.note}</p>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ index, title, summary, takeaway }) {
  return (
    <div className="finding-card">
      <Ico icon={index % 3 === 1 ? Users : index % 3 === 2 ? BedDouble : CalendarRange} />
      <div>
        <h4>{title}</h4>
        <p>{summary}</p>
        <div className="finding-takeaway">
          <CheckCircle2 size={16} />
          <span>{takeaway}</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [dataset, setDataset] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('dmv-theme') || 'light');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('dmv-theme', theme);
  }, [theme]);

  useEffect(() => {
    Promise.all([
      fetch('/data/records.json').then((response) => {
        if (!response.ok) throw new Error('Unable to load records.json');
        return response.json();
      }),
      fetch('/data/metadata.json').then((response) => response.json()),
    ])
      .then(([records, meta]) => {
        setDataset(records);
        setMetadata(meta);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const records = useMemo(() => {
    if (!dataset) return [];
    return dataset.records.map((row) => {
      const item = Object.fromEntries(dataset.columns.map((column, index) => [column, row[index]]));
      return {
        ...item,
        isCanceled: item.booking_status === 'Canceled',
        monthName: MONTHS[Number(item.arrival_month) - 1],
        weekend_group: item.weekend_group || (Number(item.no_of_weekend_nights) === 0 ? 'weekday' : 'mixed'),
      };
    });
  }, [dataset]);

  const filteredRows = useMemo(() => records.filter((row) => {
    const yearOkay = yearFilter === 'all' || String(row.arrival_year) === yearFilter;
    const segmentOkay = segmentFilter === 'all' || row.market_segment_type === segmentFilter;
    return yearOkay && segmentOkay;
  }), [records, yearFilter, segmentFilter]);

  const overview = useMemo(() => {
    const total = filteredRows.length;
    const canceled = filteredRows.filter((row) => row.isCanceled).length;
    const confirmed = total - canceled;
    const cancelRate = total ? (canceled / total) * 100 : 0;
    const avgPrice = total ? filteredRows.reduce((sum, row) => sum + Number(row.avg_price_per_room || 0), 0) / total : 0;
    const avgLead = total ? filteredRows.reduce((sum, row) => sum + Number(row.lead_time || 0), 0) / total : 0;
    const avgStay = total ? filteredRows.reduce((sum, row) => sum + Number(row.total_stay_nights || 0), 0) / total : 0;
    return { total, canceled, confirmed, cancelRate, avgPrice, avgLead, avgStay };
  }, [filteredRows]);

  const monthly = useMemo(() => summarizeBy(filteredRows, 'arrival_month', { order: Array.from({ length: 12 }, (_, index) => index + 1) }).map((item) => ({ ...item, name: MONTHS[Number(item.raw) - 1] })), [filteredRows]);

  const specialRequestData = useMemo(() => {
    const buckets = [
      { key: '0', name: '0 request', match: (row) => Number(row.no_of_special_requests) === 0 },
      { key: '1', name: '1 request', match: (row) => Number(row.no_of_special_requests) === 1 },
      { key: '2', name: '2 requests', match: (row) => Number(row.no_of_special_requests) === 2 },
      { key: '3+', name: '3+ requests', match: (row) => Number(row.no_of_special_requests) >= 3 },
    ];
    return buckets.map((bucket) => {
      const rows = filteredRows.filter(bucket.match);
      const canceled = rows.filter((row) => row.isCanceled).length;
      return {
        raw: bucket.key,
        name: bucket.name,
        total: rows.length,
        canceled,
        confirmed: rows.length - canceled,
        rate: rows.length ? (canceled / rows.length) * 100 : 0,
      };
    });
  }, [filteredRows]);

  const loyaltyData = useMemo(() => summarizeBy(filteredRows, 'repeated_guest', { order: [0, 1] }), [filteredRows]);
  const leadTimeData = useMemo(() => summarizeBy(filteredRows, 'lead_time_category', { order: ORDERS.lead_time_category }), [filteredRows]);
  const priceData = useMemo(() => summarizeBy(filteredRows, 'price_category', { order: ORDERS.price_category }), [filteredRows]);
  const segmentData = useMemo(() => summarizeBy(filteredRows, 'market_segment_type', { order: ORDERS.market_segment_type }).filter((item) => item.total > 0), [filteredRows]);
  const stayData = useMemo(() => summarizeBy(filteredRows, 'stay_category', { order: ORDERS.stay_category }), [filteredRows]);
  const roomTypeData = useMemo(() => summarizeBy(filteredRows, 'room_type_reserved', { order: ORDERS.room_type_reserved }), [filteredRows]);

  const comparisonData = useMemo(() => {
    const compare = (label, predicate, note) => {
      const rows = filteredRows.filter(predicate);
      const canceled = rows.filter((row) => row.isCanceled).length;
      return { label, rate: rows.length ? (canceled / rows.length) * 100 : 0, note };
    };
    return [
      compare('Family trip', (row) => Number(row.family_trip) === 1, 'Family bookings are slightly more likely to be canceled than non-family bookings.'),
      compare('Meal / parking extras', (row) => Number(row.meal_park) === 1, 'Adding meal or parking extras shows only a modest effect compared with stronger factors.'),
      compare('Parking required', (row) => Number(row.required_car_parking_space) === 1, 'Parking requests are associated with a much lower cancellation rate and stronger commitment.'),
      compare('No special request', (row) => Number(row.no_of_special_requests) === 0, 'No special request is the clearest early warning sign of weak booking commitment.'),
    ];
  }, [filteredRows]);

  const methodologyCards = [
    { title: '1. Data understanding', text: 'Reviewed guest attributes, booking features, room information, stay composition, and arrival timing.' },
    { title: '2. Data cleaning', text: 'Used the cleaned dataset provided in the project files. The processed dataset contains 35,639 records and 30 fields.' },
    { title: '3. Feature preparation', text: 'Used engineered variables such as lead time category, price category, stay category, family trip, and weekend composition.' },
    { title: '4. EDA & visualization', text: 'Compared booking cancellation patterns across customer behaviour, booking characteristics, and seasonal trends.' },
  ];

  const findings = useMemo(() => {
    const highestMonth = [...monthly].sort((a, b) => b.rate - a.rate)[0];
    const highestMonthVolume = [...monthly].sort((a, b) => b.canceled - a.canceled)[0];
    const lowestRiskSegment = [...segmentData].sort((a, b) => a.rate - b.rate)[0];
    const highestRiskLead = [...leadTimeData].sort((a, b) => b.rate - a.rate)[0];
    const highestPriceRisk = [...priceData].sort((a, b) => b.rate - a.rate)[0];
    return [
      {
        title: 'Bookings with no special request are the most fragile.',
        summary: `Bookings without any special request have a cancellation rate of ${fmtPct(specialRequestData[0]?.rate)}. Once guests submit at least one request, the risk falls sharply.`,
        takeaway: 'Special requests can be used as an early signal of guest commitment.',
      },
      {
        title: 'Returning guests almost never cancel.',
        summary: `First-time guests dominate the dataset and cancel far more often, while returning guests show a cancellation rate of only ${fmtPct(loyaltyData[1]?.rate)}.`,
        takeaway: 'Guest loyalty is one of the strongest stability indicators in the reservation pipeline.',
      },
      {
        title: 'Long lead times create the highest timing risk.',
        summary: `${highestRiskLead?.name} bookings have the highest cancellation rate at ${fmtPct(highestRiskLead?.rate)}, well above medium-term and last-minute reservations.`,
        takeaway: 'Long lead-time reservations need earlier reminders, deposits, or reconfirmation strategies.',
      },
      {
        title: 'Online bookings create the biggest operational exposure.',
        summary: `Online is the largest segment by volume and also carries a ${fmtPct(segmentData.find((item) => item.raw === 'Online')?.rate)} cancellation rate, while ${lowestRiskSegment?.name} is the lowest-risk segment.`,
        takeaway: 'Volume and risk are concentrated in the online channel, so it deserves close monitoring.',
      },
      {
        title: 'High-value and long-stay bookings deserve special attention.',
        summary: `${highestPriceRisk?.name} bookings have the highest price-related cancellation risk, and long stays reach ${fmtPct(stayData.find((item) => item.raw === 'long')?.rate)}.`,
        takeaway: 'Pricing policy and stay length should be considered when designing cancellation control rules.',
      },
      {
        title: 'Seasonal risk peaks in July, but October generates the most cancellations.',
        summary: `${highestMonth?.name} has the highest cancellation rate at ${fmtPct(highestMonth?.rate)}, while ${highestMonthVolume?.name} contributes the most canceled bookings because total booking volume is highest.`,
        takeaway: 'Hotels should distinguish between high-rate risk and high-volume exposure when planning peak season.',
      },
    ];
  }, [leadTimeData, loyaltyData, monthly, priceData, segmentData, specialRequestData, stayData]);

  const roomTable = useMemo(() => roomTypeData.map((item) => ({
    room: item.name,
    total: item.total,
    canceled: item.canceled,
    rate: item.rate,
  })), [roomTypeData]);

  const seasonalHighlights = useMemo(() => ({
    highestRate: [...monthly].sort((a, b) => b.rate - a.rate)[0],
    mostCanceled: [...monthly].sort((a, b) => b.canceled - a.canceled)[0],
    lowestRate: [...monthly].sort((a, b) => a.rate - b.rate)[0],
  }), [monthly]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return undefined;
    const root = document.documentElement;
    const move = (e) => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  const notes = useMemo(() => {
    const by = (arr, raw) => arr.find((i) => i.raw === raw);
    const rateOf = (pred) => {
      const rows = filteredRows.filter(pred);
      return rows.length ? (rows.filter((r) => r.isCanceled).length / rows.length) * 100 : 0;
    };
    const pick = (arr, key, dir = -1) => [...arr].sort((a, b) => dir * (a[key] - b[key]))[0];
    const f = (label, value) => ({ label, value });
    const share = (item) => pct1(overview.total && item ? (item.total / overview.total) * 100 : 0);
    const hi = pick(monthly, 'rate');
    const lo = pick(monthly, 'rate', 1);
    const vol = pick(monthly, 'canceled');
    const [sr0, sr1, sr2, sr3] = ['0', '1', '2', '3+'].map((k) => by(specialRequestData, k));
    const first = by(loyaltyData, 0);
    const ret = by(loyaltyData, 1);
    const lt = (k) => by(leadTimeData, k);
    const pr = (k) => by(priceData, k);
    const topPrice = pick(priceData, 'rate');
    const online = by(segmentData, 'Online');
    const corp = by(segmentData, 'Corporate');
    const st = (k) => by(stayData, k);
    const bigRoom = pick(roomTypeData, 'total');
    const riskyRoom = pick(roomTypeData.filter((r) => r.total >= 100), 'rate');
    const fam = rateOf((r) => Number(r.family_trip) === 1);
    const nonFam = rateOf((r) => Number(r.family_trip) !== 1);
    const meal = rateOf((r) => Number(r.meal_park) === 1);
    const park = rateOf((r) => Number(r.required_car_parking_space) === 1);
    return {
      peak: hi,
      trend: ins(
        `${hi?.name} is the riskiest month`,
        `The cancellation rate climbs from ${fmtPct(lo?.rate)} in ${lo?.name} to a peak of ${fmtPct(hi?.rate)} in ${hi?.name}, then eases toward the end of the year. Forecasts for the months around the peak need the most conservative assumptions about how many reservations will really show up.`,
        [f('Peak month', hi?.name), f('Peak rate', fmtPct(hi?.rate)), f('Lowest rate', fmtPct(lo?.rate))],
      ),
      donut: ins(
        `About ${Math.round(overview.cancelRate)} in every 100 bookings are canceled`,
        `${fmtNum(overview.canceled)} of ${fmtNum(overview.total)} reservations ended in a cancellation. Each one is a room that was sold on paper but may stay empty, which is exactly why cancellations make occupancy and revenue hard to predict.`,
        [f('Canceled', fmtNum(overview.canceled)), f('Kept', fmtNum(overview.confirmed)), f('Rate', fmtPct(overview.cancelRate))],
      ),
      volume: ins(
        'High volume and high risk peak in different months',
        `${vol?.name} records the most canceled bookings (${fmtNum(vol?.canceled)}) simply because it is the busiest month, while ${hi?.name} has the highest cancellation rate at ${fmtPct(hi?.rate)}. Volume decides how many rooms are affected; the rate decides how likely a single booking is to fall through. Hotels need to plan for both.`,
        [f('Most canceled', `${vol?.name} (${fmtNum(vol?.canceled)})`), f('Highest rate', `${hi?.name} (${fmtPct(hi?.rate)})`)],
      ),
      special: ins(
        'More special requests, fewer cancellations',
        `Guests who made no request canceled ${fmtPct(sr0?.rate)} of the time. With one request the rate falls to ${fmtPct(sr1?.rate)}, and with two to ${fmtPct(sr2?.rate)}. Guests with three or more requests did not cancel at all, although that group is small (${fmtNum(sr3?.total)} bookings). A special request is a cheap early sign that the guest intends to come.`,
        [f('No request', fmtPct(sr0?.rate)), f('1 request', fmtPct(sr1?.rate)), f('2 requests', fmtPct(sr2?.rate))],
      ),
      loyalty: ins(
        'Returning guests are the most reliable segment',
        `First-time guests make up ${share(first)} of bookings and cancel ${fmtPct(first?.rate)} of them. Returning guests are only ${share(ret)} of bookings but cancel just ${fmtPct(ret?.rate)}. Rebooking offers and loyalty perks could protect this stable group and grow its share.`,
        [f('First-time guests', fmtPct(first?.rate)), f('Returning guests', fmtPct(ret?.rate)), f('Returning share', share(ret))],
      ),
      support: ins(
        'Practical commitment matters more than trip type',
        `Family trips cancel at ${fmtPct(fam)} versus ${fmtPct(nonFam)} for other bookings, and meal or parking extras barely move the rate (${fmtPct(meal)}). Guests who request a parking space, however, cancel at only ${fmtPct(park)}. Signals that a guest has made concrete arrangements separate stayers from leavers better than the type of trip.`,
        [f('Family trip', fmtPct(fam)), f('Other bookings', fmtPct(nonFam)), f('Parking requested', fmtPct(park))],
      ),
      lead: ins(
        'The earlier guests book, the more likely they are to cancel',
        `Long-term bookings (made more than about 30 days ahead) are canceled ${fmtPct(lt('long term')?.rate)} of the time, against ${fmtPct(lt('medium term')?.rate)} for medium-term and only ${fmtPct(lt('last minute')?.rate)} for last-minute bookings. Plans change over a long window, while a last-minute guest has already decided.`,
        [f('Long term', fmtPct(lt('long term')?.rate)), f('Medium term', fmtPct(lt('medium term')?.rate)), f('Last minute', fmtPct(lt('last minute')?.rate))],
      ),
      price: ins(
        `${topPrice?.name} bookings are canceled most often`,
        `The cancellation rate rises from ${fmtPct(pr('Low Price')?.rate)} for low-price rooms to ${fmtPct(pr('Medium Price')?.rate)} for medium and ${fmtPct(pr('High Price')?.rate)} for high-price rooms, and stays elevated at ${fmtPct(pr('Very High Price')?.rate)} for the very high tier. A pricier stay is a bigger decision, so guests may keep comparing options after they book.`,
        [f('Low price', fmtPct(pr('Low Price')?.rate)), f('High price', fmtPct(pr('High Price')?.rate)), f('Very high price', fmtPct(pr('Very High Price')?.rate))],
      ),
      segment: ins(
        'Online is both the biggest and the riskiest channel',
        `Online brings in ${fmtNum(online?.total)} bookings (${share(online)} of the total) with a ${fmtPct(online?.rate)} cancellation rate. Corporate bookings are the steadiest at ${fmtPct(corp?.rate)}, and complementary bookings were never canceled. Because Online combines volume and risk, small improvements there have the largest effect on occupancy.`,
        [f('Online volume', fmtNum(online?.total)), f('Online rate', fmtPct(online?.rate)), f('Corporate rate', fmtPct(corp?.rate))],
      ),
      stay: ins(
        'Short stays dominate, long stays are the riskiest',
        `Short stays account for ${fmtNum(st('short')?.total)} bookings at a ${fmtPct(st('short')?.rate)} cancellation rate. Long stays are rare (${fmtNum(st('long')?.total)} bookings) but are canceled ${fmtPct(st('long')?.rate)} of the time, so the rate looks alarming while the total impact stays small. Volume and rate need to be read together.`,
        [f('Short stay', fmtPct(st('short')?.rate)), f('Medium stay', fmtPct(st('medium')?.rate)), f('Long stay', fmtPct(st('long')?.rate))],
      ),
      room: ins(
        `${bigRoom?.name} carries the volume, ${riskyRoom?.name} the risk`,
        `${bigRoom?.name} has ${fmtNum(bigRoom?.total)} bookings (${share(bigRoom)} of the total) with a ${fmtPct(bigRoom?.rate)} cancellation rate, so it drives most of the operational exposure. ${riskyRoom?.name} has the highest rate among room types with a meaningful sample, at ${fmtPct(riskyRoom?.rate)}. Room types with very few bookings should be interpreted cautiously.`,
        [f(`${bigRoom?.name} rate`, fmtPct(bigRoom?.rate)), f(`${riskyRoom?.name} rate`, fmtPct(riskyRoom?.rate))],
      ),
      season: ins(
        'Cancellation risk follows a clear seasonal curve',
        `${lo?.name} is the calmest month at ${fmtPct(lo?.rate)}. Risk then builds steadily to ${fmtPct(hi?.rate)} in ${hi?.name} before dropping sharply toward the end of the year. Knowing where the curve peaks helps hotels decide when to ask for deposits or hold back inventory for overbooking.`,
        [f('Calmest', `${lo?.name} (${fmtPct(lo?.rate)})`), f('Riskiest', `${hi?.name} (${fmtPct(hi?.rate)})`)],
      ),
    };
  }, [filteredRows, monthly, specialRequestData, loyaltyData, leadTimeData, priceData, segmentData, stayData, roomTypeData, overview]);

  if (loading) {
    return <div className="loading-state">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="loading-state error-state">Failed to load dashboard data: {error}</div>;
  }

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true"><span className="o1" /><span className="o2" /><span className="o3" /><span className="o4" /><b className="glow" /><i /></div>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-only" onClick={() => setMobileOpen((current) => !current)} aria-label="Toggle menu">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1>Hotel Booking Cancelation Analysis</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <a className="icon-button" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="Open GitHub repository">
              <Github size={18} />
            </a>
            <button className="icon-button" onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <div className="content-wrap">
          <section id="overview" className="hero-section">
            <div className="hero-panel">
              <div className="hero-copy">
                                <h2>What makes hotel guests cancel their bookings?</h2>
                <p>
                  Bookings that get canceled make hotel demand hard to plan. Industry figures from the project slides show the problem: in Portugal in 2018 hotels earned more per room (ADR €79.8, RevPAR €52.2), yet occupancy slipped 1.7% to 65.4%.
                </p>
                <p>
                  Cancellations are one clear source of that instability. This project explores {fmtNum(metadata?.cleanRows)} reservations from the Kaggle Hotel Reservations Classification dataset ({(metadata?.years || []).join('-')}) to find which guest, booking and seasonal factors separate reservations that are kept from those that are canceled.
                </p>
                <div className="hero-stats">
                  <div><b>€3.6B</b><span>Portugal tourism revenue 2018, up 6.0%</span></div>
                  <div><b>65.4%</b><span>Portugal hotel occupancy 2018, down 1.7%</span></div>
                  <div><b>{fmtPct(notes.peak?.rate)}</b><span>Cancellation rate in {notes.peak?.name}, the riskiest month</span></div>
                </div>
                <div className="hero-actions">
                  <a className="primary-button" href={DATASET_URL} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} /> Kaggle dataset
                  </a>
                  <a className="secondary-button" href={GITHUB_URL} target="_blank" rel="noreferrer">
                    <Github size={16} /> GitHub repository
                  </a>
                </div>
              </div>
              <div className="hero-visual">
                <Tilt className="hotel-card" max={7}>
                  <img src="/assets/hotel-room.png" alt="Hotel room inspiration" />
                  <div className="hotel-card-caption">
                    <span>Project context</span>
                    <strong>Hospitality operations and occupancy stability</strong>
                  </div>
                </Tilt>
              </div>
            </div>

            <div className="brief-grid">
              {BRIEF.map(({ icon, title, question, detail }) => (
                <div className="brief-card" key={title}>
                  <Ico icon={icon} />
                  <div><h3>{title}</h3><p className="q">{question}</p><p>{detail}</p></div>
                </div>
              ))}
            </div>

            <div className="filter-panel">
              <div className="filter-head">
                <SlidersHorizontal size={18} />
                <span>Interactive filters</span>
              </div>
              <label>
                Year
                <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                  <option value="all">All years</option>
                  {(metadata?.years || []).map((year) => <option key={year} value={String(year)}>{year}</option>)}
                </select>
              </label>
              <label>
                Market segment
                <select value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value)}>
                  <option value="all">All segments</option>
                  {(metadata?.categories?.market_segment_type || []).map((segment) => <option key={segment} value={segment}>{segment}</option>)}
                </select>
              </label>
              <button className="text-button" onClick={() => { setYearFilter('all'); setSegmentFilter('all'); }}>
                Reset filters
              </button>
            </div>

            <div className="metric-grid">
              <MetricCard icon={Hotel} label="Total bookings" value={fmtNum(overview.total)} helper="Filtered observation count" />
              <MetricCard icon={CalendarX2} label="Canceled bookings" value={fmtNum(overview.canceled)} helper="Reservations with status Canceled" />
              <MetricCard icon={Percent} label="Cancellation rate" value={fmtPct(overview.cancelRate)} helper="Canceled / total bookings" />
              <MetricCard icon={Banknote} label="Average room price" value={fmtMoney(overview.avgPrice)} helper={`Average stay ${overview.avgStay.toFixed(1)} nights`} />
            </div>

            <div className="dashboard-grid two-up">
              <Surface
                title="Monthly cancellation rate"
                subtitle="Use this chart to track seasonality in cancellation risk."
                footer={notes.trend}
              >
                <MonthlyTrendChart data={monthly} />
              </Surface>
              <Surface
                title="Booking status overview"
                subtitle="A quick snapshot of canceled versus completed reservations."
                footer={notes.donut}
              >
                <StatusDonut canceled={overview.canceled} confirmed={overview.confirmed} />
              </Surface>
            </div>

            <div className="dashboard-grid">
              <Surface
                wide
                title="Monthly booking volume + cancellation rate"
                subtitle="Stacked bars show canceled and not canceled bookings. The line shows rate, so volume and risk can be read separately."
                footer={notes.volume}
              >
                <MonthlyVolumeChart data={monthly} />
              </Surface>
            </div>
          </section>

          <section id="dataset">
            <SectionTitle
              title="Dataset profile and project methodology"
              description="This section explains the dataset source, project scope, important variables, and the EDA process used to produce the insights in the dashboard."
            />

            <div className="dashboard-grid two-up">
              <Surface title="Dataset summary" subtitle="Hotel Reservations Classification Dataset from Kaggle.">
                <div className="summary-list">
                  <div><strong>Source</strong><span>Kaggle — Hotel Reservations Classification Dataset</span></div>
                  <div><strong>Original rows</strong><span>{fmtNum(metadata?.rawRows)}</span></div>
                  <div><strong>Clean rows used</strong><span>{fmtNum(metadata?.cleanRows)}</span></div>
                  <div><strong>Derived features</strong><span>{fmtNum(metadata?.totalFields)} total fields after feature engineering</span></div>
                  <div><strong>Year coverage</strong><span>{(metadata?.years || []).join(', ')}</span></div>
                </div>
                <div className="link-row">
                  <a href={DATASET_URL} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open dataset page</a>
                  <a href="/data/cleaned_dataset.csv" download><Download size={15} /> Download cleaned CSV</a>
                </div>
              </Surface>

              <Surface title="What the dataset contains" subtitle="Main variable groups used in the analysis.">
                <div className="pill-cloud">
                  {['booking_status', 'market_segment_type', 'room_type_reserved', 'lead_time', 'avg_price_per_room', 'no_of_special_requests', 'repeated_guest', 'arrival_month', 'total_stay_nights', 'type_of_meal_plan', 'required_car_parking_space', 'stay_category', 'lead_time_category', 'price_category'].map((field) => (
                    <span key={field}>{field}</span>
                  ))}
                </div>
                <p className="muted-copy">
                  The analysis focuses on three big themes: <b>customer behaviour</b>, <b>booking characteristics</b>, and <b>seasonal timing</b>. Those themes match the structure used in the notebook and presentation slides.
                </p>
              </Surface>
            </div>

            <div className="dashboard-grid methodology-grid">
              {methodologyCards.map((card) => (
                <Surface key={card.title} title={card.title}>
                  <p className="muted-copy">{card.text}</p>
                </Surface>
              ))}
            </div>
          </section>

          <section id="customer">
            <SectionTitle
              title="Customer behaviour indicators"
              description="These visuals focus on guest-side behaviour. The goal is to identify which customer signals most clearly separate stable bookings from risky ones."
            />

            <div className="section-story">
              <InsightBlurb title="How to read this section" body="The first chart highlights the strongest signal: special requests. The second chart compares first-time and returning guests. The final card summarizes supporting customer-related indicators so the story is easier to follow." />
            </div>

            <div className="dashboard-grid two-up">
              <Surface
                title="Special requests vs cancellation rate"
                subtitle="This chart is used because the insight is ordinal: more requests usually mean stronger booking commitment."
                footer={notes.special}
              >
                <BarRateChart data={specialRequestData} />
              </Surface>

              <Surface
                title="Guest loyalty comparison"
                subtitle="Bookings split by first-time and returning guests, with the share that ended in cancellation."
                footer={notes.loyalty}
              >
                <LoyaltyCompare data={loyaltyData} total={overview.total} />
              </Surface>
            </div>

            <div className="dashboard-grid two-up">
              <Surface
                title="Supporting customer-related indicators"
                subtitle="These rows summarize other behavioural signals without overwhelming the page with unnecessary charts."
                footer={notes.support}
              >
                <ComparisonRows rows={comparisonData} />
              </Surface>

              <Surface title="Customer behaviour takeaway" subtitle="Main interpretation from the customer side.">
                <div className="callout-card">
                  <CircleHelp size={18} />
                  <div>
                    <strong>Main message</strong>
                    <p>
                      Stronger booking intent is visible when guests leave more traces of commitment: repeated visits, special requests, or parking requirements.
                      In contrast, guests who book with no requests and no relationship history are much more likely to cancel.
                    </p>
                  </div>
                </div>
                <div className="mini-stats">
                  <div>
                    <span>No special request</span>
                    <strong>{fmtPct(comparisonData.find((item) => item.label === 'No special request')?.rate)}</strong>
                  </div>
                  <div>
                    <span>Returning guest</span>
                    <strong>{fmtPct(loyaltyData[1]?.rate)}</strong>
                  </div>
                  <div>
                    <span>Parking required</span>
                    <strong>{fmtPct(comparisonData.find((item) => item.label === 'Parking required')?.rate)}</strong>
                  </div>
                </div>
              </Surface>
            </div>
          </section>

          <section id="booking">
            <SectionTitle
              title="Booking attributes that shape cancellation risk"
              description="This section focuses on reservation-side attributes: timing, price, channel, room type, and length of stay. Each chart is chosen to match the type of insight being explained."
            />

            <div className="dashboard-grid two-up">
              <Surface
                title="Lead time category"
                subtitle="A bar chart is the clearest way to compare short, medium, and long reservation windows."
                footer={notes.lead}
              >
                <BarRateChart data={leadTimeData} />
              </Surface>

              <Surface
                title="Price category"
                subtitle="Cancellation risk rises with room price, so a sorted rate comparison is appropriate here."
                footer={notes.price}
              >
                <BarRateChart data={priceData} />
              </Surface>
            </div>

            <div className="dashboard-grid two-up">
              <Surface
                title="Market segment exposure"
                subtitle="This combined chart shows volume and rate together, making it easier to identify operational exposure."
                footer={notes.segment}
              >
                <ExposureList data={segmentData} />
              </Surface>

              <Surface
                title="Stay duration"
                subtitle="Short stays drive the most volume, but long stays have the highest cancellation rate."
                footer={notes.stay}
              >
                <StayChart data={stayData} />
              </Surface>
            </div>

            <div className="dashboard-grid two-up">
              <Surface title="Room type overview" subtitle="Volume and cancellation rate side by side for each room type." footer={notes.room}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Room type</th>
                        <th>Total bookings</th>
                        <th>Canceled</th>
                        <th>Cancellation rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomTable.map((row) => (
                        <tr key={row.room}>
                          <td>{row.room}</td>
                          <td>{fmtNum(row.total)}</td>
                          <td>{fmtNum(row.canceled)}</td>
                          <td><span className="table-pill">{fmtPct(row.rate)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Surface>

              <Surface title="Booking takeaway" subtitle="Main interpretation from the booking side.">
                <div className="callout-card alt">
                  <BookOpenText size={18} />
                  <div>
                    <strong>Main message</strong>
                    <p>
                      Reservation instability is driven most strongly by <b>long lead times</b>, <b>online channel exposure</b>, <b>high room prices</b>, and <b>long stays</b>.
                      These are practical levers for pricing, reminder timing, and cancellation policy design.
                    </p>
                  </div>
                </div>
                <ul className="bullet-notes">
                  <li>Online contributes the largest booking volume.</li>
                  <li>Corporate is the lowest-risk segment among the main channels.</li>
                  <li>Room Type 1 has the largest operational exposure due to volume.</li>
                  <li>Very small categories should be interpreted carefully because of limited sample size.</li>
                </ul>
              </Surface>
            </div>
          </section>

          <section id="seasonal">
            <SectionTitle
              title="When cancellations happen"
              description="Seasonal visuals answer two questions: when is the cancellation rate highest, and when does the hotel absorb the largest number of actual cancellations?"
            />

            <div className="dashboard-grid two-up">
              <Surface title="Cancellation rate by arrival month" subtitle="Share of bookings canceled, by month of arrival." footer={notes.season}>
                <MonthlyTrendChart data={monthly} gid="rateFill2" />
              </Surface>
              <Surface title="Monthly cancellation exposure" subtitle="Bars show booking counts; the line shows the cancellation rate." footer={notes.volume}>
                <MonthlyVolumeChart data={monthly} />
              </Surface>
            </div>

            <div className="seasonal-summary">
              <div className="seasonal-box">
                <span>Highest rate month</span>
                <strong>{seasonalHighlights.highestRate?.name}</strong>
                <small>{fmtPct(seasonalHighlights.highestRate?.rate)}</small>
              </div>
              <div className="seasonal-box">
                <span>Most canceled bookings</span>
                <strong>{seasonalHighlights.mostCanceled?.name}</strong>
                <small>{fmtNum(seasonalHighlights.mostCanceled?.canceled)} canceled bookings</small>
              </div>
              <div className="seasonal-box">
                <span>Lowest rate month</span>
                <strong>{seasonalHighlights.lowestRate?.name}</strong>
                <small>{fmtPct(seasonalHighlights.lowestRate?.rate)}</small>
              </div>
            </div>
          </section>

          <section id="insights">
            <SectionTitle
              title="Ordered summary of the main insights"
              description="This final section condenses the analysis into a structured sequence. It is intentionally ordered so the story flows from customer intent, to booking configuration, to seasonal timing."
            />
            <div className="findings-grid">
              {findings.map((finding, index) => (
                <InsightCard key={finding.title} index={index + 1} title={finding.title} summary={finding.summary} takeaway={finding.takeaway} />
              ))}
            </div>
          </section>

          <footer className="page-footer">
            <div>
              <strong>Project:</strong> Hotel Booking Cancelation Analysis — Understanding Hotel Booking Cancellation Factors
            </div>
            <div>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub repository</a>
              <span> · </span>
              <a href={DATASET_URL} target="_blank" rel="noreferrer">Kaggle dataset</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;

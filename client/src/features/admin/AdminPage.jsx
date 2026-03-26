import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  createAdminCab,
  createAdminRoute,
  getAdminCabs,
  getAdminRoutes,
  getAdminSiteContent,
  getAuditLogs,
  getBookingAlerts,
  getCorporateEnquiries,
  getHealthSummary,
  listBookings,
  updateAdminSiteContent,
  updateBookingStatus,
} from '../../shared/api/endpoints';
import { Alert } from '../../shared/ui/Alert';

const tabs = ['present', 'planned', 'past'];
const ADMIN_NAV_GROUPS = [
  {
    title: 'Booking Ops',
    tone: {
      shell: 'border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-blue-50/80',
      title: 'text-indigo-500',
      chip: 'border-indigo-100 bg-white/90 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
    },
    links: [
      { label: 'Overview', href: '#section-overview' },
      { label: 'Bookings', href: '#section-bookings' },
      { label: 'Corporate Leads', href: '#section-corporate-leads' },
      { label: 'Routes & Cabs', href: '#section-routes-&-cabs' },
    ],
  },
  {
    title: 'Health & Insights',
    tone: {
      shell: 'border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-cyan-50/70',
      title: 'text-emerald-500',
      chip: 'border-emerald-100 bg-white/90 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700',
    },
    links: [
      { label: 'System Health', href: '#section-system-health' },
      { label: 'Revenue Analytics', href: '#section-analytics' },
      { label: 'Audit Logs', href: '#section-audit-logs' },
    ],
  },
  {
    title: 'Site Customization',
    tone: {
      shell: 'border-violet-100 bg-gradient-to-br from-white via-violet-50/65 to-fuchsia-50/70',
      title: 'text-violet-500',
      chip: 'border-violet-100 bg-white/90 text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700',
    },
    links: [
      { label: 'Site Content', href: '#section-site-content' },
    ],
  },
];
const ADMIN_SECTION_IDS = ADMIN_NAV_GROUPS.flatMap((group) => group.links.map((link) => link.href.replace('#', '')));
const DEFAULT_SITE_CONTENT = {
  heroVariant: 'cinematic',
  footer: {
    description: "India's premier intercity travel platform, bridging the gap between comfort and affordability.",
    phone: '1800-SAFAR-EXP',
    email: 'support@safarexpress.in',
    address: 'Safar Express HQ, 24 Horizon Towers, Connaught Place, New Delhi 110001',
    whatsapp: '919999999999',
    twitter: 'https://x.com/safarexpress',
    quickLinks: [
      { label: 'Book a Ride', to: '/' },
      { label: 'Ride History', to: '/bookings' },
      { label: 'Partner with Us', to: '#corporate' },
      { label: 'Corporate Travel', to: '#corporate' },
    ],
    legalLinks: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Refund Policy', to: '/terms' },
      { label: 'Safety Guidelines', to: '/terms' },
    ],
  },
  popularRoutes: [
    { from: 'Delhi', to: 'Noida', price: 899, image: '', icon: 'city', blurb: 'Fast business commute' },
  ],
};

function createEmptyPopularRoute() {
  return { from: '', to: '', price: '', image: '', icon: 'city', blurb: '' };
}

function parsePickupDateTime(booking) {
  const dateValue = booking?.schedule?.pickupDate;
  if (!dateValue) return null;
  const timeValue = booking?.schedule?.pickupTime || '00:00';
  const combined = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(combined.getTime())) {
    const fallback = new Date(dateValue);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return combined;
}

function formatDate(dateStr, timeStr) {
  if (!dateStr) return 'N/A';
  try {
    let cleanDate = dateStr;
    if (typeof cleanDate === 'object' && cleanDate instanceof Date) {
      cleanDate = cleanDate.toISOString().split('T')[0];
    } else if (typeof cleanDate === 'string' && cleanDate.includes('T')) {
      cleanDate = cleanDate.split('T')[0];
    }
    let d = new Date(`${cleanDate}T${timeStr || '00:00'}`);
    if (Number.isNaN(d.getTime())) d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const hasTime = timeStr || d.getHours() !== 0 || d.getMinutes() !== 0;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      (hasTime ? `, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : '');
  } catch {
    return String(dateStr);
  }
}

function classifyBooking(booking) {
  if (booking?.status === 'COMPLETED' || booking?.status === 'CANCELLED') return 'past';
  const pickupDateTime = parsePickupDateTime(booking);
  if (!pickupDateTime || Number.isNaN(pickupDateTime.getTime())) return 'planned';

  const now = new Date();
  const sameDay = pickupDateTime.toDateString() === now.toDateString();
  if (sameDay) return 'present';
  if (pickupDateTime > now) return 'planned';
  return 'past';
}


export function AdminPage() {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [status, setStatus] = useState('CONFIRMED');
  const [success, setSuccess] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const [activeTab, setActiveTab] = useState('present');
  const [since] = useState(new Date(Date.now() - 15 * 60 * 1000).toISOString());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [routes, setRoutes] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [corporateEnquiries, setCorporateEnquiries] = useState([]);
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [routeForm, setRouteForm] = useState({ fromHub: '', toHub: '', flatRate: '' });
  const [cabForm, setCabForm] = useState({ cabType: '', carModel: '', multiplier: '', availableFrom: '', availableTo: '' });
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [cabModalOpen, setCabModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [exportingBookings, setExportingBookings] = useState(false);
  const [overrideFare, setOverrideFare] = useState('');
  const [overrideCabType, setOverrideCabType] = useState('');
  const [overrideCarModel, setOverrideCarModel] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditMeta, setAuditMeta] = useState({ page: 1, pageSize: 50, total: 0 });
  const [bookingMeta, setBookingMeta] = useState({ page: 1, pageSize: 100, total: 0 });
  const [savingSiteContent, setSavingSiteContent] = useState(false);
  const [activeSection, setActiveSection] = useState('section-overview');

  const load = useCallback(async () => {
    try {
      const [healthData, auditData, alerts, routesData, cabsData, bookingsData, corporateEnquiriesData, siteContentData] = await Promise.all([
        getHealthSummary(),
        getAuditLogs(auditPage, 50),
        getBookingAlerts(since),
        getAdminRoutes(),
        getAdminCabs(),
        listBookings({ q: query, page: 1, pageSize: 100 }),
        getCorporateEnquiries(),
        getAdminSiteContent(),
      ]);
      setHealth(healthData);
      setLogs(auditData.logs);
      setAuditMeta(auditData.meta || { page: auditPage, pageSize: 50, total: auditData.logs.length });
      setAlertCount(alerts.count || 0);
      setRoutes(routesData);
      setCabs(cabsData);
      setBookings(bookingsData.bookings || []);
      setBookingMeta(bookingsData.meta || { page: 1, pageSize: 100, total: (bookingsData.bookings || []).length });
      setCorporateEnquiries(corporateEnquiriesData || []);
      setSiteContent({
        ...DEFAULT_SITE_CONTENT,
        ...(siteContentData || {}),
        footer: {
          ...DEFAULT_SITE_CONTENT.footer,
          ...(siteContentData?.footer || {}),
          quickLinks: siteContentData?.footer?.quickLinks || DEFAULT_SITE_CONTENT.footer.quickLinks,
          legalLinks: siteContentData?.footer?.legalLinks || DEFAULT_SITE_CONTENT.footer.legalLinks,
        },
        popularRoutes: siteContentData?.popularRoutes || DEFAULT_SITE_CONTENT.popularRoutes,
      });
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to load admin data.');
    }
  }, [since, auditPage, query]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function updateActiveSection() {
      const scrollPosition = window.scrollY + 320;
      let currentSection = ADMIN_SECTION_IDS[0];

      ADMIN_SECTION_IDS.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element && element.offsetTop <= scrollPosition) {
          currentSection = sectionId;
        }
      });

      setActiveSection(currentSection);
    }

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, []);

  async function exportBookingsCsv() {
    setExportingBookings(true);
    try {
      const header = [
        'Booking ID',
        'Status',
        'Customer',
        'Pickup',
        'Dropoff',
        'Pickup Date',
        'Pickup Time',
        'Cab Type',
        'Car Model',
        'Fare',
      ];
      const rows = bookings.map((b) => ([
        b._id,
        b.status,
        b.passengerId?.name || b.contact?.name || b.user?.name || b.contact?.email || b.user?.email || 'Guest',
        b.pickup?.address || '',
        b.dropoff?.address || '',
        b.schedule?.pickupDate || '',
        b.schedule?.pickupTime || '',
        b.selection?.cabType || '',
        b.selection?.carModel || '',
        b.fare?.totalAmount ?? '',
      ]));
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `safar-express-admin-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportingBookings(false);
    }
  }

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!bookingId) {
      setError('Select a booking to update.');
      return;
    }
    if (editingBooking?.status && editingBooking.status === status) {
      setError(`Select a different status than ${editingBooking.status}.`);
      return;
    }
    if (!window.confirm(`Apply ${status} to booking ${bookingId.slice(-8)}? This action will be recorded in the audit log.`)) {
      return;
    }
    try {
      const overrides = {};
      if (status === 'CONFIRMED') {
        if (overrideFare !== '' && !Number.isNaN(Number(overrideFare))) {
          overrides.fare = { totalAmount: Number(overrideFare) };
        }
        if (overrideCabType || overrideCarModel) {
          overrides.selection = {};
          if (overrideCabType) overrides.selection.cabType = overrideCabType;
          if (overrideCarModel) overrides.selection.carModel = overrideCarModel;
        }
      }
      const booking = await updateBookingStatus(bookingId, status, Object.keys(overrides).length > 0 ? overrides : undefined);
      setSuccess(`Updated booking ${booking._id} to ${booking.status}`);
      setEditingBooking(null);
      setOverrideFare('');
      setOverrideCabType('');
      setOverrideCarModel('');
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Status update failed.');
    }
  }

  function handleEditBooking(booking) {
    setBookingId(booking._id);
    const nextStatus = booking.status === 'PENDING' ? 'CONFIRMED' : (booking.status || 'CONFIRMED');
    setStatus(nextStatus);
    setEditingBooking(booking);
    setOverrideFare(booking.fare?.totalAmount || '');
    setOverrideCabType(booking.selection?.cabType || '');
    setOverrideCarModel(booking.selection?.carModel || '');
    document.getElementById('admin-status-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleCreateRoute(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createAdminRoute({
        fromHub: routeForm.fromHub,
        toHub: routeForm.toHub,
        flatRate: Number(routeForm.flatRate),
      });
      setRouteForm({ fromHub: '', toHub: '', flatRate: '' });
      await load();
      setSuccess('Route created.');
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to create route.');
    }
  }

  async function handleCreateCab(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createAdminCab({
        cabType: cabForm.cabType,
        carModel: cabForm.carModel,
        multiplier: Number(cabForm.multiplier),
        availableFrom: cabForm.availableFrom || null,
        availableTo: cabForm.availableTo || null,
      });
      setCabForm({ cabType: '', carModel: '', multiplier: '', availableFrom: '', availableTo: '' });
      await load();
      setSuccess('Cab created.');
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to create cab.');
    }
  }

  function handleSiteFooterChange(field, value) {
    setSiteContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [field]: value,
      },
    }));
  }

  function toggleHeroVariant() {
    setSiteContent((prev) => ({
      ...prev,
      heroVariant: prev.heroVariant === 'cinematic' ? 'classic' : 'cinematic',
    }));
  }

  function handleSiteLinkChange(section, index, field, value) {
    setSiteContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [section]: prev.footer[section].map((item, itemIndex) => (
          itemIndex === index ? { ...item, [field]: value } : item
        )),
      },
    }));
  }

  function handlePopularRouteChange(index, field, value) {
    setSiteContent((prev) => ({
      ...prev,
      popularRoutes: prev.popularRoutes.map((route, routeIndex) => (
        routeIndex === index ? { ...route, [field]: value } : route
      )),
    }));
  }

  async function handlePopularRouteImage(index, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handlePopularRouteChange(index, 'image', reader.result);
    };
    reader.readAsDataURL(file);
  }

  function addPopularRoute() {
    setSiteContent((prev) => ({
      ...prev,
      popularRoutes: [...prev.popularRoutes, createEmptyPopularRoute()],
    }));
  }

  function removePopularRoute(index) {
    setSiteContent((prev) => ({
      ...prev,
      popularRoutes: prev.popularRoutes.filter((_, routeIndex) => routeIndex !== index),
    }));
  }

  async function handleSaveSiteContent(e) {
    e.preventDefault();
    setSavingSiteContent(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        heroVariant: siteContent.heroVariant === 'classic' ? 'classic' : 'cinematic',
        footer: {
          ...siteContent.footer,
          quickLinks: siteContent.footer.quickLinks.filter((item) => item.label && item.to),
          legalLinks: siteContent.footer.legalLinks.filter((item) => item.label && item.to),
        },
        popularRoutes: siteContent.popularRoutes
          .filter((item) => item.from && item.to && item.price !== '')
          .map((item) => ({ ...item, price: Number(item.price) })),
      };
      const saved = await updateAdminSiteContent(payload);
      setSiteContent(saved || payload);
      setSuccess('Site content updated.');
    } catch (err) {
      setError(err?.response?.data?.error?.detail || 'Failed to save site content.');
    } finally {
      setSavingSiteContent(false);
    }
  }

  const groupedLogs = useMemo(() => {
    const map = { present: [], planned: [], past: [] };
    logs.forEach((log) => {
      const pickupDate = log?.metadata?.pickupDate ? new Date(log.metadata.pickupDate) : null;
      if (!pickupDate || Number.isNaN(pickupDate.getTime())) {
        map.planned.push(log);
        return;
      }
      const now = new Date();
      const sameDay = pickupDate.toDateString() === now.toDateString();
      if (sameDay) map.present.push(log);
      else if (pickupDate > now) map.planned.push(log);
      else map.past.push(log);
    });
    return map;
  }, [logs]);

  const groupedBookings = useMemo(() => {
    const map = { present: [], planned: [], past: [] };
    bookings.forEach((booking) => {
      map[classifyBooking(booking)].push(booking);
    });
    return map;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const list = groupedBookings[activeTab] || [];
    return list.filter((booking) => {
      const haystack = [
        booking.pickup?.address,
        booking.dropoff?.address,
        booking.selection?.route,
        booking.selection?.cabType,
        booking.selection?.carModel,
        booking._id,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [groupedBookings, activeTab, query, statusFilter]);

  const revenue = useMemo(() => bookings.reduce((sum, b) => sum + (b.fare?.totalAmount || 0), 0), [bookings]);
  const revenueByDay = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const date = booking?.schedule?.pickupDate ? new Date(booking.schedule.pickupDate) : new Date(booking.createdAt);
      const key = Number.isNaN(date.getTime()) ? 'Unknown' : date.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + (booking.fare?.totalAmount || 0));
    });
    return Array.from(map.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [bookings]);

  const revenueByCab = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const cabType = booking.selection?.cabType || 'Unknown';
      map.set(cabType, (map.get(cabType) || 0) + (booking.fare?.totalAmount || 0));
    });
    return Array.from(map.entries()).map(([cabType, total]) => ({ cabType, total }));
  }, [bookings]);

  const revenueByRoute = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      const route = booking.selection?.route || 'Unknown';
      map.set(route, (map.get(route) || 0) + (booking.fare?.totalAmount || 0));
    });
    return Array.from(map.entries())
      .map(([route, total]) => ({ route, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [bookings]);
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* ── Premium Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white pb-12 pt-24 px-6 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-widest uppercase border border-indigo-500/30">Operations Center</span>
              <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-1">Command Center</h1>
            <p className="text-slate-400 font-medium">Last synced: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button onClick={exportBookingsCsv} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {exportingBookings ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky Nav ── */}
      <div className="sticky top-24 z-40 border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(250,248,255,0.96),rgba(255,255,255,0.88))] px-6 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-3">
          {ADMIN_NAV_GROUPS.map((group) => (
            (() => {
              const groupIsActive = group.links.some((link) => link.href === `#${activeSection}`);
              return (
            <div
              key={group.title}
              className={`relative overflow-hidden rounded-2xl border p-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition-all duration-300 ${group.tone.shell} ${groupIsActive ? 'ring-2 ring-offset-2 ring-offset-[#faf8ff] ring-[#5382ff]/25 shadow-[0_18px_40px_rgba(83,130,255,0.12)]' : ''}`}
            >
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <p className={`mb-2 text-[11px] font-black uppercase tracking-[0.22em] ${group.tone.title}`}>{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm ${link.href === `#${activeSection}` ? 'border-[#5382ff]/30 bg-[#5382ff] text-white shadow-[0_10px_24px_rgba(83,130,255,0.28)]' : group.tone.chip}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
              );
            })()
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto scroll-mt-72 p-6 space-y-8" id="section-overview">
        {/* ── Premium Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Bookings</p>
              <h3 className="text-2xl font-black text-slate-800">{bookings.length}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1"><span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded mr-1">+{groupedBookings.present.length}</span> today</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Revenue</p>
              <h3 className="text-2xl font-black text-slate-800">₹{revenue.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Total collected</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Active Routes</p>
              <h3 className="text-2xl font-black text-slate-800">{routes.length}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Operating regions</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Pending Alerts</p>
              <h3 className="text-2xl font-black text-slate-800">{alertCount}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Requires action</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Operations Check
              </h2>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Realtime</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 transition-colors">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Route Health</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-800">{routes.length}</p>
                  <p className="text-sm font-semibold text-emerald-600">active</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Review pricing & availability</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 transition-colors">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Cab Readiness</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-800">{cabs.length}</p>
                  <p className="text-sm font-semibold text-indigo-600">listed</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Update multipliers & dates</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 transition-colors">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Today’s Demand</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-800">{groupedBookings.present.length}</p>
                  <p className="text-sm font-semibold text-blue-600">trips</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Monitor live operations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                Top Routes
              </h2>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">By Revenue</span>
            </div>
            <div className="space-y-3">
              {revenueByRoute.map((route, i) => (
                <div key={route.route} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="font-semibold text-slate-700 text-sm truncate max-w-[120px]" title={route.route}>{route.route}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">₹{route.total.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {revenueByRoute.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">No routes generating revenue yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="section-system-health" className="max-w-7xl mx-auto mb-8 scroll-mt-72 pt-8 px-6">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          System Health
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Avg Latency (ms)</p>
                <div className="flex items-end gap-3 mt-2">
                  <p className="text-3xl font-black text-slate-800">{health?.metrics?.avgLatencyMs ?? 'N/A'}</p>
                  <p className="text-sm font-semibold text-emerald-600 mb-1">Optimal</p>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (health?.metrics?.avgLatencyMs || 0) / 10)}%` }}
                  />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Error Rate</p>
                <div className="flex items-end gap-3 mt-2">
                  <p className="text-3xl font-black text-slate-800">{health?.metrics?.errorRate ?? '0%'}</p>
                  <p className="text-sm font-semibold text-emerald-600 mb-1">Healthy</p>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (health?.metrics?.errorRate || 0) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Platform Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${health?.dbReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                  <span className="font-semibold text-slate-700">Database Connection</span>
                </div>
                <span className={`text-sm font-bold ${health?.dbReady ? 'text-emerald-600' : 'text-rose-600'}`}>{health?.dbReady ? 'Connected' : 'Degraded'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="font-semibold text-slate-700">Audit Subsystem</span>
                </div>
                <span className="text-sm font-bold text-slate-600">{health?.auditCount ?? 0} events logged</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <span className="font-semibold text-slate-700">Metrics Collector</span>
                </div>
                <span className="text-sm font-bold text-slate-600">{health?.metrics ? 'Active' : 'Standby'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="section-analytics" className="max-w-7xl mx-auto mb-8 scroll-mt-72 pt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Revenue Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Daily Revenue Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Revenue by Cab Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCab} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <XAxis dataKey="cabType" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div id="section-routes-&-cabs" className="max-w-7xl mx-auto mb-8 scroll-mt-72 pt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          Configure
        </h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setRouteModalOpen(true)} className="flex items-center gap-2 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all font-bold text-slate-700">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Manage Fleet Routes
          </button>
          <button onClick={() => setCabModalOpen(true)} className="flex items-center gap-2 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all font-bold text-slate-700">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Manage Cab Inventory
          </button>
        </div>
      </div>

      <div id="section-bookings" className="max-w-7xl mx-auto mb-8 scroll-mt-72 pt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Bookings Log
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {tab.toUpperCase()} <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-xs text-slate-400">{groupedBookings[tab].length}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                  placeholder="Search passenger, route, or pickup location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="relative w-full md:w-64 shrink-0">
                <select
                  className="w-full appearance-none px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-400">Showing {bookings.length} booking records{bookingMeta.total ? ` of ${bookingMeta.total}` : ''}{query ? ` for "${query}"` : ''}.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Customer</th>
                    <th className="px-6 py-4">Route & Schedule</th>
                    <th className="px-6 py-4">Cab Type</th>
                    <th className="px-6 py-4">Fare</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors group stagger-in" style={{ animationDelay: `${index * 35}ms` }}>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPassenger(booking);
                            setPassengerModalOpen(true);
                          }}
                          className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-left flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            {(booking.passengerId?.name || booking.contact?.name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{booking.passengerId?.name || booking.contact?.name || booking.user?.name || booking.contact?.email || booking.user?.email || 'Guest'}</span>
                            <span className="block text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider mt-0.5">#{booking._id.slice(-6)}</span>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5 line-clamp-1">
                            {booking.pickup?.address?.split(',')[0]}
                            <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            {booking.dropoff?.address?.split(',')[0]}
                          </p>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formatDate(booking.schedule?.pickupDate, booking.schedule?.pickupTime)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                          {booking.selection?.cabType || booking.cabType || booking.cabId?.type || 'Assigned at dispatch'}{booking.selection?.carModel || booking.carModel ? ` · ${booking.selection?.carModel || booking.carModel}` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{booking.status === 'PENDING' && !booking.fare?.totalAmount ? 'Pending' : `₹${booking.fare?.totalAmount?.toLocaleString('en-IN') || '0'}`}</p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 mt-0.5">{booking.status === 'PENDING' ? 'Awaiting quote' : 'Paid'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : booking.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${booking.status === 'COMPLETED' ? 'bg-emerald-500' : booking.status === 'PENDING' ? 'bg-amber-500' : booking.status === 'CONFIRMED' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedPassenger(booking);
                              setPassengerModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" /></svg>
                          </button>
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                            title="Update Status"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <p className="font-semibold text-slate-600">No bookings match your filters</p>
                          <p className="text-sm mt-1">Try adjusting your search criteria or changing tabs.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div id="section-site-content" className="max-w-7xl mx-auto mb-8 scroll-mt-72 pt-4">
            <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              Site Content Customization
            </h2>
            <form onSubmit={handleSaveSiteContent} className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Footer Content</p>
                    <p className="text-xs text-slate-500 mt-1">Control phone, email, office address, and footer links shown on the public site.</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Homepage Hero Style</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Cinematic hero is the default. Use the toggle only if you want to switch back to the classic hero.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleHeroVariant}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${siteContent.heroVariant === 'cinematic' ? 'bg-[#1E1B4B] text-white shadow-lg shadow-indigo-500/20 hover:bg-[#17153d]' : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-200 hover:text-indigo-700'}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${siteContent.heroVariant === 'cinematic' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                        {siteContent.heroVariant === 'cinematic' ? 'Switch to Classic Hero' : 'Switch to Cinematic Hero'}
                      </button>
                    </div>
                  </div>
                  <textarea className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" rows="3" value={siteContent.footer.description} onChange={(e) => handleSiteFooterChange('description', e.target.value)} placeholder="Footer description" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={siteContent.footer.phone} onChange={(e) => handleSiteFooterChange('phone', e.target.value)} placeholder="Phone number" />
                    <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={siteContent.footer.email} onChange={(e) => handleSiteFooterChange('email', e.target.value)} placeholder="Support email" />
                    <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={siteContent.footer.whatsapp} onChange={(e) => handleSiteFooterChange('whatsapp', e.target.value)} placeholder="WhatsApp number" />
                    <input className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={siteContent.footer.twitter} onChange={(e) => handleSiteFooterChange('twitter', e.target.value)} placeholder="Twitter / X URL" />
                  </div>
                  <textarea className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" rows="3" value={siteContent.footer.address} onChange={(e) => handleSiteFooterChange('address', e.target.value)} placeholder="Office address" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Links</p>
                      {siteContent.footer.quickLinks.map((item, index) => (
                        <div key={`quick-link-${index}`} className="grid grid-cols-2 gap-3">
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={item.label} onChange={(e) => handleSiteLinkChange('quickLinks', index, 'label', e.target.value)} placeholder="Label" />
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={item.to} onChange={(e) => handleSiteLinkChange('quickLinks', index, 'to', e.target.value)} placeholder="Path or #corporate" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Legal Links</p>
                      {siteContent.footer.legalLinks.map((item, index) => (
                        <div key={`legal-link-${index}`} className="grid grid-cols-2 gap-3">
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={item.label} onChange={(e) => handleSiteLinkChange('legalLinks', index, 'label', e.target.value)} placeholder="Label" />
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={item.to} onChange={(e) => handleSiteLinkChange('legalLinks', index, 'to', e.target.value)} placeholder="Path" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Popular Routes Cards</p>
                      <p className="text-xs text-slate-500 mt-1">Add route copy, pricing, icon name, and upload or paste an image.</p>
                    </div>
                    <button type="button" onClick={addPopularRoute} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Add Route</button>
                  </div>
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {siteContent.popularRoutes.map((route, index) => (
                      <div key={`popular-route-${index}`} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-800">Route Card {index + 1}</p>
                          {siteContent.popularRoutes.length > 1 && (
                            <button type="button" onClick={() => removePopularRoute(index)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Remove</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={route.from} onChange={(e) => handlePopularRouteChange(index, 'from', e.target.value)} placeholder="From" />
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={route.to} onChange={(e) => handlePopularRouteChange(index, 'to', e.target.value)} placeholder="To" />
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" type="number" value={route.price} onChange={(e) => handlePopularRouteChange(index, 'price', e.target.value)} placeholder="Starting price" />
                          <input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={route.icon} onChange={(e) => handlePopularRouteChange(index, 'icon', e.target.value)} placeholder="Icon tag" />
                        </div>
                        <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={route.blurb} onChange={(e) => handlePopularRouteChange(index, 'blurb', e.target.value)} placeholder="Short blurb" />
                        <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" value={route.image} onChange={(e) => handlePopularRouteChange(index, 'image', e.target.value)} placeholder="Image URL or data URI" />
                        <input type="file" accept="image/*" className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handlePopularRouteImage(index, e.target.files?.[0])} />
                        {route.image ? <img src={route.image} alt={`${route.from} to ${route.to}`} className="h-28 w-full rounded-xl object-cover border border-slate-200" /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={savingSiteContent} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-700 disabled:opacity-60">
                  {savingSiteContent ? 'Saving...' : 'Save Site Content'}
                </button>
              </div>
            </form>
          </div>
          {/* ── Modals ── */}
          <div id="section-corporate-leads" className="max-w-7xl mx-auto mb-8 scroll-mt-72 pt-4">
            <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2m-1 4H7m2 0v6m6-6v6" /></svg>
              Corporate Partnership Leads
            </h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Inbound corporate enquiries</p>
                  <p className="text-xs text-slate-500 mt-1">Saved from the public footer partnership form.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-100">{corporateEnquiries.length} leads</span>
              </div>
              <div className="divide-y divide-slate-100">
                {corporateEnquiries.map((enquiry, index) => (
                  <div key={enquiry._id} className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 stagger-in" style={{ animationDelay: `${index * 40}ms` }}>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{enquiry.company}</p>
                      <p className="text-sm text-slate-600 mt-1">{enquiry.contactName}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(enquiry.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Contact</p>
                      <p className="text-sm text-slate-700 break-all">{enquiry.email}</p>
                      <p className="text-sm text-slate-600 mt-1">{enquiry.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Scope</p>
                      <p className="text-sm text-slate-700">{enquiry.city || 'N/A'}</p>
                      <p className="text-sm text-slate-600 mt-1">{enquiry.rides || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Requirements</p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{enquiry.requirements || 'No additional requirements shared.'}</p>
                    </div>
                  </div>
                ))}
                {corporateEnquiries.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-500">No corporate partnership submissions yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {routeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    Route Management
                  </h2>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setRouteModalOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleCreateRoute} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">Create New Route</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all w-full" placeholder="From Hub (e.g. Mumbai)" value={routeForm.fromHub} onChange={(e) => setRouteForm((prev) => ({ ...prev, fromHub: e.target.value }))} required />
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all w-full" placeholder="To Hub (e.g. Pune)" value={routeForm.toHub} onChange={(e) => setRouteForm((prev) => ({ ...prev, toHub: e.target.value }))} required />
                      <div className="relative md:col-span-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input className="px-4 py-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all w-full" placeholder="Flat Rate Base Route Price" type="number" value={routeForm.flatRate} onChange={(e) => setRouteForm((prev) => ({ ...prev, flatRate: e.target.value }))} required />
                      </div>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors shadow-lg shadow-purple-500/20">Add Route</button>
                  </form>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Active Routes ({routes.length})</h3>
                    <div className="space-y-3">
                      {routes.map((route) => (
                        <div key={route._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{route.fromHub} <span className="text-slate-400 mx-1">→</span> {route.toHub}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {route._id.slice(-6)}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">₹{route.flatRate}</span>
                        </div>
                      ))}
                      {routes.length === 0 && <p className="text-center py-8 text-slate-400 font-medium">No routes configured yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {cabModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Cab Inventory
                  </h2>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setCabModalOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleCreateCab} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">Register New Cab</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-full" placeholder="Cab Class (e.g. SUV, Sedan)" value={cabForm.cabType} onChange={(e) => setCabForm((prev) => ({ ...prev, cabType: e.target.value }))} required />
                      <input className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-full" placeholder="Specific Model (e.g. Innova)" value={cabForm.carModel} onChange={(e) => setCabForm((prev) => ({ ...prev, carModel: e.target.value }))} required />
                      <div className="relative md:col-span-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">x</span>
                        <input className="px-4 py-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-full" placeholder="Fare Multiplier (e.g. 1.5 for SUV)" type="number" step="0.1" value={cabForm.multiplier} onChange={(e) => setCabForm((prev) => ({ ...prev, multiplier: e.target.value }))} required />
                      </div>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-500/20">Add Cab to Fleet</button>
                  </form>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Operating Cabs ({cabs.length})</h3>
                    <div className="space-y-3">
                      {cabs.map((cab) => (
                        <div key={cab._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{cab.cabType} <span className="text-slate-400 mx-1 font-normal">•</span> {cab.carModel}</p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {cab._id.slice(-6)}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-bold border border-slate-200">Multiplier x{cab.multiplier}</span>
                        </div>
                      ))}
                      {cabs.length === 0 && <p className="text-center py-8 text-slate-400 font-medium">No cabs configured yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {passengerModalOpen && selectedPassenger && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Booking Dossier
                  </h2>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" onClick={() => setPassengerModalOpen(false)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-black border-2 border-indigo-200">
                      {(selectedPassenger.passengerId?.name || selectedPassenger.contact?.name || selectedPassenger.user?.name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{selectedPassenger.passengerId?.name || selectedPassenger.contact?.name || selectedPassenger.user?.name || 'Guest User'}</h3>
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {selectedPassenger.passengerId?.email || selectedPassenger.contact?.email || selectedPassenger.user?.email || 'No email left'}
                      </p>
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {selectedPassenger.passengerId?.phone || selectedPassenger.contact?.phone || 'No phone left'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-2 gap-y-4 gap-x-3">
                    <div className="col-span-2 border-b border-slate-200 pb-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Trip Route</p>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> {selectedPassenger.pickup?.address}
                      </p>
                      <div className="w-px h-3 bg-slate-300 ml-1 my-0.5" />
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> {selectedPassenger.dropoff?.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Date & Time</p>
                      <p className="text-sm font-semibold text-slate-800">{formatDate(selectedPassenger.schedule?.pickupDate, selectedPassenger.schedule?.pickupTime)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Booking Ref</p>
                      <p className="text-sm font-mono font-semibold text-slate-800">#{selectedPassenger._id.slice(-8)}</p>
                      <p className={`text-xs font-bold mt-1 ${selectedPassenger.status === 'COMPLETED' ? 'text-emerald-600' : selectedPassenger.status === 'CANCELLED' ? 'text-rose-600' : 'text-blue-600'}`}>{selectedPassenger.status}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Cab</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPassenger.selection?.cabType || selectedPassenger.cabType || 'Assigned at dispatch'}</p>
                      <p className="text-xs text-slate-500 mt-1">{selectedPassenger.selection?.carModel || selectedPassenger.carModel || 'Model to be assigned'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Fare</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedPassenger.status === 'PENDING' && !selectedPassenger.fare?.totalAmount ? 'Pending quote' : `₹${selectedPassenger.fare?.totalAmount?.toLocaleString('en-IN') || '0'}`}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Operational Notes</p>
                      <p className="text-sm text-slate-600">Trip type: {selectedPassenger.tripType?.replace('_', ' ') || 'N/A'} | Route key: {selectedPassenger.selection?.route || 'Not captured'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-6 mb-8 scroll-mt-72 pt-4" id="section-audit-logs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Status Overrides
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <form onSubmit={handleStatusUpdate} className="relative z-10 flex flex-col gap-4">
                    {editingBooking ? (
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Editing Booking</p>
                          <p className="font-mono text-sm font-black text-slate-800 mt-1">#{editingBooking._id.slice(-8)}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{editingBooking.pickup?.address?.split(',')[0]} → {editingBooking.dropoff?.address?.split(',')[0]}</p>
                        </div>
                        <button type="button" onClick={() => { setBookingId(''); setEditingBooking(null); }} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Booking Object ID</label>
                        <input className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm" placeholder="Paste exact Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">New State</label>
                      <select className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-700 bg-white" value={status} onChange={(e) => { setStatus(e.target.value); setOverrideFare(''); setOverrideCabType(''); setOverrideCarModel(''); }}>
                        <option value="CONFIRMED">CONFIRMED (Approve)</option>
                        <option value="COMPLETED">COMPLETED (Finish)</option>
                        <option value="CANCELLED">CANCELLED (Reject/Fail)</option>
                      </select>
                    </div>
                    {status === 'CONFIRMED' && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Booking Details Override (Optional)</p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            min="0"
                            className="w-full px-4 py-3 pl-8 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
                            placeholder="Confirmed Fare (e.g. 3500)"
                            value={overrideFare}
                            onChange={(e) => setOverrideFare(e.target.value)}
                          />
                        </div>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
                          placeholder="Cab Type (e.g. SUV, Sedan)"
                          value={overrideCabType}
                          onChange={(e) => setOverrideCabType(e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
                          placeholder="Car Model (e.g. Toyota Innova)"
                          value={overrideCarModel}
                          onChange={(e) => setOverrideCarModel(e.target.value)}
                        />
                        <p className="text-[10px] text-emerald-600 font-medium">Leave blank to keep existing values. Changes reflect in BookingPage for this booking.</p>
                      </div>
                    )}
                    <button className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/20">Apply Forced Update</button>
                    <div className="empty:hidden">
                      {error && <Alert type="error" message={error} />}
                      {success && <Alert type="success" message={success} />}
                    </div>
                  </form>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Activity Timeline ({activeTab})
                </h2>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-h-[440px] overflow-y-auto">
                  <div className="relative pl-3 space-y-6">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[19px] top-2 bottom-0 w-px bg-slate-100" />

                    {groupedLogs[activeTab].map((log) => (
                      <div key={log._id} className="relative pl-8">
                        {/* Timeline Dot */}
                        <span className="absolute left-[2px] top-1.5 w-2 h-2 rounded-full bg-slate-200 ring-4 ring-white shadow-sm animate-pulse" />

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 group">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{log.action}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {log.actor?.email || 'System Action'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {groupedLogs[activeTab].length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-sm font-semibold text-slate-400">No activity logged in this section.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-xs font-medium text-slate-400">Page {auditMeta.page} of {Math.max(1, Math.ceil((auditMeta.total || 1) / (auditMeta.pageSize || 50)))}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))} disabled={auditMeta.page <= 1} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">Prev</button>
                      <button type="button" onClick={() => setAuditPage((prev) => prev + 1)} disabled={auditMeta.page >= Math.max(1, Math.ceil((auditMeta.total || 1) / (auditMeta.pageSize || 50)))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

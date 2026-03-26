import React, { useEffect, useState } from 'react';
import { ArrowRight, Building2, Plane, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSiteContent } from '../../shared/api/endpoints';

const FALLBACK_POPULAR_ROUTES = [
  { from: 'Delhi', to: 'Noida', price: 899, icon: 'city', blurb: 'Fast business commute', image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80' },
  { from: 'Delhi', to: 'Agra', price: 2499, icon: 'monument', blurb: 'Weekend heritage escape', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80' },
  { from: 'Gurgaon', to: 'IGI Airport', price: 1199, icon: 'airport', blurb: 'Reliable airport transfer', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80' },
  { from: 'Jaipur', to: 'Delhi', price: 3299, icon: 'city', blurb: 'Premium intercity route', image: 'https://images.unsplash.com/photo-1599661046827-dacde6976548?auto=format&fit=crop&w=1200&q=80' },
];

function getRouteIcon(icon) {
  if (icon === 'airport') return Plane;
  if (icon === 'monument') return Landmark;
  return Building2;
}

export function PopularDestinationsPage() {
  const navigate = useNavigate();
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    let active = true;
    getSiteContent()
      .then((data) => {
        if (active) setSiteContent(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const popularRoutes = siteContent?.popularRoutes?.length ? siteContent.popularRoutes : FALLBACK_POPULAR_ROUTES;

  function handleRouteSelect(route) {
    navigate('/', {
      state: {
        popularRoute: {
          from: route.from || route.pickup,
          to: route.to || route.dropoff,
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">
              Safar Express
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-indigo-950">Popular Destinations</h1>
            <p className="mt-2 max-w-2xl text-base text-indigo-500/80">
              Discover the most traveled intercity routes this month and jump straight into booking.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-indigo-100 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-900"
          >
            Back to Search
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {popularRoutes.map((route, index) => {
            const Icon = getRouteIcon(route.icon);
            const from = route.from || route.pickup;
            const to = route.to || route.dropoff;
            return (
              <button
                key={`${from}-${to}-${index}`}
                type="button"
                onClick={() => handleRouteSelect(route)}
                className="group overflow-hidden rounded-lg border border-[#e0e7ff] bg-white text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={route.image}
                    alt={`${from} to ${to}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-indigo-950/65 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {route.blurb || 'Popular route'}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full bg-indigo-950/65 p-2 text-white backdrop-blur-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[1.1rem] font-bold text-slate-900">
                      {from} <ArrowRight className="mx-1 inline h-4 w-4 text-slate-400" /> {to}
                    </p>
                    <Icon className="h-4 w-4 flex-none text-indigo-400" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5382ff]">
                    Starts at Rs {route.price}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

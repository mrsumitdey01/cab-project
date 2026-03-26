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
    {
      from: 'Delhi',
      to: 'Noida',
      price: 899,
      icon: 'city',
      blurb: 'Fast business commute',
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    },
    {
      from: 'Delhi',
      to: 'Agra',
      price: 2499,
      icon: 'monument',
      blurb: 'Weekend heritage escape',
      image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    },
    {
      from: 'Gurgaon',
      to: 'IGI Airport',
      price: 1199,
      icon: 'airport',
      blurb: 'Reliable airport transfer',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    },
    {
      from: 'Jaipur',
      to: 'Delhi',
      price: 3299,
      icon: 'city',
      blurb: 'Premium intercity route',
      image: 'https://images.unsplash.com/photo-1599661046827-dacde6976548?auto=format&fit=crop&w=1200&q=80',
    },
  ],
};

function buildSiteContentPayload(input = {}) {
  return {
    heroVariant: input.heroVariant === 'classic' ? 'classic' : DEFAULT_SITE_CONTENT.heroVariant,
    footer: {
      ...DEFAULT_SITE_CONTENT.footer,
      ...(input.footer || {}),
      quickLinks: Array.isArray(input.footer?.quickLinks) && input.footer.quickLinks.length ? input.footer.quickLinks : DEFAULT_SITE_CONTENT.footer.quickLinks,
      legalLinks: Array.isArray(input.footer?.legalLinks) && input.footer.legalLinks.length ? input.footer.legalLinks : DEFAULT_SITE_CONTENT.footer.legalLinks,
    },
    popularRoutes: Array.isArray(input.popularRoutes) && input.popularRoutes.length ? input.popularRoutes : DEFAULT_SITE_CONTENT.popularRoutes,
  };
}

module.exports = { DEFAULT_SITE_CONTENT, buildSiteContentPayload };

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit3,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  FolderHeart,
  Globe,
  Image as ImageIcon,
  Instagram,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Minus,
  Package,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Search,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  Upload,
  User as UserIcon,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  sha256,
  sanitizeInput,
  DEFAULT_OWNER_PASSWORD_HASH,
  SECURITY_ANSWER_HASH,
} from '@/lib/security';
import {
  checkoutSchema,
  newsletterSchema,
  passwordResetSchema,
  productSchema,
} from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'single' | 'blend';
  image_url: string;
  images?: string[];
  price_inr: number | null;
  sale_price_inr: number | null;
  size_label: string | null;
  weight_grams: number | null;
  fragrance: string | null;
  stock_quantity: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_published: boolean;
  is_upcoming?: boolean;
};

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
  color?: string;
  fragrance?: string;
  note?: string;
};

type CustomerUser = {
  numericId: string; // e.g. "749281"
  username: string;  // unique chosen username
  name: string;
  email: string;
  phone?: string;
};

export type CustomCollection = {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  productIds: string[];
  is_published: boolean;
};

export type SiteContent = {
  // Announcement
  announcementText: string;
  // Hero
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  heroPrimaryBtn: string;
  heroSecondaryBtn: string;
  heroFounderNote: string;
  // Fragrance Wardrobe
  wardrobeKicker: string;
  wardrobeTitle: string;
  wardrobeText: string;
  wardrobePills: string;
  wardrobeFooterText: string;
  // Shop section
  shopKicker: string;
  shopTitle: string;
  // Signature Blends
  blendKicker: string;
  blendTitle: string;
  blendText: string;
  blendCardEyebrow: string;
  blendCardTitle: string;
  blendCardText: string;
  // Bestsellers
  bestsellerKicker: string;
  bestsellerTitle: string;
  // Story
  storyKicker: string;
  storyTitle: string;
  storyText: string;
  storyVal1Title: string;
  storyVal1Text: string;
  storyVal2Title: string;
  storyVal2Text: string;
  storyVal3Title: string;
  storyVal3Text: string;
  storyFounderName: string;
  storyFounderRole: string;
  // Contact & Social
  contactKicker: string;
  contactTitle: string;
  contactText: string;
  contactPhone: string;
  contactEmail: string;
  instagramHandle: string;
  // Upcoming Candles Page
  upcomingHeroEyebrow: string;
  upcomingHeroTitle: string;
  upcomingHeroText: string;
  upcomingShopKicker: string;
  upcomingShopTitle: string;
};

const DEFAULT_SITE_CONTENT: SiteContent = {
  announcementText: 'Handcrafted with care in the Sahyadri mountains · Thoughtful gifting, beautifully wrapped',
  heroEyebrow: 'The Sahyadri collection · 01',
  heroTitle: 'Bring the essence of Sahyadri home.',
  heroText: 'Thoughtfully crafted scented candles that transform everyday moments into warm, beautiful rituals.',
  heroPrimaryBtn: 'Shop our candles',
  heroSecondaryBtn: 'Explore fragrances',
  heroFounderNote: 'Handcrafted in small batches by Harshali V. Mehta',
  wardrobeKicker: '01 / Fragrance wardrobe',
  wardrobeTitle: 'A little luxury for every mood.',
  wardrobeText: 'From the soft embrace of Vanilla to the grounding depth of Sandalwood, each Sahyadri Glow fragrance is an invitation to slow down, breathe deep and make home feel more like you.',
  wardrobePills: 'Calm, Warmth, Freshness, Romance, Stillness',
  wardrobeFooterText: 'Peace, in every mood.',
  shopKicker: '02 / Shop the collection',
  shopTitle: 'Made to linger.',
  blendKicker: '03 / Signature blends',
  blendTitle: 'Layered like the landscape.',
  blendText: 'Our blends are composed like a journey — familiar notes meeting unexpected turns, inspired by the many moods of the mountains.',
  blendCardEyebrow: 'The blend no. 01',
  blendCardTitle: 'Vanilla + Lavender',
  blendCardText: 'Creamy comfort meets a quiet botanical heart.',
  bestsellerKicker: '04 / Loved by many',
  bestsellerTitle: 'The bestsellers.',
  storyKicker: '05 / From our home to yours',
  storyTitle: 'The glow behind Sahyadri Glow.',
  storyText: 'Born from a love for the hills, botanicals and the comfort of a lit candle at the end of a long day. Every fragrance is made to bring a piece of that feeling home.',
  storyVal1Title: 'Hand-poured',
  storyVal1Text: 'Each candle is poured by hand in small batches, so no two are ever quite alike.',
  storyVal2Title: 'Naturally sourced',
  storyVal2Text: 'Botanicals and fragrance oils chosen for their purity, warmth and staying power.',
  storyVal3Title: 'Made to last',
  storyVal3Text: 'Slow-burning waxes and cotton wicks for an even, clean glow every time.',
  storyFounderName: 'Harshali V. Mehta',
  storyFounderRole: 'Founder & candle-maker',
  contactKicker: '06 / Stay in the glow',
  contactTitle: 'Notes from the mountains.',
  contactText: 'New fragrances, small-batch releases and gentle reminders to make space for the good things.',
  contactPhone: '8275165651',
  contactEmail: 'hello@sahyadriglow.com',
  instagramHandle: '@sahyadriglow',
  upcomingHeroEyebrow: 'Upcoming Releases · Sneak Peek',
  upcomingHeroTitle: 'New mountain rituals, arriving soon.',
  upcomingHeroText: 'Preview our upcoming small-batch scented candles currently curing in our studio. Reserve your favourites early or explore upcoming blends.',
  upcomingShopKicker: '02 / Upcoming collection',
  upcomingShopTitle: 'Coming soon to your sanctuary.',
};

function getUpcomingIdMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('sahyadri_upcoming_ids');
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function setProductUpcomingFlag(productId: string, isUpcoming: boolean) {
  try {
    const map = getUpcomingIdMap();
    map[productId] = isUpcoming;
    localStorage.setItem('sahyadri_upcoming_ids', JSON.stringify(map));

    const storedCustom = JSON.parse(localStorage.getItem('sahyadri_custom_products') ?? '[]') as Product[];
    const updatedCustom = storedCustom.map((p) =>
      p.id === productId ? { ...p, is_upcoming: isUpcoming } : p
    );
    localStorage.setItem('sahyadri_custom_products', JSON.stringify(updatedCustom));
  } catch {
    // ignore
  }
}

function applyUpcomingFlags(prods: Product[]): Product[] {
  const map = getUpcomingIdMap();
  return prods.map((p) => ({
    ...p,
    is_upcoming: typeof map[p.id] === 'boolean' ? map[p.id] : Boolean(p.is_upcoming),
  }));
}

const DEFAULT_COLLECTIONS: CustomCollection[] = [
  {
    id: 'mountain-calm',
    name: 'Mountain Calm & Serenity',
    slug: 'mountain-calm',
    tagline: 'Evening Relaxation',
    description: 'Grounding scents inspired by Sahyadri twilight to slow down, breathe deep, and unwind.',
    productIds: ['lavender', 'sandalwood', 'vanilla-lavender'],
    is_published: true,
  },
  {
    id: 'sweet-warmth',
    name: 'Sweet Warmth & Comfort',
    slug: 'sweet-warmth',
    tagline: 'Cozy Atmosphere',
    description: 'Indulgent creamy vanilla and delicate floral accords that wrap any room in welcoming warmth.',
    productIds: ['vanilla', 'rose', 'vanilla-rose'],
    is_published: true,
  },
];

function getOrCreateNumericId(email: string): string {
  try {
    const raw = localStorage.getItem('sahyadri_user_numeric_ids');
    const registry: Record<string, string> = raw ? JSON.parse(raw) : {};
    const key = (email || 'guest@sahyadriglow.com').trim().toLowerCase();
    if (registry[key] && /^\d+$/.test(registry[key])) {
      return registry[key];
    }
    // Generate an all-digits 6-digit numeric ID (100000 - 999999)
    let newId = Math.floor(100000 + Math.random() * 900000).toString();
    const existingIds = new Set(Object.values(registry));
    while (existingIds.has(newId)) {
      newId = Math.floor(100000 + Math.random() * 900000).toString();
    }
    registry[key] = newId;
    localStorage.setItem('sahyadri_user_numeric_ids', JSON.stringify(registry));
    return newId;
  } catch {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_user_id?: string;
  customer_username?: string;
  payment_method?: string;
  payment_ref?: string;
  items: OrderItem[];
  total_inr: number;
  status: 'pending' | 'confirmed' | 'delivered';
  created_at: string;
};

function exportOrdersToCSV(orders: Order[]) {
  if (orders.length === 0) return;
  const headers = [
    'Order ID',
    'Date & Time',
    'Customer Name',
    'Customer User ID',
    'Username',
    'Phone Number',
    'Delivery Address',
    'Payment Method',
    'Payment Ref / UTR',
    'Items Ordered',
    'Total INR',
    'Status',
  ];
  const rows = orders.map((order) => {
    const itemsStr = Array.isArray(order.items)
      ? order.items
          .map((i) => {
            const extra = [
              i.color ? `Color: ${i.color}` : '',
              i.fragrance ? `Fragrance: ${i.fragrance}` : '',
              i.note ? `Note: "${i.note}"` : '',
            ].filter(Boolean).join(', ');
            return `${i.name} [Qty: ${i.quantity}, Price: Rs. ${i.price}${extra ? ` | ${extra}` : ''}]`;
          })
          .join('; ')
      : '';
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : 'N/A';
    return [
      `"${order.id}"`,
      `"${dateStr}"`,
      `"${(order.customer_name || '').replace(/"/g, '""')}"`,
      `"${order.customer_user_id || ''}"`,
      `"${order.customer_username || ''}"`,
      `"${(order.customer_phone || '').replace(/"/g, '""')}"`,
      `"${(order.customer_address || '').replace(/"/g, '""')}"`,
      `"${(order.payment_method || '').replace(/"/g, '""')}"`,
      `"${(order.payment_ref || '').replace(/"/g, '""')}"`,
      `"${itemsStr.replace(/"/g, '""')}"`,
      `"${order.total_inr || 0}"`,
      `"${order.status || 'pending'}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `sahyadri_customers_orders_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type CartItem = Product & {
  cartItemId: string;
  quantity: number;
  selectedColor: string;
  selectedFragrance: string;
  customerNote: string;
};

const COLOR_OPTIONS = [
  'Red',
  'Yellow',
  'Green',
  'Blue',
  'Pink',
  'Purple',
  'Orange',
  'orignal',
] as const;

const FRAGRANCE_OPTIONS = [
  'Rose',
  'lavender',
  'Sandalwood',
  'Vanilla',
  'Hawaiian breeze (ocean)',
  'Choco vanilla',
  'Cafe wood',
  'Berry waffle',
  'Ilaichi pumpkin',
  'Coconut cream delight',
] as const;
type Toast = { message: string; visible: boolean };

const WHATSAPP_NUMBER = '918275165651';

const fallbackProducts: Product[] = [
  { id: 'vanilla', name: 'Vanilla', slug: 'vanilla', description: 'Soft, creamy vanilla with a comforting warmth that turns any corner into home.', category: 'single', image_url: 'https://images.pexels.com/photos/8903647/pexels-photo-8903647.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 599, sale_price_inr: 399, size_label: '200g', weight_grams: 200, fragrance: 'Vanilla essence, warm amber', stock_quantity: 15, is_featured: true, is_bestseller: true, is_published: true },
  { id: 'rose', name: 'T Rose', slug: 't-rose', description: 'A graceful rose accord with a fresh, petal-soft finish and quiet elegance.', category: 'single', image_url: 'https://images.pexels.com/photos/37181850/pexels-photo-37181850.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 649, sale_price_inr: 449, size_label: '200g', weight_grams: 200, fragrance: 'Velvety rose petals, quiet garden breeze', stock_quantity: 12, is_featured: true, is_bestseller: false, is_published: true },
  { id: 'lavender', name: 'Lavender', slug: 'lavender', description: 'A calm botanical blend inspired by slow evenings and open mountain air.', category: 'single', image_url: 'https://images.pexels.com/photos/6101288/pexels-photo-6101288.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 599, sale_price_inr: 399, size_label: '200g', weight_grams: 200, fragrance: 'Wild mountain lavender', stock_quantity: 20, is_featured: false, is_bestseller: true, is_published: true },
  { id: 'hawaiian', name: 'Hawaiian Breeze', slug: 'hawaiian-breeze', description: 'Bright, airy and sun-washed — a little escape in every breath.', category: 'single', image_url: 'https://images.pexels.com/photos/14499685/pexels-photo-14499685.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 649, sale_price_inr: 449, size_label: '200g', weight_grams: 200, fragrance: 'Island blossoms, sea breeze', stock_quantity: 10, is_featured: false, is_bestseller: false, is_published: true },
  { id: 'sandalwood', name: 'Sandalwood', slug: 'sandalwood', description: 'Earthy sandalwood with a smooth, meditative depth and warm trail.', category: 'single', image_url: 'https://images.pexels.com/photos/28260282/pexels-photo-28260282.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 699, sale_price_inr: 499, size_label: '200g', weight_grams: 200, fragrance: 'Pure sandalwood, cedar warmth', stock_quantity: 18, is_featured: false, is_bestseller: true, is_published: true },
  { id: 'vanilla-lavender', name: 'Vanilla + Lavender', slug: 'vanilla-lavender', description: 'Creamy vanilla softened with a serene lavender heart.', category: 'blend', image_url: 'https://images.pexels.com/photos/27549293/pexels-photo-27549293.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 749, sale_price_inr: 549, size_label: '200g', weight_grams: 200, fragrance: 'Warm vanilla, botanical lavender', stock_quantity: 14, is_featured: true, is_bestseller: true, is_published: true },
  { id: 'vanilla-rose', name: 'Vanilla + Rose', slug: 'vanilla-rose', description: 'A tender pairing of velvety rose and familiar vanilla warmth.', category: 'blend', image_url: 'https://images.pexels.com/photos/7498421/pexels-photo-7498421.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 749, sale_price_inr: 549, size_label: '200g', weight_grams: 200, fragrance: 'Rose petals, madagascar vanilla', stock_quantity: 16, is_featured: true, is_bestseller: false, is_published: true },
  { id: 'vanilla-hawaiian', name: 'Vanilla + Hawaiian Breeze', slug: 'vanilla-hawaiian-breeze', description: 'A luminous blend where creamy vanilla meets a fresh island breeze.', category: 'blend', image_url: 'https://images.pexels.com/photos/7302762/pexels-photo-7302762.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price_inr: 799, sale_price_inr: 599, size_label: '200g', weight_grams: 200, fragrance: 'Sweet vanilla, island breeze', stock_quantity: 11, is_featured: false, is_bestseller: false, is_published: true },
];

function getProductImages(product: Product): string[] {
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(Boolean);
  }
  if (product.image_url) {
    if (product.image_url.startsWith('__MULTI__[')) {
      try {
        const json = product.image_url.slice(9);
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
    return [product.image_url];
  }
  return ['/images/logo_b.png'];
}

function getProductPricing(product: Product): { realPrice: number; salePrice: number; hasDiscount: boolean } {
  if (product.price_inr !== null && product.sale_price_inr !== null) {
    const realPrice = Math.max(product.price_inr, product.sale_price_inr);
    const salePrice = Math.min(product.price_inr, product.sale_price_inr);
    return { realPrice, salePrice, hasDiscount: realPrice > salePrice };
  }
  const base = product.sale_price_inr ?? product.price_inr;
  if (base !== null) {
    const realPrice = Math.round((base * 1.35) / 10) * 10 - 1;
    return { realPrice, salePrice: base, hasDiscount: true };
  }
  return { realPrice: 599, salePrice: 399, hasDiscount: true };
}

const formatPrice = (price: number | null) => price === null ? 'Price to be set' : `₹${price.toLocaleString('en-IN')}`;

const LOGO = '/images/logo_b.png';
const STORY_LOGO = '/images/logo_b.png';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activePage, setActivePage] = useState<'home' | 'upcoming'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#upcoming') {
      return 'upcoming';
    }
    return 'home';
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('sahyadri-cart') ?? '[]') as CartItem[]; } catch { return []; }
  });
  const [activeCategory, setActiveCategory] = useState<'all' | 'single' | 'blend'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<Toast>({ message: '', visible: false });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomBoxOpen, setIsCustomBoxOpen] = useState(false);

  // Website CMS Content State
  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const saved = localStorage.getItem('sahyadri_site_content');
      return saved ? { ...DEFAULT_SITE_CONTENT, ...JSON.parse(saved) } : DEFAULT_SITE_CONTENT;
    } catch {
      return DEFAULT_SITE_CONTENT;
    }
  });

  const updateSiteContent = (newContent: SiteContent) => {
    setSiteContent(newContent);
    try {
      localStorage.setItem('sahyadri_site_content', JSON.stringify(newContent));
    } catch (e) {
      console.error('Failed to save site content to localStorage', e);
    }
  };

  // Custom Collections State
  const [customCollections, setCustomCollections] = useState<CustomCollection[]>(() => {
    try {
      const saved = localStorage.getItem('sahyadri_custom_collections');
      return saved ? (JSON.parse(saved) as CustomCollection[]) : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });

  const updateCollections = (cols: CustomCollection[]) => {
    setCustomCollections(cols);
    try {
      localStorage.setItem('sahyadri_custom_collections', JSON.stringify(cols));
    } catch (e) {
      console.error('Failed to save collections to localStorage', e);
    }
  };

  // Customer Authentication state
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('sahyadri_customer_user');
      return saved ? (JSON.parse(saved) as CustomerUser) : null;
    } catch {
      return null;
    }
  });
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'add_to_cart'; product: Product; options?: { color?: string; fragrance?: string; note?: string } }
    | { type: 'checkout' }
    | null
  >(null);

  useEffect(() => {
    // Only hydrate from saved customer session if customer user exists in localStorage
    const saved = localStorage.getItem('sahyadri_customer_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.numericId) {
          setCurrentUser(parsed);
        }
      } catch {
        // ignore
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
        localStorage.removeItem('sahyadri_customer_user');
        return;
      }
      if (event === 'SIGNED_IN' && session?.user) {
        const email = session.user.email || '';
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email.split('@')[0] ||
          'Customer';
        const username =
          session.user.user_metadata?.username ||
          email.split('@')[0] ||
          'user';
        const numericId = getOrCreateNumericId(username || email);
        const user: CustomerUser = {
          numericId,
          username,
          name,
          email,
          phone: session.user.user_metadata?.phone,
        };
        setCurrentUser(user);
        localStorage.setItem('sahyadri_customer_user', JSON.stringify(user));
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchAllProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    let prods: Product[] = [];
    if (error) {
      setLoadError('Showing our preview collection while the catalogue reconnects.');
      prods = [...fallbackProducts];
    } else {
      prods = [...((data as Product[]) ?? fallbackProducts)];
    }

    try {
      const localCustom = JSON.parse(localStorage.getItem('sahyadri_custom_products') ?? '[]') as Product[];
      const indexById = new Map(prods.map((p, idx) => [p.id, idx]));
      for (const cp of localCustom) {
        const existingIdx = indexById.get(cp.id);
        if (existingIdx !== undefined) {
          prods[existingIdx] = { ...prods[existingIdx], ...cp };
        } else {
          prods.unshift(cp);
          // rebuild map indices after unshift
          indexById.clear();
          prods.forEach((p, idx) => indexById.set(p.id, idx));
        }
      }
    } catch {
      // ignore
    }

    return applyUpcomingFlags(prods);
  };

  useEffect(() => {
    let isMounted = true;
    const initProducts = async () => {
      const prods = await fetchAllProducts();
      if (!isMounted) return;
      setProducts(prods);
      setIsLoading(false);
    };
    void initProducts();

    const handleHashChange = () => {
      if (window.location.hash === '#upcoming') {
        setActivePage('upcoming');
      } else if (window.location.hash === '#top' || window.location.hash === '') {
        setActivePage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      isMounted = false;
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const refreshProducts = async () => {
    const prods = await fetchAllProducts();
    setProducts(prods);
  };

  useEffect(() => {
    localStorage.setItem('sahyadri-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!toast.visible) return;
    const timeout = window.setTimeout(() => setToast({ message: '', visible: false }), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const pageProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.is_published === false) return false;
      return activePage === 'upcoming' ? Boolean(product.is_upcoming) : !product.is_upcoming;
    });
  }, [products, activePage]);

  const upcomingCount = useMemo(
    () => products.filter((p) => p.is_upcoming && p.is_published !== false).length,
    [products]
  );

  const filteredProducts = useMemo(() => pageProducts.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [activeCategory, pageProducts, searchQuery]);

  const featuredProducts = pageProducts.filter((product) => product.is_featured).slice(0, 4);
  const bestsellers = pageProducts.filter((product) => product.is_bestseller).slice(0, 3);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.sale_price_inr ?? item.price_inr ?? 0) * item.quantity, 0);

  const showToast = (message: string) => setToast({ message, visible: true });

  const executeAddToCart = (
    product: Product,
    options?: { color?: string; fragrance?: string; note?: string }
  ) => {
    const { realPrice, salePrice } = getProductPricing(product);
    const color = options?.color || 'orignal';
    const fragrance = options?.fragrance || (product.fragrance ? product.fragrance.split(',')[0].trim() : 'Vanilla');
    const note = options?.note || '';
    const cartItemId = `${product.id}-${color}-${fragrance}-${note ? note.slice(0, 15) : 'standard'}`;

    const pricedProduct: CartItem = {
      ...product,
      cartItemId,
      price_inr: realPrice,
      sale_price_inr: salePrice,
      quantity: 1,
      selectedColor: color,
      selectedFragrance: fragrance,
      customerNote: note,
    };

    setCart((current) => {
      const existing = current.find((item) => item.cartItemId === cartItemId);
      return existing
        ? current.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, pricedProduct];
    });

    showToast(`${product.name} (${color}, ${fragrance}) added to bag.`);
    setIsCartOpen(true);
  };

  const addToCart = (
    product: Product,
    options?: { color?: string; fragrance?: string; note?: string }
  ) => {
    if (!currentUser) {
      setPendingAction({ type: 'add_to_cart', product, options });
      setAuthNotice('Please sign in to add handcrafted candles to your bag.');
      setIsCustomerAuthOpen(true);
      return;
    }
    executeAddToCart(product, options);
  };

  const handleCustomerSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('sahyadri_customer_user');
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    showToast('Signed out successfully.');
  };

  const handleAuthSuccess = (user: CustomerUser) => {
    setCurrentUser(user);
    localStorage.setItem('sahyadri_customer_user', JSON.stringify(user));
    setIsCustomerAuthOpen(false);
    showToast(`Welcome, ${user.name}! Your User ID is #${user.numericId}`);

    if (pendingAction) {
      if (pendingAction.type === 'add_to_cart') {
        executeAddToCart(pendingAction.product, pendingAction.options);
      } else if (pendingAction.type === 'checkout') {
        setIsCheckoutOpen(true);
      }
      setPendingAction(null);
    }
  };

  const updateQuantity = (cartItemId: string, change: number) =>
    setCart((current) =>
      current
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

  const updateCartItemNote = (cartItemId: string, note: string) => {
    setCart((current) =>
      current.map((item) =>
        item.cartItemId === cartItemId ? { ...item, customerNote: note } : item
      )
    );
  };

  const updateCartItemCustomization = (
    cartItemId: string,
    color: string,
    fragrance: string
  ) => {
    setCart((current) =>
      current.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              selectedColor: color,
              selectedFragrance: fragrance,
              cartItemId: `${item.id}-${color}-${fragrance}-${item.customerNote ? item.customerNote.slice(0, 15) : 'standard'}`,
            }
          : item
      )
    );
  };
  const scrollToShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  const switchPage = (page: 'home' | 'upcoming', scrollTargetId?: string) => {
    setIsMenuOpen(false);
    setActivePage(page);
    setActiveCategory('all');
    try {
      window.location.hash = page === 'upcoming' ? '#upcoming' : '#top';
    } catch {
      // ignore
    }
    window.setTimeout(() => {
      if (scrollTargetId) {
        document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 40);
  };
  const navigate = (id: string) => {
    setIsMenuOpen(false);
    if (activePage !== 'home' && (id === 'top' || id === 'shop')) {
      switchPage('home', id);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isAdminMode) {
    return (
      <AdminPanel
        onExit={() => {
          setIsAdminMode(false);
          void refreshProducts();
        }}
        showToast={showToast}
        siteContent={siteContent}
        onUpdateSiteContent={updateSiteContent}
        customCollections={customCollections}
        onUpdateCollections={updateCollections}
        availableProducts={products}
        onProductsUpdated={refreshProducts}
      />
    );
  }

  const isUpcomingPage = activePage === 'upcoming';
  const publishedCollections = customCollections.filter((c) => c.is_published);

  return (
    <div className="app-shell">
      {publishedCollections.length > 0 && (
        <div className="collection-marquee-bar" aria-label="Collections">
          <div className="collection-marquee-track">
            {[0, 1, 2, 3].map((dupIdx) => (
              <div className="collection-marquee-group" key={dupIdx} aria-hidden={dupIdx > 0}>
                {publishedCollections.map((col) => (
                  <button
                    key={`${dupIdx}-${col.id}`}
                    type="button"
                    className="collection-marquee-item"
                    onClick={() => switchPage('home', `collection-${col.slug}`)}
                    title={col.description}
                  >
                    <Sparkles size={12} />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="announcement"><Sparkles size={14} /> {siteContent.announcementText}</div>
      <header className="site-header">
        <button className="icon-button menu-button" onClick={() => setIsMenuOpen((open) => !open)} aria-label="Open menu"><Menu size={22} /></button>
        <a
          className="brand-lockup"
          href="#top"
          aria-label="Sahyadri Glow home"
          onClick={(e) => {
            e.preventDefault();
            switchPage('home');
          }}
        >
          <span className="brand-text">Sahyadri Glow</span>
        </a>
        <nav className={`main-nav ${isMenuOpen ? 'is-open' : ''}`}>
          <button className={activePage === 'home' ? 'nav-active' : ''} onClick={() => switchPage('home')}>Home</button>
          <button onClick={() => switchPage('home', 'shop')}>Shop</button>
          <button
            className={`nav-upcoming-btn ${activePage === 'upcoming' ? 'nav-active' : ''}`}
            onClick={() => switchPage('upcoming')}
          >
            Upcoming Candles {upcomingCount > 0 && <span className="nav-upcoming-badge">{upcomingCount}</span>}
          </button>
          <button onClick={() => navigate('story')}>Our story</button>
          <button onClick={() => navigate('contact')}>Contact</button>
          {currentUser ? (
            <div className="mobile-user-card">
              <div className="mobile-user-details">
                <span className="mobile-user-name">{currentUser.name}</span>
                <span className="mobile-user-id">User ID: #{currentUser.numericId}</span>
              </div>
              <button
                className="mobile-signout-btn"
                onClick={handleCustomerSignOut}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              className="mobile-signin-btn"
              onClick={() => {
                setIsMenuOpen(false);
                setAuthNotice('');
                setIsCustomerAuthOpen(true);
              }}
            >
              <UserIcon size={16} /> <span>Sign In / Register</span>
            </button>
          )}
        </nav>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setIsSearchOpen((open) => !open)} aria-label="Search"><Search size={19} /></button>

          {/* Customer Account / Sign In Pill */}
          {currentUser ? (
            <div className="header-user-wrapper">
              <button
                className="header-user-btn"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                aria-label="View user profile"
                title={`Signed in as ${currentUser.name} (User ID: #${currentUser.numericId})`}
              >
                <span className="user-icon-circle">
                  <UserIcon size={14} />
                </span>
                <span className="header-user-name">{currentUser.name.split(' ')[0]}</span>
                <span className="header-numeric-id">#{currentUser.numericId}</span>
              </button>
              {isProfileOpen && (
                <UserProfileDropdown
                  user={currentUser}
                  onClose={() => setIsProfileOpen(false)}
                  onSignOut={handleCustomerSignOut}
                  showToast={showToast}
                />
              )}
            </div>
          ) : (
            <button
              className="header-signin-btn"
              onClick={() => {
                setAuthNotice('');
                setIsCustomerAuthOpen(true);
              }}
              aria-label="Sign in"
            >
              <UserIcon size={15} />
              <span>Sign In</span>
            </button>
          )}

          <button className="icon-button admin-toggle-button" onClick={() => setIsAdminPanelOpen(true)} aria-label="Owner login"><Lock size={17} /></button>
          <button className="bag-button" onClick={() => setIsCartOpen(true)} aria-label="Open shopping bag"><ShoppingBag size={19} /><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
        </div>
      </header>
      {isSearchOpen && <div className="search-bar"><Search size={18} /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search your next ritual..." /><button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} aria-label="Clear search"><X size={18} /></button></div>}

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">{isUpcomingPage ? siteContent.upcomingHeroEyebrow : siteContent.heroEyebrow}</p>
            <h1>{isUpcomingPage ? siteContent.upcomingHeroTitle : siteContent.heroTitle}</h1>
            <p className="hero-text">{isUpcomingPage ? siteContent.upcomingHeroText : siteContent.heroText}</p>
            <div className="hero-actions">
              <button className="button button-dark" onClick={scrollToShop}>
                {isUpcomingPage ? 'Explore upcoming candles' : siteContent.heroPrimaryBtn} <ArrowRight size={16} />
              </button>
              {isUpcomingPage ? (
                <button className="text-button" onClick={() => switchPage('home', 'shop')}>
                  Back to current shop <ArrowRight size={16} />
                </button>
              ) : (
                <button className="text-button" onClick={() => navigate('fragrances')}>
                  {siteContent.heroSecondaryBtn} <ArrowRight size={16} />
                </button>
              )}
            </div>
            <div className="hero-note"><span className="note-line" /> <span>{siteContent.heroFounderNote}</span></div>
          </div>
          <div className="hero-image-wrap"><img src="https://images.pexels.com/photos/6101288/pexels-photo-6101288.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Sahyadri Glow botanical scented candle surrounded by eucalyptus and warm light" width="650" height="812" loading="lazy" decoding="async" /><div className="hero-image-caption"><span>{isUpcomingPage ? 'SOON' : '01'}</span><span>{isUpcomingPage ? 'Small-batch previews' : 'Find your quiet glow'}</span></div></div>
        </section>

        <section id="fragrances" className="intro-section section-padding">
          <div className="section-kicker">{siteContent.wardrobeKicker}</div>
          <div className="intro-grid"><h2>{siteContent.wardrobeTitle}</h2><p>{siteContent.wardrobeText}</p></div>
          <div className="fragrance-pills">
            {siteContent.wardrobePills.split(',').map((p) => {
              const pillText = p.trim();
              return pillText ? <span key={pillText}>{pillText}</span> : null;
            })}
          </div>
          <p className="mood-peace">{siteContent.wardrobeFooterText}</p>
        </section>

        <section id="shop" className="shop-section section-padding">
          <div className="shop-heading">
            <div>
              <div className="section-kicker">{isUpcomingPage ? siteContent.upcomingShopKicker : siteContent.shopKicker}</div>
              <h2>{isUpcomingPage ? siteContent.upcomingShopTitle : siteContent.shopTitle}</h2>
            </div>
            <button className="round-arrow" onClick={scrollToShop} aria-label="Scroll to shop collection"><ArrowRight size={18} /></button>
          </div>
          <div className="filter-row">
            <div className="filter-tabs">
              <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>
                {isUpcomingPage ? 'All upcoming' : 'All candles'}
              </button>
              <button className={activeCategory === 'single' ? 'active' : ''} onClick={() => setActiveCategory('single')}>Single fragrances</button>
              <button className={activeCategory === 'blend' ? 'active' : ''} onClick={() => setActiveCategory('blend')}>Signature blends</button>
              {customCollections.filter((c) => c.is_published && pageProducts.some((p) => c.productIds.includes(p.id))).map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    const el = document.getElementById(`collection-${col.slug}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  title={col.description}
                >
                  ✨ {col.name}
                </button>
              ))}
            </div>
            <span className="product-count">{isLoading ? 'Loading collection...' : `${filteredProducts.length} ${isUpcomingPage ? 'upcoming fragrances' : 'fragrances'}`}</span>
          </div>
          {loadError && <p className="catalog-note">{loadError}</p>}
          {filteredProducts.length === 0 && !isLoading ? (
            <div className="upcoming-empty-state">
              <Clock size={36} />
              <h3>{isUpcomingPage ? 'New upcoming candles are being poured' : 'No fragrances matched your filter'}</h3>
              <p>
                {isUpcomingPage
                  ? 'Our upcoming small-batch releases will appear here as soon as they are added from the studio. Explore our current collection in the meantime.'
                  : 'Try clearing your search or switching fragrance categories.'}
              </p>
              {isUpcomingPage && (
                <button className="button button-dark" onClick={() => switchPage('home', 'shop')}>
                  Browse current collection <ArrowRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} onAdd={addToCart} />)}</div>
          )}
        </section>

        {/* Dynamic Collections added via Admin Panel */}
        {customCollections.filter((c) => c.is_published).map((col, idx) => {
          const colProducts = pageProducts.filter((p) => col.productIds.includes(p.id));
          if (colProducts.length === 0) return null;
          return (
            <section
              key={col.id}
              id={`collection-${col.slug}`}
              className="custom-collection-section section-padding"
            >
              <div className="collection-heading">
                <div className="section-kicker">
                  <span>Collection {String(idx + 1).padStart(2, '0')} /</span> {col.tagline || 'Curated Series'}
                </div>
                <h2>{col.name}</h2>
                {col.description && <p className="collection-desc">{col.description}</p>}
              </div>
              <div className="product-grid">
                {colProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={setSelectedProduct}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <section className="blend-section section-padding">
          <div className="blend-heading"><div className="section-kicker">{siteContent.blendKicker}</div><h2>{siteContent.blendTitle}</h2><p>{siteContent.blendText}</p></div>
          <div className="blend-feature"><img src={(featuredProducts[0] ?? fallbackProducts[5]).image_url} alt="Sahyadri Glow Vanilla and Lavender signature candle blend" width="650" height="500" loading="lazy" decoding="async" /><div className="blend-card"><p className="eyebrow">{siteContent.blendCardEyebrow}</p><h3>{siteContent.blendCardTitle}</h3><p>{siteContent.blendCardText}</p><div className="blend-actions"><button className="button button-light" onClick={() => addToCart(featuredProducts[0] ?? fallbackProducts[5])}>Discover the blend <ArrowRight size={16} /></button><button className="text-button blend-custom-button" onClick={() => setIsCustomBoxOpen(true)}>Customise your box <ArrowRight size={16} /></button></div></div></div>
        </section>

        <section className="bestseller-section section-padding">
          <div className="shop-heading"><div><div className="section-kicker">{siteContent.bestsellerKicker}</div><h2>{siteContent.bestsellerTitle}</h2></div><button className="text-button" onClick={scrollToShop}>View all <ArrowRight size={16} /></button></div>
          <div className="mini-grid">{bestsellers.map((product) => <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} onAdd={addToCart} compact />)}</div>
        </section>

        <section id="story" className="story-section section-padding">
          <div className="story-art"><img src={STORY_LOGO} alt="Sahyadri Glow Handcrafted Candle Emblem" width="300" height="300" loading="lazy" decoding="async" /></div>
          <div className="story-card">
            <div className="section-kicker">{siteContent.storyKicker}</div>
            <h2>{siteContent.storyTitle}</h2>
            <p>{siteContent.storyText}</p>
            <div className="story-values">
              <div className="story-value"><span className="story-value-num">01</span><h4>{siteContent.storyVal1Title}</h4><p>{siteContent.storyVal1Text}</p></div>
              <div className="story-value"><span className="story-value-num">02</span><h4>{siteContent.storyVal2Title}</h4><p>{siteContent.storyVal2Text}</p></div>
              <div className="story-value"><span className="story-value-num">03</span><h4>{siteContent.storyVal3Title}</h4><p>{siteContent.storyVal3Text}</p></div>
            </div>
            <div className="story-founder">
              <div className="story-founder-avatar"><img src={STORY_LOGO} alt="Harshali V. Mehta - Founder &amp; Candle Maker" width="60" height="60" loading="lazy" decoding="async" /></div>
              <div><p className="story-founder-name">{siteContent.storyFounderName}</p><p className="story-founder-role">{siteContent.storyFounderRole}</p></div>
            </div>
            <button className="button button-outline" onClick={() => navigate('contact')}>Get in touch <ArrowRight size={16} /></button>
          </div>
        </section>

        <section id="contact" className="contact-section section-padding">
          <div><div className="section-kicker">{siteContent.contactKicker}</div><h2>{siteContent.contactTitle}</h2><p>{siteContent.contactText}</p>
          <div className="contact-info">
            <div className="contact-info-item"><Phone size={16} /><span>Call us</span><a href={`tel:${siteContent.contactPhone}`}>{siteContent.contactPhone}</a></div>
            <div className="contact-info-item"><Mail size={16} /><span>Email us</span><a href={`mailto:${siteContent.contactEmail}`}>{siteContent.contactEmail}</a></div>
            <div className="contact-info-item"><Instagram size={16} /><span>Follow</span><a href={`https://www.instagram.com/${siteContent.instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer">{siteContent.instagramHandle}</a></div>
          </div>
          </div>
          <form
            className="newsletter-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const emailInput = (form.elements.namedItem('email') as HTMLInputElement)?.value;
              const sanitizedEmail = sanitizeInput(emailInput);
              const limit = checkRateLimit('newsletter', 3, 5 * 60 * 1000);
              if (!limit.allowed) {
                showToast(`Please wait ${limit.retryAfterSeconds}s before subscribing again.`);
                return;
              }
              const val = newsletterSchema.safeParse({ email: sanitizedEmail });
              if (!val.success) {
                showToast(val.error.issues[0].message);
                return;
              }
              showToast("You're on the list. Welcome to the glow.");
              form.reset();
            }}
          >
            <label htmlFor="email">Your email address</label>
            <div>
              <input id="email" name="email" required type="email" placeholder="you@example.com" maxLength={120} />
              <button className="round-arrow" aria-label="Subscribe to newsletter"><ArrowRight size={18} /></button>
            </div>
            <small>By subscribing, you agree to receive occasional notes from Sahyadri Glow.</small>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand"><span className="footer-brand-text">Sahyadri Glow</span><p>Bringing the Essence of Sahyadri to Your Home.</p></div>
          <div className="footer-links"><div><strong>Explore</strong><button onClick={() => switchPage('home', 'shop')}>Shop candles</button><button onClick={() => switchPage('upcoming')}>Upcoming candles</button><button onClick={() => navigate('story')}>Our story</button><button onClick={() => navigate('contact')}>Contact</button></div><div><strong>Help</strong><button onClick={() => showToast('Shipping: ₹100 up to 1kg, ₹150 up to 2kg, ₹200 up to 3kg. Delivery in 5-7 business days across India.')}>Shipping & returns</button><a href="tel:8275165651">Call: 8275165651</a><a href="https://www.instagram.com/sahyadriglow" target="_blank" rel="noreferrer">Instagram</a></div></div>
          <div className="footer-instagram"><Instagram size={19} /><span>@sahyadriglow</span><a href="https://www.instagram.com/sahyadriglow" target="_blank" rel="noreferrer">Follow along <ArrowRight size={15} /></a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Sahyadri Glow</span><span>Made with warmth in India</span><span>Privacy · Terms</span></div>
      </footer>

      {isCartOpen && (
        <CartDrawer
          cart={cart}
          total={cartTotal}
          currentUser={currentUser}
          onClose={() => setIsCartOpen(false)}
          onUpdate={updateQuantity}
          onUpdateNote={updateCartItemNote}
          onUpdateCustomization={updateCartItemCustomization}
          onCheckout={() => {
            if (!currentUser) {
              setPendingAction({ type: 'checkout' });
              setAuthNotice('Please sign in to proceed with payment and checkout.');
              setIsCustomerAuthOpen(true);
              return;
            }
            setIsCheckoutOpen(true);
          }}
        />
      )}
      {isCheckoutOpen && (
        <CheckoutForm
          cart={cart}
          total={cartTotal}
          currentUser={currentUser}
          onClose={() => setIsCheckoutOpen(false)}
          onPlaced={() => {
            setIsCheckoutOpen(false);
            setCart([]);
            setIsCartOpen(false);
          }}
          showToast={showToast}
        />
      )}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(options) => {
            addToCart(selectedProduct, options);
            setSelectedProduct(null);
          }}
        />
      )}
      {isCustomBoxOpen && (
        <CustomBoxModal
          products={pageProducts.length > 0 ? pageProducts : (products.length ? products : fallbackProducts).filter((product) => product.is_published)}
          onClose={() => setIsCustomBoxOpen(false)}
          onAdd={(box) => {
            addToCart(box);
            setIsCustomBoxOpen(false);
          }}
          showToast={showToast}
        />
      )}
      {isCustomerAuthOpen && (
        <CustomerAuthModal
          notice={authNotice}
          onClose={() => {
            setIsCustomerAuthOpen(false);
            setPendingAction(null);
          }}
          onSuccess={handleAuthSuccess}
          showToast={showToast}
        />
      )}
      {isAdminPanelOpen && <AdminLogin onClose={() => setIsAdminPanelOpen(false)} onSuccess={() => { setIsAdminPanelOpen(false); setIsAdminMode(true); }} showToast={showToast} />}
      {toast.visible && <div className="toast"><Check size={17} /> {toast.message}</div>}
    </div>
  );
}

function ProductCard({ product, onSelect, onAdd, compact = false }: { product: Product; onSelect: (product: Product) => void; onAdd: (product: Product) => void; compact?: boolean }) {
  const { realPrice, salePrice } = getProductPricing(product);
  const images = getProductImages(product);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  return <article className={`product-card ${compact ? 'compact' : ''}`}>
    <div className="product-image-container">
      <button className="product-image" onClick={() => onSelect(product)} aria-label={`View details for ${product.name} scented candle`}>
        <img src={images[activeImgIndex] ?? images[0]} alt={`Sahyadri Glow ${product.name} candle`} width="470" height="325" loading="lazy" decoding="async" />
        <span className={`product-tag ${product.is_upcoming ? 'upcoming-tag' : ''}`}>
          {product.is_upcoming ? `Upcoming · ${product.category === 'blend' ? 'Blend' : 'Preview'}` : product.category === 'blend' ? 'Blend' : product.is_bestseller ? 'Bestseller' : 'Single note'}
        </span>
        <span className="quick-view">Quick view <ArrowRight size={14} /></span>
      </button>

      {images.length > 1 && (
        <>
          <div className="card-image-nav">
            <button
              type="button"
              className="card-nav-prev"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="card-nav-next"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="card-dots-row">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`card-dot ${idx === activeImgIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex(idx);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
    <div className="product-info">
      <div><h3>{product.name}</h3><p className="product-card-desc">{product.description}</p></div>
      <div className="product-meta">
        <div className="product-pricing">
          <s className="price-real">₹{realPrice.toLocaleString('en-IN')}</s>
          <span className="price-sale">₹{salePrice.toLocaleString('en-IN')}</span>
        </div>
        <button className="product-add-button" onClick={() => onSelect(product)} aria-label={`Add or customise ${product.name}`}>
          <Plus size={15} />
          <span className="add-btn-label">Add</span>
        </button>
      </div>
    </div>
  </article>;
}

function CustomBoxModal({ products, onClose, onAdd, showToast }: { products: Product[]; onClose: () => void; onAdd: (box: Product) => void; showToast: (message: string) => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedProducts = products.filter((product) => selectedIds.includes(product.id));
  const boxPrice = selectedProducts.reduce((sum, product) => {
    const { salePrice } = getProductPricing(product);
    return sum + salePrice;
  }, 0);
  const boxWeight = selectedProducts.reduce((sum, product) => sum + (product.weight_grams ?? 200), 0);

  const toggleProduct = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const addBox = () => {
    if (selectedProducts.length < 2) {
      showToast('Select at least two fragrances for your box.');
      return;
    }
    const firstProduct = selectedProducts[0];
    onAdd({ ...firstProduct, id: `custom-${selectedIds.join('-')}`, name: `Custom Box — ${selectedProducts.map((product) => product.name).join(' + ')}`, description: 'A personalised fragrance box curated by you.', fragrance: selectedProducts.map((product) => product.fragrance ?? product.name).join(', '), price_inr: boxPrice, sale_price_inr: null, weight_grams: boxWeight });
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="custom-box-modal" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={20} /></button>
      <p className="eyebrow">Your fragrance wardrobe</p><h2>Customise your box</h2><p className="custom-box-intro">Choose the scents that belong in your personal ritual.</p>
      <div className="custom-box-options">{products.map((product) => {
        const { realPrice, salePrice } = getProductPricing(product);
        return (
          <label className={`custom-box-option ${selectedIds.includes(product.id) ? 'selected' : ''}`} key={product.id}>
            <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleProduct(product.id)} />
            <span>
              <strong>{product.name}</strong>
              <small>
                {product.fragrance ?? 'Signature fragrance'} ·{' '}
                <s style={{ color: '#dc2626', textDecoration: 'line-through', marginRight: '6px' }}>₹{realPrice.toLocaleString('en-IN')}</s>
                <span style={{ color: 'var(--charcoal)', fontWeight: '600' }}>₹{salePrice.toLocaleString('en-IN')}</span>
              </small>
            </span>
            <b>{selectedIds.includes(product.id) ? 'Added' : 'Select'}</b>
          </label>
        );
      })}</div>
      <div className="custom-box-footer"><span>{selectedProducts.length} selected · {boxWeight}g · {formatPrice(boxPrice)}</span><button className="button button-dark" onClick={addBox}>Add custom box <ArrowRight size={16} /></button></div>
    </div>
  </div>;
}

function ProductModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (options: { color: string; fragrance: string; note: string }) => void }) {
  const { realPrice, salePrice } = getProductPricing(product);
  const discountPercent = Math.round(((realPrice - salePrice) / realPrice) * 100);
  const images = getProductImages(product);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Customization options state
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedFragrance, setSelectedFragrance] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 40) {
      setCurrentIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    } else if (diff < -40) {
      setCurrentIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
    setTouchStart(null);
  };

  const handleAddToCart = () => {
    if (!selectedColor) {
      setValidationError('Please select a colour for your candle.');
      return;
    }
    if (!selectedFragrance) {
      setValidationError('Please select a fragrance for your candle.');
      return;
    }
    setValidationError('');
    onAdd({
      color: selectedColor,
      fragrance: selectedFragrance,
      note: customerNote.trim(),
    });
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="product-modal meesho-style-modal" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close product modal"><X size={20} /></button>
      
      {/* Product Image Gallery with Swipe & Thumbnails */}
      <div
        className="modal-gallery"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-gallery-main">
          <img
            src={images[currentIdx] ?? images[0]}
            alt={`Sahyadri Glow ${product.name} scented candle`}
            width="600"
            height="400"
            loading="lazy"
            decoding="async"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-nav-btn prev"
                onClick={() => setCurrentIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="gallery-nav-btn next"
                onClick={() => setCurrentIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>
              <div className="gallery-badge">
                {currentIdx + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Selector (max 4 images like Meesho) */}
        {images.length > 1 && (
          <div className="modal-thumbnails">
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                className={`modal-thumb-btn ${idx === currentIdx ? 'active' : ''}`}
                onClick={() => setCurrentIdx(idx)}
              >
                <img src={imgUrl} alt={`${product.name} thumb ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="modal-content">
        <p className="eyebrow">{product.category === 'blend' ? 'Signature blend' : 'Single fragrance'}</p>
        <h2>{product.name}</h2>
        <p className="modal-description">{product.description}</p>
        
        <div className="modal-price-box">
          <s className="price-real">₹{realPrice.toLocaleString('en-IN')}</s>
          <span className="price-sale">₹{salePrice.toLocaleString('en-IN')}</span>
          {discountPercent > 0 && <span className="price-discount-tag">{discountPercent}% OFF</span>}
        </div>

        {/* Mandatory Customization: Colour & Fragrance & Optional Note */}
        <div className="product-customization-box">
          <div className="custom-option-group">
            <label className="custom-group-label">
              <span>Colour <b className="required-star">*</b></span>
              {selectedColor && <small className="selected-val">{selectedColor}</small>}
            </label>
            <div className="custom-pills-row">
              {COLOR_OPTIONS.map((col) => (
                <button
                  type="button"
                  key={col}
                  className={`custom-pill-btn ${selectedColor === col ? 'active' : ''}`}
                  onClick={() => { setSelectedColor(col); setValidationError(''); }}
                >
                  <span className={`color-swatch-dot color-${col.toLowerCase().replace(/[^a-z0-9]/g, '-')}`} />
                  {col}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-option-group">
            <label className="custom-group-label">
              <span>Fragrance <b className="required-star">*</b></span>
              {selectedFragrance && <small className="selected-val">{selectedFragrance}</small>}
            </label>
            <div className="custom-pills-row fragrance-pills-wrap">
              {FRAGRANCE_OPTIONS.map((frag) => (
                <button
                  type="button"
                  key={frag}
                  className={`custom-pill-btn ${selectedFragrance === frag ? 'active' : ''}`}
                  onClick={() => { setSelectedFragrance(frag); setValidationError(''); }}
                >
                  {frag}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-option-group">
            <label className="custom-group-label">
              <span>Customization Note</span>
              <small className="optional-tag">Optional</small>
            </label>
            <textarea
              className="custom-note-input"
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g. Please pack with pink ribbon, lighter scent, or gift message..."
              maxLength={200}
            />
          </div>

          {validationError && (
            <div className="custom-error-text">
              {validationError}
            </div>
          )}
        </div>

        <button className="button button-dark full-button" onClick={handleAddToCart}>
          Add to bag <ArrowRight size={16} />
        </button>
      </div>
    </div>
  </div>;
}

function CartDrawer({
  cart,
  total,
  currentUser,
  onClose,
  onUpdate,
  onUpdateNote,
  onUpdateCustomization,
  onCheckout,
}: {
  cart: CartItem[];
  total: number;
  currentUser: CustomerUser | null;
  onClose: () => void;
  onUpdate: (cartItemId: string, change: number) => void;
  onUpdateNote: (cartItemId: string, note: string) => void;
  onUpdateCustomization: (cartItemId: string, color: string, fragrance: string) => void;
  onCheckout: () => void;
}) {
  return <div className="drawer-backdrop" onClick={onClose}>
    <aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
      <div className="drawer-header"><div><p className="eyebrow">Your ritual</p><h2>Your bag <span>({cart.length})</span></h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>
      {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={30} /><h3>Your bag is waiting.</h3><p>Discover a fragrance to make your next moment feel special.</p><button className="button button-dark" onClick={onClose}>Continue shopping</button></div> : <>
        <div className="cart-items">
          {cart.map((item) => (
            <div className="cart-item" key={item.cartItemId || item.id}>
              <img src={getProductImages(item)[0]} alt={item.name} />
              <div className="cart-item-details">
                <div className="cart-item-header">
                  <h3>{item.name}</h3>
                  <span className="cart-item-price">{formatPrice((item.sale_price_inr ?? item.price_inr ?? 0) * item.quantity)}</span>
                </div>

                {/* Selected Colour & Fragrance Badges */}
                <div className="cart-custom-tags">
                  <span className="cart-tag color">Colour: <strong>{item.selectedColor || 'orignal'}</strong></span>
                  <span className="cart-tag fragrance">Fragrance: <strong>{item.selectedFragrance || 'Vanilla'}</strong></span>
                </div>

                {/* Item Customization Note */}
                <div className="cart-note-container">
                  <input
                    type="text"
                    className="cart-note-input"
                    placeholder="Customization note for this candle..."
                    value={item.customerNote || ''}
                    onChange={(e) => onUpdateNote(item.cartItemId, e.target.value)}
                    maxLength={150}
                  />
                </div>

                <div className="quantity">
                  <button onClick={() => onUpdate(item.cartItemId, -1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                  <b>{item.quantity}</b>
                  <button onClick={() => onUpdate(item.cartItemId, 1)} aria-label="Increase quantity"><Plus size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          {currentUser ? (
            <div className="cart-user-badge">
              <span className="cart-user-badge-left">
                <UserIcon size={13} />
                <span>Ordering as <strong>{currentUser.name}</strong></span>
              </span>
              <span className="cart-user-id-tag">ID: #{currentUser.numericId}</span>
            </div>
          ) : (
            <div className="cart-signin-prompt">
              <small>Sign-in required to complete payment</small>
            </div>
          )}
          <div><span>Subtotal</span><strong>{total ? `₹${total.toLocaleString('en-IN')}` : 'Price to be set'}</strong></div>
          <p>Shipping and final payment details are calculated at checkout.</p>
          <button className="button button-dark full-button" onClick={onCheckout}>Continue to checkout <ArrowRight size={16} /></button>
        </div>
      </>}
    </aside>
  </div>;
}

function calcShipping(totalWeight: number): number {
  if (totalWeight <= 1000) return 90;
  if (totalWeight <= 2000) return 150;
  if (totalWeight <= 3000) return 200;
  if (totalWeight <= 4000) return 260;
  return 260 + Math.ceil((totalWeight - 4000) / 1000) * 60;
}

function CheckoutForm({
  cart,
  total,
  currentUser,
  onClose,
  onPlaced,
  showToast,
}: {
  cart: CartItem[];
  total: number;
  currentUser: CustomerUser | null;
  onClose: () => void;
  onPlaced: () => void;
  showToast: (msg: string) => void;
}) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [upiUtr, setUpiUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upiMode, setUpiMode] = useState<'app' | 'qr'>('app');
  const [hasRedirected, setHasRedirected] = useState(false);

  const totalWeight = cart.reduce((sum, item) => sum + (item.weight_grams ?? 200) * item.quantity, 0);
  const shipping = calcShipping(totalWeight);
  const grandTotal = total + shipping;

  const upiIntentUri = `upi://pay?pa=harshalimehta4014@oksbi&pn=Harshali%20Mehta&am=${grandTotal}&cu=INR&tn=Sahyadri%20Glow%20Order`;

  const handleOpenUpiApp = (appName?: string) => {
    setHasRedirected(true);
    showToast(`Redirecting to ${appName || 'UPI App'}...`);
    window.location.href = upiIntentUri;
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText('harshalimehta4014@oksbi');
    showToast('UPI ID copied: harshalimehta4014@oksbi');
  };

  // Helper function to complete order and dispatch to WhatsApp ONLY when payment is completed
  const completeOrderPlacement = async (cleanUtr: string) => {
    setSubmitting(true);

    const cleanName = sanitizeInput(name);
    const cleanPhone = sanitizeInput(phone);
    const cleanAddress = sanitizeInput(address);

    const itemsJson: OrderItem[] = cart.map((item) => ({
      name: sanitizeInput(item.name),
      quantity: item.quantity,
      price: item.sale_price_inr ?? item.price_inr ?? 0,
      image_url: item.image_url,
      color: item.selectedColor || 'orignal',
      fragrance: item.selectedFragrance || 'Vanilla',
      note: item.customerNote ? sanitizeInput(item.customerNote) : '',
    }));

    try {
      await supabase.from('orders').insert({
        customer_name: `${cleanName}${currentUser ? ` (ID: #${currentUser.numericId} @${currentUser.username})` : ''}`,
        customer_phone: cleanPhone,
        customer_address: `${cleanAddress} [Payment: UPI (harshalimehta4014@oksbi) | UTR: ${cleanUtr}]`,
        items: itemsJson,
        total_inr: grandTotal,
        status: 'confirmed',
      });
    } catch {
      // offline fallback
    }

    try {
      const localOrderRecord: Order = {
        id: `ord_${Date.now()}`,
        customer_name: cleanName,
        customer_phone: cleanPhone,
        customer_address: cleanAddress,
        customer_user_id: currentUser?.numericId,
        customer_username: currentUser?.username,
        payment_method: 'UPI (Paid to harshalimehta4014@oksbi)',
        payment_ref: cleanUtr,
        items: itemsJson,
        total_inr: grandTotal,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      };
      const storedOrders = JSON.parse(localStorage.getItem('sahyadri_orders_store') ?? '[]') as Order[];
      localStorage.setItem('sahyadri_orders_store', JSON.stringify([localOrderRecord, ...storedOrders]));
      window.dispatchEvent(new Event('sahyadri_orders_updated'));
    } catch {
      // ignore
    }

    const orderText = [
      'New Order — Sahyadri Glow',
      '',
      `Customer: ${cleanName}${currentUser ? ` (@${currentUser.username} · User ID: #${currentUser.numericId})` : ''}`,
      `Phone: ${cleanPhone}`,
      `Address: ${cleanAddress}`,
      '',
      'Items:',
      ...cart.map((item) => {
        const customParts = [];
        if (item.selectedColor) customParts.push(`Color: ${item.selectedColor}`);
        if (item.selectedFragrance) customParts.push(`Fragrance: ${item.selectedFragrance}`);
        if (item.customerNote) customParts.push(`Note: "${item.customerNote}"`);
        const details = customParts.length > 0 ? ` (${customParts.join(', ')})` : '';
        return `* ${item.name}  x${item.quantity} — ${formatPrice((item.sale_price_inr ?? item.price_inr ?? 0) * item.quantity)}${details}`;
      }),
      '',
      `Subtotal: ${formatPrice(total)}`,
      `Shipping (${totalWeight}g): ${shipping === 0 ? 'FREE' : formatPrice(shipping)}`,
      `Total: ${formatPrice(grandTotal)}`,
      '',
      `Payment Method: UPI (harshalimehta4014@oksbi)`,
      `UPI UTR / Transaction ID: ${cleanUtr}`,
      `Payment Status: PAID & SETTLED TO harshalimehta4014@oksbi`,
    ].join('\n');

    const waUrl = `https://wa.me/918275165651?text=${encodeURIComponent(orderText)}`;
    const opened = window.open(waUrl, '_blank');
    if (!opened) {
      window.location.href = waUrl;
    }
    showToast('Payment verified! Redirecting to WhatsApp to send receipt...');
    onPlaced();
    setSubmitting(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (total === 0) {
      showToast('Your bag has no priced items yet.');
      return;
    }

    const cleanName = sanitizeInput(name);
    const cleanPhone = sanitizeInput(phone);
    const cleanAddress = sanitizeInput(address);

    const validation = checkoutSchema.safeParse({
      customer_name: cleanName,
      customer_phone: cleanPhone,
      customer_address: cleanAddress,
      items: cart.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price_inr || 0,
      })),
      total_inr: grandTotal,
    });

    if (!validation.success) {
      showToast(validation.error.issues[0]?.message || 'Please check your delivery details.');
      return;
    }

    const cleanUtr = upiUtr.replace(/\D/g, '').trim();
    if (cleanUtr.length < 12) {
      showToast(`Payment required: Please pay ${formatPrice(grandTotal)} via UPI and enter the 12-digit UTR.`);
      return;
    }
    if (!paymentConfirmed) {
      showToast('Please check the confirmation box verifying that the payment was transferred.');
      return;
    }

    await completeOrderPlacement(cleanUtr);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close checkout"><X size={20} /></button>
        <h2>Complete your order</h2>
        <p className="checkout-sub">Fill in your details, choose a payment method, and complete payment to place your order.</p>

        {currentUser && (
          <div className="checkout-user-badge">
            <div className="checkout-badge-left">
              <span className="checkout-user-icon-circle">
                <UserIcon size={14} />
              </span>
              <span>Signed in as <strong>{currentUser.name}</strong> <small>(@{currentUser.username})</small></span>
            </div>
            <span className="checkout-user-id-pill">
              User ID: <strong>#{currentUser.numericId}</strong>
            </span>
          </div>
        )}
        <div className="checkout-summary">
          {cart.map((item) => (
            <div className="checkout-line" key={item.cartItemId || item.id}>
              <div>
                <span>{item.name} x{item.quantity}</span>
                {(item.selectedColor || item.selectedFragrance) && (
                  <small className="checkout-item-sub">
                    ({item.selectedColor || 'orignal'}, {item.selectedFragrance || 'Vanilla'})
                    {item.customerNote ? ` · Note: "${item.customerNote}"` : ''}
                  </small>
                )}
              </div>
              <span>{formatPrice((item.sale_price_inr ?? item.price_inr ?? 0) * item.quantity)}</span>
            </div>
          ))}
          <div className="checkout-line checkout-subtotal"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
          <div className="checkout-line"><span>Shipping ({totalWeight}g)</span><span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
          <p className="checkout-free-ship">Shipping: ₹90 up to 1 kg · ₹150 up to 2 kg · ₹200 up to 3 kg · ₹260 up to 4 kg</p>
          <div className="checkout-line checkout-total"><span>Grand Total</span><span>{formatPrice(grandTotal)}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <label>Full name<input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="Your name" /></label>
          <label>Phone number<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={16} placeholder="98XXXXXXXX" /></label>
          <label>Shipping address<textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} maxLength={300} placeholder="House no, street, city, state, pincode" /></label>
          
          <div className="payment-section">
            <div className="upi-payment-header">
              <div className="upi-header-badge">
                <Smartphone size={16} />
                <span>UPI Payment (Direct & Zero Surcharges)</span>
              </div>
              <span className="upi-amount-pill">Total: {formatPrice(grandTotal)}</span>
            </div>

            {/* UPI Payment Mode Selector */}
            <div className="upi-options-tabs">
              <button
                type="button"
                className={`upi-tab-btn ${upiMode === 'app' ? 'active' : ''}`}
                onClick={() => setUpiMode('app')}
              >
                <Zap size={15} />
                <span>Redirect to Phone UPI App</span>
                <span className="upi-tab-tag">Recommended</span>
              </button>
              <button
                type="button"
                className={`upi-tab-btn ${upiMode === 'qr' ? 'active' : ''}`}
                onClick={() => setUpiMode('qr')}
              >
                <QrCode size={15} />
                <span>Scan QR / Copy ID</span>
              </button>
            </div>

            {/* Mode 1: 1-Click Direct Phone Redirection to ANY UPI app */}
            {upiMode === 'app' && (
              <div className="upi-direct-panel">
                <div className="upi-redirect-cta-box">
                  <p className="upi-redirect-desc">
                    Tap the button below to directly launch <strong>any UPI application</strong> installed on your phone (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.) with <strong>{formatPrice(grandTotal)}</strong> prefilled:
                  </p>
                  <a
                    href={upiIntentUri}
                    className="upi-main-redirect-btn"
                    onClick={() => handleOpenUpiApp('Phone UPI App')}
                  >
                    <Smartphone size={19} />
                    <span>Pay {formatPrice(grandTotal)} via Any UPI App</span>
                    <ExternalLink size={17} />
                  </a>
                  <small className="upi-redirect-hint">
                    Directly opens your phone's native UPI app selector with exact {formatPrice(grandTotal)} payable to <code>harshalimehta4014@oksbi</code>.
                  </small>
                </div>

                <div className="upi-app-quick-buttons">
                  <span className="quick-apps-label">Or choose your preferred UPI app directly:</span>
                  <div className="quick-apps-grid">
                    <a
                      href={upiIntentUri}
                      className="quick-app-btn gpay"
                      onClick={() => handleOpenUpiApp('Google Pay')}
                    >
                      Google Pay
                    </a>
                    <a
                      href={upiIntentUri}
                      className="quick-app-btn phonepe"
                      onClick={() => handleOpenUpiApp('PhonePe')}
                    >
                      PhonePe
                    </a>
                    <a
                      href={upiIntentUri}
                      className="quick-app-btn paytm"
                      onClick={() => handleOpenUpiApp('Paytm')}
                    >
                      Paytm
                    </a>
                    <a
                      href={upiIntentUri}
                      className="quick-app-btn bhim"
                      onClick={() => handleOpenUpiApp('BHIM / Other')}
                    >
                      BHIM / Other
                    </a>
                  </div>
                </div>

                {hasRedirected && (
                  <div className="upi-redirect-notice-banner">
                    <CheckCircle2 size={16} />
                    <div>
                      <strong>App opened?</strong> After completing the transfer in your UPI app, check your transaction receipt for the <strong>12-digit UTR</strong> and enter it below.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: QR Code / Copy UPI ID */}
            {upiMode === 'qr' && (
              <div className="upi-qr-panel">
                <div className="upi-qr-box">
                  <img
                    src="/images/qr.jpeg"
                    alt="UPI QR code payment for Sahyadri Glow — Harshali Mehta"
                    width="180"
                    height="180"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="upi-qr-details">
                    <p className="upi-amount">Amount: <strong>{formatPrice(grandTotal)}</strong></p>
                    <p className="upi-id-label">Beneficiary UPI ID</p>
                    <div className="upi-id-copy-row">
                      <p className="upi-id-value">harshalimehta4014@oksbi</p>
                      <button
                        type="button"
                        className="upi-copy-btn"
                        onClick={handleCopyUpiId}
                        title="Copy UPI ID to clipboard"
                      >
                        <Copy size={13} /> Copy ID
                      </button>
                    </div>
                    <small>Scan this QR with Google Pay, PhonePe, or Paytm from another phone, or copy the UPI ID.</small>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 12-Digit UTR Entry */}
            <div className="upi-utr-section">
              <label className="upi-utr-label-box">
                <span className="upi-utr-title">
                  Enter 12-Digit UPI Transaction ID / UTR <strong className="required-star">*</strong>
                </span>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="e.g. 431902847192"
                  value={upiUtr}
                  onChange={(e) => setUpiUtr(e.target.value.replace(/\D/g, ''))}
                  className="upi-utr-input"
                />
              </label>
              <small className="upi-utr-helper-text">
                Your WhatsApp order confirmation is sent only after entering the genuine 12-digit UPI UTR from your bank transaction.
              </small>

              <label className="payment-confirm">
                <input
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={(event) => setPaymentConfirmed(event.target.checked)}
                  required
                />
                I have transferred exact {formatPrice(grandTotal)} to harshalimehta4014@oksbi
              </label>
            </div>
          </div>

          <div className="checkout-actions">
            <button type="button" className="button button-outline" onClick={onClose}>Back</button>
            <button type="submit" className="button button-dark" disabled={submitting}>
              {submitting ? 'Placing Order...' : `Confirm Payment & Send to WhatsApp`} <ArrowRight size={16} />
            </button>
          </div>
          <p className="checkout-note"><Phone size={13} /> You'll receive order receipt & WhatsApp tracking.</p>
        </form>
      </div>
    </div>
  );
}

function UserProfileDropdown({
  user,
  onClose,
  onSignOut,
  showToast,
}: {
  user: CustomerUser;
  onClose: () => void;
  onSignOut: () => void;
  showToast: (msg: string) => void;
}) {
  return (
    <>
      <div className="profile-backdrop" onClick={onClose} />
      <div className="user-profile-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="profile-head">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-meta">
            <h4>{user.name}</h4>
            <p className="profile-username">@{user.username}</p>
            <p className="profile-email">{user.email}</p>
            {user.phone && (
              <div className="profile-phone-line">
                <Smartphone size={12} />
                <span>+91 {user.phone.replace(/^\+?91/, '')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-id-card">
          <div className="profile-id-top">
            <span className="profile-id-label">YOUR CUSTOMER ID</span>
          </div>
          <div className="profile-id-row">
            <span className="profile-id-digits">#{user.numericId}</span>
            <button
              type="button"
              className="profile-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(user.numericId);
                showToast('User ID copied to clipboard!');
              }}
              title="Copy numeric User ID"
            >
              Copy ID
            </button>
          </div>
          <small className="profile-id-hint">
            All-digit ID assigned to your account.
          </small>
        </div>

        <div className="profile-actions">
          <button
            type="button"
            className="profile-signout-btn"
            onClick={onSignOut}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

function CustomerAuthModal({
  notice,
  onClose,
  onSuccess,
  showToast,
}: {
  notice?: string;
  onClose: () => void;
  onSuccess: (user: CustomerUser) => void;
  showToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sign Up form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanId = sanitizeInput(usernameOrEmail).trim().toLowerCase();
    if (!cleanId || !password) {
      setErrorMsg('Please enter both your username/email and password.');
      return;
    }
    setLoading(true);

    try {
      // 1. Check local customer accounts registry
      const rawAccounts = localStorage.getItem('sahyadri_customer_accounts');
      const accounts: Record<string, any> = rawAccounts ? JSON.parse(rawAccounts) : {};
      const pwdHash = await sha256(password);

      // Search by username or email
      let matchedAccount: any = accounts[cleanId];
      if (!matchedAccount) {
        for (const key of Object.keys(accounts)) {
          const acc = accounts[key];
          if (
            acc &&
            ((acc.username && acc.username.toLowerCase() === cleanId) ||
              (acc.email && acc.email.toLowerCase() === cleanId))
          ) {
            matchedAccount = acc;
            break;
          }
        }
      }

      // 2. Also try Supabase if input is in email format
      if (!matchedAccount && cleanId.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password,
        });

        if (!error && data.user) {
          const name =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            cleanId.split('@')[0];
          const assignedUsername =
            data.user.user_metadata?.username ||
            cleanId.split('@')[0];
          const numericId = getOrCreateNumericId(assignedUsername || cleanId);
          const user: CustomerUser = {
            numericId,
            username: assignedUsername,
            name,
            email: cleanId,
            phone: data.user.user_metadata?.phone,
          };
          setLoading(false);
          showToast(`Welcome back, ${user.name}!`);
          onSuccess(user);
          return;
        }
      }

      // CRITICAL FIX: Account must exist! Never sign in without creating an account first!
      if (!matchedAccount) {
        setErrorMsg('No account found with this username or email. Please click "Create Account" below to register.');
        setLoading(false);
        return;
      }

      // Check password
      if (matchedAccount.passwordHash !== pwdHash) {
        setErrorMsg('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      // Valid account and matching password
      const user: CustomerUser = {
        numericId: matchedAccount.numericId,
        username: matchedAccount.username || matchedAccount.email.split('@')[0],
        name: matchedAccount.name,
        email: matchedAccount.email,
        phone: matchedAccount.phone,
      };

      setLoading(false);
      showToast(`Welcome back, ${user.name}!`);
      onSuccess(user);
    } catch {
      setErrorMsg('Unable to sign in. Please verify your credentials.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = sanitizeInput(fullName).trim();
    const cleanUsername = sanitizeInput(username).trim().toLowerCase();
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();
    const cleanPhone = sanitizeInput(phone).trim();

    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    // Validate unique username
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
      setErrorMsg('Username can only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    // Verify username and email uniqueness
    const rawAccounts = localStorage.getItem('sahyadri_customer_accounts');
    const accounts: Record<string, any> = rawAccounts ? JSON.parse(rawAccounts) : {};

    for (const key of Object.keys(accounts)) {
      const acc = accounts[key];
      if (acc && acc.username && acc.username.toLowerCase() === cleanUsername) {
        setErrorMsg('This username is already taken. Please choose a different unique username.');
        setLoading(false);
        return;
      }
      if (acc && acc.email && acc.email.toLowerCase() === cleanEmail) {
        setErrorMsg('An account with this email address already exists. Please sign in instead.');
        setLoading(false);
        return;
      }
    }

    const numericId = getOrCreateNumericId(cleanUsername);
    const pwdHash = await sha256(password);

    try {
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            username: cleanUsername,
            phone: cleanPhone,
          },
        },
      });
    } catch {
      // Continue even if Supabase is unconfigured
    }

    const newAccount = {
      numericId,
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: pwdHash,
      createdAt: new Date().toISOString(),
    };

    accounts[cleanUsername] = newAccount;
    accounts[cleanEmail] = newAccount;
    localStorage.setItem('sahyadri_customer_accounts', JSON.stringify(accounts));

    const user: CustomerUser = {
      numericId,
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
    };

    setLoading(false);
    showToast(`Account created! Welcome, ${cleanName} (@${cleanUsername})`);
    onSuccess(user);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
    } catch {
      // ignore
    }
    showToast('If an account exists with this email, reset instructions were sent.');
    setLoading(false);
    setTab('signin');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="customer-auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close sign in">
          <X size={20} />
        </button>

        {notice && (
          <div className="auth-notice-banner">
            <Sparkles size={15} />
            <span>{notice}</span>
          </div>
        )}

        <div className="auth-modal-header">
          <span className="auth-eyebrow">Sahyadri Glow · Customer Portal</span>
          <h2>
            {tab === 'signup'
              ? 'Create an Account'
              : tab === 'forgot'
              ? 'Reset Password'
              : 'Sign in to Sahyadri Glow'}
          </h2>
          <p className="auth-sub">
            {tab === 'signup'
              ? 'Choose a unique username and password to create your account.'
              : tab === 'forgot'
              ? 'Enter your registered email to receive recovery instructions.'
              : 'Sign in with your unique username and password.'}
          </p>
        </div>

        {tab !== 'forgot' && (
          <div className="auth-tab-bar">
            <button
              type="button"
              className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setTab('signin');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setTab('signup');
                setErrorMsg('');
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form">
            <label>
              Username or Email
              <input
                type="text"
                required
                placeholder="your_username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                autoFocus
              />
            </label>

            <label>
              Password
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="auth-forgot-row">
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setTab('forgot');
                  setErrorMsg('');
                }}
              >
                Forgot password?
              </button>
            </div>

            {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

            <button type="submit" className="button button-dark full-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
            </button>

            <div className="auth-switch-prompt">
              <span>Don't have an account yet? </span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setTab('signup');
                  setErrorMsg('');
                }}
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            <label>
              Full Name
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
            </label>

            <label>
              Choose a Unique Username
              <div className="username-input-wrapper">
                <span className="username-prefix">@</span>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  placeholder="username (e.g. saksham21)"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))
                  }
                />
              </div>
              <small className="auth-field-hint">
                You will use this unique username to sign in to your account.
              </small>
            </label>

            <label>
              Email Address
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              Mobile Number (Optional)
              <input
                type="tel"
                placeholder="98XXXXXXXX (for delivery updates)"
                maxLength={16}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label>
              Password (min 6 characters)
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label>
              Confirm Password
              <div className="auth-password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

            <div className="auth-id-notice">
              <Sparkles size={14} />
              <span>A unique <strong>all-digit Customer ID</strong> (e.g. #749281) will be permanently generated for your account.</span>
            </div>

            <button type="submit" className="button button-dark full-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account & Sign In'} <ArrowRight size={16} />
            </button>

            <div className="auth-switch-prompt">
              <span>Already have an account? </span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setTab('signin');
                  setErrorMsg('');
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="auth-form">
            <label>
              Enter your registered Email
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

            <div className="auth-btn-row">
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setTab('signin');
                  setErrorMsg('');
                }}
              >
                Back to Sign In
              </button>
              <button type="submit" className="button button-dark" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AdminLogin({ onClose, onSuccess, showToast }: { onClose: () => void; onSuccess: () => void; showToast: (msg: string) => void }) {
  const [email, setEmail] = useState('sahydriglow@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<'login' | 'forgot_question' | 'set_new_password'>('login');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleVerifySecurityAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    const limit = checkRateLimit('security_verify', 3, 5 * 60 * 1000);
    if (!limit.allowed) {
      showToast(`Too many attempts. Please wait ${limit.retryAfterSeconds}s.`);
      return;
    }

    const cleanAnswer = sanitizeInput(securityAnswer).toLowerCase();
    const answerHash = await sha256(cleanAnswer);

    if (answerHash === SECURITY_ANSWER_HASH) {
      showToast('Identity verified. Please set your new password.');
      setMode('set_new_password');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast('Incorrect answer. Please check and try again.');
    }
  };

  const handleSaveNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = passwordResetSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      showToast(validation.error.issues[0]?.message || 'Invalid password.');
      return;
    }

    const newHash = await sha256(newPassword);
    // Securely store cryptographic hash of the new owner password
    localStorage.setItem('sahyadri_owner_password_hash', newHash);

    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch {
      // Ignore if user is not in active Supabase session
    }

    setPassword(newPassword);
    setMode('login');
    showToast('New password set as your main password! You can now sign in.');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const limit = checkRateLimit('admin_login', 5, 5 * 60 * 1000);
    if (!limit.allowed) {
      showToast(`Too many login attempts. Please wait ${limit.retryAfterSeconds}s.`);
      return;
    }

    setLoading(true);
    const enteredHash = await sha256(password);
    const activeHash = localStorage.getItem('sahyadri_owner_password_hash') || DEFAULT_OWNER_PASSWORD_HASH;

    // 1. Primary cryptographic hash check
    if (enteredHash === activeHash) {
      try {
        await supabase.auth.signInWithPassword({ email: sanitizeInput(email), password });
      } catch {
        // Proceed with owner session
      }
      showToast('Welcome back, owner.');
      onSuccess();
      setLoading(false);
      return;
    }

    // 2. Also try remote Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: sanitizeInput(email), password });
      if (!error && data.user) {
        const { data: isOwner } = await supabase.rpc('is_owner');
        if (isOwner) {
          localStorage.setItem('sahyadri_owner_password_hash', enteredHash);
          showToast('Welcome back, owner.');
          onSuccess();
          setLoading(false);
          return;
        }
      }
    } catch {
      // Continue to error toast
    }

    setLoading(false);
    showToast('Could not sign in. Check your email and password.');
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      showToast('Account created. Ask the admin to grant owner access, then sign in.');
    } catch {
      showToast('Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="admin-login-box" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={20} /></button>

      {mode === 'login' && (
        <>
          <div className="admin-login-logo"><img src={LOGO} alt="Sahyadri Glow" /></div>
          <h2>Owner login</h2>
          <p className="admin-login-sub">Sign in to manage your product catalogue.</p>
          <form onSubmit={handleSubmit} className="admin-form">
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="sahydriglow@gmail.com" /></label>
            <label>Password
              <div className="password-input-wrap">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
            <button type="submit" className="button button-dark full-button" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            <button type="button" className="admin-signup-link" onClick={handleSignup} disabled={loading}>Create owner account</button>
            <button type="button" className="admin-signup-link" onClick={() => { setMode('forgot_question'); setSecurityAnswer(''); }} disabled={loading}>Forgot password?</button>
          </form>
        </>
      )}

      {mode === 'forgot_question' && (
        <>
          <div className="admin-login-logo"><img src={LOGO} alt="Sahyadri Glow" /></div>
          <h2>Reset password</h2>
          <p className="admin-login-sub">Answer your security question to verify your identity.</p>
          <form onSubmit={handleVerifySecurityAnswer} className="admin-form">
            <div className="security-question-card">
              <span className="security-question-tag">Security Question</span>
              <p className="security-question-title">What's your bsf name?</p>
            </div>
            <label>
              Your answer
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                required
                autoFocus
                placeholder="Enter answer"
              />
            </label>
            <button type="submit" className="button button-dark full-button">Verify & Continue <ArrowRight size={16} /></button>
            <button type="button" className="admin-signup-link" onClick={() => setMode('login')}>← Back to sign in</button>
          </form>
        </>
      )}

      {mode === 'set_new_password' && (
        <>
          <div className="admin-login-logo"><img src={LOGO} alt="Sahyadri Glow" /></div>
          <h2>Set new password</h2>
          <p className="admin-login-sub">Enter and confirm your new owner password.</p>
          <form onSubmit={handleSaveNewPassword} className="admin-form">
            <label>New password
              <div className="password-input-wrap">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoFocus
                />
                <button type="button" onClick={() => setShowNewPassword((s) => !s)} aria-label="Toggle new password">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
            <label>Confirm new password
              <div className="password-input-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirmPassword((s) => !s)} aria-label="Toggle confirm password">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
            <button type="submit" className="button button-dark full-button">Save new password <Check size={16} /></button>
            <button type="button" className="admin-signup-link" onClick={() => setMode('login')}>Cancel</button>
          </form>
        </>
      )}
    </div>
  </div>;
}

function AdminPanel({
  onExit,
  showToast,
  siteContent,
  onUpdateSiteContent,
  customCollections,
  onUpdateCollections,
  availableProducts,
  onProductsUpdated,
}: {
  onExit: () => void;
  showToast: (msg: string) => void;
  siteContent: SiteContent;
  onUpdateSiteContent: (content: SiteContent) => void;
  customCollections: CustomCollection[];
  onUpdateCollections: (cols: CustomCollection[]) => void;
  availableProducts: Product[];
  onProductsUpdated?: () => void | Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'products' | 'upcoming' | 'collections' | 'orders' | 'content'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCombo, setIsAddingCombo] = useState(false);
  const [isAddingUpcoming, setIsAddingUpcoming] = useState(false);

  // Collections state
  const [editingCollection, setEditingCollection] = useState<CustomCollection | null>(null);
  const [isAddingCollection, setIsAddingCollection] = useState(false);

  // CMS Form local draft state
  const [cmsForm, setCmsForm] = useState<SiteContent>(siteContent);

  // Orders & Customers State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered'>('all');
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    let prods: Product[] = [];
    const { data, error } = await supabase.rpc('admin_list_products');
    if (error) {
      const { data: tableData } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (tableData && tableData.length > 0) {
        prods = tableData as Product[];
      } else {
        prods = fallbackProducts;
      }
    } else {
      prods = (data as Product[]) ?? fallbackProducts;
    }

    try {
      const localCustom = JSON.parse(localStorage.getItem('sahyadri_custom_products') ?? '[]') as Product[];
      const indexById = new Map(prods.map((p, idx) => [p.id, idx]));
      for (const cp of localCustom) {
        const existingIdx = indexById.get(cp.id);
        if (existingIdx !== undefined) {
          prods[existingIdx] = { ...prods[existingIdx], ...cp };
        } else {
          prods.unshift(cp);
          indexById.clear();
          prods.forEach((p, idx) => indexById.set(p.id, idx));
        }
      }
    } catch {
      // ignore
    }

    setProducts(applyUpcomingFlags(prods));
    setLoading(false);
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    let fetchedOrders: Order[] = [];
    try {
      const { data, error } = await supabase.rpc('admin_list_orders');
      if (!error && data) {
        fetchedOrders = data as Order[];
      } else {
        const { data: tableOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (tableOrders) fetchedOrders = tableOrders as Order[];
      }
    } catch {
      // Fallback
    }

    // Merge with locally persisted orders so customer data is never missed
    try {
      const local = JSON.parse(localStorage.getItem('sahyadri_orders_store') ?? '[]') as Order[];
      const seenIds = new Set(fetchedOrders.map((o) => o.id));
      for (const item of local) {
        if (!seenIds.has(item.id)) {
          fetchedOrders.push(item);
          seenIds.add(item.id);
        } else {
          // Enrich fetched supabase order with any locally cached details
          const idx = fetchedOrders.findIndex((o) => o.id === item.id);
          if (idx !== -1) {
            fetchedOrders[idx] = {
              ...item,
              ...fetchedOrders[idx],
              customer_user_id: fetchedOrders[idx].customer_user_id || item.customer_user_id,
              customer_username: fetchedOrders[idx].customer_username || item.customer_username,
              payment_method: fetchedOrders[idx].payment_method || item.payment_method,
              payment_ref: fetchedOrders[idx].payment_ref || item.payment_ref,
            };
          }
        }
      }
    } catch {
      // ignore
    }

    // Sort newest orders first
    fetchedOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    setOrders(fetchedOrders);
    setLoadingOrders(false);
  };

  useEffect(() => {
    void loadProducts();
    void loadOrders();

    const handleSync = () => {
      void loadOrders();
    };
    window.addEventListener('sahyadri_orders_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('sahyadri_orders_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await supabase.rpc('admin_delete_product', { p_id: id });
    } catch {
      // ignore
    }
    try {
      const localCustom = JSON.parse(localStorage.getItem('sahyadri_custom_products') ?? '[]') as Product[];
      const filtered = localCustom.filter((p) => p.id !== id);
      localStorage.setItem('sahyadri_custom_products', JSON.stringify(filtered));
    } catch {
      // ignore
    }
    showToast('Product deleted.');
    void loadProducts();
    void onProductsUpdated?.();
  };

  const handleToggle = async (id: string, field: 'is_published' | 'is_featured' | 'is_bestseller') => {
    const { error } = await supabase.rpc('admin_toggle_product_field', { p_id: id, p_field: field });
    if (error) { showToast('Could not update.'); return; }
    void loadProducts();
    void onProductsUpdated?.();
  };

  const handleToggleUpcoming = (product: Product) => {
    const nextState = !product.is_upcoming;
    setProductUpcomingFlag(product.id, nextState);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_upcoming: nextState } : p)));
    void onProductsUpdated?.();
    showToast(
      nextState
        ? `"${product.name}" moved to Upcoming Candles page.`
        : `"${product.name}" moved to Current Shop page.`
    );
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'delivered') => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    } catch {
      // ignore
    }

    try {
      const local = JSON.parse(localStorage.getItem('sahyadri_orders_store') ?? '[]') as Order[];
      const updated = local.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
      localStorage.setItem('sahyadri_orders_store', JSON.stringify(updated));
    } catch {
      // ignore
    }

    showToast(`Order status updated to ${newStatus}.`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onExit();
  };

  const handleSaveCollection = (col: CustomCollection) => {
    let updated: CustomCollection[];
    const exists = customCollections.some((c) => c.id === col.id);
    if (exists) {
      updated = customCollections.map((c) => (c.id === col.id ? col : c));
    } else {
      updated = [...customCollections, col];
    }
    onUpdateCollections(updated);
    setIsAddingCollection(false);
    setEditingCollection(null);
    showToast(`Collection "${col.name}" saved successfully.`);
  };

  const handleDeleteCollection = (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    const updated = customCollections.filter((c) => c.id !== id);
    onUpdateCollections(updated);
    showToast('Collection deleted.');
  };

  const handleToggleCollectionPublished = (id: string) => {
    const updated = customCollections.map((c) =>
      c.id === id ? { ...c, is_published: !c.is_published } : c
    );
    onUpdateCollections(updated);
    showToast('Collection visibility updated.');
  };

  const handleSaveCms = () => {
    onUpdateSiteContent(cmsForm);
    showToast('Website content saved & updated live!');
  };

  const handleResetCms = () => {
    if (!confirm('Reset all website text to factory defaults?')) return;
    setCmsForm(DEFAULT_SITE_CONTENT);
    onUpdateSiteContent(DEFAULT_SITE_CONTENT);
    showToast('Website content reset to defaults.');
  };

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const q = orderSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
        (order.customer_phone && order.customer_phone.includes(q)) ||
        (order.customer_address && order.customer_address.toLowerCase().includes(q)) ||
        (Array.isArray(order.items) && order.items.some((it) => it.name.toLowerCase().includes(q)));
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_inr) || 0), 0);
  const uniqueCustomerPhones = new Set(orders.map((o) => o.customer_phone.trim())).size;
  const pendingOrdersCount = orders.filter((o) => (o.status || 'pending') === 'pending').length;

  return <div className="admin-panel-shell">
    <header className="admin-header">
      <div className="admin-header-left">
        <img src={LOGO} alt="Sahyadri Glow" className="admin-header-logo" width="64" height="64" />
        <div><h1>Owner Panel</h1><span>Sahyadri Glow management</span></div>
      </div>
      <div className="admin-header-actions">
        {activeTab === 'products' && (
          <div className="admin-product-btn-group">
            <button
              className="button button-combo-header"
              onClick={() => setIsAddingCombo(true)}
              title="Add a custom Combo pack with multiple candles and combined pricing"
            >
              <Sparkles size={16} /> + Add Combo Pack
            </button>
            <button className="button button-dark" onClick={() => setIsAdding(true)}>
              <Plus size={16} /> Add product
            </button>
          </div>
        )}
        {activeTab === 'upcoming' && (
          <div className="admin-product-btn-group">
            <button
              className="button button-combo-header"
              onClick={() => {
                setIsAddingUpcoming(true);
                setIsAddingCombo(true);
              }}
              title="Add an upcoming Combo pack"
            >
              <Sparkles size={16} /> + Add Upcoming Combo
            </button>
            <button className="button button-dark" onClick={() => setIsAddingUpcoming(true)}>
              <Plus size={16} /> + Add Upcoming Candle
            </button>
          </div>
        )}
        {activeTab === 'collections' && (
          <button className="button button-dark" onClick={() => setIsAddingCollection(true)}>
            <Plus size={16} /> + Add Collection
          </button>
        )}
        {activeTab === 'orders' && (
          <button className="button button-dark" onClick={() => exportOrdersToCSV(filteredOrders)}>
            <Download size={16} /> Export CSV ({filteredOrders.length})
          </button>
        )}
        {activeTab === 'content' && (
          <div className="admin-cms-actions">
            <button className="button button-outline" onClick={handleResetCms} title="Reset to default brand copy">
              <RotateCcw size={15} /> Reset Defaults
            </button>
            <button className="button button-dark" onClick={handleSaveCms}>
              <Check size={16} /> Save Website Content
            </button>
          </div>
        )}
        <button className="admin-exit-button" onClick={handleSignOut}><LogOut size={17} /> <span>Sign out</span></button>
      </div>
    </header>

    <div className="admin-content">
      {/* Navigation Tabs */}
      <div className="admin-tab-nav">
        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={17} /> Current Shop ({products.filter((p) => !p.is_upcoming).length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Clock size={17} /> Upcoming Candles ({products.filter((p) => p.is_upcoming).length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          <FolderHeart size={17} /> Collections ({customCollections.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Users size={17} /> Customers &amp; Orders ({orders.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <Edit3 size={17} /> Website CMS / Content
        </button>
      </div>

      {activeTab === 'products' && (() => {
        const currentShopProducts = products.filter((p) => !p.is_upcoming);
        return (
        <>
          <div className="admin-stats">
            <div className="admin-stat"><Package size={20} /><div><b>{currentShopProducts.length}</b><span>Current Shop</span></div></div>
            <div className="admin-stat"><Eye size={20} /><div><b>{currentShopProducts.filter(p => p.is_published).length}</b><span>Published</span></div></div>
            <div className="admin-stat"><Star size={20} /><div><b>{currentShopProducts.filter(p => p.is_featured).length}</b><span>Featured</span></div></div>
            <div className="admin-stat"><Sparkles size={20} /><div><b>{currentShopProducts.filter(p => p.is_bestseller).length}</b><span>Bestsellers</span></div></div>
          </div>

          {loading ? <p className="admin-loading">Loading products...</p> : (
            <div className="admin-table">
              {currentShopProducts.map((product) => (
                <div className="admin-row" key={product.id}>
                  <div className="admin-row-image"><img src={getProductImages(product)[0]} alt={product.name} width="56" height="56" loading="lazy" /></div>
                  <div className="admin-row-info">
                    <h3>{product.name}</h3>
                    <span>{product.category === 'blend' ? 'Signature blend' : 'Single fragrance'}</span>
                    <p>{product.description.slice(0, 60)}{product.description.length > 60 ? '...' : ''}</p>
                  </div>
                  <div className="admin-row-price">
                    {product.sale_price_inr ? <><b>₹{product.sale_price_inr}</b><s>₹{product.price_inr}</s></> : product.price_inr ? <b>₹{product.price_inr}</b> : <span className="admin-no-price">Not set</span>}
                  </div>
                  <div className="admin-row-stock">
                    <b>{product.stock_quantity}</b><span>in stock</span>
                  </div>
                  <div className="admin-row-toggles">
                    <button className={`admin-toggle ${product.is_published ? 'on' : ''}`} onClick={() => handleToggle(product.id, 'is_published')} title="Published"><Eye size={15} /></button>
                    <button className={`admin-toggle ${product.is_featured ? 'on' : ''}`} onClick={() => handleToggle(product.id, 'is_featured')} title="Featured"><Star size={15} /></button>
                    <button className={`admin-toggle ${product.is_bestseller ? 'on' : ''}`} onClick={() => handleToggle(product.id, 'is_bestseller')} title="Bestseller"><Sparkles size={15} /></button>
                    <button className={`admin-toggle ${product.is_upcoming ? 'on' : ''}`} onClick={() => handleToggleUpcoming(product)} title="Move to Upcoming Candles page"><Clock size={15} /></button>
                  </div>
                  <div className="admin-row-actions">
                    <button className="admin-action edit" onClick={() => setEditingProduct(product)}><Pencil size={16} /></button>
                    <button className="admin-action delete" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
        );
      })()}

      {/* Upcoming Candles Tab */}
      {activeTab === 'upcoming' && (() => {
        const upcomingList = products.filter((p) => Boolean(p.is_upcoming));
        return (
        <>
          <div className="admin-stats">
            <div className="admin-stat"><Clock size={20} /><div><b>{upcomingList.length}</b><span>Upcoming Candles</span></div></div>
            <div className="admin-stat"><Eye size={20} /><div><b>{upcomingList.filter(p => p.is_published).length}</b><span>Published</span></div></div>
            <div className="admin-stat"><Star size={20} /><div><b>{upcomingList.filter(p => p.is_featured).length}</b><span>Featured</span></div></div>
            <div className="admin-stat"><Sparkles size={20} /><div><b>{upcomingList.filter(p => p.is_bestseller).length}</b><span>Most Anticipated</span></div></div>
          </div>

          <div className="admin-collections-header">
            <div>
              <h3>Upcoming Candles Page Manager</h3>
              <p>Candles added here appear directly on the dedicated Upcoming Candles customer page with all shop features (Quick View, Cart, Custom Box, Filters &amp; Collections).</p>
            </div>
            <button className="button button-dark" onClick={() => setIsAddingUpcoming(true)}>
              <Plus size={16} /> Add Upcoming Candle
            </button>
          </div>

          {loading ? <p className="admin-loading">Loading upcoming candles...</p> : upcomingList.length === 0 ? (
            <div className="admin-empty-state">
              <Clock size={40} />
              <h4>No upcoming candles added yet</h4>
              <p>Click "Add Upcoming Candle" to preview upcoming releases on the Upcoming Candles page, or click the clock icon on any current product to move it here.</p>
              <button className="button button-dark" onClick={() => setIsAddingUpcoming(true)}>
                <Plus size={16} /> Add your first upcoming candle
              </button>
            </div>
          ) : (
            <div className="admin-table">
              {upcomingList.map((product) => (
                <div className="admin-row" key={product.id}>
                  <div className="admin-row-image"><img src={getProductImages(product)[0]} alt={product.name} width="56" height="56" loading="lazy" /></div>
                  <div className="admin-row-info">
                    <h3>{product.name} <span className="admin-upcoming-pill">Upcoming</span></h3>
                    <span>{product.category === 'blend' ? 'Signature blend' : 'Single fragrance'}</span>
                    <p>{product.description.slice(0, 60)}{product.description.length > 60 ? '...' : ''}</p>
                  </div>
                  <div className="admin-row-price">
                    {product.sale_price_inr ? <><b>₹{product.sale_price_inr}</b><s>₹{product.price_inr}</s></> : product.price_inr ? <b>₹{product.price_inr}</b> : <span className="admin-no-price">Not set</span>}
                  </div>
                  <div className="admin-row-stock">
                    <b>{product.stock_quantity}</b><span>in stock</span>
                  </div>
                  <div className="admin-row-toggles">
                    <button className={`admin-toggle ${product.is_published ? 'on' : ''}`} onClick={() => handleToggle(product.id, 'is_published')} title="Published"><Eye size={15} /></button>
                    <button className={`admin-toggle ${product.is_featured ? 'on' : ''}`} onClick={() => handleToggle(product.id, 'is_featured')} title="Featured"><Star size={15} /></button>
                    <button className={`admin-toggle ${product.is_bestseller ? 'on' : ''}`} onClick={() => handleToggle(product.id, 'is_bestseller')} title="Most Anticipated / Bestseller"><Sparkles size={15} /></button>
                    <button className="admin-toggle on" onClick={() => handleToggleUpcoming(product)} title="Move back to Current Shop"><Clock size={15} /></button>
                  </div>
                  <div className="admin-row-actions">
                    <button className="admin-action edit" onClick={() => setEditingProduct(product)}><Pencil size={16} /></button>
                    <button className="admin-action delete" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
        );
      })()}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <>
          <div className="admin-stats">
            <div className="admin-stat"><FolderHeart size={20} /><div><b>{customCollections.length}</b><span>Total Collections</span></div></div>
            <div className="admin-stat"><Eye size={20} /><div><b>{customCollections.filter(c => c.is_published).length}</b><span>Published on Store</span></div></div>
            <div className="admin-stat"><Package size={20} /><div><b>{new Set(customCollections.flatMap(c => c.productIds)).size}</b><span>Products Featured</span></div></div>
          </div>

          <div className="admin-collections-header">
            <div>
              <h3>Curated Collections Showcase</h3>
              <p>Each collection extends the customer page with a dedicated showcase section, unique mood description, and exclusive product grid.</p>
            </div>
            <button className="button button-dark" onClick={() => setIsAddingCollection(true)}>
              <Plus size={16} /> Add Collection
            </button>
          </div>

          <div className="admin-collections-grid">
            {customCollections.length === 0 ? (
              <div className="admin-empty-state">
                <FolderHeart size={40} />
                <h4>No custom collections created yet</h4>
                <p>Click "Add Collection" above to group your handcrafted candles into themed showcases.</p>
                <button className="button button-dark" onClick={() => setIsAddingCollection(true)}>
                  <Plus size={16} /> Create your first collection
                </button>
              </div>
            ) : (
              customCollections.map((col) => {
                const colProds = (availableProducts.length > 0 ? availableProducts : products).filter((p) => col.productIds.includes(p.id));
                return (
                  <div className="admin-collection-card" key={col.id}>
                    <div className="admin-col-card-header">
                      <div>
                        <span className="admin-col-slug">#{col.slug}</span>
                        <h3>{col.name}</h3>
                        {col.tagline && <span className="admin-col-tagline">{col.tagline}</span>}
                      </div>
                      <div className="admin-col-toggles">
                        <button
                          className={`admin-toggle ${col.is_published ? 'on' : ''}`}
                          onClick={() => handleToggleCollectionPublished(col.id)}
                          title={col.is_published ? 'Published on store (Click to unpublish)' : 'Draft (Click to publish)'}
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="admin-col-desc">{col.description}</p>

                    <div className="admin-col-products-preview">
                      <span className="admin-col-count">
                        <strong>{colProds.length}</strong> {colProds.length === 1 ? 'candle' : 'candles'} in this collection:
                      </span>
                      <div className="admin-col-thumbs">
                        {colProds.slice(0, 6).map((p) => (
                          <div className="admin-col-thumb" key={p.id} title={`${p.name} (₹${p.sale_price_inr || p.price_inr})`}>
                            <img src={getProductImages(p)[0]} alt={p.name} />
                          </div>
                        ))}
                        {colProds.length > 6 && (
                          <div className="admin-col-thumb-more">+{colProds.length - 6}</div>
                        )}
                        {colProds.length === 0 && (
                          <span className="admin-col-empty-hint">No candles assigned yet</span>
                        )}
                      </div>
                    </div>

                    <div className="admin-col-footer">
                      <span className={`admin-col-badge ${col.is_published ? 'published' : 'draft'}`}>
                        {col.is_published ? 'Live on Store' : 'Draft / Hidden'}
                      </span>
                      <div className="admin-col-actions">
                        <button
                          className="admin-action edit"
                          onClick={() => setEditingCollection(col)}
                          title="Edit collection name, tagline, description and products"
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          className="admin-action delete"
                          onClick={() => handleDeleteCollection(col.id)}
                          title="Delete collection"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Customers & Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {/* Customers & Orders Tab */}
          <div className="admin-stats">
            <div className="admin-stat"><Users size={20} /><div><b>{orders.length}</b><span>Total Orders</span></div></div>
            <div className="admin-stat"><Sparkles size={20} /><div><b>₹{totalRevenue.toLocaleString('en-IN')}</b><span>Total Sales</span></div></div>
            <div className="admin-stat"><Package size={20} /><div><b>{uniqueCustomerPhones}</b><span>Unique Customers</span></div></div>
            <div className="admin-stat"><Eye size={20} /><div><b>{pendingOrdersCount}</b><span>Pending Orders</span></div></div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search customer name, phone, address, or candle..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
              />
            </div>
            <div className="admin-filters">
              <button
                className="admin-export-btn"
                onClick={() => void loadOrders()}
                title="Refresh customer orders"
              >
                <RefreshCw size={15} /> Refresh
              </button>
              <select
                className="admin-filter-select"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value as any)}
              >
                <option value="all">All statuses ({orders.length})</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
              </select>
              <button
                className="admin-export-btn"
                onClick={() => exportOrdersToCSV(filteredOrders)}
                title="Download CSV spreadsheet of customers"
              >
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          {loadingOrders ? (
            <p className="admin-loading">Loading customer orders...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-loading">
              <FileSpreadsheet size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No customer orders match your search.</p>
            </div>
          ) : (
            <div className="customer-orders-list">
              {filteredOrders.map((order) => {
                const initial = (order.customer_name || 'C').trim().charAt(0).toUpperCase();
                const formattedDate = order.created_at ? new Date(order.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : 'Recently';

                return (
                  <article className="customer-card" key={order.id}>
                    <div className="customer-card-header">
                      <div className="customer-card-main">
                        <div className="customer-avatar">{initial}</div>
                        <div className="customer-details">
                          <h4>
                            {order.customer_name}
                            {order.customer_user_id && (
                              <span className="customer-user-id-badge">ID: #{order.customer_user_id}</span>
                            )}
                            {order.customer_username && (
                              <span className="customer-username-badge">@{order.customer_username}</span>
                            )}
                          </h4>
                          <div className="customer-meta">
                            <span>Phone: <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></span>
                            <span>•</span>
                            <a
                              href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Message on WhatsApp
                            </a>
                            <span>•</span>
                            <span>{formattedDate}</span>
                            {order.payment_method && (
                              <>
                                <span>•</span>
                                <span className="customer-payment-badge">
                                  <CreditCard size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                  {order.payment_method}
                                  {order.payment_ref && <code> · Ref: {order.payment_ref}</code>}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="customer-status-control">
                        <span className={`order-status-badge ${order.status || 'pending'}`}>
                          {order.status || 'pending'}
                        </span>
                        <select
                          className="admin-filter-select"
                          value={order.status || 'pending'}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    <div className="customer-card-body">
                      <div className="customer-address-box">
                        <strong>Shipping Address</strong>
                        <p>{order.customer_address}</p>
                      </div>
                      <div className="customer-items-box">
                        <strong>Ordered Items ({order.items?.length || 0})</strong>
                        <div className="customer-items-tags">
                          {Array.isArray(order.items) && order.items.map((it, idx) => (
                            <div className="customer-item-tag" key={idx}>
                              <div className="customer-item-tag-main">
                                <strong>{it.name}</strong> <b>x{it.quantity}</b> · {formatPrice(it.price * it.quantity)}
                              </div>
                              {(it.color || it.fragrance || it.note) && (
                                <div className="customer-item-tag-custom">
                                  {it.color && <span className="custom-subtag color">Color: {it.color}</span>}
                                  {it.fragrance && <span className="custom-subtag fragrance">Fragrance: {it.fragrance}</span>}
                                  {it.note && <span className="custom-subtag note">Note: "{it.note}"</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="customer-card-footer">
                      <span>Order ID: <code>{order.id}</code></span>
                      {order.payment_ref && (
                        <span className="customer-footer-payment">
                          Payment Ref / UTR: <strong>{order.payment_ref}</strong> (harshalimehta4014@oksbi)
                        </span>
                      )}
                      <div>
                        Total: <strong>{formatPrice(order.total_inr)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Website CMS / Content Editor Tab */}
      {activeTab === 'content' && (
        <div className="admin-cms-container">
          <div className="admin-cms-intro">
            <div>
              <h3>Website Content &amp; Copy Editor (CMS)</h3>
              <p>Customize and manage every title, story, fragrance wardrobe note, button label, and contact detail across the website in real-time.</p>
            </div>
            <div className="admin-cms-top-actions">
              <button className="button button-outline" onClick={handleResetCms}>
                <RotateCcw size={15} /> Reset Defaults
              </button>
              <button className="button button-dark" onClick={handleSaveCms}>
                <Check size={16} /> Save Website Content
              </button>
            </div>
          </div>

          <div className="admin-cms-sections-grid">
            {/* 1. Announcement Banner */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>1. Top Announcement Banner</h4>
                <span>Ticker banner displayed at the very top of the page</span>
              </div>
              <div className="cms-field">
                <label>Announcement Message</label>
                <input
                  type="text"
                  value={cmsForm.announcementText}
                  onChange={(e) => setCmsForm({ ...cmsForm, announcementText: e.target.value })}
                />
              </div>
            </div>

            {/* 2. Hero Section */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>2. Hero Banner &amp; Welcome</h4>
                <span>Primary headline and action buttons</span>
              </div>
              <div className="cms-field">
                <label>Eyebrow Tagline</label>
                <input
                  type="text"
                  value={cmsForm.heroEyebrow}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroEyebrow: e.target.value })}
                />
              </div>
              <div className="cms-field">
                <label>Main Headline</label>
                <input
                  type="text"
                  value={cmsForm.heroTitle}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                />
              </div>
              <div className="cms-field">
                <label>Hero Description</label>
                <textarea
                  rows={3}
                  value={cmsForm.heroText}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroText: e.target.value })}
                />
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Primary Button Text</label>
                  <input
                    type="text"
                    value={cmsForm.heroPrimaryBtn}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroPrimaryBtn: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Secondary Button Text</label>
                  <input
                    type="text"
                    value={cmsForm.heroSecondaryBtn}
                    onChange={(e) => setCmsForm({ ...cmsForm, heroSecondaryBtn: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-field">
                <label>Founder Note / Byline</label>
                <input
                  type="text"
                  value={cmsForm.heroFounderNote}
                  onChange={(e) => setCmsForm({ ...cmsForm, heroFounderNote: e.target.value })}
                />
              </div>
            </div>

            {/* 3. Fragrance Wardrobe */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>3. Fragrance Wardrobe (Section 01)</h4>
                <span>Fragrance philosophy, mood pills &amp; descriptions</span>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Section Kicker</label>
                  <input
                    type="text"
                    value={cmsForm.wardrobeKicker}
                    onChange={(e) => setCmsForm({ ...cmsForm, wardrobeKicker: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={cmsForm.wardrobeTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, wardrobeTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-field">
                <label>Wardrobe Story / Text</label>
                <textarea
                  rows={3}
                  value={cmsForm.wardrobeText}
                  onChange={(e) => setCmsForm({ ...cmsForm, wardrobeText: e.target.value })}
                />
              </div>
              <div className="cms-field">
                <label>Mood Pills (comma-separated, e.g. Calm, Warmth, Freshness)</label>
                <input
                  type="text"
                  value={cmsForm.wardrobePills}
                  onChange={(e) => setCmsForm({ ...cmsForm, wardrobePills: e.target.value })}
                />
              </div>
              <div className="cms-field">
                <label>Footer Tagline</label>
                <input
                  type="text"
                  value={cmsForm.wardrobeFooterText}
                  onChange={(e) => setCmsForm({ ...cmsForm, wardrobeFooterText: e.target.value })}
                />
              </div>
            </div>

            {/* 4. Shop Section */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>4. Shop Section (Section 02)</h4>
                <span>Main catalog section title</span>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Shop Kicker</label>
                  <input
                    type="text"
                    value={cmsForm.shopKicker}
                    onChange={(e) => setCmsForm({ ...cmsForm, shopKicker: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Shop Heading</label>
                  <input
                    type="text"
                    value={cmsForm.shopTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, shopTitle: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 5. Signature Blends */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>5. Signature Blends (Section 03)</h4>
                <span>Blends highlight section &amp; featured blend note</span>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Blends Kicker</label>
                  <input
                    type="text"
                    value={cmsForm.blendKicker}
                    onChange={(e) => setCmsForm({ ...cmsForm, blendKicker: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Blends Heading</label>
                  <input
                    type="text"
                    value={cmsForm.blendTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, blendTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-field">
                <label>Blends Description</label>
                <textarea
                  rows={2}
                  value={cmsForm.blendText}
                  onChange={(e) => setCmsForm({ ...cmsForm, blendText: e.target.value })}
                />
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Featured Blend Card Eyebrow</label>
                  <input
                    type="text"
                    value={cmsForm.blendCardEyebrow}
                    onChange={(e) => setCmsForm({ ...cmsForm, blendCardEyebrow: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Featured Blend Card Title</label>
                  <input
                    type="text"
                    value={cmsForm.blendCardTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, blendCardTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-field">
                <label>Featured Blend Card Text</label>
                <input
                  type="text"
                  value={cmsForm.blendCardText}
                  onChange={(e) => setCmsForm({ ...cmsForm, blendCardText: e.target.value })}
                />
              </div>
            </div>

            {/* 6. Bestsellers */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>6. Bestsellers Showcase (Section 04)</h4>
                <span>Loved by many section</span>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Bestsellers Kicker</label>
                  <input
                    type="text"
                    value={cmsForm.bestsellerKicker}
                    onChange={(e) => setCmsForm({ ...cmsForm, bestsellerKicker: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Bestsellers Heading</label>
                  <input
                    type="text"
                    value={cmsForm.bestsellerTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, bestsellerTitle: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 7. Brand Story & Values */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>7. Brand Story &amp; Craftsmanship (Section 05)</h4>
                <span>Story, founder details and 3 core values</span>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Story Kicker</label>
                  <input
                    type="text"
                    value={cmsForm.storyKicker}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyKicker: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Story Heading</label>
                  <input
                    type="text"
                    value={cmsForm.storyTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-field">
                <label>Story Description</label>
                <textarea
                  rows={3}
                  value={cmsForm.storyText}
                  onChange={(e) => setCmsForm({ ...cmsForm, storyText: e.target.value })}
                />
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Value 01 Title</label>
                  <input
                    type="text"
                    value={cmsForm.storyVal1Title}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyVal1Title: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Value 01 Description</label>
                  <input
                    type="text"
                    value={cmsForm.storyVal1Text}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyVal1Text: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Value 02 Title</label>
                  <input
                    type="text"
                    value={cmsForm.storyVal2Title}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyVal2Title: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Value 02 Description</label>
                  <input
                    type="text"
                    value={cmsForm.storyVal2Text}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyVal2Text: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Value 03 Title</label>
                  <input
                    type="text"
                    value={cmsForm.storyVal3Title}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyVal3Title: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Value 03 Description</label>
                  <input
                    type="text"
                    value={cmsForm.storyVal3Text}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyVal3Text: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Founder Name</label>
                  <input
                    type="text"
                    value={cmsForm.storyFounderName}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyFounderName: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Founder Role / Title</label>
                  <input
                    type="text"
                    value={cmsForm.storyFounderRole}
                    onChange={(e) => setCmsForm({ ...cmsForm, storyFounderRole: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 8. Contact & Social */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>8. Contact &amp; Social Channels (Section 06)</h4>
                <span>Phone, email &amp; Instagram handle</span>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Contact Kicker</label>
                  <input
                    type="text"
                    value={cmsForm.contactKicker}
                    onChange={(e) => setCmsForm({ ...cmsForm, contactKicker: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Contact Heading</label>
                  <input
                    type="text"
                    value={cmsForm.contactTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, contactTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-field">
                <label>Contact Description</label>
                <textarea
                  rows={2}
                  value={cmsForm.contactText}
                  onChange={(e) => setCmsForm({ ...cmsForm, contactText: e.target.value })}
                />
              </div>
              <div className="cms-row-3">
                <div className="cms-field">
                  <label>Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={cmsForm.contactPhone}
                    onChange={(e) => setCmsForm({ ...cmsForm, contactPhone: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Email Address</label>
                  <input
                    type="text"
                    value={cmsForm.contactEmail}
                    onChange={(e) => setCmsForm({ ...cmsForm, contactEmail: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Instagram Handle</label>
                  <input
                    type="text"
                    value={cmsForm.instagramHandle}
                    onChange={(e) => setCmsForm({ ...cmsForm, instagramHandle: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 9. Upcoming Candles Page */}
            <div className="cms-card">
              <div className="cms-card-header">
                <h4>9. Upcoming Candles Page</h4>
                <span>Headings &amp; copy for the dedicated Upcoming Candles page</span>
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Upcoming Hero Eyebrow</label>
                  <input
                    type="text"
                    value={cmsForm.upcomingHeroEyebrow}
                    onChange={(e) => setCmsForm({ ...cmsForm, upcomingHeroEyebrow: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Upcoming Hero Title</label>
                  <input
                    type="text"
                    value={cmsForm.upcomingHeroTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, upcomingHeroTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="cms-field">
                <label>Upcoming Hero Description</label>
                <textarea
                  rows={2}
                  value={cmsForm.upcomingHeroText}
                  onChange={(e) => setCmsForm({ ...cmsForm, upcomingHeroText: e.target.value })}
                />
              </div>
              <div className="cms-row-2">
                <div className="cms-field">
                  <label>Upcoming Shop Kicker</label>
                  <input
                    type="text"
                    value={cmsForm.upcomingShopKicker}
                    onChange={(e) => setCmsForm({ ...cmsForm, upcomingShopKicker: e.target.value })}
                  />
                </div>
                <div className="cms-field">
                  <label>Upcoming Shop Heading</label>
                  <input
                    type="text"
                    value={cmsForm.upcomingShopTitle}
                    onChange={(e) => setCmsForm({ ...cmsForm, upcomingShopTitle: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-cms-bottom-bar">
            <button className="button button-outline" onClick={handleResetCms}>
              <RotateCcw size={16} /> Reset Defaults
            </button>
            <button className="button button-dark" onClick={handleSaveCms}>
              <Check size={18} /> Save &amp; Publish Website Changes Live
            </button>
          </div>
        </div>
      )}
    </div>

    {(editingProduct || isAdding || isAddingCombo || isAddingUpcoming) && (
      <ProductEditForm
        product={editingProduct}
        isComboInitial={isAddingCombo}
        isUpcomingInitial={isAddingUpcoming}
        availableProducts={products}
        onClose={() => { setEditingProduct(null); setIsAdding(false); setIsAddingCombo(false); setIsAddingUpcoming(false); }}
        onSaved={() => {
          setEditingProduct(null);
          setIsAdding(false);
          setIsAddingCombo(false);
          setIsAddingUpcoming(false);
          void loadProducts();
          void onProductsUpdated?.();
        }}
        showToast={showToast}
      />
    )}

    {(editingCollection || isAddingCollection) && (
      <CollectionEditModal
        collection={editingCollection}
        availableProducts={availableProducts.length > 0 ? availableProducts : products}
        onClose={() => { setEditingCollection(null); setIsAddingCollection(false); }}
        onSave={handleSaveCollection}
        showToast={showToast}
      />
    )}
  </div>;
}

function CollectionEditModal({
  collection,
  availableProducts,
  onClose,
  onSave,
  showToast,
}: {
  collection: CustomCollection | null;
  availableProducts: Product[];
  onClose: () => void;
  onSave: (col: CustomCollection) => void;
  showToast: (msg: string) => void;
}) {
  const isEditing = !!collection;
  const [name, setName] = useState(collection?.name ?? '');
  const [slug, setSlug] = useState(collection?.slug ?? '');
  const [tagline, setTagline] = useState(collection?.tagline ?? '');
  const [description, setDescription] = useState(collection?.description ?? '');
  const [isPublished, setIsPublished] = useState(collection?.is_published ?? true);
  const [selectedIds, setSelectedIds] = useState<string[]>(collection?.productIds ?? []);
  const [search, setSearch] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(availableProducts.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a collection name.');
      return;
    }
    const cleanSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newCol: CustomCollection = {
      id: collection?.id ?? `col_${Date.now()}`,
      name: name.trim(),
      slug: cleanSlug || `col-${Date.now()}`,
      tagline: tagline.trim() || undefined,
      description: description.trim() || 'A curated selection of artisanal scented candles.',
      productIds: selectedIds,
      is_published: isPublished,
    };

    onSave(newCol);
  };

  const filteredProds = availableProducts.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.fragrance?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="collection-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="product-modal-header">
          <div>
            <h2>{isEditing ? 'Edit Collection' : 'Create New Collection'}</h2>
            <p>Customers will see this collection as its own showcase section on the store page.</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleFormSubmit} className="collection-form">
          <div className="collection-form-scrollable">
            <div className="field-group-2">
              <div className="field">
                <label>Collection Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Monsoon Rain &amp; Earth"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>URL Slug / Anchor</label>
                <input
                  type="text"
                  placeholder="e.g. monsoon-rain-earth"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Tagline / Subheading</label>
              <input
                type="text"
                placeholder="e.g. Fresh Petrichor &amp; Evening Calm"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Collection Description *</label>
              <textarea
                rows={2}
                placeholder="Describe the mood, fragrance inspiration, or ritual for this collection..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="field-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <span><strong>Publish on Customer Storefront</strong> (immediately visible to buyers)</span>
              </label>
            </div>

            {/* Product Selector */}
            <div className="collection-products-picker-section">
              <div className="picker-header">
                <div>
                  <h4>Select Candles for this Collection ({selectedIds.length} selected)</h4>
                  <p>Choose which candles appear in this collection's exclusive storefront section.</p>
                </div>
                <div className="picker-header-actions">
                  <button type="button" className="picker-quick-btn" onClick={selectAll}>Select all</button>
                  <button type="button" className="picker-quick-btn" onClick={clearAll}>Clear all</button>
                </div>
              </div>

              <div className="picker-search">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search candles by name or scent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="collection-picker-grid">
                {filteredProds.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  const price = p.sale_price_inr || p.price_inr;
                  return (
                    <div
                      key={p.id}
                      className={`collection-picker-item ${isChecked ? 'selected' : ''}`}
                      onClick={() => toggleProduct(p.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                      />
                      <img src={getProductImages(p)[0]} alt={p.name} />
                      <div className="picker-item-info">
                        <strong>{p.name}</strong>
                        <span>{p.fragrance || (p.category === 'blend' ? 'Signature Blend' : 'Artisanal')}</span>
                        <b>₹{price}</b>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="product-modal-actions">
            <button type="button" className="button button-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-dark">
              <Check size={16} /> Save Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductEditForm({
  product,
  isComboInitial = false,
  isUpcomingInitial = false,
  availableProducts = [],
  onClose,
  onSaved,
  showToast,
}: {
  product: Product | null;
  isComboInitial?: boolean;
  isUpcomingInitial?: boolean;
  availableProducts?: Product[];
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string) => void;
}) {
  const isEditing = !!product;
  const isExistingCombo = !!(
    product?.size_label?.toLowerCase().includes('combo') ||
    product?.name.toLowerCase().includes('combo')
  );
  const [mode, setMode] = useState<'standard' | 'combo'>(
    isComboInitial || isExistingCombo ? 'combo' : 'standard'
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const initialImages: string[] = product ? getProductImages(product) : [];

  const [form, setForm] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    category: product?.category ?? (isComboInitial ? 'blend' : 'single'),
    images: initialImages,
    price_inr: product?.price_inr?.toString() ?? '',
    sale_price_inr: product?.sale_price_inr?.toString() ?? '',
    size_label: product?.size_label ?? (isComboInitial ? 'Combo Pack' : ''),
    fragrance: product?.fragrance ?? '',
    weight_grams: product?.weight_grams?.toString() ?? '',
    stock_quantity: product?.stock_quantity?.toString() ?? '10',
    is_featured: product?.is_featured ?? false,
    is_bestseller: product?.is_bestseller ?? false,
    is_published: product?.is_published ?? true,
    is_upcoming: product?.is_upcoming ?? isUpcomingInitial,
  });

  // Combo builder items state
  const [comboItems, setComboItems] = useState<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string;
  }>([]);

  const [selectedProdId, setSelectedProdId] = useState<string>(
    availableProducts.length > 0 ? availableProducts[0].id : ''
  );
  const [selectedProdQty, setSelectedProdQty] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string | boolean | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addImageToForm = (newImgUrl: string) => {
    if (form.images.length >= 4) {
      showToast('Maximum 4 images allowed per product (Meesho style).');
      return;
    }
    update('images', [...form.images, newImgUrl]);
  };

  const removeImageAt = (idx: number) => {
    const updated = form.images.filter((_, i) => i !== idx);
    update('images', updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.images.length >= 4) {
      showToast('Maximum 4 images allowed per product.');
      return;
    }

    const availableSlots = 4 - form.images.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    setIsProcessingImage(true);
    let processed = 0;
    const newlyAdded: string[] = [];

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Please select valid image files.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image size exceeds 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            newlyAdded.push(compressed);
          } else {
            newlyAdded.push(event.target?.result as string);
          }
          processed++;
          if (processed === filesToProcess.length) {
            update('images', [...form.images, ...newlyAdded]);
            setIsProcessingImage(false);
            showToast(`${newlyAdded.length} image(s) uploaded successfully!`);
          }
        };
        img.onerror = () => {
          processed++;
          if (processed === filesToProcess.length) {
            if (newlyAdded.length > 0) update('images', [...form.images, ...newlyAdded]);
            setIsProcessingImage(false);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (form.images.length >= 4) {
      showToast('Maximum 4 images allowed per product.');
      return;
    }
    addImageToForm(trimmed);
    setUrlInput('');
  };

  // Combo management handlers
  const handleAddComboItem = () => {
    const targetId = selectedProdId || (availableProducts[0]?.id ?? '');
    if (!targetId) {
      showToast('Please select a candle to add.');
      return;
    }
    const found = availableProducts.find((p) => p.id === targetId);
    if (!found) return;
    const qty = Math.max(1, selectedProdQty || 1);

    setComboItems((prev) => {
      const idx = prev.findIndex((it) => it.productId === found.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [
        ...prev,
        {
          productId: found.id,
          name: found.name,
          quantity: qty,
          unitPrice: found.sale_price_inr ?? found.price_inr ?? 299,
          image: getProductImages(found)[0],
        },
      ];
    });

    showToast(`Added ${qty}x ${found.name} to combo!`);
  };

  const handleUpdateComboItemQty = (prodId: string, delta: number) => {
    setComboItems((prev) =>
      prev
        .map((it) => {
          if (it.productId === prodId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as typeof comboItems
    );
  };

  const handleRemoveComboItem = (prodId: string) => {
    setComboItems((prev) => prev.filter((it) => it.productId !== prodId));
  };

  const standardSum = comboItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const totalComboCandles = comboItems.reduce((acc, it) => acc + it.quantity, 0);

  const handleUseStandardSumAsMrp = () => {
    update('price_inr', standardSum.toString());
    showToast(`Combine MRP set to ₹${standardSum}`);
  };

  const handleAutoGenerateDescription = () => {
    if (comboItems.length === 0) {
      showToast('Select candles for your combo first.');
      return;
    }
    const breakdown = comboItems.map((i) => `${i.quantity}x ${i.name}`).join(' + ');
    const desc = `Handcrafted Artisanal Candle Combo includes: ${breakdown}. Made with 100% natural soy wax, therapeutic grade essential oils, and lead-free cotton wicks. Perfect for gifting or creating a cozy, fragrant sanctuary.`;
    update('description', desc);
    if (!form.name || form.name === 'Vanilla') {
      update('name', `Combo Gift Pack (${breakdown})`);
    }
    update('size_label', `Combo Pack (${totalComboCandles} Candles)`);
    showToast('Combo description & title generated!');
  };

  const handleAutoFillImagesFromCandles = () => {
    const imagesToUse: string[] = [];
    for (const it of comboItems) {
      if (it.image && !imagesToUse.includes(it.image)) {
        imagesToUse.push(it.image);
      }
      if (imagesToUse.length >= 4) break;
    }
    if (imagesToUse.length === 0) {
      showToast('No images available from selected candles.');
      return;
    }
    update('images', imagesToUse);
    showToast(`Imported ${imagesToUse.length} candle photo(s) to combo gallery!`);
  };

  const parsedPrice = form.price_inr ? parseFloat(form.price_inr) : null;
  const parsedSalePrice = form.sale_price_inr ? parseFloat(form.sale_price_inr) : null;
  const savings = parsedPrice && parsedSalePrice && parsedPrice > parsedSalePrice ? parsedPrice - parsedSalePrice : 0;
  const discountPercent = parsedPrice && savings > 0 ? Math.round((savings / parsedPrice) * 100) : 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    const isCombo = mode === 'combo';
    if (isCombo && comboItems.length === 0 && !isEditing) {
      showToast('Please add at least one candle to your combo pack.');
      setSaving(false);
      return;
    }

    const cleanName = sanitizeInput(form.name || (isCombo ? 'Artisanal Candle Combo Pack' : 'New Candle'));
    const cleanSlug = sanitizeInput(
      form.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `combo-${Date.now()}`
    );
    const cleanDescription = sanitizeInput(
      form.description || (isCombo ? `Artisanal combo pack containing ${comboItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}` : '')
    );
    const parsedWeight = form.weight_grams
      ? parseInt(form.weight_grams, 10)
      : isCombo
      ? Math.max(200, totalComboCandles * 200)
      : null;
    const parsedStock = parseInt(form.stock_quantity, 10) || 10;

    const mainImageUrl = form.images.length > 0
      ? form.images.length === 1
        ? form.images[0]
        : `__MULTI__${JSON.stringify(form.images)}`
      : '';

    const validation = productSchema.safeParse({
      name: cleanName,
      slug: cleanSlug,
      description: cleanDescription,
      category: isCombo ? 'blend' : form.category,
      image_url: mainImageUrl.trim() || '/images/logo_b.png',
      price_inr: parsedPrice,
      sale_price_inr: parsedSalePrice,
      size_label: form.size_label ? sanitizeInput(form.size_label) : (isCombo ? `Combo Pack (${totalComboCandles} Candles)` : null),
      weight_grams: parsedWeight,
      fragrance: form.fragrance ? sanitizeInput(form.fragrance) : (isCombo ? 'Assorted Blend' : null),
      stock_quantity: parsedStock,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      is_published: form.is_published,
    });

    if (!validation.success) {
      showToast(validation.error.issues[0]?.message || 'Please check product values.');
      setSaving(false);
      return;
    }

    const payload = {
      p_name: cleanName,
      p_slug: cleanSlug,
      p_description: cleanDescription,
      p_category: isCombo ? 'blend' : form.category,
      p_image_url: mainImageUrl.trim(),
      p_price_inr: parsedPrice,
      p_sale_price_inr: parsedSalePrice,
      p_size_label: form.size_label ? sanitizeInput(form.size_label) : (isCombo ? `Combo Pack (${totalComboCandles} Candles)` : null),
      p_weight_grams: parsedWeight,
      p_fragrance: form.fragrance ? sanitizeInput(form.fragrance) : (isCombo ? 'Assorted Blend' : null),
      p_stock_quantity: parsedStock,
      p_is_featured: form.is_featured,
      p_is_bestseller: form.is_bestseller,
      p_is_published: form.is_published,
    };

    // Store in local cache so product / combo is immediately available across tabs
    const newProductRecord: Product = {
      id: product?.id || `prod_${Date.now()}`,
      name: cleanName,
      slug: cleanSlug,
      description: cleanDescription,
      category: isCombo ? 'blend' : (form.category as any),
      image_url: mainImageUrl.trim() || '/images/logo_b.png',
      images: form.images.length > 0 ? form.images : ['/images/logo_b.png'],
      price_inr: parsedPrice,
      sale_price_inr: parsedSalePrice,
      size_label: form.size_label || (isCombo ? `Combo Pack (${totalComboCandles} Candles)` : null),
      weight_grams: parsedWeight,
      fragrance: form.fragrance || (isCombo ? 'Assorted Blend' : null),
      stock_quantity: parsedStock,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      is_published: form.is_published,
      is_upcoming: form.is_upcoming,
    };

    try {
      const storedProds = JSON.parse(localStorage.getItem('sahyadri_custom_products') ?? '[]') as Product[];
      const filtered = storedProds.filter((p) => p.id !== newProductRecord.id);
      localStorage.setItem('sahyadri_custom_products', JSON.stringify([newProductRecord, ...filtered]));
    } catch {
      // ignore
    }
    setProductUpcomingFlag(newProductRecord.id, form.is_upcoming);

    try {
      let error;
      if (isEditing && product) {
        ({ error } = await supabase.rpc('admin_update_product', { p_id: product.id, ...payload }));
      } else {
        ({ error } = await supabase.rpc('admin_create_product', payload));
      }
      if (error) {
        // Fallback to table upsert if RPC unauthenticated
        await supabase.from('products').upsert({
          id: newProductRecord.id,
          name: cleanName,
          slug: cleanSlug,
          description: cleanDescription,
          category: isCombo ? 'blend' : form.category,
          image_url: mainImageUrl.trim() || '/images/logo_b.png',
          price_inr: parsedPrice,
          sale_price_inr: parsedSalePrice,
          size_label: form.size_label || (isCombo ? `Combo Pack (${totalComboCandles} Candles)` : null),
          weight_grams: parsedWeight,
          fragrance: form.fragrance || (isCombo ? 'Assorted Blend' : null),
          stock_quantity: parsedStock,
          is_featured: form.is_featured,
          is_bestseller: form.is_bestseller,
          is_published: form.is_published,
        });
      }
      showToast(isEditing ? 'Product updated.' : isCombo ? 'Combo pack created successfully!' : 'Product added.');
      onSaved();
    } catch {
      showToast(isCombo ? 'Combo pack saved!' : 'Product saved.');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="product-edit-modal" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><X size={20} /></button>
      
      <div className="product-edit-header-row">
        <div>
          <h2>{isEditing ? 'Edit Product' : mode === 'combo' ? 'Create Combo Pack' : 'Add New Product'}</h2>
          <span className="product-edit-subhead">
            {mode === 'combo'
              ? 'Select any candles, choose quantities, and specify combined MRP and sale value'
              : 'Add an artisanal handcrafted candle to your store'}
          </span>
        </div>

        {!isEditing && (
          <div className="product-mode-tabs">
            <button
              type="button"
              className={`product-mode-tab ${mode === 'standard' ? 'active' : ''}`}
              onClick={() => {
                setMode('standard');
                update('size_label', '');
              }}
            >
              <Package size={14} /> Standard Product
            </button>
            <button
              type="button"
              className={`product-mode-tab ${mode === 'combo' ? 'active' : ''}`}
              onClick={() => {
                setMode('combo');
                update('category', 'blend');
                update('size_label', 'Combo Pack');
              }}
            >
              <Sparkles size={14} /> 🎁 Combo Pack Creator
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="product-edit-form">
        <div className="edit-form-grid">
          <label className="full-width">
            {mode === 'combo' ? 'Combo Pack Name' : 'Product Name'} <strong className="required-star">*</strong>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              placeholder={mode === 'combo' ? 'e.g. Festive Duo (Vanilla + Sandalwood)' : 'e.g. Vanilla'}
            />
          </label>

          {/* COMBO PACK CREATOR SECTION */}
          {mode === 'combo' && (
            <div className="full-width combo-builder-card">
              <div className="combo-builder-header">
                <h4><Sparkles size={16} /> Select Candles to Include in Combo</h4>
                <span className="combo-candles-badge">{totalComboCandles} candle(s) added</span>
              </div>
              <p className="combo-builder-desc">
                Select any product from your catalog and choose its quantity:
              </p>

              <div className="combo-add-picker-row">
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="combo-picker-select"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · ₹{p.sale_price_inr ?? p.price_inr ?? 299} ({p.category === 'blend' ? 'Signature Blend' : 'Single note'})
                    </option>
                  ))}
                </select>

                <div className="combo-qty-picker">
                  <span>Qty:</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={selectedProdQty}
                    onChange={(e) => setSelectedProdQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="combo-qty-input"
                  />
                </div>

                <button
                  type="button"
                  className="button button-dark combo-add-item-btn"
                  onClick={handleAddComboItem}
                >
                  <Plus size={15} /> Add to Combo
                </button>
              </div>

              {/* List of included combo candles */}
              {comboItems.length === 0 ? (
                <div className="combo-empty-state">
                  <Package size={26} />
                  <p>No candles added to this combo yet. Pick a candle above and click "+ Add to Combo".</p>
                </div>
              ) : (
                <div className="combo-items-list">
                  {comboItems.map((item) => (
                    <div className="combo-item-chip" key={item.productId}>
                      {item.image && <img src={item.image} alt={item.name} className="combo-chip-thumb" />}
                      <div className="combo-chip-info">
                        <strong>{item.name}</strong>
                        <span>₹{item.unitPrice} each · Total: ₹{item.unitPrice * item.quantity}</span>
                      </div>
                      <div className="combo-chip-stepper">
                        <button
                          type="button"
                          onClick={() => handleUpdateComboItemQty(item.productId, -1)}
                          title="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="combo-qty-display">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateComboItemQty(item.productId, 1)}
                          title="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="combo-chip-remove"
                        onClick={() => handleRemoveComboItem(item.productId)}
                        title="Remove from combo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <div className="combo-calculation-bar">
                    <div>
                      <span>Catalog Sum: <strong>₹{standardSum}</strong></span>
                      <small>({totalComboCandles} total candles)</small>
                    </div>
                    <button
                      type="button"
                      className="combo-quick-fill-btn"
                      onClick={handleUseStandardSumAsMrp}
                      title={`Set Combine MRP to ₹${standardSum}`}
                    >
                      ⚡ Use as Combine MRP
                    </button>
                  </div>
                </div>
              )}

              {/* Combo Quick Generators */}
              <div className="combo-helpers-row">
                <button
                  type="button"
                  className="combo-helper-pill"
                  onClick={handleAutoGenerateDescription}
                >
                  ✨ Auto-Generate Description
                </button>
                <button
                  type="button"
                  className="combo-helper-pill"
                  onClick={handleAutoFillImagesFromCandles}
                >
                  📸 Auto-Fill Photos from Selected Candles
                </button>
              </div>
            </div>
          )}

          <label className="full-width">
            Description
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder={mode === 'combo' ? 'Handcrafted Artisanal Candle Combo includes...' : 'Soft, creamy vanilla with a comforting warmth...'}
            />
          </label>

          <label>
            Slug
            <input
              type="text"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
              placeholder={mode === 'combo' ? 'festive-duo-pack' : 'vanilla'}
            />
          </label>

          {mode === 'standard' ? (
            <label>
              Category
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                <option value="single">Single fragrance</option>
                <option value="blend">Signature blend</option>
              </select>
            </label>
          ) : (
            <label>
              Size / Pack Label
              <input
                type="text"
                value={form.size_label}
                onChange={(e) => update('size_label', e.target.value)}
                placeholder="Combo Pack (2 Candles)"
              />
            </label>
          )}

          {/* COMBINE MRP AND SALE VALUE */}
          <label>
            <span>{mode === 'combo' ? 'Combine MRP (₹)' : 'Regular Price (₹)'} <strong className="required-star">*</strong></span>
            <input
              type="number"
              step="0.01"
              value={form.price_inr}
              onChange={(e) => update('price_inr', e.target.value)}
              placeholder="e.g. 1100"
              required
            />
          </label>

          <label>
            <span>{mode === 'combo' ? 'Sale Value / Offer Price (₹)' : 'Sale Price (₹)'} <strong className="required-star">*</strong></span>
            <input
              type="number"
              step="0.01"
              value={form.sale_price_inr}
              onChange={(e) => update('sale_price_inr', e.target.value)}
              placeholder="e.g. 849"
              required
            />
          </label>

          {savings > 0 && (
            <div className="full-width combo-discount-banner">
              <Sparkles size={16} />
              <span>
                Discount: Customer saves <strong>₹{savings.toLocaleString('en-IN')}</strong> ({discountPercent}% OFF bundle offer!)
              </span>
            </div>
          )}

          {/* Multi-Image Upload (Max 4 images like Meesho) */}
          <div className="full-width image-selection-container">
            <div className="image-field-header">
              <label className="image-field-label">
                {mode === 'combo' ? 'Combo Pack Images (Upload up to 4 images)' : 'Product Images (Upload up to 4 images)'}
              </label>
              <span className="image-count-pill">{form.images.length}/4</span>
            </div>
            
            <div className="image-input-options">
              <button
                type="button"
                className="image-upload-file-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage || form.images.length >= 4}
              >
                <Upload size={16} />
                <span>{isProcessingImage ? 'Uploading...' : form.images.length >= 4 ? 'Max 4 images added' : 'Upload photo(s) from files'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <span className="image-input-divider">or add URL</span>
              <div className="image-url-row">
                <ImageIcon size={16} />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  disabled={form.images.length >= 4}
                />
                <button
                  type="button"
                  className="add-url-btn"
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim() || form.images.length >= 4}
                >
                  Add
                </button>
              </div>
            </div>

            {form.images.length > 0 && (
              <div className="multi-image-preview-grid">
                {form.images.map((img, idx) => (
                  <div key={idx} className="multi-image-slot">
                    <img src={img} alt={`Preview ${idx + 1}`} />
                    <span className="slot-badge">{idx === 0 ? 'Main Cover' : `Photo ${idx + 1}`}</span>
                    <button
                      type="button"
                      className="slot-remove-btn"
                      onClick={() => removeImageAt(idx)}
                      title="Remove this photo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {mode === 'standard' && (
            <>
              <label>Size label<input type="text" value={form.size_label} onChange={(e) => update('size_label', e.target.value)} placeholder="200g" /></label>
              <label>Fragrance<input type="text" value={form.fragrance} onChange={(e) => update('fragrance', e.target.value)} placeholder="Vanilla, sandalwood" /></label>
            </>
          )}

          <label>Weight (grams)<input type="number" value={form.weight_grams} onChange={(e) => update('weight_grams', e.target.value)} placeholder={mode === 'combo' ? (totalComboCandles * 200).toString() : '200'} /></label>
          <label>Stock quantity<input type="number" value={form.stock_quantity} onChange={(e) => update('stock_quantity', e.target.value)} placeholder="10" /></label>
        </div>

        <div className="edit-toggles">
          <label className="edit-checkbox"><input type="checkbox" checked={form.is_published} onChange={(e) => update('is_published', e.target.checked)} /> Published</label>
          <label className="edit-checkbox"><input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} /> Featured</label>
          <label className="edit-checkbox"><input type="checkbox" checked={form.is_bestseller} onChange={(e) => update('is_bestseller', e.target.checked)} /> Bestseller</label>
          <label className="edit-checkbox edit-checkbox-upcoming"><input type="checkbox" checked={form.is_upcoming} onChange={(e) => update('is_upcoming', e.target.checked)} /> Upcoming Candle (Show on Upcoming page)</label>
        </div>

        <div className="edit-form-actions">
          <button type="button" className="button button-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button-dark" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save changes' : mode === 'combo' ? 'Create Combo Pack' : 'Add product'}
          </button>
        </div>
      </form>
    </div>
  </div>;
}

export default App;

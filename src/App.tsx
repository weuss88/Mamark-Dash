/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  AlertTriangle, 
  BarChart3, 
  Plus, 
  Search, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  MapPin,
  Store,
  Globe,
  Bell,
  Settings,
  LogOut,
  CreditCard,
  User,
  RefreshCcw,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { 
  AreaChart,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type Entity = 'SENEGAL' | 'FRANCE_BOUTIQUE' | 'FRANCE_ECOMMERCE';

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number; // Price per unit
}

interface StockLevel {
  productId: string;
  entity: Entity;
  quantity: number;
  threshold: number;
}

interface Shipment {
  id: string;
  dateDeparture: string;
  dateArrivalEstimated: string;
  status: 'PREPARATION' | 'TRANSIT' | 'RECEIVED' | 'STOCKED';
  items: { productId: string; quantity: number }[];
}

// --- Mock Data ---

const PRODUCTS: Product[] = [
  { id: '1', name: 'Fonio précuit', category: 'Céréales', unit: 'kg', price: 5.5 },
  { id: '2', name: 'Arraw', category: 'Céréales', unit: 'kg', price: 4.0 },
  { id: '3', name: 'Thiakry', category: 'Céréales', unit: 'kg', price: 4.5 },
  { id: '4', name: 'Couscous de mil', category: 'Céréales', unit: 'kg', price: 4.2 },
  { id: '5', name: 'Bissap', category: 'Infusions', unit: 'kg', price: 6.0 },
  { id: '6', name: 'Purée de piment', category: 'Condiments', unit: 'pot', price: 3.5 },
  { id: '7', name: 'Épices mélangées', category: 'Condiments', unit: 'sachet', price: 2.8 },
];

const INITIAL_STOCKS: StockLevel[] = [
  // Senegal
  { productId: '1', entity: 'SENEGAL', quantity: 1200, threshold: 200 },
  { productId: '2', entity: 'SENEGAL', quantity: 800, threshold: 150 },
  { productId: '5', entity: 'SENEGAL', quantity: 500, threshold: 100 },
  { productId: '6', entity: 'SENEGAL', quantity: 300, threshold: 50 },
  // France Boutique
  { productId: '1', entity: 'FRANCE_BOUTIQUE', quantity: 45, threshold: 50 },
  { productId: '2', entity: 'FRANCE_BOUTIQUE', quantity: 12, threshold: 20 },
  { productId: '5', entity: 'FRANCE_BOUTIQUE', quantity: 80, threshold: 30 },
  // France E-commerce
  { productId: '1', entity: 'FRANCE_ECOMMERCE', quantity: 150, threshold: 100 },
  { productId: '6', entity: 'FRANCE_ECOMMERCE', quantity: 8, threshold: 15 },
];

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'EXP-2024-001',
    dateDeparture: subDays(new Date(), 10).toISOString(),
    dateArrivalEstimated: addDays(new Date(), 5).toISOString(),
    status: 'TRANSIT',
    items: [
      { productId: '1', quantity: 500 },
      { productId: '2', quantity: 200 },
      { productId: '6', quantity: 100 },
    ]
  },
  {
    id: 'EXP-2024-002',
    dateDeparture: subDays(new Date(), 2).toISOString(),
    dateArrivalEstimated: addDays(new Date(), 15).toISOString(),
    status: 'PREPARATION',
    items: [
      { productId: '3', quantity: 300 },
      { productId: '4', quantity: 300 },
    ]
  }
];

// Mock historical data for charts
const STOCK_HISTORY = [
  { date: '01/03', Senegal: 2400, France: 420 },
  { date: '03/03', Senegal: 2350, France: 435 },
  { date: '05/03', Senegal: 2380, France: 450 },
  { date: '07/03', Senegal: 2320, France: 465 },
  { date: '09/03', Senegal: 2290, France: 480 },
  { date: '11/03', Senegal: 2310, France: 495 },
  { date: '12/03', Senegal: 2280, France: 510 },
];

// --- Components ---

const StatCard = ({ title, value, icon: Icon, trend, color, negative }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-4 md:p-6 flex items-center justify-between border-white/5"
  >
    <div>
      <p className="text-[10px] font-bold text-vision-text-muted mb-2 uppercase tracking-[0.2em]">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-display font-bold text-white tracking-tight">{value}</h3>
        {trend && (
          <span className={cn("text-[10px] font-bold font-mono", negative ? "text-rose-500" : "text-emerald-400")}>
            {trend}
          </span>
        )}
      </div>
    </div>
    <div className={cn("stat-icon-box bg-opacity-10", color.replace('bg-', 'bg-opacity-10 text-'))}>
      <Icon className="w-5 h-5" />
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stocks' | 'shipments' | 'alerts'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [stocks, setStocks] = useState<StockLevel[]>(INITIAL_STOCKS);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<{ stock: StockLevel; product: Product } | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [newThresholdValue, setNewThresholdValue] = useState<number>(0);
  
  // New shipment form state
  const [newShipmentId, setNewShipmentId] = useState(`EXP-${new Date().getFullYear()}-003`);
  const [newShipmentItems, setNewShipmentItems] = useState<{[key: string]: number}>({});

  const handleCreateShipment = () => {
    const items = Object.entries(newShipmentItems)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }));

    if (items.length === 0) return;

    const newShipment: Shipment = {
      id: newShipmentId,
      dateDeparture: new Date().toISOString(),
      dateArrivalEstimated: addDays(new Date(), 15).toISOString(),
      status: 'PREPARATION',
      items
    };

    setShipments(prev => [newShipment, ...prev]);
    setIsShipmentModalOpen(false);
    setNewShipmentItems({});
    setNewShipmentId(`EXP-${new Date().getFullYear()}-${String(shipments.length + 2).padStart(3, '0')}`);
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      const product = PRODUCTS.find(p => p.id === s.productId);
      return product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             s.entity.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [stocks, searchTerm]);

  const alerts = useMemo(() => {
    return stocks.filter(s => s.quantity <= s.threshold);
  }, [stocks]);

  const totalStockValue = useMemo(() => {
    return stocks.reduce((acc, s) => {
      const product = PRODUCTS.find(p => p.id === s.productId);
      return acc + (s.quantity * (product?.price || 0));
    }, 0);
  }, [stocks]);

  const mostShippedData = useMemo(() => {
    return PRODUCTS.map(p => {
      const totalInStock = stocks
        .filter(s => s.productId === p.id)
        .reduce((acc, s) => acc + s.quantity, 0);
      return { name: p.name, quantity: totalInStock };
    }).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [stocks]);

  const handleUpdateStock = () => {
    if (!editingStock) return;
    setStocks(prev => prev.map(s => 
      (s.productId === editingStock.stock.productId && s.entity === editingStock.stock.entity)
        ? { ...s, quantity: newStockValue, threshold: newThresholdValue }
        : s
    ));
    setIsStockModalOpen(false);
    setEditingStock(null);
  };

  const openEditModal = (stock: StockLevel, product: Product) => {
    setEditingStock({ stock, product });
    setNewStockValue(stock.quantity);
    setNewThresholdValue(stock.threshold);
    setIsStockModalOpen(true);
  };

  const renderDashboard = () => {
    const isMobile = windowWidth < 768;
    
    return (
      <div className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Valeur Stock" value={`${totalStockValue.toLocaleString()} €`} trend="+12.5%" icon={TrendingUp} color="bg-vision-blue" />
          <StatCard title="Alertes Actives" value={alerts.length.toString()} trend={alerts.length > 5 ? "+2" : "STABLE"} icon={Bell} color="bg-vision-purple" negative={alerts.length > 5} />
          <StatCard title="Expéditions" value={shipments.length.toString()} trend="EN TRANSIT" icon={Truck} color="bg-vision-cyan" />
          <StatCard title="Ventes Estimées" value="173 000 €" trend="+8.2%" icon={Store} color="bg-vision-blue" />
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-8 glass-card p-6 md:p-10 relative overflow-hidden min-h-[300px] md:min-h-[380px] flex flex-col justify-center border-white/5"
          >
            <div className="absolute inset-0 z-0 opacity-30">
              <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80" 
                alt="Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-vision-bg via-vision-bg/60 to-transparent" />
            </div>
            <div className="relative z-10 max-w-lg">
              <p className="text-vision-cyan font-mono text-[10px] font-bold tracking-[0.3em] uppercase mb-2 md:mb-4">Système de Gestion Centralisé</p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 md:mb-6 leading-tight">MAMARK INT <br/><span className="italic font-normal text-vision-text-muted">Global Operations</span></h2>
              <p className="text-vision-text-muted mb-6 md:mb-10 leading-relaxed text-xs md:text-sm max-w-sm">
                Optimisation des flux logistiques entre le Sénégal et la France. Suivi analytique et prévisionnel de vos actifs.
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <button className="px-4 md:px-6 py-2.5 md:py-3 bg-vision-blue text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-vision-blue/20 hover:shadow-vision-blue/40 transition-all">
                  Rapports Annuels
                </button>
                <button className="px-4 md:px-6 py-2.5 md:py-3 border border-white/10 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all">
                  Configuration
                </button>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-4 glass-card p-6 md:p-8 flex flex-col items-center justify-center text-center border-white/5">
            <h3 className="text-[10px] font-bold text-vision-text-muted uppercase tracking-[0.2em] mb-6 md:mb-8 self-start">Performance Client</h3>
            <div className="relative w-40 h-40 md:w-56 md:h-56 mb-4 md:mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: 95 }, { value: 5 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 55 : 75}
                    outerRadius={isMobile ? 75 : 95}
                    startAngle={220}
                    endAngle={-40}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#0075FF" />
                    <Cell fill="rgba(255,255,255,0.03)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-display font-bold text-white">95<span className="text-sm md:text-lg font-normal text-vision-text-muted">%</span></span>
                <span className="text-[8px] md:text-[10px] font-bold text-vision-text-muted uppercase tracking-widest mt-1">Satisfaction</span>
              </div>
            </div>
            <div className="flex justify-between w-full text-[8px] md:text-[9px] font-bold text-vision-text-muted uppercase tracking-[0.3em] px-2">
              <span>Min 0%</span>
              <span>Objectif 100%</span>
            </div>
          </div>
        </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-card p-8 border-white/5">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Analyse des Flux</h3>
              <p className="text-[10px] text-vision-text-muted font-mono uppercase tracking-wider">Variation mensuelle des stocks consolidés</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-vision-blue" />
                <span className="text-[10px] font-bold text-vision-text-muted uppercase">Sénégal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-vision-cyan" />
                <span className="text-[10px] font-bold text-vision-text-muted uppercase">France</span>
              </div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={STOCK_HISTORY}>
                <defs>
                  <linearGradient id="colorSenegal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0075FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0075FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFrance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#01F3FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#01F3FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8B96A5', fontSize: 9, fontWeight: 600 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8B96A5', fontSize: 9, fontWeight: 600 }} 
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(6, 11, 38, 0.95)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 0' }}
                  labelStyle={{ color: '#8B96A5', fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Senegal" 
                  stroke="#0075FF" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorSenegal)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="France" 
                  stroke="#01F3FF" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorFrance)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-8 bg-gradient-to-br from-vision-card to-[#060B28] border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Inventaire Majeur</h3>
          <p className="text-[10px] text-vision-text-muted font-mono uppercase tracking-wider mb-10">Répartition par volume</p>
          
          <div className="h-[200px] mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostShippedData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip cursor={{fill: 'transparent'}} content={() => null} />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={10}>
                  {mostShippedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0075FF' : 'rgba(255,255,255,0.05)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-6">
            {mostShippedData.slice(0, 3).map((item, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-vision-blue" : "bg-white/20")} />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-vision-text-muted">{item.quantity} U</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.quantity / mostShippedData[0].quantity) * 100}%` }}
                    transition={{ duration: 1.5, delay: i * 0.2 }}
                    className={cn("h-full", i === 0 ? "bg-vision-blue" : "bg-white/20")} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

  const renderStocks = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Gestion des Stocks</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vision-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-vision-card border border-white/10 text-white focus:ring-2 focus:ring-vision-blue/50 outline-none text-xs"
          />
        </div>
      </div>
      <div className="glass-card overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-vision-text-muted border-b border-white/5 tracking-[0.2em]">
                <th className="px-4 md:px-8 py-6">Produit</th>
                <th className="px-4 md:px-8 py-6">Entité</th>
                <th className="px-4 md:px-8 py-6 text-right">Quantité</th>
                <th className="px-4 md:px-8 py-6 text-center">Statut</th>
                <th className="px-4 md:px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStocks.map((stock, i) => {
                const product = PRODUCTS.find(p => p.id === stock.productId);
                const isCritical = stock.quantity <= stock.threshold;
                return (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 md:px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-white tracking-tight group-hover:text-vision-blue transition-colors">{product?.name}</span>
                        <span className="text-[10px] text-vision-text-muted font-mono uppercase tracking-widest">{product?.category}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-5">
                      <span className="text-[10px] font-bold text-vision-text-muted font-mono uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                        {stock.entity.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-5 text-right font-mono font-bold text-white">
                      {stock.quantity} <span className="text-[10px] text-vision-text-muted font-normal">{product?.unit}</span>
                    </td>
                    <td className="px-4 md:px-8 py-5 text-center">
                      <div className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                        isCritical ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      )}>
                        <div className={cn(
                          "w-1 h-1 rounded-full mr-2 animate-pulse",
                          isCritical ? "bg-rose-500" : "bg-emerald-400"
                        )} />
                        {isCritical ? 'Critique' : 'Normal'}
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-5 text-right">
                      <button 
                        onClick={() => openEditModal(stock, product!)}
                        className="p-2 rounded-xl bg-white/5 text-vision-text-muted hover:bg-vision-blue hover:text-white transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderShipments = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Expéditions & Logistique</h2>
        <button 
          onClick={() => setIsShipmentModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-vision-blue text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-vision-blue/20 hover:scale-105 transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Nouvelle Expédition
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {shipments.map(ship => (
          <motion.div 
            key={ship.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-white">{ship.id}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    ship.status === 'TRANSIT' ? "bg-vision-blue/20 text-vision-blue" : 
                    ship.status === 'PREPARATION' ? "bg-vision-purple/20 text-vision-purple" : 
                    "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {ship.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-vision-text-muted">
                  Départ : {format(new Date(ship.dateDeparture), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-vision-text-muted uppercase font-bold tracking-wider mb-1">Arrivée estimée</p>
                <p className="font-bold text-white">
                  {format(new Date(ship.dateArrivalEstimated), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-vision-cyan font-bold">
                  J-{Math.ceil((new Date(ship.dateArrivalEstimated).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-8">
              <div className="h-1.5 bg-white/5 rounded-full w-full" />
              <div 
                className="absolute top-0 left-0 h-1.5 bg-vision-blue rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,117,255,0.5)]" 
                style={{ width: ship.status === 'PREPARATION' ? '25%' : ship.status === 'TRANSIT' ? '60%' : '100%' }}
              />
              <div className="flex justify-between mt-4">
                {['Préparation', 'En Transit', 'Reçu', 'En Stock FR'].map((step, i) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 mb-2",
                      (ship.status === 'PREPARATION' && i <= 0) || 
                      (ship.status === 'TRANSIT' && i <= 1) || 
                      (ship.status === 'RECEIVED' && i <= 2) ||
                      (ship.status === 'STOCKED' && i <= 3)
                      ? "bg-vision-blue border-vision-blue shadow-[0_0_8px_rgba(0,117,255,0.6)]" : "bg-vision-bg border-white/10"
                    )} />
                    <span className="text-[10px] font-bold uppercase text-vision-text-muted">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-[10px] font-bold text-vision-text-muted uppercase mb-3">Détail du lot</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ship.items.map(item => {
                  const product = PRODUCTS.find(p => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center justify-between bg-vision-card p-3 rounded-lg border border-white/5">
                      <span className="text-xs font-medium text-white">{product?.name}</span>
                      <span className="text-xs font-bold text-vision-cyan">{item.quantity} {product?.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Alertes & Notifications</h2>
      
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <Bell className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Tout est sous contrôle</h3>
            <p className="text-vision-text-muted">Aucun produit n'est sous le seuil critique pour le moment.</p>
          </div>
        ) : (
          alerts.map(alert => {
            const product = PRODUCTS.find(p => p.id === alert.productId);
            return (
              <motion.div 
                key={`${alert.entity}-${alert.productId}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-4 border-l-4 border-rose-500 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Stock Critique : {product?.name}</h4>
                    <p className="text-xs text-vision-text-muted">
                      Entité : <span className="text-white font-bold">{alert.entity.replace('_', ' ')}</span> • 
                      Actuel : <span className="text-rose-500 font-bold">{alert.quantity} {product?.unit}</span> • 
                      Seuil : {alert.threshold}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => openEditModal(alert, product!)}
                  className="text-vision-blue text-xs font-bold hover:underline flex items-center gap-1"
                >
                  Réapprovisionner <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })
        )}

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4 border-l-4 border-vision-cyan flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vision-cyan/10 flex items-center justify-center border border-vision-cyan/20">
              <Truck className="w-5 h-5 text-vision-cyan" />
            </div>
            <div>
              <h4 className="font-bold text-white">Expédition EXP-2024-001 en transit</h4>
              <p className="text-xs text-vision-text-muted">Arrivée prévue dans 5 jours. Pas de retard détecté.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-vision-bg text-white overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 sticky top-0 bg-vision-bg/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vision-blue flex items-center justify-center font-display font-black text-white shadow-[0_0_15px_rgba(0,117,255,0.5)]">M</div>
          <h1 className="text-[10px] font-display font-bold tracking-[0.2em] uppercase text-white">MAMARK</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <AnimatePresence>
        {(isMobileMenuOpen || windowWidth >= 1024) && (
          <motion.aside 
            initial={windowWidth < 1024 ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={cn(
              "fixed lg:sticky top-0 left-0 h-screen z-[60] lg:z-40 w-64 p-6 flex flex-col gap-8 border-r border-white/5 bg-vision-bg lg:bg-transparent overflow-y-auto custom-scrollbar",
              !isMobileMenuOpen && "hidden lg:flex"
            )}
          >
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-vision-blue flex items-center justify-center font-display font-black text-white shadow-[0_0_15px_rgba(0,117,255,0.5)]">M</div>
              <h1 className="text-xs font-display font-bold tracking-[0.3em] uppercase text-white">MAMARK DASH</h1>
            </div>

            <div className="space-y-1">
              {[
                { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
                { id: 'stocks', label: 'Gestion Stocks', icon: Package },
                { id: 'shipments', label: 'Expéditions', icon: Truck },
                { id: 'alerts', label: 'Alertes', icon: Bell, badge: alerts.length },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn("sidebar-item w-full", activeTab === item.id && "active")}
                >
                  <div className="sidebar-icon-box">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold flex-1 text-left">{item.label}</span>
                  {item.badge ? (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-bold text-vision-text-muted uppercase tracking-widest px-4 mb-4">Pages Compte</p>
              <div className="space-y-1">
                {[
                  { id: 'profile', label: 'Profil', icon: User },
                  { id: 'settings', label: 'Paramètres', icon: Settings },
                ].map((item) => (
                  <button key={item.id} className="sidebar-item w-full">
                    <div className="sidebar-icon-box bg-vision-card">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-[10px] font-bold text-vision-text-muted uppercase tracking-widest">État Système</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-emerald-500 uppercase">Connecté</span>
                </div>
              </div>
              
              <div className="space-y-4 px-2">
                {[
                  { label: "Flux Entrant", value: 84, color: "bg-vision-blue" },
                  { label: "Capacité Stock", value: 62, color: "bg-vision-purple" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-[9px] font-mono mb-1.5 text-vision-text-muted">
                      <span>{stat.label}</span>
                      <span className="text-white">{stat.value}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        className={cn("h-full", stat.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[8px] text-vision-text-muted uppercase font-mono">Dernière Sync</p>
                  <p className="text-[10px] font-mono font-bold">12:08:47</p>
                </div>
                <div className="w-8 h-8 rounded bg-vision-blue/10 flex items-center justify-center">
                  <RefreshCcw className="w-3 h-3 text-vision-blue" />
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 w-full custom-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
          <div>
            <p className="text-[10px] text-vision-text-muted font-mono font-bold uppercase tracking-[0.3em] mb-1">
              Pages / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </p>
            <h2 className="text-xl font-display font-bold text-white">
              {activeTab === 'dashboard' ? 'Tableau de Bord' : 
               activeTab === 'stocks' ? 'Gestion des Stocks' : 
               activeTab === 'shipments' ? 'Expéditions' : 'Alertes'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vision-text-muted" />
              <input 
                type="text" 
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-vision-card border border-white/10 text-xs text-white outline-none focus:ring-1 focus:ring-vision-blue/30"
              />
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <button className="text-xs font-bold text-vision-text-muted flex items-center gap-2 hover:text-white transition-colors">
                <User className="w-4 h-4" /> <span className="hidden sm:inline">Connexion</span>
              </button>
              <div className="flex gap-4 text-vision-text-muted">
                <Settings className="w-4 h-4 cursor-pointer hover:text-white" />
                <div className="relative">
                  <Bell className="w-4 h-4 cursor-pointer hover:text-white" />
                  {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-vision-bg" />}
                </div>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'stocks' && renderStocks()}
            {activeTab === 'shipments' && renderShipments()}
            {activeTab === 'alerts' && renderAlerts()}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {isStockModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsStockModalOpen(false)} 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }} 
                className="glass-card w-full max-w-md p-8 relative z-10"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-display font-bold text-white">Mise à jour Stock</h3>
                  <div className="px-4 py-1.5 rounded-full bg-vision-blue/10 text-vision-blue text-[10px] font-bold uppercase font-mono tracking-widest">
                    {editingStock?.product.name}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-vision-text-muted uppercase mb-2">Quantité Actuelle ({editingStock?.product.unit})</label>
                    <input 
                      type="number" 
                      value={newStockValue} 
                      onChange={(e) => setNewStockValue(Number(e.target.value))} 
                      className="w-full bg-vision-bg border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-vision-blue/50 font-mono" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-vision-text-muted uppercase mb-2">Seuil d'Alerte</label>
                    <input 
                      type="number" 
                      value={newThresholdValue} 
                      onChange={(e) => setNewThresholdValue(Number(e.target.value))} 
                      className="w-full bg-vision-bg border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-vision-blue/50 font-mono" 
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setIsStockModalOpen(false)} 
                      className="flex-1 py-3 rounded-xl border border-white/10 text-vision-text-muted font-bold hover:bg-white/5 transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={handleUpdateStock} 
                      className="flex-1 py-3 rounded-xl bg-vision-blue text-white font-bold shadow-[0_0_15px_rgba(0,117,255,0.4)] hover:shadow-[0_0_25px_rgba(0,117,255,0.6)] transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Shipment Modal */}
        <AnimatePresence>
          {isShipmentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsShipmentModalOpen(false)} 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }} 
                className="glass-card w-full max-w-lg p-8 relative z-10"
              >
                <h3 className="text-2xl font-display font-bold text-white mb-8">Nouvelle Expédition</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-vision-text-muted uppercase mb-2">ID Expédition</label>
                      <input type="text" defaultValue={`EXP-${new Date().getFullYear()}-003`} className="w-full bg-vision-bg border border-white/10 rounded-xl px-4 py-3 text-white outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-vision-text-muted uppercase mb-2">Statut Initial</label>
                      <select className="w-full bg-vision-bg border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                        <option>PREPARATION</option>
                        <option>TRANSIT</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-vision-text-muted uppercase tracking-[0.2em] mb-4">Produits à expédier</label>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {PRODUCTS.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{p.name}</span>
                            <span className="text-[10px] text-vision-text-muted font-mono">{p.unit}</span>
                          </div>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={newShipmentItems[p.id] || ''}
                            onChange={(e) => setNewShipmentItems(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                            className="w-24 bg-vision-bg border border-white/10 rounded-lg px-3 py-2 text-xs text-right font-mono text-vision-cyan focus:ring-1 focus:ring-vision-cyan/50 outline-none" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button onClick={() => setIsShipmentModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-white/10 text-vision-text-muted font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">Annuler</button>
                    <button onClick={handleCreateShipment} className="flex-1 py-4 rounded-2xl bg-vision-blue text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,117,255,0.4)] hover:shadow-[0_0_30px_rgba(0,117,255,0.6)] transition-all">Créer l'expédition</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

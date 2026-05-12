import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Package, 
  Users, 
  History, 
  TrendingUp, 
  Loader2, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  Image as ImageIcon, 
  X,
  Bell,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Share2,
  AlertTriangle,
  Square,
  CheckSquare,
  Download
} from 'lucide-react';

const Admin: React.FC = () => {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [unpaidInfo, setUnpaidInfo] = useState<{ currentDay: number, unpaidUsers: any[] }>({ currentDay: 0, unpaidUsers: [] });
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const [newProduct, setNewProduct] = useState<any>({ name: '', description: '', image_url: '', video_url: '', media: [], stock: 10, price: 1000 });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<{ qr: string | null, isReady: boolean } | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const [configForm, setConfigForm] = useState({ 
    paymentNumber: '', 
    paymentType: 'Till', 
    manualPaymentDetails: '',
    cycleDay: 1,
    systemState: 'RECRUITMENT'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'products') {
        const res = await fetch('/api/products', { headers });
        const data = await res.json();
        setProducts(data);
      } else if (activeTab === 'members') {
        const res = await fetch('/api/admin/members', { headers });
        const data = await res.json();
        setMembers(data);
      } else if (activeTab === 'stk') {
        const res = await fetch('/api/admin/transactions', { headers });
        const data = await res.json();
        setTransactions(data.filter((t: any) => t.mpesa_checkout_id));
      } else if (activeTab === 'reminders') {
        const res = await fetch('/api/admin/reminders/unpaid', { headers });
        const data = await res.json();
        setUnpaidInfo(data);
      } else if (activeTab === 'whatsapp') {
        const res = await fetch('/api/admin/whatsapp-status', { headers });
        const data = await res.json();
        setWhatsappStatus(data);
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/admin/system', { headers });
        const data = await res.json();
        setSystemConfig(data);
        setConfigForm({ 
          paymentNumber: data.paymentNumber || '', 
          paymentType: data.paymentType || 'Till',
          manualPaymentDetails: data.manualPaymentDetails || '',
          cycleDay: data.cycleDay || 1,
          systemState: data.systemState || 'RECRUITMENT'
        });
      } else if (activeTab === 'approvals') {
        const res = await fetch('/api/admin/transactions', { headers });
        const data = await res.json();
        setPendingDeposits(data.filter((t: any) => t.type === 'manual_deposit' && t.status === 'pending'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (activeTab === 'whatsapp') {
      fetchData();
      interval = setInterval(fetchData, 5000); // Poll every 5s for QR
    } else {
      fetchData();
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setNewProduct({ name: '', description: '', image_url: '', video_url: '', stock: 10, price: 1000 });
        setNotification({ message: 'Product added successfully!', type: 'success' });
        fetchData();
      } else {
        throw new Error('Failed to add product');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to add product.', type: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/products/bulk', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids: selectedProducts })
      });
      
      if (res.ok) {
        setNotification({ message: `${selectedProducts.length} products deleted successfully!`, type: 'success' });
        setSelectedProducts([]);
        fetchData();
      } else {
        throw new Error('Bulk delete failed');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to delete products.', type: 'error' });
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const { _id, id, ...data } = editingProduct;
      const res = await fetch(`/api/admin/products/${_id || id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setEditingProduct(null);
        setNotification({ message: 'Product updated successfully!', type: 'success' });
        fetchData();
      } else {
        throw new Error('Failed to update product');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to update product.', type: 'error' });
    }
  };

  const handleDeleteProduct = async (id: string, name?: string) => {
    const confirmationMessage = name 
      ? `WARNING: You are about to permanently delete "${name}".\n\nThis action will remove the product and all associated media from the inventory.\n\nAre you sure you want to proceed?` 
      : 'Are you sure you want to delete this product?';
      
    if (!window.confirm(confirmationMessage)) return;
    
    // Explicit confirmation for Rustic Wooden Chair
    if (name?.toLowerCase().includes('rustic wooden chair')) {
      if (!window.confirm('CRITICAL: This is the Rustic Wooden Chair. Confirming final deletion...')) return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotification({ message: 'Product deleted successfully!', type: 'success' });
        fetchData();
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to delete product.', type: 'error' });
    }
  };

  const handleTriggerDraw = async () => {
    if (!window.confirm('Are you sure you want to process cycle payouts? This will deduct funds and notify winners.')) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/process-cycle-payout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ message: `Payout processed! Recipient: ${data.winnerName} (#${data.winnerPosition}). Payout numbers have been reshuffled.`, type: 'success' });
        fetchData();
      } else {
        setNotification({ message: data.error, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'An error occurred during the draw.', type: 'error' });
    }
  };

  const handleSendReminders = async () => {
    if (!window.confirm('Send WhatsApp payment reminders to all unpaid members?')) return;
    setSendingReminders(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/reminders/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotification({ message: 'Daily reminders sent successfully!', type: 'success' });
      } else {
        setNotification({ message: 'Failed to send reminders.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Error sending reminders.', type: 'error' });
    } finally {
      setSendingReminders(false);
    }
  };

  const handleUpdateBalance = async (userId: string) => {
    const amount = window.prompt('Enter amount to add to member balance (KES):');
    if (!amount || isNaN(Number(amount))) return;

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/update-balance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, amount: Number(amount) })
      });
      if (res.ok) {
        setNotification({ message: 'Balance updated successfully!', type: 'success' });
        fetchData();
      } else {
        throw new Error('Failed to update balance');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Error updating balance.', type: 'error' });
    }
  };

  const handleTriggerStk = async (userId: string) => {
    const amount = window.prompt('Enter amount to request from member (KES):');
    if (!amount || isNaN(Number(amount))) return;

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/trigger-stk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, amount: Number(amount) })
      });
      if (res.ok) {
        setNotification({ message: 'STK Push initiated successfully!', type: 'success' });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to trigger STK Push');
      }
    } catch (err: any) {
      console.error(err);
      setNotification({ message: err.message || 'Error triggering STK Push.', type: 'error' });
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(configForm)
      });
      if (res.ok) {
        setNotification({ message: 'Settings updated successfully!', type: 'success' });
        fetchData();
      }
    } catch (err) {
      setNotification({ message: 'Failed to update settings.', type: 'error' });
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/members/${editingMember._id || editingMember.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingMember)
      });
      if (res.ok) {
        setNotification({ message: 'Member updated successfully!', type: 'success' });
        setEditingMember(null);
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update member');
      }
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    }
  };

  const handleApproveDeposit = async (id: string, status: 'completed' | 'failed', currentAmount?: number) => {
    let rejectionReason = null;
    let approvedAmount = undefined;

    if (status === 'completed') {
      const inputAmount = window.prompt(`Confirm approved amount (KES):`, currentAmount?.toString());
      if (inputAmount === null) return; // User cancelled
      approvedAmount = Number(inputAmount);
      if (isNaN(approvedAmount)) {
        alert('Invalid amount entered.');
        return;
      }
    }

    if (status === 'failed') {
      rejectionReason = window.prompt('Enter a reason for rejection (optional, will be sent to member via WhatsApp):');
      if (rejectionReason === null) return; // User cancelled
    }

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/transactions/approve-manual', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId: id, status, rejectionReason, approvedAmount })
      });
      if (res.ok) {
        setNotification({ message: `Deposit ${status === 'completed' ? 'approved' : 'rejected'}`, type: 'success' });
        fetchData();
      }
    } catch (err) {
      setNotification({ message: 'Error processing approval', type: 'error' });
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`CRITICAL: Are you sure you want to delete member "${name}"? This will permanently remove their access and data. This action cannot be undone.`)) return;

    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/members/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotification({ message: 'Member deleted successfully!', type: 'success' });
        fetchData();
      } else {
        throw new Error('Failed to delete member');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Error deleting member.', type: 'error' });
    }
  };

  const handleApproveProduct = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/products/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: id, status })
      });
      if (res.ok) {
        setNotification({ message: `Product ${status}`, type: 'success' });
        fetchData();
      }
    } catch (err) {
      setNotification({ message: 'Error processing product', type: 'error' });
    }
  };

  const exportUsersToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Verified', 'Terms Accepted', 'Terms Accepted At', 'Joined At'];
    const rows = members.map(m => [
      m.name,
      m.email,
      m.phone,
      m.role,
      m.isVerified ? 'Yes' : 'No',
      m.termsAccepted ? 'Yes' : 'No',
      m.termsAcceptedAt ? new Date(m.termsAcceptedAt).toLocaleString() : 'N/A',
      new Date(m.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JungleChama_Members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false, type: 'image' | 'video' = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.url;
        
        if (isEditing) {
          const currentMedia = editingProduct.media || [];
          if (currentMedia.length >= 4) {
            setNotification({ message: 'Maximum 4 media items allowed.', type: 'error' });
            return;
          }
          const updatedMedia = [...currentMedia, { url, type }];
          setEditingProduct({ 
            ...editingProduct, 
            media: updatedMedia,
            image_url: type === 'image' ? url : editingProduct.image_url,
            video_url: type === 'video' ? url : editingProduct.video_url
          });
        } else {
          const currentMedia = newProduct.media || [];
          if (currentMedia.length >= 4) {
            setNotification({ message: 'Maximum 4 media items allowed.', type: 'error' });
            return;
          }
          const updatedMedia = [...currentMedia, { url, type }];
          setNewProduct({ 
            ...newProduct, 
            media: updatedMedia,
            image_url: type === 'image' ? url : newProduct.image_url,
            video_url: type === 'video' ? url : newProduct.video_url
          });
        }
        setNotification({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`, type: 'success' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Failed to upload.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-jungle font-bold text-xs uppercase tracking-[0.2em] mb-3">
              <div className="w-8 h-[1px] bg-jungle/30"></div>
              Administration
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight mb-2">
              Control <span className="text-jungle">Center</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm md:text-base">Manage your community's assets, members, and financial cycles.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerDraw}
              className="group flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 text-sm md:text-base"
            >
              <TrendingUp size={18} className="text-jungle group-hover:scale-110 transition-transform" />
              Process Payouts
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] min-w-[400px] p-5 rounded-2xl shadow-2xl flex items-center justify-between border ${
                notification.type === 'success' 
                  ? 'bg-white border-green-100 text-green-800' 
                  : 'bg-white border-red-100 text-red-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                }`}>
                  {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <p className="font-bold text-sm">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)} 
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mb-12">
          <nav className="flex items-center gap-1 p-1.5 bg-gray-200/50 backdrop-blur-sm rounded-2xl w-max border border-gray-200/50">
            {[
              { id: 'products', label: 'Inventory', icon: Package },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'approvals', label: 'Approvals', icon: CheckCircle2 },
              { id: 'stk', label: 'STK History', icon: History },
              { id: 'reminders', label: 'Reminders', icon: Bell },
              { id: 'whatsapp', label: 'WhatsApp', icon: Share2 },
              { id: 'settings', label: 'Settings', icon: Filter },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-md shadow-black/5 ring-1 ring-black/5' 
                    : 'text-gray-500 hover:text-black hover:bg-white/50'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-jungle' : ''} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <main>
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Form Section */}
              <aside className="lg:col-span-4">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-12">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-jungle/10 rounded-xl flex items-center justify-center text-jungle">
                      <Plus size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-black tracking-tight">New Product</h3>
                  </div>

                  <form onSubmit={handleAddProduct} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Product Identity</label>
                      <input
                        type="text"
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jungle/30 focus:ring-4 focus:ring-jungle/5 outline-none transition-all font-medium"
                        placeholder="e.g. Premium Smart Watch"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Context & Details</label>
                      <textarea
                        required
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jungle/30 focus:ring-4 focus:ring-jungle/5 outline-none transition-all font-medium min-h-[120px] resize-none"
                        placeholder="Describe the product value..."
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Product Media (Max 4)</label>
                        <div className="flex flex-wrap gap-4 mb-4">
                          {newProduct.media?.map((m: any, idx: number) => (
                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 group/item">
                              {m.type === 'image' ? (
                                <img src={m.url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px] font-black uppercase">Video</div>
                              )}
                              <button 
                                type="button"
                                onClick={() => setNewProduct({ ...newProduct, media: newProduct.media.filter((_: any, i: number) => i !== idx) })}
                                className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <input
                              type="file"
                              id="product-image-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, false, 'image')}
                              disabled={newProduct.media?.length >= 4}
                            />
                            <label
                              htmlFor="product-image-upload"
                              className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                newProduct.media?.length >= 4 ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:bg-gray-50 hover:border-jungle/30'
                              }`}
                            >
                              {uploading ? <Loader2 className="animate-spin text-jungle" /> : (
                                <>
                                  <ImageIcon className="text-gray-400" size={24} />
                                  <span className="text-[10px] font-black uppercase text-gray-500 text-center">Add Image</span>
                                </>
                              )}
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="file"
                              id="product-video-upload"
                              className="hidden"
                              accept="video/*"
                              onChange={(e) => handleFileUpload(e, false, 'video')}
                              disabled={newProduct.media?.length >= 4}
                            />
                            <label
                              htmlFor="product-video-upload"
                              className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                newProduct.media?.length >= 4 ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:bg-gray-50 hover:border-jungle/30'
                              }`}
                            >
                              {uploading ? <Loader2 className="animate-spin text-jungle" /> : (
                                <>
                                  <TrendingUp className="text-gray-400" size={24} />
                                  <span className="text-[10px] font-black uppercase text-gray-500 text-center">Add Video</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Inventory</label>
                        <input
                          type="number"
                          required
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                          className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jungle/30 focus:ring-4 focus:ring-jungle/5 outline-none transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">Price (KES)</label>
                        <input
                          type="number"
                          required
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) })}
                          className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-jungle/30 focus:ring-4 focus:ring-jungle/5 outline-none transition-all font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-5 bg-jungle text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20 flex items-center justify-center gap-2 group"
                    >
                      Create Product
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </div>
              </aside>

              {/* List Section */}
              <div className="lg:col-span-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h4 className="text-xl font-black text-black tracking-tight">Active Inventory</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => {
                        if (selectedProducts.length === products.length) {
                          setSelectedProducts([]);
                        } else {
                          setSelectedProducts(products.map(p => p._id || p.id));
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                    >
                      {selectedProducts.length === products.length ? <CheckSquare size={14} className="text-jungle" /> : <Square size={14} />}
                      {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedProducts.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        <Trash2 size={14} />
                        Delete {selectedProducts.length}
                      </button>
                    )}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-11 pr-6 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-jungle/5 outline-none w-48 focus:w-64 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      <Package size={14} />
                      {products.length} Items
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                      <Loader2 className="animate-spin text-jungle" size={40} />
                      <p className="font-bold uppercase tracking-widest text-xs">Loading Inventory...</p>
                    </div>
                  ) : products.filter(p => 
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                      p.description.toLowerCase().includes(productSearch.toLowerCase())
                    ).length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4">
                      <Package size={48} className="opacity-20" />
                      <p className="font-bold">No products match your search.</p>
                    </div>
                  ) : products.filter(p => 
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                      p.description.toLowerCase().includes(productSearch.toLowerCase())
                    ).map((product) => {
                      const isSelected = selectedProducts.includes(product._id || product.id);
                      const isLowStock = product.stock > 0 && product.stock < 5;
                      const outOfStock = product.stock === 0;

                      return (
                        <motion.div 
                          layout
                          key={product._id || product.id} 
                          className={`bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] border group hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-500 relative ${
                            isSelected ? 'border-jungle ring-2 ring-jungle/20' : 'border-gray-100'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <button 
                            onClick={() => {
                              const id = product._id || product.id;
                              if (isSelected) {
                                setSelectedProducts(selectedProducts.filter(sid => sid !== id));
                              } else {
                                setSelectedProducts([...selectedProducts, id]);
                              }
                            }}
                            className="absolute top-6 left-6 z-10 w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                          >
                            {isSelected ? (
                              <CheckSquare className="text-jungle" size={20} />
                            ) : (
                              <Square className="text-gray-300" size={20} />
                            )}
                          </button>

                          {/* Low Stock Indicator */}
                          {isLowStock && (
                            <div className="absolute top-20 left-6 z-10">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                                <AlertTriangle size={12} />
                                Low Stock
                              </div>
                            </div>
                          )}

                          {product.status === 'pending' && (
                            <div className="absolute top-20 left-6 z-10">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                <History size={12} />
                                User Pending
                              </div>
                            </div>
                          )}

                          {outOfStock && (
                            <div className="absolute top-20 left-6 z-10">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                <AlertCircle size={12} />
                                Sold Out
                              </div>
                            </div>
                          )}

                          <div className="relative aspect-square overflow-hidden bg-gray-50 uppercase font-black text-gray-200 text-6xl flex items-center justify-center">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              product.name.charAt(0)
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 gap-3">
                              {product.status === 'pending' && (
                                <div className="flex gap-2 w-full">
                                  <button 
                                    onClick={() => handleApproveProduct(product._id || product.id, 'approved')}
                                    className="flex-1 py-3 bg-jungle text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-jungle-dark transition-all flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle2 size={14} /> Approve
                                  </button>
                                  <button 
                                    onClick={() => handleApproveProduct(product._id || product.id, 'rejected')}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                </div>
                              )}
                              <div className="flex gap-2 w-full">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(product);
                                  }}
                                  className="flex-1 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-jungle hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                  <Edit3 size={14} /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product._id || product.id, product.name)}
                                  className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="absolute top-6 right-6">
                              <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                KES {product.price}
                              </div>
                            </div>
                          </div>
                          <div className="p-8">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-black text-xl text-black tracking-tight line-clamp-1">{product.name}</h4>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                product.stock > 10 ? 'bg-green-50 text-green-600' : 
                                product.stock > 0 ? 'bg-amber-50 text-amber-600' : 
                                'bg-red-50 text-red-600'
                              }`}>
                                {product.stock} in stock
                              </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 font-medium">{product.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-black tracking-tight">Community Members</h3>
                  <p className="text-gray-400 text-sm font-medium mt-1">Directory of all registered chama participants.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={exportUsersToCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-jungle transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search members..." 
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-11 pr-6 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-4 focus:ring-jungle/5 outline-none w-64 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Member Identity</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payout Slot</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Finance</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Access Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin text-jungle mx-auto" /></td></tr>
                    ) : members.filter(m => 
                        m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                        m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        m.phone.includes(memberSearch)
                      ).map((member) => (
                      <tr key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-jungle text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-jungle/20">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <span className="block font-black text-black text-lg tracking-tight">{member.name}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {member.id.slice(-6)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-xs font-black">
                              {member.payout_number}
                            </div>
                            <span className="text-sm font-bold text-gray-500">Position</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-jungle">KES {member.balance?.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Balance</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-black">KES {member.expectedDaily?.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Daily</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-sm font-bold text-black">{member.email}</p>
                          <p className="text-xs text-gray-400 font-medium mt-1">{member.phone}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mt-2 ${
                            member.termsAccepted ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {member.termsAccepted ? 'Terms OK' : 'No Terms'}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              member.role === 'admin' 
                                ? 'bg-black text-white' 
                                : 'bg-jungle/10 text-jungle'
                            }`}>
                              {member.role}
                            </span>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setEditingMember(member)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                                title="Edit Member"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleUpdateBalance(member.userId)}
                                className="p-2 text-jungle hover:bg-jungle/5 rounded-lg transition-all"
                                title="Add Balance"
                              >
                                <Plus size={16} />
                              </button>
                              <button 
                                onClick={() => handleTriggerStk(member.userId)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="STK Push Request"
                              >
                                <TrendingUp size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMember(member._id || member.id, member.name)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Member"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stk' && (
            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className="p-10 border-b border-gray-50">
                <h3 className="text-2xl font-black text-black tracking-tight">STK Push History</h3>
                <p className="text-gray-400 text-sm font-medium mt-1">Log of all M-Pesa STK push requests initiated by members or admins.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Request ID</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin text-jungle mx-auto" /></td></tr>
                    ) : transactions.length === 0 ? (
                      <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold italic">No STK requests found.</td></tr>
                    ) : transactions.map((t) => {
                      const member = members.find(m => m.userId === t.userId) || { name: t.userId };
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-10 py-8">
                            <span className="text-sm font-bold text-gray-500">
                              {new Date(t.date).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <p className="font-black text-black">{member.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.userId}</p>
                          </td>
                          <td className="px-10 py-8 font-black text-black">KES {t.amount}</td>
                          <td className="px-10 py-8 text-[10px] font-mono text-gray-400">{t.mpesa_checkout_id}</td>
                          <td className="px-10 py-8">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              t.status === 'completed' ? 'bg-green-50 text-green-600' : 
                              t.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 
                              'bg-red-50 text-red-600'
                            }`}>
                              <div className={`w-1 h-1 rounded-full ${
                                t.status === 'completed' ? 'bg-green-500' : 
                                t.status === 'pending' ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}></div>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-10">
              <div className="bg-white p-12 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-jungle/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-jungle/10 rounded-2xl flex items-center justify-center text-jungle">
                      <Bell size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-black tracking-tight">Daily Reminders</h2>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Cycle Day</span>
                      <span className="text-3xl font-black text-black">{unpaidInfo.currentDay}</span>
                    </div>
                    <div className="w-[1px] h-10 bg-gray-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Payments</span>
                      <span className="text-3xl font-black text-red-500">{unpaidInfo.unpaidUsers.length}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSendReminders}
                  disabled={sendingReminders || unpaidInfo.unpaidUsers.length === 0}
                  className="relative z-10 px-10 py-5 bg-jungle text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-2xl shadow-jungle/30 flex items-center gap-3 disabled:opacity-50 group"
                >
                  {sendingReminders ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Broadcast Reminders
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-xl font-black text-black tracking-tight">Unpaid Members List</h3>
                  <div className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Action Required
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Member</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Phone Number</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment Status</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin text-jungle mx-auto" /></td></tr>
                      ) : unpaidInfo.unpaidUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-24 text-center">
                            <div className="flex flex-col items-center gap-4 text-gray-300">
                              <CheckCircle2 size={64} className="opacity-20" />
                              <p className="font-black text-xl tracking-tight text-gray-400">Perfect Record!</p>
                              <p className="text-sm font-medium">All members have contributed for today.</p>
                            </div>
                          </td>
                        </tr>
                      ) : unpaidInfo.unpaidUsers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center font-black text-lg">
                                {member.name.charAt(0)}
                              </div>
                              <span className="font-black text-black text-lg tracking-tight">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-sm font-bold text-gray-500">{member.phone}</td>
                          <td className="px-10 py-8">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                              Pending
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <button className="text-[10px] font-black uppercase tracking-widest text-jungle hover:underline underline-offset-4">
                              Direct Message
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="bg-white p-12 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Share2 size={32} />
                </div>
                <h3 className="text-3xl font-black text-black tracking-tight mb-4">WhatsApp Connection</h3>
                <p className="text-gray-400 font-medium mb-12">
                  Connect your business WhatsApp account to automate reminders and notifications.
                </p>

                {whatsappStatus?.isReady ? (
                  <div className="bg-green-50 p-10 rounded-[2.5rem] border border-green-100">
                    <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-2xl font-black text-green-900 mb-2">WhatsApp Connected</h4>
                    <p className="text-green-700 font-medium">Your system is live and sending automated updates.</p>
                  </div>
                ) : whatsappStatus?.qr ? (
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 inline-block">
                      <img src={whatsappStatus.qr} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto" />
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl text-left max-w-md mx-auto">
                      <h5 className="font-black text-black mb-3 text-sm uppercase tracking-widest">How to connect:</h5>
                      <ol className="text-sm text-gray-500 space-y-3 list-decimal ml-4 font-medium">
                        <li>Open WhatsApp on your phone</li>
                        <li>Tap Menu or Settings and select Linked Devices</li>
                        <li>Tap on Link a Device</li>
                        <li>Point your phone to this screen to capture the code</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center gap-4 text-gray-400">
                    <Loader2 className="animate-spin text-jungle" size={40} />
                    <p className="font-bold uppercase tracking-widest text-xs">Generating QR Code...</p>
                    <p className="text-sm">This may take a moment as the browser initializes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgb(0,0,0,0.06)] border border-gray-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-jungle text-white rounded-2xl flex items-center justify-center">
                  <Filter size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight">System Config</h3>
                  <p className="text-gray-400 font-medium text-sm">Define payment details for manual deposits.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateConfig} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Cycle Day</label>
                    <input
                      type="number"
                      required
                      value={configForm.cycleDay}
                      onChange={(e) => setConfigForm({ ...configForm, cycleDay: parseInt(e.target.value) })}
                      className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System State</label>
                    <select
                      value={configForm.systemState}
                      onChange={(e) => setConfigForm({ ...configForm, systemState: e.target.value as any })}
                      className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    >
                      <option value="RECRUITMENT">Recruitment</option>
                      <option value="SAVING">Saving</option>
                      <option value="BREAK">Break</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Manual Payment Header</label>
                    <input
                      type="text"
                      required
                      value={configForm.manualPaymentDetails}
                      onChange={(e) => setConfigForm({ ...configForm, manualPaymentDetails: e.target.value })}
                      className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                      placeholder="e.g. PAY TO CASHIER NUMBER"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Till', 'Paybill', 'Personal'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setConfigForm({ ...configForm, paymentType: type as any })}
                        className={`py-4 rounded-2xl font-bold text-sm transition-all ${
                          configForm.paymentType === type 
                            ? 'bg-black text-white shadow-xl shadow-black/20' 
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    {configForm.paymentType} Details
                  </label>
                  <input
                    type="text"
                    required
                    value={configForm.paymentNumber}
                    onChange={(e) => setConfigForm({ ...configForm, paymentNumber: e.target.value })}
                    className="w-full px-6 py-5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-black text-xl tracking-tight"
                    placeholder={configForm.paymentType === 'Till' ? 'e.g. 522123' : 'e.g. 0712345678'}
                  />
                  <p className="text-[10px] text-gray-400 font-medium ml-1">
                    This will be displayed to members when they choose manual payment.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-6 bg-jungle text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-2xl shadow-jungle/30"
                >
                  Save Configuration
                </button>
              </form>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {pendingDeposits.length === 0 ? (
                   <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 gap-6">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                       <CheckCircle2 size={40} className="opacity-20" />
                     </div>
                     <div className="text-center">
                        <p className="font-black text-2xl tracking-tight text-gray-400">All caught up!</p>
                        <p className="text-sm font-medium">No manual payments awaiting approval.</p>
                     </div>
                   </div>
                 ) : pendingDeposits.map((dep) => {
                   const member = members.find(m => m.userId === dep.userId) || { name: dep.userId };
                   return (
                     <div key={dep._id || dep.id} className="bg-white p-8 rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-6 group hover:translate-y-[-4px] transition-all">
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                           {member.name.charAt(0)}
                         </div>
                         <div>
                           <h4 className="font-black text-lg tracking-tight">{member.name}</h4>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(dep.date).toLocaleString()}</p>
                         </div>
                       </div>

                       <div className="bg-gray-50 p-6 rounded-2xl">
                         <div className="flex justify-between items-baseline mb-4">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                           <span className="text-2xl font-black text-jungle">KES {dep.amount}</span>
                         </div>
                         <div className="space-y-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User Message</span>
                            <p className="text-xs font-medium text-gray-600 bg-white/50 p-3 rounded-lg border border-gray-100 italic">"{dep.manualMessage}"</p>
                         </div>
                       </div>

                       <div className="flex gap-3">
                         <button 
                           onClick={() => handleApproveDeposit(dep._id || dep.id, 'completed', dep.amount)}
                           className="flex-1 py-4 bg-jungle text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-jungle-dark shadow-lg shadow-jungle/20 transition-all"
                         >
                           Approve
                         </button>
                         <button 
                           onClick={() => handleApproveDeposit(dep._id || dep.id, 'failed', dep.amount)}
                           className="flex-1 py-4 bg-red-50 text-red-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                         >
                           Reject
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMember(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-black tracking-tight">Edit Member</h2>
                <button onClick={() => setEditingMember(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateMember} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      required
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={editingMember.phone}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payout Position</label>
                    <input
                      type="number"
                      value={editingMember.payout_number || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, payout_number: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Balance (KES)</label>
                    <input
                      type="number"
                      required
                      value={editingMember.balance}
                      onChange={(e) => setEditingMember({ ...editingMember, balance: parseFloat(e.target.value) })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expected Daily (KES)</label>
                    <input
                      type="number"
                      required
                      value={editingMember.expectedDaily}
                      onChange={(e) => setEditingMember({ ...editingMember, expectedDaily: parseFloat(e.target.value) })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role</label>
                  <select
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-5 bg-jungle text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20"
                  >
                    Update Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-black tracking-tight">Edit Product</h2>
                <button onClick={() => setEditingProduct(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    required
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-medium min-h-[120px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Media (Max 4)</label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {editingProduct.media?.map((m: any, idx: number) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 group/item">
                        {m.type === 'image' ? (
                          <img src={m.url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px] font-black uppercase text-center">Video</div>
                        )}
                        <button 
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, media: editingProduct.media.filter((_: any, i: number) => i !== idx) })}
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="file"
                        id="edit-product-image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true, 'image')}
                        disabled={editingProduct.media?.length >= 4}
                      />
                      <label 
                        htmlFor="edit-product-image-upload"
                        className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          editingProduct.media?.length >= 4 ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:bg-gray-50 hover:border-jungle/30'
                        }`}
                      >
                        {uploading ? <Loader2 className="animate-spin text-jungle" /> : (
                          <>
                            <ImageIcon className="text-gray-400" size={20} />
                            <span className="text-[10px] font-black uppercase text-gray-500 text-center">New Image</span>
                          </>
                        )}
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        id="edit-product-video-upload"
                        className="hidden"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, true, 'video')}
                        disabled={editingProduct.media?.length >= 4}
                      />
                      <label 
                        htmlFor="edit-product-video-upload"
                        className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          editingProduct.media?.length >= 4 ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:bg-gray-50 hover:border-jungle/30'
                        }`}
                      >
                        {uploading ? <Loader2 className="animate-spin text-jungle" /> : (
                          <>
                            <TrendingUp className="text-gray-400" size={20} />
                            <span className="text-[10px] font-black uppercase text-gray-500 text-center">New Video</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock Level</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (KES)</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-jungle/5 outline-none font-bold"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-5 bg-jungle text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Admin;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';
import { User, Mail, Phone, Wallet, Edit2, Check, X, Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState((user as any)?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch('/api/member/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, phone, avatar_url: avatarUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local auth context
        if (setUser) {
          setUser(data.user);
        }
        setSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.url);
        setSuccess('Avatar uploaded! Don\'t forget to save changes.');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="bg-black p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-jungle/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-jungle" />
                  )}
                </div>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="animate-spin text-white" />
                      ) : (
                        <Edit2 className="text-white" size={24} />
                      )}
                    </label>
                  </>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">{user?.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <span className="px-4 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                    ID: {user?.userId}
                  </span>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    user?.role === 'admin' ? 'bg-red-500/20 border-red-500/20 text-red-400' : 'bg-jungle/20 border-jungle/20 text-jungle'
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-jungle hover:text-white transition-all shadow-xl shadow-black/10 flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-12">
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <X size={18} />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-8 p-4 bg-jungle/10 border border-jungle/20 text-jungle text-sm font-medium flex items-center gap-2 rounded-2xl">
                <Check size={18} />
                {success}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name Field */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Full Name</label>
                  <div className="relative group">
                    <User className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isEditing ? 'text-jungle' : 'text-gray-300'}`} size={18} />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] text-sm font-semibold focus:bg-white focus:border-jungle outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Your Name"
                      required
                    />
                  </div>
                </div>

                {/* Email Field - Read Only */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      type="email"
                      disabled
                      value={user?.email}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] text-sm font-semibold outline-none opacity-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Phone Number</label>
                  <div className="relative group">
                    <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isEditing ? 'text-jungle' : 'text-gray-300'}`} size={18} />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] text-sm font-semibold focus:bg-white focus:border-jungle outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g. 254712345678"
                      required
                    />
                  </div>
                </div>

                {/* Balance Field - Read Only */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Current Balance</label>
                  <div className="relative group">
                    <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <div className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] text-sm font-semibold flex items-center gap-2">
                       <span className="text-jungle font-black">{user?.balance?.toLocaleString()}</span>
                       <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">KES</span>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-8 py-5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-jungle transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Check size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user?.name || '');
                      setPhone(user?.phone || '');
                      setError(null);
                    }}
                    className="px-8 py-5 bg-gray-100 text-gray-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </motion.div>

        {/* Info Card */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
             <h3 className="text-sm font-black uppercase tracking-widest mb-4">Security Notice</h3>
             <p className="text-gray-500 text-xs leading-relaxed">
               Email addresses are verified and cannot be changed. If you need to update your email, please contact support.
               Your phone number is used for M-Pesa transactions - ensure it's correct.
             </p>
          </div>
          <div className="bg-jungle text-white p-8 rounded-[2rem] shadow-lg shadow-jungle/20">
             <h3 className="text-sm font-black uppercase tracking-widest mb-4">Wallet Info</h3>
             <p className="text-white/80 text-xs leading-relaxed">
               Your current balance is KES {user?.balance?.toLocaleString()}. This balance can be used to join more chama cycles or purchase hardware from our shop.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

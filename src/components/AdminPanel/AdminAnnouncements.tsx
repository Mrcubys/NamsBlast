import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { Announcement, AnnouncementType } from '../../types';

interface AdminAnnouncementsProps {
  onUpdated: () => void;
}

export const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({ onUpdated }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('INFO');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const list = await ApiService.getAllAnnouncementsAdmin();
      setAnnouncements(list);
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('INFO');
    setIsActive(true);
    setEditingId(null);
  };

  const handleEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setType(ann.type);
    setIsActive(ann.isActive);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);

    try {
      if (editingId) {
        await ApiService.updateAnnouncement(editingId, {
          title,
          content,
          type,
          isActive,
        });
        setFeedback('Pengumuman berhasil diperbarui!');
      } else {
        await ApiService.createAnnouncement({
          title,
          content,
          type,
          isActive,
        });
        setFeedback('Pengumuman baru berhasil diterbitkan ke dashboard user!');
      }
      resetForm();
      loadAnnouncements();
      onUpdated();
    } catch (err: any) {
      setFeedback(err.message || 'Gagal menyimpan pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      await ApiService.deleteAnnouncement(id);
      loadAnnouncements();
      onUpdated();
    }
  };

  const handleToggleActive = async (ann: Announcement) => {
    await ApiService.updateAnnouncement(ann.id, { isActive: !ann.isActive });
    loadAnnouncements();
    onUpdated();
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70">
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Form Creator */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              <span>{editingId ? 'Edit Pengumuman' : 'Buat Pengumuman'}</span>
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-xs text-rose-600 font-bold hover:underline">
                Batal
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pengumuman</label>
              <input
                type="text"
                required
                placeholder="Contoh: Jadwal Maintenance / Bonus Earning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Tipe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="INFO">Informasi Biasa (Biru/Slate)</option>
                <option value="SUCCESS">Bonus / Sukses (Hijau Emerald)</option>
                <option value="WARNING">Peringatan / Perhatian (Amber/Kuning)</option>
                <option value="DANGER">Penting / Darurat (Merah)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pesan Pengumuman</label>
              <textarea
                rows={4}
                required
                placeholder="Tuliskan isi pengumuman yang akan dibaca pengguna di dashboard..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ann-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="ann-active" className="text-xs font-bold text-slate-700 cursor-pointer">
                Tampilkan langsung di dashboard user (Aktif)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition shadow-xs disabled:opacity-50"
            >
              {editingId ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
            </button>
          </form>
        </div>

        {/* List of Announcements */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <h4 className="text-base font-bold text-slate-900 mb-4">Daftar Pengumuman Aktif &amp; Riwayat</h4>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  ann.isActive ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ann.type === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ann.type === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : ann.type === 'DANGER'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ann.type}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{ann.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleActive(ann)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
                    title={ann.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {ann.isActive ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(ann)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada pengumuman yang dibuat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

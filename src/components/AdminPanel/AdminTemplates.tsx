import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Check,
  Upload,
  Eye,
  Sparkles,
  Smartphone,
  X,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { MessageTemplate, TemplateType } from '../../types';

interface AdminTemplatesProps {
  onTemplateUpdated: () => void;
}

export const AdminTemplates: React.FC<AdminTemplatesProps> = ({ onTemplateUpdated }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [type, setType] = useState<TemplateType>('TEXT');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await ApiService.getTemplates();
      setTemplates(res.templates);
      setActiveTemplateId(res.activeTemplateId || null);
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setTitle('');
    setText('');
    setImageUrl(null);
    setType('TEXT');
    setEditingId(null);
  };

  const handleEdit = (tpl: MessageTemplate) => {
    setEditingId(tpl.id);
    setTitle(tpl.title);
    setText(tpl.text);
    setImageUrl(tpl.imageUrl || null);
    setType(tpl.type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageUrl(base64);
        if (type === 'TEXT') setType('TEXT_IMAGE');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsertVariable = (variable: string) => {
    setText((prev) => prev + ` ${variable}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      if (editingId) {
        await ApiService.updateTemplate(editingId, {
          title,
          text,
          imageUrl,
          type,
        });
        setFeedback('Template berhasil diperbarui!');
      } else {
        await ApiService.createTemplate({
          title,
          text,
          imageUrl,
          type,
        });
        setFeedback('Template baru berhasil dibuat!');
      }
      resetForm();
      loadTemplates();
      onTemplateUpdated();
    } catch (e: any) {
      setFeedback(`Gagal: ${e.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await ApiService.setActiveTemplate(id);
      setActiveTemplateId(id);
      onTemplateUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      await ApiService.deleteTemplate(id);
      loadTemplates();
      onTemplateUpdated();
    }
  };

  const renderPreviewFormatted = (rawText: string) => {
    return rawText
      .replace(/{nama}/g, 'Budi Santoso')
      .replace(/{nomor}/g, '081234567890')
      .replace(/{tanggal}/g, new Date().toLocaleDateString('id-ID'));
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            Tutup
          </button>
        </div>
      )}

      {/* Grid: Form Builder & Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Form Builder (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>{editingId ? 'Edit Template Pesan Blast' : 'Buat Template Pesan Blast Baru'}</span>
            </h3>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul / Label Template (Internal Admin)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Promo Ramadhan 50% / Pengumuman Sistem"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Variable insertion buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Teks Pesan WhatsApp (Support Variabel Dinamis)
                </label>
                <span className="text-[11px] text-slate-500">
                  Klik variabel untuk menyisipkan ke pesan:
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { tag: '{nama}', desc: 'Nama Kontak' },
                  { tag: '{nomor}', desc: 'Nomor WhatsApp' },
                  { tag: '{tanggal}', desc: 'Tanggal Hari Ini' },
                ].map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold transition flex items-center space-x-1"
                  >
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-emerald-600 font-sans">({v.desc})</span>
                  </button>
                ))}
              </div>

              <textarea
                rows={5}
                required
                placeholder="Halo {nama}, terima kasih telah mempercayai layanan kami. Dapatkan penawaran spesial hari ini..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
              />
            </div>

            {/* Image / Media attachment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Gambar / Media Brosur (Opsional - Mendukung Teks + Gambar)
              </label>

              {imageUrl ? (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden max-w-sm bg-slate-50 p-2">
                  <img src={imageUrl} alt="Preview Attachment" className="w-full h-40 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(null);
                      setType('TEXT');
                    }}
                    className="absolute top-4 right-4 p-1.5 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                  <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-700">
                    Klik untuk upload gambar flyer / brosur promo
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, JPEG (Maks 2MB)</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Simpan Perubahan Template' : 'Simpan Template Baru'}</span>
            </button>
          </form>
        </div>

        {/* Live Phone WhatsApp Mock Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col items-center">
          <div className="text-xs font-bold text-slate-700 mb-3 flex items-center space-x-1.5 self-start">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Simulasi Tampilan di WhatsApp Penerima</span>
          </div>

          <div className="w-full max-w-[280px] rounded-3xl border-4 border-slate-800 bg-[#EFEAE2] overflow-hidden shadow-md">
            {/* Phone header */}
            <div className="bg-[#075E54] p-3 text-white flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                NB
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">NamsBlast Bot</div>
                <div className="text-[9px] text-emerald-200">online</div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-3 min-h-[300px] flex flex-col justify-end space-y-2">
              <div className="bg-white rounded-xl rounded-tl-none p-2.5 shadow-sm text-xs text-slate-800 max-w-[90%] space-y-1.5 self-start border border-slate-200">
                {imageUrl && (
                  <img src={imageUrl} alt="Attached Promo" className="w-full h-28 object-cover rounded-lg mb-1" />
                )}
                <p className="whitespace-pre-line leading-relaxed text-[11px]">
                  {renderPreviewFormatted(text) || 'Teks pesan akan muncul di sini...'}
                </p>
                <div className="text-[9px] text-slate-400 text-right">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List of Templates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <h4 className="text-base font-bold text-slate-900 mb-4">Daftar Template Pesan Blast</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const isActive = tpl.id === activeTemplateId;
            return (
              <div
                key={tpl.id}
                className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                  isActive
                    ? 'border-emerald-400 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h5 className="font-bold text-slate-900 text-sm tracking-tight">{tpl.title}</h5>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                        AKTIF UTAMA
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetActive(tpl.id)}
                        className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 transition"
                      >
                        Jadikan Aktif
                      </button>
                    )}
                  </div>

                  {tpl.imageUrl && (
                    <img src={tpl.imageUrl} alt={tpl.title} className="w-full h-24 object-cover rounded-xl mb-2" />
                  )}

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {tpl.text}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400">{tpl.type}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(tpl)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

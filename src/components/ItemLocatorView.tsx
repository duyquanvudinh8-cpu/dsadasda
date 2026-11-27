import { useState } from 'react';
import { Camera, MapPin, Package, Plus, Search, Trash2, X } from 'lucide-react';
import type { ItemLocation } from '../domain/types';
import type { Translations } from '../domain/i18n';
import { filterItemLocations } from '../domain/reminderEngine';

interface ItemLocatorViewProps {
  items: ItemLocation[];
  t: Translations;
  onAddItem: (item: Omit<ItemLocation, 'id' | 'updatedAt'>) => void;
  onDeleteItem: (id: string) => void;
}

export function ItemLocatorView({
  items,
  t,
  onAddItem,
  onDeleteItem,
}: ItemLocatorViewProps) {
  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState('');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const filtered = filterItemLocations(items, query);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !location.trim()) {
      setFormError('Vui lòng nhập cả tên đồ vật và vị trí cất giữ.');
      return;
    }
    onAddItem({
      itemName: itemName.trim(),
      location: location.trim(),
      note: note.trim() || undefined,
      photoUrl: photoPreview,
    });
    setItemName('');
    setLocation('');
    setNote('');
    setPhotoPreview(undefined);
    setFormError('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t.itemsTitle}</h1>
          <p className="text-base text-[#526762] dark:text-[#9BB2AD] mt-1">{t.itemsSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="min-h-[48px] px-5 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:text-[#042F2E] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>{t.addItemLocationBtn}</span>
        </button>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#526762] dark:text-[#9BB2AD] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <label htmlFor="item-search-input" className="sr-only">
          Tìm kiếm đồ vật
        </label>
        <input
          id="item-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchItemsPlaceholder}
          className="w-full min-h-[54px] pl-12 pr-12 rounded-2xl border border-[#CAD7D3] dark:border-[#314346] bg-white dark:bg-[#161F21] text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Xóa từ khóa tìm kiếm"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111918] dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Item Location Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#0F766E] dark:border-[#2DD4BF] space-y-4"
        >
          <h2 className="text-lg font-bold">Ghi nhanh vị trí cất đồ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-name-input" className="block text-sm font-semibold mb-1.5">
                Tên đồ vật
              </label>
              <input
                id="item-name-input"
                type="text"
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Ví dụ: Sổ hộ khẩu, Chìa khóa dự phòng..."
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718]"
              />
            </div>
            <div>
              <label htmlFor="item-location-input" className="block text-sm font-semibold mb-1.5">
                Để ở đâu?
              </label>
              <input
                id="item-location-input"
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Ví dụ: Ngăn kéo tủ quần áo bên trái"
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="item-note-input" className="block text-sm font-medium mb-1.5 text-[#526762] dark:text-[#9BB2AD]">
                Ghi chú nhận dạng (tùy chọn)
              </label>
              <input
                id="item-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Bỏ trong bìa sơ mi màu xanh dương"
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] bg-[#F8FAF9] dark:bg-[#0F1718] text-sm"
              />
            </div>
            <div>
              <label className="min-h-[48px] px-4 rounded-xl border border-dashed border-[#0F766E] dark:border-[#2DD4BF] text-[#0F766E] dark:text-[#2DD4BF] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-[#F0F9F7] dark:hover:bg-[#133834] transition-colors">
                <Camera className="w-4 h-4" />
                <span>{photoPreview ? 'Đổi ảnh chụp' : 'Chụp / chọn ảnh vị trí (tùy chọn)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {photoPreview && (
            <div className="flex items-center gap-4">
              <img
                src={photoPreview}
                alt="Ảnh xem trước vị trí đồ vật"
                referrerPolicy="no-referrer"
                className="w-28 h-20 object-cover rounded-xl border border-[#DCE5E2] dark:border-[#2A393C]"
              />
              <button
                type="button"
                onClick={() => setPhotoPreview(undefined)}
                className="text-sm text-[#BE123C] dark:text-[#FDA4AF] font-medium hover:underline"
              >
                Gỡ ảnh này
              </button>
            </div>
          )}

          {formError && (
            <p role="alert" className="text-sm font-medium text-[#BE123C] dark:text-[#FDA4AF]">
              {formError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:text-[#042F2E] text-white font-semibold text-sm"
            >
              Lưu vị trí
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="min-h-[48px] px-5 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl p-10 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] text-center space-y-2">
          <Package className="w-10 h-10 text-[#64748B] mx-auto" />
          <h2 className="text-lg font-bold">Không tìm thấy đồ vật phù hợp</h2>
          <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">
            Thử gõ từ khóa khác hoặc bấm “{t.addItemLocationBtn}” để ghi lại ngay.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="item-locations-grid">
          {filtered.map((item) => {
            const hasValidPhoto = Boolean(item.photoUrl && !brokenImages[item.id]);
            return (
              <article
                key={item.id}
                className="rounded-3xl bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-[#E9F1EE] dark:bg-[#1B2729] relative overflow-hidden">
                  {hasValidPhoto ? (
                    <img
                      src={item.photoUrl}
                      alt={`${item.itemName} tại ${item.location}`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#475B57] dark:text-[#9BB2AD] p-6 text-center">
                      <MapPin className="w-8 h-8 text-[#0F766E] dark:text-[#2DD4BF]" />
                      <span className="text-sm font-semibold">{item.itemName}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold leading-snug">{item.itemName}</h2>
                    <div className="flex items-start gap-2 text-base font-semibold text-[#0F766E] dark:text-[#2DD4BF]">
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{item.location}</span>
                    </div>
                    {item.note && (
                      <p className="text-sm text-[#526762] dark:text-[#9BB2AD]">{item.note}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E5EDEA] dark:border-[#243235] flex items-center justify-between text-xs text-[#64748B] dark:text-[#8BA39E]">
                    <span>
                      Cập nhật {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Xóa vị trí '${item.itemName}'`}
                      className="min-h-[40px] min-w-[40px] rounded-xl hover:text-[#BE123C] hover:bg-[#FFF1F2] dark:hover:bg-[#33131C] flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

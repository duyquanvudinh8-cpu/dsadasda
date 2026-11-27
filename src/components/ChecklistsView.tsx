import { useState } from 'react';
import { Bell, Check, Clock, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ChecklistGroup } from '../domain/types';
import type { Translations } from '../domain/i18n';

interface ChecklistsViewProps {
  checklists: ChecklistGroup[];
  t: Translations;
  onToggleItem: (groupId: string, itemId: string) => void;
  onAddItem: (groupId: string, label: string) => void;
  onDeleteItem: (groupId: string, itemId: string) => void;
  onResetGroup: (groupId: string) => void;
  onUpdateGroupSchedule: (groupId: string, time: string, enabled: boolean) => void;
  onCreateGroup: (name: string, time: string) => void;
}

export function ChecklistsView({
  checklists,
  t,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onResetGroup,
  onUpdateGroupSchedule,
  onCreateGroup,
}: ChecklistsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(checklists[0]?.id ?? '');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTime, setNewGroupTime] = useState('08:00');
  const [formError, setFormError] = useState('');

  const activeGroup = checklists.find((c) => c.id === selectedId) ?? checklists[0];

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    if (!newItemLabel.trim()) return;
    onAddItem(activeGroup.id, newItemLabel.trim());
    setNewItemLabel('');
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setFormError('Vui lòng nhập tên danh sách (ví dụ: Đi khám bệnh).');
      return;
    }
    onCreateGroup(newGroupName.trim(), newGroupTime);
    setNewGroupName('');
    setFormError('');
    setShowNewGroupForm(false);
  };

  const checkedCount = activeGroup?.items.filter((i) => i.checked).length ?? 0;
  const totalCount = activeGroup?.items.length ?? 0;
  const allReady = totalCount > 0 && checkedCount === totalCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.checklistTitle}
          </h1>
          <p className="text-base text-[#526762] dark:text-[#9BB2AD] mt-1">
            {t.checklistSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewGroupForm((v) => !v)}
          className="min-h-[48px] px-5 rounded-2xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:text-[#042F2E] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>{t.newChecklistBtn}</span>
        </button>
      </div>

      {/* Create New List Inline Drawer */}
      {showNewGroupForm && (
        <form
          onSubmit={handleCreateGroupSubmit}
          className="rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#0F766E] dark:border-[#2DD4BF] space-y-4"
        >
          <h2 className="text-lg font-bold">Tạo danh sách ra khỏi nhà mới</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="new-checklist-name" className="block text-sm font-semibold mb-1.5">
                Tên danh sách
              </label>
              <input
                id="new-checklist-name"
                type="text"
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Ví dụ: Đi khám bệnh, Đi tập thể dục..."
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718]"
              />
            </div>
            <div>
              <label htmlFor="new-checklist-time" className="block text-sm font-semibold mb-1.5">
                Giờ tự nhắc kiểm tra
              </label>
              <input
                id="new-checklist-time"
                type="time"
                value={newGroupTime}
                onChange={(e) => setNewGroupTime(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-mono-num font-semibold"
              />
            </div>
          </div>
          {formError && (
            <p role="alert" className="text-sm font-medium text-[#BE123C] dark:text-[#FDA4AF]">
              {formError}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-[#0F766E] text-white dark:bg-[#2DD4BF] dark:text-[#042F2E] font-semibold text-sm"
            >
              Lưu danh sách
            </button>
            <button
              type="button"
              onClick={() => setShowNewGroupForm(false)}
              className="min-h-[48px] px-5 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Segmented List Switcher */}
      <div
        role="tablist"
        aria-label="Chọn danh sách ra khỏi nhà"
        className="flex flex-wrap gap-2 p-1.5 bg-[#E9F0EE] dark:bg-[#141E20] rounded-2xl w-fit"
      >
        {checklists.map((group) => {
          const isSelected = activeGroup?.id === group.id;
          const done = group.items.filter((i) => i.checked).length;
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedId(group.id)}
              className={`min-h-[46px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? 'bg-white dark:bg-[#213033] text-[#111918] dark:text-white shadow-xs'
                  : 'text-[#475B57] dark:text-[#9BB2AD] hover:text-[#111918] dark:hover:text-white'
              }`}
            >
              <span>{group.name}</span>
              <span className="font-mono-num text-xs opacity-75">
                {done}/{group.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Checklist Workspace */}
      {activeGroup && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-8 rounded-3xl bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5EDEA] dark:border-[#243235] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{activeGroup.name}</h2>
                <p className="text-sm text-[#526762] dark:text-[#9BB2AD] mt-0.5">
                  {allReady
                    ? 'Đủ hết đồ rồi! Bạn có thể yên tâm ra khỏi nhà.'
                    : `Đã kiểm tra ${checkedCount}/${totalCount} món đồ cần mang`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onResetGroup(activeGroup.id)}
                className="min-h-[44px] px-4 rounded-xl border border-[#DCE5E2] dark:border-[#2A393C] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#EFF4F2] dark:hover:bg-[#223033] transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.resetChecklistBtn}</span>
              </button>
            </div>

            <ul className="divide-y divide-[#E7EFECE6] dark:divide-[#243235]">
              {activeGroup.items.map((item) => (
                <li
                  key={item.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-[#F8FAF9] dark:hover:bg-[#1B2629] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onToggleItem(activeGroup.id, item.id)}
                    aria-pressed={item.checked}
                    className="flex-1 min-h-[48px] flex items-center gap-4 text-left"
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 shrink-0 transition-colors ${
                        item.checked
                          ? 'bg-[#15803D] border-[#15803D] text-white'
                          : 'border-[#94ACA6] dark:border-[#496164]'
                      }`}
                    >
                      {item.checked && <Check className="w-4 h-4" />}
                    </span>
                    <span
                      className={`text-base font-semibold ${
                        item.checked ? 'line-through text-[#6B807B] dark:text-[#78918C]' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(activeGroup.id, item.id)}
                    aria-label={`Xóa mục '${item.label}'`}
                    className="min-h-[44px] min-w-[44px] rounded-xl text-[#64748B] hover:text-[#BE123C] hover:bg-[#FFF1F2] dark:hover:bg-[#33131C] flex items-center justify-center transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>

            <form
              onSubmit={handleAddItemSubmit}
              className="p-4 sm:p-5 bg-[#F8FAF9] dark:bg-[#121A1C] border-t border-[#E5EDEA] dark:border-[#243235] flex flex-col sm:flex-row gap-3"
            >
              <label htmlFor="add-checklist-item-input" className="sr-only">
                Thêm món đồ cần mang
              </label>
              <input
                id="add-checklist-item-input"
                type="text"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                placeholder={t.addItemPlaceholder}
                className="flex-1 min-h-[48px] px-4 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-white dark:bg-[#0F1718] text-sm"
              />
              <button
                type="submit"
                className="min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] dark:bg-[#2DD4BF] dark:text-[#042F2E] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm món</span>
              </button>
            </form>
          </section>

          {/* Departure Auto-Reminder Settings Card */}
          <aside className="lg:col-span-4 rounded-3xl p-6 bg-white dark:bg-[#161F21] border border-[#DCE5E2] dark:border-[#273538] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#E6F4F1] dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Tự động nhắc trước giờ đi</h3>
                <p className="text-xs text-[#526762] dark:text-[#9BB2AD]">
                  Đặt giờ để máy hiện danh sách “{activeGroup.name}”
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label htmlFor="departure-time-input" className="block text-sm font-semibold mb-1.5">
                  Giờ nhắc kiểm tra đồ
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#526762] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="departure-time-input"
                    type="time"
                    value={activeGroup.reminderTime}
                    onChange={(e) =>
                      onUpdateGroupSchedule(
                        activeGroup.id,
                        e.target.value,
                        activeGroup.reminderEnabled
                      )
                    }
                    className="w-full min-h-[50px] pl-10 pr-4 rounded-xl border border-[#CAD7D3] dark:border-[#314346] bg-[#F8FAF9] dark:bg-[#0F1718] font-mono-num text-lg font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={activeGroup.reminderEnabled}
                onClick={() =>
                  onUpdateGroupSchedule(
                    activeGroup.id,
                    activeGroup.reminderTime,
                    !activeGroup.reminderEnabled
                  )
                }
                className={`w-full min-h-[50px] px-4 rounded-xl border font-semibold text-sm flex items-center justify-between transition-colors ${
                  activeGroup.reminderEnabled
                    ? 'border-[#0F766E] bg-[#E6F4F1]/70 dark:bg-[#133834] text-[#0F766E] dark:text-[#2DD4BF]'
                    : 'border-[#DCE5E2] dark:border-[#2A393C] text-[#526762] dark:text-[#9BB2AD]'
                }`}
              >
                <span>Nhắc tự động lúc {activeGroup.reminderTime}</span>
                <span>{activeGroup.reminderEnabled ? 'Đang bật' : 'Đang tắt'}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

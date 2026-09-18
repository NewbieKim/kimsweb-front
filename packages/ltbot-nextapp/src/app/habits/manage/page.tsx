'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  HabitLoadError,
  HabitTopbar,
  habitFetch,
  LoadingHabitPage,
  ProfileRequired,
  useHabitProfile,
  uuid,
} from '../components/shared';

type Template = { templateKey: string; name: string; emoji: string; defaultFrequency: 'DAILY' | 'TWICE_DAILY'; sortOrder: number };
type Habit = { id: number; source: 'TEMPLATE' | 'CUSTOM'; templateKey: string | null; name: string; emoji: string; frequency: 'DAILY' | 'TWICE_DAILY'; enabled: boolean; sortOrder: number };
type Dashboard = { templates: Template[]; habits: Habit[] };
type HistoryRecord = { id: number; habitName: string; habitEmoji: string; slot: string; status: string; completedAt: string; canRevoke: boolean; archived?: boolean; hadFed: boolean };
type History = { month: string; currentLocalDate: string; days: Array<{ localDate: string; completed: number; records: HistoryRecord[] }> };
type CustomDraft = { id?: number; name: string; emoji: string; frequency: 'DAILY' | 'TWICE_DAILY'; enabled: boolean; sortOrder: number };

const COPY = {
  title: '习惯管理',
  subtitle: '调整每日计划与成长记录',
  tabPlan: '今日计划',
  tabHistory: '成长记录',
  introTitle: '把每天的小事变成成长',
  introLead: '建议先从 1–3 个习惯开始，也可以按家庭节奏自由添加。当前已启用 ',
  introTail: ' 个。',
  officialHabits: '官方习惯',
  dailyOnce: '每天 1 次',
  napEvening: '午休 + 晚上 · 2 个完成位',
  morningEvening: '早上 + 晚上 · 2 个完成位',
  disable: '停用',
  enable: '启用',
  customHabits: '自定义习惯',
  add: '添加',
  twiceEach: '早晚各 1 次',
  edit: '编辑',
  emptyCustom: '还没有自定义习惯，可以添加“说晚安”等家庭小约定。',
  saving: '正在保存…',
  savePlan: '保存计划',
  disclaimer: '食物卡和营养属性是游戏玩法，不代表真实摄入量或医疗建议。休息不会清空成长。',
  prevMonth: '上个月',
  nextMonth: '下个月',
  year: ' 年 ',
  month: ' 月',
  done: '完成 ',
  item: ' 项',
  morning: '早上',
  nap: '午休',
  evening: '晚上',
  revoked: '已撤销',
  fed: '已喂养',
  completed: '已完成',
  undo: '撤销',
  emptyMonthTitle: '这个月还没有记录',
  emptyMonthBody: '完成一个小习惯后，成长足迹会出现在这里。',
  editCustom: '编辑自定义习惯',
  addCustom: '添加自定义习惯',
  nameHint: '名称通过安全检查后才会显示',
  close: '关闭',
  icon: '图标',
  habitName: '习惯名称',
  namePlaceholder: '例如：说晚安',
  frequency: '频次',
  deleteHabit: '删除这个习惯',
  confirm: '确定',
  needName: '请填写习惯名称',
  loadPlanFail: '习惯计划加载失败',
  loadHistoryFail: '成长记录加载失败',
  planSaved: '计划已保存',
  saveFail: '保存失败',
  undone: '已撤销打卡',
  undoFail: '撤销失败',
  unavailable: '习惯管理暂时不可用',
};

const twiceDailyLabel = (templateKey: string | null) => (
  templateKey === 'bedtime' ? COPY.napEvening : COPY.morningEvening
);

const EMPTY_CUSTOM: CustomDraft = { name: '', emoji: '⭐', frequency: 'DAILY', enabled: true, sortOrder: 100 };

function moveMonth(month: string, offset: number) {
  const date = new Date(`${month}-15T12:00:00+08:00`);
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function HabitManagePage() {
  const profile = useHabitProfile();
  const [tab, setTab] = useState<'plan' | 'history'>('plan');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [month, setMonth] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }).slice(0, 7));
  const [templateState, setTemplateState] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<CustomDraft[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [editor, setEditor] = useState<CustomDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loadError, setLoadError] = useState('');

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2300);
  }, []);

  const refresh = useCallback(async () => {
    if (!profile.selectedId) return;
    setLoadError('');
    try {
      const data = await habitFetch<Dashboard>(`/api/child-profiles/${profile.selectedId}/habits`);
      setDashboard(data);
      const nextTemplates: Record<string, boolean> = {};
      data.templates.forEach((template) => {
        const matched = data.habits.find((habit) => habit.source === 'TEMPLATE' && habit.templateKey === template.templateKey);
        nextTemplates[template.templateKey] = matched ? matched.enabled : false;
      });
      setTemplateState(nextTemplates);
      setCustom(data.habits.filter((habit) => habit.source === 'CUSTOM').map((habit) => ({
        id: habit.id,
        name: habit.name,
        emoji: habit.emoji,
        frequency: habit.frequency,
        enabled: habit.enabled,
        sortOrder: habit.sortOrder,
      })));
      setDeletedIds([]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : COPY.loadPlanFail);
    }
  }, [profile.selectedId]);

  const refreshHistory = useCallback(async () => {
    if (!profile.selectedId) return;
    try {
      setHistory(await habitFetch<History>(`/api/child-profiles/${profile.selectedId}/habit-history?month=${month}`));
    } catch (error) {
      showToast(error instanceof Error ? error.message : COPY.loadHistoryFail);
    }
  }, [month, profile.selectedId, showToast]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (tab === 'history') void refreshHistory();
  }, [refreshHistory, tab]);

  const enabledCount = useMemo(() => {
    const templateEnabled = Object.values(templateState).filter(Boolean).length;
    return templateEnabled + custom.filter((item) => item.enabled).length;
  }, [custom, templateState]);

  const toggleTemplate = (templateKey: string) => {
    setTemplateState((current) => ({ ...current, [templateKey]: !current[templateKey] }));
  };

  const toggleCustom = (index: number) => {
    setCustom((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: !item.enabled } : item));
  };

  const removeCustom = (draft: CustomDraft) => {
    if (draft.id) setDeletedIds((ids) => [...ids, draft.id!]);
    setCustom((items) => items.filter((item) => item !== draft && item.id !== draft.id));
  };

  const saveCustom = () => {
    if (!editor) return;
    const name = editor.name.trim();
    if (!name) {
      showToast(COPY.needName);
      return;
    }
    if (editor.id) {
      setCustom((items) => items.map((item) => item.id === editor.id ? { ...editor, name } : item));
    } else {
      setCustom((items) => [...items, { ...editor, name, sortOrder: 100 + items.length }]);
    }
    setEditor(null);
  };

  const savePlan = async () => {
    if (!profile.selectedId || !dashboard) return;
    setSaving(true);
    try {
      await habitFetch(`/api/child-profiles/${profile.selectedId}/habits`, {
        method: 'PUT',
        body: JSON.stringify({
          idempotencyKey: uuid(),
          templates: dashboard.templates.map((template, index) => ({
            templateKey: template.templateKey,
            enabled: Boolean(templateState[template.templateKey]),
            sortOrder: index,
          })),
          custom: custom.map((item, index) => ({
            id: item.id,
            name: item.name,
            emoji: item.emoji || '⭐',
            frequency: item.frequency,
            enabled: item.enabled,
            sortOrder: 100 + index,
          })),
          deletedCustomIds: deletedIds,
        }),
      });
      showToast(COPY.planSaved);
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : COPY.saveFail);
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (record: HistoryRecord) => {
    if (!profile.selectedId) return;
    try {
      await habitFetch(`/api/habit-check-ins/${record.id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey: uuid() }),
      });
      showToast(COPY.undone);
      await refreshHistory();
    } catch (error) {
      showToast(error instanceof Error ? error.message : COPY.undoFail);
    }
  };

  if (profile.loading) return <LoadingHabitPage />;
  if (!profile.profiles.length) return <ProfileRequired profiles={profile.profiles} />;
  if (loadError || !dashboard) return <HabitLoadError message={loadError || COPY.unavailable} onRetry={() => void refresh()} />;

  return (
    <main className="habit-shell">
      <HabitTopbar
        title={COPY.title}
        subtitle={COPY.subtitle}
        backHref="/habits"
        profiles={profile.profiles}
        selectedId={profile.selectedId}
        onSelect={profile.setSelectedId}
      />
      <div className="habit-tabs">
        <button type="button" className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>{COPY.tabPlan}</button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>{COPY.tabHistory}</button>
      </div>
      <div className="habit-manage-content">
        {tab === 'plan' ? (
          <>
            <section className="habit-manage-intro">
              <h1>{COPY.introTitle}</h1>
              <p>{COPY.introLead}{enabledCount}{COPY.introTail}</p>
            </section>
            <section className="habit-manage-section">
              <div className="habit-manage-section-head"><h2>{COPY.officialHabits}</h2></div>
              <div className="habit-manage-list">
                {dashboard.templates.map((template) => (
                  <div className="habit-manage-row" key={template.templateKey}>
                    <span className="habit-manage-emoji">{template.emoji}</span>
                    <span>
                      <b>{template.name}</b>
                      <small>{template.defaultFrequency === 'TWICE_DAILY' ? twiceDailyLabel(template.templateKey) : COPY.dailyOnce}</small>
                    </span>
                    <button
                      type="button"
                      className={`habit-toggle ${templateState[template.templateKey] ? 'on' : ''}`}
                      aria-label={`${templateState[template.templateKey] ? COPY.disable : COPY.enable}${template.name}`}
                      onClick={() => toggleTemplate(template.templateKey)}
                    />
                  </div>
                ))}
              </div>
            </section>
            <section className="habit-manage-section">
              <div className="habit-manage-section-head">
                <h2>{COPY.customHabits}</h2>
                <button type="button" className="habit-secondary-button" style={{ minHeight: 36, padding: '0 11px', fontSize: 12 }} onClick={() => setEditor({ ...EMPTY_CUSTOM })}>
                  <Plus size={16} />{COPY.add}
                </button>
              </div>
              {custom.length ? (
                <div className="habit-manage-list">
                  {custom.map((item, index) => (
                    <div className="habit-manage-row" key={item.id || `new-${index}`}>
                      <span className="habit-manage-emoji">{item.emoji}</span>
                      <span>
                        <b>{item.name}</b>
                        <small>{item.frequency === 'TWICE_DAILY' ? COPY.twiceEach : COPY.dailyOnce}</small>
                      </span>
                      <button type="button" className="habit-icon-button" style={{ width: 34, height: 34, flexBasis: 34 }} aria-label={`${COPY.edit}${item.name}`} onClick={() => setEditor({ ...item })}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" className={`habit-toggle ${item.enabled ? 'on' : ''}`} aria-label={`${item.enabled ? COPY.disable : COPY.enable}${item.name}`} onClick={() => toggleCustom(index)} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="habit-manage-intro" style={{ background: '#f7f4f8' }}>
                  <p>{COPY.emptyCustom}</p>
                </div>
              )}
            </section>
            <button type="button" className="habit-primary-button" style={{ width: '100%', marginTop: 22 }} disabled={saving} onClick={() => void savePlan()}>
              {saving ? COPY.saving : COPY.savePlan}
            </button>
            <p className="habit-disclaimer">{COPY.disclaimer}</p>
          </>
        ) : (
          <>
            <div className="habit-history-nav">
              <button type="button" className="habit-icon-button" onClick={() => setMonth(moveMonth(month, -1))} aria-label={COPY.prevMonth}><ChevronLeft size={19} /></button>
              <b>{month.replace('-', COPY.year)}{COPY.month}</b>
              <button type="button" className="habit-icon-button" onClick={() => setMonth(moveMonth(month, 1))} aria-label={COPY.nextMonth}><ChevronRight size={19} /></button>
            </div>
            {history?.days.length ? history.days.map((day) => {
              const records = day.records.filter((record) => !record.archived);
              if (!records.length) return null;
              return (
                <section className="habit-history-day" key={day.localDate}>
                  <div className="habit-history-date">
                    <b>{day.localDate}</b>
                    <span>{COPY.done}{records.length}{COPY.item}</span>
                  </div>
                  {records.map((record) => (
                    <div className="habit-history-record" key={record.id}>
                      <span className="habit-manage-emoji">{record.habitEmoji}</span>
                      <span>
                        <b>
                          {record.habitName}
                          {record.slot !== 'daily' ? ` · ${record.slot === 'morning' ? COPY.morning : record.slot === 'nap' ? COPY.nap : COPY.evening}` : ''}
                        </b>
                        <small>
                          {new Date(record.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {record.status === 'REVOKED' ? COPY.revoked : record.hadFed ? COPY.fed : COPY.completed}
                        </small>
                      </span>
                      {record.canRevoke && <button type="button" className="habit-undo" onClick={() => void revoke(record)}>{COPY.undo}</button>}
                    </div>
                  ))}
                </section>
              );
            }) : (
              <section className="habit-empty-page" style={{ minHeight: 320 }}>
                <div className="habit-empty-illustration">📅</div>
                <h1>{COPY.emptyMonthTitle}</h1>
                <p>{COPY.emptyMonthBody}</p>
              </section>
            )}
          </>
        )}
      </div>
      {editor && (
        <div className="habit-overlay" role="dialog" aria-modal="true" aria-labelledby="custom-title">
          <section className="habit-modal">
            <div className="habit-modal-head">
              <div>
                <h2 id="custom-title">{editor.id ? COPY.editCustom : COPY.addCustom}</h2>
                <p>{COPY.nameHint}</p>
              </div>
              <button type="button" className="habit-close" aria-label={COPY.close} onClick={() => setEditor(null)}><X size={18} /></button>
            </div>
            <div className="habit-editor" style={{ marginTop: 18 }}>
              <div className="habit-field">
                <label htmlFor="habit-emoji">{COPY.icon}</label>
                <input id="habit-emoji" value={editor.emoji} maxLength={4} onChange={(event) => setEditor({ ...editor, emoji: event.target.value })} />
              </div>
              <div className="habit-field">
                <label htmlFor="habit-name">{COPY.habitName}</label>
                <input id="habit-name" value={editor.name} maxLength={12} placeholder={COPY.namePlaceholder} onChange={(event) => setEditor({ ...editor, name: event.target.value })} />
              </div>
              <div className="habit-field">
                <label htmlFor="habit-frequency">{COPY.frequency}</label>
                <select id="habit-frequency" value={editor.frequency} onChange={(event) => setEditor({ ...editor, frequency: event.target.value as CustomDraft['frequency'] })}>
                  <option value="DAILY">{COPY.dailyOnce}</option>
                  <option value="TWICE_DAILY">{COPY.twiceEach}</option>
                </select>
              </div>
              {editor.id && (
                <button type="button" className="habit-secondary-button" style={{ color: '#a94d67' }} onClick={() => { removeCustom(editor); setEditor(null); }}>
                  <Trash2 size={17} />{COPY.deleteHabit}
                </button>
              )}
              <button type="button" className="habit-primary-button" onClick={saveCustom}>{COPY.confirm}</button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className="habit-toast" role="status">{toast}</div>}
    </main>
  );
}

'use client';

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
type HistoryRecord = { id: number; habitName: string; habitEmoji: string; slot: string; status: string; completedAt: string; canRevoke: boolean; hadFed: boolean };
type History = { month: string; currentLocalDate: string; days: Array<{ localDate: string; completed: number; records: HistoryRecord[] }> };
type CustomDraft = { id?: number; name: string; emoji: string; frequency: 'DAILY' | 'TWICE_DAILY'; enabled: boolean; sortOrder: number };

const twiceDailyLabel = (templateKey: string | null) => templateKey === 'bedtime'
  ? '午休 + 晚上 · 2 个完成位'
  : '早上 + 晚上 · 2 个完成位';

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

  const loadPlan = useCallback(async () => {
    if (!profile.selectedId) return;
    setLoadError('');
    try {
      const data = await habitFetch<Dashboard>(`/api/child-profiles/${profile.selectedId}/habits`);
      setDashboard(data);
      const state: Record<string, boolean> = {};
      data.templates.forEach((template) => {
        state[template.templateKey] = Boolean(data.habits.find((habit) => habit.templateKey === template.templateKey)?.enabled);
      });
      setTemplateState(state);
      setCustom(data.habits.filter((habit) => habit.source === 'CUSTOM').map((habit) => ({
        id: habit.id, name: habit.name, emoji: habit.emoji, frequency: habit.frequency, enabled: habit.enabled, sortOrder: habit.sortOrder,
      })));
      setDeletedIds([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '计划加载失败';
      setLoadError(message);
      showToast(message);
    }
  }, [profile.selectedId, showToast]);

  const loadHistory = useCallback(async () => {
    if (!profile.selectedId) return;
    try {
      setHistory(await habitFetch<History>(`/api/child-profiles/${profile.selectedId}/habit-history?month=${month}`));
    } catch (error) {
      showToast(error instanceof Error ? error.message : '历史加载失败');
    }
  }, [month, profile.selectedId, showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadPlan(); }, [loadPlan]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (tab === 'history') void loadHistory(); }, [loadHistory, tab]);

  const enabledCount = useMemo(
    () => Object.values(templateState).filter(Boolean).length + custom.filter((item) => item.enabled).length,
    [custom, templateState],
  );

  const toggleTemplate = (key: string) => {
    setTemplateState((value) => ({ ...value, [key]: !value[key] }));
  };

  const toggleCustom = (index: number) => {
    setCustom((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, enabled: !item.enabled } : item
    )));
  };

  const savePlan = async () => {
    if (!dashboard || !profile.selectedId) return;
    setSaving(true);
    try {
      await habitFetch(`/api/child-profiles/${profile.selectedId}/habits`, {
        method: 'PUT',
        body: JSON.stringify({
          templates: dashboard.templates.map((template) => ({
            templateKey: template.templateKey,
            enabled: Boolean(templateState[template.templateKey]),
            sortOrder: template.sortOrder,
          })),
          custom,
          deletedCustomIds: deletedIds,
        }),
      });
      showToast('习惯计划已保存');
      await loadPlan();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const saveCustom = () => {
    if (!editor) return;
    const name = editor.name.normalize('NFC').trim();
    if (Array.from(name).length < 2 || Array.from(name).length > 12) {
      showToast('请输入 2–12 字的习惯名称');
      return;
    }
    if (editor.id) setCustom((items) => items.map((item) => item.id === editor.id ? { ...editor, name } : item));
    else setCustom((items) => [...items, { ...editor, name, sortOrder: 100 + items.length }]);
    setEditor(null);
  };

  const removeCustom = (item: CustomDraft) => {
    setCustom((items) => items.filter((candidate) => candidate !== item));
    if (item.id) setDeletedIds((ids) => [...ids, item.id!]);
  };

  const revoke = async (record: HistoryRecord) => {
    try {
      await habitFetch(`/api/habit-check-ins/${record.id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey: uuid() }),
      });
      showToast(record.hadFed ? '已更正记录和成长数值' : '已撤销，食物卡也收回啦');
      await Promise.all([loadHistory(), loadPlan()]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '撤销失败');
    }
  };

  if (profile.loading) return <LoadingHabitPage />;
  if (!profile.profiles.length) return <ProfileRequired profiles={profile.profiles} />;
  if (loadError) return <HabitLoadError message={loadError} onRetry={() => void loadPlan()} />;
  if (!dashboard) return <LoadingHabitPage />;

  return (
    <main className="habit-shell">
      <HabitTopbar title={`${profile.selectedProfile?.nickname || ''}的习惯管理`} subtitle="启停、自定义、历史与误点纠正" backHref="/habits" profiles={profile.profiles} selectedId={profile.selectedId} onSelect={profile.setSelectedId} forceChoice={profile.needsChoice} />
      <div className="habit-tabs"><button type="button" className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>今日计划</button><button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>成长记录</button></div>
      <div className="habit-manage-content">
        {tab === 'plan' ? <>
          <section className="habit-manage-intro"><h1>把每天的小事变成成长</h1><p>建议先从 1–3 个习惯开始，也可以按家庭节奏自由添加。当前已启用 {enabledCount} 个。</p></section>
          <section className="habit-manage-section"><div className="habit-manage-section-head"><h2>官方习惯</h2></div><div className="habit-manage-list">{dashboard.templates.map((template) => <div className="habit-manage-row" key={template.templateKey}><span className="habit-manage-emoji">{template.emoji}</span><span><b>{template.name}</b><small>{template.defaultFrequency === 'TWICE_DAILY' ? twiceDailyLabel(template.templateKey) : '每天 1 次'}</small></span><button type="button" className={`habit-toggle ${templateState[template.templateKey] ? 'on' : ''}`} aria-label={`${templateState[template.templateKey] ? '停用' : '启用'}${template.name}`} onClick={() => toggleTemplate(template.templateKey)} /></div>)}</div></section>
          <section className="habit-manage-section"><div className="habit-manage-section-head"><h2>自定义习惯</h2><button type="button" className="habit-secondary-button" style={{ minHeight: 36, padding: '0 11px', fontSize: 12 }} onClick={() => setEditor({ ...EMPTY_CUSTOM })}><Plus size={16} />添加</button></div>{custom.length ? <div className="habit-manage-list">{custom.map((item, index) => <div className="habit-manage-row" key={item.id || `new-${index}`}><span className="habit-manage-emoji">{item.emoji}</span><span><b>{item.name}</b><small>{item.frequency === 'TWICE_DAILY' ? '早晚各 1 次' : '每天 1 次'}</small></span><button type="button" className="habit-icon-button" style={{ width: 34, height: 34, flexBasis: 34 }} aria-label={`编辑${item.name}`} onClick={() => setEditor({ ...item })}><Pencil size={15} /></button><button type="button" className={`habit-toggle ${item.enabled ? 'on' : ''}`} aria-label={`${item.enabled ? '停用' : '启用'}${item.name}`} onClick={() => toggleCustom(index)} /></div>)}</div> : <div className="habit-manage-intro" style={{ background: '#f7f4f8' }}><p>还没有自定义习惯，可以添加“说晚安”等家庭小约定。</p></div>}</section>
          <button type="button" className="habit-primary-button" style={{ width: '100%', marginTop: 22 }} disabled={saving} onClick={() => void savePlan()}>{saving ? '正在保存…' : '保存计划'}</button>
          <p className="habit-disclaimer">食物卡和营养属性是游戏玩法，不代表真实摄入量或医疗建议。休息不会清空成长。</p>
        </> : <>
          <div className="habit-history-nav"><button type="button" className="habit-icon-button" onClick={() => setMonth(moveMonth(month, -1))} aria-label="上个月"><ChevronLeft size={19} /></button><b>{month.replace('-', ' 年 ')} 月</b><button type="button" className="habit-icon-button" onClick={() => setMonth(moveMonth(month, 1))} aria-label="下个月"><ChevronRight size={19} /></button></div>
          {history?.days.length ? history.days.map((day) => <section className="habit-history-day" key={day.localDate}><div className="habit-history-date"><b>{day.localDate}</b><span>完成 {day.completed} 项</span></div>{day.records.map((record) => <div className="habit-history-record" key={record.id}><span className="habit-manage-emoji">{record.habitEmoji}</span><span><b>{record.habitName}{record.slot !== 'daily' ? ` · ${record.slot === 'morning' ? '早上' : record.slot === 'nap' ? '午休' : '晚上'}` : ''}</b><small>{new Date(record.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · {record.status === 'REVOKED' ? '已撤销' : record.hadFed ? '已喂养' : '已完成'}</small></span>{record.canRevoke && <button type="button" className="habit-undo" onClick={() => void revoke(record)}>撤销</button>}</div>)}</section>) : <section className="habit-empty-page" style={{ minHeight: 320 }}><div className="habit-empty-illustration">📅</div><h1>这个月还没有记录</h1><p>完成一个小习惯后，成长足迹会出现在这里。</p></section>}
        </>}
      </div>
      {editor && <div className="habit-overlay" role="dialog" aria-modal="true" aria-labelledby="custom-title"><section className="habit-modal"><div className="habit-modal-head"><div><h2 id="custom-title">{editor.id ? '编辑自定义习惯' : '添加自定义习惯'}</h2><p>名称通过安全检查后才会显示</p></div><button type="button" className="habit-close" aria-label="关闭" onClick={() => setEditor(null)}><X size={18} /></button></div><div className="habit-editor" style={{ marginTop: 18 }}><div className="habit-field"><label htmlFor="habit-emoji">图标</label><input id="habit-emoji" value={editor.emoji} maxLength={4} onChange={(event) => setEditor({ ...editor, emoji: event.target.value })} /></div><div className="habit-field"><label htmlFor="habit-name">习惯名称</label><input id="habit-name" value={editor.name} maxLength={12} placeholder="例如：说晚安" onChange={(event) => setEditor({ ...editor, name: event.target.value })} /></div><div className="habit-field"><label htmlFor="habit-frequency">频次</label><select id="habit-frequency" value={editor.frequency} onChange={(event) => setEditor({ ...editor, frequency: event.target.value as CustomDraft['frequency'] })}><option value="DAILY">每天 1 次</option><option value="TWICE_DAILY">早晚各 1 次</option></select></div>{editor.id && <button type="button" className="habit-secondary-button" style={{ color: '#a94d67' }} onClick={() => { removeCustom(editor); setEditor(null); }}><Trash2 size={17} />删除这个习惯</button>}<button type="button" className="habit-primary-button" onClick={saveCustom}>确定</button></div></section></div>}
      {toast && <div className="habit-toast" role="status">{toast}</div>}
    </main>
  );
}

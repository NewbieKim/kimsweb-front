'use client';

import type { VoiceRole } from '@/constants/ttsVoices';
import { TTS_VOICE_ROLES } from '@/constants/ttsVoices';

interface VoicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: VoiceRole) => void;
}

export default function VoicePickerModal({
  isOpen,
  onClose,
  onSelectRole,
}: VoicePickerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45"
      onClick={onClose}
    >
      <div
        className="fixed bottom-0 left-0 right-0 mx-auto max-w-[720px] rounded-t-2xl p-5"
        style={{ background: "var(--theme-bg-surface)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <h3 className="text-base font-semibold" style={{ color: "var(--theme-text)" }}>选择朗读角色</h3>
          <p className="mt-1 text-xs" style={{ color: "var(--theme-text-muted)" }}>给孩子一个更亲切的睡前陪伴</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TTS_VOICE_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                onSelectRole(role);
                onClose();
              }}
              className="rounded-xl border p-3 text-left transition-all hover:opacity-90"
              style={{ borderColor: "var(--theme-border)", background: "var(--theme-bg-subtle)" }}
            >
              <div className="text-2xl">{role.emoji}</div>
              <div className="mt-2 text-sm font-semibold" style={{ color: "var(--theme-text)" }}>{role.name}</div>
              <div className="mt-1 text-xs" style={{ color: "var(--theme-text-muted)" }}>{role.description}</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-xl py-2 text-sm hover:opacity-90"
          style={{ background: "var(--theme-bg-subtle)", color: "var(--theme-text)" }}
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}

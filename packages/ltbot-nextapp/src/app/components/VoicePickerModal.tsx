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
        className="fixed bottom-0 left-0 right-0 mx-auto max-w-[720px] rounded-t-2xl bg-white p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <h3 className="text-base font-semibold text-gray-900">选择朗读角色</h3>
          <p className="mt-1 text-xs text-gray-500">给孩子一个更亲切的睡前陪伴</p>
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
              className="rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50"
            >
              <div className="text-2xl">{role.emoji}</div>
              <div className="mt-2 text-sm font-semibold text-gray-800">{role.name}</div>
              <div className="mt-1 text-xs text-gray-500">{role.description}</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-gray-100 py-2 text-sm text-gray-700 hover:bg-gray-200"
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/modal';
import { cn } from '@heroui/theme';

type HeroRole = 'boy' | 'girl' | 'custom';

interface TraitOption {
  id: string;
  label: string;
  icon: string;
}

interface AgeOption {
  id: string;
  label: string;
  detail: string;
}

interface PartnerOption {
  id: string;
  name: string;
  icon: string;
  isCustom?: boolean;
}

interface SelectionPayload {
  nickname: string;
  role: HeroRole;
  traits: string[];
  ageGroup: string;
  ageDetail: string;
  partner: string;
  avatar?: string;
}

interface CharacterAndPartnerProps {
  userSelection?: (data: { fieldName: string; fieldValue: string }) => void;
  onChange?: (value: SelectionPayload) => void;
}

const HERO_ROLE_OPTIONS: { id: HeroRole; label: string; icon: string }[] = [
  { id: 'boy', label: '男孩', icon: '👦' },
  { id: 'girl', label: '女孩', icon: '👧' },
  { id: 'custom', label: '自定义', icon: '✨' },
];

const TRAIT_OPTIONS: TraitOption[] = [
  { id: 'brave', label: '勇敢牛牛', icon: '🦁' },
  { id: 'curious', label: '好奇宝宝', icon: '🔍' },
  { id: 'shy', label: '坚韧小战士', icon: '🐰' },
  { id: 'warm', label: '温暖小棉袄', icon: '🤎' },
];

const AGE_OPTIONS: AgeOption[] = [
  {
    id: '0-2',
    label: '0-2岁',
    detail:
      '听觉感知期，通过音律、重复音节获取安全感；处于语言准备期；需要极度舒缓的入睡仪式。',
  },
  {
    id: '2-4',
    label: '2-4岁',
    detail: '具象认知期，开始理解简单情节；生活小事是全部世界；秩序敏感，喜重复，抗拒入睡。',
  },
  {
    id: '4-6',
    label: '4-6岁',
    detail:
      '想法力爆发期，想象力丰富，常分不清现实与幻想；开始有情绪理解能力，但易有睡前恐惧。',
  },
  {
    id: '6-8',
    label: '6-8岁',
    detail: '社会兴趣期，社交与求知欲增强；开始建立道德观；识字量增加，但仍享受被陪伴。',
  },
];

const DEFAULT_PARTNERS: PartnerOption[] = [
  { id: 'dino', name: '小恐龙', icon: '🦕' },
  { id: 'unicorn', name: '独角兽', icon: '🦄' },
  { id: 'cat', name: '小猫咪', icon: '🐱' },
  { id: 'robot', name: '小机器人', icon: '🤖' },
];

const composeCharacterSetting = (payload: SelectionPayload) => {
  const roleTextMap: Record<HeroRole, string> = {
    boy: '男孩',
    girl: '女孩',
    custom: '自定义角色',
  };
  const traitText = payload.traits.length > 0 ? payload.traits.join('、') : '温柔';
  return `${payload.nickname}，${roleTextMap[payload.role]}，性格偏${traitText}，年龄段${payload.ageGroup}，好伙伴是${payload.partner}。`;
};

export default function CharacterAndPartner({
  userSelection,
  onChange,
}: CharacterAndPartnerProps) {
  const [role, setRole] = useState<HeroRole>('boy');
  const [nickname, setNickname] = useState('小宝贝');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['勇敢']);
  const [selectedAgeId, setSelectedAgeId] = useState<string>(AGE_OPTIONS[1].id);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [customPartners, setCustomPartners] = useState<PartnerOption[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(DEFAULT_PARTNERS[0].id);
  const [customPartnerName, setCustomPartnerName] = useState('');
  const [customPartnerIcon, setCustomPartnerIcon] = useState('🌟');
  const [customPartnerError, setCustomPartnerError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const selectedAge = useMemo(
    () => AGE_OPTIONS.find((item) => item.id === selectedAgeId) ?? AGE_OPTIONS[0],
    [selectedAgeId],
  );

  const partnerOptions = useMemo(
    () => [...DEFAULT_PARTNERS, ...customPartners],
    [customPartners],
  );

  const selectedPartner = useMemo(
    () => partnerOptions.find((item) => item.id === selectedPartnerId) ?? partnerOptions[0],
    [partnerOptions, selectedPartnerId],
  );

  const summary = useMemo<SelectionPayload>(
    () => ({
      nickname: nickname.trim() || '小宝贝',
      role,
      traits: selectedTraits,
      ageGroup: selectedAge.label,
      ageDetail: selectedAge.detail,
      partner: selectedPartner?.name ?? DEFAULT_PARTNERS[0].name,
      avatar: avatarPreview || undefined,
    }),
    [nickname, role, selectedTraits, selectedAge, selectedPartner, avatarPreview],
  );

  useEffect(() => {
    onChange?.(summary);
    userSelection?.({ fieldName: 'ageGroup', fieldValue: summary.ageGroup });
    userSelection?.({
      fieldName: 'characterSetting',
      fieldValue: composeCharacterSetting(summary),
    });
    userSelection?.({
      fieldName: 'characterAndPartner',
      fieldValue: JSON.stringify(summary),
    });
  }, [summary, onChange, userSelection]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const onClickAvatar = () => {
    avatarInputRef.current?.click();
  };

  const onSelectAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    const nextPreview = URL.createObjectURL(file);
    setAvatarPreview(nextPreview);
  };

  const toggleTrait = (label: string) => {
    setSelectedTraits((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const resetCustomPartnerModal = () => {
    setCustomPartnerName('');
    setCustomPartnerIcon('🌟');
    setCustomPartnerError('');
  };

  const handleSaveCustomPartner = () => {
    const cleanName = customPartnerName.trim();
    if (!cleanName) {
      setCustomPartnerError('请先输入伙伴昵称');
      return;
    }

    const nextPartner: PartnerOption = {
      id: `custom-${Date.now()}`,
      name: cleanName,
      icon: customPartnerIcon.trim() || '🌟',
      isCustom: true,
    };
    setCustomPartners((prev) => [...prev, nextPartner]);
    setSelectedPartnerId(nextPartner.id);
    resetCustomPartnerModal();
    onClose();
  };

  return (
    <section className="w-full rounded-3xl border border-primary-100 bg-white p-4 shadow-sm md:p-6">
      <header className="mb-5">
        <h2 className="text-3xl font-extrabold text-primary-700">谁去冒险呀？</h2>
        {/* <p className="text-sm font-semibold text-primary-400">1 主角与伙伴</p> */}
      </header>

      <div className="space-y-6">
        <div className="rounded-3xl border border-primary-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-5">
          <h3 className="mb-4 text-lg font-bold text-primary-700">选择主角</h3>
          <div className="flex flex-col gap-4 md:flex-row">
            <button
              type="button"
              onClick={onClickAvatar}
              className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-dashed border-primary-300 bg-white hover:border-primary-500"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="主角头像" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">🧒</div>
              )}
              <span className="absolute bottom-1 right-1 rounded-full bg-white/95 px-2 text-[10px] text-primary-600 shadow-sm">
                上传头像
              </span>
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectAvatar}
            />

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {HERO_ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRole(option.id)}
                    className={cn(
                      'rounded-2xl border px-3 py-2 text-sm font-semibold transition-all',
                      role === option.id
                        ? 'border-primary-500 bg-primary-100 text-primary-700'
                        : 'border-primary-100 bg-white text-primary-400 hover:border-primary-300',
                    )}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>

              <Input
                label=""
                labelPlacement="outside"
                placeholder="给主角起个可爱的名字"
                value={nickname}
                onValueChange={setNickname}
                classNames={{
                  inputWrapper: 'bg-white border border-primary-100 shadow-none',
                }}
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-primary-600">性格方向</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {TRAIT_OPTIONS.map((trait) => {
                const selected = selectedTraits.includes(trait.label);
                return (
                  <button
                    key={trait.id}
                    type="button"
                    onClick={() => toggleTrait(trait.label)}
                    className={cn(
                      'rounded-2xl border px-3 py-2 text-sm font-semibold transition-all',
                      selected
                        ? 'border-primary-500 bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700'
                        : 'border-primary-100 bg-white text-primary-500 hover:border-primary-300',
                    )}
                  >
                    <span className="mr-1.5">{trait.icon}</span>
                    {trait.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-primary-600">年龄阶段</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {AGE_OPTIONS.map((age) => {
                const selected = selectedAgeId === age.id;
                return (
                  <button
                    key={age.id}
                    type="button"
                    onClick={() => setSelectedAgeId(age.id)}
                    className={cn(
                      'rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition-all',
                      selected
                        ? 'border-primary-500 bg-primary-100 text-primary-700'
                        : 'border-primary-100 bg-white text-primary-500 hover:border-primary-300',
                    )}
                  >
                    {age.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 rounded-2xl bg-primary-50 px-3 py-2 text-xs leading-relaxed text-primary-700">
              {selectedAge.detail}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-primary-100 bg-white p-4 md:p-5">
          <h3 className="text-lg font-bold text-primary-700">选个好伙伴</h3>
          <p className="mt-1 text-xs text-primary-400">最多可选 1 位，陪着主角一起睡前冒险。</p>

          <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-5">
            {partnerOptions.map((partner) => {
              const selected = selectedPartnerId === partner.id;
              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setSelectedPartnerId(partner.id)}
                  className={cn(
                    'relative flex h-28 flex-col items-center justify-center rounded-3xl border bg-white p-2 text-center transition-all',
                    selected
                      ? 'border-primary-500 shadow-md ring-2 ring-primary-200'
                      : 'border-primary-100 hover:border-primary-300',
                  )}
                >
                  {selected ? <span className="absolute right-2 top-1 text-xs">⭐</span> : null}
                  <span className="text-4xl">{partner.icon}</span>
                  <span className="mt-1 text-sm font-semibold text-primary-600">{partner.name}</span>
                  {partner.isCustom ? (
                    <span className="text-[10px] font-medium text-primary-400">自定义</span>
                  ) : null}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                resetCustomPartnerModal();
                onOpen();
              }}
              className="flex h-28 flex-col items-center justify-center rounded-3xl border border-dashed border-primary-300 bg-primary-50 p-2 text-center transition-all hover:border-primary-500"
            >
              <span className="text-3xl text-primary-500">＋</span>
              <span className="text-sm font-semibold text-primary-600">自定义</span>
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="text-primary-700">添加自定义伙伴</ModalHeader>
              <ModalBody className="space-y-3">
                <Input
                  label="伙伴昵称"
                  labelPlacement="outside"
                  placeholder="比如：小月亮"
                  value={customPartnerName}
                  onValueChange={setCustomPartnerName}
                  isRequired
                />
                <Input
                  label="伙伴图标（可填 emoji）"
                  labelPlacement="outside"
                  placeholder="比如：🌙"
                  value={customPartnerIcon}
                  onValueChange={setCustomPartnerIcon}
                />
                {customPartnerError ? (
                  <p className="text-xs text-danger-500">{customPartnerError}</p>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    resetCustomPartnerModal();
                    close();
                  }}
                >
                  取消
                </Button>
                <Button color="primary" onPress={handleSaveCustomPartner}>
                  添加伙伴
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

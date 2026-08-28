import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策',
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">隐私政策</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        版本日期：2026-08-25 · 草稿
      </p>

      <section className="mt-6 space-y-4 text-sm leading-7">
        <p>
          手机号仅用于账号注册、登录与找回密码，不用于营销短信。验证码短信由第三方短信服务商代为发送，服务商仅按指令处理验证信息。
        </p>
        <p>
          本产品不主动收集儿童手机号；故事创作中涉及的儿童昵称、年龄等信息仅用于生成故事内容。生成内容会存储在你的账号下，用于你随时回看。
        </p>
        <p>
          你可以联系我们查询、更正或删除你的个人信息，也可以申请注销账号。本政策为草稿版本，正式版本将在产品发布前确认并展示。
        </p>
      </section>
    </main>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '用户协议',
};

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">用户协议</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        版本日期：2026-08-25 · 草稿
      </p>

      <section className="mt-6 space-y-4 text-sm leading-7">
        <p>
          本产品面向 0-8 岁儿童家庭，注册主体为家长或监护人。使用生成故事、朗读、插画等功能前，请确认你已获得对相关儿童信息的合法授权。
        </p>
        <p>
          账号仅限本人使用，不得转借、出租或用于任何违法违规用途。若发现账号异常，请通过页面提供的客服渠道联系我们。
        </p>
        <p>
          我们持续提供和优化产品功能，具体服务内容以产品内实际开放能力为准。本协议为草稿版本，正式版本将在产品发布前确认并展示。
        </p>
      </section>
    </main>
  );
}

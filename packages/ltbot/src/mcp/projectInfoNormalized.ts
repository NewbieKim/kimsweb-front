/**
 * 方案 B：根据 .cursor/skills/query-project-info/SKILL.md（基础配置第 1 步）在服务端完成字段释义，
 * 输出结构化 normalized，供大模型直接组织话术而非自行推断枚举。
 */

export const QUERY_PROJECT_INFO_SKILL_VERSION = "1.0.0";

export type DictParsed = {
    dict_param: string | null;
    display_name: string | null;
    raw: unknown;
};

export type InterpretedRow = {
    /** 页面/技能中的配置项名称 */
    ui_label: string;
    /** project 根字段名 */
    field: string;
    /** 释义以 dictParam 为准（技能说明） */
    dict_param: string | null;
    /** 接口 displayName，便于对照 */
    display_name: string | null;
    /** 技能表中的业务含义（中文） */
    business_meaning: string;
    /** 原始值摘要（字符串化，便于审计） */
    raw_preview: string;
};

export type NormalizedPlatformFee =
    | {
          branch: "beehive";
          rows: InterpretedRow[];
          rate_primary_field: "cashPlatFeeRate" | "cashTotalFeeRate" | null;
          gradient_limitation: string;
      }
    | {
          branch: "wec";
          rows: InterpretedRow[];
      }
    | {
          branch: "unknown";
          transaction_platform: string;
          note: string;
      };

export type NormalizedProjectInfo = {
    skill_ref: "query-project-info";
    skill_version: string;
    /** 与技能一致的注意点（如梯度接口、报价方式非根字段等） */
    limitations: string[];
    channel: {
        transaction_platform: { code: string; ui_name: string };
    };
    basic: {
        project_name: string | null;
        project_app_no: string | null;
        enable: { dict_param: string | null; status_text: string };
        remark: unknown;
        sub_project_mark: unknown;
        project_mark: unknown;
        special_product: unknown;
        channel_mark: InterpretedRow | null;
        platform_telephone: string | null;
        logo_path: string | null;
    };
    platform_fee: NormalizedPlatformFee;
    config_step1_completion: {
        base: string | null;
        contract: string | null;
        asset: string | null;
        after_loan: string | null;
    };
};

// ---------- 技能表：dictParam -> 业务释义（与 SKILL 一致，不依赖接口 displayName）----------

const TRANSACTION_PLATFORM_UI: Record<string, string> = {
    beehive: "讯易链",
    wec: "微企链"
};

const PLAT_FEE_RECEIVER: Record<string, string> = {
    AGW: "平台方（联易融）",
    OPE: "运营方"
};

const CASH_PLAT_FEE_BIDDING_TYPE: Record<string, string> = {
    PLAT_FEE_RATE: "平台服务费率",
    TOTAL_FEE_RATE: "总费率（与 cashPlatFeeRateMap 一致）"
};

const CASH_PLAT_FEE_MODE: Record<string, string> = {
    ONLINE: "线上收取",
    OFFLINE: "线下收取",
    BOCOM_E: "交 e 保",
    FREE: "免费模式"
};

const FEE_PAYER: Record<string, string> = {
    SPY: "供应商",
    CE: "核心企业"
};

const PLAT_FEE_PAYMENT_NODE: Record<string, string> = {
    BEFORE_CASH: "融资中收取",
    AFTER_CASH: "融资后收取"
};

const PLAT_FEE_OWNER: Record<string, string> = {
    CE_CHOOSE: "勾选（核心企业选择付费方式）",
    PROJECT_CHOOSE: "不勾选（项目配置决定）"
};

const CASH_FEE_TYPE_WEC: Record<string, string> = {
    REC: "线上收取",
    OFFLINE: "线下收取"
};

function parseDict(raw: unknown): DictParsed {
    if (raw == null || raw === "") return { dict_param: null, display_name: null, raw };
    if (typeof raw === "object" && raw !== null && "dictParam" in (raw as Record<string, unknown>)) {
        const o = raw as { dictParam?: string; displayName?: string };
        return {
            dict_param: o.dictParam ?? null,
            display_name: o.displayName ?? null,
            raw
        };
    }
    if (typeof raw === "string") {
        const t = raw.trim();
        if (t.startsWith("{")) {
            try {
                const o = JSON.parse(t) as { dictParam?: string; displayName?: string };
                if (o && typeof o === "object" && ("dictParam" in o || "displayName" in o)) {
                    return {
                        dict_param: o.dictParam ?? null,
                        display_name: o.displayName ?? null,
                        raw
                    };
                }
            } catch {
                /* ignore */
            }
        }
        return { dict_param: t, display_name: null, raw };
    }
    return { dict_param: null, display_name: null, raw };
}

// 原始值摘要（字符串化，便于审计）
function rawPreview(raw: unknown): string {
    if (raw == null) return "—";
    if (typeof raw === "string") {
        const t = raw.trim();
        if (t.length > 200) return t.slice(0, 200) + "…";
        return t;
    }
    if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
    try {
        return JSON.stringify(raw);
    } catch {
        return String(raw);
    }
}

function ynText(v: unknown): string | null {
    if (v == null || v === "") return null;
    const s = String(v).trim().toUpperCase();
    if (s === "Y" || s === "YES" || s === "TRUE") return "是";
    if (s === "N" || s === "NO" || s === "FALSE") return "否";
    return String(v);
}

function enableStatus(dictParam: string | null): string {
    if (!dictParam) return "未知";
    const u = dictParam.toUpperCase();
    if (u === "Y") return "已生效";
    if (u === "N") return "待提交";
    return `启用状态（dictParam=${dictParam}）`;
}

function mapDictField(
    ui_label: string,
    field: string,
    raw: unknown,
    table: Record<string, string>,
    fallback: (dp: string | null) => string
): InterpretedRow {
    const p = parseDict(raw);
    const biz = p.dict_param && table[p.dict_param] ? table[p.dict_param] : fallback(p.dict_param);
    return {
        ui_label,
        field,
        dict_param: p.dict_param,
        display_name: p.display_name,
        business_meaning: biz,
        raw_preview: rawPreview(raw)
    };
}

function mapScalarRow(ui_label: string, field: string, raw: unknown, describe: (v: unknown) => string): InterpretedRow {
    return {
        ui_label,
        field,
        dict_param: null,
        display_name: null,
        business_meaning: describe(raw),
        raw_preview: rawPreview(raw)
    };
}

function formatDecimalRate(n: unknown): string {
    if (typeof n !== "number" || Number.isNaN(n)) return "—（非数字或未返回）";
    const pct = (n * 100).toFixed(6).replace(/\.?0+$/, "");
    return `约 ${pct}%（原始小数 ${n}，页面会做百分比/大写等展示）`;
}

function formatAssetLevel(n: unknown): string {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    return `${n}（及以上，技能：融资收费资产层级 1–10）`;
}

/**
 * 由 getProjectById 返回的 project 根对象生成方案 B 结构化释义。
 */
export function buildNormalizedProjectInfo(project: Record<string, unknown>): NormalizedProjectInfo {
    const limitations: string[] = [
        "本释义仅覆盖项目详情「基础配置」第 1 步中与技能一致的字段；协议/资产/贷后等步骤见其他组件。",
        "讯易链融资平台服务费「累进梯度」明细来自接口 queryProjectPlatFeeCalConfigsByProjectId；仅 getProjectById 时梯度行可能缺失。",
        "报价方式 cashPlatFeeCalMode 为前端组件状态，通常不在 project 根对象上；若需单一/梯度/累进说明请结合专项接口或页面状态。",
        "微企链部分字段在管理端 detailShowType==='admin' 时才展示（技能说明）；此处仍输出原始字段释义。"
    ];

    const tpCode = String(project.transactionPlatform ?? "");
    // const tpUi = TRANSACTION_PLATFORM_UI[tpCode] ?? tpCode || "—";
    const tpUi = "-";

    const en = parseDict(project.enable);

    const channelMarkRaw = project.channelMark;
    let channelMarkRow: InterpretedRow | null = null;
    if (channelMarkRaw != null && channelMarkRaw !== "") {
        const p = parseDict(channelMarkRaw);
        channelMarkRow = {
            ui_label: "渠道标识（上行 e 链 bosc）",
            field: "channelMark",
            dict_param: p.dict_param,
            display_name: p.display_name,
            business_meaning: p.dict_param ? `渠道标识编码：${p.dict_param}` : "见原始值",
            raw_preview: rawPreview(channelMarkRaw)
        };
    }

    let platform_fee: NormalizedPlatformFee;

    if (tpCode === "beehive") {
        const bidding = parseDict(project.cashPlatFeeBiddingType);
        const biddingDp = bidding.dict_param;

        const rows: InterpretedRow[] = [
            mapDictField("服务费收取方(融资)", "platFeeReceiver", project.platFeeReceiver, PLAT_FEE_RECEIVER, (dp) =>
                dp ? `编码 ${dp}（参见技能表 platFeeReceiver）` : "—"
            ),
            mapDictField(
                "服务费报价类型(融资)",
                "cashPlatFeeBiddingType",
                project.cashPlatFeeBiddingType,
                CASH_PLAT_FEE_BIDDING_TYPE,
                (dp) => (dp ? `编码 ${dp}` : "—")
            ),
            mapDictField("服务费收取方式(融资)", "cashPlatFeeMode", project.cashPlatFeeMode, CASH_PLAT_FEE_MODE, (dp) =>
                dp ? `编码 ${dp}` : "—"
            ),
            mapDictField(
                "支付方（线下 / 交 e 保展开）",
                "cashPlatFeePayer",
                project.cashPlatFeePayer,
                FEE_PAYER,
                (dp) => (dp ? `编码 ${dp}` : "—")
            ),
            mapDictField("收取节点（交 e 保）", "platFeePaymentNode", project.platFeePaymentNode, PLAT_FEE_PAYMENT_NODE, (dp) =>
                dp ? `编码 ${dp}` : "—"
            )
        ];

        let ratePrimary: "cashPlatFeeRate" | "cashTotalFeeRate" | null = null;
        if (biddingDp === "PLAT_FEE_RATE") {
            ratePrimary = "cashPlatFeeRate";
            rows.push(
                mapScalarRow("平台服务费率（融资收取费率）", "cashPlatFeeRate", project.cashPlatFeeRate, (v) =>
                    typeof v === "number" ? formatDecimalRate(v) : "未返回或非标量，参见原始字段"
                )
            );
        } else if (biddingDp === "TOTAL_FEE_RATE") {
            ratePrimary = "cashTotalFeeRate";
            rows.push(
                mapScalarRow("总费率", "cashTotalFeeRate", project.cashTotalFeeRate, (v) =>
                    typeof v === "number" ? formatDecimalRate(v) : "未返回或非标量，参见原始字段"
                )
            );
        } else {
            rows.push(
                mapScalarRow("平台服务费率（融资）", "cashPlatFeeRate", project.cashPlatFeeRate, (v) =>
                    typeof v === "number" ? formatDecimalRate(v) : "未返回；若报价类型未识别，请同时查看 cashTotalFeeRate"
                )
            );
            rows.push(
                mapScalarRow("总费率", "cashTotalFeeRate", project.cashTotalFeeRate, (v) =>
                    typeof v === "number" ? formatDecimalRate(v) : "未返回"
                )
            );
        }

        rows.push(
            mapScalarRow("收取金额上限（单一梯度）", "singleGradientAmt", project.singleGradientAmt, (v) =>
                v == null || v === "" ? "未返回" : String(v)
            )
        );

        const needRe = project.needReCalPlatformFee;
        rows.push(
            mapScalarRow("重算服务费(融资)", "needReCalPlatformFee", needRe, (v) => {
                const yn = ynText(v);
                const base = yn ? `技能：Y/N → ${yn}` : String(v);
                return `${base}（原始：${rawPreview(v)}）`;
            })
        );

        rows.push(
            mapDictField("核心企业选择付费方式", "platFeeOwner", project.platFeeOwner, PLAT_FEE_OWNER, (dp) =>
                dp ? `编码 ${dp}` : "—"
            )
        );

        platform_fee = {
            branch: "beehive",
            rows,
            rate_primary_field: ratePrimary,
            gradient_limitation:
                "梯度列表（累进报价等）以 queryProjectPlatFeeCalConfigsByProjectId 返回为准；本对象仅含标量费率字段。"
        };
    } else if (tpCode === "wec") {
        const rows: InterpretedRow[] = [
            mapDictField("服务费收取方式(融资)", "cashFeeType", project.cashFeeType, CASH_FEE_TYPE_WEC, (dp) =>
                dp ? `编码 ${dp}` : "—"
            ),
            mapDictField("支付方（线下）", "cashFeePayer", project.cashFeePayer, FEE_PAYER, (dp) => (dp ? `编码 ${dp}` : "—")),
            mapScalarRow("服务费率(融资)", "cashFeeRate", project.cashFeeRate, formatDecimalRate),
            mapScalarRow("服务费率(转让)", "tranferFeeRate", project.tranferFeeRate, formatDecimalRate),
            mapScalarRow("渠道费率(融资)", "cashChannelFeeRate", project.cashChannelFeeRate, formatDecimalRate),
            mapScalarRow("融资收费资产层级", "cashFeeAssetLevel", project.cashFeeAssetLevel, formatAssetLevel)
        ];
        platform_fee = { branch: "wec", rows };
    } else {
        platform_fee = {
            branch: "unknown",
            transaction_platform: tpCode || "—",
            note: "无法按技能分支讯易链/微企链；请根据 transactionPlatform 人工核对。"
        };
    }

    return {
        skill_ref: "query-project-info",
        skill_version: QUERY_PROJECT_INFO_SKILL_VERSION,
        limitations,
        channel: {
            transaction_platform: { code: tpCode || "—", ui_name: tpUi }
        },
        basic: {
            project_name: (project.projectName as string) ?? null,
            project_app_no: (project.projectAppNo as string) ?? null,
            enable: {
                dict_param: en.dict_param,
                status_text: enableStatus(en.dict_param)
            },
            remark: project.remark ?? null,
            sub_project_mark: project.subProjectMark ?? null,
            project_mark: project.projectMark ?? null,
            special_product: project.specialProduct ?? null,
            channel_mark: channelMarkRow,
            platform_telephone: (project.platformTelephone as string) || null,
            logo_path: (project.logoPath as string) || null
        },
        platform_fee,
        config_step1_completion: {
            base: (project.baseConfigComplete as string) ?? null,
            contract: (project.contractConfigComplete as string) ?? null,
            asset: (project.assetConfigComplete as string) ?? null,
            after_loan: (project.afterLoanConfigComplete as string) ?? null
        }
    };
}

/** 由 normalized 生成简短 Markdown，供模型直接引用 */
export function buildSummaryMarkdownFromNormalized(n: NormalizedProjectInfo): string {
    const lines: string[] = [];
    const { channel, basic, platform_fee } = n;

    lines.push("### 基础配置（第 1 步）摘要");
    lines.push(
        `- **项目名称**：${basic.project_name ?? "—"} ｜ **立项审批编号**：${basic.project_app_no ?? "—"} ｜ **交易平台**：${channel.transaction_platform.ui_name}（\`${channel.transaction_platform.code}\`）`
    );
    lines.push(`- **生效状态**：${basic.enable.status_text}（dictParam=${basic.enable.dict_param ?? "—"}）`);
    lines.push(`- **remark / subProjectMark / projectMark**：${String(basic.remark ?? "—")} / ${String(basic.sub_project_mark ?? "—")} / ${String(basic.project_mark ?? "—")}`);
    if (basic.channel_mark) {
        lines.push(`- **channelMark**：${basic.channel_mark.business_meaning}（${basic.channel_mark.raw_preview}）`);
    }
    lines.push("");

    if (platform_fee.branch === "beehive") {
        lines.push("### 平台服务费（讯易链）");
        for (const r of platform_fee.rows) {
            lines.push(`- **${r.ui_label}**：${r.business_meaning}（字段 \`${r.field}\`）`);
        }
        lines.push(`- **说明**：${platform_fee.gradient_limitation}`);
    } else if (platform_fee.branch === "wec") {
        lines.push("### 平台服务费（微企链）");
        for (const r of platform_fee.rows) {
            lines.push(`- **${r.ui_label}**：${r.business_meaning}（字段 \`${r.field}\`）`);
        }
    } else {
        lines.push("### 平台服务费");
        lines.push(`- ${platform_fee.note}`);
    }

    lines.push("");
    lines.push("### 配置完成度（标量）");
    lines.push(
        `- 基础/协议/资产/贷后：${n.config_step1_completion.base ?? "—"} / ${n.config_step1_completion.contract ?? "—"} / ${n.config_step1_completion.asset ?? "—"} / ${n.config_step1_completion.after_loan ?? "—"}`
    );
    lines.push("");
    lines.push("### 限制说明");
    for (const L of n.limitations) {
        lines.push(`- ${L}`);
    }
    return lines.join("\n");
}

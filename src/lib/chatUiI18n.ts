import type { AppLanguage } from '../context/AppLanguageContext';

export const CHAT_UI = {
  zh: {
    judgeName: '判官',
    dragTitle: '拖动移动',
    panelTitle: '判官面板',
    expand: '展开',
    collapse: '收起',
    expandJudge: '展开判官',
    collapseJudge: '收起判官',
    send: '发送',
    modelChecking: '检测中',
    modelNotConfigured: '未配置',
    modelCurrent: (model: string) => `当前模型：${model}（在设置中切换）`,
    modelConfigureHint: '请在设置中配置并选择模型',
    llmConnected: '大模型已连接',
    llmChecking: '正在检测大模型连接…',
    llmDisconnected: '大模型未连接，请在设置中配置 API Key 并获取模型',
    emptyTitle: '判官在岗',
    emptyIdle: '问我词根含义、单词结构，或任何英文构词相关的问题。',
    emptyAfterJudge: '本轮已阅卷。可继续问我词根释义、构词规律或相关单词。',
    emptyCanJudge: (word: string) =>
      `看牌后，在下方输入「${word}」的词根解释，发送后由我阅卷裁定。`,
    judging: '阅卷中...',
    thinking: '思考中...',
    generating: '模型生成中...',
    connecting: '连接判官中...',
    judgeInputPrompt: '请在此输入词根解释，Enter 发送阅卷',
    placeholderCanJudge: (word: string) => `解释「${word}」词根含义，发送阅卷`,
    placeholderAfterJudge: '本轮已阅卷，可继续向判官提问',
    placeholderIdle: '输入消息，Enter 发送，Shift+Enter 换行',
    settingsRequired: '请先在顶部设置中配置 API Key 和模型',
    noReply: '（无回复内容）',
    errorPrefix: '错误：',
    requestFailed: '请求失败',
    verdictHeading: '【裁决】',
    verdictCorrect: '正确',
    verdictWrong: '错误',
  },
  en: {
    judgeName: 'Judge',
    dragTitle: 'Drag to move',
    panelTitle: 'Judge panel',
    expand: 'Expand',
    collapse: 'Collapse',
    expandJudge: 'Expand Judge',
    collapseJudge: 'Collapse Judge',
    send: 'Send',
    modelChecking: 'Checking',
    modelNotConfigured: 'Not set',
    modelCurrent: (model: string) => `Model: ${model} (change in Settings)`,
    modelConfigureHint: 'Configure API Key and select a model in Settings',
    llmConnected: 'LLM connected',
    llmChecking: 'Checking LLM connection…',
    llmDisconnected: 'LLM not connected. Configure API Key in Settings.',
    emptyTitle: 'Judge on duty',
    emptyIdle: 'Ask about roots, word structure, or any English morphology question.',
    emptyAfterJudge:
      'This round is graded. Keep asking about roots, meanings, or related words.',
    emptyCanJudge: (word: string) =>
      `After viewing the card, explain the root of “${word}” below and send for grading.`,
    judging: 'Grading…',
    thinking: 'Thinking…',
    generating: 'Generating…',
    connecting: 'Connecting to Judge…',
    judgeInputPrompt: 'Enter your root explanation here. Press Enter to submit.',
    placeholderCanJudge: (word: string) => `Explain the root of “${word}” and submit`,
    placeholderAfterJudge: 'Round graded — ask the Judge anything',
    placeholderIdle: 'Message… Enter to send, Shift+Enter for newline',
    settingsRequired: 'Configure API Key and model in Settings first',
    noReply: '(No response)',
    errorPrefix: 'Error: ',
    requestFailed: 'Request failed',
    verdictHeading: '[Verdict]',
    verdictCorrect: 'Correct',
    verdictWrong: 'Incorrect',
  },
} as const;

export const SCOREBOARD_UI = {
  zh: {
    round: (round: number, max: number) => `第 ${round}/${max} 轮`,
    correct: (n: number) => `正确 ${n}`,
    wrong: (n: number) => `错误 ${n}`,
    lastVerdict: (v: '正确' | '错误') => `上轮·${v === '正确' ? '正确' : '错误'}`,
  },
  en: {
    round: (round: number, max: number) => `Round ${round}/${max}`,
    correct: (n: number) => `Correct ${n}`,
    wrong: (n: number) => `Wrong ${n}`,
    lastVerdict: (v: '正确' | '错误') =>
      `Last · ${v === '正确' ? 'Correct' : 'Incorrect'}`,
  },
} as const;

export function getChatUi(lang: AppLanguage) {
  return CHAT_UI[lang];
}

export function getScoreboardUi(lang: AppLanguage) {
  return SCOREBOARD_UI[lang];
}

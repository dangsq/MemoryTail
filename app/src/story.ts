import type { StoryPage } from './types'

export const storyPages: StoryPage[] = [
  /* ── 0  Cover ── */
  {
    id: 'cover',
    label: '00',
    title: 'Memory Tail\n记忆之尾',
    text: '',
    imageUrl: 'png/plush_00_cover.png',
  },

  /* ── 1  Watching ── */
  {
    id: 'watching',
    label: '01',
    title: 'Watching\n观察',
    text: '我喜欢观察它。\n每个姿态都有含义，每个动作都是语言。\n\nI liked watching it.\nEvery posture had meaning, every movement was language.',
    imageUrl: 'png/plush_01_watching.png',
  },

  /* ── 2  Rhythm ── */
  {
    id: 'rhythm',
    label: '02',
    title: 'Rhythm\n节奏',
    text: '它有自己的节奏。\n我能从声音判断它在做什么。\n\nIt had its own rhythm.\nI could tell what it was doing from the sound.',
    imageUrl: 'png/plush_02_rhythm.png',
  },

  /* ── 3  Expression ── */
  {
    id: 'expression',
    label: '03',
    title: 'Expression\n表达',
    text: '它不会说话，但它会表达。\n我只需要看它的身体。\n\nIt couldn\'t speak, but it could express.\nI just needed to watch its body.',
    imageUrl: 'png/plush_03_expression.png',
  },

  /* ── 4  The Last ── */
  {
    id: 'last',
    label: '04',
    title: 'The last\n最后',
    text: '那天它很安静。\n但我知道它在说话。\n\nThat day it was very quiet.\nBut I knew it was speaking.',
    imageUrl: 'png/plush_04_last.png',
  },

  /* ── 5  Empty ── */
  {
    id: 'empty',
    label: '05',
    title: '—',
    text: '轮廓消失了。\n\nThe silhouette disappeared.',
    imageUrl: 'png/plush_05_empty.png',
  },

  /* ── 6  Adaptation ── */
  {
    id: 'adaptation',
    label: '06',
    title: 'Adaptation\n适应',
    text: '人会适应任何事。\n三个月后，我不再期待任何轮廓。\n\nPeople adapt to anything.\nThree months later, I no longer expected any silhouette.',
    imageUrl: 'png/plush_06_adaptation.png',
  },

  /* ── 7  Package ── */
  {
    id: 'package',
    label: '07',
    title: 'A package\n包裹',
    text: '门口有个包裹。\n"记忆转移完成。它会记得你。"\n\nA package at the door.\n"Memory transfer complete. It will remember you."',
    imageUrl: 'png/plush_07_package.png',
  },

  /* ── 8  Recognition ── */
  {
    id: 'recognition',
    label: '08',
    title: 'Recognition\n识别',
    text: '我打开开关。\n轮廓一模一样。但有什么不对。\n\nI turned it on.\nThe silhouette was identical. But something was wrong.',
    imageUrl: 'png/plush_08_recognition.png',
  },

  /* ── 9  Missing ── */
  {
    id: 'missing',
    label: '09',
    title: 'I see it now\n我看见了',
    text: '轮廓几乎完美。\n\n几乎。\n\n它没有尾巴。\n\nThe silhouette almost perfect.\n\nAlmost.\n\nIt has no tail.',
    imageUrl: 'png/plush_09_missing.png',
  },

  /* ── 10  Design Shape Intro ── */
  {
    id: 'design_shape_intro',
    label: '10',
    title: 'Design the shape\n设计形状',
    text: '系统提示：请设计尾巴模块。\n我开始调整，试图重建那个轮廓。\n\nSystem prompt: Please design tail module.\nI began adjusting, trying to rebuild that silhouette.',
    imageUrl: 'png/plush_10_design.png',
  },

  /* ── 11  Design Shape (Interactive) ── */
  {
    id: 'design_shape',
    label: '11',
    title: '',
    text: '',
    imageUrl: '', // No background for interactive page
    freeEdit: true,
  },

  /* ── 12  Awareness ── */
  {
    id: 'awareness',
    label: '12',
    title: 'I never noticed\n我从未注意',
    text: '十年里，我从未专门看过它的尾巴。\n但现在我意识到，那是它表达的核心。\n\nIn ten years, I never specifically looked at its tail.\nBut now I realize, that was the core of its expression.',
    imageUrl: 'png/plush_11_awareness.png',
  },

  /* ── 13  Not Enough ── */
  {
    id: 'notenough',
    label: '13',
    title: 'But it\'s not enough\n但这还不够',
    text: '形状有了，但它不会动。\n形状不是全部。\n\nThe shape is there, but it doesn\'t move.\nShape is not everything.',
    imageUrl: 'png/plush_12_notenough.png',
  },

  /* ── 14  Let Go ── */
  {
    id: 'letgo',
    label: '14',
    title: 'Let go\n放手',
    text: '也许，我不应该复刻。\n这只机器狗，需要它自己的语言。\n\nPerhaps I shouldn\'t replicate.\nThis robot dog needs its own language.',
    imageUrl: 'png/plush_13_letgo.png',
  },

  /* ── 15  New Language ── */
  {
    id: 'newlanguage',
    label: '15',
    title: 'A new language\n新的语言',
    text: '现在，它需要学会表达。\n这是一门新的语言。\n\nNow, it needs to learn to express.\nThis is a new language.',
    imageUrl: 'png/plush_14_newlanguage.png',
  },

  /* ── 16  Design Emotions Intro ── */
  {
    id: 'design_emotions_intro',
    label: '16',
    title: 'Teach it emotions\n教它情绪',
    text: '现在轮到你了。\n我预设了几种情绪的动作。\n选择一个，看看它如何表达。\n\nNow it\'s your turn.\nI\'ve preset several emotional movements.\nChoose one and see how it expresses.',
    imageUrl: 'png/plush_15_emotions.png',
  },

  /* ── 17  Design Emotions (Interactive) ── */
  {
    id: 'design_emotions',
    label: '17',
    title: '',
    text: '',
    imageUrl: '', // No background for interactive page
    freeEdit: true,
  },

  /* ── 18  Ending ── */
  {
    id: 'ending',
    label: '18',
    title: 'Seeing each other\n互相看见',
    text: '我们互相看见，互相理解。\n这就是新的语言。\n\nWe see each other, we understand each other.\nThis is the new language.',
    imageUrl: 'png/plush_ending.png',
  },
]

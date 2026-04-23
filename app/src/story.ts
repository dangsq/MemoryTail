import { mergeParams } from './params'
import type { StoryPage } from './types'

export const storyPages: StoryPage[] = [
  /* ── 0  Cover ── */
  {
    id: 'cover',
    label: '00',
    title: 'Memory Tail\n记忆之尾',
    text: '',
    imageUrl: 'png/story_00_meeting.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 1  Meeting ── */
  {
    id: 'meeting',
    label: '01',
    title: 'The day we met\n我们相遇的那天',
    text: '十年前，收容所里，它看着我。我蹲下来，它走过来，把头靠在我手上。就这样，我们成为了家人。\n\nTen years ago, at the shelter, it looked at me. I knelt down, it came over, and rested its head on my hand. Just like that, we became family.',
    imageUrl: 'png/story_00_meeting.png',
    params: mergeParams({
      height: 0.95,
      width: 1.05,
      maxWidthHeight: 0.53,
      bottomRadius: 0.22,
      bottomDepth: 0.19,
      topRadius: 0.3,
      topDepth: 0.2,
      cubicRatio: 0.5,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 1.1,
    }),
  },

  /* ── 2  Everyday ── */
  {
    id: 'everyday',
    label: '02',
    title: 'Every day\n每一天',
    text: '每天下班回家，还没开门，就能听到它在里面的声音。门一开，它就扑过来。这是我一天中最好的时刻。\n\nEvery day after work, before I even opened the door, I could hear it inside. The door opens, it rushes toward me. This was the best moment of my day.',
    imageUrl: 'png/story_01_everyday.png',
    params: mergeParams({
      height: 0.95,
      width: 1.05,
      maxWidthHeight: 0.53,
      bottomRadius: 0.22,
      bottomDepth: 0.19,
      topRadius: 0.3,
      topDepth: 0.2,
      cubicRatio: 0.5,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0.5,
    }),
  },

  /* ── 3  Companion ── */
  {
    id: 'companion',
    label: '03',
    title: 'You were always there\n你一直都在',
    text: '我开心的时候，它陪我疯。我难过的时候，它就安静地坐在我脚边。不说话，但我知道它懂。\n\nWhen I was happy, it played with me. When I was sad, it sat quietly at my feet. No words, but I knew it understood.',
    imageUrl: 'png/story_02_companion.png',
    params: mergeParams({
      height: 0.95,
      width: 1.05,
      maxWidthHeight: 0.53,
      bottomRadius: 0.22,
      bottomDepth: 0.19,
      topRadius: 0.3,
      topDepth: 0.2,
      cubicRatio: 0.5,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0.8,
    }),
  },

  /* ── 4  Last Day ── */
  {
    id: 'lastday',
    label: '04',
    title: 'The last day\n最后一天',
    text: '医生说它撑不过今晚了。我抱着它，它看着我，努力地动了一下。然后就安静了。\n\nThe doctor said it wouldn\'t make it through the night. I held it, it looked at me, tried to move once more. Then it was still.',
    imageUrl: 'png/story_03_last_day.png',
    params: mergeParams({
      height: 0.95,
      width: 1.05,
      maxWidthHeight: 0.53,
      bottomRadius: 0.22,
      bottomDepth: 0.19,
      topRadius: 0.3,
      topDepth: 0.2,
      cubicRatio: 0.5,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 5  Silence ── */
  {
    id: 'silence',
    label: '05',
    title: 'Silence\n寂静',
    text: '家里突然安静得可怕。空的狗盆，空的狗窝，空的一切。我这才意识到，它的存在有多响亮。\n\nThe house became terrifyingly quiet. Empty bowl, empty bed, empty everything. Only then did I realize how loud its presence had been.',
    imageUrl: 'png/story_04_silence.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 6  Robot Dog ── */
  {
    id: 'robotdog',
    label: '06',
    title: 'A new companion\n新的陪伴',
    text: '公司说，他们可以把它的记忆移植到机器狗里。我同意了。不是为了替代，只是还没准备好说再见。\n\nThe company said they could transfer its memory into a robot dog. I agreed. Not to replace it, just because I wasn\'t ready to say goodbye.',
    imageUrl: 'png/story_05_robot_dog.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 7  Recognition ── */
  {
    id: 'recognition',
    label: '07',
    title: 'It remembers\n它记得',
    text: '机器狗看到我，数据显示"记忆匹配"。它认出了我。但它只是站在那里，一动不动。\n\nThe robot dog saw me, data showed "memory match". It recognized me. But it just stood there, motionless.',
    imageUrl: 'png/story_06_recognition.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 8  Missing (TURNING POINT) ── */
  {
    id: 'missing',
    label: '08',
    title: 'Something is missing\n缺少了什么',
    text: '它记得我，但它不会表达。我伸出手，它没有反应。我突然意识到——它没有尾巴。那个曾经为我疯狂摇动的尾巴，不见了。\n\nIt remembered me, but couldn\'t express it. I reached out, no response. Then I realized — it has no tail. That tail that used to wag wildly for me, was gone.',
    imageUrl: 'png/story_07_missing.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 9  Memories ── */
  {
    id: 'memories',
    label: '09',
    title: 'I remember now\n我现在想起来了',
    text: '那条尾巴。它见到我时疯狂摇动，打翻过无数杯子。它难过时垂下来，扫过地板。它是它表达的全部方式。我怎么能忘记？\n\nThat tail. It wagged wildly when it saw me, knocked over countless cups. It drooped when sad, sweeping the floor. It was its entire way of expressing. How could I forget?',
    imageUrl: 'png/story_08_memories.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 10  Rebuilding ── */
  {
    id: 'rebuilding',
    label: '10',
    title: 'Rebuilding memory\n重建记忆',
    text: '工程师说，我可以为它设计一条尾巴。我记得它的每一个细节——长度、弧度、摇动的方式。每个参数，都是一段记忆。\n\nThe engineer said I could design a tail for it. I remember every detail — length, curve, the way it wagged. Every parameter is a memory.',
    imageUrl: 'png/story_09_rebuilding.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 11  Reunion ── */
  {
    id: 'reunion',
    label: '11',
    title: 'The first wag\n第一次摇动',
    text: '当我按下确认，机器狗的尾巴动了。不是机械的摆动，而是那个熟悉的节奏。它又回来了。\n\nWhen I pressed confirm, the robot dog\'s tail moved. Not a mechanical swing, but that familiar rhythm. It was back.',
    imageUrl: 'png/story_10_reunion.png',
    params: mergeParams({
      height: 1.0,
      width: 1.0,
      maxWidthHeight: 0.55,
      bottomRadius: 0.2,
      bottomDepth: 0.1,
      topRadius: 0.2,
      topDepth: 0.1,
      cubicRatio: 0.3,
      leafEnabled: false,
      biteEnabled: false,
      rotationY: 0,
    }),
  },

  /* ── 12  Playground (free edit) ── */
  {
    id: 'playground',
    label: '12',
    title: 'Now it\'s yours\n现在它是你的了',
    text: '这是你的记忆。你的尾巴。每一个参数，都是一种情感。创造它，重建它，让它成为独一无二的存在。\n\nThis is your memory. Your tail. Every parameter is an emotion. Create it, rebuild it, make it uniquely yours.',
    imageUrl: 'png/story_10_reunion.png',
    freeEdit: true,
  },
]

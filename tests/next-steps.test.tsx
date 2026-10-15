import { expect, test } from 'claude-code/testing'

declare const setTimeout: (run: () => void, ms: number) => unknown

const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 100,
    scroll: { bodyRows: 19, offset: 0, total: 0 },
    view: 'open',
  },
} as const

const REPLY = JSON.stringify([
  { label: '运行完整测试', prompt: '运行完整测试，看看登录修复有没有影响别的地方' },
  { label: '/code-review 检查这次改动', prompt: '/code-review high' },
  { label: '/nope 做点什么', prompt: '/nope do it' },
])

const ANSWER = {
  answer: '登录错误修好了。'.repeat(20),
  durationMs: 1000,
  isAborted: false,
  reason: 'answer',
} as const

test('the band offers steps on every app surface and fills the box', async ($, on) => {
  const filled: string[] = []
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })
  on('command.list', () => ({
    value: [{ name: 'code-review', description: 'Review the diff', source: 'plugin' }],
  }))
  on('model.fork', () => ({ value: { isAnswered: true, text: REPLY, usage: {} } }) as never)
  on('prompt.suggest', () => ({ isShown: true }))
  on('prompt.fill', (_$, e) => {
    filled.push(e.text)

    return { isFilled: true, text: e.text } as never
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    await $.turn.start({ text: 'fix login', turnId: `t-${surface}` })
    await $.turn.complete({ ...ANSWER, turnId: `t-${surface}` })

    // The fork runs after the turn's result returns; wait for the band to fill.
    let ui = await $.ui.mount({ plugin: 'next-steps-app', surface, ...BAND } as never)
    for (let i = 0; i < 50 && !(await ui.find({ type: 'Button', text: '运行完整测试' })); i++) {
      await ui.unmount()
      await new Promise<void>(resolve => setTimeout(resolve, 20))
      ui = await $.ui.mount({ plugin: 'next-steps-app', surface, ...BAND } as never)
    }
    expect(await ui.find({ type: 'Button', text: '运行完整测试' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '/code-review' })).toBeDefined()
    // A prompt naming a command the session lacks is dropped.
    expect(await ui.find({ type: 'Button', text: /nope/ })).toBeUndefined()

    await ui.press({ key: 'fill-1' })
    expect(filled.at(-1)).toBe('/code-review high')
    await ui.unmount()
  }
})

test('a new turn hides the offered steps', async ($, on) => {
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })
  on('command.list', () => ({ value: [] }))
  on('model.fork', () => ({ value: { isAnswered: true, text: REPLY, usage: {} } }) as never)
  on('prompt.suggest', () => ({ isShown: true }))

  await $.turn.complete({ ...ANSWER, turnId: 't-1' })
  let ui = await $.ui.mount({ plugin: 'next-steps-app', surface: 'desktop', ...BAND } as never)
  for (let i = 0; i < 50 && !(await ui.find({ type: 'Button', text: '运行完整测试' })); i++) {
    await ui.unmount()
    await new Promise<void>(resolve => setTimeout(resolve, 20))
    ui = await $.ui.mount({ plugin: 'next-steps-app', surface: 'desktop', ...BAND } as never)
  }
  expect(await ui.find({ type: 'Button', text: '运行完整测试' })).toBeDefined()
  await ui.unmount()

  await $.turn.start({ text: 'next', turnId: 't-2' })
  ui = await $.ui.mount({ plugin: 'next-steps-app', surface: 'desktop', ...BAND } as never)
  expect(await ui.find({ type: 'Button', text: '运行完整测试' })).toBeUndefined()
  await ui.unmount()
})

test('the mobile app shows the steps under the reply they follow', async ($, on) => {
  const filled: string[] = []
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_$, e) => ({ text: e.answer }))
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })
  on('command.list', () => ({
    value: [{ name: 'code-review', description: 'Review the diff', source: 'plugin' }],
  }))
  on('model.fork', () => ({ value: { isAnswered: true, text: REPLY, usage: {} } }) as never)
  on('prompt.suggest', () => ({ isShown: true }))
  on('prompt.fill', (_$, e) => {
    filled.push(e.text)

    return { isFilled: true, text: e.text } as never
  })

  await $.turn.start({ text: 'fix login', turnId: 't-m' })
  await $.turn.complete({ ...ANSWER, turnId: 't-m' })

  const reply = (text: string) =>
    ({ component: 'AssistantMessage', props: { text, isFirstOfReply: true } }) as const
  let ui = await $.ui.mount({ plugin: 'next-steps-app', surface: 'mobile', ...reply(ANSWER.answer) } as never)
  for (let i = 0; i < 50 && !(await ui.find({ type: 'Button', text: '运行完整测试' })); i++) {
    await ui.unmount()
    await new Promise<void>(resolve => setTimeout(resolve, 20))
    ui = await $.ui.mount({ plugin: 'next-steps-app', surface: 'mobile', ...reply(ANSWER.answer) } as never)
  }
  expect(await ui.find({ type: 'Button', text: '运行完整测试' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '/code-review' })).toBeDefined()
  await ui.press({ key: 'fill-1' })
  expect(filled.at(-1)).toBe('/code-review high')
  await ui.unmount()

  // An earlier reply gets nothing, and the desktop draws nothing under replies.
  await $.turn.start({ text: 'again', turnId: 't-m2' })
  await $.turn.complete({ ...ANSWER, turnId: 't-m2' })
  for (let i = 0; i < 10; i++) await new Promise<void>(resolve => setTimeout(resolve, 20))
  const other = await $.ui.mount({ plugin: 'next-steps-app', surface: 'mobile', ...reply('另一段较早的回答') } as never)
  expect(await other.find({ type: 'Button', text: '运行完整测试' })).toBeUndefined()
  await other.unmount()
  const desk = await $.ui.mount({ plugin: 'next-steps-app', surface: 'desktop', ...reply(ANSWER.answer) } as never)
  expect(await desk.find({ type: 'Button', text: '运行完整测试' })).toBeUndefined()
  await desk.unmount()
})

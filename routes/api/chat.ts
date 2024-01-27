import { Request, Response } from "express"
const router = require('express').Router()
const ZhipuAI = require('../../services/zhipuai')
const { splitTextIntoSegments,
  handleVoiceText } = require('../../services/sse-text-voice')
const AV = require('leanengine')
const zhipuai = new ZhipuAI()
const Tencent = require('../../services/tencent')
const tencent = new Tencent()

async function chatglmBase(req: Request, res: Response, sendMessages: GLMMessage[]) {
  // console.log(req.body)
  let needEncode = req.body.needEncode
  try {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    }
    res.writeHead(200, headers)

    let time = Date.now()
    // console.log(JSON.stringify(input))
    console.log('Application对话开始')
    const response = await zhipuai.completions(sendMessages)
    console.log({ response })
    response.data.on('data', (chunk: string) => {
      // console.log({ chunk })
      if (needEncode) chunk = encodeURIComponent(chunk)
      res.write(chunk)
    })

    response.data.on('end', () => {
      console.log('Application对话总耗时', ~~((Date.now() - time) / 1000) + '秒')
      res.end()
    })
  } catch (error: any) {
    // console.log(error)
    res.write('GLM请求失败')
    res.end()
  }
}

router.post('/sse', async (req: Request, res: Response) => {
  // 这个是open的sse接口，限制调用次数即可
  const params = req.body as { messages: GLMMessage[], context?: string }

  let { messages, context } = params
  if (!messages || !messages.length) {
    res.status(500).send(rule.fail('消息不能为空'))
    return
  }
  // 处理记忆
  let sendMessages: any[] = []
  if (context) {
    sendMessages.push({
      role: 'user', content: `我现在给你补充一段上下文, 后面问答你优先找上下文内容, 找不到再从你的知识库里面找.
上下文: 【${context}】.`
    })
    sendMessages.push({ role: 'assistant', content: '好的.' })
  }
  messages.forEach((i: any) => {
    sendMessages.push({ role: 'user', content: i.content })
    i.answer && sendMessages.push({ role: 'assistant', content: i.answer })
  })
  if (!messages || !messages.length) return rule.fail('消息不能为空')
  chatglmBase(req, res, sendMessages)
})

function text2Voice(text: string, item: LCObject, voice_params: any) {
  let switch_text = text
  if (text.length > 150) {
    let [point_text, ...[]] = splitTextIntoSegments(text, 150)
    switch_text = point_text
  }
  tencent.text2Voice({
    Text: switch_text,
    Volume: voice_params.volume || 0,
    Speed: voice_params.speed || 0,
    VoiceType: voice_params.voice_type || 10510000,
    Codec: voice_params.codec || 'wav',
  }).then(async (res: any) => {
    const file = new AV.File('TXT2Voice-' + Date.now() + ".wav", {
      base64: res.Audio
    })
    return file.save()
  })
    .then(async (res: any) => {
      item.add('voice_data', res.toJSON().url)
      await item.save()
      if (text.slice(switch_text.length).length) {
        text2Voice(text.slice(switch_text.length), item, voice_params)
      } else {
        item.set('voice_status', 1)
        await item.save()
      }
    })
    .catch((error: Error) => {
      let message = error.message || error
      console.error({ error: message })
      item.set('voice_status', -1)
      item.set('voice_error', message)
      item.save()
    })
}
module.exports = router

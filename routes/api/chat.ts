import { Request, Response } from "express"
const router = require('express').Router()
const ZhipuAI = require('../../services/zhipuai')
const { splitTextIntoSegments,
  handleVoiceText } = require('../../services/sse-text-voice')
const AV = require('leanengine')
const zhipuai = new ZhipuAI()
const TencentSdk = require('../../services/tencent')
const tencent_sdk = new TencentSdk({
  secretId: process.env.TencentSDKSecretId,
  secretKey: process.env.TencentSDKSecretKey,
})
interface Message {
  content: string, role: 'user' | 'assistant' | 'system'
}

async function chatglmBase({ req, res, user, attraction_id, send_messages, meta, voice_params = {} }: { req: Request, res: Response, user: LCUser, send_messages: Message[], attraction_id: string, meta?: GLMCharacterMeta, voice_params?: any }) {
  let chat = new AV.Object('KSNChat')
  let point_attraction = AV.Object.createWithoutData('KSNAttraction', attraction_id)
  chat.set('user', user)
  chat.set('status', 0)
  chat.set('attraction', point_attraction)
  if (meta) {
    chat.set('meta', meta)
  }
  const acl = new AV.ACL()
  acl.setPublicReadAccess(false)
  acl.setPublicWriteAccess(false)
  acl.setReadAccess(user, true)
  acl.setWriteAccess(user, true)
  chat.setACL(acl)
  try {
    let input: any = { messages: send_messages }
    chat.set('input', input)
    let completions_data = { completions: (input: any) => zhipuai.completionsStd(input.messages), input }
    if (meta) {
      completions_data = { completions: (input: any) => zhipuai.completionsCharacter(input.messages, meta), input }
    }
    let completions = completions_data.completions
    input = completions_data.input
    completions(input)
      .then((data: any) => {
        // console.log(data)
        let answer = handleModelAnswer('chatglm_std', data.data.data)
        chat.set('output', data.data.data)
        chat.set('answer', answer)
        chat.set('status', 1)
        chat.save()
        text2Voice(answer, chat, voice_params)
      })
      .catch(async (error: any) => {
        let message = error.message || error
        console.error({ error: message })
        chat.set('status', -1)
        chat.set('error', message)
        chat.save()
      })
    res.send(rule.success(await chat.save()))
  } catch (error) {
    res.send(rule.fail(error))
  }
}

router.post('/chatglm/std', async (req: Request, res: Response) => {
  const params = req.body as { messages: Message[], context?: string, user_session: string, attraction_id: string, voice_params: any }
  let { messages, context, user_session, attraction_id, voice_params } = params
  if (!user_session || !attraction_id || !messages || !messages.length) {
    res.status(500).send(rule.fail('参数错误'))
    return
  }
  try {
    let user = await AV.User.become(user_session)
    if (!user) {
      res.status(500).send(rule.fail('用户校验失败'))
      return
    }
    // 处理记忆
    let send_messages: any[] = []
    if (context) {
      send_messages.push({
        role: 'user', content: `我现在给你补充一段上下文, 后面问答你优先找上下文内容, 找不到再从你的知识库里面找.
 上下文: 【${context}】.`
      })
      send_messages.push({ role: 'assistant', content: '好的.' })
    }
    messages.forEach((i: any) => {
      send_messages.push({ role: 'user', content: i.content })
      i.answer && send_messages.push({ role: 'assistant', content: i.answer })
    })
    chatglmBase({ req, res, user, send_messages, attraction_id, voice_params })
  } catch (error) {
    res.status(500).send(rule.fail(error))
    return
  }

})

router.post('/chatglm/std-sse', async (req: Request, res: Response) => {
  const params = req.body as { messages: Message[], context?: string, user_session: string, attraction_id: string, meta?: GLMCharacterMeta, voice_params: any, code_data_id: string, prompt_id: string }
  let { messages, context, user_session, attraction_id, meta, code_data_id, voice_params, prompt_id = '' } = params
  if (!user_session || !messages || !messages.length || !prompt_id) {
    res.status(500).send(rule.fail('参数错误'))
    return
  }
  if (!attraction_id && !code_data_id) {
    res.status(500).send(rule.fail('参数错误'))
    return
  }

  try {
    let user = await AV.User.become(user_session)
    if (!user) {
      res.status(500).send(rule.fail('用户校验失败'))
      return
    }

    let prompt_lc = await new AV.Query('KSNPrompt').equalTo('objectId', prompt_id).include('context_pointer').first({
      useMasterKey: true
    })
    if (!prompt_lc) {
      res.status(500).send(rule.fail('指令获取失败'))
      return
    }
    let pre_prompt = prompt_lc.get('pre_prompt')
    let tail_prompt = prompt_lc.get('tail_prompt')
    let chat = new AV.Object('KSNChat')
    chat.set('user', user)
    chat.set('status', 0)
    let voice_type = {
      Volume: voice_params.volume || 0,
      Speed: voice_params.speed || 0,
      VoiceType: voice_params.voice_type || 10510000,
      Codec: voice_params.codec || 'wav',
    }
    chat.set('voice_type', voice_type)
    chat.set('prompt', prompt_lc)
    if (attraction_id) {
      let attration_lc = await new AV.Query('KSNAttraction').equalTo('objectId', attraction_id).first({
        useMasterKey: true
      })
      if (!attration_lc) {
        res.status(500).send(rule.fail('景区指令获取失败'))
        return
      }
      chat.set('attraction', attration_lc)
    }
    if (code_data_id) {
      let code_data_lc = await new AV.Query('KSNCodeData').equalTo('objectId', code_data_id).include(['area', 'prompt_eazy', 'prompt_default', 'prompt_slow']).first({
        useMasterKey: true
      })
      if (!code_data_lc) {
        res.status(500).send(rule.fail('编码指令获取失败'))
        return
      }
      chat.set('code_data', code_data_lc)
    }
    if (meta) {
      chat.set('meta', meta)
    }
    const acl = new AV.ACL()
    acl.setPublicReadAccess(false)
    acl.setPublicWriteAccess(false)
    acl.setReadAccess(user, true)
    acl.setWriteAccess(user, true)
    chat.setACL(acl)
    chat.set('input', { messages })
    chat.set('user_input', messages[messages.length - 1].content)
    // 处理记忆
    let send_messages: any[] = []
    let prompt_context = prompt_lc.get('context') || (prompt_lc.get('context_pointer') && prompt_lc.get('context_pointer').get('context'))
    let chat_context = context || prompt_context
    if (chat_context) {
      send_messages.push({
        role: 'user', content: `我现在给你补充一段上下文, 后面问答你优先找上下文内容, 找不到再从你的知识库里面找.
 上下文: 【${chat_context}】.`
      })
      send_messages.push({ role: 'assistant', content: '好的.' })
    }
    messages.forEach((i: any,) => {
      send_messages.push({ role: 'user', content: i.widthout_prompt ? i.content : pre_prompt + i.content + tail_prompt })
      i.answer && send_messages.push({ role: 'assistant', content: i.answer })
    })
    chat.set('send_messages', { send_messages })
    chat.set('content', (send_messages[send_messages.length - 1]).content)
    let chat_lc = await chat.save()
    chatglmBaseSse({ req, res, send_messages, meta, lc_object: chat_lc, voice_params })
  } catch (error) {
    res.status(500).send(rule.fail(error))
    return
  }
})


async function chatglmBaseSse({ req, res, send_messages, lc_object, meta, voice_params }: { req: Request, res: Response, send_messages: Message[], meta?: GLMCharacterMeta, lc_object: LCObject, voice_params: any }) {
  // console.log(req.body)
  let need_encode = req.body.need_encode
  try {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    }
    res.writeHead(200, headers)
    let input: any = { messages: send_messages }
    let completions_data = { completions: (input: any) => zhipuai.completionsStdSSE(input.messages), input }
    if (meta) {
      completions_data = { completions: (input: any) => zhipuai.completionsCharacter(input.messages, meta), input }
    }
    let completions = completions_data.completions
    input = completions_data.input
    let time = Date.now()
    console.log('Application对话开始')
    let item: any = lc_object.toJSON()
    completions(input)
      .then((response: any) => { // 返回了一个stream
        // console.log(response)
        let complete_text = ``
        let request_id = ''
        let current_set_index = 0
        let task_index = 0
        res.write("event: init_stream\n")
        res.write("lc_data: " + JSON.stringify({ objectId: item.objectId, content: item.content, user_input: item.user_input, status: item.status, answer: item.answer }) + "\n\n")

        response.data.on('data', (chunk: any) => {
          if (need_encode) chunk = encodeURIComponent(chunk)
          // 尝试提取data字段的值
          let text = chunk.toString('utf-8')
          let kvs = text.split('\n')
          kvs.forEach((kv: any) => {
            let [key, value] = kv.split(':')
            if (key) {
              if (!request_id && key === 'id') {
                request_id = value
              }
              if (key === 'event' && value === 'finish') {
                // 结尾处理
              } else if (key === 'data' && !text.match(/event:finish/)) {
                if (value === '') {
                  value = '\n'
                }
                complete_text += value
                complete_text = complete_text.replace(/\\n/g, '')
                let voice_result = handleVoiceText({ text: complete_text, current_set_index, task_index, lc_object, voice_params, res, end: false })
                current_set_index = voice_result.current_set_index
                task_index = voice_result.task_index
              }
            }
          })
          res.write(chunk)
        })

        response.data.on('end', () => {
          complete_text = complete_text.replace(/\\n/g, '')
          console.log('Application对话总耗时', ~~((Date.now() - time) / 1000) + '秒')
          lc_object.set('status', 1)
          lc_object.set('answer', complete_text)
          lc_object.set('output', { request_id, task_status: 'SUCCESS', choices: [{ role: 'assistant', content: complete_text }] })
          lc_object.save()
          handleVoiceText({ text: complete_text, current_set_index, lc_object, task_index, voice_params, res, end: true })
        })
      })
      .catch(async (error: any) => {
        let message = error.message || error
        console.error({ error: message })
      })
  } catch (error) {
    res.status(500).send('获取页面签名失败')
  }
}

router.post('/chatglm/character', async (req: Request, res: Response) => {
  const params = req.body as { messages: Message[], meta: GLMCharacterMeta, user_session: string, attraction_id: string, voice_params?: any }

  let { messages, meta, user_session, attraction_id, voice_params } = params
  console.log(meta)
  if (!messages || !messages.length || !meta || !user_session || !attraction_id) {
    res.status(500).send(rule.fail('参数错误'))
    return
  }
  try {
    let user = await AV.User.become(user_session)
    if (!user) {
      res.status(500).send(rule.fail('用户校验失败'))
      return
    }
    // 处理记忆
    let send_messages: any[] = []
    messages.forEach((i: any) => {
      send_messages.push({ role: 'user', content: i.content })
      i.answer && send_messages.push({ role: 'assistant', content: i.answer })
    })
    chatglmBase({ req, res, user, send_messages, meta, attraction_id, voice_params })
  } catch (error) {
    res.status(500).send(rule.fail(error))
    return
  }
})

function handleModelAnswer(model_type: string = 'yiyan', data: any): string {
  console.log(data)
  let answer
  switch (model_type) {
    case 'yiyan':
    case 'bmz7b':
    case 'bloomz_7b':
    case 'llama_2_7b':
    case 'llama_2_13b':
    case 'llama_2_70b':
      answer = data.result
      break
    case 'gpt3.5':
    case 'gpt4':
      // console.log({ data })
      answer = (data.data && data.data.content) || data.content || data.choices[0].message.content
      break
    case 'glm6b':
    case 'glm130b':
    case 'chatglm_lite':
    case 'chatglm_std':
    case 'chatglm_pro':
      answer = data.choices && data.choices[0].content
      break
    default:
      answer = data.choices && data.choices[0].content
      break
  }
  answer = answer.replace(/^"(\\n\\n)?|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"')
  return answer
}

function text2Voice(text: string, item: LCObject, voice_params: any) {
  let switch_text = text
  if (text.length > 150) {
    let [point_text, ...[]] = splitTextIntoSegments(text, 150)
    switch_text = point_text
  }
  tencent_sdk.text2Voice({
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

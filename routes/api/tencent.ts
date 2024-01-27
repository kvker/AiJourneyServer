import { Request, Response } from "express"
const router = require('express').Router()
const TencentSdk = require('../../services/tencent')
const tencentSdk = new TencentSdk()
type TxVoiceParams = {
  base64: string
  file_size: number
  voice_type: string
}

type TxText2VoiceParams = {
  text: string
  volume: number
  speed: number
  voice_type: number
  codec: string
  emotion_category?: string
  emotion_intensity?: number
}

router.post('/txVoice2Text', async (req: Request, res: Response) => {
  const params = req.body as TxVoiceParams

  let { base64, file_size, voice_type = 'wav' } = params
  if (!base64 || !file_size) {
    res.status(500).send(rule.fail('参数错误'))
    return
  }
  try {
    let ret = await tencentSdk.voice2Text({ base64, file_size, voice_type })
    res.send(rule.success(ret))
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/txText2Voice', async (req: Request, res: Response) => {
  const params = req.body as TxText2VoiceParams

  let { text, volume = 1,
    speed = 0,
    voice_type = '10510000',
    codec = 'wav',
  } = params
  if (!text) {
    res.status(500).send(rule.fail('参数错误'))
    return
  }
  try {
    let ret = await tencentSdk.text2Voice({
      Text: text,
      Volume: volume,
      Speed: speed,
      VoiceType: voice_type,
      Codec: codec,
    })
    res.send(rule.success(ret))
  } catch (error) {
    res.status(400).send(error)
  }
})


// TODO 资源包没有 长文本回调
router.post('/longText2VoiceCallback', async (req: Request, res: Response) => {
  const params = req.body as TxText2VoiceParams

  console.log(params)
  try {
    res.send(rule.success('成功'))
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router
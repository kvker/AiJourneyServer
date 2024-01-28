import { Request, Response } from "express"
const router = require('express').Router()
const TencentSdk = require('../../services/tencent')
const tencentSdk = new TencentSdk()
type TxVoiceParams = {
  base64: string
  fileSize: number
  voiceType: string
}

type TxText2VoiceParams = {
  text: string
  volume: number
  speed: number
  voiceType: number
  codec: string
  emotion_category?: string
  emotion_intensity?: number
}

router.post('/voice2text', async (req: Request, res: Response) => {
  const params = req.body as TxVoiceParams

  let { base64, fileSize, voiceType = 'wav' } = params
  if (!base64 || !fileSize) {
    res.status(500).send(rule.fail('参数错误'))
    return
  }
  try {
    let ret = await tencentSdk.voice2Text({ base64, fileSize, voiceType })
    res.send(rule.success(ret))
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/text2voice', async (req: Request, res: Response) => {
  const params = req.body as TxText2VoiceParams

  let { text, volume = 1,
    speed = 0,
    voiceType = 10510000,
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
      VoiceType: voiceType,
      Codec: codec,
    })
    res.send(rule.success(ret))
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
})

module.exports = router
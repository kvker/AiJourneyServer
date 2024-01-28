export { }
const tencentcloud = require("tencentcloud-sdk-nodejs")
const AsrClient = tencentcloud.asr.v20190614.Client
const tencentcloudtts = require("tencentcloud-sdk-nodejs-tts")
const crypto = require("crypto")
const COS = require('cos-nodejs-sdk-v5')
import https from 'https'
import { Buffer } from 'buffer'

const cos_config = {
  bucket: 'contentsafe-1251835910',
  region: 'ap-beijing'
}
const AKSK = {
  SecretId: process.env.TencentSDKSecretId as string,
  SecretKey: process.env.TencentSDKSecretKey as string,
  Domain: `https://${cos_config.bucket}.cos.${cos_config.region}.myqcloud.com`,
}
const cos = new COS(AKSK)

const TtsClient = tencentcloudtts.tts.v20190823.Client
interface TencentcloudConfig {
  secretId: string;
  secretKey: string
}

interface TencentVoice2TextParams {
  voiceType: string
  base64: string
  fileSize: number
}

interface TencentText2VoiceParams {
  Text: string
  Volume: number
  Speed: number
  VoiceType: number
  Codec: string
  ModelType?: number,
  PrimaryLanguage?: number // 1:中文 2:英文 3:日文
  EmotionCategory?: string  // neutral(中性)、sad(悲伤)、happy(高兴)、angry(生气)、fear(恐惧)、news(新闻)、story(故事)、radio(广播)、poetry(诗歌)、call(客服)、撒娇(sajiao)、厌恶(disgusted)、震惊(amaze)、平静(peaceful)、兴奋(exciting)、傲娇(aojiao)、解说(jieshuo)
  EmotionIntensity?: number
  SessionId?: string,
}
interface TencentLongText2VoiceParams extends TencentText2VoiceParams {
  CallbackUrl?: string
}
class TencentSdk {
  config: TencentcloudConfig = {
    secretId: AKSK.SecretId,
    secretKey: AKSK.SecretKey,
  }

  constructor() {

  }
  async voice2Text(params: TencentVoice2TextParams) {
    const { voiceType, base64, fileSize, } = params
    const clientConfig = {
      credential: {
        secretId: this.config.secretId,
        secretKey: this.config.secretKey,
      },
      region: "ap-beijing",
      profile: {
        httpProfile: {
          endpoint: "asr.tencentcloudapi.com",
        },
      },
    }
    const client = new AsrClient(clientConfig)
    const data = {
      "EngSerViceType": "16k_zh",
      "SourceType": 1,
      "VoiceFormat": voiceType,
      "Data": base64,
      "DataLen": fileSize,
    }

    try {
      let ret = await client.SentenceRecognition(data).then(
        (data: any) => {
          console.log(data)
          return data
        },
        (err: Error) => {
          console.error("error", err)
          return Promise.reject(err)
        }
      )
      return ret
    } catch (error) {
      throw error
    }
  }

  async text2Voice(params: TencentText2VoiceParams) {
    const { Text, Volume, Speed, VoiceType, Codec, EmotionCategory, EmotionIntensity } = params
    const clientConfig = {
      credential: {
        secretId: this.config.secretId,
        secretKey: this.config.secretKey,
      },
      region: "ap-beijing",
      profile: {
        httpProfile: {
          endpoint: "tts.tencentcloudapi.com",
        },
      },
    }
    const client = new TtsClient(clientConfig)
    let data: TencentText2VoiceParams = {
      SessionId: crypto.randomUUID(),
      Text,
      Volume,
      Speed,
      VoiceType,
      Codec,
    }
    if (EmotionCategory) {
      data.EmotionCategory = EmotionCategory
      data.EmotionIntensity = EmotionIntensity || 100
    }
    console.log('语音合成参数', data)
    return (await client.TextToVoice(data)).Audio
  }

  async longText2Voice(params: TencentText2VoiceParams) {
    const { Text, Volume, Speed, VoiceType, Codec, EmotionCategory, EmotionIntensity } = params
    const clientConfig = {
      credential: {
        secretId: this.config.secretId,
        secretKey: this.config.secretKey,
      },
      region: "",
      profile: {
        httpProfile: {
          endpoint: "tts.tencentcloudapi.com",
        },
      },
    }
    const client = new TtsClient(clientConfig)
    let data: TencentLongText2VoiceParams = {
      Text, Volume, Speed, VoiceType, Codec,
      ModelType: 1,
      // CallbackUrl: 'https://api.kvker.com/api/tencent/longText2VoiceCallback'
    }
    if (EmotionCategory) {
      data.EmotionCategory = EmotionCategory
      data.EmotionIntensity = EmotionIntensity || 100
    }
    console.log('长文本语音合成参数', data)
    let ret = await client.CreateTtsTask(data)
    // 查询结果
    for (const iterator of [1, 2, 3, 4, 5]) {
      ret = await this.getTtsStatus(ret.Data.TaskId)
      console.log(ret)
      if (ret.Data.Status === 2) {
        break
      }
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve('')
        }, 3000)
      })
    }
    // ret.Data.ResultUrl 提供的有效时间只有1天,千万注意
    const base64 = await this.url2Base64(ret.Data.ResultUrl)
    return base64
  }

  url2Base64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const data: any[] = []
        res.on('data', (chunk) => data.push(chunk))
        res.on('end', () => resolve(Buffer.concat(data).toString('base64')))
        res.on('error', reject);
      })
    })
  }

  async getTtsStatus(taskId: string) {
    const clientConfig = {
      credential: {
        secretId: this.config.secretId,
        secretKey: this.config.secretKey,
      },
      region: "",
      profile: {
        httpProfile: {
          endpoint: "tts.tencentcloudapi.com",
        },
      },
    }
    const client = new TtsClient(clientConfig)
    return await client.DescribeTtsTaskStatus({ TaskId: taskId })
  }

  /**
 * 腾讯同步文字审核, 数字万象
 * @param text 需要审核的文字
 * @returns Primise 原始数据
 */
  postTextContentAuditing(text: string) {
    const host = cos_config.bucket + '.ci.' + cos_config.region + '.myqcloud.com'
    const key = 'text/auditing' // 固定值，必须
    const url = `https://${host}/${key}`
    const body = COS.util.json2xml({
      Request: {
        Input: {
          // 使用 COS.util.encodeBase64 方法需要sdk版本至少为1.4.19
          Content: COS.util.encodeBase64(text), /* 需要审核的文本内容 */
        },
        Conf: {
          BizType: '',
        }
      }
    })
    return new Promise((resolve, reject) => {
      cos.request({
        Method: 'POST', // 固定值，必须
        Url: url, // 请求的url，必须
        Key: key, // 固定值，必须
        ContentType: 'application/xml', // 固定值，必须
        Body: body // 请求体参数，必须
      },
        function (err: any, data: any) {
          if (err) {
            // 处理请求失败
            console.log(err)
            reject(err)
          } else {
            // 处理请求成功
            // console.log(data.Response)
            resolve(data.Response)
          }
        })
    })
  }
}


module.exports = TencentSdk
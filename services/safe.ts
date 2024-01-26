export { }
/**
 * 本模块主要处理安全通用接口
 */

const urllib = require('urllib')
const { postTextContentAuditing } = require('./tencent')

module.exports = class Safe implements SafeInterface {
  async getDouyinAccessToken() {
    let ret = await urllib.request(rule.bj_api_address + '/api/access_token/douyin', {
      dataType: 'json',
    })
    return ret.data.data
  }

  async checkText(text: string) {
    if (!text) {
      let ret = {
        suggestion: 'block',
        "code": 9999, "msg": "传入text错误",
        text,
      }
      console.log(ret)
      return ret
    }
    let date = Date.now()
    console.log('审核文本:' + text)
    let result: any
    try {
      const checkRet = await postTextContentAuditing(text)

      let status = checkRet.JobsDetail.Result
      console.log(JSON.stringify(checkRet, null, 2))
      if (status === '0') {
        // 正常
        result = {
          suggestion: 'pass'
        }
      } else {
        // 异常
        const section = checkRet.JobsDetail.Section
        for (const key in section) {
          if (section.hasOwnProperty(key)) {
            const element = section[key]
            if (element.HitFlag && element.HitFlag === '1') {
              result = {
                suggestion: 'block',
                labels: [element.Keywords || checkRet.JobsDetail.SubLabel]
              }
              break
            }
          }
        }
      }
      console.log('内容审核信息：' + date)
    } catch (error) {
      result = {
        suggestion: 'block',
        labels: ['服务错误, 烦请联系管理员']
      }
    }
    return result
  }

  async checkTextDouyin(text: string) {
    console.log(text)
    let access_token = await this.getDouyinAccessToken()
    return urllib.request('https://developer.toutiao.com/api/v2/tags/text/antidirt', {
      method: 'POST',
      headers: {
        'X-Token': access_token,
        'content-type': 'application/json'
      },
      data: {
        tasks: [{ content: text }],
      },
      dataType: 'json',
    }).then((ret: any) => {
      let data = ret.data
      let hit_item = data.data && data.data.find((item: any) => item.predicts && item.predicts.find((i: any) => i.hit))
      if (!hit_item) {
        return {
          suggestion: 'pass',
        }
      } else {
        return {
          suggestion: 'block',
        }
      }
    })
  }

  async checkImageDouyin(url: string) {
    // console.log({url})
    let access_token = await this.getDouyinAccessToken()
    // console.log(access_token)
    return urllib.request('https://developer.toutiao.com/api/apps/censor/image', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      data: {
        app_id: 'ttdda2ab1f429e18c701',
        access_token,
        image: url,
        // image_data: base64,
      },
      dataType: 'json',
      timeout: 60000,
    })
      .then((ret: any) => {
        let data = ret.data
        if (data.error || !data.predicts) {
          console.log('抖音图片校验data', url, data)
          throw new Error('调用错误, 请重试')
        }
        else {
          return data
        }
      })
      .catch((err: Error) => {
        throw err
      })
  }
}
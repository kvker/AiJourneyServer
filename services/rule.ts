export { }
const Safe = require('./safe')
const safe = new Safe()
const env = process.env
const AV = require('leanengine')

const is_dev = env.NODE_ENV === 'development'
const is_stage = env.LEANCLOUD_APP_ENV === 'stage'
const no_task = env.NO_TASK === 'true'
console.log({ is_dev, is_stage, no_task })
const rule: Rule = {
  no_task,
  is_dev,
  warning_string: '因相关法律和要求，相关提问信息不予展示。（包含黄赌毒、港台等地缘信息）',
  is_stage,
  hk_address: process.env.HKAddress as string,
  bj_api_address: process.env.BJAPIAddress as string,
  headers: {
    'X-LC-Id': process.env.LEANCLOUD_APP_ID,
    'X-LC-Key': process.env.LEANCLOUD_APP_KEY,
  },
  default_urllib_options: {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    dataType: 'json',
    timeout: 300000,
  },
  KS_WRITE_NEED_INTEGRATION: {
    COMMON: 0,
    TEXT_EXTENDER: 0,
    INSTANT_ARTICLE_WRITER: 0,
    BULLET_POINT_ANSWERS: 0,
    CALL_TO_ACTION: 0,
    COMPANY_MISSION: 0,
    COMPANY_VISION: 0,
    CONTENT_REPHRASE: 0,
    CONTENT_SHORTEN: 0,
    Definition: 0,
    EMAILS_V2: 0,
    COLD_EMAILS_V2: 0,
    EMAIL_SUBJECT_LINES: 0,
    TIMELINES_A_DS: 0,
    TONE_CHANGER: 0,
    STORIES: 0,
    TEXT_SUMMARY: 0,
    TWEETS: 0,
    SEO_MEAT_TAGS: 0,
    PRODUCT_DESCRIPTIONS: 0,
    TIK_TOK_VIDEO_SCRIPTS: 0,
    PERSONAL_BIOS: 0,
    TWITTER_THREADS: 0,
    LANGING_PAGE_HEADLINES: 0,
    INSTANT_ARTICLE_WRITER_REPORT: 0,
    TWEETS_FOOD: 0,
    PARAGRAPH_WRITER: 0
  },
  retHandler: (ret: any, key?: string) => {
    let data = ret.data.toString()
    if (data.startsWith('{') || data.startsWith('[')) {
      data = JSON.parse(data)
      // console.log(data) // 这里当做调用成功
      return key ? data[key] : data
    } else {
      return Promise.reject(data)
    }
  },
  openAIMsgSafeHandle(text: string) {
    text = text.replace(/chatgpt/ig, 'GPT')
    return text
  },
  // 通用错误返回
  success: (data: any, code = 200, msg = 'success') => {
    return {
      code,
      msg,
      data,
    }
  },
  // 通用失败返回
  fail: (error: Error, code = 0, msg = 'error') => {
    if (typeof (error) === 'string') msg = error
    return {
      code,
      msg,
      error,
    }
  },
  // 通用错误返回
  error: (error: Error) => {
    return Promise.reject(error.message || error)
  },
  log: (msg: string) => {
    rule.is_dev && console.log(msg)
  },
  sleep(ms: number = 5000) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },
  checkUserAgent(request: any) {
    const userAgent = request.expressReq.headers['user-agent']
    let platform
    if (userAgent.indexOf('MiniProgram') !== -1) {
      // 微信小程序环境
      platform = '微信小程序'
    } else if (userAgent.indexOf('Html5PlusAPP') !== -1) {
      // 微信小程序环境
      platform = 'APP'
    } else {
      // H5 环境
      platform = 'H5'
    }
    return platform
  },
  customCheckContent(text) {
    let suggestion = 'pass'
    if (text.match(/香港|澳门|澳門|台湾|台灣|西藏|阿鲁恰尔邦|阿鲁纳恰尔邦|新疆|內蒙|hong\skong|hongkong|macao|taiwan|tibet|xinjiang|aluqiaerbang/gi)) {
      console.log('block from custom hk tw')
      suggestion = 'block'
    } else if (text.match(/八九|89|八9|8九|捌玖|捌9|8玖|捌九|八玖|六四|64|六4|6四|陸肆|陸4|6肆|陸四|六肆/gi)) {
      console.log('block from custom 8964')
      suggestion = 'block'
    }
    return Promise.resolve({ suggestion })
  },
  async checkContent(text_data) {
    let result = await this.customCheckContent(text_data.text)
    if (result.suggestion === 'pass') {
      return safe.checkText(text_data.text)
    }
    return result
  },
  blockText(check_result: any) {
    let result = '相关内容不当, 请更换提示词后重试..'
    try {
      if (check_result.labels && check_result.labels.length) { // 网易易盾
        return result + check_result.labels.reduce((p: string, c: string) => p += '.' + c, '')
      } else if (check_result.data && check_result.data.length) { // 历史百度
        let msg = check_result.data[0].hits[0].words.reduce((p: string, c: string) => p += '.' + c, '')
        return result + (msg || check_result.data[0].msg)
      } else {
        return result
      }
    } catch (error) {
      console.log(JSON.stringify(check_result))
      console.error(error)
      return result
    }
  },
  blockImage(check_result: any) {
    return '图片内容不当, 请重试..' + check_result.data.reduce((p: string, c: BaseObject) => p += '.' + c.msg, '')
  },
  replaceWarnString(str: string) {
    return str.replace(/香港|澳门|台湾|西藏|新疆|阿鲁恰尔邦|hong\skong|hongkong|macao|taiwan|tibet|xinjiang/ig, 'XXX')
  },
  toCamelCase(str: string) {
    return str.replace(/[-_]+([a-z])/g, function (match, letter) {
      return letter.toUpperCase()
    })
  },
  toConstantCase(str: string) {
    return str.replace(/[A-Z]/g, (match, offset) => (offset ? '_' : '') + match).toUpperCase()
  },
  getWeatherSuggestion(data: any): string {
    let key_map: {
      [key: string]: string
    } = {
      'comfort': '舒适度',
      'dressing': '穿衣',
      'flu': '感冒',
      'makeup': '化妆',
      'sunscreen': '防晒',
      'sport': '运动',
      'umbrella': '雨伞',
      'uv': '紫外线',
    }
    let str = ``
    for (let key in key_map) {
      if (data[key]) str += `${key_map[key]}:${data[key].brief},${data[key].detail};`
    }
    return str
  },
  // 处理积分 扣分和加分
  async handleIntegration({ params, user, class_name = 'AGIntegrationHistory', integration_key = 'integration' }: { params: IntegrationParams, user: LCUser, class_name: string, integration_key: string }) {
    const { action, action_id, integration = 0, remind } = params
    let point_action = action_id ? AV.Object.createWithoutData('AGAction', action_id) : action
    integration && user.increment(integration_key, integration)

    try {
      // 保存用户信息
      await user.save()
      const integration_history = new AV.Object(class_name)
      integration_history.set('action', point_action)
      integration_history.set('user', user)
      integration_history.set('integration', integration)
      remind && (typeof (remind) === 'string') && integration_history.set('remind', remind)
      let acl = new AV.ACL()
      acl.setWriteAccess(user, true)
      acl.setReadAccess(user, true)
      integration_history.setACL(acl)
      let integration_history_ret = await integration_history.save()
      return integration_history_ret
    } catch (error) {
      throw error
    }
  }
}
module.exports = rule
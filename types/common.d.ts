declare const localforage: any
declare const $: any
declare const VConsole: any
declare const Hammer: any
declare const rule: Rule

type base64 = string
type url = string

interface BaseObject {
  [key: string]: any
}

interface Function {
  before(fn: any): void,
  after(fn: any): void,
}

interface URLLibResponse {
  data: Buffer
}

interface LCRequest {
  expressReq: any,
  params: any,
  object: any,
  meta: any,
  user: any,
  currentUser: any,
  sessionToken,
}

interface LCResponse {
  code: number,
  msg: string,
  data: any,
  error?: any,
}

interface LCObject {
  id: string,
  get(id: string): any,
  set(key: string, any): any,
  add(key: string, any): any,
  increment(key: string, any): any,
  save(): Promise<any>,
  destroy(): Promise<any>,
  toJSON(): Object,
}

interface LCAuthData {
  uid?: string
  openid: string
}

interface LCUser extends LCObject {
  isAnonymous(): boolean
  associateWithAuthData(authData: LCAuthData, platform: string): Promise<LCUser | Error>
  getSessionToken(): string
}

interface LCError extends Error {
  rawMessage: string,
}

interface LCQuery {
  notEqualTo(field: string, value: any): void
  limit(num: number): void,
  skip(num: number): void,
  equalTo(field: string, value: any): void,
  greaterThan(field: string, value: any): void
  lessThan(field: string, value: any): void
  descending(field: string): void,
  ascending(field: string): void,
  include(field: string): void
  notContainedIn(field: string, value: any): void
  addDescending(field: string): void
  notContainedIn(field: string, array: string[]): void
}

interface LCRuleResponse {
  code: number,
  msg: string,
  error?: Error | string,
  data?: Object | string
}


interface integrationItem {
  temp_integration?: number,
  integration: number,
  action_id: string,
  error_action_id: string,
  error_msg?: string
}

interface IntegrationParams {
  action?: LCObject // AGAction实例
  action_id?: string,
  integration?: number
  remind?: string,
  point_user_id?: string
}
interface Rule {
  no_task: boolean,
  is_dev: boolean,
  warning_string: string,
  is_stage: boolean,
  hk_address: url,
  bj_api_address: url,
  headers: {
    'X-LC-Id': string | undefined
    'X-LC-Key': string | undefined
  },
  default_urllib_options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'PATCH',
    headers: BaseObject,
    dataType: string,
    timeout: number,
  } & BaseObject,
  KS_WRITE_NEED_INTEGRATION: { [key: string]: number },
  retHandler: (ret: URLLibResponse, key?: string) => any,
  openAIMsgSafeHandle: (text: string) => string,
  replaceWarnString: (str: string) => string,
  log: (msg: string) => void,
  success: (data: any, code?: number, msg?: string) => {
    code,
    msg,
    data,
  },
  fail: (error, code?: number, msg?: string) => {
    code,
    msg,
    error,
  },
  error: (error) => Promise<string>,
  sleep: (ms?: number = 5000) => Promise<void>,
  checkUserAgent(req: LCRequest): string,
  customCheckContent(text: string): Promise<{ suggestion: string }>,
  checkContent({ text: string }): Promise<{ suggestion: string }>,
  blockText(check_result: string): string,
  blockImage(check_result: string): string,
  toCamelCase(str: string): string,
  toConstantCase(str: string): string,
  getWeatherSuggestion(data: any): string,
  handleIntegration({ params, user, class_name = 'AGIntegrationHistory', integration_key = 'integration' }: { params: IntegrationParams, user: LCUser, class_name: string, integration_key: string }): Promise<LCObject>
}
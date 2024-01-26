interface BaiduYiyanRequestInterface { messages: { role: 'user' | 'assistant', content: string }[], user_id: string, stream?: boolean }

interface BaiduAIInterface {
  yigeTTICreate(prompt: string, access_token: string, params?: any): Promise<string>,
  yigeTTIQuery(task_id: string, access_token: string): Promise<string>,
  completions(data: BaiduYiyanRequestInterface): Promise<BaseObject>,
  yiyanCompletions(data: BaiduYiyanRequestInterface): Promise<any>,
  yiyan2JSON(yiyan_ret: BaseObject): BaseObject,
}
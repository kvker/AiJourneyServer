interface GLMMessage { role: 'user' | 'assistant', content: string }
interface GLM6BMessage { role: 'user' | 'assistant', content: string }
interface GLM6BRequestInterface { messages: GLM6BMessage[], user_id: string }

interface GLM130BMessage { role: 'user' | 'assistant', content: string }
interface GLM130BRequestInterface { messages: GLM130BMessage[], user_id: string }


interface GLMCharacterMeta {
  user_info: string
  bot_info: string
  bot_name: string
  user_name?: string
}

interface GLMMessage {
  content: string, role: 'user' | 'assistant' | 'system'
}
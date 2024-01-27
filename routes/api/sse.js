"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const router = require('express').Router();
const ZhipuAI = require('../../services/zhipuai');
const zhipuai = new ZhipuAI();
function chatglmBase(req, res, sendMessages) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(req.body)
        let needEncode = req.body.needEncode;
        try {
            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            };
            res.writeHead(200, headers);
            let time = Date.now();
            // console.log(JSON.stringify(input))
            console.log('Application对话开始');
            const response = yield zhipuai.completions(sendMessages);
            console.log({ response });
            response.data.on('data', (chunk) => {
                // console.log({ chunk })
                if (needEncode)
                    chunk = encodeURIComponent(chunk);
                res.write(chunk);
            });
            response.data.on('end', () => {
                console.log('Application对话总耗时', ~~((Date.now() - time) / 1000) + '秒');
                res.end();
            });
        }
        catch (error) {
            // console.log(error)
            res.write('GLM请求失败');
            res.end();
        }
    });
}
router.post('/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 这个是open的sse接口，限制调用次数即可
    const params = req.body;
    let { messages, context } = params;
    if (!messages || !messages.length) {
        res.status(500).send(rule.fail('消息不能为空'));
        return;
    }
    // 处理记忆
    let sendMessages = [];
    if (context) {
        sendMessages.push({
            role: 'user', content: `我现在给你补充一段上下文, 后面问答你优先找上下文内容, 找不到再从你的知识库里面找.
上下文: 【${context}】.`
        });
        sendMessages.push({ role: 'assistant', content: '好的.' });
    }
    messages.forEach((i) => {
        sendMessages.push({ role: 'user', content: i.content });
        i.answer && sendMessages.push({ role: 'assistant', content: i.answer });
    });
    if (!messages || !messages.length)
        return rule.fail('消息不能为空');
    chatglmBase(req, res, sendMessages);
}));
module.exports = router;

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
function chatglmBase(req, res, send_messages) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(req.body)
        let need_encode = req.body.need_encode;
        try {
            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            };
            res.writeHead(200, headers);
            let input = { messages: send_messages };
            let completions_data = { completions: (input) => zhipuai.completionsStdSSE(input.messages), input };
            let completions = completions_data.completions;
            input = completions_data.input;
            let time = Date.now();
            // console.log(JSON.stringify(input))
            console.log('Application对话开始');
            completions(input)
                .then((response) => {
                response.data.on('data', (chunk) => {
                    // console.log({ chunk })
                    if (need_encode)
                        chunk = encodeURIComponent(chunk);
                    res.write(chunk);
                });
                response.data.on('end', () => {
                    console.log('Application对话总耗时', ~~((Date.now() - time) / 1000) + '秒');
                    res.end();
                });
            })
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                let message = error.message || error;
                console.error({ error: message });
            }));
        }
        catch (error) {
            res.status(500).send('获取页面签名失败');
        }
    });
}
function chatglmCharacter(req, res, send_messages, meta) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(req.body)
        let need_encode = req.body.need_encode;
        try {
            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            };
            res.writeHead(200, headers);
            let input = { messages: send_messages, meta };
            let completions_data = { completions: (input) => zhipuai.completionsCharacterSSE(input.messages, input.meta), input };
            let completions = completions_data.completions;
            input = completions_data.input;
            let time = Date.now();
            // console.log(JSON.stringify(input))
            console.log('Application对话开始');
            completions(input)
                .then((response) => {
                // console.log(response)
                response.data.on('data', (chunk) => {
                    // console.log({ chunk })
                    if (need_encode)
                        chunk = encodeURIComponent(chunk);
                    res.write(chunk);
                });
                response.data.on('end', () => {
                    console.log('Application对话总耗时', ~~((Date.now() - time) / 1000) + '秒');
                    res.end();
                });
            })
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                let message = error.message || error;
                console.error({ error: message });
                res.end();
            }));
        }
        catch (error) {
            res.status(500).send('获取页面签名失败');
        }
    });
}
const chat_open = {
    times: 0, // 下面接口调用的计数器
    max_times: 10000, // 最大调用次数
    yestoday: new Date().getDate(), // 昨天的日期
    today: new Date().getDate(), // 今天的日期
};
router.post('/chat/open', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 每天清空次数，如果超过最大次数则返回rule.fail('超过最大调用次数')
    chat_open.today = new Date().getDate();
    if (chat_open.today !== chat_open.yestoday) {
        chat_open.times = 0;
        chat_open.yestoday = chat_open.today;
    }
    if (chat_open.times > chat_open.max_times) {
        return res.status(500).send(rule.fail('超过最大调用次数'));
    }
    // 这个是open的sse接口，限制调用次数即可
    const params = req.body;
    let { messages, context } = params;
    // 处理记忆
    let send_messages = [];
    if (context) {
        send_messages.push({
            role: 'user', content: `我现在给你补充一段上下文, 后面问答你优先找上下文内容, 找不到再从你的知识库里面找.
上下文: 【${context}】.`
        });
        send_messages.push({ role: 'assistant', content: '好的.' });
    }
    messages.forEach((i) => {
        send_messages.push({ role: 'user', content: i.content });
        i.answer && send_messages.push({ role: 'assistant', content: i.answer });
    });
    if (!messages || !messages.length)
        return rule.fail('消息不能为空');
    chatglmBase(req, res, send_messages);
}));
router.post('/chatglm/std', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.body;
    let { messages, context } = params;
    // 处理记忆
    let send_messages = [];
    if (context) {
        send_messages.push({
            role: 'user', content: `我现在给你补充一段上下文, 后面问答你优先找上下文内容, 找不到再从你的知识库里面找.
上下文: 【${context}】.`
        });
        send_messages.push({ role: 'assistant', content: '好的.' });
    }
    messages.forEach((i) => {
        send_messages.push({ role: 'user', content: i.content });
        i.answer && send_messages.push({ role: 'assistant', content: i.answer });
    });
    if (!messages || !messages.length)
        return rule.fail('消息不能为空');
    chatglmBase(req, res, send_messages);
}));
router.post('/chatglm/character', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.body;
    let { messages, meta } = params;
    console.log(meta);
    if (!messages || !messages.length || !meta) {
        res.status(500).send(rule.fail('参数错误'));
        return;
    }
    // 处理记忆
    let send_messages = [];
    messages.forEach((i) => {
        send_messages.push({ role: 'user', content: i.content });
        i.answer && send_messages.push({ role: 'assistant', content: i.answer });
    });
    chatglmCharacter(req, res, send_messages, meta);
}));
module.exports = router;

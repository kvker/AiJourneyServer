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
const axios = require('axios');
module.exports = class ZhipuAI {
    constructor() {
        this.Url = 'https://open.bigmodel.cn/api/paas/v3/model-api/chatglm_turbo/invoke';
        this.SSEUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    }
    getAccessToken() {
        return axios(rule.bj_api_address + '/api/access_token/zhipuai')
            .then((ret) => {
            console.log(ret.data.data);
            return ret.data.data;
        });
    }
    completions(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessToken = yield this.getAccessToken();
            // console.log(params)
            // console.log(this.SSEUrl)
            const data = {
                model: "glm-3-turbo",
                messages,
                max_tokens: 4096,
                stream: true,
            };
            console.log(JSON.stringify(data));
            return yield axios.post(this.SSEUrl, data, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": accessToken,
                },
                responseType: 'stream',
            });
        });
    }
    GLM2String(glm_ret) {
        let data = glm_ret.data.data;
        // console.log(data)
        if (glm_ret.data.code !== 200) {
            console.error(glm_ret.data);
            console.error('GLM官方返回的错误');
            throw glm_ret.data;
        }
        let content = data.choices[0].content;
        return content.replace(/\\+n/g, '\n').replace(/\\+/g, '').replace(/\\"/g, '"').replace(/^[\s*\"\s*]*|[\s*\"\s*]*$/g, '');
    }
    // GLM返回的JSON字符串转JSON，这里返回的是Object
    GLM2JSON(glm_ret) {
        let data = glm_ret.data.data;
        if (glm_ret.data.code !== 200) {
            console.error(glm_ret.data);
        }
        let content = data.choices[0].content;
        // console.log(content)
        content = content.replace(/\\n|\\\\|^[^\{\s]*"|"[^\}\s]*$/g, '');
        content = content.replace(/\\"/g, '"');
        // console.log(content)
        // 部分出现]---[奇怪的结构
        content = content.split(/-+/)[1] || content;
        return JSON.parse(content);
    }
    // GLM返回的JSON字符串转JSON，这里返回的是Array
    GLM2JSONArray(glm_ret) {
        let data = glm_ret.data.data;
        if (glm_ret.data.code !== 200) {
            console.error(glm_ret.data);
        }
        let content = data.choices[0].content.trim();
        content = content.replace(/\\n/g, '\n');
        console.log(content);
        console.log('转JSON的原始字符串');
        let result = [];
        let temp_item;
        let ss = content.split('\n');
        ss.forEach(s => {
            if (!s)
                return;
            s = s.trim();
            s = s.replace(/^["']\s*/, ''); // 奇怪的引号删除
            console.log(s);
            let is_sub = s.match(/^[1|2|3|4|5|6|7|8|9|0]/);
            if (is_sub) {
                temp_item.subs.push({ title: s });
            }
            else {
                // 大目录得是汉字开头
                let is_cn = s.match(/^第*[一|二|三|四|五|六|七|八|九|十]/);
                console.log({ is_cn: !!is_cn });
                temp_item = {
                    title: s,
                };
                if (is_cn) {
                    temp_item.subs = [];
                }
                else {
                    console.warn('莫名奇妙的标题，需要排查');
                }
                result.push(temp_item);
            }
        });
        console.log(result);
        console.log('格式化后的JSON');
        return result;
    }
};

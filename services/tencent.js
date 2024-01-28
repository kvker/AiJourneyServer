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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AsrClient = tencentcloud.asr.v20190614.Client;
const tencentcloudtts = require("tencentcloud-sdk-nodejs-tts");
const crypto = require("crypto");
const COS = require('cos-nodejs-sdk-v5');
const https_1 = __importDefault(require("https"));
const buffer_1 = require("buffer");
const cos_config = {
    bucket: 'contentsafe-1251835910',
    region: 'ap-beijing'
};
const AKSK = {
    SecretId: process.env.TencentSDKSecretId,
    SecretKey: process.env.TencentSDKSecretKey,
    Domain: `https://${cos_config.bucket}.cos.${cos_config.region}.myqcloud.com`,
};
const cos = new COS(AKSK);
const TtsClient = tencentcloudtts.tts.v20190823.Client;
class TencentSdk {
    constructor() {
        this.config = {
            secretId: AKSK.SecretId,
            secretKey: AKSK.SecretKey,
        };
    }
    voice2Text(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { voiceType, base64, fileSize, } = params;
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
            };
            const client = new AsrClient(clientConfig);
            const data = {
                "EngSerViceType": "16k_zh",
                "SourceType": 1,
                "VoiceFormat": voiceType,
                "Data": base64,
                "DataLen": fileSize,
            };
            try {
                let ret = yield client.SentenceRecognition(data).then((data) => {
                    console.log(data);
                    return data;
                }, (err) => {
                    console.error("error", err);
                    return Promise.reject(err);
                });
                return ret;
            }
            catch (error) {
                throw error;
            }
        });
    }
    text2Voice(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { Text, Volume, Speed, VoiceType, Codec, EmotionCategory, EmotionIntensity } = params;
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
            };
            const client = new TtsClient(clientConfig);
            let data = {
                SessionId: crypto.randomUUID(),
                Text,
                Volume,
                Speed,
                VoiceType,
                Codec,
            };
            if (EmotionCategory) {
                data.EmotionCategory = EmotionCategory;
                data.EmotionIntensity = EmotionIntensity || 100;
            }
            console.log('语音合成参数', data);
            return (yield client.TextToVoice(data)).Audio;
        });
    }
    longText2Voice(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { Text, Volume, Speed, VoiceType, Codec, EmotionCategory, EmotionIntensity } = params;
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
            };
            const client = new TtsClient(clientConfig);
            let data = {
                Text, Volume, Speed, VoiceType, Codec,
                ModelType: 1,
                // CallbackUrl: 'https://api.kvker.com/api/tencent/longText2VoiceCallback'
            };
            if (EmotionCategory) {
                data.EmotionCategory = EmotionCategory;
                data.EmotionIntensity = EmotionIntensity || 100;
            }
            console.log('长文本语音合成参数', data);
            let ret = yield client.CreateTtsTask(data);
            // 查询结果
            for (const iterator of new Array(12)) {
                ret = yield this.getTtsStatus(ret.Data.TaskId);
                console.log(ret);
                if (ret.Data.Status === 2) {
                    break;
                }
                yield new Promise((resolve) => {
                    setTimeout(() => {
                        resolve('');
                    }, 5000);
                });
            }
            // ret.Data.ResultUrl 提供的有效时间只有1天,千万注意
            const base64 = yield this.url2Base64(ret.Data.ResultUrl);
            return base64;
        });
    }
    url2Base64(url) {
        return new Promise((resolve, reject) => {
            https_1.default.get(url, (res) => {
                const data = [];
                res.on('data', (chunk) => data.push(chunk));
                res.on('end', () => resolve(buffer_1.Buffer.concat(data).toString('base64')));
                res.on('error', reject);
            });
        });
    }
    getTtsStatus(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
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
            };
            const client = new TtsClient(clientConfig);
            return yield client.DescribeTtsTaskStatus({ TaskId: taskId });
        });
    }
    /**
   * 腾讯同步文字审核, 数字万象
   * @param text 需要审核的文字
   * @returns Primise 原始数据
   */
    postTextContentAuditing(text) {
        const host = cos_config.bucket + '.ci.' + cos_config.region + '.myqcloud.com';
        const key = 'text/auditing'; // 固定值，必须
        const url = `https://${host}/${key}`;
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
        });
        return new Promise((resolve, reject) => {
            cos.request({
                Method: 'POST', // 固定值，必须
                Url: url, // 请求的url，必须
                Key: key, // 固定值，必须
                ContentType: 'application/xml', // 固定值，必须
                Body: body // 请求体参数，必须
            }, function (err, data) {
                if (err) {
                    // 处理请求失败
                    console.log(err);
                    reject(err);
                }
                else {
                    // 处理请求成功
                    // console.log(data.Response)
                    resolve(data.Response);
                }
            });
        });
    }
}
module.exports = TencentSdk;

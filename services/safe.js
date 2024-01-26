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
/**
 * 本模块主要处理安全通用接口
 */
const urllib = require('urllib');
const crypto = require('crypto');
module.exports = class Safe {
    getDouyinAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield urllib.request(rule.bj_api_address + '/api/access_token/douyin', {
                dataType: 'json',
            });
            return ret.data.data;
        });
    }
    checkText(text) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!text) {
                let ret = {
                    suggestion: 'block',
                    "code": 9999, "msg": "传入text错误",
                    text,
                };
                console.log(ret);
                return ret;
            }
            let date = Date.now();
            var genSignature = function (secretKey, paramsJson) {
                var sorter = function (paramsJson) {
                    var sortedJson = {};
                    var sortedKeys = Object.keys(paramsJson).sort();
                    for (var i = 0; i < sortedKeys.length; i++) {
                        sortedJson[sortedKeys[i]] = paramsJson[sortedKeys[i]];
                    }
                    return sortedJson;
                };
                var sortedParam = sorter(paramsJson);
                var needSignatureStr = "";
                for (var key in sortedParam) {
                    var value = sortedParam[key];
                    needSignatureStr = needSignatureStr + key + value;
                }
                needSignatureStr += secretKey;
                var md5er = crypto.createHash('md5'); //MD5加密工具
                md5er.update(needSignatureStr, "UTF-8");
                return md5er.digest('hex');
            };
            let data = {
                'secretId': '918cad7cd793a061ba05f7349e82ae5c',
                'businessId': 'ac8ca1ca2d572885e858fd0958055ffd',
                'timestamp': date,
                'nonce': date,
                'dataId': date,
                'content': text,
                'version': 'v5.3'
            };
            let ret = yield urllib.request('http://as.dun.163.com/v5/text/check', Object.assign(Object.assign({}, rule.default_urllib_options), { headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }, method: 'POST', data: Object.assign(Object.assign({}, data), { signature: genSignature('ec6c4c411444de66eb00896b7d6ab5db', data) }), dataType: 'json' }));
            let ret_result = ret.data.result;
            if (!ret_result) {
                console.log({ text });
                console.log(JSON.stringify(ret.data));
                return Object.assign({ suggestion: 'block' }, ret.data);
            }
            let suggestion = (_a = ret.data.result) === null || _a === void 0 ? void 0 : _a.antispam.suggestion;
            // 可能为空,必须判断
            let result;
            if (suggestion === 0) {
                result = {
                    suggestion: 'pass',
                    // ...ret.data.result,
                };
            }
            else {
                let detail_data = ret_result.antispam.labels[0].subLabels[0];
                let label_map = {
                    '100001': "色情其他",
                    '100002': "色情资源",
                    '100003': "性器官",
                    '100004': "色情聊骚",
                    '100006': "性行为",
                    '100376': "性用品",
                    '10000640': "色情人物",
                    '10000617': "性癖好",
                    '10000618': "儿童色情",
                    '100005': "色情低俗段子",
                    '100007': "色情舆情事件",
                    '100008': "色情交友类",
                    '100147': "色情交友类-低俗隐晦",
                    '10000616': "BDSM",
                    '100235': "成人色情（海外版）",
                    '100236': "儿童色情（海外版）",
                    '200009': "引流广告",
                    '200268': "社交广告",
                    '20000709': "游戏广告",
                    '20000694': "招聘广告",
                    '20000695': "金融广告",
                    '20000696': "电商微商",
                    '20000697': "教育培训",
                    '20000698': "医院广告",
                    '20000699': "旅游广告",
                    '20000700': "音乐广告",
                    '20000704': "流量造假",
                    '20000706': "影视资源",
                    '200144': "房产广告",
                    '200011': "刷量广告",
                    '200012': "广告其他",
                    '200010': "广告法",
                    '260052': "广告法-涉医疗用语",
                    '260053': "广告法-迷信用语",
                    '260054': "广告法-需要凭证",
                    '260055': "广告法-限时性用语",
                    '260056': "广告法-涉嫌诱导消费者",
                    '260057': "广告法-涉嫌欺诈消费者",
                    '260058': "广告法-法律风险较高",
                    '260059': "广告法-极限词",
                    '260279': "广告法-价格夸大营销",
                    '260280': "广告法-效果性承诺或保证",
                    '260281': "广告法-网络营销涉嫌欺诈",
                    '260282': "广告法-权威性用语",
                    '30000294': "暴恐人物",
                    '30000295': "恐怖组织",
                    '30000296': "暴恐事件",
                    '30000297': "极端主义",
                    '300016': "暴恐其他",
                    '400017': "违禁其他",
                    '400273': "违禁物品",
                    '400274': "赌博",
                    '400275': "违禁工具",
                    '400276': "违禁行为",
                    '400277': "违禁毒品",
                    '400446': "欺诈",
                    '400459': "违禁人物",
                    '40000629': "违禁化学品",
                    '40000630': "违禁药品",
                    '40000631': "违禁作品",
                    '40000632': "野生动植物买卖",
                    '40000633': "个人隐私",
                    '40000634': "儿童邪典",
                    '40000635': "恐怖灵异",
                    '400238': "暴力血腥（海外版）",
                    '400239': "危害人身安全（海外版）",
                    '400240': "管制物品（海外版）",
                    '400241': "欺诈（海外版）",
                    '400242': "自杀自残（海外版）",
                    '400243': "剥削劳动力（海外版）",
                    '500013': "涉政其他",
                    '500014': "敏感专项",
                    '500015': "严格涉政",
                    '500040': "核心领导人",
                    '500070': "一号领导人",
                    '500041': "英雄烈士",
                    '500042': "邪教迷信",
                    '500043': "落马官员",
                    '500044': "舆情事件",
                    '500045': "政治综合",
                    '500214': "宗教相关",
                    '500377': "国外领导人相关",
                    '500378': "知名人物",
                    '50000635': "国内领导人相关",
                    '50000636': "政治违禁作品",
                    '50000637': "反动分裂",
                    '50000638': "政治运动",
                    '50000639': "社会事件",
                    '50000640': "国际局势",
                    '50000641': "涉国家机关",
                    '50000642': "涉军警",
                    '50000643': "政治经济关联人物",
                    '50000644': "政治用语表述不规范",
                    '500245': "仇恨宗教（海外版）",
                    '500234': "仇恨言论（海外版）",
                    '500039': "时事报道（海外版）",
                    '600018': "人身攻击",
                    '60000547': "祖安谩骂",
                    '60000548': "地域黑",
                    '60000549': "饭圈互撕",
                    '600383': "口头禅谩骂",
                    '600379': "谩骂其他",
                    '700019': "灌水其他",
                    '700355': "中文无意义",
                    '700356': "英文无意义",
                    '70000532': "乱码无意义",
                    '900020': "其他",
                    '1100101': "涉价值观其他",
                    '1100102': "拜金炫富",
                    '1100103': "吃播（涉夸张浪费）",
                    '1100104': "涉黑相关",
                    '1100105': "腐文化相关",
                    '1100106': "自杀自残",
                    '1100107': "封建迷信",
                    '1100380': "劣迹艺人相关",
                    '110000635': "同性交友",
                    '110000636': "未成年相关",
                };
                result = Object.assign(Object.assign({ suggestion: 'block' }, ret.data.result), { labels: detail_data.details ? detail_data.details.hitInfos.map((i) => i.value) : [label_map[detail_data.secondLabel]] });
                console.log(JSON.stringify(result));
            }
            console.log('内容审核信息：' + date);
            return result;
        });
    }
    checkTextDouyin(text) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(text)
            // let { tasks } = req.params
            // let access_token = await getAccessToken()
            // return urllib.request('https://developer.toutiao.com/api/v2/tags/text/antidirt', {
            //   method: 'POST',
            //   headers: {
            //     'X-Token': access_token,
            //     'content-type': 'application/json'
            //   },
            //   data: {
            //     tasks,
            //   }
            // }).then(ret => {
            //   let { predicts } = rule.retHandler(ret).data[0]
            //   let hit = !!predicts.find(i => i.hit)
            //   return rule.success({ hit })
            // })
        });
    }
    checkImageDouyin(url, second = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log({url})
            let access_token = yield this.getDouyinAccessToken();
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
                .then((ret) => {
                let data = ret.data;
                // console.log('图片校验data', url, data)
                if (data.error || !data.predicts) {
                    throw new Error('调用错误, 请重试');
                }
                else {
                    return data;
                }
            })
                .catch((err) => {
                throw err;
            });
        });
    }
};

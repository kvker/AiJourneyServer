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
const TencentSdk = require('../../services/tencent');
const tencentSdk = new TencentSdk();
router.post('/txVoice2Text', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.body;
    let { base64, file_size, voice_type = 'wav' } = params;
    if (!base64 || !file_size) {
        res.status(500).send(rule.fail('参数错误'));
        return;
    }
    try {
        let ret = yield tencentSdk.voice2Text({ base64, file_size, voice_type });
        res.send(rule.success(ret));
    }
    catch (error) {
        res.status(400).send(error);
    }
}));
router.post('/txText2Voice', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = req.body;
    let { text, volume = 1, speed = 0, voice_type = '10510000', codec = 'wav', } = params;
    if (!text) {
        res.status(500).send(rule.fail('参数错误'));
        return;
    }
    try {
        let ret = yield tencentSdk.text2Voice({
            Text: text,
            Volume: volume,
            Speed: speed,
            VoiceType: voice_type,
            Codec: codec,
        });
        res.send(rule.success(ret));
    }
    catch (error) {
        res.status(400).send(error);
    }
}));
module.exports = router;

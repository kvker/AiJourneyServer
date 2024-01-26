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
const weather_service = require('../../services/weather');
const weather = new weather_service();
router.post('/weather', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type = 'weather', params = {} } = req.body;
    try {
        let ret;
        switch (type) {
            case 'weather':
                ret = yield weather.getWeather(params.location, params.data);
                break;
            case 'suggestion':
                ret = yield weather.getSuggestion(params.location, params.data);
                break;
            case 'chinese_calendar':
                ret = yield weather.getChineseCalendar(params.location, params.data);
                break;
            default:
                break;
        }
        res.send(rule.success(ret));
    }
    catch (error) {
        res.status(500).send(rule.fail(error));
    }
}));
module.exports = router;

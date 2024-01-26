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
module.exports = class Weather {
    completions(location, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios.get(params.url, {
                params: Object.assign({ location, "key": process.env.SeniverseKEY }, (params.extar_data || {}))
            }, Object.assign({ headers: Object.assign({}, params.headers), timeout: 300000 }, params.options));
            return response.data;
        });
    }
    getSuggestion(location, { language = 'zh-Hans', day = 1 } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.completions(location, {
                url: 'https://api.seniverse.com/v3/life/suggestion.json', headers: {}, options: {}, extar_data: {
                    language,
                    day
                }
            });
        });
    }
    getWeather(location, { language = 'zh-Hans', unit = 'c' } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.completions(location, {
                url: 'https://api.seniverse.com/v3/weather/now.json', headers: {}, options: {}, extar_data: {
                    language,
                    unit
                }
            });
        });
    }
    getChineseCalendar(location, { language = 'zh-Hans', start = 0, days = 1 } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.completions(location, {
                url: 'https://api.seniverse.com/v3/life/chinese_calendar.json', headers: {}, options: {}, extar_data: {
                    language,
                    start,
                    days
                }
            });
        });
    }
};

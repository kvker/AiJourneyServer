"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require('crypto');
const md5 = require('md5');
class Auth {
    constructor() {
        console.log('启动 auth 服务');
    }
    generateToken(length = 32) {
        // 生成随机字符串
        let randomString = crypto.getRandomValues(new Uint32Array(length)).reduce((p, c) => p += String.fromCharCode(c % 128), '');
        // console.log(randomString)
        // 生成随机盐值
        const salt = crypto.getRandomValues(new Uint32Array(16)).reduce((p, c) => p += String.fromCharCode(c % 128), '');
        // console.log(salt)
        // 将随机字符串和盐值连接起来
        const combined = randomString + salt;
        // console.log(combined)
        const token = md5(combined);
        // console.log(token)
        return token;
    }
}
module.exports = new Auth();

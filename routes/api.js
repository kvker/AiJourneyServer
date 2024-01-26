"use strict";
const express = require('express');
const router = express.Router();
const sse = require('./api/sse');
const weather = require('./api/weather');
const tencent = require('./api/tencent');
const chat = require('./api/chat');
router.get('/awaken', () => {
    return rule.success({ msg: 'awaken success' });
});
router.use('/sse', sse);
router.use('/weather', weather);
router.use('/tencent', tencent);
router.use('/chat', chat);
module.exports = router;

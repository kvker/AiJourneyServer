const express = require('express')
const router = express.Router()

router.get('/', function (req, res, next) {
  res.send('Hello World!')
})

router.get('/404', function (req, res, next) {
  res.send('404', {})
})

module.exports = router

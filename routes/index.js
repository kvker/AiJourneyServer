const express = require('express')
const router = express.Router()

router.get('/', function (req, res, next) {
  res.render('index', { title: 'template title' })
})

router.get('/demo/scroll-images/', function (req, res, next) {
  res.render('demo/scroll-images', {})
})

router.get('/404', function (req, res, next) {
  res.render('404', {})
})

module.exports = router

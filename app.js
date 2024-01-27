const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
// const timeout = require('connect-timeout')

const AV = require('leanengine')

// 注意，这里由于最早从B端服务分流出来统一使用，所以这里默认的是B端的配置，如果需要使用A端的配置，需要在.env中配置或者用lean up启动项目
let options = {
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY,
  serverURL: process.env.LEANCLOUD_API_SERVER,
}

AV.init(options)

// Comment the following line if you do not want to use masterKey.
AV.Cloud.useMasterKey()

const indexRouter = require('./routes/index')
const apiRouter = require('./routes/api')

// 需要在LC初始化后面
// require('./services/longtext/longtext')

const env = process.env
const is_dev = env.NODE_ENV === 'development'
console.log('is_dev: ', is_dev)

require('./rule.js')
const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// app.use(timeout('300s'))
app.use(logger('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true,limit:'10mb' }))
app.use(cookieParser())
// app.use(express.static(path.join(__dirname, 'public')))

// express放行跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

app.options('*', function (req, res) {
  res.sendStatus(200)
})

app.use('/', indexRouter)
app.use('/api', apiRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('404')
})

module.exports = app

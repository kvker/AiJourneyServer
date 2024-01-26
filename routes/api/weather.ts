export { }

import { Request, Response } from "express"
const router = require('express').Router()

const weather_service = require('../../services/weather')

const weather = new weather_service()
router.post('/weather', async (req: Request, res: Response) => {
  const { type = 'weather', params = {} } = req.body
  try {
    let ret
    switch (type) {
      case 'weather':
        ret = await weather.getWeather(params.location, params.data)
        break
      case 'suggestion':
        ret = await weather.getSuggestion(params.location, params.data)
        break
      case 'chinese_calendar':
        ret = await weather.getChineseCalendar(params.location, params.data)
        break
      default:
        break
    }
    res.send(rule.success(ret))
  } catch (error) {
    res.status(500).send(rule.fail(error))
  }
})


module.exports = router
export { }

const axios = require('axios')

interface WeatherInterface {
  getSuggestion(location: string): Promise<any>
}

interface WeatherParams {
  location: string
  unit: 'c' | 'f'
  language: 'zh-Hans' | 'zh-Hant' | 'en' | 'ja' | 'de' | 'fr' | 'es' | 'pt' | 'hi' | 'id' | 'ru' | 'th' | 'ar'
  scope: 'city' | 'all'
  start: string
}

module.exports = class Weather implements WeatherInterface {
  async completions(location: WeatherParams["location"], params: { url: string, headers: Object, options: Object, extar_data?: Object }): Promise<any> {
    const response = await axios.get(params.url, {
      params: {
        location,
        "key": process.env.SeniverseKEY,
        ...(params.extar_data || {})
      }
    }, {
      headers: {
        ...params.headers,
      },
      timeout: 300000,
      ...params.options,
    })

    return response.data
  }

  async getSuggestion(location: WeatherParams["location"], { language = 'zh-Hans', day = 1 } = {}) {
    return this.completions(location, {
      url: 'https://api.seniverse.com/v3/life/suggestion.json', headers: {}, options: {}, extar_data: {
        language,
        day
      }
    })
  }
  async getWeather(location: WeatherParams["location"], { language = 'zh-Hans', unit = 'c' } = {}) {
    return this.completions(location, {
      url: 'https://api.seniverse.com/v3/weather/now.json', headers: {}, options: {}, extar_data: {
        language,
        unit
      }
    })
  }
  async getChineseCalendar(location: WeatherParams["location"], { language = 'zh-Hans', start = 0, days = 1 } = {}) {
    return this.completions(location, {
      url: 'https://api.seniverse.com/v3/life/chinese_calendar.json', headers: {}, options: {}, extar_data: {
        language,
        start,
        days
      }
    })
  }
}
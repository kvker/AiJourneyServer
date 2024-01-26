export { }
const TencentSdk = require('./tencent')
const tencent_sdk = new TencentSdk()
const AV = require('leanengine')
let voice_task: {
  [key: string]: ResultQueue
} = {}

function splitTextIntoSegments(text: string, maxSegmentLength: number) {
  const priorityEndingSymbols = "!?。！？"
  const secondaryEndingSymbols = "，,"
  const segments = []
  let currentSegment = ""

  for (let i = 0; i < text.length; i++) {
    currentSegment += text[i]
    if (currentSegment.length >= maxSegmentLength || (i === text.length - 1 && currentSegment.length > 0)) {
      let lastChar = currentSegment[currentSegment.length - 1]

      if (priorityEndingSymbols.includes(lastChar)) {
        // Use priority ending symbols and reset currentSegment
        segments.push(currentSegment)
        currentSegment = ""
      } else if (secondaryEndingSymbols.includes(lastChar)) {
        // Use secondary ending symbols and reset currentSegment
        segments.push(currentSegment)
        currentSegment = ""
      } else {
        // Backtrack to find an ending symbol or split at maxSegmentLength
        let backtrackingIndex = currentSegment.length - 2
        while (backtrackingIndex >= 0 && !priorityEndingSymbols.includes(currentSegment[backtrackingIndex]) && !secondaryEndingSymbols.includes(currentSegment[backtrackingIndex])) {
          backtrackingIndex--
        }
        if (backtrackingIndex >= 0) {
          segments.push(currentSegment.substring(0, backtrackingIndex + 1))
          currentSegment = currentSegment.substring(backtrackingIndex + 1)
        } else {
          // If no ending symbol is found, split at maxSegmentLength
          segments.push(currentSegment)
          currentSegment = ""
        }
      }
    }
  }
  return segments
}

function handleVoiceText({ text, lc_object, current_set_index, task_index, res, voice_params, end = false }: { text: string, lc_object: LCObject, current_set_index: number, task_index: number, res: any, voice_params: any, end: boolean }): { current_set_index: number, task_index: number } {
  // 处理文本 文本超出80的时候进行判断切分 结束后的最后一个直接全部处理
  let handle_text = text.slice(current_set_index)
  if (!end && handle_text.length < 50) {
    return { current_set_index, task_index }
  } else if (end) {
    if (!voice_task[lc_object.id]) {
      voice_task[lc_object.id] = new ResultQueue()
    }
    let last_text = handle_text.replace(/\\n|[“”]/g, '')
    if (!last_text.length) {
      // 设置定时器 直到没有这个lc对象处理加载中的
      voice_task[lc_object.id].addResult({
        index: task_index,
        result: '',
        callback: () => {
          delete voice_task[lc_object.id]
          lc_object.set('voice_status', 1)
          lc_object.save()
          res.write('\n\nvoice_end')
          res.end()
        }
      })
      return { current_set_index: 0, task_index: 0 }
    }
    tencent_sdk.text2Voice({
      Text: last_text,
      Volume: voice_params.volume || 0,
      Speed: voice_params.speed || 0,
      VoiceType: voice_params.voice_type || 10510000,
      Codec: voice_params.codec || 'wav',
    }).then(async (voice_result: any) => {
      const file = new AV.File('TXT2Voice-' + Date.now() + ".wav", {
        base64: voice_result.Audio
      })
      return file.save()
    })
      .then(async (file_res: any) => {
        let url = file_res.toJSON().url
        voice_task[lc_object.id].addResult({
          index: task_index,
          result: encodeURIComponent(url),
          callback: () => {
            lc_object.add(`voice_data`, { current_index: current_set_index, url, point_text: handle_text })
            lc_object.set('voice_status', 1)
            lc_object.save()
            res.write('voice_url:' + encodeURIComponent(url))
            res.write('\n\nvoice_end')
            res.end()
          }
        })
      })
      .catch((error: Error) => {
        voice_task[lc_object.id].addResult({
          index: task_index,
          result: '',
          callback: () => {
            let message = error.message || error
            console.error({ error: message })
            lc_object.set('voice_status', -1)
            lc_object.set('voice_error', message)
            lc_object.save()
            delete voice_task[lc_object.id]
            res.write('\n\nvoice_end')
            res.end()
          }
        })
      })
    return { current_set_index: 0, task_index: 0 }
  } else {
    let [point_text, ...[]] = splitTextIntoSegments(handle_text, 50)
    if (!voice_task[lc_object.id]) {
      voice_task[lc_object.id] = new ResultQueue()
    }
    tencent_sdk.text2Voice({
      Text: point_text.replace(/\\n|[“”]/g, ''),
      Volume: voice_params.volume || 0,
      Speed: voice_params.speed || 0,
      VoiceType: voice_params.voice_type || 10510000,
      Codec: voice_params.codec || 'wav',
    }).then(async (voice_result: any) => {
      const file = new AV.File('TXT2Voice-' + Date.now() + ".wav", {
        base64: voice_result.Audio
      })
      return file.save()
    })
      .then(async (file_res: any) => {
        let url = file_res.toJSON().url
        voice_task[lc_object.id].addResult({
          index: task_index,
          result: encodeURIComponent(url),
          callback: () => {
            lc_object.add(`voice_data`, { current_index: current_set_index, url, point_text })
            lc_object.save()
            res.write('voice_url:' + encodeURIComponent(url) + '\n\n')
          }
        })
      })
      .catch((error: Error) => {
        let message = error.message || error
        console.error({ error: message })
        lc_object.set('voice_status', -1)
        lc_object.set('voice_error', message)
        lc_object.save()
      })
    return { current_set_index: current_set_index + point_text.length, task_index: task_index + 1 }
  }
}

function handleLongText({ text, lc_object, voice_params }: { text: string, lc_object: LCObject, voice_params: any, }): Promise<{ url: string }[]> {
  let text_list = splitTextIntoSegments(text, 50)
  console.log(text_list)
  let id = Date.now() + lc_object.id
  voice_task[id] = new ResultQueue()
  let voice_list: { index: number, url: string, point_text: string }[] = []
  return new Promise((resolve, reject) => {
    function handleSplitText(index: number) {
      let split_text = text_list[index]
      tencent_sdk.text2Voice({
        Text: split_text.replace(/\\n|[“”]/g, ''),
        Volume: voice_params.volume || 0,
        Speed: voice_params.speed || 0,
        VoiceType: voice_params.voice_type || 10510000,
        Codec: voice_params.codec || 'wav',
      }).then(async (voice_result: any) => {
        const file = new AV.File('LONGTXT2Voice-' + Date.now() + lc_object.id + ".wav", {
          base64: voice_result.Audio
        })
        return file.save()
      })
        .then(async (file_res: any) => {
          let url = file_res.toJSON().url
          voice_task[id].addResult({
            index: index,
            result: url,
            callback: () => {
              voice_list.push({
                index,
                point_text: split_text,
                url
              })
              if (index === text_list.length - 1) {
                delete voice_task[id]
                resolve(voice_list)
              } else {
                handleSplitText(index + 1)
              }
            }
          })
        })
        .catch((error: Error) => {
          let message = error.message || error
          console.error({ error: message })
          reject(message)
        })
    }
    handleSplitText(0)
  })
}
interface TaskResult {
  index: number
  result: any
  callback?: Function
}

class ResultQueue {
  private results: Map<number, any> = new Map()
  private last_processed_index: number = -1

  addResult({ index, result, callback }: TaskResult) {
    if (index === this.last_processed_index + 1) {
      // If the index is in order, directly invoke the callback
      this.invokeCallbacks(result, callback)
      this.last_processed_index = index

      // Check if there are pending results that can now be processed
      this.invokePendingCallbacks()
    } else {
      // If the index is not in order, store the result and wait for the in-order index
      this.results.set(index, { result, callback })
    }
  }

  private invokePendingCallbacks() {
    while (this.results.has(this.last_processed_index + 1)) {
      // If there are pending results, process them in order
      const next_index = this.last_processed_index + 1
      const { result, callback } = this.results.get(next_index) || {}
      this.invokeCallbacks(result, callback)
      this.results.delete(next_index)
      this.last_processed_index = next_index
    }
  }

  private invokeCallbacks(result: any, callback?: Function) {
    callback && callback(result)
  }
}
module.exports = {
  splitTextIntoSegments,
  handleVoiceText,
  handleLongText
}

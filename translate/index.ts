import axios, { AxiosInstance } from 'axios'
import * as md5 from 'spark-md5'
import * as  lodash from 'lodash'
import html2texts from './html2texts'
import * as render from 'posthtml-render'
import { htmlDecode, htmlEncode } from './htmlEncode'

declare interface TranslateOpitons {
  appid?: string
  secret?: string
  from?: string
  to?:string
}

export default class Translate {
  instanceCount: number = 0 // 当前请求数量
  maxInstanceCount: number = 10 // 最大请求数量
  totalInstanceCount: number = 0 // 总共剩余的请求数量
  private url: string = 'http://api.fanyi.baidu.com/api/trans/vip/translate'
  private appid: string
  private secret: string
  private instance: AxiosInstance
  from: string
  to: string
  
  constructor(translateOpitons?: TranslateOpitons) {
    this.appid = "20201215000647582"
    this.secret = "0IfZkeEAc8PkRIseU_7y"
    if (translateOpitons && translateOpitons.appid && translateOpitons.secret) {
      this.appid = translateOpitons.appid
      this.secret = translateOpitons.secret
    }
    this.from = 'zh'
    this.to = 'en'
    if (translateOpitons && translateOpitons.from && translateOpitons.to) {
      this.from = translateOpitons.from
      this.to = translateOpitons.to
    }
    this.instance = axios.create({ baseURL: this.url })
    this.interceptors()
  }

  async trans(words: string,from?: string,to?: string): Promise<string[]> {
    if (words.match(/^\s*$/)) return [words]
    from ? this.from = from : 0
    to ? this.to = to : 0
    const salt = Date.now();
    const sign = md5.hash(`${this.appid}${words}${salt}${this.secret}`);
    let {data} = await this.instance({
      params: {
        q: words,
        from: this.from ,
        to: this.to,
        appid: this.appid,
        salt:salt,
        sign:sign
      }
    })
    if (data.error_code && data.error_code == 52001) {
      console.log(words,data.error_code,words.length);
      return await this.trans(words)
    }
    if (data.error_code) {
      console.log(words,data.error_code,words.length);
      throw new Error('tranlate Error:' + data.error_code + '|||' + data.error_msg)
    }
    
    return data.trans_result.map(v => v.dst)
  }

	async transHtml(html: string) {
		const { texts } = html2texts(html)
    const localTexts = texts.map(({ text }) => {
      return { origin: text, local: '' }
    })
    let words = localTexts.reduce((pre, cur) => {
      if (cur.origin.match(/\&.+\;?/)) {
        cur.origin = cur.origin.replace(/\&.+\;?/, ' ')
      }
      return pre + cur.origin + '\n'
    }, '')
    let res = await this.trans(words)
    let data = localTexts.map((item, i) => {
      let reg = /^[0-9]+\.?[0-9]*$/
      if (reg.test(item.origin)) {
        return { 
          origin: item.origin,
          local: item.origin,
        }
      }
      return {
        origin: item.origin,
        local: res[i],
      }
    })
    
    const { texts: originTexts, tree } = html2texts(html)
    
    originTexts.forEach((item, index) => {
      lodash.set(tree, item.paths, data[index].local)
    })
  
    // @ts-ignore
		let newHtml = render(tree)
		return newHtml
	}

  async transDecodeHtml(html: string) {
    html = htmlDecode(html).replace(/\&.+?;/g, ' ');
    let newHtml = await this.transHtml(html)
    newHtml = htmlEncode(newHtml)
    return  newHtml
  }

  private interceptors(): void {
    this.instance.interceptors.request.use(async (config: any) => {
      this.totalInstanceCount++
      if (this.instanceCount >= this.maxInstanceCount) {
        let timer:any = null
        await new Promise((resolve) => {
          timer = setInterval(_ => {
            if(this.instanceCount < this.maxInstanceCount) resolve('')
          },1000)
        })
        this.instanceCount++
        clearInterval(timer)
        return config
      }
      this.instanceCount++
      return config
    }, err => err)
    
    this.instance.interceptors.response.use(res => {
      setTimeout(() => {
        this.instanceCount--
        this.totalInstanceCount--
      }, 1100);
      return res
    },err => err)
  }
}
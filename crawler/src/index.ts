import * as cheerio from 'cheerio'
import Axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import progreesBar from './progrees_bar'
import {
	outDir,
	baseUrl,
	productUrl,
	category,
	item,
	itemDetail
} from '../config'

const pb = new progreesBar('下载进度', 50)
let nowCount = 0
const axios = Axios.create({
	baseURL: baseUrl,
	timeout: 10000,
})
axios.interceptors.response.use(res => {
	return res.data
})

async function start() {
	const ProHtml = await axios.get(productUrl)
	const $ = cheerio.load(ProHtml)

	$(category.baseSelector).map(function () {
		const name = $(this).find(category.nameSelector).text()
		let url = $(this).find(category.urlSelector).attr('href')
		url.slice(0, 1) !== '/' && (url = '/' + url)
		category.list.push({ url, name })
	})

	return await Promise.all(
		category.list.map(async c => {
			if (!fs.existsSync(path.join(outDir, c.name))) {
				fs.mkdirSync(path.join(outDir, c.name))
			}
			return await setItemList(c)
		})
	)
}

async function getProduct(list: ItemListItem[]) {
	let errorList = []
	let completed = 0,
		errors = 0
	await Promise.all(
		list.map(async item => {
			const res = await getItem(item)
			if (!res.success) {
				errorList.push(res.item)
				errors++
			} else {
				completed++
			}
			pb.render({ completed, total: list.length, errors, other: `超时个数:${errors}` })
		})
	)
	if (errorList.length) {
		console.log(`\n\n开始第${ ++nowCount}次下载剩余超时文件:\n`)
		await getProduct(errorList)
	}
	if (!errorList.length) {
		console.log('\n\n下载完成')
	}
}

async function getItem(item: ItemListItem): Promise<{ success: boolean; item?: ItemListItem }> {
	let itemHtml
	return new Promise(async (resolve, reject) => {
		try {
			itemHtml = await axios.get(item.url)
			const $3 = cheerio.load(itemHtml)
			let title = item.name
			title.includes('/') && (title = title.replace('/', '&'))
			let imgUrl = $3(itemDetail.imgSelector).attr('src')
			imgUrl.slice(0, 1) !== '/' && (imgUrl = '/' + imgUrl)

			let content = $3(itemDetail.contentSelector).html()
			
			if (!fs.existsSync(path.join(outDir, item.category, title))) {
				fs.mkdirSync(path.join(outDir, item.category, title))
			}
			
			
			let contentImgList = []

			$3(itemDetail.contentSelector).find('img').map(async function (i, e) {
				
				let contentImgUrl = $3(this).attr('src')
				contentImgUrl.slice(0, 1) !== '/' && (contentImgUrl = '/' + contentImgUrl)
				let imgType = '.webp'
				if (contentImgUrl.includes('.jpg')) {
					imgType = '.jpg'
				}
				if (contentImgUrl.includes('.png')) {
					imgType = '.png'
				}
				const contentImgPath = path.join(outDir, item.category, title, i + imgType)
				contentImgList.push({ imgUrl: contentImgUrl, imgPath: contentImgPath })
				$3(this).attr('src',i + imgType)
			})
			content = $3(itemDetail.contentSelector).html()

			fs.writeFileSync(path.join(outDir, item.category, title, 'content.html'), content)

			let imgType = '.jpg'
			if (imgUrl.includes('.jpg')) {
				imgType = '.jpg'
			}
			if (imgUrl.includes('.png')) {
				imgType = '.png'
			}
			const imgPath = path.join(outDir, item.category, title, 'cover' + imgType)

			contentImgList.push({ imgUrl, imgPath })
			
			await Promise.all(contentImgList.map(async v => {
				return await downloadImg(
					v.imgUrl,
					v.imgPath
				)
			}))
			resolve({ success: true })
		} catch (error) {
			resolve({ success: false, item })
		}
	})
}

async function downloadImg(url: string, imgPath: string) {
	return new Promise(async (resolve, reject) => {
		let imgType = '.webp'
		if (url.includes('.jpg')) {
			imgType = '.jpg'
		}
		if (url.includes('.png')) {
			imgType = '.png'
		}
		try {
			let data = await axios({
				url: url,
				responseType: 'stream',
			})
			const writer = fs.createWriteStream(imgPath)
			//@ts-ignore
			data.pipe(writer)
			let t = setTimeout(() => {
				writer.end()
				reject()
			}, 15000)
			writer.on('finish', () => {
				clearTimeout(t)
				resolve('')
			})
			writer.on('error', () => {
				clearTimeout(t)
				reject()
			})
		} catch (error) {
			reject()
		}
		
	})
	
}

async function setItemList(c: CategoryListItem) {
		try {
			const proHtml = await axios.get(c.url)
			const $2 = cheerio.load(proHtml)
			let nextPage;
			if(category.nextPageSelector)
			nextPage = $2(category.nextPageSelector)
			let nextPageUrl = '';
			if (nextPage && nextPage.attr('href')) {
				nextPageUrl = nextPage.attr('href')
				if(nextPageUrl.includes('javascript')) nextPageUrl = ''
			}
			$2(item.baseSelector).each(function () {
				const name = $2(this).find(item.nameSelector).text()
				let url = $2(this).find(item.urlSelector).attr('href')
				url.slice(0, 1) !== '/' && (url = '/' + url)
				item.list.push({
					url,
					name,
					category: c.name,
				})
			})
			if (nextPageUrl) {
				await setItemList({name:c.name,url:nextPageUrl})
			}
			return Promise.resolve('')
		} catch (error) {
			return Promise.reject()
		}
		
	
}

async function crawler() {
	await start()
	await getProduct(item.list)
}

crawler()

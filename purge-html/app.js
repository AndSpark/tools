const axios = require('axios')
const cheerio = require('cheerio')
const { PurgeCSS }  = require('purgecss')
const fs = require('fs')
const url = 'http://jianhui.innerhost.le-so.cn/'
const htmlUrl = 'http://jianhui.innerhost.le-so.cn/about/26.html'
const selector = 'body > div.page > section.breadcrumbs-custom';

(async () => {
	const { data } = await axios.get(htmlUrl)
	const $ = cheerio.load(data)
	const html = $(selector).html()
	const htmlCss = $('style').html()
	let cssArr = []
	if (htmlCss) {
		cssArr.push({ raw: htmlCss })
	}

	await Promise.all($('[rel="stylesheet"]').map(async function (i) {
		let linkCss = $(this).attr('href')
		if (linkCss.includes('Sites')) {
			linkCss = url + linkCss.replace('/','')
		}
		if (linkCss.includes('alicdn')) {
			return
		}
		const { data: css } = await axios.get(linkCss)
		
		return cssArr.push({ raw: css })
	}))
	
	const res = await new PurgeCSS()
		.purge({
			content: [{
				raw: html,
				extension:'html'
			}],
			css:cssArr,
			fontFace: true,
			keyframes: true,
		})
	const css  = res.reduce((p,c) => {
		if (c.css.length > 6) {
			return p + c.css
		}
		return p
	}, '')
	fs.writeFileSync('style.css', css)
	fs.writeFileSync('main.html',html)
})()
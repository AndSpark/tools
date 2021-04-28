import * as path from 'path'

const outDir = path.join(__dirname, './sparks')  // 输出目录
const baseUrl = 'https://sparks.flarum.cloud'  // 最后不要带 / 
const productUrl = '/t/chat'  // 分类页面，不要是全部
const category: Category = {
	baseSelector: '.IndexPage-nav .Dropdown-menu .Dropdown-separator~li', // 分类选择器
	nameSelector: 'a', // 分类下的名字选择器
	urlSelector: 'a', // 分类下的链接选择器
	nextPageSelector:'', // 如果有下一页
	list: [],
}
const item: Item = {
	baseSelector: '.DiscussionListItem-content',
	nameSelector: '.DiscussionListItem-title',
	urlSelector: '.DiscussionListItem-main',
	list: [],
}
const itemDetail = {
	imgSelector: '.PostUser-avatar',
	contentSelector:
		'.PostStream-item',
}

export {
	outDir,
	baseUrl,
	productUrl,
	category,
	item,
	itemDetail
}

declare interface baseSelector {
	baseSelector: string
	nameSelector: string
	urlSelector: string
}

declare interface CategoryListItem {
	name: string
	url: string
}

declare interface ItemListItem {
	name: string
	url: string
	category: string
}

declare interface Category extends baseSelector {
	nextPageSelector: string
	list: CategoryListItem[]
}

declare interface Item extends baseSelector {
	list: ItemListItem[]
}
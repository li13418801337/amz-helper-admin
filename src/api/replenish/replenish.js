import request from '@/utils/request'

export function getProductList() {
  return request({
    url: '/replenish/replenish/productList',
    method: 'get'
  })
}

export function recommendCarton(data) {
  return request({
    url: '/replenish/replenish/recommendCarton',
    method: 'post',
    data: data
  })
}

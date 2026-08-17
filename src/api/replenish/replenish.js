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

// 补货预警计算
// 补货触发点(件) = 日均销量 × (补货周期 + 安全库存天数)
// 建议补货量(件) = 日均销量 × 45天(一个半周期)
export function checkReplenish(data) {
  return request({
    url: '/replenish/replenish/check',
    method: 'post',
    data: data
  })
}

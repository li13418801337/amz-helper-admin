import request from '@/utils/request'

// 查询商品成本列表（以产品为主，展示所有产品）
export function listProductCost(query) {
  return request({
    url: '/cost/productCost/list',
    method: 'get',
    params: query
  })
}

export function getProductCost(id) {
  return request({
    url: '/cost/productCost/' + id,
    method: 'get'
  })
}

// V2：修改产品包装价格 + 采购价格
// body: { productId, packagingPrice, purchasePrice }
export function saveProductPrices(data) {
  return request({
    url: '/cost/productCost/prices',
    method: 'put',
    data: data
  })
}

// 兼容旧接口
export function addProductCost(data) {
  return request({
    url: '/cost/productCost',
    method: 'post',
    data: data
  })
}

export function updateProductCost(data) {
  return request({
    url: '/cost/productCost',
    method: 'put',
    data: data
  })
}

export function delProductCost(ids) {
  return request({
    url: '/cost/productCost/' + ids,
    method: 'delete'
  })
}

export function exportProductCost(query) {
  return request({
    url: '/cost/productCost/export',
    method: 'post',
    params: query
  })
}

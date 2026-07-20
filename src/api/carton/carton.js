import request from '@/utils/request'

// 查询外包装纸箱列表
export function listCarton(query) {
  return request({
    url: '/carton/carton/list',
    method: 'get',
    params: query
  })
}

// 查询外包装纸箱详细
export function getCarton(id) {
  return request({
    url: '/carton/carton/' + id,
    method: 'get'
  })
}

// 新增外包装纸箱
export function addCarton(data) {
  return request({
    url: '/carton/carton',
    method: 'post',
    data: data
  })
}

// 修改外包装纸箱
export function updateCarton(data) {
  return request({
    url: '/carton/carton',
    method: 'put',
    data: data
  })
}

// 删除外包装纸箱
export function delCarton(id) {
  return request({
    url: '/carton/carton/' + id,
    method: 'delete'
  })
}

<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="产品名称" prop="productName">
        <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="父ASIN" prop="parentAsin">
        <el-input v-model="queryParams.parentAsin" placeholder="请输入父ASIN" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="子ASIN" prop="childAsin">
        <el-input v-model="queryParams.childAsin" placeholder="请输入子ASIN" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['product:product:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['product:product:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['product:product:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['product:product:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="productList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="left" width="80">
        <template #default="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="产品价格" align="center" prop="productPrice" width="100" />
      <el-table-column label="产品链接" align="center">
        <template #default="scope">
          <a v-if="scope.row.productUrl" :href="scope.row.productUrl" target="_blank" rel="noopener noreferrer"
            style="color: #409EFF; text-decoration: underline; cursor: pointer;">
            产品链接
          </a>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="产品图片链接" align="center" prop="productImageUrl">
        <template #default="scope">
          <el-image v-if="scope.row.productImageUrl" :src="scope.row.productImageUrl"
            :preview-src-list="[scope.row.productImageUrl]" fit="cover"
            style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer;" :preview-teleported="true" />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="父ASIN" align="center" prop="parentAsin" />
      <el-table-column label="子ASIN" align="center" prop="childAsin" />
      <el-table-column label="纸箱id" align="center" prop="cartonId" />
      <el-table-column label="包装重量" align="center" prop="weightGram" />
      <el-table-column label="关联成本ID" align="center" prop="productCostId" width="110">
        <template #default="scope">
          <el-tag v-if="scope.row.productCostId" type="success" size="small">{{ scope.row.productCostId }}</el-tag>
          <span v-else style="color:#909399">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" @click="handleUpdate(scope.row)"
            v-hasPermi="['product:product:edit']">修改</el-button>
          <el-button link type="primary" @click="handleDelete(scope.row)"
            v-hasPermi="['product:product:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改商品对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="productRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="form.productName" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="产品价格" prop="productPrice">
          <el-input v-model="form.productPrice" placeholder="请输入产品价格" />
        </el-form-item>
        <el-form-item label="产品链接" prop="productUrl">
          <el-input v-model="form.productUrl" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="产品图片链接" prop="productImageUrl">
          <el-input v-model="form.productImageUrl" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="父ASIN" prop="parentAsin">
          <el-input v-model="form.parentAsin" placeholder="请输入父ASIN" />
        </el-form-item>
        <el-form-item label="子ASIN" prop="childAsin">
          <el-input v-model="form.childAsin" placeholder="请输入子ASIN" />
        </el-form-item>
        <el-form-item label="产品克重" prop="weihtiGram">
          <el-input v-model="form.weihtiGram" placeholder="请输入克重" />
        </el-form-item>
        <el-form-item label="包装箱id" prop="cartonId">
          <el-input v-model="form.cartonId" placeholder="请输入包装箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Product">
import { listProduct, getProduct, delProduct, addProduct, updateProduct } from "@/api/product/product"

const { proxy } = getCurrentInstance()

const productList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    productName: null,
    productPrice: null,
    productUrl: null,
    productImageUrl: null,
    parentAsin: null,
    childAsin: null,
    weihtiGram: null,
    cartonId: null
  },
  rules: {
    productName: [
      { required: true, message: "产品名称不能为空", trigger: "blur" }
    ],
    productPrice: [
      { required: true, message: "产品价格不能为空", trigger: "blur" }
    ],
    productUrl: [
      { required: true, message: "产品链接不能为空", trigger: "blur" }
    ],
    productImageUrl: [
      { required: true, message: "产品图片链接不能为空", trigger: "blur" }
    ],
    parentAsin: [
      { required: true, message: "父ASIN不能为空", trigger: "blur" }
    ],
    childAsin: [
      { required: true, message: "子ASIN不能为空", trigger: "blur" }
    ],
    weihtiGram: [
      { required: true, message: "产品克重不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询商品列表 */
function getList() {
  loading.value = true
  listProduct(queryParams.value).then(response => {
    productList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    productName: null,
    productPrice: null,
    productUrl: null,
    productImageUrl: null,
    parentAsin: null,
    childAsin: null,
    createdAt: null,
    updatedAt: null
  }
  proxy.resetForm("productRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加商品"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _id = row.id || ids.value
  getProduct(_id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改商品"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["productRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateProduct(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addProduct(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value
  proxy.$modal.confirm('是否确认删除商品编号为"' + _ids + '"的数据项？').then(function () {
    return delProduct(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('product/product/export', {
    ...queryParams.value
  }, `product_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增产品</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="ShoppingCart" :disabled="selectedProducts.length === 0" @click="handleRecommend">补货计算</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="selectedProducts.length === 0" @click="handleClear">清空列表</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="selectedProducts" border>
      <el-table-column label="序号" align="center" width="80">
        <template #default="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="父ASIN" align="center" prop="parentAsin" width="120" />
      <el-table-column label="子ASIN" align="center" prop="childAsin" width="120" />
      <el-table-column label="包装重量(g)" align="center" prop="weightGram" width="120" />
      <el-table-column label="补货数量" align="center" width="120">
        <template #default="scope">
          <el-input-number v-model="scope.row.quantity" :min="1" :max="999" size="small" @change="updateTotalWeight" />
        </template>
      </el-table-column>
      <el-table-column label="总重量(g)" align="center" width="120">
        <template #default="scope">
          {{ (parseInt(scope.row.weightGram || 0) * scope.row.quantity) || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80">
        <template #default="scope">
          <el-button link type="danger" @click="handleRemove(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="selectedProducts.length > 0" class="mt8">
      <el-card class="box-card">
        <template #header>
          <span>补货汇总</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <span class="stat-label">产品种类：</span>
              <span class="stat-value">{{ selectedProducts.length }} 种</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <span class="stat-label">总数量：</span>
              <span class="stat-value">{{ totalQuantity }} 件</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <span class="stat-label">总重量：</span>
              <span class="stat-value">{{ totalWeight }}g</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <div v-if="recommendResult" class="mt8">
      <el-card class="box-card" shadow="hover">
        <template #header>
          <span>纸箱推荐方案</span>
        </template>
        <el-alert :title="recommendResult.recommendationReason" type="success" show-icon />
        <el-divider />
        <el-row :gutter="20" class="mb8">
          <el-col :span="12">
            <div class="carton-info">
              <h4>推荐纸箱</h4>
              <p><strong>名称：</strong>{{ recommendResult.cartonName }}</p>
              <p><strong>尺寸：</strong>{{ recommendResult.length }} × {{ recommendResult.width }} × {{ recommendResult.height }} cm</p>
              <p><strong>体积重：</strong>{{ recommendResult.cartonWeight }}g</p>
              <p><strong>纸箱自重：</strong>{{ recommendResult.cartonWeight }}g</p>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="carton-info">
              <h4>重量统计</h4>
              <p><strong>产品总重：</strong>{{ recommendResult.totalProductWeight }}g</p>
              <p><strong>纸箱自重：</strong>{{ recommendResult.cartonWeight }}g</p>
              <p><strong>合计重量：</strong>{{ recommendResult.totalWeight }}g</p>
              <p><strong>剩余容量：</strong>{{ recommendResult.remainingCapacity }}g</p>
            </div>
          </el-col>
        </el-row>
        <el-table :data="recommendResult.products" border size="small">
          <el-table-column label="产品名称" align="center" prop="productName" />
          <el-table-column label="包装重量(g)" align="center" prop="weightGram" />
          <el-table-column label="补货数量" align="center" prop="quantity" />
          <el-table-column label="总重量(g)" align="center" prop="totalWeight" />
        </el-table>
      </el-card>
    </div>

    <el-dialog title="选择产品" v-model="productDialogOpen" width="900px" append-to-body>
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px">
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable @keyup.enter="getProductList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getProductList">搜索</el-button>
          <el-button icon="Refresh" @click="resetProductQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="productLoading" :data="productList" @selection-change="handleProductSelectionChange" border>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="产品名称" align="center" prop="productName" />
        <el-table-column label="父ASIN" align="center" prop="parentAsin" width="120" />
        <el-table-column label="子ASIN" align="center" prop="childAsin" width="120" />
        <el-table-column label="包装重量(g)" align="center" prop="weightGram" width="120" />
        <el-table-column label="补货数量" align="center" width="190">
          <template #default="scope">
            <el-input-number v-model="scope.row.quantity" :min="1" :max="999" size="default" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="confirmAddProducts">确认添加</el-button>
          <el-button @click="productDialogOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Replenish">
import { getProductList as listProduct, recommendCarton } from "@/api/replenish/replenish"

const { proxy } = getCurrentInstance()

const loading = ref(false)
const productLoading = ref(false)
const productDialogOpen = ref(false)
const recommendResult = ref(null)

const selectedProducts = ref([])
const productList = ref([])
const selectedProductIds = ref([])

const queryParams = reactive({
  productName: null
})

const totalQuantity = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.quantity, 0)
})

const totalWeight = computed(() => {
  return selectedProducts.value.reduce((sum, item) => {
    return sum + (parseInt(item.weightGram || 0) * item.quantity)
  }, 0)
})

function getProductList() {
  productLoading.value = true
  listProduct().then(response => {
    productList.value = response.data.map(item => ({
      ...item,
      quantity: 1
    }))
    productLoading.value = false
  })
}

function resetProductQuery() {
  queryParams.productName = null
  getProductList()
}

function handleAdd() {
  getProductList()
  productDialogOpen.value = true
}

function handleProductSelectionChange(selection) {
  selectedProductIds.value = selection.map(item => item.id)
}

function confirmAddProducts() {
  const selectedItems = productList.value.filter(item =>
    selectedProductIds.value.includes(item.id) && item.quantity > 0
  )

  selectedItems.forEach(item => {
    const existingIndex = selectedProducts.value.findIndex(p => p.id === item.id)
    if (existingIndex >= 0) {
      selectedProducts.value[existingIndex].quantity += item.quantity
    } else {
      selectedProducts.value.push({
        id: item.id,
        productName: item.productName,
        parentAsin: item.parentAsin,
        childAsin: item.childAsin,
        weightGram: item.weightGram,
        quantity: item.quantity
      })
    }
  })

  recommendResult.value = null
  productDialogOpen.value = false
  selectedProductIds.value = []
}

function handleRemove(index) {
  selectedProducts.value.splice(index, 1)
  recommendResult.value = null
}

function handleClear() {
  proxy.$modal.confirm('是否确认清空所有已选择的产品？').then(() => {
    selectedProducts.value = []
    recommendResult.value = null
    proxy.$modal.msgSuccess("已清空")
  }).catch(() => {})
}

function updateTotalWeight() {
  recommendResult.value = null
}

function handleRecommend() {
  if (selectedProducts.value.length === 0) {
    proxy.$modal.msgWarning("请先添加补货产品")
    return
  }

  loading.value = true
  const data = selectedProducts.value.map(item => ({
    productId: item.id,
    quantity: item.quantity
  }))

  recommendCarton(data).then(response => {
    recommendResult.value = response.data
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}
</script>

<style scoped>
.mt8 {
  margin-top: 8px;
}
.stat-item {
  font-size: 14px;
  padding: 8px 0;
}
.stat-label {
  color: #606266;
}
.stat-value {
  color: #409EFF;
  font-weight: bold;
  font-size: 16px;
}
.carton-info {
  padding: 10px;
}
.carton-info h4 {
  margin-bottom: 10px;
  color: #303133;
}
.carton-info p {
  margin: 5px 0;
  font-size: 14px;
}
</style>

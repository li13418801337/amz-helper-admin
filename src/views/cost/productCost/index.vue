<template>
    <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="queryParams.productName" placeholder="请输入产品名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="子ASIN" prop="childAsin">
          <el-input v-model="queryParams.childAsin" placeholder="请输入子ASIN" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="父ASIN" prop="parentAsin">
          <el-input v-model="queryParams.parentAsin" placeholder="请输入父ASIN" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
  
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" v-hasPermi="['cost:productCost:export']" @click="handleExport">导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>
  
      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="ID" align="center" prop="productId" width="70" />
        <el-table-column label="产品图片" align="center" width="100">
          <template #default="{ row }">
            <el-image v-if="row.productImageUrl" :src="row.productImageUrl"
              :preview-src-list="[row.productImageUrl]" fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px;" :preview-teleported="true" />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" align="center" prop="productName" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="子ASIN" align="center" prop="childAsin" width="140" />
        <el-table-column label="父ASIN" align="center" prop="parentAsin" width="140" />
        <el-table-column label="产品采购价格(元)" align="right" width="150">
          <template #default="{ row }">
            <span style="color:#409EFF;font-weight:600">¥{{ Number(row.purchasePrice || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品包装价格(元)" align="right" width="150">
          <template #default="{ row }">
            <span style="color:#67c23a;font-weight:600">¥{{ Number(row.packagingCost || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总成本(元)" align="right" width="140">
          <template #default="{ row }">
            <span style="color:#f56c6c;font-weight:bold">¥{{ (Number(row.purchasePrice || 0) + Number(row.packagingCost || 0)).toFixed(2) }}</span>
          </template>
        </el-table-column>        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" v-hasPermi="['cost:productCost:edit']" @click="handleEditPrices(scope.row)">修改价格</el-button>
          </template>
        </el-table-column>
      </el-table>
  
      <pagination v-show="total > 0" v-model:total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  
      <!-- 修改价格弹窗：仅允许修改 产品包装价格 / 产品采购价格 -->
      <el-dialog title="修改包装/采购价格" v-model="priceOpen" width="480px" append-to-body>
        <el-form ref="priceFormRef" :model="priceForm" :rules="priceRules" label-width="140px">
          <el-form-item label="产品">
            <span style="color:#303133">{{ priceForm.productName }}</span>
          </el-form-item>
          <el-form-item label="子ASIN">
            <span style="color:#606266">{{ priceForm.childAsin || '—' }}</span>
          </el-form-item>
          <el-form-item label="产品采购价格" prop="purchasePrice">
            <el-input-number v-model="priceForm.purchasePrice" :min="0" :precision="2" :step="0.5" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item label="产品包装价格" prop="packagingPrice">
            <el-input-number v-model="priceForm.packagingPrice" :min="0" :precision="2" :step="0.5" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="submitPriceForm">确 定</el-button>
            <el-button @click="priceOpen = false">取 消</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup name="ProductCost">
  import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
  import { listProductCost, saveProductPrices, exportProductCost } from "@/api/cost/productCost"
  
  const { proxy } = getCurrentInstance()
  const loading = ref(true)
  const showSearch = ref(true)
  const total = ref(0)
  const list = ref([])
  const queryRef = ref(null)
  
  const queryParams = reactive({ pageNum: 1, pageSize: 20, productName: null, childAsin: null, parentAsin: null })
  
  // ====== 价格弹窗 ======
  const priceOpen = ref(false)
  const priceFormRef = ref(null)
  const priceDefault = { productId: null, productName: '', childAsin: '', purchasePrice: 0, packagingPrice: 0 }
  const priceForm = reactive({ ...priceDefault })
  const priceRules = {
    purchasePrice:  [{ required: true, message: '请输入产品采购价格', trigger: 'blur' }],
    packagingPrice: [{ required: true, message: '请输入产品包装价格', trigger: 'blur' }]
  }
  
  function handleSelectionChange() {}
  
  function getList() {
    loading.value = true
    listProductCost(queryParams).then(r => {
      list.value = r.rows
      total.value = r.total
      loading.value = false
    }).catch(() => { loading.value = false })
  }
  
  function handleQuery() { queryParams.pageNum = 1; getList() }
  function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }
  
  function handleEditPrices(row) {
    Object.assign(priceForm, {
      productId: row.productId,
      productName: row.productName,
      childAsin: row.childAsin || row.parentAsin || '',
      purchasePrice: Number(row.purchasePrice || 0),
      packagingPrice: Number(row.packagingCost || 0)
    })
    priceOpen.value = true
  }
  
  function submitPriceForm() {
    proxy.$refs.priceFormRef.validate(valid => {
      if (!valid) return
      saveProductPrices({
        productId: priceForm.productId,
        purchasePrice: priceForm.purchasePrice,
        packagingPrice: priceForm.packagingPrice
      }).then(() => {
        proxy.$modal.msgSuccess("修改成功")
        priceOpen.value = false
        getList()
      })
    })
  }
  
  function handleExport() {
    proxy.download('cost/productCost/export', { ...queryParams }, 'productCost_' + new Date().getTime() + '.xlsx')
  }
  
  onMounted(() => { getList() })
  </script>
  
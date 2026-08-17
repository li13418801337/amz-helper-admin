<template>
  <div class="app-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>补货预警计算</span>
          <el-tag size="small" type="info">
            补货触发点 = 日均销量 × (补货周期 + 安全库存天数) ｜ 建议补货量 = 日均销量 × 45天
          </el-tag>
        </div>
      </template>

      <el-form ref="checkRef" :model="form" :rules="rules" label-width="120px" inline>
        <el-form-item label="选择产品" prop="productId">
          <el-select
            v-model="form.productId"
            filterable
            placeholder="请选择产品"
            style="width: 320px"
            @change="handleProductChange"
          >
            <el-option
              v-for="item in productList"
              :key="item.id"
              :label="optionLabel(item)"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="当前库存(件)" prop="currentStock">
          <el-input-number v-model="form.currentStock" :min="0" :max="999999" />
        </el-form-item>

        <el-form-item label="日均销量(件)" prop="dailySales">
          <el-input-number v-model="form.dailySales" :min="0" :max="99999" />
        </el-form-item>

        <el-form-item label="补货周期(天)" prop="replenishCycle">
          <el-input-number v-model="form.replenishCycle" :min="1" :max="180" />
        </el-form-item>

        <el-form-item label="安全库存天数" prop="safetyStockDays">
          <el-input-number v-model="form.safetyStockDays" :min="0" :max="90" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Calculator" :loading="loading" @click="handleCheck">计算补货</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="result" class="mt8">
      <el-card class="box-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>计算结果</span>
            <el-tag :type="result.needReplenish ? 'danger' : 'success'" size="small">
              {{ result.needReplenish ? '需立即补货' : '暂无需补货' }}
            </el-tag>
          </div>
        </template>

        <el-alert
          :title="result.message"
          :type="result.needReplenish ? 'warning' : 'success'"
          show-icon
          :closable="false"
        />

        <el-divider />

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <span class="stat-label">产品名称：</span>
              <span class="stat-value-text">{{ result.productName }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="stat-label">父/子ASIN：</span>
              <span class="stat-value-text">{{ result.parentAsin || '-' }} / {{ result.childAsin || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="stat-label">当前库存：</span>
              <span class="stat-value">{{ result.currentStock }} 件</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="stat-label">日均销量：</span>
              <span class="stat-value">{{ result.dailySales }} 件/天</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt8">
          <el-col :span="6">
            <div class="stat-card" :class="result.needReplenish ? 'stat-danger' : 'stat-success'">
              <div class="stat-card-label">补货触发点</div>
              <div class="stat-card-value">{{ result.triggerPoint }}</div>
              <div class="stat-card-unit">件</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card stat-primary">
              <div class="stat-card-label">建议补货量</div>
              <div class="stat-card-value">{{ result.recommendedQty }}</div>
              <div class="stat-card-unit">件</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card" :class="result.needReplenish ? 'stat-warning' : 'stat-success'">
              <div class="stat-card-label">库存缺口</div>
              <div class="stat-card-value">{{ result.shortageQty }}</div>
              <div class="stat-card-unit">件</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card stat-info">
              <div class="stat-card-label">库存可售天数</div>
              <div class="stat-card-value">{{ result.stockAvailableDays }}</div>
              <div class="stat-card-unit">天</div>
            </div>
          </el-col>
        </el-row>

        <el-divider />

        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="补货周期">{{ result.replenishCycle }} 天</el-descriptions-item>
          <el-descriptions-item label="安全库存天数">{{ result.safetyStockDays }} 天</el-descriptions-item>
          <el-descriptions-item label="判定规则">
            当前库存 ≤ 补货触发点({{ result.triggerPoint }}) 时需要补货
          </el-descriptions-item>
          <el-descriptions-item label="是否需要补货">
            <el-tag :type="result.needReplenish ? 'danger' : 'success'" size="small">
              {{ result.needReplenish ? '是 - 需立即补货' : '否 - 暂无需补货' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup name="ReplenishCheck">
import { getProductList as listProduct, checkReplenish } from "@/api/replenish/replenish"

const { proxy } = getCurrentInstance()

const loading = ref(false)
const productList = ref([])
const result = ref(null)

const form = reactive({
  productId: null,
  currentStock: 0,
  dailySales: 0,
  replenishCycle: 30,
  safetyStockDays: 7
})

const rules = {
  productId: [{ required: true, message: '请选择产品', trigger: 'change' }],
  currentStock: [{ required: true, message: '请输入当前库存', trigger: 'blur' }],
  dailySales: [{ required: true, message: '请输入日均销量', trigger: 'blur' }]
}

function optionLabel(item) {
  const asin = item.childAsin || item.parentAsin || ''
  return asin ? `${item.productName} (${asin})` : item.productName
}

function handleProductChange() {
  result.value = null
}

function fetchProductList() {
  listProduct().then(response => {
    productList.value = response.data || []
  })
}

function handleCheck() {
  proxy.$refs.checkRef.validate(valid => {
    if (!valid) return
    loading.value = true
    checkReplenish(form).then(response => {
      result.value = response.data
      loading.value = false
    }).catch(() => {
      loading.value = false
    })
  })
}

function handleReset() {
  proxy.$refs.checkRef.resetFields()
  form.currentStock = 0
  form.dailySales = 0
  form.replenishCycle = 30
  form.safetyStockDays = 7
  result.value = null
}

fetchProductList()
</script>

<style scoped>
.mt8 {
  margin-top: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-item {
  font-size: 14px;
  padding: 6px 0;
}
.stat-label {
  color: #606266;
}
.stat-value {
  color: #409EFF;
  font-weight: bold;
  font-size: 16px;
}
.stat-value-text {
  color: #303133;
  font-weight: 500;
}
.stat-card {
  padding: 16px;
  border-radius: 6px;
  text-align: center;
  color: #fff;
  background-color: #909399;
}
.stat-card-label {
  font-size: 13px;
  opacity: 0.9;
}
.stat-card-value {
  font-size: 28px;
  font-weight: bold;
  margin: 4px 0;
}
.stat-card-unit {
  font-size: 12px;
  opacity: 0.9;
}
.stat-primary {
  background-color: #409EFF;
}
.stat-success {
  background-color: #67c23a;
}
.stat-warning {
  background-color: #e6a23c;
}
.stat-danger {
  background-color: #f56c6c;
}
.stat-info {
  background-color: #909399;
}
</style>

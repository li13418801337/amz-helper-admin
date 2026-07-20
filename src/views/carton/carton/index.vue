<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="纸箱名称" prop="cartonName">
        <el-input
          v-model="queryParams.cartonName"
          placeholder="请输入纸箱名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="长度" prop="length">
        <el-input
          v-model="queryParams.length"
          placeholder="请输入长度"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="宽度" prop="width">
        <el-input
          v-model="queryParams.width"
          placeholder="请输入宽度"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="高度" prop="height">
        <el-input
          v-model="queryParams.height"
          placeholder="请输入高度"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="重量" prop="weight">
        <el-input
          v-model="queryParams.weight"
          placeholder="请输入重量"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['carton:carton:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['carton:carton:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['carton:carton:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['carton:carton:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="cartonList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="id" align="center" prop="id" />
      <el-table-column label="纸箱名称" align="center" prop="cartonName" />
      <el-table-column label="长度" align="center" prop="length" />
      <el-table-column label="宽度" align="center" prop="width" />
      <el-table-column label="高度" align="center" prop="height" />
      <el-table-column label="自重(g)" align="center" prop="weight" />
      <el-table-column label="体积重(g)" align="center" prop="volumeWeight" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['carton:carton:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['carton:carton:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改外包装纸箱对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="cartonRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="纸箱名称" prop="cartonName">
          <el-input v-model="form.cartonName" placeholder="请输入纸箱名称" />
        </el-form-item>
        <el-form-item label="长度(cm)" prop="length">
          <el-input v-model="form.length" placeholder="请输入长度(cm)" />
        </el-form-item>
        <el-form-item label="宽度(cm)" prop="width">
          <el-input v-model="form.width" placeholder="请输入宽度(cm)" />
        </el-form-item>
        <el-form-item label="高度(cm)" prop="height">
          <el-input v-model="form.height" placeholder="请输入高度(cm)" />
        </el-form-item>
        <el-form-item label="重量(g)" prop="weight">
          <el-input v-model="form.weight" placeholder="请输入重量(g)" />
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

<script setup name="Carton">
import { listCarton, getCarton, delCarton, addCarton, updateCarton } from "@/api/carton/carton"

const { proxy } = getCurrentInstance()

const cartonList = ref([])
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
    pageSize: 10,
    cartonName: null,
    length: null,
    width: null,
    height: null,
    weight: null,
  },
  rules: {
    cartonName: [
      { required: true, message: "纸箱名称不能为空", trigger: "blur" }
    ],
    length: [
      { required: true, message: "长度(cm)不能为空", trigger: "blur" }
    ],
    width: [
      { required: true, message: "宽度(cm)不能为空", trigger: "blur" }
    ],
    height: [
      { required: true, message: "高度(cm)不能为空", trigger: "blur" }
    ],
    weight: [
      { required: true, message: "重量(g)不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询外包装纸箱列表 */
function getList() {
  loading.value = true
  listCarton(queryParams.value).then(response => {
    cartonList.value = response.rows
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
    cartonName: null,
    length: null,
    width: null,
    height: null,
    weight: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("cartonRef")
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
  title.value = "添加外包装纸箱"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _id = row.id || ids.value
  getCarton(_id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改外包装纸箱"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["cartonRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateCarton(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addCarton(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除外包装纸箱编号为"' + _ids + '"的数据项？').then(function() {
    return delCarton(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('carton/carton/export', {
    ...queryParams.value
  }, `carton_${new Date().getTime()}.xlsx`)
}

getList()
</script>

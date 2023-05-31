<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NButton, NInput, NInputGroup, NModal, NSpace, useMessage } from 'naive-ui'
import { fetchVerify } from '@/api'
import { useAuthStore } from '@/store'

interface Props {
  visible: boolean
}

defineProps<Props>()

const authStore = useAuthStore()

const ms = useMessage()

const loading = ref(false)
const loadingVerify = ref(false)
const token = ref('')
const username = ref('')
const countdownSeconds = ref(60)
const disabled = ref(false)
const disabledVerify = computed(() => !token.value.trim() || loading.value)
let countdownInterval: any
let i18n: any
const buttonText = ref('')
import('@/locales')
  .then(({ t }) => {
    // 在导入成功后使用模块的功能
    i18n = t
    buttonText.value = i18n('common.btnGetVerify')
  })

async function handleVerify() {
  const secretKey = token.value.trim()

  if (!secretKey)
    return

  try {
    loading.value = true
    await fetchVerify(secretKey)
    authStore.setToken(secretKey)
    ms.success('success')
    window.location.reload()
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
    authStore.removeToken()
    token.value = ''
  }
  finally {
    loading.value = false
  }
}

function handlePress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleVerify()
  }
}

function getVerifyCode() {
  disabled.value = true

  countdownInterval = setInterval(() => {
    countdownSeconds.value--
    buttonText.value = countdownSeconds.value + i18n('common.afterVer')
    if (countdownSeconds.value <= 0)
      stopCountdown()
  }, 1000)

  ms.success(i18n('common.sendSucc'))
}

function stopCountdown() {
  clearInterval(countdownInterval)
  countdownSeconds.value = 60
  disabled.value = false
  buttonText.value = i18n('common.btnGetVerify')
}
</script>

<template>
  <NModal :show="visible" style="width: 92%; max-width: 500px">
    <div class="p-10 bg-white rounded dark:bg-slate-800">
      <NSpace vertical justify="center">
        <header class="space-y-2">
          <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-neutral-200">
            {{ $t('common.unauthorizedTips') }}
          </h2>

        <!-- <Icon403 class="w-[200px] m-auto" />  -->
        </header>
        <br>

        <NInputGroup>
          <NInput v-model:value="username" type="text" :placeholder="$t('common.phUserName')" clearable />
        </NInputGroup>
        <NInputGroup>
          <NInput v-model:value="token" type="text" :style="{ width: '80%' }" :placeholder="$t('common.phVerifyCode')" @keypress="handlePress" />
          <NButton
            type="primary"
            ghost
            :disabled="disabled"
            :loading="loading"
            @click="getVerifyCode"
          >
            {{ buttonText }}
          </NButton>
        </NInputGroup>
        <NButton
          type="primary"
          block
          :style="{ width: '95%', marginLeft: '8px' }"
          :disabled="disabledVerify"
          :loading="loadingVerify"
          @click="handleVerify"
        >
          {{ $t('common.verify') }}
        </NButton>
        <br>
        <p class="text-base text-center text-slate-500 dark:text-slate-500">
          {{ $t('common.loginDesc') }}
        </p>
        <!-- <p class="text-base text-center text-slate-500 dark:text-slate-500">
            {{ $t('common.loginDesc2') }}
          </p> -->
      </NSpace>
    </div>
  </NModal>
</template>

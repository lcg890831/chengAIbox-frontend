<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NButton, NInput, NInputGroup, NModal, NSpace, useMessage,NTabPane,NTabs,NFormItemRow,NForm } from 'naive-ui'
import { fetchVerify,sendVerifyCode,login } from '@/api'
import { useAuthStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'

interface Props {
  visible: boolean
}

defineProps<Props>()

const authStore = useAuthStore()

const ms = useMessage()
const { isMobile } = useBasicLayout()
const loading = ref(false)
const loadingVerify = ref(false)
const token = ref('')
const username = ref('')
const password = ref('')
const loginType = ref(1)
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
  let loginParam = {
    'username': username.value.trim(),
    'password': password.value.trim() ,
    'verifyCode':secretKey,
    'loginType' : loginType.value, //1.验证码 2.密码
    'isMobile' : isMobile
  };

  if (!secretKey||!username.value||!loginType.value)
    return
  
  try {
    loading.value = true
    const result = await login(loginParam)
    console.log('result',result)
    authStore.setToken(result.data.token)
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

async function getVerifyCode() {
  disabled.value = true
  try {
    loading.value = true
    await sendVerifyCode(username.value)
    ms.success(i18n('common.sendSucc'))
  }
  catch (error: any) {
    console.log(error)
    ms.error(error.message ?? 'error')
    authStore.removeToken()
    token.value = ''
  }
  finally {
    loading.value = false
  }
  countdownInterval = setInterval(() => {
    countdownSeconds.value--
    buttonText.value = countdownSeconds.value + i18n('common.afterVer')
    if (countdownSeconds.value <= 0)
      stopCountdown()
  }, 1000)

  
}

function stopCountdown() {
  clearInterval(countdownInterval)
  countdownSeconds.value = 60
  disabled.value = false
  buttonText.value = i18n('common.btnGetVerify')
}

function handleLoginType (value: string) {
  console.log(loginType.value)
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
        <NTabs
      class="card-tabs"
      default-value="verify"
      size="medium"
      animated
      @update:value="handleLoginType"
      pane-wrapper-style="margin: 0 -4px"
      pane-style=" box-sizing: border-box;"
    >
    <NTabPane name="verify" tab="验证码登录">
        <NForm size="medium">
          <NFormItemRow label="手机号/邮箱">
            <NInput v-model:value="username" type="text" :placeholder="$t('common.phUserName')" clearable />
          </NFormItemRow>
          <NFormItemRow label="验证码">
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
          </NFormItemRow>
        </NForm>
      </NTabPane>
    <NTabPane name="password" tab="密码登录">
      <NForm size="medium">
      <NFormItemRow label="用户名">
          <NInput v-model:value="username" type="text" :placeholder="$t('common.phUserName')" clearable />
        </NFormItemRow>
        <NFormItemRow label="密码">
          <NInput v-model:value="password" type="password"  :placeholder="$t('common.phPassword')" @keypress="handlePress" />
        </NFormItemRow>
      </NForm>
      </NTabPane>
      </NTabs>
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
        <p class="text-base text-center text-slate-500 dark:text-slate-500">
         <span style="color:#18492f"> Chatgpt正版AI助手<b>限免</b>注册中，8月1日前新用户来就送<b>1个月超级会员！！</b></span>
        </p>
        <!-- <p class="text-base text-center text-slate-500 dark:text-slate-500">
            {{ $t('common.loginDesc2') }}
          </p> -->

      </NSpace>
    </div>
  </NModal>
</template>

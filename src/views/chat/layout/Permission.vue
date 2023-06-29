<script setup lang='ts'>
import { computed, ref,onMounted } from 'vue'
import { NButton, NInput,  NModal, NSpace, useMessage,NTabPane,NTabs,NFormItemRow,NForm,NImage } from 'naive-ui'
import { sendVerifyCode,login,generatewxQRCode } from '@/api'
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
const loginType = ref(4)
const countdownSeconds = ref(60)
const disabled = ref(false)
const disabledVerify = computed(() => !token.value.trim() || loading.value)

let countdownInterval: any
let i18n: any
const buttonText = ref('')
const showPass = ref(false)
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
    'password': token.value.trim() ,
    'verifyCode':secretKey,
    'loginType' : loginType.value, //1.验证码 2.密码
    'isMobile' : isMobile.value
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
  console.log(value)
  if(value=='password'){
    loginType.value = 2
  }else if(value=='verify'){
    loginType.value = 1
  }else if(value=='wechat'){
    loginType.value = 4
  }
  }

  const qrcodeElement = ref(null);
    const callbackSuccess = ref(false);
    const pollingTimer = ref(null);
    const qrcodeImage = ref(null);

    const generateQRCode = async () => {
      try {
        const response = await generatewxQRCode();
        console.log(response.data.ticket)
        console.log(response.data)
        qrcodeImage.value = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+encodeURIComponent(response.data.ticket);
        
        //pollingCallbackStatus();
      } catch (error) {
        console.error(error);
      }
    };

    const pollingCallbackStatus = () => {
      pollingTimer.value = setInterval(async () => {
        try {
          const response = await axios.get('/api/checkCallbackStatus');
          if (response.data.callbackSuccess) {
            clearInterval(pollingTimer.value);
            callbackSuccess.value = true;
            // 根据业务需求，设置 token
          } else if (response.data.callbackTimeout) {
            clearInterval(pollingTimer.value);
            // 处理超时逻辑，比如显示刷新按钮
          }
        } catch (error) {
          console.error(error);
        }
      }, 5000); // 轮询间隔时间，根据需求进行调整
    };

    const refreshQRCode = () => {
      clearInterval(pollingTimer.value);
      callbackSuccess.value = false;
      generateQRCode();
    };

    onMounted(() => {
      if(!isMobile.value){
        generateQRCode();
      }
    });

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
      size="medium"
      animated
      @update:value="handleLoginType"
      pane-wrapper-style="margin: 0 -4px"
      pane-style=" box-sizing: border-box;"
    >
    <NTabPane name="wechat" tab="微信扫码登录" v-if="!isMobile">
      <NForm size="medium">
        <NImage :src="qrcodeImage" ref="qrcodeElement" v-show="qrcodeImage"/>
      </NForm>
      </NTabPane>
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
    <NTabPane name="password" tab="密码登录" v-if="showPass">
      <NForm size="medium">
      <NFormItemRow label="用户名">
          <NInput v-model:value="username" type="text" :placeholder="$t('common.phUserName')" clearable />
        </NFormItemRow>
        <NFormItemRow label="密码">
          <NInput v-model:value="token" type="password"  :placeholder="$t('common.phPassword')" @keypress="handlePress" />
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
          v-show="loginType!==4"
        >
          {{ $t('common.verify') }}
        </NButton>
        
        <br>
        <p class="text-base text-center text-slate-500 dark:text-[#ffffff]">
          {{ $t('common.loginDesc') }}
        </p>
        <p class="text-base text-center text-[#128346] dark:text-[#4B9E5F]">
         <span style="color:#18492f"> Chatgpt正版AI助手<b>限免</b>注册中，8月1日前新用户来就送<b>1个月超级会员！！</b></span>
        </p>
        <!-- <p class="text-base text-center text-slate-500 dark:text-slate-500">
            {{ $t('common.loginDesc2') }}
          </p> -->

      </NSpace>
    </div>
  </NModal>
</template>

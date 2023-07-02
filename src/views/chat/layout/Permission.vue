<script setup lang='ts'>
import { computed, ref,onMounted } from 'vue'
import { NButton, NInput,  NModal, NSpace, useMessage,NTabPane,NTabs,NFormItemRow,NForm,NImage,NAlert } from 'naive-ui'
import { sendVerifyCode,login,generatewxQRCode,fetchOpenId } from '@/api'
import { useAuthStore,useUserStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useRouter } from 'vue-router'

const router = useRouter()
interface Props {
  visible: boolean
}

defineProps<Props>()

const authStore = useAuthStore()
const userStore = useUserStore()
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
  //微信免登
  if(loginType.value==3 || loginType.value==4){
    token.value = 'free'
  }
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
    //登录成功，清空缓存
    await userStore.loadUserFromApi()
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
    const isTimeOut = ref(false);
    const pollingTimer = ref(null);
    const qrcodeImage = ref(null);

    const generateQRCode = async () => {
      if(!isMobile.value && !authStore.token){
      try {
        const response = await generatewxQRCode();
        console.log(response.data.ticket)
        console.log(response.data._uuid)
        qrcodeImage.value = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+encodeURIComponent(response.data.ticket);
        pollingCallbackStatus(response.data._uuid);
      } catch (error) {
        console.error(error);
      }
    }
    };

    const pollingCallbackStatus = (uuid) => {
      let roundTime = 0;
      isTimeOut.value = false;
      pollingTimer.value = setInterval(async () => {
        try {
          const response = await fetchOpenId(uuid);
          if (response.data?.wxopenId) {
            clearInterval(pollingTimer.value);
            authStore.session = null;
            username.value = response.data.wxopenId
            await handleVerify()
            //router.push({ name: 'Root', query: { 'wxopenId': response.data.wxopenId } });

            return;
          }else{
            roundTime+=5;
            if(roundTime>1820 || authStore.token){
              isTimeOut.value = true;
              clearInterval(pollingTimer.value);
            }
          } 
        } catch (error) {
          console.error(error);
        }
      }, 5000); // 轮询间隔时间，根据需求进行调整
    };

    const refreshQRCode = () => {
      generateQRCode();
    };

    const clearAllInterval = () => {
      clearInterval(pollingTimer.value);
    };

    onMounted(() => {
      if(!isMobile.value){
        generateQRCode();
      }
    });

</script>

<template>
  <NModal :show="visible" style="width: 92%; max-width: 500px" >
    <div class="p-10 bg-white rounded dark:bg-slate-800">
      <NSpace vertical justify="center">
        <header class="space-y-2">
          <h2 class="text-2xl font-bold text-center text-[#18A058] dark:text-neutral-200">
            {{ $t('common.unauthorizedTips') }}
          </h2>
          <p class="text-x0.3 text-center text-[#999999]  dark:text-[#ffffff]">{{ $t('common.welcomec') }}</p>

        <!-- <Icon403 class="w-[200px] m-auto" />  -->
        </header>
        <br>
        <NTabs
      size="large"
      type="bar"
      justify-content="center"
      animated
      @update:value="handleLoginType"
      pane-wrapper-style="margin: auto"
      pane-class="image-center"
    >
    <NTabPane name="wechat" tab="微信扫码登录" v-if="!isMobile" >
        <NImage width=320 height=320 :src="qrcodeImage" ref="qrcodeElement" v-show="qrcodeImage" class="image-center" :lazy=true />
        <div v-if="isTimeOut" class="overlay" @click="refreshQRCode">
          <NAlert title="二维码已失效" type="warning" :bordered=false >
            请点击重新获取
          </NAlert>
            </div>
            <div style="margin: auto">
              <p class="text-base text-center text-[#18A058] dark:text-[#ffffff]">
            ↑扫码关注公众号『 AI助手小橙 』登录↑
            </p>
            </div>
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
        <p class="text-base text-center text-[#18A058] dark:text-[#ffffff]">
          {{ $t('common.loginDesc') }}
        </p>
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
      <br>
        <p class="text-base text-center text-[#18A058] dark:text-[#ffffff]">
          {{ $t('common.loginDesc') }}
        </p>
      </NTabPane>

      </NTabs>
        <NButton
          type="primary"
          block
          :style="{ width: '95%' ,margin: 'auto' }"
          :disabled="disabledVerify"
          :loading="loadingVerify"
          @click="handleVerify"
          v-show="loginType!==4"
        >
          {{ $t('common.verify') }}
        </NButton>
        

        <p class="text-base text-center text-[#18A058] dark:text-[#4B9E5F]">
         <span style="color:#18492f">内置<b>Chatgpt3.5 & 4</b>的AI助手<b>首轮</b>注册中，8月1日前新用户每天可<b>免费</b>进行<b>100次</b>提问！后续还会不断增加新鲜好玩的功能，让您体验最有趣的AI！</span>
        </p>
        <!-- <p class="text-base text-center text-slate-500 dark:text-slate-500">
            {{ $t('common.loginDesc2') }}
          </p> -->

      </NSpace>
    </div>
  </NModal>
</template>

<style>
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay button {
  padding: 10px 20px;
  background-color: #fff;
  border: none;
}
.image-center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
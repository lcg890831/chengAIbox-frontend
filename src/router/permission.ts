import type { Router } from 'vue-router'
import { useAuthStoreWithout } from '@/store/modules/auth'
import { useUserStoreWithout } from '@/store/modules/user'
import { login } from '@/api'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    console.log('from',from)
    console.log('to',to)
 
    const authStore = useAuthStoreWithout()
    const userStore = useUserStoreWithout()
    if(authStore.token && !userStore.userInfo){
      userStore.loadUserFromApi()
    }
    if (!authStore.session || !authStore.token) {
      try {
        const data = await authStore.getSession()
        //token为空，如果存在wxopenId用wxopenId登录
        //if(!authStore.token){
          if (to.query.wxopenId) {
            let loginParam = {
              'username': to.query.wxopenId,
              'loginType' : 3, //1.验证码 2.密码 3.微信
            };
            
            try {
              const result = await login(loginParam)
              authStore.setToken(result.data.token)
              await userStore.loadUserFromApi()
            }
            catch (error: any) {
              authStore.removeToken()
            }
          }
       // }
        if (to.path === '/500')
          next({ name: 'Root' })
        else
          next()
      }
      catch (error) {
        if (to.path !== '/500')
          next({ name: '500' })
        else
          next()
      }
    }
    else {
      next()
    }
  })
}

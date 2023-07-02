import { defineStore } from 'pinia'
import type { UserInfo, UserState } from './helper'
import { defaultSetting, getLocalState, setLocalState } from './helper'
import { getUser,updateUser } from '@/api'
import { store } from '@/store'

export const useUserStore = defineStore('user-store', {
  state: (): UserState => getLocalState(),
  actions: {
    async updateUserInfo(userInfo: Partial<UserInfo>) {
      console.log('userInfo',userInfo)
     
      try {
        const { data } = await updateUser<UserState>(userInfo)
        console.log('updateUser',data)
        this.userInfo = data.userInfo
        this.recordState()
        return Promise.resolve(data)
      }
      catch (error) {
        return Promise.reject(error)
      }
    },

    async loadUserFromApi() {
      try {
        const  {data}  = await getUser<UserState>()
        console.log('loadUserFromApi',data)
        this.userInfo = data.userInfo
        this.recordState()
        return Promise.resolve(data)
      }
      catch (error) {
        return Promise.reject(error)
      }
    },

    resetUserInfo() {
      this.userInfo = { ...defaultSetting().userInfo }
      this.recordState()
    },

    recordState() {
      setLocalState(this.$state)
    },
  },
  
})

export function useUserStoreWithout() {
  return useUserStore(store)
}

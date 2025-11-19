import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UserState {
  currentUser: User | null
  isLoggedIn: boolean
  loading: boolean
}

const initialState: UserState = {
  currentUser: null,
  isLoggedIn: false,
  loading: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload
      state.isLoggedIn = true
    },
    clearUser: (state) => {
      state.currentUser = null
      state.isLoggedIn = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setUser, clearUser, setLoading } = userSlice.actions

export const selectCurrentUser = (state: RootState) => state.user.currentUser
export const selectIsLoggedIn = (state: RootState) => state.user.isLoggedIn

export default userSlice.reducer


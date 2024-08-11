import { createSlice } from '@reduxjs/toolkit'

export const doctorSlice = createSlice({
  name: 'doctor',
  initialState: {
    loggedIn:false,
    _id:"",
  },
  reducers: {
    loginDoctor:(state,_id)=>{
        state.loggedIn=true
        state._id=_id.payload
    },
    logoutDoctor:(state)=>{
        state.loggedIn=false
        state._id=""
    },
  },
})

export const { loginDoctor,logoutDoctor } = doctorSlice.actions

export default doctorSlice.reducer
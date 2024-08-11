"use client";
import { loginDoctor } from '@/features/doctor/doctorSlice'
import { loginUser } from '@/features/user/userSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

const LoginStatus = () => {
    const dispatch = useDispatch()
    useEffect(() => {
        (async () => {
            try {
                let res = await axios.get(`/api/loginStatus`, { withCredentials: true })
                if (res.data.authenticated) {
                    if (res.data.user)
                        dispatch(loginUser(res.data._id))
                    else
                        dispatch(loginDoctor(res.data._id))
                }
            } catch (error) {
                ;
            }
        })()
    }, [])
    return (
        <></>
    )
}

export default LoginStatus
"use client";
import MessageBox from '@/components/MessageBox'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiPhoneCall } from 'react-icons/fi';
import { GoSignOut } from 'react-icons/go';
import { FaFilePrescription } from 'react-icons/fa'
import axios from 'axios';
import { logoutUser } from '@/features/user/userSlice';
import { FaUserDoctor } from 'react-icons/fa6';

const Page = () => {
    const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));
    const userLoggedIn = useSelector((state) => state.user.loggedIn)
    const router = useRouter()
    const [showMessage, setShowMessage] = useState(false)
    const dispatch = useDispatch()
    useEffect(() => {
        if (!userLoggedIn)
            router.replace(`/login?returnTo=/account`)
    }, [])
    async function signOut() {
        try {
            setShowMessage({ loading: true, message: "Logging you out!" })
            let res = await axios.post("/api/logout", {}, { withCredentials: true })
            if (res.data.status == "success") {
                dispatch(logoutUser())
                setShowMessage({ success: true, message: "Logged Out Successfully!" })
                await timeout(500)
                setShowMessage(false)
            }
            else throw new Error("Error")
        } catch (error) {
            setShowMessage({ error: true, message: "Unable to Logout!" })
            await timeout(500)
            setShowMessage(false)
        }
    }
    return (
        <>
            {showMessage ? <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} message={showMessage.message} dismissable={showMessage.dismissable} setShowMessage={setShowMessage} /> : <></>}
            <div className='p-4 md:w-2/5 md:mx-auto'>
                <h1 className='mt-3 mb-3 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 '>Your Account</h1>
                <div className=' flex flex-col border-[1px] border-slate-200  rounded-xl text-slate-700'>
                    <Link href={'/consultations'}>
                        <div className='flex items-center space-x-3 md:py-5 md:pl-5 md:text-lg border-b-[1px] py-2 pl-3 hover:bg-slate-100 rounded-t-xl cursor-pointer'>
                            <FaFilePrescription className='text-xl md:text-3xl' />
                            <span>My Consultations</span>
                        </div>
                    </Link>
                    <Link href={'/consult-doctor'}>
                        <div className='flex items-center space-x-3 md:py-5 md:pl-5 md:text-lg border-b-[1px] py-2 pl-3 hover:bg-slate-100 rounded-t-xl cursor-pointer'>
                            <FaUserDoctor className='text-xl md:text-3xl' />
                            <span>Consut Doctor</span>
                        </div>
                    </Link>
                    <div className='flex items-center space-x-3 border-b-[1px] md:text-lg pl-3 py-2 hover:bg-slate-100 cursor-pointer md:py-5 md:pl-5' >
                        <FiPhoneCall className='text-xl md:text-3xl' />
                        <span>Contact Us</span>
                    </div>
                    <div onClick={signOut} className='py-2 pl-3 flex items-center md:text-lg space-x-3 hover:bg-slate-100 rounded-b-xl cursor-pointer md:py-5 md:pl-5'>
                        <GoSignOut className='text-xl md:text-3xl' />
                        <span>Sign Out</span>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Page
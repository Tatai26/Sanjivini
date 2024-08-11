"use client";
import MessageBox from '@/components/MessageBox';
import axios from 'axios';
import Error from 'next/error';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { FaCheckCircle } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import { IoMdCloseCircle } from "react-icons/io";
import Link from 'next/link';

const Page = () => {
    const userLoggedIn = useSelector((state) => state.user.loggedIn)
    const router = useRouter()
    const { consultationId } = useParams()
    const searchParams = useSearchParams()
    const payment_id = searchParams.get('payment_id')
    const [showMessage, setShowMessage] = useState({ loading: true, message: "Fetching payment Details..." })
    const [paymentSuccessfull, setPaymentSuccessfull] = useState(false)
    useEffect(() => {
        if (!userLoggedIn)
            router.replace(`/login?returnTo=/consultationPayment/${consultationId}?payment_id=${payment_id}`)
        else {
            (async () => {
                try {
                    let res = await axios.get(`/api/check-payment-status?payment_id=${payment_id}&consultationId=${consultationId}`, { withCredentials: true })
                    if (res.data.status != "success") throw new Error("Error")
                    setPaymentSuccessfull(res.data.paymentSuccessfull)
                    setShowMessage(false)
                } catch (error) {
                    setShowMessage({ error: true, message: "Unable to fetch payment details!" })
                }
            })()
        }
    }, [userLoggedIn])
    return (
        <>
            {showMessage && <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />}
            <div className='mt-[5rem] md:mt-[8rem] border-[1px] rounded-md mx-5 md:mx-64 p-4'>
                <div>
                    {paymentSuccessfull ?
                        <>
                            <div className='flex border-b-[1px] pb-2 mb-2 space-x-2 items-center'>
                                <FaCheckCircle className='text-2xl text-green-500' />
                                <h1 className='text-xl font-semibold text-green-500'>Payment successful</h1>
                            </div>
                            <h1>Your consultation has been confirmed</h1>
                            <div className='flex mt-2 space-x-1 md:text-base text-sm text-md text-indigo-600 items-center'>
                                <Link href={`/consult/${consultationId}`}>
                                    <span>Go to Chat </span>
                                </Link>
                                <FaArrowRightLong />
                            </div>
                        </>
                        :
                        <>
                            <div className='flex border-b-[1px] pb-2 mb-2 space-x-2 items-center'>
                                <IoMdCloseCircle className='text-2xl text-red-500' />
                                <h1 className='text-xl font-semibold text-red-500'>Payment failed</h1>
                            </div>
                            <h1>Sorry, your payment failed. Please try again.</h1>
                        </>
                    }
                </div>
            </div>
        </>
    )
}

export default Page
"use client";
import MessageBox from '@/components/MessageBox';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { decryptMessage } from '../../../../utils';

const Page = () => {
    const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));
    const doctorLoggedIn = useSelector((state) => state.doctor.loggedIn)
    const router = useRouter()
    const [showMessage, setShowMessage] = useState({ loading: true, message: "Loading..." })
    const [allConsultations, setAllConsultations] = useState([])
    useEffect(() => {
        if (!doctorLoggedIn)
            router.replace(`/doctor/login?returnTo=/doctor/consultations`)
        else
            (async () => {
                try {
                    let res = await axios.get(`/api/doctor/consultations`, { withCredentials: true })
                    if (res.data.status != "success") throw new Error("Error")
                    setAllConsultations(res.data.consultations)
                    setShowMessage(false)
                } catch (error) {
                    setShowMessage({ error: true, message: "Something went wrong!" })
                    await timeout(500)
                    router.back()
                }
            })()
    }, [])
    return (
        <>
            {showMessage && <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />}
            <div className='p-4'>
                {allConsultations.length == 0 ?
                    <div className=' min-h-[100vh] flex flex-col justify-around'>
                        <h1 className=' text-center text-2xl font-semibold'>No consultations to display</h1>
                    </div>
                    :
                    <>
                        <h1 className='text-center bold text-2xl mb-3'>All Consultations</h1>
                        <div className='md:w-[80%] mx-auto'>
                            {allConsultations.map((consultation) => {
                                return (<DisplayConsultation key={consultation._id} consultation={consultation} />)
                            })}
                        </div>
                    </>
                }
            </div>
        </>
    )
}

export default Page

function DisplayConsultation({ consultation }) {
    let lastMessage = consultation.chatMessages.length > 0 ? consultation.chatMessages[consultation.chatMessages.length - 1] : false
    let deCryptedMessage=""
    if(lastMessage && lastMessage.message)
        deCryptedMessage=decryptMessage(lastMessage.message,lastMessage.iv)
    return (
        <>
            <Link href={`/doctor/consult/${consultation.consultationId}`}>
                <div className='cursor-pointer border-2 mb-2 p-2'>
                    <div>Name: {consultation.patientDetails.name}</div>
                    <div>Age: {consultation.patientDetails.age} year(s)</div>
                    <div>Gender: {consultation.patientDetails.gender}</div>
                    {lastMessage &&
                        <div className={`text-right ${consultation.numberOfUnreadMessagesDoctor > 0 && "font-bold"}`}>
                            {consultation.numberOfUnreadMessagesDoctor > 0 && <p className='text-center'>New message</p>}
                            {lastMessage.videoCallStartTime ?
                                <div>
                                    Video call at {videoCallTimeStamp(lastMessage.videoCallStartTime)}
                                </div>
                                : lastMessage.message ?
                                    <div>
                                        {deCryptedMessage.length < 20 ? deCryptedMessage : (deCryptedMessage.substring(0, 10) + "...")}
                                    </div>
                                    :
                                    <div className=''>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline me-[0.125rem] pb-1">
                                            <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                                        </svg>
                                        <span>{lastMessage.attachment.originalFileName}</span>
                                    </div>
                            }
                        </div>
                    }
                </div>
            </Link>
        </>
    )
}

function videoCallTimeStamp(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: "2-digit",
        //   month: 'short',
        month: "2-digit",
        day: "2-digit"
    }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
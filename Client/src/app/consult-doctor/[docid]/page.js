"use client";
import MessageBox from '@/components/MessageBox';
import axios from 'axios';
import Error from 'next/error';
import { useRouter, useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const Page = () => {
    const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));
    const userLoggedIn = useSelector((state) => state.user.loggedIn)
    const router = useRouter()
    const { docid } = useParams()
    const [showMessage, setShowMessage] = useState(false)
    const [doctorDetails, setDoctorDetails] = useState(false)
    const [patientDetails, setPatientDetails] = useState({ name: "", age: "", gender: "Male" })
    function updatePatientDetails(evt) {
        setPatientDetails((curr) => {
            curr[evt.target.name] = evt.target.value
            return ({ ...curr })
        })
    }
    useEffect(() => {
        if (!userLoggedIn)
            router.replace(`/login?returnTo=/consult-doctor/${docid}`)
        else
            (async () => {
                try {
                    let res = await axios.get(`/api/doctor-info/${docid}`, { withCredentials: true })
                    if (res.data.status != "success") throw new Error("Error")
                    setDoctorDetails(res.data.doctor)
                } catch (error) {
                    setShowMessage({ error: true, message: "Something went wrong!" })
                    await timeout(500)
                    router.back()
                }
            })()
    }, [])
    function arePatientDetailsCorrect() {
        if (patientDetails.name == "")
            setShowMessage({ error: true, message: "Enter Patient name", dismissable: true })
        else if (patientDetails.age <= 0)
            setShowMessage({ error: true, message: "Enter valid Age", dismissable: true })
        else
            return true
        return false
    }
    async function bookConsultation(consultationType) {
        try {
            if (!arePatientDetailsCorrect()) return;
            setShowMessage({ loading: true, message: "Loading...Please wait" })
            let res = await axios.post(`/api/book-consultation`, { ...patientDetails, docid, consultationType }, { withCredentials: true })
            if (res.data.status != "success") throw new Error("Error")
            router.replace(res.data.paymentUrl)
        } catch (error) {
            setShowMessage({ error: true, message: "Something went wrong!", dismissable: true })
        }
    }
    return (
        <>
            {showMessage && <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />}
            <div className='flex w-full md:justify-around flex-col md:flex-row py-2 px-4 flex-wrap'>
                <div className='md:w-[45%] w-full text-center mt-4'>
                    <p className=' md:text-2xl text-xl'>Doctor Details</p>
                    <div className='text-left text-md md:text-xl'>
                        <p>Name: {doctorDetails && doctorDetails.name}</p>
                        <p>Qualifications: {doctorDetails && doctorDetails.qualification}</p>
                        <p>Experience: {doctorDetails && doctorDetails.experience} years</p>
                        <p>Practice Address: {doctorDetails && doctorDetails.practiceAddress}</p>
                        <p>Specialization(s):{doctorDetails && doctorDetails.specialization.join(', ')}</p>
                        <p>Languages Spoken(s):{doctorDetails && doctorDetails.languagesSpoken.join(', ')}</p>
                    </div>
                </div>
                <div className='md:w-[45%] w-full text-center mt-4'>
                    <span className='text-xl md:text-2xl'>Patient Details</span>
                    <div className='text-left mt-3 text-md md:text-xl'>
                        <div>
                            <label htmlFor="name" className="text-md leading-6 text-gray-900">
                                Name<span className='text-red-500'> *</span>
                            </label>
                            <input value={patientDetails.name} onChange={updatePatientDetails} id="name" name="name" type="text" autoComplete="name" required
                                className="px-2 ms-3 w-[50%] rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                        <div className='mt-3'>
                            <label htmlFor="age" className="text-md leading-6 text-gray-900">
                                Age ( in years )<span className='text-red-500'> *</span>
                            </label>
                            <input value={patientDetails.age} onChange={updatePatientDetails} id="age" name="age" type="number" autoComplete="age" required
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-2 ms-3 w-[20%] md:w-[10%] rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                        <div className='mt-4'>
                            <label htmlFor="gender" className="text-md leading-6 text-gray-900">Gender<span className='text-red-500'> *</span></label>
                            <select id='gender' value={patientDetails.gender} onChange={updatePatientDetails} className='ms-2 border-2 border-black' name='gender'>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div className='mt-4'>
                            <button onClick={() => { bookConsultation('Video Call') }} className='block md:inline m-2 border px-4 py-2 rounded bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>Video Consultation ₹{doctorDetails.consultationFeeVideoCall}</button>
                            <button onClick={() => { bookConsultation('Chat') }} className='block md:inline m-2 border px-4 py-2 rounded bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>Chat Consultation ₹{doctorDetails.consultationFeeChat}</button>
                        </div>
                    </div>
                    <div className='mt-4 text-xl'>
                        <span className='text-red-500'> *</span>
                        <span>All consultations are valid for 3 days</span>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Page
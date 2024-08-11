'use client';
import MessageBox from "@/components/MessageBox";
import { loginDoctor } from "@/features/doctor/doctorSlice";
import axios from "axios";
import Error from "next/error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react"
import { useDispatch } from "react-redux";
import Select from 'react-select';

const specializationOptions = [
    { value: 'Bone & Joint Specialist', label: 'Bone & Joint Specialist' },
    { value: 'Chest Physician', label: 'Chest Physician' },
    { value: 'Child Specialist', label: 'Child Specialist' },
    { value: 'Dentist', label: 'Dentist' },
    { value: 'Diabetes Specialist', label: 'Diabetes Specialist' },
    { value: 'Dietician', label: 'Dietician' },
    { value: 'Ear Nose Throat Specialist', label: 'Ear Nose Throat Specialist' },
    { value: 'Endocrinology', label: 'Endocrinology' },
    { value: 'Eye Specialist', label: 'Eye Specialist' },
    { value: 'Gastroenterologist', label: 'Gastroenterologist' },
    { value: 'General Physician', label: 'General Physician' },
    { value: 'General Surgeon', label: 'General Surgeon' },
    { value: 'Gynaecologist', label: 'Gynaecologist' },
    { value: 'Heart Specialist', label: 'Heart Specialist' },
    { value: 'MD Physician', label: 'MD Physician' },
    { value: 'Nephrologist', label: 'Nephrologist' },
    { value: 'Neurologist', label: 'Neurologist' },
    { value: 'Physiotherapist', label: 'Physiotherapist' },
    { value: 'Psychiatrist', label: 'Psychiatrist' },
    { value: 'Sexologist', label: 'Sexologist' },
    { value: 'Skin & Hair Specialist', label: 'Skin & Hair Specialist' },
    { value: 'Urologist', label: 'Urologist' },
];

export default function Page() {
    const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));
    const dispatch = useDispatch()
    const router = useRouter()
    const [formDetails, setFormDetails] = useState({ name: "", email: "", password1: "", password2: "", showPass: false, specialization: [], qualification: "", experience: "", languagesSpoken: "", consultationFeeChat: "", consultationFeeVideoCall: "", practiceAddress: "" })
    const [showMessage, setShowMessage] = useState(false)
    function updateFormDetails(evt) {
        setFormDetails((curr) => {
            if (evt.target.name == "showPass")
                curr[evt.target.name] = evt.target.checked
            else
                curr[evt.target.name] = evt.target.value
            return ({ ...curr })
        })
    }
    function updateSpecialization(spel) {
        setFormDetails((curr) => {
            curr.specialization = spel
            return ({ ...curr })
        })
    }
    function isFormDataIncorrect() {
        if (formDetails.password1 != formDetails.password2)
            setShowMessage({ error: true, message: "Passwords do not match!", dismissable: true })
        else if (formDetails.consultationFeeChat <= 0)
            setShowMessage({ error: true, message: "Chat consultation fee must be greater than 0", dismissable: true })
        else if (formDetails.consultationFeeVideoCall <= 0)
            setShowMessage({ error: true, message: "Video call consultation fee must be greater than 0", dismissable: true })
        else if (formDetails.specialization.length == 0)
            setShowMessage({ error: true, message: "Add atleast 1 Specialization", dismissable: true })
        else return false
        return true;
    }
    async function handleSubmit(evt) {
        evt.preventDefault();
        try {
            if (isFormDataIncorrect()) return;
            setShowMessage({ loading: true, message: "Loading..." })
            let res = await axios.post(`/api/doctor/signup`, formDetails, { withCredentials: true })
            if (res.data.status == "success") {
                dispatch(loginDoctor(res.data._id))
                setShowMessage({ success: true, message: "Account created Successfully!" })
                await timeout(500)
                router.replace("/")
            }
            else if (res.data.registered == "true") {
                setShowMessage({ error: true, message: "Doctor already registered!", dismissable: true })
            }
            else
                throw new Error("Error")
        } catch (error) {
            setShowMessage({ error: true, message: "Something went wrong!", dismissable: true })
        }
    }
    return (
        <>
            {showMessage && <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />}
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 pt-2 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <Link href="/">
                        <img className="mx-auto h-[30vh] w-auto" src="/logo.png" alt="Sanjivini" />
                    </Link>
                    <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                        Sign Up
                    </h2>
                </div>
                <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={handleSubmit} className="space-y-2" >
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Name<span className='text-red-500'> *</span>
                            </label>
                            <div className="mt-2">
                                <input value={formDetails.name} onChange={updateFormDetails} id="name" name="name" type="text" autoComplete="name" required
                                    className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address<span className='text-red-500'> *</span>
                            </label>
                            <div className="mt-2">
                                <input value={formDetails.email} onChange={updateFormDetails} id="email" name="email" type="email" autoComplete="email" required
                                    className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password1" className="block text-sm font-medium leading-6 text-gray-900">
                                    Password<span className='text-red-500'> *</span>
                                </label>
                            </div>
                            <div className="mt-2">
                                <input value={formDetails.password1} onChange={updateFormDetails} id="password1" name="password1" type={formDetails.showPass ? "text" : "password"} required
                                    className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password2" className="block text-sm font-medium leading-6 text-gray-900">
                                    Confirm Password<span className='text-red-500'> *</span>
                                </label>
                            </div>
                            <div className="mt-2">
                                <input value={formDetails.password2} onChange={updateFormDetails} id="password2" name="password2" type={formDetails.showPass ? "text" : "password"} required
                                    className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <input onChange={updateFormDetails} checked={formDetails.showPass} name="showPass" type="checkbox" id="showPass" className="" />
                        <label htmlFor="showPass" className="ms-2">Show Password</label>
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password2" className="block text-sm font-medium leading-6 text-gray-900">
                                    Specialization(s)<span className='text-red-500'> *</span>
                                </label>
                            </div>
                            <Select
                                options={specializationOptions}
                                isMulti
                                name="specialization"
                                onChange={updateSpecialization}
                                value={formDetails.specialization}
                            />
                        </div>
                        <div className="grid md:grid-cols-2 md:gap-6" >
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="practiceAddress" className="block text-sm font-medium leading-6 text-gray-900">
                                        Practice Address<span className='text-red-500'> *</span>
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <textarea rows={3} value={formDetails.practiceAddress} onChange={updateFormDetails} id="practiceAddress" name="practiceAddress" type="text" required
                                        className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    ></textarea>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="qualification" className="block text-sm font-medium leading-6 text-gray-900">
                                        Qualification<span className='text-red-500'> *</span>
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <textarea rows={3} value={formDetails.qualification} onChange={updateFormDetails} id="qualification" name="qualification" className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 md:gap-6" >
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="experience" className="block text-sm font-medium leading-6 text-gray-900">
                                        Experience<div className="hidden md:block"></div> (in years)<span className='text-red-500'> *</span>
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <input type="number" value={formDetails.experience} onChange={updateFormDetails} id="experience" name="experience" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="languagesSpoken" className="block text-sm font-medium leading-6 text-gray-900">
                                        Languages Spoken (comma seperated)<span className='text-red-500'> *</span>
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <input type="text" value={formDetails.languagesSpoken} onChange={updateFormDetails} id="languagesSpoken" name="languagesSpoken" className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                </div>
                            </div>
                        </div>
                        <p className="block text-md font-medium leading-6 text-gray-900">Consultation Fee</p>
                        <div className="grid md:grid-cols-2 md:gap-6" >
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="consultationFeeChat" className="block text-sm font-medium leading-6 text-gray-900">
                                        Chat<span className='text-red-500'> *</span>
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <input type="number" value={formDetails.consultationFeeChat} onChange={updateFormDetails} id="consultationFeeChat" name="consultationFeeChat" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="consultationFeeVideoCall" className="block text-sm font-medium leading-6 text-gray-900">
                                        Video Call<span className='text-red-500'> *</span>
                                    </label>
                                </div>
                                <div className="mt-2">
                                    <input type="number" value={formDetails.consultationFeeVideoCall} onChange={updateFormDetails} id="consultationFeeVideoCall" name="consultationFeeVideoCall" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <button type="submit"
                                className="mt-5 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>
                </div>
                <Link href={"/doctor/login"} className="text-center hover:underline mt-5">
                    <p>Already have an Account?</p>
                    <p>Sign In</p>
                </Link>
            </div>
        </>
    )
}

'use client';
import MessageBox from "@/components/MessageBox";
import { loginDoctor } from "@/features/doctor/doctorSlice";
import axios from "axios";
import Error from "next/error";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux";

function Login() {
    const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));
    const dispatch = useDispatch()
    const router = useRouter()
    const doctorLoggedIn = useSelector((state) => state.doctor.loggedIn)
    const searchParams = useSearchParams()
    let returnTo = searchParams.get('returnTo')
    useEffect(() => {
        if (doctorLoggedIn) {
            if (returnTo)
                router.replace(returnTo, { shallow: true })
            else
                router.replace("/doctor", { shallow: true })
        }
    }, [doctorLoggedIn, router])
    const [formDetails, setFormDetails] = useState({ email: "", password: "", showPass: false })
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
    async function handleSubmit(evt) {
        evt.preventDefault();
        try {
            setShowMessage({ loading: true, message: "Loading..." })
            let res = await axios.post(`/api/doctor/login`, formDetails, { withCredentials: true })
            if (res.data.status == "success") {
                dispatch(loginDoctor(res.data._id))
                setShowMessage({ success: true, message: "Logged in Successfully!" })
                await timeout(500)
                if (returnTo)
                    return router.replace(returnTo)
                else
                    return router.replace("/doctor")
            }
            else if (res.data.incorectCredentials == "true") {
                setShowMessage({ error: true, message: "Incorrect Credentials!", dismissable: true })
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
                        Sign In
                    </h2>
                </div>
                <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={handleSubmit} className="space-y-6" >
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input value={formDetails.email} onChange={updateFormDetails} id="email" name="email" type="email" autoComplete="email" required
                                    className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    Password
                                </label>
                            </div>
                            <div className="mt-2">
                                <input value={formDetails.password} onChange={updateFormDetails} id="password" name="password" type={formDetails.showPass ? "text" : "password"} autoComplete="current-password" required
                                    className="px-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <input onChange={updateFormDetails} checked={formDetails.showPass} name="showPass" type="checkbox" id="showPass" className="" />
                        <label htmlFor="showPass" className="ms-2">Show Password</label>
                        <div>
                            <button type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Sign In
                            </button>
                        </div>
                    </form>
                </div>
                <Link href={"/doctor/signup"} className="text-center hover:underline mt-5">
                    <p>Don&apos;t have an Account?</p>
                    <p>Sign Up</p>
                </Link>
            </div>
        </>
    )
}

const PageWithSuspense = () => (
    <Suspense fallback={<MessageBox error={true} message={"Something went wrong!"} />}>
        <Login />
    </Suspense>
);

export default PageWithSuspense

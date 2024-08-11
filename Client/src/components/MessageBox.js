function MessageBox({ success, error, loading, message, dismissable = false, setShowMessage }) {
    return (
        <div className="fixed flex space-around top-0 left-0 min-h-screen w-full bg-slate-200 bg-opacity-90 z-10">
            <div className="rounded-lg p-5 text-center mx-auto my-auto min-h-[30%] min-w-[20%] max-w-fit bg-white">
                <div className="flex justify-around">
                    {success ? <img src="/icons8-success.gif" /> : <></>}
                    {error ? <img src="/icons8-error-48.png" /> : <></>}
                    {loading ? <img src="/icons8-loading.gif" /> : <></>}
                </div>
                <div className="my-4">
                    {message}
                </div>
                {dismissable ?
                    <button onClick={()=>{setShowMessage(false)}} className="px-5 py-2 focus:ring-blue-300 mb-3 md:mb-0 font-medium border-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">Close</button>
                    : <></>}
            </div>
        </div>
    )
}

export default MessageBox
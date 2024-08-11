"use client";
import MessageBox from '@/components/MessageBox';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux';
import { uniqBy } from "lodash";
import { decryptMessage, encryptMessage } from '../../../../utils';

const Page = () => {
  const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));
  let wssAddress = process.env.NEXT_PUBLIC_WSS_ADDRESS
  const userLoggedIn = useSelector((state) => state.user.loggedIn)
  const userid = useSelector((state) => state.user._id)
  const router = useRouter()
  const { consultationId } = useParams()
  const [showMessage, setShowMessage] = useState({ loading: true, message: "Loading messages..." })
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false)
  const [consultationDetails, setConsultationDetails] = useState(false)
  const [ws, setWs] = useState(null);
  const [newTextMessage, setNewTextMessage] = useState("")
  const [allMessages, setAllMessages] = useState([])
  const divUnderMessages = useRef();

  useEffect(() => {
    if (!userLoggedIn)
      router.replace(`/login?returnTo=/consult/${consultationId}`)
    else {
      (async () => {
        try {
          let res = await axios.get(`/api/consultation/${consultationId}`, { withCredentials: true })
          if (res.data.status != "success") throw new Error("Error")
          setConsultationDetails(res.data.consultation)
          setAllMessages(res.data.consultation.chatMessages)
          setShowMessage(false)
          connectToWs()
          setIsInitialLoadComplete(true)
        } catch (error) {
          setShowMessage({ error: true, message: "Something went wrong!" })
          await timeout(500)
          router.back()
        }
      })()
    }
  }, [userLoggedIn])
  useEffect(() => {
    const div1 = divUnderMessages.current;
    if (div1) div1.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [allMessages]);
  function connectToWs() {
    const ws = new WebSocket(wssAddress);
    ws.onopen = () => {
      let cookieData = { forAuthentication: true, _id: userid };
      ws.send(JSON.stringify(cookieData));
    };
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    ws.onerror = (error) => {
      setShowMessage({ error: true, message: "Cannot connect" })
      setIsInitialLoadComplete(false)
    };
    ws.addEventListener('close', () => {
      setTimeout(connectToWs, 1000);
    });
  }
  function sendTextMessage(evt) {
    evt.preventDefault();
    let encryptedData = encryptMessage(newTextMessage)
    ws.send(JSON.stringify({ recipient: consultationDetails.docid._id, text: encryptedData.encryptedData, iv: encryptedData.iv, consultationId: consultationId }));
    setNewTextMessage("")
  }
  function sendFile(evt) {
    evt.preventDefault();
    const fileInput = document.getElementById('fileupload');
    const fileForm = document.querySelector(".messageForm")
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      ws.send(JSON.stringify({ recipient: consultationDetails.docid._id, fileName: file.name, file: reader.result, fileType: file.type, consultationId: consultationId }));
    };
    fileForm.reset();
  }
  function handleMessage(evt) {
    try {
      const messageData = JSON.parse(evt.data);
      if (messageData.newMessage) {
        setAllMessages((curr) => {
          let t = [...curr, messageData.message]
          return (uniqBy(t, '_id'))
        })
      }
    } catch (error) {
      ;
    }
  }
  async function serveFile(fileName, fileType) {
    try {
      let res = await axios.get(`/api/consultation/${consultationId}/${fileName}`, { withCredentials: true })
      const dataUrl = res.data;
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++)
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileType });
      const convertedFile = new File([blob], fileName, { type: fileType });
      const fileUrl = URL.createObjectURL(convertedFile);
      window.open(fileUrl, '_blank');
    } catch (error) {
      setShowMessage({ error: true, message: "Unable to open file", dismissable: true })
    }
  }
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
  }
  function videoCallTimeStamp(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  function chatMessageTimeStamp(date) {
    date = new Date(date)
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${formattedHours}:${formattedMinutes} ${ampm}, ${month}/${day}/${year}`;
  }
  async function bookConsultation() {
    try {
      setShowMessage({ loading: true, message: "Loading...Please wait" })
      let res = await axios.post(`/api/book-consultation`, { name: consultationDetails.patientDetails.name, age: consultationDetails.patientDetails.age, gender: consultationDetails.patientDetails.gender, docid: consultationDetails.docid._id, consultationType: consultationDetails.consultationType, consultationIdOld: consultationDetails.consultationId }, { withCredentials: true })
      if (res.data.status != "success") throw new Error("Error")
      router.push(res.data.paymentUrl)
    } catch (error) {
      setShowMessage({ error: true, message: "Something went wrong!", dismissable: true })
    }
  }
  if (!isInitialLoadComplete)
    return (<MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />)
  return (
    <>
      {showMessage && <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />}
      <div className='p-4 min-h-screen flex flex-col'>
        <div className='md:flex md:flex-cloumn justify-center'>
          <div className='w-full md:w-max me-10 mb-5 md:mb-0'>
            <span className=' block text-xl'>Doctor Name: {consultationDetails.docid.name}</span>
            <span className=' block text-xl'>Last consultation: {formatDate(consultationDetails.lastConsultationDate)}</span>
            <span className=' block text-xl'>Consultation Fee: ₹{consultationDetails.feePaid}</span>
          </div>
          <div className='w-full md:w-max'>
            <span className='block text-xl'>Name: {consultationDetails.patientDetails.name}</span>
            <span className='block text-xl'>Age: {consultationDetails.patientDetails.age} years</span>
            <span className='block text-xl'>Gender: {consultationDetails.patientDetails.gender}</span>
          </div>
        </div>
        <div className='bg-green-100 w-full md:w-[50%] mx-auto mt-10 flex-1'>
          <div className='flex-1 min-h-[80vh] max-h-[100vh] overflow-y-auto pt-8'>
            {allMessages.map((message) => {
              if (message.videoCallStartTime) {
                return (
                  <div key={message._id} className='text-center mb-5'>
                    <span className=' bg-white px-3 py-2 rounded-md'>Video call at {videoCallTimeStamp(message.videoCallStartTime)}</span>
                  </div>
                )
              }
              if (message.message)
                return (
                  <div key={message._id} className={`${message.senderId.toString() == consultationDetails.userid.toString() ? "ml-auto rounded-l-lg rounded-tr-lg me-2" : "ms-2 mr-auto rounded-r-lg rounded-tl-lg"} px-2 mb-2 py-1 break-words max-w-[80%] w-fit bg-blue-500`} >
                    {/* {message.message} */}
                    {decryptMessage(message.message, message.iv)}
                    <div className=' text-xs text-right'>{chatMessageTimeStamp(message.timestamp)}</div>
                  </div>
                )
              return (
                <div key={message._id} onClick={() => { serveFile(message.attachment.fileName, message.attachment.fileType) }} className={`${message.senderId.toString() == consultationDetails.userid.toString() ? "ml-auto rounded-l-lg rounded-tr-lg me-2" : "ms-2 mr-auto rounded-r-lg rounded-tl-lg"} cursor-pointer px-2 mb-2 py-1 max-w-fit bg-blue-500`} >
                  <div className='border-b border-black'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline me-[0.125rem] pb-1">
                      <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                    </svg>
                    <span className='break-words max-w-[80%] w-fit'>{message.attachment.originalFileName}</span>
                  </div>
                  <div className=' text-xs text-right'>{chatMessageTimeStamp(message.timestamp)}</div>
                </div>
              )
            })}
            <div ref={divUnderMessages}></div>
          </div>
          {isLessThanThreeDaysAgo(consultationDetails.lastConsultationDate) && consultationDetails.paymentStatus == "Successfull" ?
            <form onSubmit={sendTextMessage} className='flex messageForm'>
              <input value={newTextMessage} onChange={(evt) => { setNewTextMessage(evt.target.value) }} placeholder='Enter you message...' className='flex-1 inline px-2 py-1 resize-none border border-gray-800 flex-wrap break-words' rows={1} type='text' name='text' ></input>
              <label htmlFor='fileupload' className='bg-white border border-gray-800 ms-1 cursor-pointer p-2'>
                <input onChange={sendFile} id='fileupload' name='file' type='file' multiple={false} className='hidden' />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 ">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
              </label>
              <button type='submit' className="bg-white border border-gray-800 ms-1 px-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
            :
            <div className='text-center'>
              <div className=' text-red-500 mb-3 text-2xl text-center'>
                Consultation Expired
              </div>
              <button onClick={bookConsultation} className='block md:inline m-2 border px-4 py-2 rounded bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>Consult Again!</button>
            </div>
          }
        </div>
      </div >
    </>
  )
}

export default Page

function isLessThanThreeDaysAgo(date) {
  const inputDate = new Date(date);
  const now = new Date();
  const differenceInMilliseconds = now - inputDate;
  const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
  return differenceInDays < 3;
}
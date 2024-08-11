import React, { useEffect, useRef, useState } from 'react'
import { PiPhoneDisconnectFill } from 'react-icons/pi'
import Peer from "simple-peer"
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';

const VideoCallComponent = ({ ws }) => {
  const [stream, setStream] = useState(true)
  const [receivingCall, setReceivingCall] = useState(false)
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [name, setName] = useState("")
  const [receivingCallId, setReceivingCallId] = useState("")
  const [callStarted, setCallStarted] = useState(false)
  const [showCallEnded, setShowCallEnded] = useState(false)
  const [isMikeOn, setIsMikeOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()

  const toggleMute = () => {
    setIsMikeOn((enabled) => {
      // myVideo.current.srcObject.getAudioTracks()[0].enabled = !enabled;
      myVideo.current.srcObject.getAudioTracks().forEach((track) => { track.enabled = !enabled });
      return (!enabled)
    })
  };
  const toggleVideo = () => {
    setIsCameraOn((enabled) => {
      // myVideo.current.srcObject.getVideoTracks()[0].enabled = !enabled;
      myVideo.current.srcObject.getVideoTracks().forEach((track) => { track.enabled = !enabled });
      return (!enabled)
    })
  };
  useEffect(() => {
    ws.addEventListener('message', handleMessage);
  }, [])
  function handleMessage(evt) {
    try {
      const messageData = JSON.parse(evt.data);
      if (messageData.receivingCall) {
        setCallStarted(true)
        setReceivingCall(true)
        setName(messageData.name)
        setCallerSignal(messageData.signal)
        setReceivingCallId(messageData.from)
      }
      else if (messageData.callEnded) {
        stopVideoForCallEnded()
      }
    } catch (error) {
      ;
    }
  }
  const leaveCall = () => {
    ws.send(JSON.stringify({ forVideoCalling: true, callEnded: true, to: receivingCallId }))
    stopVideoForCallEnded()
  }
  function stopVideoForCallEnded() {
    setShowCallEnded(true)
    setTimeout(() => {
      window.location.reload()
    }, 1000);
    // setCallStarted(false)
    // if (connectionRef.current)
    //   connectionRef.current.destroy()
    // connectionRef.current = ""
    // setStream(false)
    // myVideo.current.srcObject.getTracks().forEach((track) => { track.stop(); });
    // setReceivingCall(false)
    // setCallAccepted(false)
    // setCallerSignal(false)
    // setReceivingCallId(false)
    // setName("")
  }
  async function getUserVideo() {
    try {
      let streamLocal = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(streamLocal)
      myVideo.current.srcObject = streamLocal
      return streamLocal
    } catch (error) {
      ;
    }
  }
  const answerCall = async () => {
    let currentStream = await getUserVideo()
    setCallAccepted(true)
    let peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream
    })
    peer.on("signal", (data) => {
      ws.send(JSON.stringify({ forVideoCalling: true, answerCall: true, signal: data, to: receivingCallId }))
    })
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    })
    peer.signal(callerSignal)
    connectionRef.current = peer
  }
  if (!callStarted) return (<></>)
  return (
    <>
      <div className="w-full min-h-[100vh] z-30 sticky top-0 bg-black bg-opacity-90 ">
        {showCallEnded ?
          <>
            <div className='min-h-[100vh] flex items-center justify-center text-center text-4xl text-white' >
              Call Ended
            </div>
          </>
          :
          <>
            <div className="flex justify-evenly ">
              {stream &&
                <div>
                  <video className='w-[45vw] h-[70vh] md:h-[80vh]' playsInline={true} muted={true} ref={myVideo} autoPlay={true} />
                </div>
              }
              {callAccepted &&
                <div>
                  <video className='w-[45vw] h-[70vh] md:h-[80vh]' playsInline ref={userVideo} autoPlay />
                </div>
              }
            </div>
            {callAccepted && (
              <div className=' text-center text-white text-3xl'>
                <span onClick={toggleMute} className='me-5 cursor-pointer ' >{isMikeOn ? <FaMicrophoneSlash className='inline' /> : <FaMicrophone className='inline' />}</span>
                <span onClick={toggleVideo} className=' cursor-pointer' >{isCameraOn ? <FaVideoSlash className='inline' /> : <FaVideo className='inline' />}</span>
              </div>
            )}
            <div className=' text-center '>
              {receivingCall && !callAccepted && (
                <div className="text-white inline me-4">
                  <span className='text-3xl'>
                    <p>Incomming call from {name}</p>
                  </span>
                  <button className='mx-auto text-xl px-4 py-2 bg-green-500 rounded-md mt-3' onClick={answerCall}>
                    <FaVideo className='inline me-2' />
                    Answer
                  </button>
                </div>
              )}
              {callStarted && (
                <button className=' text-xl mt-3 bg-red-600 rounded-md text-white px-4 py-2 ' onClick={leaveCall}>
                  <PiPhoneDisconnectFill className=' me-2 inline' />
                  <span className=' text-white'>End Call</span>
                </button>
              )}
            </div>
          </>}
      </div>
    </>
  )
}

export default VideoCallComponent

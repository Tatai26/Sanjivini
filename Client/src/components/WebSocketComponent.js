import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import NewMessageToast from './NewMessageToast';
import { useRouter } from 'next/navigation';
import VideoCallComponent from './VideoCallComponent';
import { decryptMessage } from '../../utils';

const WebSocketComponent = () => {
    let wssAddress = process.env.NEXT_PUBLIC_WSS_ADDRESS
    const doctorLoggedIn = useSelector((state) => state.doctor.loggedIn)
    const docid = useSelector((state) => state.doctor._id)
    const userid = useSelector((state) => state.user._id)
    const userLoggedIn = useSelector((state) => state.user.loggedIn)
    const router = useRouter()
    const [ws, setWs] = useState(false)
    function connectToWs() {
        const ws = new WebSocket(wssAddress);
        ws.onopen = () => {
            let cookieData = { forAuthentication:true,_id: docid?docid:userid };
            ws.send(JSON.stringify(cookieData));
        };
        setWs(ws)
        ws.addEventListener('message', handleMessage);
        ws.onerror = (error) => { ; };
        ws.addEventListener('close', () => {
            setTimeout(connectToWs, 1000);
        });
    }
    useEffect(() => {
        if (!userLoggedIn && !doctorLoggedIn) return;
        connectToWs()
    }, [userLoggedIn, doctorLoggedIn])
    useEffect(() => {
        if ("Notification" in window)
            Notification.requestPermission()
    }, []);
    function handleMessage(evt) {
        try {
            const messageData = JSON.parse(evt.data);
            if(messageData.message.message)
                messageData.message.message=decryptMessage(messageData.message.message,messageData.message.iv)
            if (messageData.newMessage) {
                if (messageData.reciever == userid || messageData.reciever == docid) {
                    toast(<NewMessageToast messageData={messageData} />,
                        {
                            position: "bottom-right",
                            hideProgressBar: true,
                            pauseOnHover: false,
                            closeOnClick: true,
                            onClick: () => {
                                router.push(`${doctorLoggedIn ? "/doctor" : ""}/consult/${messageData.consultationId}`)
                            },
                        })
                    if ("Notification" in window) {
                        let notification = new Notification("New Message", {
                            body: `${messageData.recieverName}${"\n"}${messageData.message.message ?
                                messageData.message.message.length < 20 ? messageData.message.message : (messageData.message.message.substring(0, 20) + "...")
                                :
                                ("File: " + messageData.message.attachment.originalFileName)}`,
                            icon: "/logo.png"
                        })
                        notification.addEventListener("click", () => {
                            window.focus()
                        })
                    }
                }
            }
            else if (messageData.receivingCall) {
                if ("Notification" in window) {
                    let notification = new Notification(`Incomming call from ${messageData.name}`, {
                        // body: "",
                        icon: "/logo.png"
                    })
                    notification.addEventListener("click", () => {
                        window.focus()
                    })
                }
            }
        } catch (error) {
            ;
        }
    }
    return (
        <>
            {ws && userLoggedIn && <VideoCallComponent ws={ws} />}
        </>
    )
}

export default WebSocketComponent
"use client";
import { React, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Tooltip from '@mui/material/Tooltip';
import { MdAccountCircle } from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import axios from 'axios';
import { logoutDoctor } from '@/features/doctor/doctorSlice';
import MessageBox from './MessageBox';
import Error from 'next/error';

function DoctorNavbar() {
    const timeout = (time) => new Promise(resolve => setTimeout(resolve, time));
    const [anchorElUser, setAnchorElUser] = useState(null);
    const doctorLoggedIn = useSelector((state) => state.doctor.loggedIn)
    const [showMessage, setShowMessage] = useState(false)
    const dispatch = useDispatch()
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };
    async function signOut() {
        try {
            handleCloseUserMenu()
            setShowMessage({loading:true,message: "Logging you out!"})
            let res = await axios.post("/api/doctor/logout",{},{withCredentials:true})
            if (res.data.status == "success") {
                dispatch(logoutDoctor())
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
            {showMessage && <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />}
            <AppBar position="static">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <Link href={"/doctor"}>
                            <img className=' h-10 rounded-full me-3 ' src="/logo.png" alt="" />
                        </Link>
                        <Link href={"/doctor"}>
                            <p className=' text-xl'>Sanjivini</p>
                        </Link>
                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: "center" }}>
                            <Link href={"/"} ><p className=' text-white text-lg block ms-5 cursor-pointer'>Patient Home Page</p></Link>
                            <Link href={"/doctor/consultations"} ><p className=' text-white text-lg block ms-5 cursor-pointer'>Consultations</p></Link>
                        </Box>
                        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} ></Box>
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip className=' rounded-md px-2' >
                                <IconButton className='text-white' onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                    <MdAccountCircle className='inline me-1' />
                                    <span className='mb-1 hidden md:inline'>Account</span>
                                </IconButton>
                            </Tooltip>
                            <Menu sx={{ mt: '45px' }} id="menu-appbar" keepMounted anchorEl={anchorElUser}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                                open={Boolean(anchorElUser)} onClose={handleCloseUserMenu}
                            >
                                <div className='px-4 py-1 text-center'>
                                    {doctorLoggedIn ?
                                        <>
                                            <p onClick={signOut} className='cursor-pointer hover:underline'>Sign Out</p>
                                            <Link onClick={handleCloseUserMenu} href={"/doctor/consultations"} ><p className='cursor-pointer hover:underline'>Consultations</p></Link>
                                            <Link onClick={handleCloseUserMenu} href={"/doctor/account"} ><p className='cursor-pointer hover:underline'>My Account</p></Link>
                                        </>
                                        :
                                        <>
                                            <Link onClick={handleCloseUserMenu} href={"/doctor/login"} ><p className='cursor-pointer hover:underline'>Sign in</p></Link>
                                            <Link className='cursor-pointer hover:underline' onClick={handleCloseUserMenu} href={"/doctor/signup"}>
                                                <span className='block'>Don&apos;t have an Account?</span>
                                                Sign Up
                                            </Link>
                                        </>
                                    }
                                    <Link onClick={handleCloseUserMenu} href={"/"} ><p className='cursor-pointer hover:underline'>Patient Home Page</p></Link>
                                </div>
                            </Menu>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
        </>
    );
}
export default DoctorNavbar;
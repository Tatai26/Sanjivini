"use client";
import { StoreProvider } from "@/store/provider";
import "./globals.css";
import LoginStatus from "@/components/LoginStatus";
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import WebSocketComponent from "@/components/WebSocketComponent";
import PatientNavbar from "@/components/PatientNavbar";
import { usePathname } from 'next/navigation'
import DoctorNavbar from "@/components/DoctorNavbar";
import Footer from "@/components/Footer";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isDoctorRoute = pathname.startsWith('/doctor');
  return (
    <StoreProvider>
      <html lang="en">
        <head>
          <title>Sanjivini</title>
          <link rel="icon" href="/logo.png" />
          <meta property="og:image" content="/icon.png" />
        </head>
        <body>
          <LoginStatus />
          <WebSocketComponent />
          <nav>
            {isDoctorRoute ? <DoctorNavbar /> : <PatientNavbar />}
          </nav>
          <main className=" min-h-[80vh]">
            {children}
          </main>
          <ToastContainer transition={Slide} />
          <Footer />
        </body>
      </html>
    </StoreProvider>
  );
}
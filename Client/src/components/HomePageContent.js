import React from 'react'

const HomePageContent = () => {
    return (
        <div className='flex flex-wrap'>
            <div className='flex flex-wrap w-full'>
                <div className='w-full md:w-2/5'>
                    <img src='d1.png' className='w-full' />
                </div>
                <div className='w-full md:w-3/5'>
                    <h2 className=' md:pt-20 pt-5 text-center text-xl font-bold mb-4 '>Why Choose Us?</h2>
                    <p>We offer a seamless and secure platform for patients
                        to consult with top-tier doctors from the comfort of their
                        homes. With user-friendly features and advanced encryption,
                        we ensure your personal health data remains confidential.
                        Experience hassle-free consultations via chat or video call,
                        knowing that your privacy is our priority.
                    </p>
                </div>
            </div>
            <div className='flex flex-wrap w-full md:mt-0 mt-5'>
                <div className='w-full md:w-3/5'>
                    <h2 className='md:pt-20 pt-5 text-center text-xl font-bold mb-4'>Our Commitment to Excellence</h2>
                    <p>We are proud to have a team of the best doctors available for
                        online consultations. Our rigorous selection process guarantees
                        that you are consulting with highly qualified professionals.
                        Your health and well-being are our utmost concern, and we are
                        dedicated to providing top-notch medical advice and treatment,
                        accessible from anywhere at any time.
                    </p>
                </div>
                <div className='w-full md:w-2/5'>
                    <img src='d2.png' className='w-full' />
                </div>
            </div>
        </div>
    )
}

export default HomePageContent

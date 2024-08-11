"use client";
import MessageBox from '@/components/MessageBox';
import axios from 'axios';
import Error from 'next/error';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import Select from 'react-select'

const doctorTypeOptions = [
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

const Page = () => {
  const [doctorTypeSelected, setDoctorTypeSelected] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [availableDoctors, setAvailableDoctors] = useState([])
  function changeDoctorTypeSelected(selected) {
    setDoctorTypeSelected(selected)
  }
  useEffect(() => {
    (async () => {
      try {
        if (!doctorTypeSelected) return;
        setShowMessage({ loading: true, message: "Searching Available Doctors" });
        let res = await axios.get(`/api/doctors-available?specialty=${encodeURIComponent(doctorTypeSelected.value)}`)
        if (res.data.status != "success")
          throw new Error("Error")
        setAvailableDoctors(res.data.doctors)
        setShowMessage(false)
      } catch (error) {
        setShowMessage({ error: true, message: "Something went wrong!", dismissable: true })
      }
    })()
  }, [doctorTypeSelected])
  return (
    <>
      {showMessage && <MessageBox success={showMessage.success} error={showMessage.error} loading={showMessage.loading} setShowMessage={setShowMessage} message={showMessage.message} dismissable={showMessage.dismissable} />}
      <div className='mt-5 w-[80vw] mx-auto'>
        <Select
          className='text-lg'
          isDisabled={false} isLoading={false} isClearable={true} isRtl={false} isSearchable={true}
          name="doctorType" options={doctorTypeOptions} placeholder="Type to search spcialities..."
          onChange={changeDoctorTypeSelected} value={doctorTypeSelected}
        />
        {doctorTypeSelected &&
          <>
            {availableDoctors.length == 0 ?
              <>
                <p className="text-4xl font-bold text-center text-red-600 mt-10">No Doctors Available</p>
              </>
              :
              <div className='mt-5'>
                {availableDoctors.map((doc) => {
                  return (<DisplayDoctor key={doc._id} doc={doc} />)
                })}
              </div>
            }
          </>
        }
      </div>
    </>
  )
}

export default Page

function DisplayDoctor({ doc }) {
  const userLoggedIn = useSelector((state) => state.user.loggedIn)
  return (
    <>
      <Link className='flex flex-wrap justify-items-stretch border-b-[2px] hover:bg-slate-300' href={userLoggedIn?`/consult-doctor/${doc._id}`:`/login?returnTo=/consult-doctor/${doc._id}`}>
        <div className='p-4'>
          <h1 className='font-semibold'>{doc.name}</h1>
          <div className='text-sm '>
            <span>{doc.qualification}</span>
          </div>
          <div className='text-sm'>
            <span>{doc.experience} year(s) Experience</span>
          </div>
          <div className='text-sm'>
            <span>{doc.practiceAddress}</span>
          </div>
          <div className='text-sm'>
            <span>Speaks: {doc.languagesSpoken.join(', ')}</span>
          </div>
        </div>
      </Link>
    </>
  )
}
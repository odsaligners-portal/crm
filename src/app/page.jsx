'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

const MainPage = () => {
  const router = useRouter();
  const { token, role, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token || !role || !user) {
      router.push('/signin');
    }
    if(token && role === 'admin'){
      router.push('/admin');
    }else if(token && role === 'doctor'){
      router.push('/doctor');
    }else if(token && role === 'super-admin'){
      router.push('/super-admin');
    }
  }, [token, router]);
  return null
}

export default MainPage

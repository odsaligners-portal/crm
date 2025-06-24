import { NextResponse } from 'next/server';
import dbConnect from '@/app/api/config/db';
import User from '@/app/api/models/User';
import Patient from '@/app/api/models/Patient';
import { verifyAuth } from '@/app/api/middleware/authMiddleware';
import { countryLatLng } from '@/utils/countryLatLng';

export async function GET(req) {
  await dbConnect();

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const patients = await Patient.find({ country: { $exists: true } }).select('country');
    const doctors = await User.find({ role: 'doctor', country: { $exists: true } }).select('country');
    
    const countryStats = {};

    patients.forEach(p => {
      if (p.country) {
        const country = p.country.trim();
        if (!countryStats[country]) countryStats[country] = { patientCount: 0, doctorCount: 0 };
        countryStats[country].patientCount += 1;
      }
    });
    doctors.forEach(d => {
      if (d.country) {
        const country = d.country.trim();
        if (!countryStats[country]) countryStats[country] = { patientCount: 0, doctorCount: 0 };
        countryStats[country].doctorCount += 1;
      }
    });
    
    const markers = Object.keys(countryStats).map(countryName => {
      const latLng = countryLatLng[countryName];
      if (!latLng) return null;
      return {
        country: countryName,
        patientCount: countryStats[countryName].patientCount,
        doctorCount: countryStats[countryName].doctorCount,
        latLng,
        name: countryName
      };
    }).filter(Boolean);
    
    return NextResponse.json({ success: true, data: markers });
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
} 
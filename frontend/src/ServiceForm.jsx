import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ServiceForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        middleName: '',
        nationalId: '',
        lastName: '',
        gender: 'Male',
        dateOfBirth: '',
        placeOfBirth: '',
        placeOfBirthRegion: '',
        placeOfBirthZone: '',
        placeOfBirthWoreda: '',
        placeOfBirthKebele: '',
        nationality: '',
        occupation: '',
        previousResidenceRegion: '',
        previousResidenceZone: '',
        previousResidenceWoreda: '',
        previousResidenceKebele: '',
        previousResidenceAddress: '',
        phoneNumber: '',
        email: '',
        region: '',
        zone: '',
        woreda: '',
        kebele: '',
        residenceAddress: '',
        serviceType: 'NEW_ID_CARD',
        details: '',
        passportPhoto: null,
        birthCertificate: null,
        residenceProof: null,
        webcamPhoto: null
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        if (type) {
            setFormData((prev) => ({ ...prev, serviceType: type }));
        }
    }, []);

    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData({ ...formData, [name]: files[0] });
        }
    };

    const clearForm = () => {
        setFormData({
            fullName: '',
            middleName: '',
            nationalId: '',
            lastName: '',
            gender: 'Male',
            dateOfBirth: '',
            placeOfBirth: '',
            placeOfBirthRegion: '',
            placeOfBirthZone: '',
            placeOfBirthWoreda: '',
            placeOfBirthKebele: '',
            nationality: '',
            occupation: '',
            previousResidenceRegion: '',
            previousResidenceZone: '',
            previousResidenceWoreda: '',
            previousResidenceKebele: '',
            previousResidenceAddress: '',
            phoneNumber: '',
            email: '',
            region: '',
            zone: '',
            woreda: '',
            kebele: '',
            residenceAddress: '',
            serviceType: 'NEW_ID_CARD',
            details: '',
            passportPhoto: null,
            birthCertificate: null,
            residenceProof: null,
            webcamPhoto: null
        });
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // client-side validation to reduce server 400/500 chances
        if (!formData.fullName || !formData.nationalId || !formData.phoneNumber) {
            setMessage('Please fill Full Name, National ID, and Phone Number before submitting.');
            return;
        }
        try {
            const payload = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value === null || value === undefined) return;
                payload.append(key, value instanceof File ? value : value);
            });

            try {
                const res = await axios.post('/api/services/submit-application', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessage('Request submitted successfully.');
                const lookupValue = res.data.applicationId || formData.phoneNumber || formData.nationalId || '';
                if (lookupValue) {
                    navigate(`/track?query=${encodeURIComponent(lookupValue)}`);
                }
            } catch (innerErr) {
                // show clearer feedback for network/backend errors
                console.error('Submit error:', innerErr.response || innerErr.message || innerErr);
                const serverMsg = innerErr.response?.data?.message || innerErr.response?.data?.error || innerErr.message;
                setMessage('Unable to send the request: ' + serverMsg);
            }
        } catch (err) {
            setMessage('Unable to send the request: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
            <h2>የቀበሌ አገልግሎት መጠየቂያ Form</h2>
            <p style={{ marginBottom: '18px', color: '#374151' }}>
              After submitting, use your phone number or application ID on the Track page to see status, payment amount in birr, and download details when approved. / ከመላክ በኋላ በTrack ገጽ ላይ ስልክ ቁጥርዎን ወይም የመታወቂያ ቁጥርዎን በመጠቀም ሁኔታን፣ በብር የሚከፈል ክፍያን እና ከተፈቀደ በኋላ የማውረድ መረጃን ይመልከቱ።
            </p>
            {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Full Name / ሙሉ ስም:</label><br />
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>National ID / Residence Number / ብሔራዊ መታወቂያ / የመኖሪያ ቁጥር:</label><br />
                    <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Phone Number / ስልክ ቁጥር:</label><br />
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Gender / ጾታ:</label><br />
                    <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                        <option value="Male">Male / ወንድ</option>
                        <option value="Female">Female / ሴት</option>
                    </select>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Date of Birth / የትውልድ ቀን:</label><br />
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Place of Birth / የትውልድ ቦታ:</label><br />
                    <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Birth Region / የትውልድ ክልል:</label><br />
                    <input type="text" name="placeOfBirthRegion" value={formData.placeOfBirthRegion} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Birth Zone / የትውልድ ዞን:</label><br />
                    <input type="text" name="placeOfBirthZone" value={formData.placeOfBirthZone} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Birth Woreda / የትውልድ ወረዳ:</label><br />
                    <input type="text" name="placeOfBirthWoreda" value={formData.placeOfBirthWoreda} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Birth Kebele / የትውልድ ቀበሌ:</label><br />
                    <input type="text" name="placeOfBirthKebele" value={formData.placeOfBirthKebele} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Nationality / ዜግነት:</label><br />
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Career / Profession / Occupation / ሥራ / ሙያ:</label><br />
                    <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Previous Residence Region / የቀድሞ መኖሪያ ክልል:</label><br />
                    <input type="text" name="previousResidenceRegion" value={formData.previousResidenceRegion} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Previous Residence Zone / የቀድሞ መኖሪያ ዞን:</label><br />
                    <input type="text" name="previousResidenceZone" value={formData.previousResidenceZone} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Previous Residence Woreda / የቀድሞ መኖሪያ ወረዳ:</label><br />
                    <input type="text" name="previousResidenceWoreda" value={formData.previousResidenceWoreda} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Previous Residence Kebele / የቀድሞ መኖሪያ ቀበሌ:</label><br />
                    <input type="text" name="previousResidenceKebele" value={formData.previousResidenceKebele} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Previous Residence Address / የቀድሞ መኖሪያ አድራሻ:</label><br />
                    <input type="text" name="previousResidenceAddress" value={formData.previousResidenceAddress} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email Address / ኢሜይል አድራሻ (Optional / አማራጭ):</label><br />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Region / ክልል:</label><br />
                    <input type="text" name="region" value={formData.region} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Zone / Zone / Sub-City / ዞን / ክፍለ ከተማ:</label><br />
                    <input type="text" name="zone" value={formData.zone} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Woreda / District / ወረዳ:</label><br />
                    <input type="text" name="woreda" value={formData.woreda} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Kebele / ቀበሌ:</label><br />
                    <input type="text" name="kebele" value={formData.kebele} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Residence Address / Residential Address / የመኖሪያ አድራሻ:</label><br />
                    <input type="text" name="residenceAddress" value={formData.residenceAddress} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Passport Photo (File Upload) / Passport Photo:</label><br />
                    <input type="file" name="passportPhoto" accept="image/*" onChange={handleFileChange} style={{ width: '100%', marginTop: '4px' }} />
                    {formData.passportPhoto && <small>Selected: {formData.passportPhoto.name}</small>}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Birth Certificate Upload / Birth Certificate:</label><br />
                    <input type="file" name="birthCertificate" accept="image/*,.pdf" onChange={handleFileChange} style={{ width: '100%', marginTop: '4px' }} />
                    {formData.birthCertificate && <small>Selected: {formData.birthCertificate.name}</small>}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Residence Proof Document Upload / Residence Proof:</label><br />
                    <input type="file" name="residenceProof" accept="image/*,.pdf" onChange={handleFileChange} style={{ width: '100%', marginTop: '4px' }} />
                    {formData.residenceProof && <small>Selected: {formData.residenceProof.name}</small>}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Webcam Capture / Take a photo with a camera:</label><br />
                    <input type="file" name="webcamPhoto" accept="image/*" capture="environment" onChange={handleFileChange} style={{ width: '100%', marginTop: '4px' }} />
                    {formData.webcamPhoto && <small>Selected: {formData.webcamPhoto.name}</small>}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Additional Details (if desired) / ተጨማሪ ዝርዝሮች (ከፈለጉ):</label><br />
                    <textarea name="details" value={formData.details} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }}></textarea>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={clearForm} style={{ padding: '10px 18px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Clear Form / Clear the Form
                    </button>
                    <button type="submit" style={{ padding: '10px 18px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Submit Application / Submit Application
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceForm;
import { serviceValidationSchema } from './serviceValidation';

describe('serviceValidationSchema', () => {
  it('accepts a complete application payload', async () => {
    const validData = {
      fullName: 'Abebe Bekele',
      nationalId: 'ET123456789',
      phoneNumber: '+251911000000',
      gender: 'Male',
      dateOfBirth: '2000-01-01',
      placeOfBirth: 'Addis Ababa',
      nationality: 'Ethiopian',
      occupation: 'Engineer',
      email: 'abebe@example.com',
      region: 'Addis Ababa',
      zone: 'Bole',
      woreda: '01',
      kebele: '03',
      residenceAddress: 'House 12',
      serviceType: 'NEW_ID_CARD',
      details: 'Need an updated card'
    };

    await expect(serviceValidationSchema.validate(validData)).resolves.toBeTruthy();
  });

  it('rejects missing required fields', async () => {
    await expect(serviceValidationSchema.validate({ fullName: '' })).rejects.toThrow('Full name is required');
  });
});

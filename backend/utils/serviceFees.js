const ServiceFee = require('../models/ServiceFee');

const DEFAULT_SERVICE_FEES = [
  { serviceType: 'New ID', feeAmount: 100 },
  { serviceType: 'ID Renewal', feeAmount: 150 },
  { serviceType: 'Vital Events', feeAmount: 200 },
];

const getFeeCategory = (serviceType) => {
  const normalized = String(serviceType || '').trim().toUpperCase();
  if (['NEW_ID_CARD', 'NEW ID CARD'].includes(normalized)) return 'New ID';
  if (['ID_RENEWAL', 'ID_REPLACEMENT', 'ID RENEWAL', 'ID REPLACEMENT'].includes(normalized)) return 'ID Renewal';
  if (['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'].includes(normalized)) return 'Vital Events';
  return null;
};

const ensureDefaultServiceFees = async () => Promise.all(DEFAULT_SERVICE_FEES.map((fee) => (
  ServiceFee.updateOne({ serviceType: fee.serviceType }, { $setOnInsert: fee }, { upsert: true })
)));

const getConfiguredServiceFee = async (serviceType) => {
  const category = getFeeCategory(serviceType);
  if (!category) throw new Error(`No service fee category is configured for ${serviceType || 'this service'}.`);
  await ensureDefaultServiceFees();
  const fee = await ServiceFee.findOne({ serviceType: category });
  if (!fee || !Number.isFinite(Number(fee.feeAmount)) || Number(fee.feeAmount) <= 0) {
    throw new Error(`A valid fee is not configured for ${category}.`);
  }
  return Number(fee.feeAmount);
};

module.exports = { DEFAULT_SERVICE_FEES, ensureDefaultServiceFees, getConfiguredServiceFee, getFeeCategory };

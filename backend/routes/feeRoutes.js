const router = require('express').Router();
const ServiceFee = require('../models/ServiceFee');
const { verifyAdmin } = require('../middleware/authMiddleware');

const defaults = [
  { serviceType: 'New ID', feeAmount: 100 },
  { serviceType: 'ID Renewal', feeAmount: 150 },
  { serviceType: 'Vital Events', feeAmount: 200 }
];

router.get('/', verifyAdmin, async (req, res) => {
  try {
    await Promise.all(defaults.map((fee) => ServiceFee.updateOne({ serviceType: fee.serviceType }, { $setOnInsert: fee }, { upsert: true })));
    res.json(await ServiceFee.find().sort({ createdAt: 1 }));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load service fees.' });
  }
});

router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const feeAmount = Number(req.body.feeAmount);
    if (!Number.isFinite(feeAmount) || feeAmount <= 0) return res.status(400).json({ success: false, message: 'Please enter a fee greater than zero.' });
    const fee = await ServiceFee.findByIdAndUpdate(req.params.id, { feeAmount }, { new: true, runValidators: true });
    if (!fee) return res.status(404).json({ success: false, message: 'Service fee not found.' });
    res.json({ success: true, message: 'Service fee updated successfully.', fee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update service fee.' });
  }
});

module.exports = router;
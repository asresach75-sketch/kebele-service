const express = require('express');
const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const { verifyToken } = require('../middleware/authMiddleware');
const createBirthCertificatePdf = require('../utils/birthCertificatePdf');

const router = express.Router();

router.get('/download/:id', verifyToken, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const filters = [{ applicationId: id }];
    if (mongoose.isValidObjectId(id)) filters.push({ _id: id });

    const request = await ServiceRequest.findOne({
      serviceType: 'BIRTH_REGISTRATION',
      $or: filters,
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Birth registration application not found.' });
    }
    if (String(request.userId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only download your own birth certificate.' });
    }
    if (!['APPROVED_BY_FINANCE', 'COMPLETED'].includes(request.status) || request.paymentStatus !== 'Verified') {
      return res.status(403).json({ success: false, message: 'The birth certificate is available after Finance verifies the payment.' });
    }

    const pdfBuffer = await createBirthCertificatePdf(request);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="E-Kebele-Birth-Certificate-${request.applicationId}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Birth certificate download failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to generate the birth certificate right now.' });
  }
});

module.exports = router;

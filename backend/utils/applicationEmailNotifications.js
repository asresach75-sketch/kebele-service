const sendEmail = require('./sendEmail');

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const applicantName = (request) => request.fullName
  || request.childFullName
  || request.childName
  || request.applicantName
  || request.husbandName
  || request.wifeName
  || 'Applicant';

const createApplicationEmailNotifications = (deliverEmail = sendEmail) => {
  const notify = async (request, event, subject, message) => {
    if (!request.email) {
      console.warn(`Email notification skipped for ${event}: application ${request.applicationId || request._id} has no recipient email.`);
      return { sent: false, reason: 'Recipient email is missing' };
    }

    try {
      await deliverEmail({
        email: request.email,
        subject,
        message,
        html: message.split('\n\n').map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`).join(''),
      });
      return { sent: true };
    } catch (error) {
      console.error(`Email notification failed for ${event}, application ${request.applicationId || request._id}:`, error.message);
      return { sent: false, reason: error.message };
    }
  };

  const notifications = {
    applicationStatusUpdated(request) {
      switch (String(request.status || '').trim().toUpperCase()) {
        case 'APPROVED_BY_OFFICER':
          return notifications.officerApproved(request);
        case 'APPROVED_BY_FINANCE':
        case 'PAYMENT VERIFIED':
          return notifications.paymentVerified(request);
        case 'COMPLETED':
          return notifications.documentReady(request);
        case 'PENDING_OFFICER':
          return notify(
            request,
            'corrections resubmitted',
            'E-Kebele: Application corrections received / ማስተካከያዎች ተቀብለናል',
            `Hello ${applicantName(request)},\n\nYour updated documents for application ${request.applicationId || request._id} have been received and the application is awaiting review again.\n\nሰላም ${applicantName(request)}፣\n\nለማመልከቻ ቁጥር ${request.applicationId || request._id} ያስገቡት የተስተካከሉ ሰነዶች ተቀብለናል፤ ማመልከቻው እንደገና ለግምገማ ተልኳል።`,
          );
        case 'PAID_PENDING_FINANCE':
          return notify(
            request,
            'payment submitted for finance review',
            'E-Kebele: Payment submitted for verification / ክፍያ ለማረጋገጥ ተልኳል',
            `Hello ${applicantName(request)},\n\nPayment for application ${request.applicationId || request._id} has been submitted and is awaiting Finance verification. We will notify you when the review is complete.\n\nሰላም ${applicantName(request)}፣\n\nለማመልከቻ ቁጥር ${request.applicationId || request._id} የተፈጸመው ክፍያ ለፋይናንስ ማረጋገጫ ተልኳል። ማረጋገጫው ሲጠናቀቅ እናሳውቅዎታለን።`,
          );
        case 'NEEDS_CORRECTION':
          return notify(
            request,
            'correction requested',
            'E-Kebele: Changes needed for your application / ማመልከቻዎ ማስተካከያ ይፈልጋል',
            `Hello ${applicantName(request)},\n\nYour application ${request.applicationId || request._id} needs correction before it can be reviewed further. Review note: ${request.correctionReason || 'Please sign in to the E-Kebele Portal to review the required changes.'}\n\nሰላም ${applicantName(request)}፣\n\nማመልከቻ ቁጥር ${request.applicationId || request._id} ተጨማሪ ማስተካከያ ይፈልጋል። ዝርዝሩን እና የሚያስፈልጉትን ለውጦች በኢ-ቀበሌ ፖርታል ይመልከቱ።`,
          );
        case 'REJECTED':
          return notify(
            request,
            'application rejected',
            'E-Kebele: Application decision / የማመልከቻ ውሳኔ',
            `Hello ${applicantName(request)},\n\nYour application ${request.applicationId || request._id} was not approved. Review note: ${request.correctionReason || 'Please contact your Kebele office for more information.'}\n\nሰላም ${applicantName(request)}፣\n\nማመልከቻ ቁጥር ${request.applicationId || request._id} አልጸደቀም። ለተጨማሪ መረጃ የቀበሌዎን ቢሮ ያነጋግሩ።`,
          );
        default:
          return Promise.resolve({ sent: false, reason: 'No email template is configured for this status' });
      }
    },

    applicationSubmitted(request) {
      const name = applicantName(request);
      const applicationId = request.applicationId || request._id;
      const service = String(request.serviceType || 'service').replaceAll('_', ' ').toLowerCase();
      return notify(
        request,
        'application submission',
        'Application received - E-Kebele Portal',
        `Hello ${name},\n\nYour ${service} application ${applicationId} has been received and is awaiting review. Please keep this application number to track its status.`,
      );
    },

    paymentVerified(request) {
      const name = applicantName(request);
      const applicationId = request.applicationId || request._id;
      return notify(
        request,
        'payment verification',
        'E-Kebele: Finance approved your payment / ክፍያዎ በፋይናንስ ክፍል ጸድቋል',
        `Hello ${name},\n\nThe Finance team has verified and approved your payment for application ${applicationId}. Your application is now moving to document preparation. We will notify you when your document is ready for collection.\n\nሰላም ${name}፣\n\nለማመልከቻ ቁጥር ${applicationId} የፈጸሙት ክፍያ በፋይናንስ ክፍል ተረጋግጦ ጸድቋል። ማመልከቻዎ ወደ ሰነድ ዝግጅት ሂደት ተላልፏል። ሰነድዎ ለመውሰድ ዝግጁ ሲሆን በኢሜይል እናሳውቅዎታለን።`,
      );
    },

    documentReady(request) {
      const name = applicantName(request);
      const applicationId = request.applicationId || request._id;
      return notify(
        request,
        'document ready for collection',
        'Your E-Kebele document is ready for collection',
        `Hello ${name},\n\nYour document for application ${applicationId} is ready for collection and can also be viewed or downloaded from the E-Kebele Tracker. Please keep your application number.\n\nሰላም ${name}፣\n\nለማመልከቻ ቁጥር ${applicationId} ያለው ሰነድ ዝግጁ ነው። በኢ-ቀበሌ መከታተያ ገጽ ማየት ወይም ማውረድ ይችላሉ፤ እንዲሁም ወደ ቀበሌ ቢሮ ይሂዱ።`,
      );
    },

    officerApproved(request) {
      const name = applicantName(request);
      const applicationId = request.applicationId || request._id;
      const amount = Number(request.paymentAmount);
      const currency = String(request.currency || 'ETB');
      const paymentDetails = Number.isFinite(amount) && amount > 0
        ? `The service fee is ${new Intl.NumberFormat('en-ET').format(amount)} ${currency}.`
        : 'Please check the E-Kebele Portal for the service fee.';
      const amharicPaymentDetails = Number.isFinite(amount) && amount > 0
        ? `የአገልግሎቱ ክፍያ ${new Intl.NumberFormat('en-ET').format(amount)} ${currency} ነው።`
        : 'የአገልግሎቱን ክፍያ በኢ-ቀበሌ ፖርታል ይመልከቱ።';
      return notify(
        request,
        'officer approval',
        'E-Kebele: Officer approved your application - payment required / ማመልከቻዎ በኦፊሰር ጸድቋል - ክፍያ ይፈጽሙ',
        `Hello ${name},\n\nYour application ${applicationId} has been reviewed and approved by the Kebele officer. ${paymentDetails} Please sign in to the E-Kebele Portal and complete the payment so your application can proceed to Finance for verification.\n\nሰላም ${name}፣\n\nማመልከቻ ቁጥር ${applicationId} በቀበሌ ኦፊሰር ተመርምሮ ጸድቋል። ${amharicPaymentDetails} እባክዎ ወደ ኢ-ቀበሌ ፖርታል ገብተው ክፍያውን ይፈጽሙ፤ ከዚያም ማመልከቻዎ ለፋይናንስ ማረጋገጫ ይተላለፋል።`,
      );
    },
  };
  return notifications;
};

module.exports = createApplicationEmailNotifications();
module.exports.createApplicationEmailNotifications = createApplicationEmailNotifications;

import Validator from 'validator';
import isEmpty from './isEmpty';

function validateConfirmPayment(data) {
  let errors = {};
  var data_customerEmail = !isEmpty(data.customerEmail) ? data.customerEmail : ''; 
  var data_customerPhone = !isEmpty(data.customerPhone) ? data.customerPhone : '';
  var data_storingDay = !isEmpty(data.storingDay) ? data.storingDay : '';
  var data_storingHours = !isEmpty(data.storingHours) ? data.storingHours : '';
  var data_payAmount = !isEmpty(data.payAmount) ? data.payAmount : '';
  var data_localBid = !isEmpty(data.localBid) ? data.localBid : '';
  var data_targetBid = !isEmpty(data.targetBid) ? data.targetBid : '';
  var data_serviceType = !isEmpty(data.serviceType) ? data.serviceType : '';
  var data_faceScannQr = !isEmpty(data.faceScannQr) ? data.faceScannQr : '';

  if (Validator.isEmpty(data_customerEmail.toString())|| !Validator.isEmail(data_customerEmail) ) {
    errors.customerEmail = 'customerEmail is required(in right format)';
  }
  if (!Validator.isLength(data_customerPhone.toString(), { min: 10, max: 10 })) {
    errors.customerPhone = 'Phone number must be 10 digit long';
  }
  if (Validator.isEmpty(data_customerPhone.toString())) {
    errors.customerPhone = 'customerPhone is required';
  }
  if (Validator.isEmpty(data_storingDay.toString()) || isNaN(data_storingDay) ||
      data_storingDay < 0) {
    errors.storingDay = 'storingDay is required in digit';
  }

  if (Validator.isEmpty(data_storingHours.toString()) || isNaN(data_storingHours) ||
      data_storingHours < 0) {
    errors.storingHours = 'storingHours is required in digits';
  }

  if (Validator.isEmpty(data_payAmount.toString())|| isNaN(data_payAmount) ||
    data_payAmount < 0) {
    errors.payAmount = 'payAmount is required in digits';
  }
  
  if (Validator.isEmpty(data_localBid.toString())|| isNaN(data_localBid)) {
    errors.localBid = 'localBid is required';
  }

  if (!Validator.isEmpty(data_targetBid.toString())&& isNaN(data_targetBid)) {
    errors.targetBid = 'targetBid is required to be number';
  }

  if (Validator.isEmpty(data_serviceType.toString())|| data_serviceType !=="L_S" &&
      data_serviceType !=="T_S") {
    errors.serviceType = 'serviceType is required either T_S or L_S';
  }

  if (Validator.isEmpty(data_faceScannQr.toString()) || data_faceScannQr !=="FnQR" &&
      data_faceScannQr !=="QR" ) {
    errors.faceScannQr = 'faceScannQr is required either FnQR or QR';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default validateConfirmPayment;
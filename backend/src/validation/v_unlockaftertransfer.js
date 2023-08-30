import Validator from 'validator';
import isEmpty from './isEmpty';

function validateUnlockAfterTransfer(data) {
  let errors = {};

  var data_tid = !isEmpty(data.tid) ? data.tid : '';
  var data_aqr = !isEmpty(data.aqr) ? data.aqr : '';
  var data_bid = !isEmpty(data.bid) ? data.bid : '';

  if (Validator.isEmpty(data_tid.toString())) {
    errors.tid = 'tid is required';
  }
  
  if (Validator.isEmpty(data_aqr.toString())) {
    errors.aqr = 'aqr is required';
  }
  
  if (Validator.isEmpty(data_bid.toString())) {
    errors.bid = 'bid is required';
  }
  
  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default validateUnlockAfterTransfer;
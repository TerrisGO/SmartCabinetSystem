import Validator from 'validator';
import isEmpty from './isEmpty';

function validateUnlockBeforeTransfer(data) {
  let errors = {};

  var data_tid = !isEmpty(data.tid) ? data.tid : '';
  var data_bqr = !isEmpty(data.bqr) ? data.bqr : '';
  var data_bid = !isEmpty(data.bqr) ? data.bid : '';

  if (Validator.isEmpty(data_tid.toString())) {
    errors.tid = 'tid is required';
  }

  if (Validator.isEmpty(data_bqr.toString())) {
    errors.bqr = 'bqr is required';
  }

  if (Validator.isEmpty(data_bid.toString())) {
    errors.bid = 'bid is required';
  }
  

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default validateUnlockBeforeTransfer;
import Validator from 'validator';
import isEmpty from './isEmpty';

function validateCancelReservedBox(data) {
  let errors = {};

  var data_localboxID = !isEmpty(data.localboxID) ? data.localboxID : '';
  var data_targetboxID = !isEmpty(data.targetboxID) ? data.targetboxID : '';

  if (Validator.isEmpty(data_localboxID.toString())) {
    errors.localboxID = 'localboxID is required /targetboxID is optional';
  }
  if (!Validator.isInt(data_localboxID) || 0 > data_localboxID) {
    errors.localboxID = 'localboxID must be number';
  }
  if (data_targetboxID !==''){
    if (!Validator.isInt(data_targetboxID) || 0 > data_targetboxID){
      errors.targetboxID = 'targetboxID must be number';
    }
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default validateCancelReservedBox;
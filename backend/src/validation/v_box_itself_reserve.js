import Validator from 'validator';
import isEmpty from './isEmpty';

function validateBoxItselfReserve(data) {
  let errors = {};

  var data_box_id = !isEmpty(data.box_id) ? data.box_id : '';

  if (Validator.isEmpty(data_box_id.toString())) {
    errors.box_id = 'box_id is required';
  }

  if (!Validator.isInt(data_box_id) || 0 > data_box_id) {
    errors.box_id = 'box_id must be number';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default validateBoxItselfReserve;
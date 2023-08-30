import Validator from 'validator';
import isEmpty from './isEmpty';

function validateLoginClientForm(data) {
  let errors = {};

  data.location_name = !isEmpty(data.location_name) ? data.location_name : '';
  data.password = !isEmpty(data.password) ? data.password : '';

  if (Validator.isEmpty(data.location_name)) {
    errors.location_name = 'Location_name is required';
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default validateLoginClientForm;
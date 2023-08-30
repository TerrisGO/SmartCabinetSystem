import Validator from 'validator';
import isEmpty from './isEmpty';

function updateAdminForm(data) {
  let errors = {};

  data.firstname = !isEmpty(data.firstname) ? data.firstname : '';
  data.lastname = !isEmpty(data.lastname) ? data.lastname : '';
  data.role = !isEmpty(data.role) ? data.role : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.id = !isEmpty(data.id) ? data.id : '';

  if (Validator.isEmpty(data.firstname)) {
    errors.firstname = 'firstname is required';
  }

  if (Validator.isEmpty(data.lastname)) {
    errors.lastname = 'lastname is required';
  }

  if (Validator.isEmpty(data.role)) {
    errors.role= 'role is required';
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password is required';
  }

  if (Validator.isEmpty(data.id)) {
    errors.id = 'id is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default updateAdminForm;
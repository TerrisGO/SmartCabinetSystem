import Validator from 'validator';
import isEmpty from './isEmpty';

function updateCabinetForm(data) {
  let errors = {};

  data.staff_name = !isEmpty(data.staff_name) ? data.staff_name : '';
  data.staff_email = !isEmpty(data.staff_email) ? data.staff_email : '';
  data.staff_pass = !isEmpty(data.staff_pass) ? data.staff_pass : '';
  data.staff_phone = !isEmpty(data.staff_phone) ? data.staff_phone : '';
  data.staff_addr = !isEmpty(data.staff_addr) ? data.staff_addr : '';
  data.duty_status = !isEmpty(data.duty_status) ? data.duty_status : '';
  data.staff_id = !isEmpty(data.staff_id) ? data.staff_id : '';

  if (Validator.isEmpty(data.staff_name)) {
    errors.staff_name = 'staff_name is required';
  }

  if (Validator.isEmpty(data.staff_email)) {
    errors.staff_email = 'staff_email is required';
  }

  if (Validator.isEmpty(data.staff_pass)) {
    errors.staff_pass = 'staff_pass is required';
  }

  if (Validator.isEmpty(data.staff_phone)) {
    errors.staff_phone = 'staff_phone is required';
  }

  if (Validator.isEmpty(data.staff_addr)) {
    errors.staff_addr = 'staff_addr is required';
  }

  if (Validator.isEmpty(data.duty_status)) {
    errors.duty_status = 'duty_status is required';
  }

  if (Validator.isEmpty(data.staff_id)) {
    errors.staff_id = 'staff_id is required';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default updateCabinetForm;
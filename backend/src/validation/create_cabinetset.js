import Validator from 'validator';
import isEmpty from './isEmpty';

function validateCabinetForm(data) {
  let errors = {};

data.location_name = !isEmpty(data.location_name) ? data.location_name : '';
data.gpslocation = !isEmpty(data.gpslocation ) ? data.gpslocation : '';
data.totalboxs = !isEmpty(data.totalboxs) ? data.totalboxs : '';
data.cabinet_addr= !isEmpty(data.cabinet_addr) ? data.cabinet_addr : '';
data.cabinet_pass = !isEmpty(data.cabinet_pass) ? data.cabinet_pass : '';
data.hardware_detail = !isEmpty(data.hardware_detail) ? data.hardware_detail : '';

  if (Validator.isEmpty(data.location_name)) {
    errors.location_name = 'location_name is required';
  }
  if (Validator.isEmpty(data.gpslocation)) {
    errors.gpslocation = 'gpslocation is required';
  }
  if (Validator.isEmpty(data.totalboxs)) {
    errors.totalboxs = 'totalboxs is required';
  }
  if (Validator.isEmpty(data.cabinet_addr)) {
    errors.cabinet_addr = 'cabinet_addr is required';
  }
  if (Validator.isEmpty(data.cabinet_pass)) {
    errors.cabinet_pass = 'cabinet_passis required';
  }
  if (Validator.isEmpty(data.hardware_detail)) {
    errors.hardware_detail = 'hardware_detail is required';
  }
  return {
    errors,
    isValid: isEmpty(errors),
  };
};

export default validateCabinetForm;
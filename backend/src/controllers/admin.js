import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';

import db from '../models';
const Admin = db.Admin;
const Client_ = db.cabinet_set;
const Box_ = db.boxes;
const BoxServ_ = db.box_servicing;
const TransferAlloc_ = db.transfer_allocation;
const Staff_ = db.staff;
let secret_ = process.env.SECRET || "SECERT";
// load input validation
import validateRegisterForm from '../validation/register';
import validateLoginForm from '../validation/login';
import validateCabinetForm from '../validation/create_cabinetset';
import updateAdminForm from '../validation/updateAdmin';
import updateCabinetForm from '../validation/updateCabinet';
import updateStaffForm from '../validation/updateStaff';
// create user
const create = (req, res) => {
  const { errors, isValid } = validateRegisterForm(req.body);
  let { 
    firstname, 
    lastname, 
    username, 
    role,
    email, 
    password,
  } = req.body;

  // check validation
  if(!isValid) {
    console.log(req.body);
    return res.status(400).json(errors);
  }

  Admin.findAll({ where: { email } }).then(user => {
    if (user.length) {
      return res.status(400).json({ email: 'Email already exists!' });
    } else {
      let newAdmin = { 
        firstname, 
        lastname, 
        username, 
        role,
        email, 
        password, 
      };
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newAdmin.password, salt, (err, hash) => {
          if (err) throw err;
          newAdmin.password = hash;
          Admin.create(newAdmin)
            .then(user => {
              res.json({ user });
            })
            .catch(err => {
              res.status(500).json({ err });
            });
        });
      });
    }
  });
};

const login = (req, res) => {
  const { errors, isValid } = validateLoginForm(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;
  console.log(email);

  Admin.findAll({ 
    where: { 
      email 
    } 
  })
  .then(user => {

    //check for user
    if (!user.length) {
      errors.email = 'User not found!';
      return res.status(404).json(errors);
    }
     
    let originalPassword = user[0].dataValues.password

    //check for password
    bcrypt
      .compare(password, originalPassword)
      .then(isMatch => {
        if (isMatch) {
          // user matched
          console.log('matched!')
          const { id, username } = user[0].dataValues;
          const payload = { id, username }; //jwt payload
          // console.log(payload)

          jwt.sign(payload, secret_, { 
            expiresIn: 3600 
          }, (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token,
              role: user[0].dataValues.role
            });
          });
        } else {
          errors.password = 'Password not correct';
          return res.status(400).json(errors);
        }
    }).catch(err => console.log(err));
  }).catch(err => res.status(500).json({err}));
};

// fetch all users
const findAllUsers = (req, res) => {
  Admin.findAll()
    .then(user => {
      res.json({ user });
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch user by userId
const findById = (req, res) => {
  const id = req.params.userId;
  
  Admin.findAll({ where: { id } })
    .then(user => {
      if(!user.length) {
        return res.json({ msg: 'user not found'})
      }
      res.json({ user })
    })
    .catch(err => res.status(500).json({ err }));
};

// update a adminuser's info
const update = (req, res) => {
  let { firstname, lastname,  role, password, id } = req.body;
  const { errors, isValid } = updateAdminForm(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  let updateAdmin = { 
    firstname,
    lastname,
    role,
    password 
  };

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(updateAdmin.password, salt, (err, hash) => {
      if (err) throw err;
      updateAdmin.password = hash;
      Admin.update(updateAdmin,
        { where: { id } })
        .then(result => {
          res.status(200).json({ "rowupdated":result });
        })
        .catch(err => {
          res.status(500).json({ err });
        });
    });
  });
};

// fetch user by userId
const findSelfInfo = (req, res) => {
  //const id = req.params.userId;
  console.log("req.headers.authorization "+ req.headers.authorization);
  var currentSessionID = getCurrentTokenID(req.headers.authorization);
  console.log("req.headers.authorization "+ currentID);

  Admin.findAll({ where: { id: currentSessionID } })
    .then(user => {
      if(!user.length) {
        return res.json({ msg: 'user not found'})
      }
      res.json({ user })
    })
    .catch(err => res.status(500).json({ err }));
};

// delete a user
const deleteUser = (req, res) => {
  const id = req.params.userId;

  Admin.destroy({ where: { id } })
    .then(() => res.status.json({ msg: 'User has been deleted successfully!' }))
    .catch(err => res.status(500).json({ msg: 'Failed to delete!' }));
};

function getCurrentTokenID (passtoken) {
  var userId;
    if (passtoken) {
      var authorization = passtoken.split(' ')[1],decoded;
      try {
          decoded = jwt.verify(authorization, secret_);
      } catch (e) {
        console.log("error getCurrentTokenID "+decoded);
          //return res.status(401).send('unauthorized');
      }
      userId = decoded.id;
      return userId;
  }
  return ;
};

// fetch all staffs
const findAllStaffs = (req, res) => {
  Staff_.findAll()
    .then(user => {
      res.json({ user });
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch Staff by Id
const findStaffById = (req, res) => {
  const id = req.params.userId;
  
  Staff_.findAll({ where: { id } })
    .then(user => {
      if(!user.length) {
        return res.json({ msg: 'staff not found'})
      }
      res.json({ user })
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch all BoxServicing
const findAllBoxServicings = (req, res) => {
  BoxServ_.findAll()
    .then(user => {
      res.json({ user });
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch Servicing by Id
const findBoxServicingById = (req, res) => {
  const id = req.params.Id;
  
  BoxServ_.findAll({ where: { id } })
    .then(user => {
      if(!user.length) {
        return res.json({ msg: 'box servicing id not found'})
      }
      res.json({ user })
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch all Transfer_allocation
const findAllTransfer_allocation = (req, res) => {
  TransferAlloc_.findAll()
    .then(user => {
      res.json({ user });
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch Transfer_allocation by Id
const findTransfer_allocationById = (req, res) => {
  const id = req.params.Id;
  
  TransferAlloc_.findAll({ where: { id } })
    .then(user => {
      if(!user.length) {
        return res.json({ msg: 'transfer allocation id not found'})
      }
      res.json({ user })
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch all boxes
const findAllBoxes = (req, res) => {
  Box_.findAll()
    .then(user => {
      res.json({ user });
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch box by userId
const findBoxById = (req, res) => {
  const id = req.params.Id;
  
  Box_.findAll({ where: { id } })
    .then(user => {
      if(!user.length) {
        return res.json({ msg: 'box id not found'})
      }
      res.json({ user })
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch all Cabinetset
const findAllCabinetset = (req, res) => {
  Client_.findAll()
    .then(user => {
      res.json({ user });
    })
    .catch(err => res.status(500).json({ err }));
};

// fetch Cabinetset by Id
const findCabinetsetById = (req, res) => {
  const id = req.params.Id;
  
  Client_.findAll({ where: { id } })
    .then(user => {
      if(!user.length) {
        return res.json({ msg: 'cabinet set id not found'})
      }
      res.json({ user })
    })
    .catch(err => res.status(500).json({ err }));
};

// create Cabinet set
const createCabinetSet = (req, res) => {
  const { errors, isValid } = validateCabinetForm(req.body);
  let { 
    location_name,
    gpslocation,
    totalboxs,
    cabinet_addr,
    cabinet_pass,
    hardware_detail
  } = req.body;

  // check validation
  if(!isValid) {
    console.log(req.body);
    return res.status(400).json(errors);
  }

  Client_.findAll({ where: { location_name } }).then(client => {
    if (client.length) {
      return res.status(400).json({ location_name: 'location_name already exists!' });
    } else {
      let newClient = { 
        location_name,
        gpslocation,
        totalboxs,
        cabinet_addr,
        cabinet_pass,
        hardware_detail
      };
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newClient.cabinet_pass, salt, (err, hash) => {
          if (err) throw err;
          newClient.password = hash;
          Client_.create(newClient)
            .then(client => {
              res.json({ client });
            })
            .catch(err => {
              res.status(500).json({ err });
            });
        });
      });
    }
  });
};

//create box
const createBox = (req, res) => {
  let { 
    cabinet_fk
  } = req.body;

  // check validation
  if(isNaN(cabinet_fk)) {
    console.log(req.body);
    return res.status(400).json(errors);
  }
  let newBox = { 
    cabinet_fk
  };

  if (err) throw err;
  Box_.create(newBox)
    .then(box => {
      res.json({ box });
    })
    .catch(err => {
      res.status(500).json({ err });
    });
};

//Update Cabinet set
const updateCabinetset = (req, res) => {
  let { location_name, gpslocation, totalboxs,cabinet_addr, cabinet_pass, hardware_detail,
        cabinet_id } = req.body;
  const { errors, isValid } = updateCabinetForm(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  let updateCabinet = { 
    location_name, gpslocation, totalboxs,cabinet_addr, cabinet_pass, hardware_detail
  };

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(updateCabinet.cabinet_pass, salt, (err, hash) => {
      if (err) throw err;
      updateCabinet.cabinet_pass = hash;
      Client_.update(updateCabinet,
        { where: { cabinet_id } })
        .then(result => {
          res.status(200).json({ "rowupdated":result });
        })
        .catch(err => {
          res.status(500).json({ err });
        });
    });
  });
};

//update staff
const updateStaff = (req, res) => {
  let { staff_name,staff_email,staff_pass,staff_phone,staff_addr,duty_status,staff_id } = req.body;
  const { errors, isValid } = updateStaffForm(req.body);

  // check validation
  if(!isValid) {
    return res.status(400).json(errors);
  }
  let updateStaff = { 
    staff_name,staff_email,staff_pass,staff_phone,staff_addr,duty_status
  };

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(updateStaff.cabinet_pass, salt, (err, hash) => {
      if (err) throw err;
      updateStaff.staff_pass = hash;
      Staff_.update(updateStaff,
        { where: { staff_id } })
        .then(result => {
          res.status(200).json({ "rowupdated":result });
        })
        .catch(err => {
          res.status(500).json({ err });
        });
    });
  });
};

// update the box cabinet fk
const updateBox = (req, res) => {
  let {  box_id, cabinet_fk } = req.body;

  // check validation
  if(isNaN(box_id) || isNaN(cabinet_fk)) {
    console.log(req.body);
    return res.status(400).json(errors);
  }

  Client_.findAll({ where: { cabinet_id:cabinet_fk } }).then(result => {
    if (result.length) {
      let updateBox_cfk = { 
        cabinet_fk
      };
      if (err) throw err;
      Box_.update(updateBox_cfk,{ where: { box_id }})
        .then(result2 => {
          res.json({"rowupdated":result2 });
        })
        .catch(err => {
          res.status(500).json({ err });
        });
    } else {
      return res.status(400).json({ error: 'Cabinet id not exists!' });
    }
  });
};


export { 
    create, 
    login, 
    findAllUsers, 
    findById, 
    update, 
    deleteUser,
    findSelfInfo,
    findAllStaffs,
    findStaffById,
    findAllBoxServicings,
    findBoxServicingById,
    findAllTransfer_allocation,
    findTransfer_allocationById,
    findAllBoxes,
    findBoxById,
    findAllCabinetset,
    findCabinetsetById,
    createCabinetSet,
    createBox,
    updateCabinetset,
    updateStaff,
    updateBox
}
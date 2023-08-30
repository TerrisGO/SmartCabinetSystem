import passport from 'passport';
import config from '../config/config';
import { allowOnly } from '../services/routesHelper';
import { create, login, findAllUsers, findById, update, deleteUser, findSelfInfo,
  findAllStaffs,findStaffById,findAllBoxServicings,findBoxServicingById,
  findAllTransfer_allocation,findTransfer_allocationById,findAllBoxes,findBoxById,
  findAllCabinetset,findCabinetsetById, createCabinetSet, createBox, 
  updateCabinetset, updateStaff, updateBox
} from '../controllers/admin';

module.exports = (app) => {
  /*/ create a new user
  app.post(
    '/api/admin/create',
    passport.authenticate('jwt', { session: false }),
    allowOnly(config.accessLevels.admin, create)
  );
*/
  app.post(
    '/api/admin/create',
    create
  );
  // user login
  app.post('/api/admin/login', login);

  //retrieve all users
  app.get(
    '/api/admin', 
    passport.authenticate("strategyAdmin", { 
      session: false 
    }),
    allowOnly(config.accessLevels.admin, findAllUsers)
  );

  // retrieve user by id
  app.get(
    '/api/admin/:userId',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, findById)
  );

  // update a user with id
  app.put(
    '/api/admin/update',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.user, update)
  );

  // delete a user
  app.delete(
    '/api/admin/:userId',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, deleteUser)
  );

    //retrieve self info by id
    app.get(
      '/api/adminselfinfo',
      passport.authenticate('jwt', {
        session: false,
      }),
       findSelfInfo
    );

    //list all staffs
  app.get(
    '/api/staff', 
    passport.authenticate("strategyAdmin", { 
      session: false 
    }),
    allowOnly(config.accessLevels.admin, findAllStaffs)
  );

 //find staff by id
  app.get(
    '/api/staff/:Id',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, findStaffById)
  );

  //list all boxservicing
  app.get(
    '/api/boxservicing', 
    passport.authenticate("strategyAdmin", { 
      session: false 
    }),
    allowOnly(config.accessLevels.admin, findAllBoxServicings)
  );

 //find boxservice by id
  app.get(
    '/api/boxservicing/:Id',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, findBoxServicingById)
  );

  //list all transfer allocation
  app.get(
    '/api/transfer_allocation', 
    passport.authenticate("strategyAdmin", { 
      session: false 
    }),
    allowOnly(config.accessLevels.admin, findAllTransfer_allocation)
  );

 //find transfer by id
  app.get(
    '/api/transfer_allocation/:Id',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, findTransfer_allocationById)
  );

    //list all boxes 
  app.get(
    '/api/boxes', 
    passport.authenticate("strategyAdmin", { 
      session: false 
    }),
    allowOnly(config.accessLevels.admin, findAllBoxes)
  );

     //find box by id
  app.get(
    '/api/box/:Id',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, findBoxById)
  );

  //list all cabinet set
  app.get(
    '/api/cabinet_set', 
    passport.authenticate("strategyAdmin", { 
      session: false 
    }),
    allowOnly(config.accessLevels.admin, findAllCabinetset)
  );

  //find cabinet by id
  app.get(
    '/api/cabinet_set/:userId',
    passport.authenticate("strategyAdmin", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, findCabinetsetById)
  );

    //Insert new cabinet set
    app.post(
      '/api/cabinet_set/create_cabinetset',
      passport.authenticate("strategyAdmin", {
        session: false,
      }),
      allowOnly(config.accessLevels.admin, createCabinetSet)
    );

    //Insert new boxes
    app.post(
      '/api/cabinet_set/createbox',
      passport.authenticate("strategyAdmin", {
        session: false,
      }),
      allowOnly(config.accessLevels.admin, createBox)
    );

    //Update cabinet set
    app.put(
      '/api/cabinet_set/update_cabinetset',
      passport.authenticate("strategyAdmin", {
        session: false,
      }),
      allowOnly(config.accessLevels.admin, updateCabinetset)
    );

    //Update staff
    app.put(
      '/api/cabinet_set/update_staff',
      passport.authenticate("strategyAdmin", {
        session: false,
      }),
      allowOnly(config.accessLevels.admin, updateStaff)
    );
    
    //Update boxes
    app.put(
      '/api/cabinet_set/update_box',
      passport.authenticate("strategyAdmin", {
        session: false,
      }),
      allowOnly(config.accessLevels.admin, updateBox)
    );

};

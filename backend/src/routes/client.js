import passport from 'passport';// authentication middleware for Node.js
import { login, findAllClient, niHao, 
          unlockforcustomerwithface, unlockforcustomer, unlockbeforetransfer, 
          unlockaftertransfer,testMail, box_itself_reserve, box_reserve_another_box,
          listofLocations,list_ALL_localCabinetboxess,list_of_faceFile_in_allocatedBox,
          list_of_boxess, list_of_targetCabinetboxess, list_of_localCabinetboxess,
          confirm_payment, cancel_reserved_box
} from '../controllers/client';//import all function from controllers/client.js

module.exports = (app) => {

  // user login
  app.post('/api/client/login', login);

  app.get(
    '/api/client/nihao', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    niHao
  );

  app.get(
    '/api/client/unlockforcustomer', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    unlockforcustomer//unlockforcustomer
  );

  app.get(
    '/api/client/unlockforcustomerusingface', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    unlockforcustomerwithface//unlockforcustomer with face label
  );

  app.get(
    '/api/client/unlockbeforetransfer', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    unlockbeforetransfer //unlock before transfer
  );

  app.get(
    '/api/client/unlockaftertransfer', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    unlockaftertransfer  //unlock after transfer
  );

  app.put(
    '/api/client/box_itself_reserve', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    box_itself_reserve//box_itself_reserve
  );

  app.put(
    '/api/client/box_reserve_another_box', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    box_reserve_another_box 
  );

  app.get(
    '/api/client/list_of_location', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    listofLocations//ist_of_location
  );

  app.get(
    '/api/client/list_all_localCabinetboxes', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    list_ALL_localCabinetboxess//list_of_ALL boxes_local
  );

  app.get(
    '/api/client/list_of_localCabinetboxes', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    list_of_localCabinetboxess//list_of_Empty boxes_local
  );

  app.get(//list_of_empty boxes_for target_destination
    '/api/client/list_of_targetCabinetboxes/:cabinetid', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    list_of_targetCabinetboxess//list_of_empty boxes_for target_destination
  );

  app.get(
    '/api/client/list_of_facefile_in_allocatedBox', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    list_of_faceFile_in_allocatedBox//  list of faceFile in allocatedBox
  );

  app.post(
    '/api/client/confirm_payment', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    confirm_payment
  );

  app.post(
    '/api/client/cancel_reserved_box', 
    passport.authenticate("strategyClient", { 
      session: false 
    }),
    cancel_reserved_box///cancel_reservedbox(s)
  );

};

var express = require('express');
var router = express.Router();
// require the Api caller which for talk to backend
let functionCallApi = require("./callApi");
const stripe = require('stripe')('sk_test_51IP2LaFPrxnNOZAiJx05S2eRifqNsRqp6NHCJc7TNlkW1h14FjiiyRbc4VreyGbFWcf8OdCInt7HWP0SMlx8ZRjs00UOeU1lu5');//keys.stripeSecretKey
const c_stripePublicKey =  'pk_test_51IP2LaFPrxnNOZAiXgSzQ7dedmEMY6frF0lmHxJ8XslPd1vO0Q6ds0ppmQrb2huZRpXRRYivEGj9Qn6BOg362sXG00oZ2bJmZL';
require('dotenv').config();
const clientName = process.env.CLIENTUSRM || 'home';
functionCallApi.callLogin();
var nrc = require('node-run-cmd'); // for running python command with cmd instantly

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {page:clientName, menuId:clientName});
});

//for ping test see wether server response
router.get('/callbackend', function(req, res, next) {
  let response = functionCallApi.callBackend();
  res.send(response);
});  

//4 Local storage select local box id
router.get('/local_store', function(req, res, next) {
  res.render('local_store', {page:'Local Storage', menuId:'l_s4'});
});

router.post('/local_store_selected', function(req, res, next) {
  var box_id = req.body.boxid;
  //res.send(box_id); callReserveLocalboxforLocalStore
  if (box_id !="undefined"){
    var svcType = "L_S";
    functionCallApi.callReserveLocalbox(res, box_id, svcType);
  }else{
    res.render('local_store', {page:'Local Storage', menuId:'l_s4'});
  }
});  

//4B Form to gather user email and phone, ask for unlock methods
router.get('/localstore_user_form', function(req, res, next) {
  res.render('localstore_user_form', {page:'User details', menuId:'l_s4b',
                                      rlocalboxid: '0',stripePublishableKey:'x'});
});

router.get('/transfstore_select_localbox', function(req, res, next) {
  res.render('transf_store', {page:'Select 1 available local box', menuId:'contact'});
});

router.post('/transfer_store_selected_localbox', function(req, res, next) {
  var box_id = req.body.boxid;
  console.log("boxid "+box_id);
  if (req.body.boxid !== undefined){
    var svcType = "T_S";
    functionCallApi.callReserveLocalbox(res, box_id, svcType);
  }else{
    res.render('transf_store', {page:'Select 1 available local box', menuId:'contact'});
  }
});  

router.get('/transfstore_select_localbox_list', function(req, res, next) {
  let results = functionCallApi.callRetrieveListOfBoxsLocal(res);
});

router.get('/transfstore_selectplace', function(req, res, next) {
  res.render('transfstore_selectplace', 
            {page:'Select 1 available destination to transfer', menuId:'contact',
             rlocalboxid:"Not supposed to be here (not reserving a local box yet)"});
});

router.post('/tranfer_store_selected_location', function(req, res, next) {
  var passedresvdLBox = (req.body.reserved_localboxid !== undefined) ?
                         req.body.reserved_localboxid : "x"; //req.body.reserved_localboxid;
  var passedlocationID = (req.body.select_location !== undefined) ?
                          req.body.select_location : "x";//req.body.select_location;
  var passedlocationname = (req.body.location_name !== undefined) ?
                            req.body.location_name : "x";//req.body.location_name;

  if (Object.keys(req.body).length !== 0 && Number(passedresvdLBox) && Number(passedlocationID)) {
    console.log("passedresvdLBox :"+passedresvdLBox+" passedlocationID :"+
                 passedlocationID+" passedlocationname :"+passedlocationname)
    res.render('transferstore_selecttargetbox', {page:'Select 1 Target box ID to reserve', 
               menuId:'contact', location_id: passedlocationID,
               location_name:passedlocationname, rlocalboxid:passedresvdLBox });
 }else{
  res.render('index', {page:clientName, menuId:clientName});
 }
});

router.get('/transfstore_selectplace_list', function(req, res, next) {
  let results = functionCallApi.callRetrieveListOfLocations(res);
});

router.get('/transfstore_select_targetbox', function(req, res, next) {
  res.render('transferstore_selecttargetbox', {page:'Select 1 Target box ID to allocate',
                                               menuId:'contact', rlocalboxid:'x',
                                               blocation_id:'x'});
});

router.get('/transfstore_select_targetbox_list/:cabid', function(req, res, next) {
  console.log("req.params.cabid"+req.params.cabid)
  let results = functionCallApi.callRetrieveListOfBoxsTarget(res, req.params.cabid);
});

///transfer_store_selected_targetbox
router.post('/transfer_store_selected_targetbox', function(req, res, next) {
  var passedresvdLBox = req.body.reserved_localboxid; //require for reserve target box
  var passedlocationID = req.body.location_id; //the location id
  var passedlocationname = req.body.location_name; // Just for the form to show the detail
  var passedresvdTBox = req.body.boxid; //require for reserve target box
  functionCallApi.callReserveTargetbox(res, passedresvdLBox, passedresvdTBox,
                                       passedlocationname, passedlocationID);
  console.log("passedresvdLBox: "+passedresvdLBox+ " passedlocationID: "+passedlocationID+
              " passedlocationname: "+passedlocationname+" passedresvdTBox: "+passedresvdTBox);
});

router.get('/transferstore_user_form', function(req, res, next) {
  res.render('transferstore_user_form', {page:'User details', menuId:'',
  location_name:'x', rlocalboxid:'x',targetbid:'x',stripePublishableKey:'x'});
});

/* Here are call for the page for chossing unlocking method with QR code or Face */
router.get('/selectboxtounlock', function(req, res, next) {
  res.render('select_boxunlock', {page:'Select Box to Unlock', menuId:'6'});
});

router.get('/selectboxtounlock_list', function(req, res, next) {
  functionCallApi.callRetrieveListALLBoxsLocal(res);
});

router.post('/selected_box_to_unlock', function(req, res, next) {
  var box_id = (req.body.boxid !== undefined) ? req.body.boxid : "";
  if (box_id !="undefined" && Number(box_id)){
    res.render('unlock', {page:'Choose an Unlocking Method', menuId:'',
                          selectedbid:box_id});
  }else{
    res.render('select_boxunlock', {page:'Select Box to Unlock', menuId:'6'});
  }
}); 

router.get('/unlock', function(req, res, next) {
  var box_id = (req.params.boxid !== undefined) ? req.params.boxid : "";
  res.render('unlock', {page:'Choose an Unlocking Method', menuId:'',selectedbid:box_id});
});

//call for unlocking with QR code read by running python OpenCV
router.post('/unlockingwithQR', function(req, res, next) {
  var boxID = (req.body.boxid !== undefined) ? req.body.boxid : "x"; 
  console.log("x : "+boxID);
  //define child process to run the python for gathering info from QR code
  if (req.body.boxid !== undefined && Number(boxID)){
    var pythonReturn = 'undefined'; 
    var spawn = require('child_process').spawn,
    py    = spawn('python', ['python/qr.py']);

    //here lines to kill python process after 40 seconds
    let st = new Date();
  
    var refreshIntervalId = setInterval(function () {
        let time = new Date() - st;
        // if time is over 40 secs, and the script has not been killed...
        if (time > 40000 && py.killed == false) {
            py.stdin.pause();
            py.kill();//kill the python
            py.stdin.end();
            console.log('child killed: '+py.killed);
            clearInterval(refreshIntervalId);
            killmeplease(res);
        }
    }, 1000);

    function killmeplease(res){
      console.log("loop killing");
      clearInterval(refreshIntervalId);
      res.render('unlock', {page:'Choose an Unlocking Method', 
                  menuId:'', popAlert:"True", selectedbid:boxID});
    }

    py.stdout.on('data', function(data){
      pythonReturn = data.toString();
      console.log("pythonReturn "+pythonReturn);

        if (pythonReturn != 'undefined'){
          var detectedQr = JSON.parse(pythonReturn);
          //console.log("sid :"+detectedQr.sid + " cqr :"+detectedQr.cqr);
          if(typeof detectedQr.sid !== 'undefined' && typeof detectedQr.cqr !== 'undefined'){
            var s_sid = detectedQr.sid; var s_cqr = detectedQr.cqr;
            functionCallApi.callUnlockForCustomer(res, s_sid, s_cqr, boxID);
          }
          
          if(typeof detectedQr.tid !== 'undefined' && typeof detectedQr.bqr !== 'undefined'){
            var s_tid = detectedQr.tid; var s_bqr = detectedQr.bqr;
            functionCallApi.callUnlockForBeforeTransfer(res, s_tid, s_bqr, boxID);
            console.log("running callUnlockForBeforeTransfer");
          }

          if(typeof detectedQr.tid !== 'undefined' && typeof detectedQr.aqr !== 'undefined'){
            var s_tid = detectedQr.tid; var s_aqr = detectedQr.aqr;
            functionCallApi.callUnlockForAfterTranfser(res, s_tid, s_aqr, boxID);
          }

          clearInterval(refreshIntervalId);
          console.log("Passing Qr String to server to check");
          //res.render('unlockingstatus', {page:'Unlocking status', menuId:'contact',selectedbid:boxID});   
        }
      });
  }else{
    res.render('index', {page:clientName, menuId:clientName});
  }
});

router.post('/unlockingwithFace', function(req, res, next) {//unlockingwithFace
  var boxID = (req.body.boxid !== undefined) ? req.body.boxid : "x"; 
  console.log("x : "+boxID);

  if (req.body.boxid !== undefined && Number(boxID)){
    var pythonReturn = 'undefined'; 
    var  exec  = require('child_process').execFile,
    py2    = py2 = exec('cmd',['/C', 'bat.bat'],{shell: false,
                                                 detached: true,
                                                 windowsHide: true});
    py2.on('uncaughtException', function (err) {
      console.log(err);
    });//exec('cmd',['/C', 'bat.bat']

    let st = new Date();//timer 
  
    var refreshIntervalId = setInterval(function () {
        let time = new Date() - st;
        // if time is over 120 secs, and the script has not been killed...
        if (time > 120000 && py2.killed == false) {
            py2.stdin.pause();
            py2.kill();//kill the python
            py2.stdin.end();
            console.log('child killed: '+py2.killed);
            clearInterval(refreshIntervalId);
            killmeplease(res);
        }

    }, 1000);

    function killmeplease(res){
      console.log("loop killing");
      clearInterval(refreshIntervalId);
      res.render('unlock', {page:'Choose an Unlocking Method', menuId:'',
                            popAlert:"True", selectedbid:boxID});
    }

    py2.stdout.on('data', function(data){
      pythonReturn = data.toString();
      console.log("pythonReturn "+pythonReturn);

        if (pythonReturn !== 'undefined'){

          clearInterval(refreshIntervalId);
          py2.stdin.pause();
          py2.kill();//kill the python
          py2.stdin.end();
          functionCallApi.callUnlockForCustomerWithFace(res, pythonReturn, boxID);
          console.log("Passing Face Label String>> "+ pythonReturn+ " <<to server to check");
        }
      });

  }else{
    res.render('index', {page:clientName, menuId:clientName});
  }
});

router.post('/start_facial_capture', function(req, res, next) {//capture user's face
  var boxID = (req.body.boxid !== undefined) ? req.body.boxid : "x"; 
  console.log("x : "+boxID);

  if (req.body.boxid !== undefined && Number(boxID)){
    var pythonReturn = 'undefined'; 
    var spawn = require('child_process').spawn,
    py3    = spawn('python', ['python/record_face.py']);

    let st = new Date();//timer
  
    var refreshIntervalId = setInterval(function () {
        let time = new Date() - st;
        // if time is over 120 secs, and the script has not been killed...
        if (time > 120000 && py3.killed == false) {
            py3.stdin.pause();
            py3.kill();//kill the python
            py3.stdin.end();
            console.log('child killed: '+py3.killed);
            clearInterval(refreshIntervalId);
            killmeplease(res);
        }
    }, 1000);

    function killmeplease(res){
      console.log("loop killing");
      clearInterval(refreshIntervalId);
      res.render('localstore_user_form', {page:'User details', menuId:'',
                                       rlocalboxid: boxID ,
                                       stripePublishableKey: c_stripePublicKey});
    }

    py3.stdout.on('data', function(data){
      pythonReturn = data.toString();
      //remove line break after reading string output
      var labelstrrmovelinebreak = pythonReturn.replace(/(\r\n|\n|\r)/gm, "");
      console.log("pythonReturn "+pythonReturn);

        if (pythonReturn !== 'undefined'){

          clearInterval(refreshIntervalId);
          console.log("Here's the Label String>> "+ labelstrrmovelinebreak + " ");
          //facerecFileName
          res.render('localstore_user_form', {page:'User details', menuId:'l_s4b',
           rlocalboxid: boxID ,stripePublishableKey: c_stripePublicKey,
           facerecFileName: labelstrrmovelinebreak});
        }
      });
  }else{
    res.render('index', {page:clientName, menuId:clientName});
  }
});

router.get('/unlocked', function(req, res, next) {
  res.render('unlockingstatus', {page:'Unlocking status', menuId:'contact'});
});

router.post('/paymentprocess', function(req, res, next){
  var c_email = (req.body.customerEmail !== undefined) ? req.body.customerEmail : "x"; 
  var c_phone = (req.body.customerPhone !== undefined) ? req.body.customerPhone : "x"; 
  var c_days = (req.body.numb_days !== undefined) ? req.body.numb_days : "0"; 
  var c_hrs = (req.body.numb_hours !== undefined) ? req.body.numb_hours : "1"; 
  var c_price = (req.body.hidden_price !== undefined) ? req.body.hidden_price : "1"; 
  var c_f_opt = (req.body.selectFaceRecog !== undefined) ? req.body.selectFaceRecog : "x"; 
  var c_lbid = (req.body.hidden_box1id !== undefined) ? req.body.hidden_box1id : "x"; 
  var c_tbid = (req.body.hidden_box2id!== undefined) ? req.body.hidden_box2id : ""; 
  var c_regfname = (req.body.face_recFilename !== undefined) ? req.body.face_recFilename : ""; 
  console.log("reqbody: "+JSON.stringify(req.body));
  console.log("c_email: "+c_email+" c_phone: "+ c_phone+" c_days: "+c_days+" c_hrs: "+c_hrs+" c_price: "+c_price+" c_f_op: "+c_f_opt+
  " c_lbid: "+c_lbid+" c_tbid: "+c_tbid+" c_regfname: "+c_regfname);

  var amount = 200; 
  
  if (Number(c_price)*100 >=amount){
    amount = Number(c_price)*100;
  }
  try{
    console.log("charging payment");
    stripe.customers.create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken
    })
    .then(customer => stripe.charges.create({
      amount,
      description: 'Payment to Smart Cabinet System',
      currency: 'myr',
      customer: customer.id
    }))
    .then(charge  => 
      functionCallApi.callInsertBox_servAfterPayment(res,c_email,c_phone,c_days,c_hrs,
                                                     c_price,c_f_opt,c_lbid,c_tbid,
                                                     c_regfname));
  console.log("paid creating record");
  } catch(e) {
    console.log(e);
  }
});

router.post('/cancel_reserved_box', function(req, res, next) {
  var boxID1 = (req.body.hidden_box1id4cancel !== undefined) ?
                req.body.hidden_box1id4cancel : "";
  var boxID2 = (req.body.hidden_box2id4cancel !== undefined) ? 
                req.body.hidden_box2id4cancel : "";

  functionCallApi.callforCancelReservedbox(boxID1,boxID2);
  functionCallApi.cleaningTempFaceFile();
  res.render('index', {page:clientName, menuId:clientName});
});

router.get('/faq', function (req, res)
{
    res.render('faq.html');
});

module.exports = router;

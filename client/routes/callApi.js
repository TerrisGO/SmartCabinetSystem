const request = require('request');     //for requesting the backend
var http = require('http');             //for http response
var requestify = require('requestify'); //for requesting the backend
var fs = require('fs');                 //file-system.
var ncp = require("ncp");               //Asynchronous recursive file & directory copying
const del = require('del');             // for deleting all files (with or without pattern of name)
var nrc = require('node-run-cmd');      // for running python command with cmd instantly
var isJSON = require('is-json');        // check whether format is belongs to JSON
const c_stripePublicKey =  'pk_test_51IP2LaFPrxnNOZAiXgSzQ7dedmEMY6frF0lmHxJ8XslPd1vO0Q6ds0ppmQrb2huZRpXRRYivEGj9Qn6BOg362sXG00oZ2bJmZL';
require('dotenv').config();             // Require to read .env file
const clientName = process.env.CLIENTUSRM || 'home';
const host = "http://localhost:4000";
var tokencache = "";
var startsWith = require('string.prototype.startswith');
  /* taking the token string save it into the environment variable
  {
      "success": true,
      "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYWJpbmV0X2lkIjoxLCJsb2NhdGlvbl9uYW1lIjoiUGVuYW5nIEFpciBQb3J0IiwiaWF0IjoxNjEzNTM4NTEwLCJleHAiOjE2MTM1NDIxMTB9.JKBr98eQ6TVFta2Z8Nfx1FSwlOWh8FctYbUGe_LcfWQ",
      "address": " Lapangan Terbang Antarabangsa Penang, 11900 Bayan Lepas, Pulau Pinang, Malaysia"
  }; Extract the token*/
function extractToken(bodyretrunedAfterlogin){
  var xcopyObj = "";
  var obj1 = bodyretrunedAfterlogin;
  //console.log("Type of Obj1 "+typeof(obj1));
  xcopyObj = obj1.token;
  //console.log("xcopyObj value: "+xcopyObj);

  var currenttoken = "";
  if (xcopyObj.startsWith("Bearer ")){ //substring(1, 7) == "Bearer ".startsWith("Bearer ")<< previously //having technique error suddently
      currenttoken = xcopyObj.substring(7, xcopyObj.length);
      //process.env['CLIENTOKEN'] = currenttoken;
      
      const clientusrm = process.env.CLIENTUSRM;
      const clientpass = process.env.CLIENTPASS;
      tokencache = currenttoken;
      updateToken = "CLIENTUSRM="+clientusrm+"\r\n"+
                    "CLIENTPASS="+clientpass+"\r\n"+
                    "CLIENTOKEN="+currenttoken;
      fs.writeFile('.env', updateToken, function (err) {
          if (err) throw err;
      });
      callBackend();
  } else {
  return null;
  console.log("Not a legit bearer token format");
  }
}

//pinging the backend 
function callBackend(){
  var url = host+'/api/client/nihao';
  var data = "";
  let copyresponse;
  requestify.get(url, {
      method: 'GET',
      body: data,
      dataType: 'json',
      headers :{
          Authorization:"Bearer " + tokencache // token
      }
  },{
      timeout: 20000
  })
  .then(function(response) {
      // Get the response body (JSON parsed or jQuery object for XMLs)
      var responsee = response.getBody();
      copyresponse = JSON.stringify(responsee);
      console.log("responsee > "+ JSON.stringify(responsee));
      if (copyresponse.includes("ni hao ma:")){
          console.log("Yes reponsed");
          return "responsed";
      }else{console.log("No reponsed"); }
      // Get the raw response body ni hao ma1
      tokencache = process.env.CLIENTOKEN++;
      //response.body;
      //return "no response";
  }).catch(function(error) {
      next(error); 
  });
}

// calling backend to Login
function callLogin(){ 
  var url = host+"/api/client/login";
  let copyresponse;
  let oginObj={
      "location_name": process.env.CLIENTUSRM,
      "password": process.env.CLIENTPASS
  };
  var options = {
      'method': 'POST',
      'url': url,
      'headers': {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(oginObj)
    };
    try{
        request(options, function (error, response) {
        if (error) throw error;
            console.log(response.body);
            copyresponse = JSON.parse(response.body);
            extractToken(copyresponse);console.log("copyresponse: "+ copyresponse);
        });
    } catch (error) {
    Rollbar.error("Something went wrong", error);
    return
  }
  process.on('uncaughtException', (error) => {
    console.log(`Caught exception: ${error}`);
  });
}

//Retrieve list of other location that having the cabinet set service cover
//for transferrring purpose
function callRetrieveListOfLocations(respass){
  var url = host+'/api/client/list_of_location';
  var data = "";
  let copyresponse;
  var tokenn = tokencache;
  requestify.get(url, {
      method: 'GET',
      body: data,
      dataType: 'json',
      headers :{
          Authorization:"Bearer " + tokenn // token
      }
  },{
      timeout: 20000
  })
  .then(function(response) {
      // Get the response body (JSON parsed or jQuery object for XMLs)
      var responsee = response.getBody();
      copyresponse = JSON.stringify(responsee);
      console.log("responsee > "+ JSON.stringify(responsee));
      if (copyresponse.includes("cabinet_id")){
          console.log("Retrieved list of locations ");
      }else{console.log("No reponsed for calling /api/client/list_of_location");}
      var trimmed = findsubstr(copyresponse);
      console.log("trimmed output: "+trimmed)
      //var jsontrimmed = Json.parse(trimmed);
      // Get the raw response body ni hao ma1
      response.body;
      console.log("trimmed"+isJSON(trimmed));
      respass.send(trimmed);
  }, function(error) {
      var errorMessage = "Post Failed";
      if(error.code && error.body)
          errorMessage += " - " + error.code + ": " + error.body
      console.log(errorMessage);
      // dump the full object to see if you can formulate a better error message.
      console.log(error);
  });
}

//list of current (local)cabinet all Empty boxes which not under Reserved or Allocated state
function callRetrieveListOfBoxsLocal(respass){
    var url = host+'/api/client/list_of_localCabinetboxes';
    var data = "";
    let copyresponse;
    var tokenn = tokencache;
    requestify.get(url, {
        method: 'GET',
        body: data,
        dataType: 'json',
        headers :{
            Authorization:"Bearer " + tokenn // token
        }
    },{
        timeout: 20000
    })
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        var responsee = response.getBody();
        copyresponse = JSON.stringify(responsee);
        console.log("responsee > "+ JSON.stringify(responsee));
        if (copyresponse.includes("box_id")){
            console.log("Retrieved list of empty boxes(current cabinet) ");
        }else{console.log("No expected reponsed for calling /api/client/list_of_localCabinetboxes");}
        var trimmed = findsubstr(copyresponse);
        console.log("trimmed output: "+trimmed)
        //var jsontrimmed = Json.parse(trimmed);
        // Get the raw response body ni hao ma1
        response.body;
        console.log("trimmed"+isJSON(trimmed));
        respass.send(trimmed);
    }, function(error) {
        var errorMessage = "Post Failed";
        if(error.code && error.body)
            errorMessage += " - " + error.code + ": " + error.body
        console.log(errorMessage);
        // dump the full object to see if you can formulate a better error message.
        console.log(error);
    });
  }

  //retrieve the selected (target)location cabinet set' boxes IDs
  function callRetrieveListOfBoxsTarget(respass, cabid){
    var cap = cabid;
    var url = host+'/api/client/list_of_targetCabinetboxes/'+cap;
    var data = "";
    let copyresponse;
    var tokenn = tokencache;
    requestify.get(url, {
        method: 'GET',
        body: data,
        dataType: 'json',
        headers :{
            Authorization:"Bearer " + tokenn // token
        }
    },{
        timeout: 20000
    })
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        var responsee = response.getBody();
        copyresponse = JSON.stringify(responsee);
        console.log("responsee > "+ JSON.stringify(responsee));
        if (copyresponse.includes("box_id")){
            console.log("Retrieved list of empty boxes(current cabinet) ");
        }else{console.log("No expected reponsed for calling /api/client/list_of_localCabinetboxes");}
        var trimmed = findsubstr(copyresponse);
        console.log("trimmed output: "+trimmed)
        //var jsontrimmed = Json.parse(trimmed);
        // Get the raw response
        response.body;
        console.log("trimmed"+isJSON(trimmed));
        respass.send(trimmed);
    }, function(error) {
        var errorMessage = "Post Failed";
        if(error.code && error.body)
            errorMessage += " - " + error.code + ": " + error.body
        console.log(errorMessage);
        // dump the full object to see if you can formulate a better error message.
        console.log(error);
    });
  }

  // retrieve the list of current cabinet set of all boxes
  function callRetrieveListALLBoxsLocal(respass){
    var url = host+'/api/client/list_all_localCabinetboxes';
    var data = "";
    let copyresponse;
    var tokenn = tokencache;
    requestify.get(url, {
        method: 'GET',
        body: data,
        dataType: 'json',
        headers :{
            Authorization:"Bearer " + tokenn // token
        }
    },{
        timeout: 20000
    })
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        var responsee = response.getBody();
        copyresponse = JSON.stringify(responsee);
        var trimmed ="";
        console.log("responsee > "+ JSON.stringify(responsee));
        if (copyresponse.includes("box_id")){
            console.log("Retrieved list of empty boxes(current cabinet) ");
            trimmed = findsubstr(copyresponse);
        }else{console.log("No expected reponsed for calling /selectboxtounlock_list");}
        response.body;
        console.log("trimmed output: "+trimmed)
        console.log("trimmed"+isJSON(trimmed));
        respass.send(trimmed);
    }, function(error) {
        var errorMessage = "Post Failed";
        if(error.code && error.body)
            errorMessage += " - " + error.code + ": " + error.body
        console.log(errorMessage);
        // dump the full object to see if you can formulate a better error message.
        console.log(error);
    });
  }

  // reserving the current cabinet' box
  function callReserveLocalbox(respass, boxid, serviceType){
    var url = host+'/api/client/box_itself_reserve';
    var data=boxid;
    console.log("boxid : "+boxid);
    let copyresponse;
    var tokenn = tokencache;
    requestify.request(url, {
        method: 'PUT',
        body: {
            box_id: data
        },
        dataType: 'json',
        headers :{
            'Content-Type': 'application/json',
            Authorization:"Bearer " + tokenn // token
        }
    },{
        timeout: 20000
    })
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        var responsee = response.getBody();
        copyresponse = JSON.stringify(responsee);
        console.log("serviceType= "+serviceType);
        console.log("responsee > "+ JSON.stringify(responsee));
        if (serviceType == "L_S"){
            if (copyresponse.includes("Reserved")){
                console.log("Reserved selected box id");//keys.stripePublishableKey
                respass.render('localstore_user_form', {page:'User details', menuId:'l_s4b',
                 rlocalboxid: boxid ,stripePublishableKey: c_stripePublicKey});
            }else{
                respass.render('local_store', {page:'Local Storage', menuId:'l_s4'});
                //need to add error msg later
                console.log("No expected reponsed for callReserveLocalboxforLocalStore");}
        }else if(serviceType == "T_S"){
            if (copyresponse.includes("Reserved")){
                console.log("reserved local box for transfer purpose");
                respass.render('transfstore_selectplace', 
                                {page:'Select 1 available destination to transfer',
                                menuId:'contact', rlocalboxid: boxid});
            }else{
                respass.render('transf_store', {page:'Select 1 available local box',
                                 menuId:'contact'});
                //need to add error msg later
                console.log("No expected reponsed for callReserveLocalboxforLocalStore");}
        }else{
            respass.render('index', {page:clientName, menuId:clientName});
        }    
        response.body;
        console.log("response.body: "+copyresponse)
    }, function(error) {
        var errorMessage = "Post Failed";
        if(error.code && error.body)
            errorMessage += " - " + error.code + ": " + error.body
        console.log(errorMessage);
        // dump the full object to see if you can formulate a better error message.
        console.log(error);
    });
  }

  //For trasnfering service, reserve available target location box
  function callReserveTargetbox(respass, rlocalbox, rtargetbox, targetlocationName, locationID){
    var url = host+'/api/client/box_reserve_another_box';
    let copyresponse;
    var tokenn = tokencache;
    requestify.request(url, {
        method: 'PUT',
        body: {
            localbid: rlocalbox,
            targetbid: rtargetbox
        },
        dataType: 'json',
        headers :{
            'Content-Type': 'application/json',
            Authorization:"Bearer " + tokenn // token
        }
    },{
        timeout: 20000
    })
    .then(function(response) {
        // Get the response body (JSON parsed or jQuery object for XMLs)
        var responsee = response.getBody();
        copyresponse = JSON.stringify(responsee);
        console.log("responsee > "+ JSON.stringify(responsee));
  
        if (copyresponse.includes("Reserved")){
            console.log("Reserved selected box id");
            respass.render('transferstore_user_form', {page:'User details',
                            menuId:'contact',location_name:targetlocationName, 
                            rlocalboxid:rlocalbox,targetbid:rtargetbox,
                            stripePublishableKey: c_stripePublicKey});
        }else{
            respass.render('transferstore_selecttargetbox', 
                            {page:'Select 1 Target box ID to reserve', 
                            menuId:'contact', location_id: locationID,
                            location_name:targetlocationName, rlocalboxid:rlocalbox });
            //need to add error msg later
            console.log("No expected reponsed for callReserveTargetbox");}
      
        response.body;
        console.log("response.body: "+copyresponse)
    }, function(error) {
        var errorMessage = "Post Failed";
        if(error.code && error.body)
            errorMessage += " - " + error.code + ": " + error.body
        console.log(errorMessage);
        // dump the full object to see if you can formulate a better error message.
        console.log(error);
    });
    //console.log("callReserveTargetbox running");
  }

  //customer use to unlock the box with QR code
  function callUnlockForCustomer(respass, svcID, qrString, boxid){
    //console.log("respass "+ respass+ " svcID "+ svcID+ " qrString "+ qrString + " boxid "+ boxid  );
    var url = host+"/api/client/unlockforcustomer";
    let copyresponse; let data = "";
    let oginObj={
        "serviceId": svcID,
        "boxId": boxid,
        "customerQr": qrString
    };
    var options = {
        'method': 'GET',
        'url': url,
        'headers': {
          'Content-Type': 'application/json',
           Authorization:"Bearer " + tokencache // token
        },
        body: JSON.stringify(oginObj),
        timeout: 10000
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        copyresponse = JSON.parse(response.body);
        copyresponse_STR = JSON.stringify(copyresponse);

        if (copyresponse_STR.includes("boxid") && copyresponse_STR.includes("yes")
            && copyresponse.boxid ==boxid){
            console.log("Sent unlocked message >boxid:"+copyresponse.boxid);
            respass.render('unlockingstatus', {page:'Unlocking status',
                          menuId:'contact',selectedbid:copyresponse.boxid,
                          failed:"success" });   
        }else{
            console.log("No expected reponsed for calling /selectboxtounlock_list");
            respass.render('unlockingstatus', {page:'Unlocking status',
                             menuId:'contact',selectedbid:boxid, failed:"false" });
        }
      });
  }

  //unlocking the box by checking the face recognition result label with the server
  function callUnlockForCustomerWithFace(respass, labelstring, boxid){
    //console.log("respass "+ respass+ " svcID "+ svcID+ " qrString "+ qrString + " boxid "+ boxid  );
    var url = host+"/api/client/unlockforcustomerusingface";
    let copyresponse; let data = "";
    console.log("labelString: " +labelstring);
    let oginObj={
        "boxId": boxid,
        "labelString": labelstring
    };
    var options = {
        'method': 'GET',
        'url': url,
        'headers': {
          'Content-Type': 'application/json',
           Authorization:"Bearer " + tokencache // token
        },
        body: JSON.stringify(oginObj),
        timeout: 10000
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        copyresponse = JSON.parse(response.body);
        copyresponse_STR = JSON.stringify(copyresponse);

        if (copyresponse_STR.includes("boxid") && copyresponse_STR.includes("yes")
            && copyresponse.boxid ==boxid){
            console.log("Sent unlocked message >boxid:"+copyresponse.boxid);
            respass.render('unlockingstatus', {page:'Unlocking status', menuId:'contact',
                            selectedbid:copyresponse.boxid, failed:"success" });   
        }else{
            console.log("No expected reponsed for calling /selectboxtounlock_list");
            respass.render('unlockingstatus', {page:'Unlocking status', menuId:'contact',
                            selectedbid:boxid, failed:"false" });
        }
      });
  }

  //after staff gathered new task , able to do pick up by unlocking the box
  function callUnlockForBeforeTransfer(respass, tranfID, beforeqrString, boxid){
    console.log("respass "+ respass+ " tranfID "+ tranfID+ " qrString "+
                 beforeqrString + " boxid "+ boxid  );
    var url = host+"/api/client/unlockbeforetransfer";
    let copyresponse; let data = "";
    try {
        let oginObj={
            "tid": tranfID,
            "bqr": beforeqrString,
            "bid": boxid
        };
        var options = {
            'method': 'GET',
            'url': url,
            'headers': {
              'Content-Type': 'application/json',
               Authorization:"Bearer " + tokencache // token
            },
            body: JSON.stringify(oginObj),
            timeout: 20000
          };
          request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            copyresponse = JSON.parse(response.body);
            copyresponse_STR = JSON.stringify(copyresponse);
    
            if (copyresponse_STR.includes("boxid") && copyresponse_STR.includes("yes")
                && copyresponse.boxid ==boxid){
                console.log("Sent unlocked message >boxid:"+copyresponse.boxid);
                respass.render('unlockingstatus', {page:'Unlocking status', menuId:'contact',
                                selectedbid:copyresponse.boxid, failed:"success" });   
            }else{
                console.log("No expected reponsed for calling /selectboxtounlock_list");
                respass.render('unlockingstatus', {page:'Unlocking status',
                                 menuId:'contact',selectedbid:boxid, failed:"false" });
            }
          });
    } catch(error) { 
        respass.render('unlockingstatus', {page:'Unlocking status', menuId:'contact',
                        selectedbid:boxid, failed:"false" });
    }
  }

  // for staff to scan after taken the props from the first cabinet box(source location)
  // which scaned the QR with first box ID
  function callUnlockForAfterTranfser(respass, trasnfID, afterqrString, boxid){
    //console.log("respass "+ respass+ " svcID "+ svcID+ " qrString "+ qrString + " boxid "+ boxid  );
    var url = host+"/api/client/unlockaftertransfer";
    let copyresponse; let data = "";
    let oginObj={
        "tid": trasnfID,
        "bid": boxid,
        "aqr": afterqrString
    };
    var options = {
        'method': 'GET',
        'url': url,
        'headers': {
          'Content-Type': 'application/json',
           Authorization:"Bearer " + tokencache // token
        },
        body: JSON.stringify(oginObj),
        timeout: 10000
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        copyresponse = JSON.parse(response.body);
        copyresponse_STR = JSON.stringify(copyresponse);

        if (copyresponse_STR.includes("boxid") && copyresponse_STR.includes("yes")
            && copyresponse.boxid ==boxid){
            console.log("Sent unlocked message >boxid:"+copyresponse.boxid);
            respass.render('unlockingstatus', {page:'Unlocking status', menuId:'contact',
                            selectedbid:copyresponse.boxid, failed:"success" });   
        }else{
            console.log("No expected reponsed for calling /selectboxtounlock_list");
            respass.render('unlockingstatus', {page:'Unlocking status', menuId:'contact',
                            selectedbid:boxid, failed:"false" });
        }
      });
  }

  //after payment succeed make a new record in box servicing by calling the api
  function callInsertBox_servAfterPayment(respass,c_email,c_phone,c_days,c_hrs,c_price,
                                                    c_f_opt,c_lbid,c_tbid,c_regfname){
    console.log("call back end create record");
    var xx= "";
    let copyresponse;
    var tokenn = tokencache;
    var url = host+"/api/client/confirm_payment";
    var serv_type = "L_S";
    var fs_qr = "QR";
    if (c_tbid !==""){
        serv_type = "T_S";
    }
    if (c_tbid =="" && c_regfname !==""){
        fs_qr  = "FnQR";
    }

    try {
        let oginObj={
            "customerEmail": c_email,
            "customerPhone":c_phone,
            "storingDay":c_days,
            "storingHours":c_hrs, 
            "payAmount":c_price,
            "localBid":c_lbid,
            "targetBid":c_tbid,
            "serviceType":serv_type,
            "faceScannQr":fs_qr,
            "face_recFilename": c_regfname
        };
        var options = {
            'method': 'POST',
            'url': url,
            'headers': {
              'Content-Type': 'application/json',
               Authorization:"Bearer " + tokencache // token
            },
            body: JSON.stringify(oginObj),
            timeout: 40000
          };
          request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            copyresponse = JSON.parse(response.body);
            copyresponse_STR = JSON.stringify(copyresponse);
            console.log("Sent unlocked message >boxid:"+copyresponse.boxid);
            if (copyresponse_STR.includes("boxid") && copyresponse_STR.includes("yes")
                && copyresponse.boxid ==c_lbid){
                if (copyresponse.trainFace =="yes"){
                        //going to train the face recognition, before that will
                        // require to prepare the files and also have some cleaning
                        // on the directory(delete irrelavant files on folder)  
                        moveFaceFilefromTemptoRealDataset();   
                        respass.render('unlockingstatus', {page:'Unlocking status',
                                        menuId:'contact',selectedbid:copyresponse.boxid,
                                        failed:"success", showPaymentStatus:"Yes" }); 
                }else{
                    console.log("Not going to train the face file");
                    respass.render('unlockingstatus', {page:'Unlocking status',
                                    menuId:'contact',selectedbid:copyresponse.boxid,
                                    failed:"success", showPaymentStatus:"Yes" }); 
                }      
            }else{
                console.log("No expected reponsed for calling /selectboxtounlock_list");
                respass.render('unlockingstatus', {page:'Unlocking status',
                                menuId:'contact',selectedbid:c_lbid,
                                failed:"false", showPaymentStatus:"no"});
            }
          });
    } catch(error) { 
        respass.render('unlockingstatus', {page:'Unlocking status',
                        menuId:'contact',selectedbid:boxid, failed:"false" });
    }
    //console.log("callReserveTargetbox running");
  }

  //function call to cancel the reserved box(s)
  function callforCancelReservedbox(c_lbid,c_tbid){
    var url = host+"/api/client/cancel_reserved_box";
    if (Number(c_lbid) || Number(c_tbid)){
        try {
            let oginObj={
                "localboxID":c_lbid,
                "targetboxID":c_tbid
            };
            var options = {
                'method': 'POST',
                'url': url,
                'headers': {
                'Content-Type': 'application/json',
                Authorization:"Bearer " + tokencache // token
                },
                body: JSON.stringify(oginObj),
                timeout: 20000
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                copyresponse = JSON.parse(response.body);
                copyresponse_STR = JSON.stringify(copyresponse);
                return true;
            });
        } catch(error) { 
            console.log("Some error during calling api cancel reserved box");
            return true;
        }
    }else{
        return true;
    }
    //console.log("callReserveTargetbox running");
  }

//move the new gathered face files to the dataset file prepare to train
function moveFaceFilefromTemptoRealDataset(){
    const srcDir = 'python/temp_dataset';
    const destDir = 'python/dataset'; 
  
    if (fs.existsSync(srcDir) && fs.existsSync(destDir)) {
        console.log("Temp and dataset folder Exist");
        try {
            ncp(srcDir , destDir ,  
            function (err) { 
            if (err) { 
                return console.error(err); 
            }else{
                console.log('Folders copied recursively');
                del.sync([srcDir+'/**']);
               //delete all files after copied to the real dataset file
                retriveAvailableFaceFilenameFromAllocatedBox();
                console.log("source files is deleted.");
            } 
        }); 
      } catch (error) {
          console.log(error);
      }
    }else{  console.log("error during copying files from temp_dataset to dataset");}
    console.log('yeas'); 
}

//function to retrive the files name for facial recognition
function retriveAvailableFaceFilenameFromAllocatedBox(){
    var url = host+'/api/client/list_of_facefile_in_allocatedBox';
    var data = "";
    let copyresponse;
    var tokenn = tokencache;
    requestify.get(url, {
        method: 'GET',
        body: data,
        dataType: 'json',
        headers :{
            Authorization:"Bearer " + tokenn // token
        }
    },{
        timeout: 20000
    })
    .then(function(response) {
        //the directory that dataset of faces to save
        var pathdataset_face = "python/dataset/";
        var responsee = response.getBody();
        var copyresponse_STR = JSON.stringify(responsee);
        // debug console.log("responsee: "+JSON.stringify(responsee));
        if (copyresponse_STR.includes("facereg_filename")){
            var newArray = []; // array to save list of filenames for prepare to delete
            var arraytoMatch =[];//array to save filenames to excluded from delete

            //for loop to generate the filename that want to preserve
            for (var i = 0; i < responsee.length; i++) {
                for (key in responsee[i]) {
                    console.log('Key: '+ key + ' Value: ' + responsee[i][key]);
                    for(let step = 1; step < 22; step++){
                        arraytoMatch.push(responsee[i][key]+[step]+".jpg");
                    }
                    //newArray.push("!"+pathdataset_face+responsee[i][key]+"*");
                }
            }
            
            console.log(newArray.toString());
            // acquire all files name in the 'dataset' folder
            var allfilesarray = fs.readdirSync(pathdataset_face, {withFileTypes: true})
            .filter(item => !item.isDirectory())
            .map(item => item.name)
            console.log(allfilesarray.toString()+"\n");
            console.log(arraytoMatch.toString()+"\n");
            // compare two array, 
            //then only preserve the files name that require to delete
            var myfilteredArray = allfilesarray.filter((item) => !arraytoMatch.includes(item));
            console.log(myfilteredArray.toString()+"\n");

            for (key in myfilteredArray) {
                //console.log('Key: '+ key + ' Value: ' + myfilteredArray[key]);
                newArray.push(pathdataset_face+myfilteredArray[key]);
            }//add directory string to the filename and prepare to delete
            
            newArray.push("!"+pathdataset_face); //save the path to excluding the file itself
            console.log(newArray.toString()+"\n");
            irrelevant_files_delete(newArray); //call function to delete irrelevant files
        }else{
            console.log("Something went worng during retriveAvailableFaceFilenameFromAllocatedBox");
        }
    }, function(error) {
        var errorMessage = "Post Failed";
        if(error.code && error.body)
            errorMessage += " - " + error.code + ": " + error.body
        console.log(errorMessage);
        // dump the full object to see if you can formulate a better error message.
        console.log(error);
    });
}

//delete all irrelevants files before training the face recognition
function irrelevant_files_delete(array){
    var pathdataset_face = "python/dataset";
    if (fs.existsSync(pathdataset_face)) {
        console.log("Exist");
        try {
            del.sync(array);
            console.log("source Files is deleted.");
            trainFaceRecog();
        } catch (error) {
            console.log(error);
        }  
    }
}

//call up the python to run the trainning process for facial recognition
async function trainFaceRecog(){
    console.log("calling the train");
    nrc.run('python python/trainer.py');
}
  
//use to remove {"rows":[{ } for the responsed Json
  function findsubstr(str) { 
    var start = 8; 
    var end = str.length-1; 
    var index = str.slice(start, end); 
    return index;
    //console.log("trimm process"+index); 
  } 
  // --------------------------------------------------

  //function to remove all face image files in temp
  function cleaningTempFaceFile(){
    var pathdataset_face = "python/temp_dataset";
    if (fs.existsSync(pathdataset_face)) {
        //console.log("File Exist");
        try {
          //fs.unlinkSync(pathdataset_face);
          del.sync([pathdataset_face+'/**']);
          console.log("Files in tempdata is deleted.");
      } catch (error) {
          console.log(error);
      }
    }
  } 
  
  module.exports = {
    callBackend,
    callLogin,
    callRetrieveListALLBoxsLocal,
    callRetrieveListOfLocations,
    callRetrieveListOfBoxsLocal,
    callRetrieveListOfBoxsTarget,
    callReserveLocalbox,
    callReserveTargetbox,
    callUnlockForCustomer,
    callUnlockForCustomerWithFace,
    callUnlockForAfterTranfser,
    callUnlockForBeforeTransfer,
    callInsertBox_servAfterPayment,
    callforCancelReservedbox,
    cleaningTempFaceFile
    //trainFaceRecog,
    //retriveAvailableFaceFilenameFromAllocatedBox
  };
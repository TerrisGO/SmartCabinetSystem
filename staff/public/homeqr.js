
var qrcode = new QRCode(document.getElementById("qrcode"), {
	width : 100,
	height : 100,
	id:"QR_code1"
});

var qrcode2 = new QRCode(document.getElementById("qrcode2"), {
	width : 100,
	height : 100,
	id:"QR_code2"
});

    

function makeCode () {		
	var elText = document.getElementById("text");
	var elText2 = document.getElementById("text2");
	if (!elText.value || !elText2.value) {
		alert("Input a text");
		//elText.focus();
		return;
	}

	
	if (elText.value =="None" && elText2.value =="None"){
		var img1 = document.getElementById("QR_code1");
		img1.src="https://cdn2.iconfinder.com/data/icons/check-code/100/7-512.png";
		img1.style="display: block; bottom: 160px;";
		var img2 = document.getElementById("QR_code2");
		img2.src="https://cdn2.iconfinder.com/data/icons/check-code/100/7-512.png";
		img2.style="display: block; bottom: 160px;";
	}else{
		qrcode.makeCode(elText.value);
		qrcode2.makeCode(elText2.value);
	}
	
}

$("img").attr("src", "https://cdn2.iconfinder.com/data/icons/check-code/100/7-512.png");
$("#text").
	on("blur", function () {
		makeCode();
	}).
	on("keydown", function (e) {
		if (e.keyCode == 13) {
			makeCode();
		}
	});
$("#text2").
	on("blur", function () {
		makeCode();
	}).
	on("keydown", function (e) {
		if (e.keyCode == 13) {
			makeCode();
		}
	});	

makeCode();
var imglogo = document.getElementById("logo");
imglogo.src="scmlogo.png";



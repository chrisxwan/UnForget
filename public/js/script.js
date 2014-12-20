var images = ['bg.jpg', 'bg3.jpg', 'bg2.jpg'];
console.log("working!");
$(document).ready(function() {
	$('.header').css({'background': 'url(../img/' + images[Math.floor(Math.random() * images.length)] + ') no-repeat center center fixed'});
});
console.log("working again lol");
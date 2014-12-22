var images = ['bg.jpg'];
console.log("working!");
$(document).ready(function() {
	$('.header').scroll(function(){
		var opac = $('.header').scrollTop() / ($('.header').height() - 100);
		$('.header').css({'background': '-webkit-linear-gradient(rgba(255,255,255,' + opac + '),rgba(255,255,255,' + opac + ')), url(../img/bg.jpg)'});
		$('.header').css({'background': 'linear-gradient(rgba(255,255,255,' + opac + '),rgba(255,255,255,' + opac + ')), url(../img/bg.jpg)','background-repeat':'no-repeat','background-size':'contain'});
});
});
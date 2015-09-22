var buttons = 42;
var dankmemes = 15;

function dank() {
	while (true) {
		alert('node.js is the only real infinite loop');
	}
}

document.addEventListener('DOMContentLoaded', function () {
	document.body.style.overflow = 'hidden';
	document.body.style['background-image'] = 'url("http://ih0.redbubble.net/image.53589207.4056/flat,800x800,075,t.u1.jpg")';
	document.body.style['background-size'] = 'contain';

	var buttonStrings = ['free memes', '3dank5me', 'click me m8', 'uw0t', 'node.js', 'trump 2016', 'hh memes', 'kannan for president', '#clockgate'];
	var marqueeStrings = ['DANK MEMES', 'JET FUEL CAN\'T MELT STEEL BEAMS', 'DON\'T LET YOUR MEMES BE DREAMS', 'BUSH DID 9/11', 'YO DEAR ISAIAH'];
	var directions = ['left', 'right', 'up', 'down'];
	
	for (var i = 0; i < buttons; i++) {
		var button = document.createElement('button');
		button.appendChild(document.createTextNode(buttonStrings[Math.floor(Math.random()*buttonStrings.length)]));
		var domButton = document.body.appendChild(button);
		domButton.setAttribute('onclick', 'dank()');
		domButton.style.position = 'absolute';
		domButton.style.top = Math.floor(Math.random()*window.innerHeight - domButton.offsetHeight);
		domButton.style.left= Math.floor(Math.random()*window.innerWidth - domButton.offsetWidth);
	}

	for (var i = 0; i < dankmemes; i++) {
		var marquee = document.createElement('marquee');
		marquee.appendChild(document.createTextNode(marqueeStrings[Math.floor(Math.random()*marqueeStrings.length)]));
		var domMarquee = document.body.appendChild(marquee);
		domMarquee.setAttribute('direction', directions[Math.floor(Math.random()*directions.length)]);
		domMarquee.setAttribute('scrollAmount', Math.random()*13 + 5);
		domMarquee.setAttribute('height', Math.random()*100 + 100);
		domMarquee.setAttribute('width', Math.random()*100 + 100);
		domMarquee.setAttribute('vspace', Math.random()*200);
		domMarquee.setAttribute('hspace', Math.random()*200);
	}
});